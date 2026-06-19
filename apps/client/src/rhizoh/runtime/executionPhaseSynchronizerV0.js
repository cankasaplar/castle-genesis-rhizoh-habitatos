/**
 * Execution Phase Synchronizer v0 — unified execution clock / phase alignment.
 * Aligns scheduler → REC → fusion → stabilization in one deterministic commit.
 * RESEARCH-ONLY — orchestrates only; never mutates execution authority.
 * @see docs/RHIZOH_EXECUTION_PHASE_SYNCHRONIZER_V0.md
 */

import { reconcileCrossSpaceRecV0 } from "./crossSpaceRecReconciliationV0.js";
import { fuseCrossSpaceEpistemicV0 } from "./crossSpaceCausalFusionV0.js";
import {
  ingestChessDriftLaneV0,
  ingestCuxPerceptionLaneV0,
  ingestSportsEntropyLaneV0
} from "./crossSpaceCausalFusionV0.js";
import { stabilizeCrossSpaceFusionV0 } from "./crossSpaceStabilizationLayerV0.js";
import {
  notifySportsArenaActivityV0,
  runMultiArenaTickV0
} from "./multiArenaSchedulerV0.js";
import { CAUSAL_SPACE_ID_V0 } from "./sportsCausalSpaceV0.js";

export const EXECUTION_PHASE_SYNCHRONIZER_SCHEMA_V0 =
  "castle.rhizoh.execution_phase_synchronizer.v0";
export const EXECUTION_PHASE_EVENT_V0 = "rhizoh:execution-phase-v0";
export const EXECUTION_PHASE_COMMIT_EVENT_V0 = "rhizoh:execution-phase-commit-v0";

export const PHASE_STATE_V0 = Object.freeze({
  IDLE: "idle",
  OPEN: "open",
  COMMITTING: "committing",
  LOCKED: "locked"
});

export const INGESTION_LANE_V0 = Object.freeze({
  SPORTS: "sports",
  CHESS_DRIFT: "chess_drift",
  CUX_PERCEPTION: "cux_perception"
});

export const DEFAULT_PHASE_WINDOW_MS_V0 = 32;

let phaseSeqV0 = 0;
/** @type {object | null} */
let currentPhaseV0 = null;
/** @type {object | null} */
let lastPhaseCommitV0 = null;
/** @type {object[]} */
const phaseLogV0 = [];
/** @type {{ lane: string, payload: object, enqueuedAtMs: number }[]} */
const ingestionBufferV0 = [];

let phaseSyncEnabledV0 = true;

