/**
 * Castle Reality Phase Engine v1.5 — stable / transitional / volatile / locked.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_5.md
 */

export const CASTLE_REALITY_PHASE_SCHEMA_V1_5 = "castle.reality_phase.v1.5";

export const REALITY_PHASE_V1_5 = Object.freeze({
  STABLE: "stable",
  TRANSITIONAL: "transitional",
  VOLATILE: "volatile",
  LOCKED: "locked"
});

const STABILITY_THRESHOLD_V1_5 = 0.22;
const VOLATILITY_THRESHOLD_V1_5 = 0.48;
const LOCK_HOLD_MS_V1_5 = 4000;

/** @type {object | null} */
let lastPhaseStateV1_5 = null;

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

export function computeRealityPhaseV1_5(input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const volatility = clamp01(input.volatility);
  const maxDeformationDelta = clamp01(input.maxDeformationDelta);
  const contextShiftPending = input.contextShiftPending === true;
  const userInitiated = input.userInitiated === true;
  const emergency = input.emergency === true;
  const dominantThreadStable = input.dominantThreadStable === true;

  let phase = REALITY_PHASE_V1_5.STABLE;
  let stabilityScore = Number((1 - volatility - maxDeformationDelta * 0.5).toFixed(4));

  if (emergency) {
    phase = REALITY_PHASE_V1_5.VOLATILE;
    stabilityScore = 0;
  } else if (
    lastPhaseStateV1_5?.phase === REALITY_PHASE_V1_5.LOCKED &&
    atMs - (lastPhaseStateV1_5.lockedAtMs || 0) < LOCK_HOLD_MS_V1_5 &&
    !userInitiated
  ) {
    phase = REALITY_PHASE_V1_5.LOCKED;
    stabilityScore = Math.max(stabilityScore, 0.85);
  } else if (volatility >= VOLATILITY_THRESHOLD_V1_5 || maxDeformationDelta >= 0.35) {
    phase = REALITY_PHASE_V1_5.VOLATILE;
    stabilityScore = Math.min(stabilityScore, 0.25);
  } else if (contextShiftPending || maxDeformationDelta >= STABILITY_THRESHOLD_V1_5) {
    phase = REALITY_PHASE_V1_5.TRANSITIONAL;
    stabilityScore = Number(clamp01(0.45 + (1 - volatility) * 0.3).toFixed(4));
  } else if (stabilityScore >= 0.72 && !contextShiftPending && dominantThreadStable) {
    phase = REALITY_PHASE_V1_5.LOCKED;
  }

  const governor = phaseGovernorParamsV1_5(phase);

  const state = Object.freeze({
    schema: CASTLE_REALITY_PHASE_SCHEMA_V1_5,
    phase,
    stabilityScore,
    volatility,
    maxDeformationDelta,
    contextShiftPending,
    deformationScale: governor.deformationScale,
    inertiaCap: governor.inertiaCap,
    learningEnabled: governor.learningEnabled,
    freezeFrame: governor.freezeFrame,
    lockedAtMs: phase === REALITY_PHASE_V1_5.LOCKED ? atMs : lastPhaseStateV1_5?.lockedAtMs || null,
    atMs
  });

  lastPhaseStateV1_5 = state;
  return state;
}

function phaseGovernorParamsV1_5(phase) {
  switch (phase) {
    case REALITY_PHASE_V1_5.LOCKED:
      return Object.freeze({
        deformationScale: 0.08,
        inertiaCap: 0.95,
        learningEnabled: false,
        freezeFrame: true
      });
    case REALITY_PHASE_V1_5.STABLE:
      return Object.freeze({
        deformationScale: 0.35,
        inertiaCap: 0.75,
        learningEnabled: true,
        freezeFrame: false
      });
    case REALITY_PHASE_V1_5.TRANSITIONAL:
      return Object.freeze({
        deformationScale: 0.65,
        inertiaCap: 0.55,
        learningEnabled: true,
        freezeFrame: false
      });
    case REALITY_PHASE_V1_5.VOLATILE:
    default:
      return Object.freeze({
        deformationScale: 1,
        inertiaCap: 0.35,
        learningEnabled: true,
        freezeFrame: false
      });
  }
}

export function getLastRealityPhaseV1_5() {
  return lastPhaseStateV1_5;
}

/** @internal vitest */
export function __resetRealityPhaseForTestV1_5() {
  lastPhaseStateV1_5 = null;
}
