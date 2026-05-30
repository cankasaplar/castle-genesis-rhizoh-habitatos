import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const require = createRequire(path.join(repoRoot, "scripts/_img-tools/package.json"));
const { Resvg } = require("@resvg/resvg-js");

const svgPath = path.join(
  repoRoot,
  "apps/client/public/ops/youtube-test/castle-genesis-holding-slide.svg"
);
const pngPath = path.join(
  repoRoot,
  "apps/client/public/ops/youtube-test/castle-genesis-holding-slide.png"
);

const svg = fs.readFileSync(svgPath, "utf8");
const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1920 } });
fs.writeFileSync(pngPath, resvg.render().asPng());
console.log(`PNG=${pngPath}`);
