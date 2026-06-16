/**
 * RegretVectorSystemV0 — teacher vs mirror trajectory substrate.
 * Produces scalar regret, directional drift vector, and topology tag.
 * RESEARCH-ONLY — Regret ≠ Loss; distance is not punishment.
 */

import { RHIZOH_GEOMETRY_PATTERN_FAMILY_V0 } from "./rhizohGeometryPatternFamilyV0.js";

export const REGRET_VECTOR_SCHEMA_V0 = "rhizoh.regret_vector.v0";

export const REGRET_TOPOLOGY_TAG_V0 = Object.freeze({
  POSITION_ERROR: "position_error",
  STRATEGIC_UNIVERSE_DIVERGENCE: "strategic_universe_divergence",
  SACRIFICE_SPACE: "sacrifice_space",
  TACTICAL_BRANCH: "tactical_branch",
  NEUTRAL_DIVERGENCE: "neutral_divergence",
  TRAJECTORY_ALIGNED: "trajectory_aligned"
});

export const REGRET_CLASS_V0 = Object.freeze({
  REGRET: "regret",
  LOSS: "loss",
  SACRIFICE: "sacrifice",
  TACTICAL: "tactical",
  NEUTRAL: "neutral"
});

const STRATEGY_AXIS_V0 = Object.freeze({
  [RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.ENCLOSURE]: Object.freeze([1, 0, 0]),
  [RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.JUMP]: Object.freeze([0, 1, 0]),
  [RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER]: Object.freeze([0, 0, 1])
});

const SACRIFICE_CP_THRESHOLD_V0 = 80;
const TACTICAL_SWING_CP_V0 = 45;

/**
 * @param {number} swingCp
 */
function normalizeRegretMagnitudeV0(swingCp) {
  const swing = Math.abs(Number(swingCp) || 0);
  return Math.min(1, swing / 120);
}

/**
 * @param {string} family
 */
function strategyAxisForFamilyV0(family) {
  return STRATEGY_AXIS_V0[family] || STRATEGY_AXIS_V0[RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER];
}

/**
 * @param {string} teacherFamily
 * @param {string} mirrorFamily
 */
export function buildDirectionalDriftVectorV0(teacherFamily, mirrorFamily) {
  const teacherAxis = strategyAxisForFamilyV0(teacherFamily);
  const mirrorAxis = strategyAxisForFamilyV0(mirrorFamily);
  const raw = [
    mirrorAxis[0] - teacherAxis[0],
    mirrorAxis[1] - teacherAxis[1],
    mirrorAxis[2] - teacherAxis[2]
  ];
  const mag = Math.sqrt(raw[0] ** 2 + raw[1] ** 2 + raw[2] ** 2) || 1;
  return Object.freeze({
    axes: Object.freeze(["enclosure", "jump", "cluster"]),
    vector: Object.freeze([raw[0] / mag, raw[1] / mag, raw[2] / mag]),
    magnitude: Math.min(1, mag / Math.SQRT2),
    dominantAxis:
      mirrorFamily !== teacherFamily
        ? mirrorFamily
        : teacherFamily
  });
}

/**
 * @param {{
 *   swingCp?: number|null,
 *   beforeCp?: number|null,
 *   forcedWinLine?: boolean,
 *   flags?: ReadonlyArray<string>
 * }} trace
 * @param {string} teacherFamily
 * @param {string} mirrorFamily
 */
export function classifyTopologyTagV0(trace, teacherFamily, mirrorFamily) {
  const swingCp = trace.swingCp != null ? Number(trace.swingCp) : 0;
  const absSwing = Math.abs(swingCp);
  const familyMatch = teacherFamily === mirrorFamily;
  const beforeCp = Number(trace.beforeCp) || 0;

  if (familyMatch && absSwing < 8) {
    return REGRET_TOPOLOGY_TAG_V0.TRAJECTORY_ALIGNED;
  }

  if (
    !familyMatch &&
    (beforeCp >= SACRIFICE_CP_THRESHOLD_V0 || trace.forcedWinLine) &&
    swingCp < 0 &&
    absSwing < SACRIFICE_CP_THRESHOLD_V0
  ) {
    return REGRET_TOPOLOGY_TAG_V0.SACRIFICE_SPACE;
  }

  if (!familyMatch && absSwing < TACTICAL_SWING_CP_V0) {
    return REGRET_TOPOLOGY_TAG_V0.NEUTRAL_DIVERGENCE;
  }

  if (!familyMatch) {
    return REGRET_TOPOLOGY_TAG_V0.STRATEGIC_UNIVERSE_DIVERGENCE;
  }

  if (familyMatch && swingCp < 0 && absSwing >= TACTICAL_SWING_CP_V0) {
    return REGRET_TOPOLOGY_TAG_V0.POSITION_ERROR;
  }

  if (absSwing > 0 && absSwing < TACTICAL_SWING_CP_V0) {
    return REGRET_TOPOLOGY_TAG_V0.TACTICAL_BRANCH;
  }

  return familyMatch
    ? REGRET_TOPOLOGY_TAG_V0.TRAJECTORY_ALIGNED
    : REGRET_TOPOLOGY_TAG_V0.STRATEGIC_UNIVERSE_DIVERGENCE;
}

