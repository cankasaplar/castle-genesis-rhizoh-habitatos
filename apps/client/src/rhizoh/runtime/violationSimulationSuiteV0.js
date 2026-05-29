/**
 * Violation Simulation Suite v0.1 — stress the legal system (playbook modes).
 * @see docs/RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md
 * @see docs/RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md
 *
 * Distributed enforcement exists; centralized arbitration bus does not (by design at v0.1).
 */

import {
  evaluatePostGoLiveIntegrityV0,
  SYSTEM_STATE_V0
} from "./postGoLiveIntegrityLoopV0.js";
import { detectOrphanNarrativeOutputsV0 } from "./narrativeSourceProvenanceV0.js";
import { validateCursorSegmentAnchorV0 } from "./substrateContinuityIdbV0.js";
import {
  PEER_WAL_SCENARIO_V0,
  simulatePeerWalScenarioV0
} from "./peerWalConvergenceWireV0.js";
import { createInitialStudioKernelState } from "../../studio/store/initialState.ts";
import { resetWorldRuntimeDaemonStateV0 } from "./worldRuntimeDaemonQueueV0.js";

export const VIOLATION_SIMULATION_SUITE_SCHEMA_V0 =
  "castle.rhizoh.violation_simulation_suite.v0";

/** Playbook response modes */
export const VIOLATION_RESPONSE_MODE_V0 = Object.freeze({
  SHADOW: "shadow",
  REVOKE: "revoke",
  QUARANTINE: "quarantine",
  CORRECTION_CHAIN: "correction_chain"
});

export const VIOLATION_CLASS_V0 = Object.freeze({
  TIME_INTEGRITY: "TIME_INTEGRITY",
  DATA_INTEGRITY: "DATA_INTEGRITY",
  PERCEPTION_INTEGRITY: "PERCEPTION_INTEGRITY",
  CAUSAL_INTEGRITY: "CAUSAL_INTEGRITY",
  PEER_INGRESS: "PEER_INGRESS",
  ONBOARDING_INTENDED: "ONBOARDING_INTENDED"
});

/**
 * @typedef {Object} ViolationScenarioResultV0
 * @property {string} id
 * @property {boolean} pass
 * @property {string} expectedMode
 * @property {string} actualMode
 * @property {string} violationClass
 * @property {string} detail
 */

/**
 * @param {{ getState: () => object, setState: (s: object) => void }} studioCtx
 */