function dispatchPhaseEventV0(name, detail) {
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

/**
 * @param {object} [opts]
 */
export function beginExecutionPhaseV0(opts = {}) {
  const atMs = Number(opts.atMs) || Date.now();
  phaseSeqV0 += 1;
  ingestionBufferV0.length = 0;

  currentPhaseV0 = Object.freeze({
    schema: `${EXECUTION_PHASE_SYNCHRONIZER_SCHEMA_V0}.phase`,
    phaseSeq: phaseSeqV0,
    phaseId: `phase_${phaseSeqV0}`,
    state: PHASE_STATE_V0.OPEN,
    windowMs: Number(opts.windowMs) || DEFAULT_PHASE_WINDOW_MS_V0,
    source: String(opts.source || "manual"),
    gateContext: opts.gateContext || null,
    ingestionWindowOpen: true,
    atMs,
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true
  });

  dispatchPhaseEventV0(EXECUTION_PHASE_EVENT_V0, currentPhaseV0);
  return currentPhaseV0;
}

export function isPhaseIngestionWindowOpenV0() {
  return Boolean(phaseSyncEnabledV0 && currentPhaseV0?.ingestionWindowOpen);
}

export function isExecutionPhaseLockedV0() {
  return currentPhaseV0?.state === PHASE_STATE_V0.LOCKED;
}

/**
 * Buffer lane payload for same-phase commit (ingestion window alignment).
 * @param {string} lane
 * @param {object} payload
 */
export function enqueuePhaseIngestionV0(lane, payload = {}) {
  if (!isPhaseIngestionWindowOpenV0()) {
    return Object.freeze({ queued: false, reason: "ingestion_window_closed" });
  }
  ingestionBufferV0.push({
    lane: String(lane || "unknown"),
    payload,
    enqueuedAtMs: Date.now()
  });
  return Object.freeze({
    queued: true,
    bufferSize: ingestionBufferV0.length,
    phaseSeq: currentPhaseV0?.phaseSeq ?? null
  });
}

/**
 * Apply buffered ingestions before scheduler/fusion in same commit cycle.
 */
export function flushPhaseIngestionWindowV0() {
  const applied = [];

  for (const entry of ingestionBufferV0) {
    if (entry.lane === INGESTION_LANE_V0.SPORTS) {
      const normalized = entry.payload;
      notifySportsArenaActivityV0({
        reason: normalized?.eventType || "sports_buffered",
        durationMs: entry.payload?.burstDurationMs
      });
      ingestSportsEntropyLaneV0({
        entropy01: normalized?.entropy01,
        categoryShares: normalized?.categoryShares,
        matchId: normalized?.matchId
      });
      applied.push(entry.lane);
    } else if (entry.lane === INGESTION_LANE_V0.CHESS_DRIFT) {
      ingestChessDriftLaneV0(entry.payload);
      applied.push(entry.lane);
    } else if (entry.lane === INGESTION_LANE_V0.CUX_PERCEPTION) {
      ingestCuxPerceptionLaneV0(entry.payload);
      applied.push(entry.lane);
    }
  }

  ingestionBufferV0.length = 0;
  if (currentPhaseV0) {
    currentPhaseV0 = Object.freeze({
      ...currentPhaseV0,
      ingestionWindowOpen: false,
      state: PHASE_STATE_V0.COMMITTING
    });
  }

  return Object.freeze({
    applied: Object.freeze(applied),
    count: applied.length
  });
}

/**
 * Single-tick aligned commit: scheduler → REC → fusion → stabilization.
 * @param {{ atMs?: number, source?: string, gateContext?: object, force?: boolean }} [opts]
 */
export function commitExecutionPhaseV0(opts = {}) {
  const atMs = Number(opts.atMs) || Date.now();
  const phase =
    currentPhaseV0 ||
    beginExecutionPhaseV0({ atMs, source: opts.source || "commit", gateContext: opts.gateContext });

  const flush = flushPhaseIngestionWindowV0();

  const tick = runMultiArenaTickV0({ atMs, phaseSeq: phase.phaseSeq, phaseLock: true });
  const rec = reconcileCrossSpaceRecV0({ selection: tick.selection, atMs });
  const fusion = fuseCrossSpaceEpistemicV0({
    recReconciliation: rec,
    schedulerSelection: tick.selection,
    atMs,
    phaseLock: true,
    force: opts.force,
    suppressEvent: true
  });
  const projection = stabilizeCrossSpaceFusionV0(fusion, {
    atMs,
    phaseLock: true,
    forceAdmission: opts.forceAdmission
  });

  const commit = Object.freeze({
    schema: `${EXECUTION_PHASE_SYNCHRONIZER_SCHEMA_V0}.commit`,
    phaseSeq: phase.phaseSeq,
    phaseId: phase.phaseId,
    source: opts.source || phase.source,
    state: PHASE_STATE_V0.LOCKED,
    phaseAligned: true,
    flush,
    tick,
    rec,
    fusion,
    projection,
    admissionSafe: projection.admissionSafe,
    primarySpaceId: tick.selection?.primarySpaceId || CAUSAL_SPACE_ID_V0.CHESS,
    atMs,
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true
  });

  currentPhaseV0 = Object.freeze({
    ...phase,
    state: PHASE_STATE_V0.LOCKED,
    ingestionWindowOpen: false,
    lastCommit: commit
  });
  lastPhaseCommitV0 = commit;
  phaseLogV0.unshift(commit);
  if (phaseLogV0.length > 32) phaseLogV0.length = 32;

  dispatchPhaseEventV0(EXECUTION_PHASE_COMMIT_EVENT_V0, commit);
  return commit;
}

/**
 * Begin + commit in one synchronous execution window.
 * @param {object} [opts]
 */
export function runAlignedExecutionPhaseV0(opts = {}) {
  const phase = beginExecutionPhaseV0(opts);
  const commit = commitExecutionPhaseV0({ ...opts, source: opts.source || phase.source });
  return Object.freeze({
    schema: `${EXECUTION_PHASE_SYNCHRONIZER_SCHEMA_V0}.aligned`,
    phase,
    commit,
    phaseAligned: true,
    admissionSafe: commit.admissionSafe,
    atMs: commit.atMs,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * Boot pipeline — ontological_gate → scheduler → fusion → stabilize (pre react_mount).
 * @param {{ gate?: object, atMs?: number }} [opts]
 */
export function runBootExecutionPhaseV0(opts = {}) {
  return runAlignedExecutionPhaseV0({
    atMs: opts.atMs,
    source: "boot.post_gate",
    gateContext: opts.gate?.bootContext || null
  });
}

/**
 * Sports / manual ingest — schedule aligned commit instead of orphan scheduler tick.
 * @param {object} [opts]
 */
export function schedulePhaseCommitV0(opts = {}) {
  if (!phaseSyncEnabledV0) {
    const tick = runMultiArenaTickV0({ atMs: opts.atMs });
    return Object.freeze({ phaseAligned: false, tick, atMs: tick.atMs });
  }

  const phase = beginExecutionPhaseV0({
    atMs: opts.atMs,
    source: opts.source || "ingest_commit"
  });

  for (const item of opts.ingest || []) {
    enqueuePhaseIngestionV0(item.lane, item.payload);
  }

  const commit = commitExecutionPhaseV0({ atMs: opts.atMs, source: phase.source });
  return Object.freeze({
    schema: `${EXECUTION_PHASE_SYNCHRONIZER_SCHEMA_V0}.scheduled`,
    phaseAligned: true,
    phase,
    commit,
    admissionSafe: commit.admissionSafe,
    atMs: commit.atMs,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getExecutionPhaseSnapshotV0() {
  return Object.freeze({
    schema: `${EXECUTION_PHASE_SYNCHRONIZER_SCHEMA_V0}.snapshot`,
    phaseSeq: phaseSeqV0,
    currentPhase: currentPhaseV0,
    lastCommit: lastPhaseCommitV0,
    phaseSyncEnabled: phaseSyncEnabledV0,
    ingestionBufferSize: ingestionBufferV0.length,
    recentCommits: Object.freeze(phaseLogV0.slice(0, 8)),
    diagnosis: Object.freeze({
      functionallyComplete: Boolean(lastPhaseCommitV0?.fusion),
      temporallyAligned: Boolean(lastPhaseCommitV0?.phaseAligned),
      sameCycleStabilization: Boolean(lastPhaseCommitV0?.projection?.admissionSafe != null)
    }),
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function buildExecutionPhaseSynchronizerReportV0() {
  return Object.freeze({
    schema: `${EXECUTION_PHASE_SYNCHRONIZER_SCHEMA_V0}.report`,
    note: "Unified execution clock — scheduler, fusion, stabilization in one phase commit",
    snapshot: getExecutionPhaseSnapshotV0(),
    apis: Object.freeze({
      snapshot: "window.__rhizoh.executionPhase()",
      run: "window.__rhizoh.runExecutionPhase()",
      commit: "window.__rhizoh.commitExecutionPhase()"
    }),
    atMs: Date.now()
  });
}

export function ensureExecutionPhaseSynchronizerV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.executionPhase) {
    window.__rhizoh.executionPhase = () => getExecutionPhaseSnapshotV0();
  }
  if (!window.__rhizoh.executionPhaseReport) {
    window.__rhizoh.executionPhaseReport = () => buildExecutionPhaseSynchronizerReportV0();
  }
  if (!window.__rhizoh.runExecutionPhase) {
    window.__rhizoh.runExecutionPhase = (opts) => runAlignedExecutionPhaseV0(opts);
  }
  if (!window.__rhizoh.commitExecutionPhase) {
    window.__rhizoh.commitExecutionPhase = (opts) => commitExecutionPhaseV0(opts);
  }
  if (!window.__rhizoh.beginExecutionPhase) {
    window.__rhizoh.beginExecutionPhase = (opts) => beginExecutionPhaseV0(opts);
  }

  return window.__rhizoh.executionPhase;
}

/** @internal vitest */
export function resetExecutionPhaseSynchronizerForTestV0() {
  phaseSeqV0 = 0;
  currentPhaseV0 = null;
  lastPhaseCommitV0 = null;
  phaseLogV0.length = 0;
  ingestionBufferV0.length = 0;
  phaseSyncEnabledV0 = true;
}

/** @internal vitest */
export function setPhaseSyncEnabledForTestV0(enabled) {
  phaseSyncEnabledV0 = Boolean(enabled);
}
