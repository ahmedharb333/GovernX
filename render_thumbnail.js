/* Render ThumbnailPoster variants for the Nissan video — verified framing only. */
const path = require("path");
const { bundle } = require("@remotion/bundler");
const { renderStill, selectComposition } = require("@remotion/renderer");

const DESK = "C:/Users/Lenovo/Desktop";
const variants = [
  // A — dark case-file, systemic angle
  ["ThumbnailPoster", `${DESK}/GovernX_thumbnail.png`, {
    company: "NISSAN", dateTag: "2018", headline: "HE APPROVED HIS OWN PAY",
    hedge: "MORE THAN", bigValue: "$140M", bigUnit: "HIDDEN",
    bannerText: "THREE COMPANIES. ONE CHAIRMAN. ZERO OVERSIGHT.",
    ground: "navy", showCaption: false,
  }],
  // B — light "leaked document", drama-led angle
  ["ThumbnailPoster", `${DESK}/GovernX_thumbnail_B.png`, {
    company: "NISSAN", dateTag: "2018", headline: "ARRESTED AT THE AIRPORT",
    hedge: "MORE THAN", bigValue: "$140M", bigUnit: "HIDDEN",
    bannerText: "THE CHAIRMAN WHO RAN THREE COMPANIES",
    ground: "paper", showCaption: false,
  }],
  // C — cinematic hybrid: photo-style drama, real data, no trademark/fake data
  ["ThumbnailCinematic", `${DESK}/GovernX_thumbnail_C.png`, {
    masthead: "GOVERNANCE AUDIT · GHOSN CASE", caseTag: "CASE FILE Nº GX-2607",
    line1: "THE $140M", line2: "BLIND SPOT", subline: "NISSAN'S FATAL ERROR",
  }],
];

(async () => {
  const entryPoint = path.join(__dirname, "src/index.jsx");
  console.log("bundling…");
  const serveUrl = await bundle({ entryPoint, webpackOverride: (c) => c });
  for (const [id, output, props] of variants) {
    const composition = await selectComposition({ serveUrl, id, inputProps: props });
    const frame = Math.min(30, composition.durationInFrames - 1);   // settle frame, clamped to duration
    await renderStill({ composition, serveUrl, output, frame, imageFormat: "png", inputProps: props, overwrite: true });
    console.log("DONE →", output);
  }
})().catch((e) => { console.error(e); process.exit(1); });
