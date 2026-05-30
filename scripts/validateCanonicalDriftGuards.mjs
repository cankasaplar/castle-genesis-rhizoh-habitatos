/**
 * Canonical Drift Guard Pack (v0)
 *
 * - Semantic reintroduction: forbidden UI dual-write token in app/package source + docs.
 * - Import boundary: delegates to validateFreezeIdentityBoundary.mjs.
 * - Interaction Geometry package (if present): validateInteractionGeometryBoundaryV0.mjs.
 * - Projection contract v0 self-test: validateProjectionContractV0.mjs (Vitest suite lives under client).
 * - Doc canonical link: required Rhizoh runtime docs must reference the SSOT markdown.
 * - Snapshot shape: runtimeSnapshotV1 top-level keys lock vs source (shared parse).
 *
 * Does not replace validateStabilizationGraph.mjs.
 *
 * --- Policy evolution guardrails (avoid guard / doc creep) ---
 * - Do not add broad regexes or a growing list of forbidden tokens here without an explicit
 *   review pass (false-positive budget). One narrowly-scoped dual-write token is intentional.
 * - DOCS_REQUIRING_CANONICAL_LINK is intentionally small (3). Do not add paths ad hoc; extend
 *   inventory / frame / flow docs instead of pulling more files into mandatory backlink CI.
 * - Snapshot: prefer nested fields under existing objects before adding new top-level keys;
 *   when top-level keys change, run: `node scripts/syncRuntimeSnapshotV1TopLevelLock.mjs`.
 *
 * Local lighter gate (no typecheck/tests): `npm run stabilization:validate-client-boundaries-quick`.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { extractTopLevelSnapKeysFromSource } from "./runtimeSnapshotV1SnapBlockParse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

/** Avoid literal in this file so self-scan / repo-wide grep stays clean. */
const FORBIDDEN_UI_DUAL_WRITE = `${"selected"}${"Connection"}${"Id"}`;

const CANONICAL_DOC_MARKER = "RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md";

/**
 * Identity / frame docs that must carry a link to the canonical SSOT doc.
 * Intentionally frozen at three — add only after consolidating elsewhere (canonical overload).
 */
const DOCS_REQUIRING_CANONICAL_LINK = [
  "docs/RHIZOH_SESSION_IDENTITY_INVENTORY_V0.md",
  "docs/RHIZOH_RUNTIME_FRAME_CORRELATION_V0.md",
  "docs/RHIZOH_RUNTIME_IDENTITY_RESOLUTION_FLOW_V0.md"
];

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);

let failed = false;

function fail(msg) {
  failed = true;
  console.error(`[CANONICAL_DRIFT] ${msg}`);
}

function walkFiles(rootDir, out) {
  if (!fs.existsSync(rootDir)) return;
  for (const ent of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const p = path.join(rootDir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist" || ent.name === ".git" || ent.name === "build") continue;
      walkFiles(p, out);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name);
      if (SOURCE_EXTENSIONS.has(ext)) out.push(p);
    }
  }
}

function scanForbiddenToken(paths, label) {
  for (const abs of paths) {
    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    if (!text.includes(FORBIDDEN_UI_DUAL_WRITE)) continue;
    fail(`${label}: forbidden token "${FORBIDDEN_UI_DUAL_WRITE}" — ${path.relative(repoRoot, abs)}`);
  }
}

function walkMarkdownFiles(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkMarkdownFiles(p, out);
    else if (ent.isFile() && ent.name.endsWith(".md")) out.push(p);
  }
}

function scanDocsForbidden() {
  const docsDir = path.join(repoRoot, "docs");
  const mdFiles = [];
  walkMarkdownFiles(docsDir, mdFiles);
  for (const abs of mdFiles) {
    const text = fs.readFileSync(abs, "utf8");
    if (text.includes(FORBIDDEN_UI_DUAL_WRITE)) {
      fail(`docs: forbidden token in ${path.relative(repoRoot, abs)} (remove or describe without the legacy identifier)`);
    }
  }
}

