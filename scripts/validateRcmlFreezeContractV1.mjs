/**
 * RCML Freeze Contract v1.0 — static UI ↔ Model boundary enforcement.
 *
 * Guarantees RCML model logic cannot land in UI membrane files.
 *
 * @see apps/client/docs/RCML_FREEZE_CONTRACT_V1.0.md
 * @see apps/client/docs/RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md
 *
 * Run: node scripts/validateRcmlFreezeContractV1.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const CLIENT_SRC = path.join(repoRoot, "apps", "client", "src");
const EXPERIENCE_DIR = path.join(CLIENT_SRC, "rhizoh", "experience");

const UI_MEMBRANE_REL = "apps/client/src/components/RhizohLivingWorldEntryShell.jsx";
const MOUNT_REL = "apps/client/src/AppRhizoh528.jsx";

const RCML_MAP_REL = "apps/client/docs/RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md";
const CONTRACT_REL = "apps/client/docs/RCML_FREEZE_CONTRACT_V1.0.md";

/** Sole .jsx allowed to import rhizoh/experience/ */
const RCML_MOUNT_JSX_ALLOWLIST = new Set([MOUNT_REL]);

const RCML_CORE_MODULES = [
  "identityDriftBindingV0.js",
  "perceptualEntropyEconomyV0.js",
  "worldDriftCalibrationV0.js",
  "worldMutationFeedbackV0.js",
  "crossSessionWorldCoherenceV0.js",
  "passivePerceptionFieldCoherenceV0.js",
  "spiralMMOAgreementLayerV0.js",
  "rhizohLivingWorldEntryOrchestratorV0.js"
];

