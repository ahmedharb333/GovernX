/* ============================================================================
   assemble.js — Remotion assembly (replaces Shotstack / Stage 9B).

   Given a content ID's scene list (from Apps Script, which reads the Visual
   Library natively), this:
     1. downloads each scene's public per-scene MP3 (Stage 7B) by Drive id
     2. ffprobes its true length → sets that scene's frame count (locked sync)
     3. adapts REMOTION_DATA → case-file component props
     4. renders AssembledFilm ONCE → a single synced MP4 with captions
   No cloud round-trip, no per-clip reassembly.

   Exported so it can be driven from the /assemble route or a test script.
   ============================================================================ */

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const { renderMedia, selectComposition, ensureBrowser } = require("@remotion/renderer");
const { adaptScene } = require("./adapt");

// Remotion's default browser-setup timeout is 30s. On Windows, a cold first render
// after a server restart (fresh Chromium launch + antivirus scan + font load) can
// exceed that, and the whole assemble fails with "Timed out after 30000 while
// setting up the headless browser". Give the browser a generous window and reuse it.
const BROWSER_TIMEOUT_MS = 120000;   // 2 min — covers a cold Chromium launch

const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");
const AUDIO_DIR = path.join(PUBLIC_DIR, "audio");
const OUTPUT_DIR = path.join(__dirname, "..", "..", "output");
const FPS = 30;
const PAD_FRAMES = 10;
const LONG_SCENE_WARN_SEC = 35;   // past this, one visual cannot carry the scene

// Minimum on-screen time so a short-narration scene doesn't flash by. Text and
// statement cards need reading time for their sub-line and land better with a
// held beat; everything else gets a small floor only.
const MIN_TEXT_FRAMES = Math.round(4.2 * FPS);   // ~4.2s for StatementCard/verdict/hook
const MIN_ANY_FRAMES  = Math.round(3.0 * FPS);   // ~3.0s floor for all other scenes
function minFramesFor(component) {
  return /StatementCard|OpeningHook|VerdictCard|StatPoster/.test(component)
    ? MIN_TEXT_FRAMES : MIN_ANY_FRAMES;
}

const FFPROBE = (() => {
  try {
    const pkg = require.resolve("@remotion/compositor-win32-x64-msvc/package.json");
    return path.join(path.dirname(pkg), "ffprobe.exe");
  } catch { return "ffprobe"; }
})();

const FFMPEG = (() => {
  try {
    const pkg = require.resolve("@remotion/compositor-win32-x64-msvc/package.json");
    return path.join(path.dirname(pkg), "ffmpeg.exe");
  } catch { return "ffmpeg"; }
})();

// Broadcast loudness target. ElevenLabs narration comes out quiet (~-25 LUFS);
// YouTube normalises everything to about -14 LUFS, so a quiet upload gets no
// gain and just sounds weak next to every other channel. Master to -16 LUFS
// integrated / -1.5 dBTP — firm and executive, with peak headroom, no clipping.
const LOUD_I = -16, LOUD_TP = -1.5, LOUD_LRA = 11;

// Optional background-music bed. Drop a file at public/music/bed.mp3 (or point
// MUSIC_BED_PATH at one) and the assembly mixes it low under the narration —
// looped to full length, with a fade in/out. The bundled ffmpeg has no
// sidechaincompress, so it's a steady low bed (not auto-ducked); MUSIC_LEVEL tunes
// how present it sits under the -16 LUFS voice. No file → silently skipped (VO only).
const MUSIC_BED     = process.env.MUSIC_BED_PATH || path.join(PUBLIC_DIR, "music", "bed.mp3");
const MUSIC_LEVEL   = Number(process.env.MUSIC_LEVEL || 0.16);
const MUSIC_FADE_IN = 1.5, MUSIC_FADE_OUT = 2.5;

