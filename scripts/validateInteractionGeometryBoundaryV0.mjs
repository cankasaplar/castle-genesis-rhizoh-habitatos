/**
 * Interaction Geometry v0 — identity substrate isolation (static guard).
 *
 * Policy: [`docs/INTERACTION_GEOMETRY_V0.md`](../docs/INTERACTION_GEOMETRY_V0.md)
 * - Geometry code must not import identity graph / recall→identity merge modules.
 * - Scans only `apps/client/src/rhizoh/interactionGeometry/**` (non-test .js/.jsx).
 * - If that tree has no source files yet, exits 0 (convention hook for future code).
 *
 * Run: `npm run stabilization:validate-interaction-geometry-boundary-v0`
 * Also invoked from `validateCanonicalDriftGuards.mjs`.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const GEOMETRY_ROOT = path.join(repoRoot, "apps", "client", "src", "rhizoh", "interactionGeometry");

/** Import path fragments (posix, case-insensitive match) that must not appear in geometry imports */
const FORBIDDEN_IMPORT_FRAGMENTS = [
  "rhizohidentitykernelv1",
  "identityfeedbackfromrecall",
  "/ghost/phase",
  "src/ghost/phase"
];

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
 * @param {string} dir
 * @param {string[]} out
 */
function walkGeometrySources(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "__tests__") continue;
      walkGeometrySources(p, out);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name);
      if (ext !== ".js" && ext !== ".jsx") continue;
      const bn = ent.name.toLowerCase();
      if (bn.includes(".test.") || bn.includes(".spec.")) continue;
      out.push(p);
    }
  }
}

function main() {
  const files = [];
  walkGeometrySources(GEOMETRY_ROOT, files);

  if (files.length === 0) {
    console.log("[INTERACTION_GEOMETRY_BOUNDARY_V0] ok — no modules under rhizoh/interactionGeometry yet (hook ready).");
    return;
  }

  let failed = false;
  function fail(msg) {
    failed = true;
    console.error(`[INTERACTION_GEOMETRY_BOUNDARY_V0] ${msg}`);
  }

  for (const abs of files) {
    const rel = path.relative(repoRoot, abs);
    let src;
    try {
      src = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    const posix = rel.split(path.sep).join("/");
    for (const spec of extractStaticImportSpecifiers(src)) {
      const low = String(spec || "").replace(/\\/g, "/").toLowerCase();
      for (const frag of FORBIDDEN_IMPORT_FRAGMENTS) {
        if (low.includes(frag)) {
          fail(`${posix}: forbidden import for interaction geometry — "${spec}" (matches ${frag})`);
        }
      }
    }
  }

  if (failed) {
    console.error(
      "\nSee docs/INTERACTION_GEOMETRY_V0.md — semantic read isolation; geometry must not couple to identity substrate.\n"
    );
    process.exit(1);
  }
  console.log(`[INTERACTION_GEOMETRY_BOUNDARY_V0] ok — scanned ${files.length} file(s).`);
}

main();
