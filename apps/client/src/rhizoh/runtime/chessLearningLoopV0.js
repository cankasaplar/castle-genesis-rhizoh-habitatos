/**
 * Rhizoh post-game learning loop — Game → PGN/eval → mistake map → regret → weight update.
 */

import { analyzeRhizohRegretV0 } from "./chessRegretAnalysisV0.js";
import {
  applyChessLearningCorrectionV0,
  readChessLearningWeightsV0
} from "./chessLearningWeightsV0.js";
import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";
import { normalizeChessMovesToSanV0 } from "./chessMoveSanV0.js";
import { computeChessLiveMetricsV0 } from "./chessLiveMetricsV0.js";

export const CHESS_LEARNING_LOOP_SCHEMA_V0 = "rhizoh.chess_learning_loop.v0";
export const CHESS_LEARNING_LOOP_EVENT_V0 = "rhizoh:chess-learning-loop-v0";

/**
 * @param {{
 *   moves: ReadonlyArray<string|object>,
 *   outcome?: string,
 *   localColor?: 'w' | 'b',
 *   matchId?: string,
 *   policyMode?: string,
 *   mindId?: string
 * }} opts
 */
export async function runRhizohChessLearningLoopV0(opts = {}) {
  const moves = opts.moves || [];
  const localColor = opts.localColor === "b" ? "b" : "w";
  const fenRows = buildMatchMovesWithFenV0(moves);
  const sanMoves = normalizeChessMovesToSanV0(fenRows.length ? fenRows : moves);

  const regret = await analyzeRhizohRegretV0({
    moves: sanMoves,
    localColor,
    maxSamples: 16
  });

  const weightsBefore = readChessLearningWeightsV0();
  const weightsAfter = applyChessLearningCorrectionV0(regret);
  const liveMetrics = computeChessLiveMetricsV0({
    outcome: opts.outcome,
    regret,
    moveCount: regret.moveCount,
    localColor
  });

  const result = Object.freeze({
    schema: CHESS_LEARNING_LOOP_SCHEMA_V0,
    matchId: opts.matchId || null,
    policyMode: opts.policyMode || null,
    mindId: opts.mindId || null,
    outcome: opts.outcome || null,
    pgnMoves: sanMoves,
    regret,
    mistakeMap: regret.mistakeMap,
    weightsBefore: Object.freeze({ ...weightsBefore }),
    weightsAfter: Object.freeze({ ...weightsAfter }),
    weightDelta: Object.freeze({
      aggressionBias: weightsAfter.aggressionBias - weightsBefore.aggressionBias,
      winForcingWeight: weightsAfter.winForcingWeight - weightsBefore.winForcingWeight,
      riskPenaltyWeight: weightsAfter.riskPenaltyWeight - weightsBefore.riskPenaltyWeight
    }),
    liveMetrics,
    learnedAt: new Date().toISOString()
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CHESS_LEARNING_LOOP_EVENT_V0, { detail: result }));
    } catch {
      /* noop */
    }
  }

  return result;
}
