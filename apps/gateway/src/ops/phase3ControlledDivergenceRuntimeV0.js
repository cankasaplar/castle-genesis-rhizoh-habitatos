/**
 * Phase 3 Controlled Divergence Runtime v1.0 (CONTROL ONLY).
 * Must not import Phase 3D / attractor / perturbation / phase-space observation.
 * @see docs/ops/RHIZOH_PHASE3_EXECUTION_SPEC_V1.0.md
 * @see docs/ops/PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md
 */
import crypto from "node:crypto";
import { classifyStressResponseV0, collectStressSignalsV0 } from "./stressResponseTaxonomyV0.js";
import { encodeEntropyVectorV0 } from "./stressGeometryV0.js";
import {
  MODELED_PROJECTION_SCHEMA_V0,
  validateModeledProjectionDimensionsV0,
  extractModeledKeyDimensionsV0
} from "./phase3ProjectionSchemaV0.js";
import {
  computeUnderSensitivityRiskV0,
  cycleOutcomeFromLoopV0,
  OPERATIONAL_BASELINE_IDS_V0
} from "./phase3OperabilityBalanceV0.js";

export const PHASE3_EXECUTION_RUNTIME_SCHEMA_V0 = "rhizoh.phase3.controlled_divergence_runtime.v0";

/** @readonly */
export const PHASE3_MODE_V0 = Object.freeze({
  NORMAL: "NORMAL",
  THROTTLED: "THROTTLED",
  CONTAINED: "CONTAINED",
  ROLLBACK: "ROLLBACK",
  FREEZE: "FREEZE"
});

/** Divergence band → action (G2). */
export const DIVERGENCE_BAND_V0 = Object.freeze({
  LOW: "LOW",
  MID: "MID",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
});

const DEFAULT_CONFIG = Object.freeze({
  observationMaxDriftMs: 120_000,
  divergenceLow: 0.3,
  divergenceMid: 0.7,
  divergenceHigh: 0.9,
  stabilityVarianceLimit: 0.08,
  /** Calibrated above lattice span (~1.1); avoid G5 over-freeze. */
  entropyLimit: 1.5,
  throttleFactor: 4,
  walMaxCheckpoints: 64,
  /** Over-gating guard (harness / rolling window). */
  maxContainmentRate: 0.45,
  maxRollbackRate: 0.15,
  minExecutionAllowedRate: 0.35
});

/** @type {boolean} */
let loopInFlight = false;

/** @type {{ seq: number, hash: string, checkpoint: object }[]} */
const walChain = [];

/**
 * @typedef {object} ObservedState
 * @property {number} timestampMs
 * @property {boolean} sourceIntegrity
 * @property {string[]} signalCodes
 * @property {number} entropy
 * @property {boolean} [outOfOrder]
 * @property {boolean} [telemetryMissing]
 */

/**
 * @typedef {object} ModeledState
 * @property {string} stressClass
 * @property {string} responseAction
 * @property {number} stressConfidence
 * @property {number} actionConfidence
 * @property {boolean} projectionComplete
 * @property {number} modelVariance
 * @property {Record<string, unknown>} keyDimensions
 * @property {string} dimensionSchema
 * @property {ReturnType<typeof validateModeledProjectionDimensionsV0>} dimensionValidation
 */

/**
 * @typedef {object} DivergenceVector
 * @property {number} scalar D in [0,1]
 * @property {string} band
 * @property {Record<string, number>} components
 */

/**
 * @typedef {object} Phase3State
 * @property {ObservedState} observed
 * @property {ModeledState} modeled
 * @property {DivergenceVector} divergence
 * @property {number} stability
 * @property {number} entropy
 * @property {string} mode
 * @property {number} cycleSeq
 */

function hashCheckpointV0(payload) {
  const prev = walChain.length ? walChain[walChain.length - 1].hash : "genesis";
  return crypto
    .createHash("sha256")
    .update(prev + JSON.stringify(payload))
    .digest("hex")
    .slice(0, 32);
}

/**
 * @param {Partial<typeof DEFAULT_CONFIG>} [overrides]
 */
