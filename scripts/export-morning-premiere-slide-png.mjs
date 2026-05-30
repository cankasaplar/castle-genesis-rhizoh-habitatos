import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "_img-tools", "package.json"));
const { Resvg } = require("@resvg/resvg-js");

const svgPath = process.argv[2];
const pngPath = process.argv[3];
if (!svgPath || !pngPath) {
  console.error("Usage: node export-morning-premiere-slide-png.mjs <svg> <png>");
  process.exit(1);
}

const svg = fs.readFileSync(svgPath, "utf8");
const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1280 } });
fs.writeFileSync(pngPath, resvg.render().asPng());
console.log(`PNG=${pngPath}`);