/**
 * @param {string} topologyTag
 */
function regretClassFromTopologyTagV0(topologyTag) {
  switch (topologyTag) {
    case REGRET_TOPOLOGY_TAG_V0.POSITION_ERROR:
      return REGRET_CLASS_V0.LOSS;
    case REGRET_TOPOLOGY_TAG_V0.SACRIFICE_SPACE:
      return REGRET_CLASS_V0.SACRIFICE;
    case REGRET_TOPOLOGY_TAG_V0.TACTICAL_BRANCH:
      return REGRET_CLASS_V0.TACTICAL;
    case REGRET_TOPOLOGY_TAG_V0.NEUTRAL_DIVERGENCE:
    case REGRET_TOPOLOGY_TAG_V0.STRATEGIC_UNIVERSE_DIVERGENCE:
      return REGRET_CLASS_V0.REGRET;
    default:
      return REGRET_CLASS_V0.NEUTRAL;
  }
}

/**
 * @param {{
 *   regretVector: object,
 *   teacherTopology?: { patternFamily?: string }|null,
 *   mirrorTopology?: { patternFamily?: string }|null
 * }} opts
 */
export function enrichRegretVectorWithTopologyV0(opts = {}) {
  const vector = opts.regretVector || {};
  const teacherFamily =
    opts.teacherTopology?.patternFamily || RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER;
  const mirrorFamily =
    opts.mirrorTopology?.patternFamily || RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER;

  const topologyTag = classifyTopologyTagV0(vector, teacherFamily, mirrorFamily);
  const directionalDriftVector = buildDirectionalDriftVectorV0(teacherFamily, mirrorFamily);
  const regretClass = regretClassFromTopologyTagV0(topologyTag);
  const scalarRegret = vector.magnitude ?? normalizeRegretMagnitudeV0(vector.swingCp);

  return Object.freeze({
    ...vector,
    scalarRegret,
    directionalDriftVector,
    topologyTag,
    regretClass,
    teacherPatternFamily: teacherFamily,
    mirrorPatternFamily: mirrorFamily,
    isRegretNotLoss: regretClass !== REGRET_CLASS_V0.LOSS
  });
}

/**
 * @param {{
 *   regret: { evalTrace?: ReadonlyArray<{ moveNumber?: number, san?: string, bestMove?: string, swingCp?: number|null, beforeCp?: number, forcedWinLine?: boolean, flags?: ReadonlyArray<string> }> },
 *   fenRows?: ReadonlyArray<{ san?: string, before?: string }>
 * }} opts
 */
export function buildRegretVectorsFromTraceV0(opts = {}) {
  const regret = opts.regret || {};
  const fenRows = opts.fenRows || [];
  /** @type {object[]} */
  const vectors = [];

  for (const trace of regret.evalTrace || []) {
    if (trace.swingCp == null && !trace.bestMove) continue;
    const row = fenRows[(trace.moveNumber || 1) - 1];
    const scalarRegret = normalizeRegretMagnitudeV0(trace.swingCp);
    vectors.push(
      Object.freeze({
        schema: REGRET_VECTOR_SCHEMA_V0,
        moveNumber: trace.moveNumber || 0,
        san: trace.san || row?.san || null,
        bestMove: trace.bestMove || null,
        beforeFen: row?.before || null,
        swingCp: trace.swingCp != null ? Math.round(trace.swingCp) : null,
        teacherCp: trace.beforeCp != null ? Math.round(trace.beforeCp) : null,
        magnitude: scalarRegret,
        scalarRegret,
        evalGapCp: trace.swingCp != null ? Math.abs(Math.round(trace.swingCp)) : 0,
        forcedWinLine: Boolean(trace.forcedWinLine),
        flags: trace.flags ? Object.freeze([...trace.flags]) : Object.freeze([])
      })
    );
  }

  return Object.freeze(vectors);
}
