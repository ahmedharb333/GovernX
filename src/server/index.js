/* ============================================================================
   server/index.js — GovernX Remotion Render Server
   Express server that receives render requests from Google Apps Script
   and renders Remotion compositions to MP4

   Place at: governx-remotion/src/server/index.js

   Start with: npm start
   ============================================================================ */

const express  = require("express");
const { bundle } = require("@remotion/bundler");
const { renderMedia, renderStill, selectComposition, ensureBrowser } = require("@remotion/renderer");
const path   = require("path");
const fs     = require("fs");

// Load .env (ANTHROPIC_API_KEY, RESEARCH_MODEL, DRIVE_FOLDER_ID). Optional dep.
try { require("dotenv").config({ path: path.join(__dirname, "../../.env") }); } catch (e) {}

const research = require("./research/pipeline");
const { adaptScene } = require("./adapt");

const app  = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// ── CORS for Apps Script ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin",  "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, ngrok-skip-browser-warning");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Output folder
const OUTPUT_DIR = path.join(__dirname, "../../output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Cache the bundle path
let bundlePath = null;

async function getBundle() {
  if (bundlePath) return bundlePath;
  console.log("[GovernX] Bundling Remotion project...");
  bundlePath = await bundle({
    entryPoint: path.join(__dirname, "../index.jsx"),
    webpackOverride: (config) => config
  });
  console.log("[GovernX] Bundle ready ✅");
  return bundlePath;
}

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", server: "GovernX Remotion Renderer" });
});

// ── RESEARCH: async job queue ─────────────────────────────────────────────────
// Apps Script runs on Google's servers and UrlFetchApp times out long before an
// uncached research build finishes. So: POST a job, get an id, poll for it.
const jobs = new Map();   // jobId → { status, startedAt, result, error }

app.post("/research/job", (req, res) => {
  const jobId = "job_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  jobs.set(jobId, { status: "running", startedAt: Date.now(), result: null, error: "" });
  res.json({ ok: true, jobId });

  // Run detached; the client polls /research/job/:id
  research.buildEvidence(req.body || {})
    .then(result => {
      jobs.set(jobId, { status: "done", startedAt: Date.now(), result, error: "" });
      console.log(`[Research] job ${jobId} done — ${result.stats.verified}/${result.stats.claims} verified`);
      (result.warnings || []).forEach(w => console.warn(`[Research] ⚠ ${w}`));
    })
    .catch(err => {
      jobs.set(jobId, { status: "error", startedAt: Date.now(), result: null, error: err.message });
      console.error(`[Research] job ${jobId} failed: ${err.message}`);
    });
});

app.get("/research/job/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: "unknown jobId" });
  if (job.status === "running") return res.json({ ok: true, status: "running", elapsedMs: Date.now() - job.startedAt });
  if (job.status === "error")   return res.json({ ok: false, status: "error", error: job.error });
  res.json({ ok: true, status: "done", ...job.result });
});

// ── RESEARCH: source DISCOVERY (the step Stage 2 was missing) ─────────────────
// POST /research/discover  { company, brief, maxTest? }
//   → web_search finds candidate URLs → each is fetch-tested with the SAME
//     engine ② uses → returns only reachable URLs (sourceUrls) to paste into
//     Idea Catalogue Source_URLs before ② runs. Async (search + fetch-tests can
//     take ~30–60s), polled like /research/job.
const discover = require("./research/discover");
app.post("/research/discover", (req, res) => {
  const { company, brief } = req.body || {};
  if (!company && !brief) {
    return res.status(400).json({ ok: false, error: "company or brief required" });
  }
  const jobId = "dsc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  jobs.set(jobId, { status: "running", startedAt: Date.now(), result: null, error: "" });
  res.json({ ok: true, jobId });

  discover.discoverSources(req.body || {})
    .then(result => {
      jobs.set(jobId, { status: "done", startedAt: Date.now(), result, error: "" });
      console.log(`[Discover] job ${jobId} done — ${result.stats.fetchable}/${result.stats.candidates} fetchable`);
      (result.warnings || []).forEach(w => console.warn(`[Discover] ⚠ ${w}`));
    })
    .catch(err => {
      jobs.set(jobId, { status: "error", startedAt: Date.now(), result: null, error: err.message });
      console.error(`[Discover] job ${jobId} failed: ${err.message}`);
    });
});

app.get("/research/discover/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: "unknown jobId" });
  if (job.status === "running") return res.json({ ok: true, status: "running", elapsedMs: Date.now() - job.startedAt });
  if (job.status === "error")   return res.json({ ok: false, status: "error", error: job.error });
  res.json({ ok: true, status: "done", ...job.result });
});

