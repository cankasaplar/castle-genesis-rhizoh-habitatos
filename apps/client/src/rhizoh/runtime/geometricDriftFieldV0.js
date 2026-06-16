/**
 * GeometricDriftFieldV0 — 70% canonical teacher / 30% mirror alternative preservation.
 * RESEARCH-ONLY — drift is mutation field, not execution correction.
 */

import { RHIZOH_GEOMETRY_PATTERN_FAMILY_V0 } from "./rhizohGeometryPatternFamilyV0.js";

export const GEOMETRIC_DRIFT_FIELD_SCHEMA_V0 = "rhizoh.geometric_drift_field.v0";
export const POLICY_CANONICAL_WEIGHT_V0 = 0.7;
export const POLICY_MIRROR_WEIGHT_V0 = 0.3;

export const POLICY_EVOLUTION_STATUS_V0 = Object.freeze({
  TRAJECTORY_ALIGNED: "TRAJECTORY_ALIGNED",
  ALTERNATIVE_UNIVERSE_PRESERVED: "ALTERNATIVE_UNIVERSE_PRESERVED",
  MUTATION_CANDIDATE: "MUTATION_CANDIDATE"
});

const ALT_RING_MAX_V0 = 64;

/** @type {object[]} */
let alternativeRingV0 = [];

/**
 * @param {{
 *   teacherTopology?: { patternFamily?: string, deltaMagnitude?: number }|null,
 *   mirrorTopology?: { patternFamily?: string, deltaMagnitude?: number }|null,
 *   regretVector?: { magnitude?: number, swingCp?: number|null }
 * }} opts
 */
export function resolveGeometricDriftFieldV0(opts = {}) {
  const teacher = opts.teacherTopology;
  const mirror = opts.mirrorTopology;
  const canonicalPattern =
    teacher?.patternFamily || RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER;
  const mirrorPattern =
    mirror?.patternFamily || RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER;
  const familyMatch = canonicalPattern === mirrorPattern;
  const regretMag = Math.max(0, Math.min(1, Number(opts.regretVector?.magnitude) || 0));

  const canonicalPull = POLICY_CANONICAL_WEIGHT_V0 * regretMag;
  const mirrorPull = POLICY_MIRROR_WEIGHT_V0 * (familyMatch ? regretMag * 0.35 : regretMag + 0.15);
  const driftBlendMagnitude = Math.min(1, canonicalPull + mirrorPull * 0.5);

  let status = POLICY_EVOLUTION_STATUS_V0.TRAJECTORY_ALIGNED;
  if (!familyMatch && regretMag >= 0.12) {
    status = POLICY_EVOLUTION_STATUS_V0.ALTERNATIVE_UNIVERSE_PRESERVED;
  } else if (!familyMatch) {
    status = POLICY_EVOLUTION_STATUS_V0.MUTATION_CANDIDATE;
  }

  const field = Object.freeze({
    schema: GEOMETRIC_DRIFT_FIELD_SCHEMA_V0,
    canonicalWeight: POLICY_CANONICAL_WEIGHT_V0,
    mirrorWeight: POLICY_MIRROR_WEIGHT_V0,
    canonicalPattern,
    mirrorPattern,
    familyMatch,
    canonicalPull,
    mirrorPull,
    driftBlendMagnitude,
    status,
    alternativePreserved: !familyMatch
  });

  if (field.alternativePreserved) {
    archiveAlternativeNodeV0({
      canonicalPattern,
      mirrorPattern,
      driftBlendMagnitude,
      regretMag
    });
  }

  return field;
}

/**
 * @param {object} node
 */
function archiveAlternativeNodeV0(node) {
  const entry = Object.freeze({
    schema: "rhizoh.alternative_strategy_node.v0",
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
