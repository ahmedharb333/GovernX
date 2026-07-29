/* ============================================================================
   drive-upload.js — GovernX Remotion Server
   Uploads rendered MP4s directly to Google Drive, STREAMED (flat memory at any
   file size). Replaces the Apps Script download step, which built the file as a
   number[] (~8x its size) and OOMed on large films.

   AUTH: OAuth user credentials — the server acts AS your Google account, so files
   are owned by you (no service-account storage-quota issue), and it sidesteps the
   org policy iam.disableServiceAccountKeyCreation that blocks service-account keys.

   SETUP (one time):
   1. Google Cloud Console → APIs & Services → Credentials → Create Credentials →
      OAuth client ID → type "Desktop app". Download its JSON → save as:
         governx-remotion/oauth-client.json
   2. In governx-remotion/, run:  node authorize-drive.js
      Open the printed URL, sign in as the Drive owner, grant Drive access. It
      writes governx-remotion/drive-token.json (refresh token). Both are gitignored.
   3. Set DRIVE_FOLDER_ID in .env to your production folder's ID.
   ============================================================================ */

// `googleapis` is required LAZILY inside getDriveClient() (not at module load), so
// the render server still starts even if the package isn't installed yet — Drive
// upload simply stays inactive and Apps Script falls back to downloading.
const fs          = require('fs');
const path        = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
// OAuth client (client_id + client_secret) downloaded from Google Cloud Console
// as a "Desktop app" client, and the refresh token captured by authorize-drive.js.
// Both are gitignored secrets.
const OAUTH_CLIENT_PATH = process.env.DRIVE_OAUTH_CLIENT || path.join(__dirname, '../../oauth-client.json');
const TOKEN_PATH        = process.env.DRIVE_OAUTH_TOKEN  || path.join(__dirname, '../../drive-token.json');

// Your GovernX Drive production folder ID (from the folder URL:
// https://drive.google.com/drive/folders/THIS_PART_IS_THE_ID). The env.template
// placeholder is treated as "not set" so isDriveConfigured() can't report ready
// while the folder id is still the placeholder (which would upload nowhere and
// silently fall back to the OOM download path).
const _folderRaw = (process.env.DRIVE_FOLDER_ID || '').trim();
const PRODUCTION_FOLDER_ID = _folderRaw === 'your_production_folder_id_here' ? '' : _folderRaw;

// ── Auth (OAuth user credentials) ─────────────────────────────────────────────
function getDriveClient() {
  const { google } = require('googleapis');   // lazy load — see note at top of file
  if (!fs.existsSync(OAUTH_CLIENT_PATH)) {
    throw new Error('OAuth client not found at: ' + OAUTH_CLIENT_PATH +
      '\nCreate an OAuth client ID (Desktop app) in Google Cloud Console and save its JSON there.');
  }
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Drive not authorized yet. In governx-remotion/, run:  node authorize-drive.js  — it creates ' + TOKEN_PATH);
  }
  const creds  = JSON.parse(fs.readFileSync(OAUTH_CLIENT_PATH, 'utf8'));
  const c      = creds.installed || creds.web || creds;
  const oAuth2 = new google.auth.OAuth2(c.client_id, c.client_secret);
  oAuth2.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));   // { refresh_token, ... } — auto-refreshes access tokens
  return google.drive({ version: 'v3', auth: oAuth2 });
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
  if (!fs.existsSync(OAUTH_CLIENT_PATH) || !fs.existsSync(TOKEN_PATH) || !PRODUCTION_FOLDER_ID) return false;
  try { require.resolve('googleapis'); return true; }   // package present?
  catch { return false; }
}


module.exports = { uploadToDrive, isDriveConfigured };
