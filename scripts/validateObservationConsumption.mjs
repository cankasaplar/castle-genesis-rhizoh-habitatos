/**
 * PR-2.6 — Observation consumption firewall (static guard).
 *
 * - Any import of `atmosphereRuntimeSnapshotV0` from `apps/client/src` must come only from allowlisted files.
 * - `getObservationEnvelopeForUiV0` / `setObservationEnvelopeForUiV0` identifiers must not appear outside
 *   their defining module + single consumer / producer (prevents UI payload bypass).
 *
 * Run: `npm run stabilization:validate-observation-consumption`
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const SNAPSHOT_MODULE_RE = /from\s+["']([^"']*atmosphereRuntimeSnapshotV0(?:\.js)?)["']/;

const GET = "getObservationEnvelopeForUiV0";
const SET = "setObservationEnvelopeForUiV0";
const getRe = new RegExp(`\\b${GET}\\b`);
const setRe = new RegExp(`\\b${SET}\\b`);

/** posix paths from repo root */
const ALLOW_SNAPSHOT_IMPORTERS = new Set([
  "apps/client/src/rhizoh/runtime/atmosphereRuntimeSnapshotV0.js",
  "apps/client/src/rhizoh/runtime/RhizohAtmosphereRenderer.jsx",
  "apps/client/src/rhizoh/runtime/RhizohAtmosphereRuntime.jsx",
  "apps/client/src/rhizoh/runtime/liveRuntimeOrchestratorV0.js"
]);

const ALLOW_GET = new Set([
  "apps/client/src/rhizoh/runtime/atmosphereRuntimeSnapshotV0.js",
  "apps/client/src/rhizoh/runtime/RhizohAtmosphereRenderer.jsx"
]);

const ALLOW_SET = new Set([
  "apps/client/src/rhizoh/runtime/atmosphereRuntimeSnapshotV0.js",
  "apps/client/src/rhizoh/runtime/RhizohAtmosphereRuntime.jsx"
]);

const EXT = new Set([".js", ".jsx"]);

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function walkFiles(rootDir, out) {
  for (const ent of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const p = path.join(rootDir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist" || ent.name === "__tests__") continue;
      walkFiles(p, out);
    } else if (ent.isFile() && EXT.has(path.extname(ent.name))) {
      const bn = ent.name.toLowerCase();
      if (bn.includes(".test.") || bn.includes(".spec.")) continue;
      out.push(p);
    }
  }
}

function main() {
  const scanRoot = path.join(repoRoot, "apps", "client", "src");
  const files = [];
  if (fs.existsSync(scanRoot)) walkFiles(scanRoot, files);

  /** @type {{ rel: string, rule: string }[]} */
  const violations = [];

  for (const abs of files) {
    const rel = toPosix(path.relative(repoRoot, abs));
    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    if (SNAPSHOT_MODULE_RE.test(text) && !ALLOW_SNAPSHOT_IMPORTERS.has(rel)) {
      violations.push({ rel, rule: "forbidden import of atmosphereRuntimeSnapshotV0" });
    }

    if (getRe.test(text) && !ALLOW_GET.has(rel)) {
      violations.push({ rel, rule: `forbidden reference to ${GET}` });
    }
    if (setRe.test(text) && !ALLOW_SET.has(rel)) {
      violations.push({ rel, rule: `forbidden reference to ${SET}` });
    }
  }

  if (violations.length) {
    console.error("\n[OBSERVATION_CONSUMPTION_FIREWALL] Violations:\n");
    for (const v of violations) {
      console.error(`  - ${v.rel}\n    ${v.rule}\n`);
    }
    process.exit(1);
  }
  console.log("[OBSERVATION_CONSUMPTION_FIREWALL] OK — envelope API confined to allowlisted modules.");
}

main();