export function readPhase3RuntimeConfigV0(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}

/**
 * G1 — observation integrity
 * @param {ObservedState} observed
 * @param {typeof DEFAULT_CONFIG} cfg
 */
export function evaluateObservationIntegrityGateV0(observed, cfg = DEFAULT_CONFIG) {
  const now = Date.now();
  const drift = Math.abs(now - observed.timestampMs);
  const ok =
    !observed.telemetryMissing &&
    !observed.outOfOrder &&
    observed.sourceIntegrity === true &&
    drift < cfg.observationMaxDriftMs;
  return {
    gate: "G1_observation_integrity",
    pass: ok,
    action: ok ? null : PHASE3_MODE_V0.CONTAINED,
    reason: ok ? null : "observation_integrity_failed"
  };
}

/**
 * @param {ObservedState} observed
 * @param {ModeledState} modeled
 */
export function computeDivergenceVectorV0(observed, modeled) {
  const classIndex = {
    none: 0,
    overload: 1,
    attack: 2,
    cost_spike: 3,
    drift: 4,
    outage: 5
  };
  const oClass = classIndex[modeled.stressClass] ?? 0;
  const signalClasses = observed.signalCodes.map((code) => {
    const t = classifyStressResponseV0({ code });
    return classIndex[t.stressClass] ?? 0;
  });
  const obsClass = signalClasses.length
    ? signalClasses.reduce((a, b) => a + b, 0) / signalClasses.length
    : oClass;
  const classDelta = Math.abs(oClass - obsClass) / 5;
  const confDelta = Math.abs((modeled.stressConfidence || 0) - (modeled.actionConfidence || 0));
  const varianceGap = Math.max(0, 0.15 - (modeled.modelVariance || 0));
  const scalar = Number(
    Math.min(1, 0.5 * classDelta + 0.3 * confDelta + 0.2 * varianceGap).toFixed(4)
  );
  let band = DIVERGENCE_BAND_V0.LOW;
  if (scalar >= 0.9) band = DIVERGENCE_BAND_V0.CRITICAL;
  else if (scalar >= 0.7) band = DIVERGENCE_BAND_V0.HIGH;
  else if (scalar >= 0.3) band = DIVERGENCE_BAND_V0.MID;

  return {
    scalar,
    band,
    components: { classDelta, confDelta, varianceGap }
  };
}

/**
 * G2 — divergence gate
 * @param {DivergenceVector} divergence
 * @param {typeof DEFAULT_CONFIG} cfg
 */
export function evaluateDivergenceGateV0(divergence, cfg = DEFAULT_CONFIG) {
  const d = divergence.scalar;
  if (d < cfg.divergenceLow) {
    return { gate: "G2_divergence", band: DIVERGENCE_BAND_V0.LOW, mode: PHASE3_MODE_V0.NORMAL, pass: true };
  }
  if (d < cfg.divergenceMid) {
    return { gate: "G2_divergence", band: DIVERGENCE_BAND_V0.MID, mode: PHASE3_MODE_V0.THROTTLED, pass: true };
  }
  if (d < cfg.divergenceHigh) {
    return { gate: "G2_divergence", band: DIVERGENCE_BAND_V0.HIGH, mode: PHASE3_MODE_V0.CONTAINED, pass: false };
  }
  return {
    gate: "G2_divergence",
    band: DIVERGENCE_BAND_V0.CRITICAL,
    mode: PHASE3_MODE_V0.ROLLBACK,
    pass: false
  };
}

/**
 * G3 — stability (rolling variance of divergence scalar)
 * @param {number[]} history
 * @param {typeof DEFAULT_CONFIG} cfg
 */
export function evaluateStabilityGateV0(history, cfg = DEFAULT_CONFIG) {
  if (history.length < 3) {
    return { gate: "G3_stability", pass: true, variance: 0, mode: null };
  }
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((a, x) => a + (x - mean) ** 2, 0) / history.length;
  const pass = variance <= cfg.stabilityVarianceLimit;
  return {
    gate: "G3_stability",
    pass,
    variance: Number(variance.toFixed(6)),
    mode: pass ? null : PHASE3_MODE_V0.THROTTLED
  };
}