// ── ASSEMBLE: Remotion film assembly (replaces Shotstack / Stage 9B) ──────────
// POST /assemble/job  { contentId, scenes:[{sceneNum,type,remotionData,voiceoverSync,audioUrl}], showCaptions }
//   → downloads each scene's public 7B audio, locks each scene to its audio
//     length, adapts REMOTION_DATA → case-file props, renders ONE synced MP4.
// Long render (minutes) → async job + poll, like /research/job.
const assemble = require("./assemble");
const driveUpload = require("./drive-upload");
app.post("/assemble/job", (req, res) => {
  const { contentId, scenes, showCaptions } = req.body || {};
  if (!contentId || !Array.isArray(scenes) || scenes.length === 0) {
    return res.status(400).json({ ok: false, error: "contentId and non-empty scenes[] required" });
  }
  const jobId = "asm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  jobs.set(jobId, { status: "running", startedAt: Date.now(), result: null, error: "" });
  res.json({ ok: true, jobId });

  (async () => {
    const serveUrl = await getBundle();
    const r = await assemble.assembleFilm({
      contentId, scenes, showCaptions: showCaptions !== false, serveUrl,
      onLog: (m) => console.log(`[Assemble ${contentId}] ${m}`)
    });
    const filename = path.basename(r.outputPath);

    // Upload the finished MP4 to Drive FROM THE SERVER — streamed
    // (fs.createReadStream), so memory stays flat at any file size. This replaces
    // the Apps Script download step, which materialised the whole file as a
    // number[] (~8x its size in RAM) and OOMed on ~44MB+ films. If Drive isn't
    // configured (no service-account.json / DRIVE_FOLDER_ID), `drive` stays null
    // and Apps Script falls back to downloading.
    let drive = null, driveError = "";
    if (driveUpload.isDriveConfigured()) {
      try {
        drive = await driveUpload.uploadToDrive(r.outputPath, `${contentId}_final_video.mp4`, contentId);
        console.log(`[Assemble ${contentId}] uploaded to Drive → ${drive.driveUrl}`);
      } catch (e) {
        driveError = e.message;
        console.error(`[Assemble ${contentId}] Drive upload failed: ${e.message}`);
      }
    } else {
      console.log(`[Assemble ${contentId}] Drive not configured — Apps Script will download instead.`);
    }

    // `bytes` is returned so the client can prove it downloaded the whole file
    // (fallback path). `sceneTimings` gives the client real per-scene start times.
    return { filename, url: `http://localhost:${PORT}/output/${filename}`,
      totalFrames: r.totalFrames, durationSec: +(r.totalFrames / 30).toFixed(1), sceneCount: r.sceneCount,
      bytes: r.bytes, decodedFrames: r.decodedFrames, sceneTimings: r.sceneTimings,
      drive, driveError };
  })()
    .then(result => { jobs.set(jobId, { status: "done", startedAt: Date.now(), result, error: "" });
      console.log(`[Assemble] job ${jobId} done — ${result.sceneCount} scenes, ${result.durationSec}s`); })
    .catch(err => { jobs.set(jobId, { status: "error", startedAt: Date.now(), result: null, error: err.message });
      console.error(`[Assemble] job ${jobId} failed: ${err.message}`); });
});

app.get("/assemble/job/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: "unknown jobId" });
  if (job.status === "running") return res.json({ ok: true, status: "running", elapsedMs: Date.now() - job.startedAt });
  if (job.status === "error")   return res.json({ ok: false, status: "error", error: job.error });
  res.json({ ok: true, status: "done", ...job.result });
});

// ── RESEARCH: verified-claims engine ──────────────────────────────────────────
// POST /research/fetch  { url }  → fetch + parse + archive one document
app.post("/research/fetch", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ ok: false, error: "url required" });
    const doc = await research.fetchDocument(url);
    // Trim text in the preview response; full text is on disk + returned by /build.
    res.json({ ...doc, preview: (doc.text || "").slice(0, 1200), text: undefined });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /research/build  { company, brief, urls[], edgarQueries[] }
