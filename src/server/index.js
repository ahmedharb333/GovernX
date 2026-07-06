/* ============================================================================
   server/index.js — GovernX Remotion Render Server
   Express server that receives render requests from Google Apps Script
   and renders Remotion compositions to MP4

   Place at: governx-remotion/src/server/index.js

   Start with: npm start
   ============================================================================ */

const express  = require("express");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");
const path   = require("path");
const fs     = require("fs");

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

// ── OUTPUT FILE DOWNLOAD ──────────────────────────────────────────────────────
app.get("/output/:filename", (req, res) => {
  const filePath = path.join(OUTPUT_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found: " + req.params.filename });
  }
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", `attachment; filename="${req.params.filename}"`);
  fs.createReadStream(filePath).pipe(res);
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
  console.log(`  Health check    : GET  http://localhost:${PORT}/health`);
  console.log(`\n  Output folder   : ${OUTPUT_DIR}`);
  console.log("\n  Waiting for render requests from Apps Script...\n");

  // Pre-warm the bundle on startup
  try {
    await getBundle();
  } catch (e) {
    console.error("  Bundle error:", e.message);
  }
});
