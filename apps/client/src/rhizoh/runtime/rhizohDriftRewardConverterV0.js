/**
 * Drift → Reward converter — policy_diff + geometry drift → unified UGL R.
 * RESEARCH-ONLY
 */

import { computeUglRewardV0 } from "./rhizohUglRewardModelV0.js";
import { encodeUglActionV0 } from "./rhizohUglActionSpaceV0.js";
import { encodeUglStateV0 } from "./rhizohUglStateEncoderV0.js";
import { buildUglEventV0 } from "./rhizohUglEventV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";

export const RHIZOH_UGL_DRIFT_REWARD_SCHEMA_V0 = "castle.rhizoh.ugl_drift_reward.v0";

/**
 * @param {{ actorId?: string, policyDiff?: { slotId?: number|null } }} input
 */
export function resolveUglActorIdV0(input = {}) {
  if (input.actorId) return String(input.actorId);
  if (input.policyDiff?.slotId != null) return `slot_${input.policyDiff.slotId}`;
  return "unknown";
}

/**
 * @param {object} policyDiff — chessClusterLearningTrace policy_diff row
 * @param {{ fenBefore?: string, fenAfter?: string, actorId?: string, terminal?: number }} ctx
 */
export function convertPolicyDiffToUglRewardV0(policyDiff = {}, ctx = {}) {
  const rank = policyDiff.matchedRank;
  const engineCp = policyDiff.winningLine?.cp ?? policyDiff.winningLine?.scoreCp;
  return computeUglRewardV0({
    terminal: ctx.terminal,
    matchedRank: rank,
    drifted: policyDiff.drifted,
    engineEvalCp: engineCp,
    rhizohEvalCp: ctx.rhizohEvalCp,
    isNewPosition: ctx.isNewPosition,
    visitCount: ctx.visitCount
  });
}

/**
 * @param {object} driftPoint — geometry drift cube point
 * @param {{ terminal?: number, matchedRank?: number|null }} [ctx]
 */
export function convertGeometryDriftToUglRewardV0(driftPoint = {}, ctx = {}) {
  const familyMismatch =
    driftPoint.context?.playedPattern != null &&
    driftPoint.context?.expectedPattern != null &&
    driftPoint.context.playedPattern !== driftPoint.context.expectedPattern;
  return computeUglRewardV0({
    terminal: ctx.terminal,
    matchedRank: ctx.matchedRank,
    familyMismatch,
    entropyScore: driftPoint.z,
    drifted: familyMismatch || (Number(driftPoint.z) || 0) >= 0.12
  });
}

/**
 * Synthesize reward from multiple observation artifacts (semantic merge).
 * @param {{
 *   policyDiff?: object,
 *   geometryDrift?: object,
 *   terminal?: number,
 *   fenBefore?: string,
 *   fenAfter?: string,
 *   actorId?: string,
 *   uci?: string,
 *   visitCount?: number,
 *   isNewPosition?: boolean
 * }} input
 */
export function synthesizeUglRewardV0(input = {}) {
  const fromPolicy = input.policyDiff
    ? convertPolicyDiffToUglRewardV0(input.policyDiff, input)
    : null;
  const fromGeometry = input.geometryDrift
    ? convertGeometryDriftToUglRewardV0(input.geometryDrift, input)
    : null;

  const terminal = Number(input.terminal) || fromPolicy?.terminal || fromGeometry?.terminal || 0;
  const shaping = Math.max(fromPolicy?.shaping ?? 0, fromGeometry?.shaping ?? 0);
  const drift = Math.max(fromPolicy?.drift ?? 0, fromGeometry?.drift ?? 0);
  const novelty = Math.max(fromPolicy?.novelty ?? 0, fromGeometry?.novelty ?? 0, input.isNewPosition ? 1 : 0);

  return computeUglRewardV0({
    terminal,
    matchedRank: input.policyDiff?.matchedRank,
    drifted: input.policyDiff?.drifted || drift > 0.5,
    familyMismatch:
      input.geometryDrift?.context?.playedPattern !== input.geometryDrift?.context?.expectedPattern,
    entropyScore: input.geometryDrift?.z,
    visitCount: input.visitCount,
    isNewPosition: input.isNewPosition
  });
}

/**
 * Full compile: observation artifacts → UGLEvent.
 * @param {object} input
 */
export function compileObservationToUglEventV0(input = {}) {
  const gameType = input.gameType || RHIZOH_UGL_GAME_TYPE_V0.CHESS;
  const fenBefore = String(input.fenBefore || "").trim();
  const fenAfter = String(input.fenAfter || fenBefore).trim();
  const s = encodeUglStateV0(gameType, { fen: fenBefore, rulesetId: input.rulesetId });
  const sNext = encodeUglStateV0(gameType, { fen: fenAfter, rulesetId: input.rulesetId });
  const a = encodeUglActionV0(gameType, {
    actorId: resolveUglActorIdV0(input),
    uci: input.uci || input.policyDiff?.played,
    san: input.san,
    type: input.actionType || "move"
  });
  const r = synthesizeUglRewardV0(input);
  return buildUglEventV0({
    s,
    a,
    sNext,
    r,
    logicalTick: input.logicalTick,
    matchId: input.matchId || input.policyDiff?.matchId || input.geometryDrift?.matchId,
    gameType,
    source: input.source || "drift_reward_converter"
  });
}

export function buildUglDriftRewardReportV0() {
  return Object.freeze({
    schema: RHIZOH_UGL_DRIFT_REWARD_SCHEMA_V0,
    apis: Object.freeze({
      policyDiff: "convertPolicyDiffToUglRewardV0(policyDiff, ctx)",
      geometry: "convertGeometryDriftToUglRewardV0(driftPoint, ctx)",
      synthesize: "synthesizeUglRewardV0(input)",
      compile: "compileObservationToUglEventV0(input)"
    })
  });
}
