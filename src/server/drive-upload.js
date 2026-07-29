/* ============================================================================
   drive-upload.js — GovernX Remotion Server
   Uploads rendered MP4 files directly to Google Drive
   Uses a Service Account — no OAuth flow needed

   SETUP (one time):
   1. Go to https://console.cloud.google.com
   2. Create project "GovernX Renderer"
   3. Enable "Google Drive API"
   4. Create Service Account → download JSON key → save as:
      C:\Users\Lenovo\GovernX\governx-remotion\service-account.json
   5. Copy the service account email (client_email in the JSON)
   6. Share your GovernX Drive production folder with that email (Editor access)
   7. Set DRIVE_PRODUCTION_FOLDER_ID in config below
   ============================================================================ */

// `googleapis` is required LAZILY inside getDriveClient() (not at module load), so
// the render server still starts even if the package isn't installed yet — Drive
// upload simply stays inactive and Apps Script falls back to downloading.
const fs          = require('fs');
const path        = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
// Path to your downloaded service account JSON key
const SERVICE_ACCOUNT_KEY = path.join(__dirname, '../../service-account.json');

// Your GovernX Drive production folder ID
// Get it from the URL when you open the folder in Drive:
// https://drive.google.com/drive/folders/THIS_PART_IS_THE_ID
// Set via environment variable or hardcode below
const PRODUCTION_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '';

// ── Auth ──────────────────────────────────────────────────────────────────────
function getDriveClient() {
  const { google } = require('googleapis');   // lazy load — see note at top of file
  if (!fs.existsSync(SERVICE_ACCOUNT_KEY)) {
    throw new Error(
      'Service account key not found at: ' + SERVICE_ACCOUNT_KEY + '\n' +
      'Download it from Google Cloud Console and save it there.'
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY,
    scopes : ['https://www.googleapis.com/auth/drive']
  });

  return google.drive({ version: 'v3', auth });
}


// ── Upload a single MP4 to Drive ──────────────────────────────────────────────
async function uploadToDrive(localFilePath, filename, contentId) {

  const drive = getDriveClient();

  // Find or create the content ID subfolder inside the production folder
  const folderId = await getOrCreateContentFolder(drive, contentId);

  // Delete existing file with same name (re-render scenario)
  await deleteExistingFile(drive, filename, folderId);

  // Upload the file
  const response = await drive.files.create({
    requestBody: {
      name    : filename,
      parents : [folderId],
      mimeType: 'video/mp4'
    },
    media: {
      mimeType: 'video/mp4',
      body    : fs.createReadStream(localFilePath)
    },
    fields: 'id,name,webViewLink,webContentLink',
    supportsAllDrives: true            // works whether DRIVE_FOLDER_ID is My Drive or a Shared Drive
  });

  const file = response.data;

  // Make file accessible to anyone with the link
  await drive.permissions.create({
    fileId      : file.id,
    requestBody : { role: 'reader', type: 'anyone' },
    supportsAllDrives: true
  });

  return {
    fileId      : file.id,
    fileName    : file.name,
    driveUrl    : file.webViewLink,
    downloadUrl : `https://drive.google.com/uc?id=${file.id}&export=download`
  };
}


// ── Get or create content subfolder (e.g. "GX-2605-SPT-001") ─────────────────
async function getOrCreateContentFolder(drive, contentId) {

  if (!PRODUCTION_FOLDER_ID) {
    throw new Error(
      'DRIVE_FOLDER_ID not set.\n' +
      'Set it in your .env file or environment variables:\n' +
      'DRIVE_FOLDER_ID=your_production_folder_id'
    );
  }

  // Search for existing subfolder
  const search = await drive.files.list({
    q         : `name='${contentId}' and mimeType='application/vnd.google-apps.folder' and '${PRODUCTION_FOLDER_ID}' in parents and trashed=false`,
    fields    : 'files(id,name)',
    spaces    : 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id;
  }

  // Create new subfolder
  const folder = await drive.files.create({
    requestBody: {
      name    : contentId,
      mimeType: 'application/vnd.google-apps.folder',
      parents : [PRODUCTION_FOLDER_ID]
    },
    fields: 'id',
    supportsAllDrives: true
  });

  return folder.data.id;
}


// ── Delete existing file with same name (avoid duplicates on re-render) ────────
async function deleteExistingFile(drive, filename, folderId) {
  try {
    const search = await drive.files.list({
      q     : `name='${filename}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    if (search.data.files && search.data.files.length > 0) {
      for (const file of search.data.files) {
        await drive.files.delete({ fileId: file.id, supportsAllDrives: true });
      }
    }
  } catch (e) {
    // Non-fatal — proceed with upload even if delete fails
    console.log('[Drive] Could not delete existing file (non-fatal):', e.message);
  }
}


// ── Check if Drive upload is configured ───────────────────────────────────────
function isDriveConfigured() {
  if (!fs.existsSync(SERVICE_ACCOUNT_KEY) || !PRODUCTION_FOLDER_ID) return false;
  try { require.resolve('googleapis'); return true; }   // package present?
  catch { return false; }
}


module.exports = { uploadToDrive, isDriveConfigured };