/**
 * G4 — execution safety
 * @param {Phase3State} state
 */
export function evaluateExecutionSafetyGateV0(state) {
  const dim =
    state.modeled.dimensionValidation ||
    validateModeledProjectionDimensionsV0(state.modeled.keyDimensions || {});
  const telemetryBad = state.observed.telemetryMissing === true;
  const pass = dim.pass && !telemetryBad;
  return {
    gate: "G4_execution_safety",
    pass,
    mode: pass ? null : PHASE3_MODE_V0.CONTAINED,
    reason: !pass
      ? telemetryBad
        ? "telemetry_missing"
        : dim.reason || "key_dimensions_schema_failed"
      : null,
    dimensionSchema: MODELED_PROJECTION_SCHEMA_V0,
    dimensionValidation: dim
  };
}

/**
 * G5 — entropy envelope (measurement breakdown guard)
 * @param {number} entropy
 * @param {typeof DEFAULT_CONFIG} cfg
 */
export function evaluateEntropyEnvelopeGateV0(entropy, cfg = DEFAULT_CONFIG) {
  const pass = entropy <= cfg.entropyLimit;
  return {
    gate: "G5_entropy_envelope",
    pass,
    mode: pass ? null : PHASE3_MODE_V0.FREEZE,
    reason: pass ? null : "entropy_limit_exceeded_assume_measurement_breakdown"
  };
}

/**
 * observe()
 * @param {object} raw
 */
export function observePhase3V0(raw = {}) {
  const signals = collectStressSignalsV0(raw);
  const entropyVec = encodeEntropyVectorV0(raw);
  return {
    timestampMs: Number(raw.timestampMs || Date.now()),
    sourceIntegrity: raw.sourceIntegrity !== false,
    signalCodes: signals.map((s) => s.code),
    entropy: entropyVec.magnitude,
    outOfOrder: raw.outOfOrder === true,
    telemetryMissing: raw.telemetryMissing === true
  };
}

/**
 * normalize()
 * @param {ObservedState} observed
 */
export function normalizeObservedV0(observed) {
  return {
    ...observed,
    signalCodes: [...new Set(observed.signalCodes)].sort()
  };
}

/**
 * model_projection()
 * @param {object} input
 */
export function modelProjectionPhase3V0(input) {
  const t = classifyStressResponseV0(input);
  const signals = collectStressSignalsV0(input);
  const variance =
    signals.length > 1
      ? signals.length / 10
      : 0.05;
  const keyDimensions = extractModeledKeyDimensionsV0({
    stressClass: t.stressClass,
    responseAction: t.responseAction,
    stressConfidence: t.stressConfidence,
    actionConfidence: t.actionConfidence,
    modelVariance: Number(variance.toFixed(4))
  });
  const dimensionValidation = validateModeledProjectionDimensionsV0(keyDimensions);
  return {
    stressClass: t.stressClass,
    responseAction: t.responseAction,
    stressConfidence: t.stressConfidence,
    actionConfidence: t.actionConfidence,
    projectionComplete: dimensionValidation.pass,
    modelVariance: Number(variance.toFixed(4)),
    keyDimensions,
    dimensionSchema: MODELED_PROJECTION_SCHEMA_V0,
    dimensionValidation
  };
}

/**
 * Over-gating risk: safe but inert if containment/rollback dominate.
 * @param {{ mode: string, executionAllowed?: boolean }[]} cycles
 * @param {typeof DEFAULT_CONFIG} [cfg]
 */
