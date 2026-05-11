/**
 * Frozen epistemic core (v562–v570): parse static imports under apps/client/src/ghost,
 * enforce DAG (no cycles), strictly downward layer order, expected intra-core edges,
 * and STABILIZATION_GRAPH.md SHA256 (scripts/stabilization-graph.sha256.lock).
 *
 * Run: node scripts/validateStabilizationGraph.mjs
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const GHOST_DIR = join(REPO_ROOT, "apps", "client", "src", "ghost");
const GRAPH_DOC_PATH = join(REPO_ROOT, "STABILIZATION_GRAPH.md");
const GRAPH_HASH_LOCK_PATH = join(REPO_ROOT, "scripts", "stabilization-graph.sha256.lock");

/** Layer order: higher index = higher layer; imports must only target strictly lower indices. */
const CORE_PHASE_FILES = Object.freeze([
  "phaseIdentityAndCollapseV562.js",
  "phaseConstraintKernelV563.js",
  "phaseConstraintAdaptationV564.js",
  "phaseConstraintEquilibriumAnchorV565.js",
  "phaseAnchorPlasticityV566.js",
  "phaseObservationControlCouplingV567.js",
  "phaseObservationTrustCalibrationV568.js",
  "phaseTrustCalibrationDriftV569.js",
  "phaseEpistemicErrorSemanticsV570.js"
]);

/** Canonical intra-core import edges (must match STABILIZATION_GRAPH.md). */
const EXPECTED_CORE_IMPORTS = Object.freeze({
  "phaseIdentityAndCollapseV562.js": [],
  "phaseConstraintKernelV563.js": ["phaseIdentityAndCollapseV562.js"],
  "phaseConstraintAdaptationV564.js": ["phaseConstraintKernelV563.js"],
  "phaseConstraintEquilibriumAnchorV565.js": ["phaseConstraintAdaptationV564.js", "phaseConstraintKernelV563.js"],
  "phaseAnchorPlasticityV566.js": [
    "phaseConstraintAdaptationV564.js",
    "phaseConstraintEquilibriumAnchorV565.js",
    "phaseConstraintKernelV563.js"
  ],
  "phaseObservationControlCouplingV567.js": [
    "phaseConstraintAdaptationV564.js",
    "phaseAnchorPlasticityV566.js",
    "phaseConstraintEquilibriumAnchorV565.js",
    "phaseConstraintKernelV563.js"
  ],
  "phaseObservationTrustCalibrationV568.js": [
    "phaseConstraintAdaptationV564.js",
    "phaseAnchorPlasticityV566.js",
    "phaseConstraintEquilibriumAnchorV565.js",
    "phaseObservationControlCouplingV567.js",
    "phaseConstraintKernelV563.js"
  ],
  "phaseTrustCalibrationDriftV569.js": [
    "phaseConstraintAdaptationV564.js",
    "phaseAnchorPlasticityV566.js",
    "phaseConstraintEquilibriumAnchorV565.js",
    "phaseObservationControlCouplingV567.js",
    "phaseObservationTrustCalibrationV568.js",
    "phaseConstraintKernelV563.js"
  ],
  "phaseEpistemicErrorSemanticsV570.js": ["phaseTrustCalibrationDriftV569.js"]
});

const coreSet = new Set(CORE_PHASE_FILES);
const layerIndex = new Map(CORE_PHASE_FILES.map((f, i) => [f, i]));

