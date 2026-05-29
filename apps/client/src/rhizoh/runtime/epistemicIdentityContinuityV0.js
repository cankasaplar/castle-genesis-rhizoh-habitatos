/**
 * Epistemic identity continuity v0.1 — cross-run global subject identity (read-only).
 *
 * ledger identity hash · tick graph drift · bundle fingerprint evolution · repro consistency
 * @see docs/RHIZOH_EPISTEMIC_IDENTITY_CONTINUITY_V0.1.md
 */

import {
  foldWalSegmentHashV0,
  WAL_HASH_CHAIN_GENESIS_V0
} from "./continuity/walHashChainV0.js";
import {
  buildEpistemicTickGraphV0,
  getEpistemicTickLedgerV0
} from "./epistemicTickLedgerV0.js";
import {
  fingerprintReproducibleBundleV0,
  getLastExternalReproducibilityReportV0
} from "./epistemicReproducibilityLayerV0.js";
import { SYSTEM_STATE_V0 } from "./postGoLiveIntegrityLoopV0.js";

export const EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0 =
  "castle.rhizoh.epistemic_identity_continuity.v0";

export const IDENTITY_CONTINUITY_VERDICT_V0 = Object.freeze({
  UNINITIALIZED: "uninitialized",
  SAME_SUBJECT: "same_subject",
  SUBJECT_DRIFT: "subject_drift",
  SUBJECT_FORK: "subject_fork"
});

const MAX_FINGERPRINT_CHAIN_V0 = 64;
const REPRO_CONSISTENCY_WINDOW_V0 = 8;

/** @type {{ rootDigest: string, establishedAtMs: number } | null} */
let globalIdentityRootV0 = null;
/** @type {string | null} */
let ledgerIdentityHashV0 = null;
/** @type {string | null} */
let tickGraphDigestV0 = null;
/** @type {string | null} */
let prevTickGraphDigestV0 = null;
/** @type {object[]} */
let fingerprintEvolutionV0 = [];
/** @type {object | null} */
let lastContinuityReportV0 = null;

/**
 * Deterministic hash over ledger nodes (cross-run identity spine).
 */
export function deriveLedgerIdentityHashV0() {
  const ledger = getEpistemicTickLedgerV0();
  let digest = WAL_HASH_CHAIN_GENESIS_V0;
  for (const n of ledger.nodes) {
    digest = foldWalSegmentHashV0(digest, {
      tickSeq: n.tickSeq,
      epistemic_state: n.epistemic_state,
      playbook_state: n.playbook_state,
      boundary_state: n.boundary_state,
      compoundFault: n.compoundFault,
      divergenceFlags: [...n.divergenceFlags].sort()
    });
  }
  digest = foldWalSegmentHashV0(digest, {
    sessionId: ledger.sessionId,
    total: ledger.total,
    dropped: ledger.dropped
  });
  ledgerIdentityHashV0 = digest;
  return Object.freeze({
    schema: "castle.rhizoh.ledger_identity_hash.v0",
    ledgerIdentityHash: digest,
    tickCount: ledger.nodes.length,
    sessionId: ledger.sessionId
  });
}

/**
 * Tick graph shape + state vector digest and drift vs prior graph.
 */
export function deriveTickGraphIdentityDriftV0() {
  const graph = buildEpistemicTickGraphV0();
  let digest = WAL_HASH_CHAIN_GENESIS_V0;
  for (const node of graph.nodes) {
    digest = foldWalSegmentHashV0(digest, node);
  }
  for (const edge of graph.edges) {
    digest = foldWalSegmentHashV0(digest, edge);
  }

  const prior = tickGraphDigestV0;
  prevTickGraphDigestV0 = prior;
  tickGraphDigestV0 = digest;

  const graphDriftDetected = prior != null && prior !== digest;
  let driftSeverity = 0;
  if (graphDriftDetected && prior) {
    driftSeverity = 0.35;
    const ledger = getEpistemicTickLedgerV0();
    const tail = ledger.nodes[ledger.nodes.length - 1];
    if (tail?.epistemic_state === SYSTEM_STATE_V0.QUARANTINE) driftSeverity = 0.72;
    if (tail?.divergenceFlags?.length) driftSeverity = Math.min(1, driftSeverity + 0.15);
  }

  return Object.freeze({
    schema: "castle.rhizoh.tick_graph_identity_drift.v0",
    tickGraphDigest: digest,
    priorTickGraphDigest: prior,
    graphDriftDetected,
    driftSeverity,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length
  });
}