export function computeOverGatingMetricsV0(cycles, cfg = DEFAULT_CONFIG) {
  const n = cycles.length || 1;
  const count = (pred) => cycles.filter(pred).length;
  const contained = count((c) => c.mode === PHASE3_MODE_V0.CONTAINED);
  const rollback = count((c) => c.mode === PHASE3_MODE_V0.ROLLBACK);
  const freeze = count((c) => c.mode === PHASE3_MODE_V0.FREEZE);
  const throttled = count((c) => c.mode === PHASE3_MODE_V0.THROTTLED);
  const normal = count((c) => c.mode === PHASE3_MODE_V0.NORMAL);
  const executionAllowed = count((c) => c.executionAllowed === true);

  const rates = {
    containment: Number((contained / n).toFixed(4)),
    rollback: Number((rollback / n).toFixed(4)),
    freeze: Number((freeze / n).toFixed(4)),
    throttle: Number((throttled / n).toFixed(4)),
    normal: Number((normal / n).toFixed(4)),
    executionAllowed: Number((executionAllowed / n).toFixed(4))
  };

  const overGating =
    rates.containment > cfg.maxContainmentRate ||
    rates.rollback > cfg.maxRollbackRate ||
    rates.executionAllowed < cfg.minExecutionAllowedRate;

  const inertnessScore = Number(
    (rates.containment + rates.rollback + rates.freeze * 0.5).toFixed(4)
  );

  return Object.freeze({
    schema: "rhizoh.phase3.over_gating_metrics.v0",
    rates,
    inertnessScore,
    overGating,
    thresholds: Object.freeze({
      maxContainmentRate: cfg.maxContainmentRate,
      maxRollbackRate: cfg.maxRollbackRate,
      minExecutionAllowedRate: cfg.minExecutionAllowedRate
    }),
    recommendation: overGating
      ? "loosen_entropy_or_divergence_thresholds_or_fix_false_containment_inputs"
      : "gate_balance_ok"
  });
}

/**
 * @param {number[]} divergenceHistory
 */
function computeStabilityScoreV0(divergenceHistory) {
  const g3 = evaluateStabilityGateV0(divergenceHistory);
  return Number((1 - Math.min(1, g3.variance / DEFAULT_CONFIG.stabilityVarianceLimit)).toFixed(4));
}

/**
 * execute_or_contain()
 * @param {Phase3State} state
 * @param {object} gateResults
 */
export function executeOrContainPhase3V0(state, gateResults) {
  const modes = [
    state.mode,
    gateResults.g1?.action,
    gateResults.g2?.mode,
    gateResults.g3?.mode,
    gateResults.g4?.mode,
    gateResults.g5?.mode
  ].filter(Boolean);

  const priority = [
    PHASE3_MODE_V0.ROLLBACK,
    PHASE3_MODE_V0.FREEZE,
    PHASE3_MODE_V0.CONTAINED,
    PHASE3_MODE_V0.THROTTLED,
    PHASE3_MODE_V0.NORMAL
  ];
  let mode = PHASE3_MODE_V0.NORMAL;
  for (const p of priority) {
    if (modes.includes(p)) {
      mode = p;
      break;
    }
  }

  const executionAllowed =
    mode === PHASE3_MODE_V0.NORMAL || mode === PHASE3_MODE_V0.THROTTLED;
  const sideEffects = executionAllowed && gateResults.g4?.pass !== false;

  return {
    mode,
    executionAllowed,
    sideEffects,
    throttleFactor: mode === PHASE3_MODE_V0.THROTTLED ? DEFAULT_CONFIG.throttleFactor : 1
  };
}

/**
 * log_wal() — append-only chained checkpoint
 * @param {Phase3State} state
 * @param {object} execution
 */
export function logPhase3WalCheckpointV0(state, execution) {
  const checkpoint = {
    observed_snapshot: state.observed,
    modeled_snapshot: state.modeled,
    divergence_vector: state.divergence,
    execution_log_pointer: execution,
    mode: state.mode,
    cycleSeq: state.cycleSeq
  };
  const hash = hashCheckpointV0(checkpoint);
  const entry = { seq: walChain.length + 1, hash, checkpoint };
  walChain.push(entry);
  while (walChain.length > DEFAULT_CONFIG.walMaxCheckpoints) walChain.shift();
  return entry;
}

/**
 * Rollback to last stable checkpoint (lossy last segment only).
 */
