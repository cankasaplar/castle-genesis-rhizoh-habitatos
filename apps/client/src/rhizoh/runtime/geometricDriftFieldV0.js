/**
 * GeometricDriftFieldV0.1 — adaptive Bayesian policy evolution field.
 * Canonical teacher = anchor (not authority). Mirror = exploration prior.
 * RESEARCH-ONLY — drift is mutation field; exploration never collapses to error punishment.
 */

import { RHIZOH_GEOMETRY_PATTERN_FAMILY_V0 } from "./rhizohGeometryPatternFamilyV0.js";
import { REGRET_TOPOLOGY_TAG_V0 } from "./regretVectorSystemV0.js";

export const GEOMETRIC_DRIFT_FIELD_SCHEMA_V0 = "rhizoh.geometric_drift_field.v0.1";

/** Starting priors — not fixed weights; adaptive field evolves from here. */
export const ADAPTIVE_DRIFT_PRIOR_V0 = Object.freeze({
  canonical: 0.7,
  mirror: 0.3
});

export const POLICY_CANONICAL_WEIGHT_V0 = ADAPTIVE_DRIFT_PRIOR_V0.canonical;
export const POLICY_MIRROR_WEIGHT_V0 = ADAPTIVE_DRIFT_PRIOR_V0.mirror;

export const ADAPTIVE_DRIFT_DELTA_V0 = Object.freeze({
  winExploration: 0.05,
  lossAnneal: 0.03,
  neutralLatent: 0.02
});

export const ADAPTIVE_WEIGHT_BOUNDS_V0 = Object.freeze({
  mirrorMin: 0.15,
  mirrorMax: 0.45,
  canonicalMin: 0.55,
  canonicalMax: 0.85
});

export const POLICY_EVOLUTION_STATUS_V0 = Object.freeze({
  TRAJECTORY_ALIGNED: "TRAJECTORY_ALIGNED",
  ALTERNATIVE_UNIVERSE_PRESERVED: "ALTERNATIVE_UNIVERSE_PRESERVED",
  MUTATION_CANDIDATE: "MUTATION_CANDIDATE",
  LATENT_SPACE_EXPANSION: "LATENT_SPACE_EXPANSION"
});

const ALT_RING_MAX_V0 = 64;

/** @type {object[]} */
let alternativeRingV0 = [];

/** @type {{
 *   explorationBias: number,
 *   consecutiveLossStreak: number,
 *   latentExpansionCount: number,
 *   matchOutcomesApplied: number
 * }} */