function validateDocCanonicalLinks() {
  for (const rel of DOCS_REQUIRING_CANONICAL_LINK) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) {
      fail(`missing required doc for canonical link check: ${rel}`);
      continue;
    }
    const text = fs.readFileSync(abs, "utf8");
    if (!text.includes(CANONICAL_DOC_MARKER)) {
      fail(`${rel}: must reference ${CANONICAL_DOC_MARKER}`);
    }
  }
}

function validateSnapshotTopLevelLock() {
  const lockPath = path.join(repoRoot, "scripts", "runtimeSnapshotV1.topLevelKeys.lock.json");
  if (!fs.existsSync(lockPath)) {
    fail("missing scripts/runtimeSnapshotV1.topLevelKeys.lock.json");
    return;
  }
  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  } catch (e) {
    fail(`invalid JSON: ${lockPath} — ${e?.message || e}`);
    return;
  }
  const keys = lock.topLevelKeys;
  if (!Array.isArray(keys) || keys.length === 0) {
    fail("runtimeSnapshotV1.topLevelKeys.lock.json: topLevelKeys must be a non-empty array");
    return;
  }
  const sorted = [...keys].sort();
  if (JSON.stringify(keys) !== JSON.stringify(sorted)) {
    fail("runtimeSnapshotV1.topLevelKeys.lock.json: topLevelKeys must be sorted alphabetically");
  }
  const uniq = new Set(keys);
  if (uniq.size !== keys.length) {
    fail("runtimeSnapshotV1.topLevelKeys.lock.json: duplicate keys");
  }

  const snapPath = path.join(repoRoot, "apps", "client", "src", "rhizoh", "runtime", "runtimeSnapshotV1.js");
  if (!fs.existsSync(snapPath)) {
    fail("missing apps/client/src/rhizoh/runtime/runtimeSnapshotV1.js");
    return;
  }
  const src = fs.readFileSync(snapPath, "utf8");
  const parsed = extractTopLevelSnapKeysFromSource(src);
  if (!parsed.ok) {
    fail("runtimeSnapshotV1.js: could not parse `const snap = { ... };` block before logRuntimeSnapshotValidationIssues");
    return;
  }
  const found = new Set(parsed.keys);
  const expected = new Set(keys);
  for (const k of expected) {
    if (!found.has(k)) fail(`snapshot drift: lock expects top-level key "${k}" but not found in runtimeSnapshotV1.js snap block`);
  }
  for (const k of found) {
    if (!expected.has(k)) fail(`snapshot drift: source snap block has unexpected top-level key "${k}" — update scripts/runtimeSnapshotV1.topLevelKeys.lock.json`);
  }
}

// --- run ---

const appSrcRoots = [
  "apps/client/src",
  "apps/gateway/src",
  "apps/kernel/src",
  "apps/sfu/src",
  "apps/broadcaster/src",
  "apps/orchestrator/src",
  "apps/sim-core/src",
  "apps/worker/src"
].map((r) => path.join(repoRoot, r));

const pkgFiles = [];
for (const pkg of ["packages/protocol/src", "packages/command-dsl/src"]) {
  walkFiles(path.join(repoRoot, pkg), pkgFiles);
}

const appFiles = [];
for (const root of appSrcRoots) {
  walkFiles(root, appFiles);
}

scanForbiddenToken(appFiles, "apps/src");
scanForbiddenToken(pkgFiles, "packages/src");

scanDocsForbidden();

validateDocCanonicalLinks();

validateSnapshotTopLevelLock();

try {
  execSync("node scripts/validateFreezeIdentityBoundary.mjs", { cwd: repoRoot, stdio: "inherit" });
} catch {
  failed = true;
}

try {
  execSync("node scripts/validateInteractionGeometryBoundaryV0.mjs", { cwd: repoRoot, stdio: "inherit" });
} catch {
  failed = true;
}

try {
  execSync("node scripts/validateProjectionContractV0.mjs", { cwd: repoRoot, stdio: "inherit" });
} catch {
  failed = true;
}

if (failed) {
  process.exit(1);
}
console.log("[CANONICAL_DRIFT] ok");