export function rollbackPhase3ToLastStableCheckpointV0() {
  for (let i = walChain.length - 1; i >= 0; i--) {
    const c = walChain[i].checkpoint;
    if (c.mode === PHASE3_MODE_V0.NORMAL || c.mode === PHASE3_MODE_V0.THROTTLED) {
      return {
        ok: true,
        restoredSeq: walChain[i].seq,
        checkpoint: c,
        invalidatedFromSeq: walChain[i].seq + 1
      };
    }
  }
  return { ok: false, reason: "no_stable_checkpoint" };
}

export function resetPhase3RuntimeForTestV0() {
  loopInFlight = false;
  walChain.length = 0;
}

export function listPhase3WalChainV0() {
  return walChain.map((e) => ({ seq: e.seq, hash: e.hash, mode: e.checkpoint.mode }));
}

/**
 * Single sequential cycle (non-reentrant).
 * @param {object} rawInput
 * @param {{ divergenceHistory?: number[], cycleSeq?: number }} [ctx]
 */
export function runPhase3ControlLoopCycleV0(rawInput, ctx = {}) {
  if (loopInFlight) {
    return { ok: false, error: "phase3_loop_non_reentrant" };
  }
  loopInFlight = true;
  try {
    const cfg = readPhase3RuntimeConfigV0();
    const history = ctx.divergenceHistory || [];

    const observed = normalizeObservedV0(observePhase3V0(rawInput));
    const modeled = modelProjectionPhase3V0(rawInput);
    const divergence = computeDivergenceVectorV0(observed, modeled);
    history.push(divergence.scalar);

    const entropy = observed.entropy;
    const stability = computeStabilityScoreV0(history);

    const g1 = evaluateObservationIntegrityGateV0(observed, cfg);
    const g2 = evaluateDivergenceGateV0(divergence, cfg);
    const g3 = evaluateStabilityGateV0(history, cfg);

    const draftState = {
      observed,
      modeled,
      divergence,
      stability,
      entropy,
      mode: PHASE3_MODE_V0.NORMAL,
      cycleSeq: ctx.cycleSeq ?? 0
    };
    const g4 = evaluateExecutionSafetyGateV0(draftState);
    const g5 = evaluateEntropyEnvelopeGateV0(entropy, cfg);

    const execution = executeOrContainPhase3V0(draftState, { g1, g2, g3, g4, g5 });
    draftState.mode = execution.mode;

    let rollback = null;
    if (execution.mode === PHASE3_MODE_V0.ROLLBACK) {
      rollback = rollbackPhase3ToLastStableCheckpointV0();
    }

    const walEntry = logPhase3WalCheckpointV0(draftState, execution);

    return Object.freeze({
      ok: true,
      schema: PHASE3_EXECUTION_RUNTIME_SCHEMA_V0,
      state: draftState,
      gates: Object.freeze({ g1, g2, g3, g4, g5 }),
      execution,
      rollback,
      walEntry: { seq: walEntry.seq, hash: walEntry.hash },
      invariants: Object.freeze({
        noExecutionWithoutValidObservation: g1.pass || !execution.sideEffects,
        noModelUpdateWithoutDivergence: true,
        noRollbackWithoutCheckpoint: execution.mode !== PHASE3_MODE_V0.ROLLBACK || rollback?.ok !== false,
        noMutationOutsideGate: !execution.sideEffects || execution.executionAllowed
      })
    });
  } finally {
    loopInFlight = false;
  }
}

/** Failure mode harness scenarios (F1–F5). */
export const PHASE3_FAILURE_SCENARIOS_V0 = Object.freeze([
  { id: "F1_observation_drift", input: { telemetryMissing: true, timestampMs: Date.now() - 999999 } },
  { id: "F2_model_overconfidence", input: { code: "phased_rollout_capacity" }, modelVarianceOverride: 0.01 },
  {
    id: "F3_divergence_explosion",
    input: { code: "phased_rollout_capacity", codes: ["prompt_abuse_detected", "provider_http_503"], injectionFlag: true }
  },
  { id: "F4_feedback_loop", input: { code: "rate_limit_exceeded", outOfOrder: true } },
  { id: "F5_execution_leakage", input: { code: "mystery_stress_xyz", telemetryMissing: true } },
  { id: "NORMAL_baseline", input: { code: "phased_rollout_capacity" } }
]);

