/**
 * Freeze ↔ Identity boundary guardrail (v0)
 *
 * Invariants:
 * - Frozen ghost phase modules must not import identity/runtime bus (no upward coupling).
 * - Rhizoh runtime identity layer must not import ghost phase modules (identity bus does not pull freeze).
 *
 * Does not replace validateStabilizationGraph.mjs — this is dependency-direction only.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const GHOST_DIR = path.join(repoRoot, "apps", "client", "src", "ghost");
const RUNTIME_DIR = path.join(repoRoot, "apps", "client", "src", "rhizoh", "runtime");

/** @param {string} dir */
function listJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) continue;
    if (!ent.name.endsWith(".js")) continue;
    if (ent.name.endsWith(".test.js")) continue;
    out.push(p);
  }
  return out;
}

/**
 * @param {string} source
 * @returns {string[]}
 */
function extractStaticImportSpecifiers(source) {
  const specs = [];
  const re = /\bfrom\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(source))) specs.push(m[1]);
  const reDyn = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = reDyn.exec(source))) specs.push(m[1]);
  return specs;
}

/**
 * @param {string} spec
 * @param {string} needlePosix
 */
function specTouches(spec, needlePosix) {
  const s = String(spec || "").replace(/\\/g, "/");
  return s.includes(needlePosix);
}

let failed = false;

function fail(msg) {
  failed = true;
  console.error(`[FREEZE_IDENTITY_BOUNDARY] ${msg}`);
}

for (const file of listJsFiles(GHOST_DIR)) {
  const src = fs.readFileSync(file, "utf8");
  for (const spec of extractStaticImportSpecifiers(src)) {
    if (specTouches(spec, "rhizoh/runtime")) {
      fail(`${path.relative(repoRoot, file)}: ghost must not import rhizoh/runtime — got "${spec}"`);
    }
  }
}

for (const file of listJsFiles(RUNTIME_DIR)) {
  const src = fs.readFileSync(file, "utf8");
  for (const spec of extractStaticImportSpecifiers(src)) {
    if (specTouches(spec, "/ghost/") || specTouches(spec, "src/ghost")) {
      fail(`${path.relative(repoRoot, file)}: rhizoh/runtime must not import ghost — got "${spec}"`);
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log("[FREEZE_IDENTITY_BOUNDARY] ok");