const UI_FORBIDDEN_IMPORT_RE = /\bfrom\s+["'][^"']*\/rhizoh\/experience\/[^"']+["']/;

const UI_FORBIDDEN_SUBSTRINGS = [
  "sessionStorage",
  "localStorage",
  "recordWorldMutationV0",
  "buildRhizohLivingWorldEntryModelV0",
  "spendEntropyWithEconomyV0",
  "applyWorldDriftCalibrationV0",
  "bindIdentityDriftContextV0",
  "writeWorldMutationLedgerV0",
  "readWorldMutationLedgerV0",
  "hydrateCrossSessionCoherenceV0",
  "sealCrossSessionCoherenceAnchorV0",
  "deriveSpiralMMOAgreementLayerV0",
  "DRIFT_INTENSITY_CAP",
  "PERCEPTUAL_ENTROPY_BUDGET",
  "ENTROPY_RECHARGE"
];

const MOUNT_FORBIDDEN_IMPORTS = [
  "applyWorldDriftCalibrationV0",
  "spendEntropyWithEconomyV0",
  "applyAttentionDecayToMutationV0",
  "writeWorldMutationLedgerV0",
  "applyEntropyRechargeV0",
  "measureFeltDriftMagnitudeV0"
];

const UI_EXTENSIONS = new Set([".jsx", ".tsx"]);
const EXPERIENCE_IMPORT_RE = /\bfrom\s+["']([^"']*\/rhizoh\/experience\/[^"']+)["']/g;

let failed = false;

function fail(msg) {
  failed = true;
  console.error(`[RCML_FREEZE_V1] ${msg}`);
}

function relPosix(abs) {
  return path.relative(repoRoot, abs).split(path.sep).join("/");
}

function readText(abs) {
  try {
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
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

function assertDocsExist() {
  for (const rel of [RCML_MAP_REL, CONTRACT_REL]) {
    if (!fs.existsSync(path.join(repoRoot, rel))) {
      fail(`missing SSOT doc: ${rel}`);
    }
  }
}

function assertRcmlModulesExist() {
  for (const name of RCML_CORE_MODULES) {
    const abs = path.join(EXPERIENCE_DIR, name);
    if (!fs.existsSync(abs)) {
      fail(`missing RCML core module: ${relPosix(abs)}`);
    }
  }
}

function scanUiMembrane() {
  const abs = path.join(repoRoot, UI_MEMBRANE_REL);
  const text = readText(abs);
  if (!text) {
    fail(`missing UI membrane: ${UI_MEMBRANE_REL}`);
    return;
  }
  if (UI_FORBIDDEN_IMPORT_RE.test(text)) {
    fail(`${UI_MEMBRANE_REL}: must not import rhizoh/experience (UI membrane)`);
  }
  for (const tok of UI_FORBIDDEN_SUBSTRINGS) {
    if (text.includes(tok)) {
      fail(`${UI_MEMBRANE_REL}: forbidden token "${tok}" in UI membrane`);
    }
  }
  if (!text.includes("data-rhizoh-living-entry-shell")) {
    fail(`${UI_MEMBRANE_REL}: missing data-rhizoh-living-entry-shell marker`);
  }
}

function scanMount() {
  const abs = path.join(repoRoot, MOUNT_REL);
  const text = readText(abs);
  if (!text) {
    fail(`missing RCML mount: ${MOUNT_REL}`);
    return;
  }
  if (!text.includes("data-rhizoh-canonical-entry")) {
    fail(`${MOUNT_REL}: missing data-rhizoh-canonical-entry marker`);
  }
  if (!text.includes("buildRhizohLivingWorldEntryModelV0")) {
    fail(`${MOUNT_REL}: mount must compose model via buildRhizohLivingWorldEntryModelV0`);
  }
  if (!text.includes("recordWorldMutationV0")) {
    fail(`${MOUNT_REL}: mount must wire recordWorldMutationV0 (not inline RCML math)`);
  }
  for (const tok of MOUNT_FORBIDDEN_IMPORTS) {
    if (text.includes(tok)) {
      fail(`${MOUNT_REL}: mount must not import/call low-level RCML helper "${tok}"`);
    }
  }
}

function scanJsxExperienceImports() {
  const files = [];
  walkFiles(CLIENT_SRC, files);
  for (const abs of files) {
    const ext = path.extname(abs);
    if (!UI_EXTENSIONS.has(ext)) continue;
    const rel = relPosix(abs);
    if (rel.includes("__tests__/")) continue;
    const text = readText(abs);
    if (!text) continue;
    let m;
    EXPERIENCE_IMPORT_RE.lastIndex = 0;
    while ((m = EXPERIENCE_IMPORT_RE.exec(text))) {
      if (!RCML_MOUNT_JSX_ALLOWLIST.has(rel)) {
        fail(`${rel}: only AppRhizoh528.jsx may import rhizoh/experience — found "${m[1]}"`);
      }
    }
  }
}

function scanModelUpwardImports() {
  const files = [];
  walkFiles(EXPERIENCE_DIR, files);
  for (const abs of files) {
    const rel = relPosix(abs);
    if (rel.includes("__tests__/")) continue;
    if (!abs.endsWith(".js")) continue;
    const text = readText(abs);
    if (!text) continue;
    if (/\bfrom\s+["'][^"']+\.jsx["']/.test(text) || /\bfrom\s+["'][^"']+\.tsx["']/.test(text)) {
      fail(`${rel}: RCML model must not import React UI (.jsx/.tsx)`);
    }
    if (text.includes("RhizohLivingWorldEntryShell")) {
      fail(`${rel}: RCML model must not reference RhizohLivingWorldEntryShell`);
    }
  }
}

function main() {
  assertDocsExist();
  assertRcmlModulesExist();
  scanUiMembrane();
  scanMount();
  scanJsxExperienceImports();
  scanModelUpwardImports();

  if (failed) {
    console.error("[RCML_FREEZE_V1] FAILED — see RCML_FREEZE_CONTRACT_V1.0.md");
    process.exit(1);
  }
  console.log("[RCML_FREEZE_V1] ok — UI membrane · mount · model isolation");
}

main();