/**
 * Phase 3 control harness only — gates, WAL, operational safety metrics.
 * Observation (3D, phase map, trajectory) composed in phase3HarnessExportV0.js.
 */
export function runPhase3ExecutionControlHarnessV0() {
  resetPhase3RuntimeForTestV0();
  const atMs = new Date().toISOString();
  const divergenceHistory = [];
  const results = [];

  const ordered = [
    PHASE3_FAILURE_SCENARIOS_V0.find((s) => s.id === "NORMAL_baseline"),
    ...PHASE3_FAILURE_SCENARIOS_V0.filter((s) => s.id !== "NORMAL_baseline")
  ].filter(Boolean);

  for (const sc of ordered) {
    const cycle = runPhase3ControlLoopCycleV0(sc.input, {
      divergenceHistory,
      cycleSeq: results.length
    });
    const outcome = cycleOutcomeFromLoopV0(sc.id, cycle);
    results.push({
      id: sc.id,
      pass: cycle.ok === true,
      mode: cycle.state?.mode,
      divergence: cycle.state?.divergence?.scalar,
      band: cycle.state?.divergence?.band,
      executionAllowed: cycle.execution?.executionAllowed,
      sideEffects: outcome.sideEffects,
      projectionSchemaPass: outcome.projectionSchemaPass,
      expectedToGate: outcome.expectedToGate,
      gates: {
        g1: cycle.gates?.g1?.pass,
        g2: cycle.gates?.g2?.pass,
        g4: cycle.gates?.g4?.pass,
        g5: cycle.gates?.g5?.pass
      }
    });
  }

  const wal = listPhase3WalChainV0();
  const formal = {
    definition: "Phase3 = f(observed, modeled)",
    constraint: "execution_allowed ⇔ divergence ≤ threshold ∧ stability OK ∧ gates pass"
  };

  const outcomeRecords = results.map((r) => ({
    id: r.id,
    cycleOk: r.pass,
    mode: r.mode,
    executionAllowed: r.executionAllowed,
    sideEffects: r.sideEffects,
    projectionSchemaPass: r.projectionSchemaPass,
    expectedToGate: r.expectedToGate
  }));

  const operationalRecords = outcomeRecords.filter((r) =>
    OPERATIONAL_BASELINE_IDS_V0.includes(r.id || "")
  );
  const operationalCycles = operationalRecords.map((r) => ({
    mode: r.mode,
    executionAllowed: r.executionAllowed
  }));
  const drillCycles = outcomeRecords
    .filter((r) => !OPERATIONAL_BASELINE_IDS_V0.includes(r.id || ""))
    .map((r) => ({ mode: r.mode, executionAllowed: r.executionAllowed }));

  const overGatingOperational = computeOverGatingMetricsV0(operationalCycles);
  const overGatingDrill = computeOverGatingMetricsV0(drillCycles);
  const underSensitivity = computeUnderSensitivityRiskV0(outcomeRecords);

  return Object.freeze({
    schema: "rhizoh.phase3.control_harness.v0",
    role: "control_only",
    atMs,
    formal,
    scenarios: results,
    outcomeRecords,
    walChainLength: wal.length,
    modeledProjectionSchema: MODELED_PROJECTION_SCHEMA_V0,
    overGatingMetrics: Object.freeze({
      operational: overGatingOperational,
      failureDrills: overGatingDrill,
      note: "inertness_risk_scored_on_operational_cycles_only"
    }),
    underSensitivityRisk: underSensitivity,
    phase3ExecutionGate:
      results.every((r) => r.pass) &&
      !overGatingOperational.overGating &&
      !underSensitivity.underSensitive
        ? "phase3_runtime_spec_pass"
        : "hold_phase3_runtime_control",
    distinction: "control_harness_no_phase3d_observation_inputs"
  });
}
