/**
 * RESEARCH-ONLY — Rhizoh Cube Field spiral math v0 (Phase 2).
 *
 * Pure functions: CubeState → transformedSignal → axis projections → visual coefficients.
 * No React · no Three.js · no state mutation · no execution side effects.
 *
 * @see docs/RHIZOH_CUBE_FIELD_V0.md §5.1 · §6.0
 */

export const CUBE_FIELD_SPIRAL_MATH_SCHEMA_V0 = "rhizoh.cube_field.spiral_math.v0";
export const CUBE_FIELD_CUBE_STATE_SCHEMA_V0 = "rhizoh.cube_field.cube_state.v0";
export const CUBE_FIELD_DRIFT_OBSERVATION_SCHEMA_V0 = "rhizoh.cube_field.drift_observation.v0";

/** Hash of motion→meaning binding table version (§9 simulation gate). */
export const CUBE_FIELD_VISUAL_BINDING_HASH_V0 = "rhizoh.cube_field.binding.v0.1";

export const CUBE_FIELD_AXIS_V0 = Object.freeze([
  "observation",
  "reasoning",
  "memory",
  "action"
]);

export const CUBE_FIELD_AXIS_MOTION_KIND_V0 = Object.freeze({
  observation: "monotonic_smoothed",
  reasoning: "oscillatory_phase",
  memory: "monotonic_decay_floor",
  action: "threshold_discrete"
});

/** v0 decay floor for memory axis (§5.1). */
export const CUBE_FIELD_MEMORY_DECAY_FLOOR_V0 = 0.12;

/** v0 action intent thresholds → 4 discrete levels (§5.1). */
export const CUBE_FIELD_ACTION_THRESHOLDS_V0 = Object.freeze([0.25, 0.5, 0.75]);

const TAU = Math.PI * 2;
const CONFIDENCE_UNCERTAINTY_TOLERANCE_V0 = 0.05;

/**
 * @param {number} n
 * @returns {number}
 */
export function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {number} rad
 * @returns {number}
 */
export function normalizePhaseRad(rad) {
  const x = Number(rad);
  if (!Number.isFinite(x)) return 0;
  const m = x % TAU;
  return m < 0 ? m + TAU : m;
}

/**
 * @param {Partial<import('./cubeFieldSpiralMathV0.js').CubeStateInputV0>} raw
 * @returns {import('./cubeFieldSpiralMathV0.js').CubeStateNormalizedV0}
 */
export function normalizeCubeStateV0(raw) {
  const confidence = clamp01(raw?.confidence);
  let uncertainty = clamp01(raw?.uncertainty);
  if (Math.abs(confidence + uncertainty - 1) > CONFIDENCE_UNCERTAINTY_TOLERANCE_V0) {
    uncertainty = clamp01(1 - confidence);
  }

  const offsets = Array.isArray(raw?.armPhaseOffsetRad) ? raw.armPhaseOffsetRad : [];
  const armPhaseOffsetRad = CUBE_FIELD_AXIS_V0.map((_, i) =>
    normalizePhaseRad(offsets[i] ?? 0)
  );

  const intentRaw = raw?.intentVector || {};
  const intentVector = Object.freeze({
    observation: clamp01(intentRaw.observation),
    reasoning: clamp01(intentRaw.reasoning),
    memory: clamp01(intentRaw.memory),
    action: clamp01(intentRaw.action)
  });

  return Object.freeze({
    schemaVersion: CUBE_FIELD_CUBE_STATE_SCHEMA_V0,
    attention: clamp01(raw?.attention),
    confidence,
    uncertainty,
    drift: clamp01(raw?.drift),
    cognitiveLoad: clamp01(raw?.cognitiveLoad),
    intentVector,
    spiralPhaseRad: normalizePhaseRad(raw?.spiralPhaseRad),
    armPhaseOffsetRad: Object.freeze(armPhaseOffsetRad),
    contradictionPressure: clamp01(raw?.contradictionPressure),
    sourceKind: raw?.sourceKind || "synthetic_fixture",
    sourceRef: String(raw?.sourceRef || "fixture_unset"),
    correlationId: String(raw?.correlationId || ""),
    readOnly: true
  });
}