let adaptiveStateV0 = {
  explorationBias: 0,
  consecutiveLossStreak: 0,
  latentExpansionCount: 0,
  matchOutcomesApplied: 0
};

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clampV0(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function readAdaptiveDriftStateV0() {
  const weights = computeAdaptiveWeightsV0();
  return Object.freeze({
    ...adaptiveStateV0,
    ...weights,
    prior: ADAPTIVE_DRIFT_PRIOR_V0,
    governance: "canonical_is_anchor_not_authority"
  });
}

export function resetAdaptiveDriftStateForTestV0() {
  adaptiveStateV0 = {
    explorationBias: 0,
    consecutiveLossStreak: 0,
    latentExpansionCount: 0,
    matchOutcomesApplied: 0
  };
}

function computeAdaptiveWeightsV0() {
  const mirrorWeight = clampV0(
    ADAPTIVE_DRIFT_PRIOR_V0.mirror + adaptiveStateV0.explorationBias,
    ADAPTIVE_WEIGHT_BOUNDS_V0.mirrorMin,
    ADAPTIVE_WEIGHT_BOUNDS_V0.mirrorMax
  );
  const canonicalWeight = clampV0(
    1 - mirrorWeight,
    ADAPTIVE_WEIGHT_BOUNDS_V0.canonicalMin,
    ADAPTIVE_WEIGHT_BOUNDS_V0.canonicalMax
  );
  return Object.freeze({
    canonicalWeight,
    mirrorWeight,
    explorationBias: adaptiveStateV0.explorationBias
  });
}

/**
 * Apply match-level Bayesian update after collider pass.
 * Mirror wins → +Δ exploration; loss streak → annealing; novel-neutral → latent expansion.
 *
 * @param {{
 *   outcome?: string|null,
 *   localColor?: 'w'|'b',
 *   ticks?: ReadonlyArray<{ status?: string, regretVector?: { topologyTag?: string } }>
 * }} opts
 */
export function applyMatchOutcomeToAdaptiveFieldV0(opts = {}) {
  const ticks = opts.ticks || [];
  const outcome = String(opts.outcome || "").toLowerCase();
  const novelNeutralCount = ticks.filter(
    (t) =>
      t.regretVector?.topologyTag === REGRET_TOPOLOGY_TAG_V0.NEUTRAL_DIVERGENCE ||
      t.status === POLICY_EVOLUTION_STATUS_V0.MUTATION_CANDIDATE
  ).length;

  let adaptiveReason = "no_outcome";
  if (outcome === "win" || outcome === "1-0" || outcome === "0-1") {
    adaptiveStateV0.explorationBias += ADAPTIVE_DRIFT_DELTA_V0.winExploration;
    adaptiveStateV0.consecutiveLossStreak = 0;
    adaptiveReason = "mirror_universe_rewarded";
  } else if (outcome === "loss") {
    adaptiveStateV0.consecutiveLossStreak += 1;
    const anneal =
      ADAPTIVE_DRIFT_DELTA_V0.lossAnneal *
      Math.min(3, adaptiveStateV0.consecutiveLossStreak);
    adaptiveStateV0.explorationBias -= anneal;
    adaptiveReason = "exploration_annealing";
  } else if (outcome === "draw" || outcome === "1/2-1/2") {
    adaptiveReason = "draw_neutral";
  }

  if (novelNeutralCount > 0) {
    adaptiveStateV0.latentExpansionCount += novelNeutralCount;
    adaptiveStateV0.explorationBias += ADAPTIVE_DRIFT_DELTA_V0.neutralLatent * novelNeutralCount;
    adaptiveReason =
      adaptiveReason === "no_outcome" ? "latent_space_expansion" : `${adaptiveReason}+latent`;
  }

  adaptiveStateV0.explorationBias = clampV0(
    adaptiveStateV0.explorationBias,
    -0.2,
    0.2
  );
  adaptiveStateV0.matchOutcomesApplied += 1;

  return readAdaptiveDriftStateV0();
}

/**
 * @param {{
 *   teacherTopology?: { patternFamily?: string, deltaMagnitude?: number }|null,
 *   mirrorTopology?: { patternFamily?: string, deltaMagnitude?: number }|null,
 *   regretVector?: { magnitude?: number, scalarRegret?: number, swingCp?: number|null, topologyTag?: string }
 * }} opts
 */
export function resolveGeometricDriftFieldV0(opts = {}) {
  const teacher = opts.teacherTopology;
  const mirror = opts.mirrorTopology;
  const regretVector = opts.regretVector || {};
  const weights = computeAdaptiveWeightsV0();

  const canonicalPattern =
    teacher?.patternFamily || RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER;
  const mirrorPattern =
    mirror?.patternFamily || RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER;
  const familyMatch = canonicalPattern === mirrorPattern;
  const regretMag = Math.max(
    0,
    Math.min(1, Number(regretVector.scalarRegret ?? regretVector.magnitude) || 0)
  );
  const topologyTag = regretVector.topologyTag || null;

  const canonicalPull = weights.canonicalWeight * regretMag;
  const mirrorPull =
    weights.mirrorWeight * (familyMatch ? regretMag * 0.35 : regretMag + 0.15);
  const driftBlendMagnitude = Math.min(1, canonicalPull + mirrorPull * 0.5);

  let status = POLICY_EVOLUTION_STATUS_V0.TRAJECTORY_ALIGNED;
  if (topologyTag === REGRET_TOPOLOGY_TAG_V0.NEUTRAL_DIVERGENCE) {
    status = POLICY_EVOLUTION_STATUS_V0.LATENT_SPACE_EXPANSION;
  } else if (!familyMatch && regretMag >= 0.12) {
    status = POLICY_EVOLUTION_STATUS_V0.ALTERNATIVE_UNIVERSE_PRESERVED;
  } else if (!familyMatch) {
    status = POLICY_EVOLUTION_STATUS_V0.MUTATION_CANDIDATE;
  }

  const field = Object.freeze({
    schema: GEOMETRIC_DRIFT_FIELD_SCHEMA_V0,
    canonicalWeight: weights.canonicalWeight,
    mirrorWeight: weights.mirrorWeight,
    explorationBias: weights.explorationBias,
    canonicalPattern,
    mirrorPattern,
    familyMatch,
    topologyTag,
    canonicalPull,
    mirrorPull,
    driftBlendMagnitude,
    status,
    alternativePreserved: !familyMatch,
    adaptiveField: true,
    governance: Object.freeze({
      canonicalRole: "anchor",
      mirrorRole: "exploration",
      explorationIsNotPunishment: true
    })
  });

  if (field.alternativePreserved || status === POLICY_EVOLUTION_STATUS_V0.LATENT_SPACE_EXPANSION) {
    archiveAlternativeNodeV0({
      canonicalPattern,
      mirrorPattern,
      driftBlendMagnitude,
      regretMag,
      topologyTag,
      status
    });
  }

  return field;
}

/**
 * @param {object} node
 */
function archiveAlternativeNodeV0(node) {
  const entry = Object.freeze({
    schema: "rhizoh.alternative_strategy_node.v0.1",
    ...node,
    archivedAt: new Date().toISOString()
  });
  alternativeRingV0 = [entry, ...alternativeRingV0].slice(0, ALT_RING_MAX_V0);
}

export function readAlternativeStrategyNodesV0() {
  return Object.freeze([...alternativeRingV0]);
}

export function resetAlternativeStrategyNodesForTestV0() {
  alternativeRingV0 = [];
}
