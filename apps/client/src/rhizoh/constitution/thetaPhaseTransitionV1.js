/**
 * RHIZOH θ phase transition — discrete organism modes from constitutional stress memory θ.
 */

export const RHIZOH_THETA_PHASE_VERSION = "1.0.0";

/** θ below this → elastic trust (relaxed membrane bias). */
export const RHIZOH_THETA_PHASE_ELASTIC_MAX = 0.2;

/** θ above this → immune aggression (strict gates / runtime hedge bias). */
export const RHIZOH_THETA_PHASE_IMMUNE_MIN = 0.7;

/**
 * @typedef {'elastic_trust' | 'constitutional_balanced' | 'immune_aggression'} RhizohThetaPhase
 */

/** Calibration hints for downstream layers (documentation + orchestrators). */
export const RHIZOH_THETA_PHASE_MODIFIERS_V1 = Object.freeze({
  elastic_trust: Object.freeze({
    organismBias: "relax",
    claimCapBias: 0.06,
    llmHedgeBias: "low",
    replaySealAggression: "low"
  }),
  constitutional_balanced: Object.freeze({
    organismBias: "neutral",
    claimCapBias: 0,
    llmHedgeBias: "medium",
    replaySealAggression: "medium"
  }),
  immune_aggression: Object.freeze({
    organismBias: "strict",
    claimCapBias: -0.12,
    llmHedgeBias: "high",
    replaySealAggression: "high"
  })
});

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {number} theta effective θ after adaptation tick [0,1]
 */
export function resolveRhizohThetaPhase(theta) {
  const t = clamp01(theta);
  if (t > RHIZOH_THETA_PHASE_IMMUNE_MIN) {
    return {
      phase: /** @type {RhizohThetaPhase} */ ("immune_aggression"),
      theta: t,
      ...RHIZOH_THETA_PHASE_MODIFIERS_V1.immune_aggression
    };
  }
  if (t < RHIZOH_THETA_PHASE_ELASTIC_MAX) {
    return {
      phase: /** @type {RhizohThetaPhase} */ ("elastic_trust"),
      theta: t,
      ...RHIZOH_THETA_PHASE_MODIFIERS_V1.elastic_trust
    };
  }
  return {
    phase: /** @type {RhizohThetaPhase} */ ("constitutional_balanced"),
    theta: t,
    ...RHIZOH_THETA_PHASE_MODIFIERS_V1.constitutional_balanced
  };
}