// Pull the file id out of any Drive URL shape (/file/d/ID/, ?id=ID, uc?id=ID).
function extractDriveId(url) {
  const s = String(url || "");
  let m = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

async function downloadPublicDrive(fileId, destPath) {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Drive download ${res.status} for ${fileId}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Small files download directly; an HTML body means the id is wrong/not public.
  if (buf.length < 1024 && buf.slice(0, 15).toString().toLowerCase().includes("<!doctype")) {
    throw new Error(`Drive returned HTML (not public / bad id) for ${fileId}`);
  }
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

function audioDurationSeconds(absPath) {
  const out = execFileSync(FFPROBE, [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", absPath
  ], { encoding: "utf8" });
  const secs = parseFloat(String(out).trim());
  if (!Number.isFinite(secs) || secs <= 0) throw new Error(`Bad duration for ${absPath}: "${out}"`);
  return secs;
}

/**
 * Prepare the AssembledFilm inputProps.scenes[] from a raw scene list.
 * Each scene: { sceneNum, type, remotionData, voiceoverSync, audioUrl }
 * Downloads audio, measures it, adapts props. Scenes with no audioUrl fall back
 * to a word-count-free default frame count (kept only for robustness).
 */
async function buildScenes({ contentId, scenes, onLog = () => {} }) {
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const out = [];
  for (const s of scenes) {
    const { component, props } = adaptScene(s.type, s.remotionData);
    let audioSrc = "", durationInFrames = 150;

    if (s.audioUrl) {
      const fileId = extractDriveId(s.audioUrl);
      if (!fileId) throw new Error(`Scene ${s.sceneNum}: can't parse Drive id from "${s.audioUrl}"`);

      // The cache key MUST include the Drive file id. It used to be just
      // `{contentId}_scene_{n}.mp3`, so when Stage 7B regenerated a scene the
      // local name was unchanged and the OLD clip was silently reused. A 27-scene
      // re-cut of Nissan shipped with scenes 1-11 still carrying narration from
      // the previous 11-scene script — a 9:13 film built from a 5:11 script, with
      // the wrong words under the right pictures. A new 7B run writes a new Drive
      // file, so a new id here means a fresh download and stale audio can never
      // be picked up again.
      const fileName = `${contentId}_scene_${s.sceneNum}_${fileId}.mp3`;
      const absPath = path.join(AUDIO_DIR, fileName);
      if (!fs.existsSync(absPath) || fs.statSync(absPath).size === 0) {
        const bytes = await downloadPublicDrive(fileId, absPath);
        onLog(`scene ${s.sceneNum}: downloaded ${bytes} bytes`);
      } else {
        onLog(`scene ${s.sceneNum}: cached (${fileId})`);
      }
      const secs = audioDurationSeconds(absPath);
      durationInFrames = Math.ceil(secs * FPS) + PAD_FRAMES;

      // MINIMUM ON-SCREEN TIME. A scene is normally as long as its narration, but
      // a punch card — "NOT ONE EXECUTIVE'S GREED." — is 4 words / ~2s, and at 2s
      // the reveal animation barely finishes before the cut, so the viewer never
      // reads the sub-line. A text/statement scene therefore holds for at least
      // MIN_TEXT_FRAMES; the extra is a beat of silence AFTER the line, which lets
      // a punch statement land. Data scenes (charts, walls) already run long
      // enough, so they only get a small floor.
      const floor = minFramesFor(component);
      if (durationInFrames < floor) {
        onLog(`scene ${s.sceneNum} (${component}): ${secs.toFixed(2)}s → held to ${(floor / FPS).toFixed(1)}s`);
        durationInFrames = floor;
      }
      audioSrc = `audio/${fileName}`;
      onLog(`scene ${s.sceneNum} (${component}): ${secs.toFixed(2)}s → ${durationInFrames}f`);
    }

    // sceneNum + type are carried so the caller can build a chapter list with
    // real start times (the sheet's TIMESTAMP column held garbage serials).
    out.push({ sceneNum: s.sceneNum, sceneType: s.type, component, props,
      audioSrc, captionText: s.voiceoverSync || "", durationInFrames });
  }

  // Checkpoint numbering can only be known here — adaptScene sees one scene at a
  // time and defaulted every card to "1 / 4", so three different checkpoints all
  // read CHECKPOINT 1 / 4. Number them in film order unless the data said so.
  const cps = out.filter(s => s.component === "CaseCheckpoint");
  cps.forEach((s, i) => {
    if (s.props.num === undefined) s.props.num = i + 1;   // director's own number wins
    if (s.props.total === undefined) s.props.total = cps.length;
  });
  if (cps.length) onLog(`numbered ${cps.length} checkpoint(s) 1..${cps.length}`);

  // A scene is as long as its narration. Past ~35s no single visual holds an
  // audience, and the slow drift in assembled.jsx only stops the frame being
  // literally static — it cannot make 100s of one poster watchable. This is a
  // SCRIPT problem (Stage 4 gave one scene too much narration), so name it here
  // rather than let it quietly ship again.
  const totalF = out.reduce((n, s) => n + s.durationInFrames, 0) || 1;
  out.forEach((s, i) => {
    const secs = s.durationInFrames / FPS;
    if (secs > LONG_SCENE_WARN_SEC) {
      onLog(`⚠ scene ${i + 1} (${s.component}) holds ONE visual for ${secs.toFixed(0)}s ` +
            `(${Math.round((s.durationInFrames / totalF) * 100)}% of the film) — split this ` +
            `scene's narration in Stage 4, or give it a second visual via visuals[]`);
    }
  });

  return out;
}

/**
 * Full assembly. Returns { outputPath, totalFrames, sceneCount }.
 * `serveUrl` is the bundled Remotion project (pass the server's cached bundle).
 */
async function assembleFilm({ contentId, scenes, showCaptions = true, serveUrl, onLog = () => {} }) {
  const builtScenes = await buildScenes({ contentId, scenes, onLog });
  return renderAssembled({ contentId, builtScenes, showCaptions, serveUrl, onLog });
}

/** Render already-built scenes (each: {component|visuals,props,audioSrc,durationInFrames}).
 *  Used by assembleFilm and by the curated V3 edit. */
async function renderAssembled({ contentId, builtScenes, showCaptions = true, serveUrl, onLog = () => {} }) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const inputProps = { scenes: builtScenes, showCaptions, fps: FPS };

  // Remotion copies public/ into the bundle at bundle time — but we downloaded
  // the audio AFTER bundling. Copy each clip into the bundle's own public/audio
  // so staticFile() resolves it. serveUrl is a local bundle path here.
  const bundlePath = String(serveUrl).replace(/^file:\/\//, "");
  if (bundlePath && !/^https?:/i.test(serveUrl)) {
    const bundleAudio = path.join(bundlePath, "public", "audio");
    fs.mkdirSync(bundleAudio, { recursive: true });
    for (const s of builtScenes) {
      if (!s.audioSrc) continue;
      const fn = path.basename(s.audioSrc);
      const src = path.join(AUDIO_DIR, fn);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(bundleAudio, fn));
    }
    onLog(`copied ${builtScenes.filter(s => s.audioSrc).length} clips into bundle public/audio`);
  }

  // Pre-warm Chromium once (downloads/launches the headless shell) with a generous
  // timeout, so the first selectComposition below doesn't hit the 30s default and
  // fail the whole assemble. Cheap no-op if the browser is already up.
  onLog("ensuring headless browser…");
  await ensureBrowser({ timeoutInMilliseconds: BROWSER_TIMEOUT_MS });

  // publicDir points staticFile at the LIVE public/ folder (where we just wrote
  // the audio), not the bundle's compile-time snapshot.
  const composition = await selectComposition({ serveUrl, id: "AssembledFilm", inputProps, publicDir: PUBLIC_DIR, timeoutInMilliseconds: BROWSER_TIMEOUT_MS });
  const outputPath = path.join(OUTPUT_DIR, `${contentId}_assembled.mp4`);
  onLog(`rendering ${composition.durationInFrames} frames (${(composition.durationInFrames / FPS).toFixed(1)}s)…`);

  await renderMedia({
    composition, serveUrl, codec: "h264", outputLocation: outputPath, inputProps, publicDir: PUBLIC_DIR,
    // PNG frames (lossless) + crf 12 to match the single-scene renders. JPEG frames
    // + crf 18 softened text edges — fatal on a text/data channel. Slightly slower
    // render + larger file, but the whole point of GovernX is crisp on-screen figures.
    imageFormat: "png", crf: 12, concurrency: 4, timeoutInMilliseconds: BROWSER_TIMEOUT_MS,
    onProgress: ({ progress }) => { if (Math.round(progress * 100) % 10 === 0) onLog(`  ${Math.round(progress * 100)}%`); }
  });

  // ── Mix an optional music bed UNDER the narration (before mastering) ──────
  // Adds life to what is otherwise voice-over-on-silence. Runs before loudnorm so
  // the combined VO+music is mastered to -16 LUFS together. No-op if no bed file.
  mixMusic(outputPath, onLog);

  // ── Master the audio to broadcast loudness ────────────────────────────────
  // Remotion muxes the raw per-scene narration untouched (~-25 LUFS), so the film
  // ships far too quiet. Two-pass loudnorm to -16 LUFS / -1.5 dBTP (video copied,
  // not re-rendered). Best-effort: a failure logs and keeps the un-normalised file
  // rather than losing the whole render.
  normalizeLoudness(outputPath, onLog);

  // ── Verify the file before calling it done ────────────────────────────────
  // "The render finished" is not the same as "the file is complete". A film once
  // shipped 36 seconds short because the COPY was truncated in transit while the
  // render itself was byte-perfect — and nothing noticed, because nobody counted
  // the frames. Decode the result and fail loudly on any shortfall.
  const v = verifyRender(outputPath, composition.durationInFrames, onLog);

  // Per-scene START times in the finished film — the running sum of every prior
  // scene's frames. This is the ONLY correct source for YouTube chapters; the
  // sheet's TIMESTAMP column held time-of-day serials, not film positions.
  let acc = 0;
  const sceneTimings = builtScenes.map(s => {
    const startSec = acc / FPS;
    acc += s.durationInFrames;
    return { sceneNum: s.sceneNum, sceneType: s.sceneType, startSec: +startSec.toFixed(2), mmss: secToMMSS(startSec) };
  });

  return { outputPath, totalFrames: composition.durationInFrames, sceneCount: builtScenes.length,
           bytes: v.bytes, decodedFrames: v.frames, sceneTimings };
}

// seconds → "M:SS" (YouTube chapter format)
function secToMMSS(sec) {
  const s = Math.max(0, Math.round(sec));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

/** Mix a low background-music bed under the narration, in place (best-effort).
 *  Loops the bed to the film's length, fades it in/out, and mixes it beneath the
 *  voice at MUSIC_LEVEL (amix normalize=0 keeps the VO at full level). Runs BEFORE
 *  the loudness master so the combined mix is mastered together. No bed file, or
 *  any failure, leaves the VO-only audio untouched. */
function mixMusic(outputPath, onLog = () => {}) {
  if (!fs.existsSync(MUSIC_BED)) { onLog(`no music bed (looked at ${MUSIC_BED}) — VO only`); return; }
  if (!fs.existsSync(outputPath)) return;
  const tmp = outputPath.replace(/\.mp4$/i, "._music.mp4");
  try {
    const durRaw = execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=nk=1:nw=1", outputPath], { encoding: "utf8" });
    const D = parseFloat(String(durRaw).trim());
    if (!D) { onLog("  music: could not read film duration — skipping"); return; }
    // fade in over MUSIC_FADE_IN, fade out over the last MUSIC_FADE_OUT (commas escaped for the filter expr)
    const vol = `${MUSIC_LEVEL}*min(1\\,t/${MUSIC_FADE_IN})*min(1\\,(${D.toFixed(2)}-t)/${MUSIC_FADE_OUT})`;
    const r = spawnSync(FFMPEG, [
      "-hide_banner", "-nostats",
      "-i", outputPath,
      "-stream_loop", "-1", "-i", MUSIC_BED,
      "-filter_complex", `[1:a]volume='${vol}':eval=frame[m];[0:a][m]amix=inputs=2:duration=first:normalize=0[a]`,
      "-map", "0:v", "-c:v", "copy", "-map", "[a]", "-c:a", "aac", "-b:a", "256k",
      "-movflags", "+faststart", "-f", "mp4", tmp, "-y"
    ], { encoding: "utf8", maxBuffer: 1 << 24 });
    if (r.status !== 0 || !fs.existsSync(tmp) || fs.statSync(tmp).size < 1024) {
      onLog("  music mix failed — keeping VO-only audio");
      try { fs.unlinkSync(tmp); } catch {}
      return;
    }
    fs.renameSync(tmp, outputPath);
    onLog(`  mixed music bed at level ${MUSIC_LEVEL} (fade ${MUSIC_FADE_IN}s/${MUSIC_FADE_OUT}s) ✅`);
  } catch (e) {
    onLog(`  music mix skipped (${e.message})`);
    try { fs.unlinkSync(tmp); } catch {}
  }
}

/** Two-pass EBU R128 loudness normalisation, in place.
 *  Pass 1 measures (audio-only → adts, discarded — the bundled minimal ffmpeg has
 *  no `null` muxer but loudnorm still prints its JSON to stderr). Pass 2 applies a
 *  LINEAR gain to the measured values (video stream copied, audio re-encoded aac),
 *  then swaps the file in. Best-effort: any failure leaves the original untouched. */
function normalizeLoudness(outputPath, onLog = () => {}) {
  if (!fs.existsSync(outputPath)) return;
  const measureTmp = path.join(OUTPUT_DIR, "_loudnorm_measure.aac");
  const normTmp    = outputPath.replace(/\.mp4$/i, "._norm.mp4");
  try {
    // Pass 1 — measure
    const p1 = spawnSync(FFMPEG, [
      "-hide_banner", "-nostats", "-i", outputPath, "-map", "0:a",
      "-af", `loudnorm=I=${LOUD_I}:TP=${LOUD_TP}:LRA=${LOUD_LRA}:print_format=json`,
      "-c:a", "aac", "-f", "adts", measureTmp, "-y"
    ], { encoding: "utf8", maxBuffer: 1 << 24 });
    try { fs.unlinkSync(measureTmp); } catch {}
    const m = String(p1.stderr || "").match(/\{[\s\S]*?\}/);
    if (!m) { onLog("  loudness measure produced no data — keeping original audio"); return; }
    const meas = JSON.parse(m[0]);
    onLog(`  measured ${meas.input_i} LUFS / TP ${meas.input_tp} dB → mastering to ${LOUD_I} LUFS`);

    // Pass 2 — apply (linear gain, video copied)
    const af = `loudnorm=I=${LOUD_I}:TP=${LOUD_TP}:LRA=${LOUD_LRA}`
      + `:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}`
      + `:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true`;
    const p2 = spawnSync(FFMPEG, [
      "-hide_banner", "-nostats", "-i", outputPath, "-map", "0",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-af", af,
      "-movflags", "+faststart", "-f", "mp4", normTmp, "-y"
    ], { encoding: "utf8", maxBuffer: 1 << 24 });
    if (p2.status !== 0 || !fs.existsSync(normTmp) || fs.statSync(normTmp).size < 1024) {
      onLog("  loudness apply failed — keeping original audio");
      try { fs.unlinkSync(normTmp); } catch {}
      return;
    }
    fs.renameSync(normTmp, outputPath);
    onLog(`  audio mastered to ${LOUD_I} LUFS / ${LOUD_TP} dBTP ✅`);
  } catch (e) {
    onLog(`  loudness normalisation skipped (${e.message}) — keeping original audio`);
    try { fs.unlinkSync(measureTmp); } catch {}
    try { fs.unlinkSync(normTmp); } catch {}
  }
}

/** Decodes the rendered file and checks it against the intended timeline.
 *  Throws rather than returning a broken artifact. */
function verifyRender(outputPath, expectedFrames, onLog = () => {}) {
  if (!fs.existsSync(outputPath)) throw new Error(`render produced no file at ${outputPath}`);
  const bytes = fs.statSync(outputPath).size;
  if (bytes < 1024) throw new Error(`render output is ${bytes} bytes — effectively empty`);

  // -count_frames actually DECODES; the header's nb_frames can claim a length the
  // payload does not contain, which is exactly how a truncated file hides.
  let frames = null;
  try {
    const out = execFileSync(FFPROBE, [
      "-v", "error", "-count_frames", "-select_streams", "v:0",
      "-show_entries", "stream=nb_read_frames", "-of", "default=nw=1:nk=1", outputPath
    ], { encoding: "utf8", maxBuffer: 1 << 24 });
    frames = parseInt(String(out).trim(), 10);
  } catch (e) {
    throw new Error(`could not decode the rendered file (probably corrupt): ${e.message}`);
  }

  if (!Number.isFinite(frames)) throw new Error("could not count frames in the rendered file");

  // One or two frames of slack for encoder flushing; anything more is a real loss.
  const missing = expectedFrames - frames;
  if (missing > 2) {
    throw new Error(
      `INCOMPLETE RENDER: ${frames} of ${expectedFrames} frames decoded ` +
      `(${(missing / FPS).toFixed(1)}s missing). File is ${bytes} bytes.`
    );
  }

  onLog(`verified: ${frames}/${expectedFrames} frames decoded, ${(bytes / 1048576).toFixed(1)} MB`);
  return { bytes, frames };
}

module.exports = { assembleFilm, renderAssembled, buildScenes, extractDriveId, downloadPublicDrive, audioDurationSeconds, AUDIO_DIR, FPS, PAD_FRAMES };