/**
 * Append audit bundle reproducibility fingerprint to evolution chain.
 *
 * @param {object} bundle
 */
export function recordBundleFingerprintEvolutionV0(bundle) {
  const fp = fingerprintReproducibleBundleV0(bundle);
  const entry = Object.freeze({
    atMs: Date.now(),
    fingerprint: fp.fingerprint,
    epistemic_state: bundle.epistemic_state,
    boundary_state: bundle.boundary?.boundary_state,
    lawOk: bundle.simulation?.allPassed ?? null
  });

  const next = [...fingerprintEvolutionV0, entry];
  fingerprintEvolutionV0 =
    next.length > MAX_FINGERPRINT_CHAIN_V0
      ? next.slice(-MAX_FINGERPRINT_CHAIN_V0)
      : next;

  let digest = globalIdentityRootV0?.rootDigest ?? WAL_HASH_CHAIN_GENESIS_V0;
  digest = foldWalSegmentHashV0(digest, {
    fingerprint: fp.fingerprint,
    epistemic_state: bundle.epistemic_state
  });

  if (!globalIdentityRootV0) {
    globalIdentityRootV0 = Object.freeze({
      rootDigest: digest,
      establishedAtMs: Date.now()
    });
  } else {
    globalIdentityRootV0 = Object.freeze({
      rootDigest: digest,
      establishedAtMs: globalIdentityRootV0.establishedAtMs
    });
  }

  return entry;
}

/**
 * Fingerprint chain stability (reproducibility over time).
 */
export function assessReproducibilityConsistencyOverTimeV0() {
  const window = fingerprintEvolutionV0.slice(-REPRO_CONSISTENCY_WINDOW_V0);
  const fingerprints = window.map((e) => e.fingerprint);
  const unique = [...new Set(fingerprints)];
  const lawOkStable = window.every((e) => e.lawOk === window[0]?.lawOk);

  const reproConsistent = unique.length <= 1 && window.length > 0;
  const epistemicStates = [...new Set(window.map((e) => e.epistemic_state))];

  return Object.freeze({
    schema: "castle.rhizoh.repro_consistency_over_time.v0",
    windowSize: window.length,
    uniqueFingerprints: unique.length,
    reproConsistent,
    lawOkStable,
    epistemicStateVariants: Object.freeze(epistemicStates),
    fingerprintHead: fingerprints[fingerprints.length - 1] ?? null
  });
}

/**
 * @returns {object}
 */
export function getGlobalEpistemicIdentityV0() {
  const ledger = deriveLedgerIdentityHashV0();
  const graph = deriveTickGraphIdentityDriftV0();
  const repro = assessReproducibilityConsistencyOverTimeV0();
  const root = globalIdentityRootV0;

  return Object.freeze({
    schema: "castle.rhizoh.global_epistemic_identity.v0",
    epistemicIdentityId: root
      ? `epi_id_${root.rootDigest.replace(/^h/, "").slice(0, 12)}`
      : null,
    rootDigest: root?.rootDigest ?? null,
    establishedAtMs: root?.establishedAtMs ?? null,
    ledgerIdentityHash: ledger.ledgerIdentityHash,
    tickGraphDigest: graph.tickGraphDigest,
    fingerprintChainLength: fingerprintEvolutionV0.length,
    reproConsistent: repro.reproConsistent,
    interpretationOnly: true
  });
}

/**
 * Resolve cross-run continuity verdict.
 */
export function resolveIdentityContinuityVerdictV0(parts) {
  if (!parts.fingerprintChainLength) {
    return IDENTITY_CONTINUITY_VERDICT_V0.UNINITIALIZED;
  }
  if (parts.subjectFork) {
    return IDENTITY_CONTINUITY_VERDICT_V0.SUBJECT_FORK;
  }
  if (parts.graphDriftDetected || parts.subjectDrift) {
    return IDENTITY_CONTINUITY_VERDICT_V0.SUBJECT_DRIFT;
  }
  if (parts.reproConsistent) {
    return IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT;
  }
  return IDENTITY_CONTINUITY_VERDICT_V0.SUBJECT_DRIFT;
}

/**
 * Touch identity spine from ledger append (graph + ledger hash).
 */
