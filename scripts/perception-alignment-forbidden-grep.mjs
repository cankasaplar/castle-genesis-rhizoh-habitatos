#!/usr/bin/env node
/**
 * Perception alignment firewall — P2-F01…F05 architectural memory guard.
 * @see docs/CAMERA_UNIFICATION_SPEC_V1.md §4.2 · Step 2.3
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const scanRoot = join(root, "apps/client/src");

const EXEMPT_SEGMENTS = ["__tests__", "__research__"];

/** Orchestrator may host habitat derivation + user spatial routing in separate paths. */
const ORCHESTRATOR_ALLOWLIST = new Set([
  "apps/client/src/AppRhizoh528T0.jsx",
  "apps/client/src/AppRhizoh528.jsx",
  "apps/client/src/AppRhizoh528LivingEntry.jsx"
]);

/** Alignment mirror writers/readers — observation only. */
const ALIGNMENT_MIRROR_ALLOWLIST = new Set([
  "apps/client/src/castleFlight/perceptionAlignmentSnapshotV0.js",
  "apps/client/src/castleFlight/usePerceptionAlignmentSnapshotV0.js",
  "apps/client/src/castleFlight/perceptionAlignmentObservationV0.js",
  "apps/client/src/components/PerceptionAlignmentObservationStripV0.jsx",
  "apps/client/src/components/RhizohT0ShellChromeV1.jsx"
]);

/** P2-F01 — presentation/habitat must not become spatial execution ingress. */
const P2_F01_PRESENTATION_FILES = new Set([
  "apps/client/src/rhizoh/runtime/rhizohHabitatFocusModeV0.js",
  "apps/client/src/components/RhizohT0ShellChromeV1.jsx",
  "apps/client/src/components/PerceptionAlignmentObservationStripV0.jsx",
  "apps/client/src/castleFlight/perceptionAlignmentSnapshotV0.js",
  "apps/client/src/castleFlight/usePerceptionAlignmentSnapshotV0.js",
  "apps/client/src/castleFlight/perceptionAlignmentObservationV0.js"
]);

/** P2-F02 — cognitive Octo camera must not read Cesium geo. */
const P2_F02_OCTO_COGNITIVE_FILES = new Set([
  "apps/client/src/studio/octoCubeCentricCameraV1.js",
  "apps/client/src/studio/OctoConversationStageV1.jsx",
  "apps/client/src/studio/octoConversationMotionV1.js"
]);

const P2_F02_CESIUM_READ_RES = [
  { id: "getCameraGeo", re: /getCameraGeo/ },
  { id: "__CASTLE_CESIUM__", re: /__CASTLE_CESIUM__/ },
  { id: "readSpatialLensSnapshotV0", re: /readSpatialLensSnapshotV0/ },
  { id: "getCesiumExecutorApiV0", re: /getCesiumExecutorApiV0/ },
  { id: "cesiumCommandExecutorV0", re: /cesiumCommandExecutorV0/ }
];

/** P2-F03 — Octo journal/inbox observation must not route spatial commands. */
const P2_F03_OBSERVATION_FILES = new Set([
  "apps/client/src/studio/octoObservationReportV0.js",
  "apps/client/src/studio/octoJournalV0.js",
  "apps/client/src/studio/rhizohObservationInboxCouplingV0.js",
  "apps/client/src/studio/cubeTopologyOwnershipInvariantV0.js",
  "apps/client/src/studio/regimeDistanceMetricV0.js"
]);

/** P2-F04 — layout (octo height) must not enter spatial executor spine. */
const P2_F04_SPATIAL_EXECUTION_FILES = new Set([
  "apps/client/src/castleFlight/cesiumCommandExecutorV0.js",
  "apps/client/src/castleFlight/cesiumCommandRouterV0.js",
  "apps/client/src/castleFlight/CesiumRealMapLayer.jsx",
  "apps/client/src/rhizoh/runtime/rhizohWorldMapToolV0.js",
  "apps/client/src/castleFlight/worldFirstObservationV0.js"
]);

const P2_F04_LAYOUT_RES = [
  { id: "octoHeightPx", re: /octoHeightPx/ },
  { id: "resolveRhizohHabitatFocusVisualsV0", re: /resolveRhizohHabitatFocusVisualsV0/ },
  { id: "habitatFocusVisuals", re: /habitatFocusVisuals/ }
];

/** P2-F05 — mount isolation; no cross-mount field sync or alignment mirror influence. */
const P2_F05_MOUNT_FILES = new Set([
  "apps/client/src/studio/OctoConversationStageV1.jsx",
  "apps/client/src/studio/OctoConversationLabPageV1.jsx",
  "apps/client/src/components/RhizohConversationDockV0.jsx"
]);

