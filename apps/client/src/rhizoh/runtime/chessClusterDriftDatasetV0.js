/**
 * Move-level drift dataset — position, played, best, drift (heuristic + engine enrich).
 * RESEARCH-ONLY — feeds policy_diff events → agreementSamples / policyChanges.
 */

import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";
import { writeChessClusterMemoryNodeV0 } from "./chessClusterMemoryGraphV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "./chessClusterLearningTraceV0.js";

export const CHESS_CLUSTER_DRIFT_DATASET_SCHEMA_V0 = "castle.rhizoh.chess_cluster_drift_dataset.v0";

const MAX_DRIFT_ROWS_V0 = 2048;
/** @type {object[]} */
const driftRowsV0 = [];

/**
 * Heuristic best-move proxy when WASM MultiPV is throttled — still closes the learning loop.
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 */
function pickHeuristicBestMoveUciV0(game) {
  const legal = game.legalMoves();
  if (!legal.length) return null;
  const uci = pickChessArenaAiMoveV0(game);
  if (!uci) return `${legal[0].from}${legal[0].to}${legal[0].promotion || ""}`;
  return uci;
}

/**
 * @param {object} slot
 * @param {object} moveRow
 * @param {{ engineBest?: string | null, matchedRank?: number | null, source?: string }} [enrich]
 */
export function recordChessClusterMoveDriftV0(slot, moveRow, enrich = {}) {
  if (!slot || !moveRow) return null;
  const played = String(moveRow.uci || "").trim();
  const engineBest = enrich.engineBest != null ? String(enrich.engineBest) : pickHeuristicBestMoveUciV0(slot.game);
  const matchedRank =
    enrich.matchedRank != null
      ? Number(enrich.matchedRank)
      : engineBest && played === engineBest
        ? 1
        : null;
  const drifted = matchedRank == null || matchedRank > 2;

  const row = Object.freeze({
    schema: CHESS_CLUSTER_DRIFT_DATASET_SCHEMA_V0,
    slotId: slot.slotId,
    matchId: slot.matchId,
    ply: moveRow.ply,
    position: moveRow.fenBefore || slot.game?.fen?.() || null,
    playedMove: played,
    bestMove: engineBest,
    drifted,
    matchedRank: Number.isFinite(matchedRank) && matchedRank > 0 ? matchedRank : null,
    source: enrich.source || "heuristic_immediate",
    atMs: Date.now()
  });

  driftRowsV0.push(row);
  while (driftRowsV0.length > MAX_DRIFT_ROWS_V0) driftRowsV0.shift();

  writeChessClusterMemoryNodeV0({
    kind: "move_drift",
    slotId: slot.slotId,
    matchId: slot.matchId,
    summary: drifted
      ? `Drift ply ${moveRow.ply}: played ${played} vs best ${engineBest || "?"}`
      : `Aligned ply ${moveRow.ply}`,
    observation: row
  });

  const policyDiff = Object.freeze({
    schema: "castle.rhizoh.chess_cluster_learning_trace.v0",
    slotId: slot.slotId,
    matchId: slot.matchId,
    played,
    engineBest,
    matchedRank: row.matchedRank,
    drifted,
    source: row.source,
    atMs: row.atMs
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, { detail: policyDiff }));
    } catch {
      /* noop */
    }
  }

  return row;
}

export function listChessClusterDriftRowsV0(limit = 50) {
  return Object.freeze(driftRowsV0.slice(-limit));
}

/** @internal vitest */
export function clearChessClusterDriftDatasetForTestV0() {
  driftRowsV0.length = 0;
}