//   → fetch → extract → quote-gate → verify → { sources[], claims[], stats }
app.post("/research/build", async (req, res) => {
  const t0 = Date.now();
  console.log(`[Research] build: ${(req.body.urls||[]).length} url(s), ` +
              `${(req.body.edgarQueries||[]).length} edgar query(ies)`);
  try {
    const result = await research.buildEvidence(req.body || {});
    console.log(`[Research] done in ${((Date.now()-t0)/1000).toFixed(1)}s — ` +
                `${result.stats.verified}/${result.stats.claims} verified ` +
                `(${result.stats.verifiedRate}%)`);
    (result.warnings || []).forEach(w => console.warn(`[Research] ⚠ ${w}`));
    // A run that produced no claims is NOT a success, even if every HTTP call returned 200.
    res.json({ ok: result.stats.claims > 0, ...result });
  } catch (err) {
    console.error("[Research] ❌", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── THUMBNAIL ─────────────────────────────────────────────────────────────────
// POST /thumbnail { contentId, props }  → renders ThumbnailPoster to a 1280×720
// PNG and returns { filename, url }. A still, so it takes ~1 min, not a job queue.
//
// Rendered here rather than generated by an image model because the headline is
// TEXT: diffusion models garble it (a reference poster came back reading
// "SCCAN DAL") and every regeneration drifts off the design system. This uses the
// same components and tokens as the film, and the same verified figure, so the
// number on the thumbnail cannot disagree with the number in the video.
// Pass props.photoSrc to composite a real image (or an AI-generated background
// with NO text in it) underneath the typography.
app.post("/thumbnail", async (req, res) => {
  const { contentId, props } = req.body || {};
  if (!contentId) return res.status(400).json({ success: false, error: "contentId required" });

  try {
    const serveUrl = await getBundle();
    const inputProps = props || {};
    const composition = await selectComposition({ serveUrl, id: req.body.compositionId || "ThumbnailPoster", inputProps });
    const variant = String(req.body.variant || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
    const filename = `${contentId}_thumbnail${variant ? "_" + variant : ""}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    console.log(`[Thumbnail] ${contentId} — "${(inputProps.headline || "").slice(0, 48)}"`);
    await renderStill({ composition, serveUrl, output: outputPath, inputProps, frame: 30, imageFormat: "png" });

    console.log(`[Thumbnail] ✅ ${filename}`);
    res.json({ success: true, filename, url: `http://localhost:${PORT}/output/${filename}` });
  } catch (err) {
    console.error("[Thumbnail] ❌", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /preview-scene { sceneType, remotionData } → adapts ONE scene EXACTLY as
// the assembly does (adapt.js) and renders the resulting case-file component to a
// settled still. This is why "Preview One Scene" now shows the REAL component the
// film will use, not a legacy /render composition.
app.post("/preview-scene", async (req, res) => {
  const { sceneType, remotionData } = req.body || {};
  try {
    const { component, props } = adaptScene(sceneType || "", remotionData || "");
    const serveUrl = await getBundle();
    const composition = await selectComposition({ serveUrl, id: component, inputProps: props });
    // ~70% through the scene → past the intro animation, showing the settled frame
    const frame = Math.min(composition.durationInFrames - 1, Math.round(composition.durationInFrames * 0.7));
    const filename = `preview_${component}_${Date.now()}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    console.log(`[Preview] ${sceneType} → ${component} (frame ${frame})`);
    await renderStill({ composition, serveUrl, output: outputPath, inputProps: props, frame, imageFormat: "png" });
    res.json({ success: true, component, filename, url: `http://localhost:${PORT}/output/${filename}` });
  } catch (err) {
    console.error("[Preview] ❌", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── OUTPUT FILE DOWNLOAD ──────────────────────────────────────────────────────
// Serves the file, and supports HTTP Range so a large render can be pulled in
// pieces. Apps Script's UrlFetchApp caps a single response at 50 MB and silently
// TRUNCATES beyond it — a 56 MB film arrived 36 seconds short with no error at
// all. Range lets the client take it in chunks and verify the total.
app.get("/output/:filename", (req, res) => {
  const filePath = path.join(OUTPUT_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found: " + req.params.filename });
  }
  const size = fs.statSync(filePath).size;
  const type = req.params.filename.endsWith(".png") ? "image/png" : "video/mp4";

  res.setHeader("Content-Type", type);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Disposition", `attachment; filename="${req.params.filename}"`);

  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
    if (start >= size || start > end) {
      res.setHeader("Content-Range", `bytes */${size}`);
      return res.status(416).end();
    }
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    res.setHeader("Content-Length", end - start + 1);
    return fs.createReadStream(filePath, { start, end }).pipe(res);
  }

  res.setHeader("Content-Length", size);
  fs.createReadStream(filePath).pipe(res);
});

// Lets a client learn the exact size before downloading, so it can chunk and
// then prove it received every byte.
app.get("/output-info/:filename", (req, res) => {
  const filePath = path.join(OUTPUT_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ ok: false, error: "not found" });
  res.json({ ok: true, filename: req.params.filename, bytes: fs.statSync(filePath).size });
});

// ── SINGLE RENDER ─────────────────────────────────────────────────────────────
app.post("/render", async (req, res) => {
  const { compositionId, props, outputFilename, contentId, durationInFrames } = req.body;

  if (!compositionId || !outputFilename) {
    return res.status(400).json({ success: false, error: "compositionId and outputFilename required" });
  }

  console.log(`[GovernX] Rendering: ${compositionId} → ${outputFilename}${durationInFrames ? ` (${durationInFrames}f / ${(durationInFrames/30).toFixed(1)}s)` : ""}`);

  try {
    const bundle = await getBundle();
    const composition = await selectComposition({
      serveUrl     : bundle,
      id           : compositionId,
      inputProps   : props || {}
    });

    // Override duration if provided by Apps Script (auto-calculated from voiceover word count)
    if (durationInFrames && Number.isInteger(durationInFrames) && durationInFrames > 0) {
      composition.durationInFrames = durationInFrames;
    }

    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    await renderMedia({
      composition,
      serveUrl     : bundle,
      codec        : "h264",
      outputLocation: outputPath,
      inputProps   : props || {},
      imageFormat  : "png",
      crf          : 12,
      onProgress   : ({ progress }) => {
        process.stdout.write(`\r  Progress: ${Math.round(progress * 100)}%`);
      }
    });

    console.log(`\n[GovernX] ✅ Done: ${outputFilename}`);

    const downloadUrl = `http://localhost:${PORT}/output/${outputFilename}`;
    res.json({
      success  : true,
      filename : outputFilename,
      url      : downloadUrl
    });

  } catch (err) {
    console.error("[GovernX] ❌ Render error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── BATCH RENDER ──────────────────────────────────────────────────────────────
app.post("/render-batch", async (req, res) => {
  const { scenes } = req.body;
  if (!scenes || !Array.isArray(scenes)) {
    return res.status(400).json({ success: false, error: "scenes array required" });
  }

  console.log(`[GovernX] Batch render: ${scenes.length} scenes`);
  const results = [];

  for (const scene of scenes) {
    try {
      const bundle = await getBundle();
      const composition = await selectComposition({
        serveUrl  : bundle,
        id        : scene.compositionId,
        inputProps: scene.props || {}
      });

      // Override duration if provided (auto-calculated from voiceover word count)
      if (scene.durationInFrames && Number.isInteger(scene.durationInFrames) && scene.durationInFrames > 0) {
        composition.durationInFrames = scene.durationInFrames;
      }

      const outputPath = path.join(OUTPUT_DIR, scene.outputFilename);

      await renderMedia({
        composition,
        serveUrl      : bundle,
        codec         : "h264",
        outputLocation: outputPath,
        inputProps    : scene.props || {},
        imageFormat   : "png",
        crf           : 12,
        onProgress    : ({ progress }) => {
          process.stdout.write(`\r  Scene ${scene.sceneNum}: ${Math.round(progress * 100)}%`);
        }
      });

      console.log(`\n[GovernX] ✅ Scene ${scene.sceneNum}: ${scene.outputFilename}`);

      results.push({
        sceneNum : scene.sceneNum,
        success  : true,
        filename : scene.outputFilename,
        url      : `http://localhost:${PORT}/output/${scene.outputFilename}`
      });

    } catch (err) {
      console.error(`\n[GovernX] ❌ Scene ${scene.sceneNum} failed:`, err.message);
      results.push({
        sceneNum: scene.sceneNum,
        success : false,
        error   : err.message
      });
    }
  }

  res.json({ success: true, results });
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   GovernX Remotion Renderer — RUNNING        ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`\n  Render endpoint : POST http://localhost:${PORT}/render`);
  console.log(`  Batch endpoint  : POST http://localhost:${PORT}/render-batch`);
  console.log(`  Output files    : GET  http://localhost:${PORT}/output/{filename}`);
  console.log(`  Research build  : POST http://localhost:${PORT}/research/build`);
  console.log(`  Research fetch  : POST http://localhost:${PORT}/research/fetch`);
  console.log(`  Health check    : GET  http://localhost:${PORT}/health`);
  console.log(`  Research model  : ${process.env.RESEARCH_MODEL || "claude-sonnet-5"}  ` +
              `(API key ${process.env.ANTHROPIC_API_KEY ? "set ✅" : "MISSING ❌ — add to .env"})`);
  console.log(`\n  Output folder   : ${OUTPUT_DIR}`);
  console.log("\n  Waiting for render requests from Apps Script...\n");

  // Pre-warm the bundle AND the headless browser on startup, so the first render
  // request doesn't pay the cold-start cost and time out. Remotion's browser-setup
  // default is 30s; a cold Chromium launch on Windows (first launch, antivirus,
  // fonts) can exceed that and fail "setting up the headless browser" — killing
  // Stage 9C / preview / thumbnail. Launch it once here with a generous window.
  try {
    await getBundle();
  } catch (e) {
    console.error("  Bundle error:", e.message);
  }
  try {
    await ensureBrowser({ timeoutInMilliseconds: 120000 });
    console.log("  Headless browser ready ✅\n");
  } catch (e) {
    console.error("  Browser warm-up error:", e.message);
  }
});