const P2_F05_CROSS_MOUNT_RES = [
  { id: "syncOctoMount", re: /syncOctoMount/ },
  { id: "sharedOctoField", re: /sharedOctoField/ },
  { id: "borrowMountField", re: /borrowMountField/ },
  { id: "importAppRhizoh528T0", re: /from\s+["'].*AppRhizoh528T0/ }
];

const ROUTE_CESIUM_RE = /routeCesiumCommandV0/;
const HABITAT_FOCUS_RE =
  /resolveRhizohHabitatFocusModeV0|habitatFocusMode|habitatFocusVisuals|resolveRhizohHabitatFocusVisualsV0/;
const ALIGNMENT_MIRROR_RE = /__CASTLE_PERCEPTION_ALIGNMENT__/;
const PUBLISH_ALIGNMENT_RE = /publishPerceptionAlignmentSnapshotV0/;
const DRIFT_INFLUENCE_RE = /semanticDriftRisk/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs|cjs|ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

function isExempt(rel) {
  return EXEMPT_SEGMENTS.some((s) => rel.includes(s));
}

function lineHits(text, rules) {
  const failures = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of rules) {
      if (rule.re.test(line)) {
        failures.push({
          lineNo: i + 1,
          rule: rule.id,
          text: line.trim()
        });
      }
    }
  }
  return failures;
}

function scanFile(rel, text) {
  const failures = [];

  if (P2_F01_PRESENTATION_FILES.has(rel)) {
    for (const hit of lineHits(text, [{ id: "P2-F01", re: ROUTE_CESIUM_RE }])) {
      failures.push({ ...hit, rule: "P2-F01" });
    }
  }

  if (!ORCHESTRATOR_ALLOWLIST.has(rel) && HABITAT_FOCUS_RE.test(text) && ROUTE_CESIUM_RE.test(text)) {
    failures.push({
      lineNo: 1,
      rule: "P2-F01",
      text: "file couples habitat focus with routeCesiumCommandV0"
    });
  }

  if (P2_F02_OCTO_COGNITIVE_FILES.has(rel)) {
    for (const hit of lineHits(text, P2_F02_CESIUM_READ_RES.map((r) => ({ ...r, id: `P2-F02:${r.id}` })))) {
      failures.push({ ...hit, rule: hit.rule || "P2-F02" });
    }
  }

  if (P2_F03_OBSERVATION_FILES.has(rel)) {
    for (const hit of lineHits(text, [
      { id: "P2-F03:routeCesiumCommandV0", re: ROUTE_CESIUM_RE },
      { id: "P2-F03:cesiumCommandExecutorV0", re: /cesiumCommandExecutorV0/ }
    ])) {
      failures.push({ ...hit, rule: "P2-F03" });
    }
  }

  if (P2_F04_SPATIAL_EXECUTION_FILES.has(rel)) {
    for (const hit of lineHits(text, P2_F04_LAYOUT_RES.map((r) => ({ ...r, id: `P2-F04:${r.id}` })))) {
      failures.push({ ...hit, rule: "P2-F04" });
    }
  }

  if (!ORCHESTRATOR_ALLOWLIST.has(rel) && /octoHeightPx/.test(text) && ROUTE_CESIUM_RE.test(text)) {
    failures.push({
      lineNo: 1,
      rule: "P2-F04",
      text: "file couples octoHeightPx with routeCesiumCommandV0"
    });
  }

  if (P2_F05_MOUNT_FILES.has(rel)) {
    for (const hit of lineHits(text, P2_F05_CROSS_MOUNT_RES.map((r) => ({ ...r, id: `P2-F05:${r.id}` })))) {
      failures.push({ ...hit, rule: "P2-F05" });
    }
    for (const hit of lineHits(text, [{ id: "P2-F05:alignmentMirrorRead", re: ALIGNMENT_MIRROR_RE }])) {
      failures.push({ ...hit, rule: "P2-F05" });
    }
  }

  if (!ALIGNMENT_MIRROR_ALLOWLIST.has(rel) && ALIGNMENT_MIRROR_RE.test(text)) {
    for (const hit of lineHits(text, [{ id: "P2-F05:alignmentMirrorLeak", re: ALIGNMENT_MIRROR_RE }])) {
      failures.push({ ...hit, rule: "P2-F05" });
    }
  }

  if (
    !ALIGNMENT_MIRROR_ALLOWLIST.has(rel) &&
    PUBLISH_ALIGNMENT_RE.test(text)
  ) {
    for (const hit of lineHits(text, [{ id: "P2-F05:alignmentPublishLeak", re: PUBLISH_ALIGNMENT_RE }])) {
      failures.push({ ...hit, rule: "P2-F05" });
    }
  }

  if (!ORCHESTRATOR_ALLOWLIST.has(rel) && DRIFT_INFLUENCE_RE.test(text) && ROUTE_CESIUM_RE.test(text)) {
    failures.push({
      lineNo: 1,
      rule: "P2-F05",
      text: "semanticDriftRisk must not influence spatial routing"
    });
  }

  return failures;
}

function scan() {
  const failures = [];
  for (const file of walk(scanRoot)) {
    const rel = relative(root, file).replace(/\\/g, "/");
    if (isExempt(rel)) continue;
    const text = readFileSync(file, "utf8");
    for (const f of scanFile(rel, text)) {
      failures.push({ rel, ...f });
    }
  }
  return failures;
}

const failures = scan();

if (failures.length) {
  console.error(`[perception-alignment-forbidden] ${failures.length} violation(s):`);
  for (const f of failures) {
    console.error(`  FAIL ${f.rel}:${f.lineNo} ${f.rule} — ${f.text}`);
  }
  process.exit(1);
}

console.log("[perception-alignment-forbidden] OK — P2-F01…F05 firewall clean");