/**
 * Global derived scalars (§3.2) — monotonic where spec notes.
 *
 * @param {import('./cubeFieldSpiralMathV0.js').CubeStateNormalizedV0} state
 */
export function projectGlobalDerivedV0(state) {
  return Object.freeze({
    expansion01: clamp01(state.uncertainty * 0.6 + state.attention * 0.4),
    contraction01: clamp01(state.confidence),
    rotationRate: clamp01(state.cognitiveLoad),
    colorShift01: clamp01(state.drift)
  });
}

/**
 * Observation: monotonic + smoothing (attention blend).
 *
 * @param {import('./cubeFieldSpiralMathV0.js').CubeStateNormalizedV0} state
 * @param {ReturnType<typeof projectGlobalDerivedV0>} derived
 */
export function projectObservationAxisV0(state, derived) {
  const intent = state.intentVector.observation;
  const smoothed = clamp01(intent * 0.72 + state.attention * 0.28);
  const radialExtent01 = clamp01(
    smoothed * derived.expansion01 * (1 - derived.contraction01 * 0.35)
  );
  return Object.freeze({
    axis: "observation",
    armIndex: 0,
    motionKind: CUBE_FIELD_AXIS_MOTION_KIND_V0.observation,
    radialExtent01,
    phaseRad: state.armPhaseOffsetRad[0],
    smoothedIntent01: smoothed
  });
}

/**
 * Reasoning: oscillatory + phase shift (non-monotonic by design).
 *
 * @param {import('./cubeFieldSpiralMathV0.js').CubeStateNormalizedV0} state
 * @param {ReturnType<typeof projectGlobalDerivedV0>} derived
 */
export function projectReasoningAxisV0(state, derived) {
  const intent = state.intentVector.reasoning;
  const phase = state.spiralPhaseRad + state.armPhaseOffsetRad[1];
  const oscillation = 0.5 + 0.5 * Math.sin(phase);
  const radialExtent01 = clamp01(intent * derived.expansion01 * oscillation);
  return Object.freeze({
    axis: "reasoning",
    armIndex: 1,
    motionKind: CUBE_FIELD_AXIS_MOTION_KIND_V0.reasoning,
    radialExtent01,
    phaseRad: normalizePhaseRad(phase),
    oscillation01: clamp01(oscillation)
  });
}

/**
 * Memory: monotonic with decay floor.
 *
 * @param {import('./cubeFieldSpiralMathV0.js').CubeStateNormalizedV0} state
 * @param {ReturnType<typeof projectGlobalDerivedV0>} derived
 */
export function projectMemoryAxisV0(state, derived) {
  const intent = state.intentVector.memory;
  const withFloor = Math.max(CUBE_FIELD_MEMORY_DECAY_FLOOR_V0, intent * derived.expansion01);
  const radialExtent01 = clamp01(withFloor * (1 - derived.contraction01 * 0.25));
  return Object.freeze({
    axis: "memory",
    armIndex: 2,
    motionKind: CUBE_FIELD_AXIS_MOTION_KIND_V0.memory,
    radialExtent01,
    phaseRad: state.armPhaseOffsetRad[2],
    decayFloorApplied: intent * derived.expansion01 < CUBE_FIELD_MEMORY_DECAY_FLOOR_V0
  });
}

/**
 * Action: threshold discrete jumps only (4 levels).
 *
 * @param {import('./cubeFieldSpiralMathV0.js').CubeStateNormalizedV0} state
 * @param {ReturnType<typeof projectGlobalDerivedV0>} derived
 */
