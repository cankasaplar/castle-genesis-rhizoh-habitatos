/**
 * MEMBRANE INTEGRITY PASS V0 — WorldPresence → UI coupling audit (static).
 *
 * Goal: catch **identity authority** tokens or resolver imports in React surfaces and
 * **world presence** accidentally importing identity resolution.
 *
 * Not a semantic AST engine; narrow substring + import-path rules with a small allowlist budget.
 *
 * @see docs/MEMBRANE_INTEGRITY_PASS_V0.md
 *
 * Run: node scripts/membraneIntegrityPassV0.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const CLIENT_SRC = path.join(repoRoot, "apps", "client", "src");

/** React / UI surfaces scanned for identity-token leakage. */
const UI_EXTENSIONS = new Set([".jsx", ".tsx"]);

/** Identity / resolver modules must not be imported from UI files. */
const FORBIDDEN_UI_IMPORT_RE = /from\s+["']([^"']*(?:primaryAnchorResolverV0|homeAnchorAuthorityV0|anchorTruthTableV0)\.js[^"']*)["']/;

/** Substrings that must not appear in UI membrane files (comments included — keep surface clean). */
const FORBIDDEN_UI_SUBSTRINGS = [
  "HOME_BASE",
  "userHomeAnchor",
  "resolvePrimaryAnchorForIdentityV0",
  "primaryAnchorResolverV0",
  "homeAnchorAuthorityV0",
  "anchorTruthTableV0"
];

/** Optional: block hardcoded identity-demo district names in UI (world POI labels live in `castleFlight/geo.js`). */
const FORBIDDEN_UI_PLACE_FALLBACKS = ["Serencebey", "Sarıyer"];

const WORLD_PRESENCE_REL = path.join("apps", "client", "src", "rhizoh", "runtime", "worldPresenceRuntimeV0.js");

/** Camera ↔ profile coupling heuristic (outside `rhizoh/spatial/`). */
const CAMERA_HOME_ANCHOR_RE = /(?:camera|viewer|scene)\.[\w$]*\s*=\s*[^;\n]*homeAnchor/i;

let failed = false;

function fail(msg) {
  failed = true;
  console.error(`[MEMBRANE_V0] ${msg}`);
}

function walkFiles(rootDir, out) {
  if (!fs.existsSync(rootDir)) return;
  for (const ent of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const p = path.join(rootDir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist" || ent.name === ".git") continue;
      walkFiles(p, out);
    } else if (ent.isFile()) {
      out.push(p);
    }
  }
}

function relPosix(abs) {
  return path.relative(repoRoot, abs).split(path.sep).join("/");
}

function isMembraneUiFile(abs) {
  const rel = relPosix(abs);
  if (rel.includes("__tests__/") || rel.includes("/__tests__/")) return false;
  if (rel.includes("/rhizoh/spatial/")) return false;
  const ext = path.extname(abs);
  return UI_EXTENSIONS.has(ext);
}

function scanMembraneUiFiles() {
  const files = [];
  walkFiles(CLIENT_SRC, files);
  for (const abs of files) {
    if (!isMembraneUiFile(abs)) continue;
    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    const rel = relPosix(abs);
    for (const tok of FORBIDDEN_UI_SUBSTRINGS) {
      if (text.includes(tok)) {
        fail(`UI membrane: forbidden token "${tok}" — ${rel}`);
      }
    }
    for (const place of FORBIDDEN_UI_PLACE_FALLBACKS) {
      if (text.includes(place)) {
        fail(`UI membrane: forbidden place fallback "${place}" — ${rel} (use world/geo data tables, not UI literals)`);
      }
    }
    const m = text.match(FORBIDDEN_UI_IMPORT_RE);
    if (m) {
      fail(`UI membrane: forbidden identity resolver import — ${rel} (${m[1]})`);
    }
  }
}

function scanWorldPresenceIsolation() {
  const abs = path.join(repoRoot, WORLD_PRESENCE_REL);
  if (!fs.existsSync(abs)) {
    fail(`missing ${WORLD_PRESENCE_REL}`);
    return;
  }
  const text = fs.readFileSync(abs, "utf8");
  for (const tok of ["HOME_BASE", "userHomeAnchor", "resolvePrimaryAnchorForIdentityV0", "primaryAnchorResolverV0"]) {
    if (text.includes(tok)) {
      fail(`worldPresenceRuntimeV0 must not reference identity resolution token "${tok}"`);
    }
  }
  if (/from\s+["'][^"']*primaryAnchorResolverV0\.js["']/.test(text)) {
    fail("worldPresenceRuntimeV0 must not import primaryAnchorResolverV0");
  }
}

function scanCameraProfileCouplingHeuristic() {
  const roots = [
    path.join(CLIENT_SRC, "castleFlight"),
    path.join(CLIENT_SRC, "rhizoh", "runtime"),
    path.join(CLIENT_SRC, "studio"),
    path.join(CLIENT_SRC, "components"),
    path.join(CLIENT_SRC, "shell"),
    path.join(CLIENT_SRC, "auth")
  ];
  const files = [];
  for (const r of roots) {
    if (fs.existsSync(r)) walkFiles(r, files);
  }
  for (const abs of files) {
    const rel = relPosix(abs);
    if (rel.includes("__tests__/")) continue;
    if (rel.includes("/rhizoh/spatial/")) continue;
    const ext = path.extname(abs);
    if (![".js", ".jsx", ".tsx"].includes(ext)) continue;
    const text = fs.readFileSync(abs, "utf8");
    if (CAMERA_HOME_ANCHOR_RE.test(text)) {
      fail(`possible camera ↔ homeAnchor coupling — ${rel} (keep viewport in projection locality only)`);
    }
  }
}

scanMembraneUiFiles();
scanWorldPresenceIsolation();
scanCameraProfileCouplingHeuristic();

if (failed) {
  process.exit(1);
}
console.log("[MEMBRANE_V0] ok — UI membrane + worldPresence isolation + camera/home heuristic");
