/* One-off: render the refined logo assets to PNGs (transparent where applicable). */
const path = require("path");
const { bundle } = require("@remotion/bundler");
const { renderStill, selectComposition } = require("@remotion/renderer");

const DESK = "C:/Users/Lenovo/Desktop";
const jobs = [
  ["LogoWordmark", `${DESK}/GovernX_logo_wordmark.png`, {}],
  ["LogoMonogram", `${DESK}/GovernX_logo_GX.png`, {}],
  ["ProfilePic",   `${DESK}/GovernX_profile.png`, {}],
  ["LogoWatermark", `${DESK}/GovernX_watermark.png`, {}],
  // proof only — watermark on navy so we can eyeball the tight GX
  ["LogoWatermark", `${DESK}/_watermark_on_navy.png`, { variant: "watermark", bg: "#111B2E" }],
];

(async () => {
  const entryPoint = path.join(__dirname, "src/index.jsx");
  console.log("bundling…");
  const serveUrl = await bundle({ entryPoint, webpackOverride: (c) => c });
  for (const [id, output, inputProps] of jobs) {
    const composition = await selectComposition({ serveUrl, id, inputProps });
    await renderStill({ composition, serveUrl, output, frame: 0, imageFormat: "png", inputProps, overwrite: true });
    console.log("DONE", id, "→", output);
  }
})().catch((e) => { console.error(e); process.exit(1); });