export function projectActionAxisV0(state, derived) {
  const intent = state.intentVector.action;
  let discreteLevel = 0;
  for (const threshold of CUBE_FIELD_ACTION_THRESHOLDS_V0) {
    if (intent >= threshold) discreteLevel += 1;
  }
  const discrete01 = discreteLevel / CUBE_FIELD_ACTION_THRESHOLDS_V0.length;
  const radialExtent01 = clamp01(discrete01 * derived.expansion01);
  return Object.freeze({
    axis: "action",
    armIndex: 3,
    motionKind: CUBE_FIELD_AXIS_MOTION_KIND_V0.action,
    radialExtent01,
    phaseRad: state.armPhaseOffsetRad[3],
    discreteLevel,
    discrete01
  });
}

const AXIS_PROJECTORS_V0 = Object.freeze([
  projectObservationAxisV0,
  projectReasoningAxisV0,
  projectMemoryAxisV0,
  projectActionAxisV0
]);

/**
 * @param {import('./cubeFieldSpiralMathV0.js').CubeStateNormalizedV0} state
 * @param {ReturnType<typeof projectGlobalDerivedV0>} derived
 */
export function projectAllAxisSignalsV0(state, derived) {
  return Object.freeze(AXIS_PROJECTORS_V0.map((fn) => fn(state, derived)));
}

/**
 * CubeState → transformedSignal (global derived + coherence flags).
 *
 * @param {Partial<import('./cubeFieldSpiralMathV0.js').CubeStateInputV0>} raw
 * @param {{ prev?: Partial<import('./cubeFieldSpiralMathV0.js').CubeStateInputV0> | null }} [opts]
 */
export function transformCubeStateToSignalV0(raw, opts = {}) {
  const state = normalizeCubeStateV0(raw);
  const derived = projectGlobalDerivedV0(state);
  const prev = opts.prev ? normalizeCubeStateV0(opts.prev) : null;
  const coherenceWarnings = collectCoherenceWarningsV0(state, derived, prev);

  return Object.freeze({
    schema: CUBE_FIELD_SPIRAL_MATH_SCHEMA_V0,
    state,
    derived,
    coherenceWarnings: Object.freeze(coherenceWarnings),
    readOnly: true,
    visualBindingHash: CUBE_FIELD_VISUAL_BINDING_HASH_V0
  });
}

/**
 * Full pipeline: CubeState → axis projections (no cross-axis intent bleed).
 *
 * @param {Partial<import('./cubeFieldSpiralMathV0.js').CubeStateInputV0>} raw
 * @param {{ prev?: Partial<import('./cubeFieldSpiralMathV0.js').CubeStateInputV0> | null }} [opts]
 */
export function projectCubeFieldV0(raw, opts = {}) {
  const signal = transformCubeStateToSignalV0(raw, opts);
  const axes = projectAllAxisSignalsV0(signal.state, signal.derived);
  const visual = projectAxisToVisualCoefficientsV0(signal, axes);
  return Object.freeze({
    ...signal,
    axes,
    visual
  });
}

/**
 * Axis projections → visual coefficients (Phase 4 renderer consumes this).
 *
 * @param {ReturnType<typeof transformCubeStateToSignalV0>} signal
 * @param {ReturnType<typeof projectAllAxisSignalsV0>} axes
 */
export function projectAxisToVisualCoefficientsV0(signal, axes) {
  const { state, derived } = signal;
  const phaseSpread01 = clamp01(
    state.contradictionPressure *
      (axes.reduce((acc, a) => acc + Math.abs(Math.sin(a.phaseRad)), 0) / axes.length)
  );

  const arms = axes.map((a) =>
    Object.freeze({
      armIndex: a.armIndex,
      axis: a.axis,
      motionKind: a.motionKind,
      radialExtent01: a.radialExtent01,
      phaseRad: a.phaseRad,
      opacity01: clamp01(1 - state.uncertainty * 0.45)
    })
  );

  return Object.freeze({
    arms: Object.freeze(arms),
    cube: Object.freeze({
      uniformScale01: clamp01(0.88 + state.attention * 0.12),
      emissive01: clamp01(state.confidence),
      colorShift01: derived.colorShift01,
      opacity01: clamp01(1 - state.uncertainty * 0.55),
      rotationRate: derived.rotationRate,
      phaseSpread01
    }),
    readOnly: true
  });
}

