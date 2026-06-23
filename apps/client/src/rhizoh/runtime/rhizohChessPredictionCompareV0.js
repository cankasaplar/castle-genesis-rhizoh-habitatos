/**
 * Rhizoh prediction vs Stockfish — propose → compare → score (observation only).
 * RESEARCH-ONLY — does not grant move authority.
 */

import { recordRhizohPredictionScoreV0 } from "./rhizohChessLearningReportV0.js";
import { submitChessClusterTruthLearningSampleV0 } from "./chessClusterDriftDatasetV0.js";
import {
  analyzeChessPositionMultiPvV0,
  getChessStockfishEngineStatusV0
} from "./chessStockfishEngineV0.js";
import {
  endChessSchedulerCallV0,
  tryBeginChessSchedulerCallV0
} from "./chessSchedulerUnifyV0.js";
import { resolvePredictionAccuracyFromRankV0 } from "./rhizohChessLearningReportV0.js";

export const RHIZOH_CHESS_PREDICTION_SCORE_SCHEMA_V0 = "castle.rhizoh.chess_prediction_score.v0";
export const RHIZOH_PREDICTION_MOVETIME_MS_V0 = 600;
export { RHIZOH_CHESS_PREDICTION_SCORE_EVENT_V0 } from "./rhizohChessLearningReportV0.js";

/**
 * Compare Rhizoh-proposed UCI against Stockfish best line at position.
 * @param {string} fen
 * @param {string} rhizohUci
 * @param {{ slotId?: number, matchId?: string, engine?: string, san?: string }} [meta]
 */
export async function compareRhizohMoveWithStockfishV0(fen, rhizohUci, meta = {}) {
  const position = String(fen || "").trim();
  const played = String(rhizohUci || "").trim();
  if (!position || !played) return null;
  if (getChessStockfishEngineStatusV0() !== "stockfish_wasm") return null;
  const schedulerOpts = meta.testFast ? { testFast: true } : {};
  if (!tryBeginChessSchedulerCallV0(schedulerOpts)) return null;

  try {
    const multi = await analyzeChessPositionMultiPvV0(position, {
      multiPv: 4,
      movetimeMs: meta.movetimeMs ?? RHIZOH_PREDICTION_MOVETIME_MS_V0,
      depth: 10
    });
    if (!multi?.lines?.length) return null;

    const engineBest = String(multi.lines[0]?.bestMove || "");
    const matchedRank =
      multi.lines.findIndex((line) => line.bestMove === played) + 1 || null;
    const rank = matchedRank && matchedRank > 0 ? matchedRank : null;
    const stockfishAgreement = rank === 1;
    const predictionAccuracy = resolvePredictionAccuracyFromRankV0(rank);

    const row = Object.freeze({
      schema: RHIZOH_CHESS_PREDICTION_SCORE_SCHEMA_V0,
      fen: position.slice(0, 48),
      played,
      engineBest,
      matchedRank,
      stockfishAgreement,
      predictionAccuracy,
      depth: multi.lines[0]?.depth ?? null,
      slotId: meta.slotId ?? null,
      matchId: meta.matchId || null,
      engine: meta.engine || "rhizoh_ai",
      san: meta.san || null,
      atMs: Date.now()
    });

    recordRhizohPredictionScoreV0(row);

    if (meta.slotId != null) {
      submitChessClusterTruthLearningSampleV0(
        { slotId: meta.slotId, matchId: meta.matchId, moveHistory: [], game: null },
        {
          ply: meta.ply ?? null,
          uci: played,
          san: meta.san || played,
          fenBefore: position
        },
        {
          engineBest,
          matchedRank: rank,
          stockfishCp: multi.lines[0]?.cp ?? null,
          winningLine: multi.lines[0],
          source: "rhizoh_prediction_compare"
        }
      );
    }

    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent(RHIZOH_CHESS_PREDICTION_SCORE_EVENT_V0, { detail: row }));
      } catch {
        /* noop */
      }
    }

    return row;
  } catch {
    return null;
  } finally {
    endChessSchedulerCallV0(schedulerOpts);
  }
}

/**
 * Fire-and-forget Rhizoh vs Stockfish scoring.
 */
export function enqueueRhizohPredictionCompareV0(fen, rhizohUci, meta = {}) {
  if (typeof window === "undefined") return;
  const delayMs = window.__rhizoh?.chessLock ? 950 : 120;
  setTimeout(() => {
    void compareRhizohMoveWithStockfishV0(fen, rhizohUci, meta).catch(() => null);
  }, delayMs);
}
