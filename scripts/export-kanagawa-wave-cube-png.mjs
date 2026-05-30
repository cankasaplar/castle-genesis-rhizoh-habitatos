/**
 * SVG -> PNG for Gmail inline (resvg). Run from repo root after npm install in scripts/_img-tools.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "_img-tools", "package.json"));
const { Resvg } = require("@resvg/resvg-js");
const repoRoot = path.resolve(__dirname, "..");
const svgPath = path.join(
  repoRoot,
  "apps/client/public/ops/real-layer-morning/kanagawa-wave-cube.svg"
);
const pngPath = path.join(
  repoRoot,
  "apps/client/public/ops/real-layer-morning/kanagawa-wave-cube.png"
);

const svg = fs.readFileSync(svgPath, "utf8");
const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 640 },
  font: {
    loadSystemFonts: true,
  },
});
const rendered = resvg.render();
const png = rendered.asPng();
fs.writeFileSync(pngPath, png);
console.log(`PNG=${pngPath}`);
console.log(`BYTES=${png.length}`);