/**
 * @param {import('./cubeFieldSpiralMathV0.js').CubeStateNormalizedV0} state
 * @param {ReturnType<typeof projectGlobalDerivedV0>} derived
 * @param {import('./cubeFieldSpiralMathV0.js').CubeStateNormalizedV0 | null} prev
 * @returns {string[]}
 */
export function collectCoherenceWarningsV0(state, derived, prev) {
  const warnings = [];
  if (prev && state.confidence > prev.confidence + 0.05) {
    if (derived.expansion01 > projectGlobalDerivedV0(prev).expansion01 + 0.05) {
      warnings.push("extent_confidence_mismatch");
    }
  }
  if (state.contradictionPressure > 0.7) {
    warnings.push("sustained_contradiction");
  }
  return warnings;
}

/**
 * §6.0 — Drift is measurement only; envelope carries no side-effect hooks.
 *
 * @param {{
 *   cubeId: string,
 *   driftBefore: number,
 *   driftAfter: number,
 *   trigger: "tick" | "adapter_ingress" | "manual_fixture",
 *   sourceKind: string,
 *   sourceRef: string,
 *   correlationId?: string,
 *   ts?: string
 * }} io
 */
export function buildCubeFieldDriftObservationV0(io) {
  const driftBefore = clamp01(io.driftBefore);
  const driftAfter = clamp01(io.driftAfter);
  return Object.freeze({
    schema: CUBE_FIELD_DRIFT_OBSERVATION_SCHEMA_V0,
    correlationId: String(io.correlationId || ""),
    ts: io.ts || new Date().toISOString(),
    cubeId: String(io.cubeId || "cube_default"),
    driftBefore,
    driftAfter,
    delta: driftAfter - driftBefore,
    trigger: io.trigger,
    sourceKind: io.sourceKind,
    sourceRef: io.sourceRef,
    visualBindingHash: CUBE_FIELD_VISUAL_BINDING_HASH_V0,
    measurementOnly: true,
    mayTriggerExecution: false
  });
}

/**
 * Runtime guard: drift observations must never claim execution authority.
 *
 * @param {ReturnType<typeof buildCubeFieldDriftObservationV0>} obs
 */
export function assertDriftMeasurementOnlyV0(obs) {
  if (obs?.mayTriggerExecution === true) {
    throw new Error("cube_field_drift_invariant_violation: drift may not trigger execution");
  }
  if (obs?.measurementOnly !== true) {
    throw new Error("cube_field_drift_invariant_violation: drift observation must be measurementOnly");
  }
  return true;
}

/**
 * @typedef {Object} CubeStateInputV0
 * @property {number} [attention]
 * @property {number} [confidence]
 * @property {number} [uncertainty]
 * @property {number} [drift]
 * @property {number} [cognitiveLoad]
 * @property {{ observation?: number, reasoning?: number, memory?: number, action?: number }} [intentVector]
 * @property {number} [spiralPhaseRad]
 * @property {number[]} [armPhaseOffsetRad]
 * @property {number} [contradictionPressure]
 * @property {string} [sourceKind]
 * @property {string} [sourceRef]
 * @property {string} [correlationId]
 */

/**
 * @typedef {CubeStateInputV0 & {
 *   schemaVersion: string,
 *   intentVector: { observation: number, reasoning: number, memory: number, action: number },
 *   armPhaseOffsetRad: readonly number[],
 *   readOnly: true
 * }} CubeStateNormalizedV0
 */
