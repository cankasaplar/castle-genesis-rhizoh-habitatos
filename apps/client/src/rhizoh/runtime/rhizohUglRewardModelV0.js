/**
 * UGL RewardModel — unified reward semantics (semantic outcome function).
 * RESEARCH-ONLY
 */

import {
  RHIZOH_UGL_REWARD_SCHEMA_V0,
  RHIZOH_UGL_REWARD_WEIGHTS_V0
} from "./rhizohUglSchemaV0.js";
import { resolvePredictionAccuracyFromRankV0 } from "./rhizohChessLearningReportV0.js";

/**
 * @param {{ terminal?: number, shaping?: number, drift?: number, novelty?: number }} parts
 * @param {{ terminal?: number, shaping?: number, drift?: number, novelty?: number }} [weights]
 */
export function aggregateUglRewardTotalV0(parts = {}, weights = RHIZOH_UGL_REWARD_WEIGHTS_V0) {
  const terminal = Number(parts.terminal) || 0;
  const shaping = Number(parts.shaping) || 0;
  const drift = Number(parts.drift) || 0;
  const novelty = Number(parts.novelty) || 0;
  const w = { ...RHIZOH_UGL_REWARD_WEIGHTS_V0, ...weights };
  const total =
    terminal * w.terminal +
    shaping * w.shaping +
    drift * w.drift +
    novelty * w.novelty;
  return Number(total.toFixed(4));
}

/**
 * @param {{
 *   terminal?: number|null,
 *   matchedRank?: number|null,
 *   drifted?: boolean,
 *   engineEvalCp?: number|null,
 *   rhizohEvalCp?: number|null,
 *   familyMismatch?: boolean,
 *   entropyScore?: number|null,
 *   visitCount?: number|null,
 *   isNewPosition?: boolean
 * }} signals
 */
export function computeUglRewardV0(signals = {}) {
  let terminal = Number(signals.terminal);
  if (!Number.isFinite(terminal)) terminal = 0;

  const rank = Number(signals.matchedRank);
  let shaping = 0;
  if (Number.isFinite(rank) && rank > 0) {
    shaping = resolvePredictionAccuracyFromRankV0(rank);
  } else if (signals.drifted === true) {
    shaping = 0;
  } else if (signals.drifted === false) {
    shaping = 1;
  }

  let drift = 0;
  const engineCp = Number(signals.engineEvalCp);
  const rhizohCp = Number(signals.rhizohEvalCp);
  if (Number.isFinite(engineCp) && Number.isFinite(rhizohCp)) {
    drift = Math.max(0, Math.min(1, Math.abs(engineCp - rhizohCp) / 800));
  } else if (signals.drifted === true) {
    drift = 0.65;
  } else if (signals.familyMismatch === true) {
    drift = Math.max(0.35, Number(signals.entropyScore) || 0.35);
  } else if (Number.isFinite(rank) && rank > 1) {
    drift = Math.max(0, Math.min(1, (rank - 1) / 4));
  }

  let novelty = 0;
  if (signals.isNewPosition === true) novelty = 1;
  else {
    const visits = Number(signals.visitCount);
    if (Number.isFinite(visits) && visits <= 1) novelty = 0.8;
    else if (Number.isFinite(visits) && visits < 4) novelty = 0.4;
  }

  const parts = Object.freeze({
    terminal,
    shaping: Number(shaping.toFixed(4)),
    drift: Number(drift.toFixed(4)),
    novelty: Number(novelty.toFixed(4))
  });

  return Object.freeze({
    schema: RHIZOH_UGL_REWARD_SCHEMA_V0,
    ...parts,
    total: aggregateUglRewardTotalV0(parts)
  });
}

export function buildUglRewardModelReportV0() {
  return Object.freeze({
    schema: `${RHIZOH_UGL_REWARD_SCHEMA_V0}.report`,
    weights: RHIZOH_UGL_REWARD_WEIGHTS_V0,
    api: "computeUglRewardV0(signals)"
  });
}
