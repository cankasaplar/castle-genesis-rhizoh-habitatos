/**
 * SpiralMMO ↔ Rhizoh (canonical entry / RCML experience) hard boundary v1.
 *
 * Guarantees the Rhizoh living-world experience stack does not pull in
 * Spiral execution / gateway game kernel — perception + copy only.
 *
 * @see apps/client/docs/PRODUCT_LAUNCH_GAP_FINAL_FOUR_V1.0.md §4
 *
 * Run: node scripts/validateSpiralRhizohBoundaryV1.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const EXPERIENCE_DIR = path.join(repoRoot, "apps", "client", "src", "rhizoh", "experience");
const SPIRAL_AGREEMENT_FILE = path.join(EXPERIENCE_DIR, "spiralMMOAgreementLayerV0.js");
const APP_ENTRY = path.join(repoRoot, "apps", "client", "src", "AppRhizoh528.jsx");

const FORBIDDEN_IMPORT_RE = /\bfrom\s+["']([^"']+)["']/g;
const FORBIDDEN_PATH_SUBSTRINGS = [
  "apps/gateway",
  "gateway/src",
  "spiralMMOGameKernel",
  "spiralMMOGame",
  "/ops/spiral"
];

let failed = false;

function fail(msg) {
  failed = true;
  console.error(`[SPIRAL_RHIZOH_BOUNDARY_V1] ${msg}`);
}

function read(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function scanFileForForbiddenImports(abs, rel) {
  const text = read(abs);
  if (!text) return;
  let m;
  FORBIDDEN_IMPORT_RE.lastIndex = 0;
  while ((m = FORBIDDEN_IMPORT_RE.exec(text))) {
    const spec = m[1];
    for (const sub of FORBIDDEN_PATH_SUBSTRINGS) {
      if (spec.includes(sub)) {
        fail(`${rel}: forbidden import path segment "${sub}" — "${spec}"`);
      }
    }
  }
}

function scanExperienceDir() {
  if (!fs.existsSync(EXPERIENCE_DIR)) {
    fail(`missing ${path.relative(repoRoot, EXPERIENCE_DIR)}`);
    return;
  }
  const stack = [EXPERIENCE_DIR];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "__tests__") continue;
        stack.push(p);
      } else if (ent.isFile() && ent.name.endsWith(".js")) {
        const rel = path.relative(repoRoot, p).split(path.sep).join("/");
        scanFileForForbiddenImports(p, rel);
      }
    }
  }
}

function assertSharedStateInvariant() {
  const text = read(SPIRAL_AGREEMENT_FILE);
  if (!text) {
    fail(`missing ${path.relative(repoRoot, SPIRAL_AGREEMENT_FILE)}`);
    return;
  }
  const matches = text.match(/sharedState:\s*false/g);
  if (!matches || matches.length < 3) {
    fail(
      "spiralMMOAgreementLayerV0.js must keep sharedState: false in all branches (proto mesh + merge); static invariant weakened"
    );
  }
  if (!/No\s+WAL|shared execution/i.test(text)) {
    fail("spiralMMOAgreementLayerV0.js must document no-WAL / no-execution boundary in source");
  }
}

function scanAppEntry() {
  const rel = path.relative(repoRoot, APP_ENTRY).split(path.sep).join("/");
  scanFileForForbiddenImports(APP_ENTRY, rel);
}

function main() {
  assertSharedStateInvariant();
  scanExperienceDir();
  scanAppEntry();

  if (failed) {
    console.error("[SPIRAL_RHIZOH_BOUNDARY_V1] FAILED — see PRODUCT_LAUNCH_GAP_FINAL_FOUR_V1.0.md §4");
    process.exit(1);
  }
  console.log("[SPIRAL_RHIZOH_BOUNDARY_V1] ok — experience path isolated from Spiral execution imports");
}

main();