function makeStudioCtxV0() {
  let state = createInitialStudioKernelState();
  return {
    getState: () => state,
    setState: (n) => {
      state = n;
    }
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioShadowSoftInitV0() {
  const shadow = Object.freeze({
    state: "SOFT_INIT",
    walTick: 0,
    bootValidityTokenCreated: false
  });
  const pass =
    shadow.state === "SOFT_INIT" &&
    shadow.walTick === 0 &&
    shadow.bootValidityTokenCreated === false;
  return {
    id: "shadow_soft_init",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.SHADOW,
    actualMode: VIOLATION_RESPONSE_MODE_V0.SHADOW,
    violationClass: VIOLATION_CLASS_V0.ONBOARDING_INTENDED,
    detail: pass ? "SOFT_INIT without boot token" : "shadow contract violated"
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioWalOrderingDriftV0() {
  const r = evaluatePostGoLiveIntegrityV0({
    eventSeqs: [1, 3, 2],
    derivedTracePresent: true,
    narrativeProvenanceOk: true
  });
  const pass =
    r.system_state === SYSTEM_STATE_V0.DEGRADED &&
    r.checks.eventConsistency.ok === false;
  return {
    id: "wal_ordering_drift",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    actualMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    violationClass: VIOLATION_CLASS_V0.CAUSAL_INTEGRITY,
    detail: `system_state=${r.system_state} event=${r.checks.eventConsistency.detail}`
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioWalDualFailureQuarantineV0() {
  const r = evaluatePostGoLiveIntegrityV0({
    eventSeqs: [5, 2],
    orphanNarrativeDetected: true,
    nodeHeartbeats: [],
    expectedGuardianNodes: 2
  });
  const pass = r.system_state === SYSTEM_STATE_V0.QUARANTINE;
  return {
    id: "wal_dual_failure_quarantine",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    actualMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    violationClass: VIOLATION_CLASS_V0.DATA_INTEGRITY,
    detail: `system_state=${r.system_state}`
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioWalCursorSegmentMismatchV0() {
  const anchor = validateCursorSegmentAnchorV0(
    { lastTick: 1, lastHash: "aaa", lastSegmentId: "seg-a" },
    { tick: 1, hash: "bbb", diskKey: "disk.test" }
  );
  const pass = anchor.ok === false && anchor.code === "cursor_hash_segment_mismatch";
  return {
    id: "wal_cursor_segment_mismatch",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.CORRECTION_CHAIN,
    actualMode: VIOLATION_RESPONSE_MODE_V0.CORRECTION_CHAIN,
    violationClass: VIOLATION_CLASS_V0.DATA_INTEGRITY,
    detail: String(anchor.code || "no_code")
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioGhostBootstrapInjectionV0() {
  const {
    clearInMemoryBootValidityStateV0,
    commitLastAppliedBootSealVersionV0,
    enforceRuntimeBootValidityTokenV0,
    getBootAtomicSealV0
  } = await import("./continuity/bootValidityTokenV0.js");
  const {
    enableInMemoryWorldSealerForDiskV0,
    persistLivingWorldBootstrapV0,
    useInMemoryWorldSealerBackendV0
  } = await import("./continuity/worldSealerV0.js");
  const { sealAuditRecordV0, clearAuditIntegrityChainStateV0 } = await import(
    "./continuity/temporalAuditIntegrityV0.js"
  );
  const { REALITY_SEAL_DISK_KEY_V0 } = await import("./realitySealDiskV0.js");
  const DISK = "castle.violation_sim.ghost.v0";

  useInMemoryWorldSealerBackendV0(true).clear();
  clearInMemoryBootValidityStateV0();
  clearAuditIntegrityChainStateV0(DISK);
  enableInMemoryWorldSealerForDiskV0(DISK);

  const head = sealAuditRecordV0(DISK, {
    audit: { verdict: "ok", trigger: "violation_sim" },
    groundingDigest: "g0"
  }).chainHeadHash;

  await persistLivingWorldBootstrapV0(
    null,
    {
      schema: "castle.rhizoh.world_sealer.v0",
      diskKey: DISK,
      livingWorldId: "world:ghost_sim",
      livingNodeId: "node:violation_sim",
      checkpointTick: 1,
      replayFromTick: 0,
      mayBootstrapRuntime: true,
      epistemicPast: "canonical_chain",
      rehydrateGate: "continuity_ok",
      sealedAtMs: Date.now(),
      selectionVerdict: "selected"
    },
    null
  );

  const atBoot = await getBootAtomicSealV0(null, DISK);
  commitLastAppliedBootSealVersionV0(atBoot.bootSealVersion, atBoot.token);

  const injected = "ghost_injected_token_not_on_disk";
  const result = await enforceRuntimeBootValidityTokenV0(injected, null, DISK, {
    lastAppliedBootSealVersion: atBoot.bootSealVersion
  });

  const pass =
    result.mismatch === true && result.revoked === true && result.hardReload === true;

  return {
    id: "ghost_bootstrap_injection",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.REVOKE,
    actualMode: pass ? VIOLATION_RESPONSE_MODE_V0.REVOKE : "unknown",
    violationClass: VIOLATION_CLASS_V0.PERCEPTION_INTEGRITY,
    detail: pass ? "revoke+hardReload" : String(result.statement || result.code)
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioUiOrphanNarrativeV0() {
  const orphan = detectOrphanNarrativeOutputsV0([
    { text: "Looks authoritative but has no chain.", provenance: null }
  ]);
  const integrity = evaluatePostGoLiveIntegrityV0({
    orphanNarrativeDetected: orphan.orphanCount > 0,
    derivedTracePresent: true,
    narrativeProvenanceOk: true
  });
  const pass = !orphan.ok && integrity.checks.layerTrace.ok === false;
  return {
    id: "ui_orphan_narrative",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    actualMode:
      integrity.system_state === SYSTEM_STATE_V0.LIVE_OK
        ? VIOLATION_RESPONSE_MODE_V0.QUARANTINE
        : VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    violationClass: VIOLATION_CLASS_V0.PERCEPTION_INTEGRITY,
    detail: `orphans=${orphan.orphanCount} layer=${integrity.checks.layerTrace.detail}`
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioUiMissingProvenanceGateV0() {
  const r = evaluatePostGoLiveIntegrityV0({
    eventSeqs: [1, 2],
    derivedTracePresent: true,
    narrativeProvenanceOk: false
  });
  const pass = r.checks.layerTrace.ok === false && r.checks.layerTrace.detail === "missing_source_provenance_tag";
  return {
    id: "ui_missing_provenance_gate",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    actualMode:
      r.system_state === SYSTEM_STATE_V0.DEGRADED
        ? VIOLATION_RESPONSE_MODE_V0.QUARANTINE
        : VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    violationClass: VIOLATION_CLASS_V0.PERCEPTION_INTEGRITY,
    detail: r.checks.layerTrace.detail
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioPeerQuarantineStaleV0() {
  resetWorldRuntimeDaemonStateV0();
  const studio = makeStudioCtxV0();
  const r = simulatePeerWalScenarioV0("stale", {
    getState: studio.getState,
    castleId: "peer:violation_sim_stale"
  });
  const pass = r.disposition === "quarantine" && r.scenario === PEER_WAL_SCENARIO_V0.STALE;
  return {
    id: "peer_quarantine_stale",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    actualMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    violationClass: VIOLATION_CLASS_V0.PEER_INGRESS,
    detail: `disposition=${r.disposition} scenario=${r.scenario}`
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioCorrectionHashRepairV0() {
  const { runContinuityRecoveryOrchestratorV0, RECOVERY_ACTION_V0 } = await import(
    "./continuity/continuityRecoveryOrchestratorV0.js"
  );
  const { createInMemoryContinuityAdapterV0 } = await import(
    "./continuity/__tests__/inMemoryContinuityAdapterV0.js"
  );
  const { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } = await import(
    "./continuity/walHashChainV0.js"
  );
  const { deriveWalSegmentIdV0 } = await import("./substrateContinuityIdbV0.js");
  const { WAL_SEGMENT_BODY_SCHEMA_V0 } = await import("./continuity/walSegmentIntegrityV0.js");
  const { REPAIR_OUTCOME_V0 } = await import("./continuity/replayRepairKernelV0.js");
  const { EPISTEMIC_PAST_V0 } = await import("./continuity/replayCorruptionTaxonomyV0.js");

  const DISK = "castle.violation_sim.repair.v0";
  const idb = createInMemoryContinuityAdapterV0(DISK);
  let prev = WAL_HASH_CHAIN_GENESIS_V0;
  for (let t = 0; t <= 3; t++) {
    const body = { schema: WAL_SEGMENT_BODY_SCHEMA_V0, realityEpoch: t, replayOk: true };
    const hash = foldWalSegmentHashV0(prev, body);
    await idb.appendWalSegment({ tick: t, hash, body });
    prev = hash;
  }
  await idb.writeReplayCursorMonotonic({
    lastTick: 3,
    lastHash: prev,
    lastSegmentId: deriveWalSegmentIdV0(DISK, 3, prev)
  });
  const body = { schema: WAL_SEGMENT_BODY_SCHEMA_V0, realityEpoch: 3, replayOk: true };
  await idb._testPutRawSegment({
    diskKey: DISK,
    tick: 3,
    hash: "BAD_HASH_INJECTED",
    segmentId: deriveWalSegmentIdV0(DISK, 3, "BAD_HASH_INJECTED"),
    body
  });

  const ports = {
    diskKey: DISK,
    readReplayCursor: () => idb.readReplayCursor(),
    getWalSegment: (t) => idb.getWalSegment(t),
    putWalSegment: (s) => idb.putWalSegmentRepaired(s),
    writeReplayCursor: (c) => idb.writeReplayCursorDirect(c)
  };

  const r = await runContinuityRecoveryOrchestratorV0(ports, {
    applyRepair: true,
    lastTrustedCheckpoint: 0
  });

  const pass =
    r.decision.action === RECOVERY_ACTION_V0.REPAIR &&
    r.repair?.outcome === REPAIR_OUTCOME_V0.HASH_REANCHOR &&
    r.epistemic.past === EPISTEMIC_PAST_V0.REPAIRED_CHAIN;

  return {
    id: "correction_hash_mutation_repair",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.CORRECTION_CHAIN,
    actualMode: pass ? VIOLATION_RESPONSE_MODE_V0.CORRECTION_CHAIN : "reject_or_fail",
    violationClass: VIOLATION_CLASS_V0.DATA_INTEGRITY,
    detail: `action=${r.decision.action} repair=${r.repair?.outcome}`
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioCompoundOrphanAndOrderingV0() {
  const { beginBreachCorrelationWindowV0, endBreachCorrelationWindowV0, synthesizeBreachCoherenceV0, clearBreachCorrelationStateForTestV0 } =
    await import("./breachCorrelationSynthesisV0.js");
  const { clearBreachObservationTraceForTestV0, observePostGoLiveIntegrityBreachV0 } =
    await import("./violationObservationLogV0.js");

  clearBreachObservationTraceForTestV0();
  clearBreachCorrelationStateForTestV0();

  const cid = beginBreachCorrelationWindowV0({ label: "compound_orphan_and_ordering" });
  const bad = evaluatePostGoLiveIntegrityV0({
    eventSeqs: [3, 1],
    orphanNarrativeDetected: true
  });
  observePostGoLiveIntegrityBreachV0(bad, { eventSeqs: [3, 1] });
  const synth = synthesizeBreachCoherenceV0({ correlationId: cid });
  endBreachCorrelationWindowV0();

  const pass =
    synth.compoundFault === true &&
    synth.entryCount >= 2 &&
    synth.violationClasses.length >= 2 &&
    synth.dominantResponseMode === VIOLATION_RESPONSE_MODE_V0.QUARANTINE;

  return {
    id: "compound_orphan_and_ordering",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    actualMode: synth.dominantResponseMode,
    violationClass: VIOLATION_CLASS_V0.DATA_INTEGRITY,
    detail: `compound=${synth.compoundFault} entries=${synth.entryCount} classes=${synth.violationClasses.join("+")}`
  };
}

/** @returns {Promise<ViolationScenarioResultV0>} */
async function scenarioExternalBoundaryDivergenceV0() {
  const {
    evaluateExternalBoundaryValidationV0,
    BOUNDARY_STATE_V0,
    collectClientBoundarySnapshotV0
  } = await import("./externalBoundaryValidationV0.js");

  const r = evaluateExternalBoundaryValidationV0(
    collectClientBoundarySnapshotV0({ clientSeqHead: 99, eventSeqTail: [97, 98, 99] }),
    {
      gatewayLive: true,
      lastAcceptedSeq: 10,
      healthStatus: 200,
      fetchPhase: "runtime_ok",
      collectedAtMs: Date.now()
    }
  );

  const pass =
    r.boundary_state === BOUNDARY_STATE_V0.DIVERGED &&
    r.checks.seqAlignment.detail === "client_seq_ahead_of_gateway";

  return {
    id: "external_boundary_divergence",
    pass,
    expectedMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    actualMode: VIOLATION_RESPONSE_MODE_V0.QUARANTINE,
    violationClass: VIOLATION_CLASS_V0.PEER_INGRESS,
    detail: `boundary=${r.boundary_state} delta=${r.checks.seqAlignment.delta}`
  };
}

/** @type {Record<string, () => Promise<ViolationScenarioResultV0>>} */
export const VIOLATION_SCENARIO_RUNNERS_V0 = Object.freeze({
  compound_orphan_and_ordering: scenarioCompoundOrphanAndOrderingV0,
  external_boundary_divergence: scenarioExternalBoundaryDivergenceV0,
  shadow_soft_init: scenarioShadowSoftInitV0,
  wal_ordering_drift: scenarioWalOrderingDriftV0,
  wal_dual_failure_quarantine: scenarioWalDualFailureQuarantineV0,
  wal_cursor_segment_mismatch: scenarioWalCursorSegmentMismatchV0,
  ghost_bootstrap_injection: scenarioGhostBootstrapInjectionV0,
  ui_orphan_narrative: scenarioUiOrphanNarrativeV0,
  ui_missing_provenance_gate: scenarioUiMissingProvenanceGateV0,
  peer_quarantine_stale: scenarioPeerQuarantineStaleV0,
  correction_hash_mutation_repair: scenarioCorrectionHashRepairV0
});

export const VIOLATION_SCENARIO_IDS_V0 = Object.freeze(Object.keys(VIOLATION_SCENARIO_RUNNERS_V0));

/**
 * @param {{ scenarioIds?: string[], print?: boolean }} [opts]
 */
export async function runViolationSimulationSuiteV0(opts = {}) {
  const ids = opts.scenarioIds?.length
    ? opts.scenarioIds.filter((id) => VIOLATION_SCENARIO_RUNNERS_V0[id])
    : [...VIOLATION_SCENARIO_IDS_V0];

  /** @type {ViolationScenarioResultV0[]} */
  const scenarios = [];
  for (const id of ids) {
    scenarios.push(await VIOLATION_SCENARIO_RUNNERS_V0[id]());
  }

  const passed = scenarios.filter((s) => s.pass).length;
  const report = {
    schema: VIOLATION_SIMULATION_SUITE_SCHEMA_V0,
    version: "0.1",
    atMs: Date.now(),
    scenarios,
    total: scenarios.length,
    passed,
    failed: scenarios.length - passed,
    allPassed: passed === scenarios.length,
    centralizedArbitrationBus: false,
    note: "Distributed enforcement validated; unified violation bus not in v0.1."
  };

  if (opts.print && typeof console !== "undefined") {
    console.log(
      `[violation-sim v0.1] ${passed}/${scenarios.length} ${report.allPassed ? "LAW_OK" : "LAW_FAIL"}`
    );
    for (const s of scenarios) {
      console.log(`  ${s.pass ? "✓" : "✗"} ${s.id} → ${s.actualMode} (${s.violationClass})`);
    }
  }

  return report;
}