export function touchEpistemicIdentityFromLedgerV0() {
  deriveLedgerIdentityHashV0();
  deriveTickGraphIdentityDriftV0();
}

/**
 * Unified continuity evaluation.
 *
 * @param {{ bundle?: object }} [opts]
 */
export function evaluateEpistemicIdentityContinuityV0(opts = {}) {
  if (opts.bundle) {
    recordBundleFingerprintEvolutionV0(opts.bundle);
  } else {
    touchEpistemicIdentityFromLedgerV0();
  }

  const ledger = deriveLedgerIdentityHashV0();
  const graphDrift = deriveTickGraphIdentityDriftV0();
  const repro = assessReproducibilityConsistencyOverTimeV0();
  const identity = getGlobalEpistemicIdentityV0();
  const externalRepro = getLastExternalReproducibilityReportV0();

  const window = fingerprintEvolutionV0.slice(-REPRO_CONSISTENCY_WINDOW_V0);
  const lawFork = window.some((e) => e.lawOk === false) && window.some((e) => e.lawOk === true);
  const fingerprintJump =
    window.length >= 2 &&
    window[window.length - 1].fingerprint !== window[window.length - 2].fingerprint &&
    repro.uniqueFingerprints >= 2;

  const subjectDrift =
    !repro.reproConsistent &&
    repro.epistemicStateVariants.length > 1 &&
    repro.lawOkStable;

  const report = Object.freeze({
    schema: EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0,
    version: "0.1",
    atMs: Date.now(),
    globalIdentity: identity,
    ledger,
    tickGraphDrift: graphDrift,
    fingerprintEvolution: Object.freeze({
      chainLength: fingerprintEvolutionV0.length,
      head: fingerprintEvolutionV0[fingerprintEvolutionV0.length - 1] ?? null,
      repro
    }),
    externalReproducibility: externalRepro
      ? Object.freeze({
          externallyReproducible: externalRepro.externallyReproducible,
          crossEnvMatch: externalRepro.crossEnvironment?.allFingerprintsMatch ?? null
        })
      : null,
    verdict: resolveIdentityContinuityVerdictV0({
      fingerprintChainLength: fingerprintEvolutionV0.length,
      subjectFork: lawFork || (fingerprintJump && !repro.lawOkStable),
      graphDriftDetected: graphDrift.graphDriftDetected,
      subjectDrift,
      reproConsistent: repro.reproConsistent
    }),
    centralizedArbitrationBus: false,
    interpretationOnly: true,
    readOnly: true
  });

  lastContinuityReportV0 = report;
  syncEpistemicIdentityContinuityWindowV0(report);

  void import("./epistemicCausalityGraphV0.js")
    .then(({ refreshEpistemicCausalityGraphV0 }) => refreshEpistemicCausalityGraphV0())
    .catch(() => {
      /* causality must not break identity */
    });

  return report;
}

export function getLastEpistemicIdentityContinuityReportV0() {
  return lastContinuityReportV0;
}

export function exportEpistemicIdentityContinuityJsonV0(report) {
  const payload = report ?? lastContinuityReportV0;
  return JSON.stringify(
    payload
      ? { ...payload, exportedAtMs: Date.now(), readOnly: true }
      : { schema: EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0, error: "no_report_yet" },
    null,
    2
  );
}

/** Test-only */
export function clearEpistemicIdentityContinuityForTestV0() {
  globalIdentityRootV0 = null;
  ledgerIdentityHashV0 = null;
  tickGraphDigestV0 = null;
  prevTickGraphDigestV0 = null;
  fingerprintEvolutionV0 = [];
  lastContinuityReportV0 = null;
  syncEpistemicIdentityContinuityWindowV0(null);
}

function syncEpistemicIdentityContinuityWindowV0(report) {
  if (typeof window === "undefined") return;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh_epistemic_identity = report?.globalIdentity ?? null;
  window.__rhizoh.epistemicIdentity = Object.freeze({
    evaluate: evaluateEpistemicIdentityContinuityV0,
    last: () => lastContinuityReportV0,
    global: getGlobalEpistemicIdentityV0,
    ledgerHash: deriveLedgerIdentityHashV0,
    graphDrift: deriveTickGraphIdentityDriftV0,
    recordBundle: recordBundleFingerprintEvolutionV0,
    reproOverTime: assessReproducibilityConsistencyOverTimeV0,
    export: exportEpistemicIdentityContinuityJsonV0
  });
}