function normalizeLf(content) {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function stabilizationGraphDocumentSha256Hex() {
  if (!existsSync(GRAPH_DOC_PATH)) {
    throw new Error(`Missing ${GRAPH_DOC_PATH}`);
  }
  const raw = readFileSync(GRAPH_DOC_PATH, "utf8");
  return createHash("sha256").update(normalizeLf(raw), "utf8").digest("hex");
}

function readExpectedGraphHashLock() {
  if (!existsSync(GRAPH_HASH_LOCK_PATH)) {
    throw new Error(`Missing ${GRAPH_HASH_LOCK_PATH}`);
  }
  const line = readFileSync(GRAPH_HASH_LOCK_PATH, "utf8").trim().split(/\s+/)[0];
  if (!/^[a-f0-9]{64}$/.test(line)) {
    throw new Error(`Invalid graph hash lock line in ${GRAPH_HASH_LOCK_PATH}`);
  }
  return line;
}

function extractPhaseImports(source) {
  /** @type {Set<string>} */
  const out = new Set();
  const re = /["'](\.\/phase[A-Za-z0-9_]+\.js)["']/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    out.add(m[1]);
  }
  return [...out];
}

function resolvedCoreImports(fromFile) {
  const path = join(GHOST_DIR, fromFile);
  if (!existsSync(path)) {
    throw new Error(`Missing core file: ${path}`);
  }
  const src = readFileSync(path, "utf8");
  const rel = extractPhaseImports(src);
  /** @type {string[]} */
  const core = [];
  for (const r of rel) {
    const base = basename(r);
    if (coreSet.has(base)) core.push(base);
  }
  return core.sort();
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/** Adjacency: node → nodes it depends on (importer → importee). */
function buildAdjacency(actualMap) {
  /** @type {Map<string, Set<string>>} */
  const adj = new Map();
  for (const f of CORE_PHASE_FILES) {
    adj.set(f, new Set(actualMap.get(f) ?? []));
  }
  return adj;
}

function hasCycleDFS(node, adj, visiting, visited) {
  if (visited.has(node)) return false;
  if (visiting.has(node)) return true;
  visiting.add(node);
  for (const nxt of adj.get(node) ?? []) {
    if (hasCycleDFS(nxt, adj, visiting, visited)) return true;
  }
  visiting.delete(node);
  visited.add(node);
  return false;
}

function graphHasCycle(adj) {
  const visited = new Set();
  for (const node of adj.keys()) {
    if (hasCycleDFS(node, adj, new Set(), visited)) return true;
  }
  return false;
}

function validateForwardOnly(actualMap) {
  /** @type {string[]} */
  const bad = [];
  for (const [from, targets] of actualMap) {
    const iFrom = layerIndex.get(from);
    if (iFrom === undefined) continue;
    for (const to of targets) {
      const iTo = layerIndex.get(to);
      if (iTo === undefined) continue;
      if (!(iFrom > iTo)) {
        bad.push(`${from} → ${to} (layer ${iFrom} must be > ${iTo})`);
      }
    }
  }
  return bad;
}

function main() {
  if (!existsSync(GHOST_DIR)) {
    console.error(`validateStabilizationGraph: ghost dir missing: ${GHOST_DIR}`);
    process.exit(1);
  }

  let graphHashOk = true;
  try {
    const got = stabilizationGraphDocumentSha256Hex();
    const exp = readExpectedGraphHashLock();
    if (got !== exp) {
      graphHashOk = false;
      console.error("\nvalidateStabilizationGraph: STABILIZATION_GRAPH.md hash mismatch.");
      console.error(`  expected (lock): ${exp}`);
      console.error(`  actual (doc):    ${got}`);
      console.error(
        "  Regenerate lock: node scripts/print-stabilization-graph-hash.mjs > scripts/stabilization-graph.sha256.lock"
      );
    }
  } catch (e) {
    graphHashOk = false;
    console.error(`\nvalidateStabilizationGraph: graph hash lock error — ${e.message}`);
  }

  /** @type {Map<string, string[]>} */
  const actual = new Map();
  for (const f of CORE_PHASE_FILES) {
    actual.set(f, resolvedCoreImports(f));
  }

  /** Diff vs expected */
  let mismatch = false;
  for (const f of CORE_PHASE_FILES) {
    const exp = new Set(EXPECTED_CORE_IMPORTS[f] ?? []);
    const got = new Set(actual.get(f) ?? []);
    if (!setsEqual(exp, got)) {
      mismatch = true;
      const extra = [...got].filter((x) => !exp.has(x));
      const missing = [...exp].filter((x) => !got.has(x));
      console.error(`\n${f} intra-core imports differ from STABILIZATION_GRAPH lock:`);
      if (missing.length) console.error(`  missing: ${missing.join(", ")}`);
      if (extra.length) console.error(`  extra:   ${extra.join(", ")}`);
    }
  }

  const adj = buildAdjacency(actual);
  const cyclic = graphHasCycle(adj);
  const forwardViolations = validateForwardOnly(actual);

  if (forwardViolations.length) {
    console.error("\nvalidateStabilizationGraph: forbidden upward / same-layer imports:");
    for (const line of forwardViolations) console.error(`  ${line}`);
  }

  if (cyclic) {
    console.error("\nvalidateStabilizationGraph: dependency cycle detected in frozen core subgraph.");
  }

  if (mismatch || cyclic || forwardViolations.length || !graphHashOk) {
    if (mismatch || cyclic || forwardViolations.length) {
      console.error(
        "\nFix imports to match STABILIZATION_GRAPH.md + scripts/validateStabilizationGraph.mjs (EXPECTED_CORE_IMPORTS)."
      );
    }
    if (!graphHashOk) {
      console.error(
        "\nOr refresh scripts/stabilization-graph.sha256.lock after intentional edits to STABILIZATION_GRAPH.md."
      );
    }
    console.error("");
    process.exit(1);
  }

  console.log(
    `validateStabilizationGraph: OK (${CORE_PHASE_FILES.length} modules, acyclic, forward-only, edges locked, graph doc hash OK).`
  );
}

main();
