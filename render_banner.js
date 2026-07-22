/* One-off: render the ChannelBanner still to a 2048×1152 PNG for YouTube. */
const path = require("path");
const { bundle } = require("@remotion/bundler");
const { renderStill, selectComposition } = require("@remotion/renderer");

(async () => {
  const entryPoint = path.join(__dirname, "src/index.jsx");
  const output = process.argv[2] || "C:/Users/Lenovo/Desktop/GovernX_banner.png";
  console.log("bundling…");
  const serveUrl = await bundle({ entryPoint, webpackOverride: (c) => c });
  console.log("selecting composition…");
  const composition = await selectComposition({ serveUrl, id: "ChannelBanner", inputProps: {} });
  console.log("rendering still…");
  await renderStill({ composition, serveUrl, output, frame: 0, imageFormat: "png", overwrite: true });
  console.log("DONE →", output);
})().catch((e) => { console.error(e); process.exit(1); });
