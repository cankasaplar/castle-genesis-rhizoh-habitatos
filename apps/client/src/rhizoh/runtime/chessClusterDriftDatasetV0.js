/**
 * Move-level drift dataset — observation (immediate) vs truth learning (engine-enriched).
 * RESEARCH-ONLY — learning = f(agreement), not every move event.
 */

import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";
import { writeChessClusterMemoryNodeV0 } from "./chessClusterMemoryGraphV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "./chessClusterLearningTraceV0.js";
import {
  fuseChessEvalSourcesV0,
  stockfishCpFromMatchedRankV0
} from "./chessEvalFusionV0.js";
import { evaluateChessLearningAgreementGateV0 } from "./chessLearningAgreementGateV0.js";
import { enqueueChessLearningBatchSampleV0 } from "./chessLearningBatchV0.js";
import { rememberFenClusterObservationV0 } from "./chessFenClusterMemoryV0.js";

export const CHESS_CLUSTER_DRIFT_DATASET_SCHEMA_V0 = "castle.rhizoh.chess_cluster_drift_dataset.v0";

const MAX_DRIFT_ROWS_V0 = 2048;
/** @type {object[]} */
const driftRowsV0 = [];

function pickHeuristicBestMoveUciV0(game) {
  const legal = game.legalMoves();
  if (!legal.length) return null;
  const uci = pickChessArenaAiMoveV0(game);
  if (!uci) return `${legal[0].from}${legal[0].to}${legal[0].promotion || ""}`;
  return uci;
}

function dispatchPolicyDiffV0(policyDiff) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, { detail: policyDiff }));
  } catch {
    /* noop */
  }
}

/**
 * Engine-truth path — MultiPV enrich → fusion → agreement gate → batch-32.
 * @param {object} slot
 * @param {object} moveRow
 * @param {{
 *   engineBest?: string | null,
 *   matchedRank?: number | null,
 *   stockfishCp?: number | null,
 *   source?: string,
 *   winningLine?: object | null
 * }} enrich
 */
export function submitChessClusterTruthLearningSampleV0(slot, moveRow, enrich = {}) {
  if (!slot || !moveRow) return null;
  const played = String(moveRow.uci || "").trim();
  const engineBest = enrich.engineBest != null ? String(enrich.engineBest) : null;
  const matchedRank =
    enrich.matchedRank != null ? Number(enrich.matchedRank) : null;
  const drifted = matchedRank == null || matchedRank > 2;
  const position = moveRow.fenBefore || slot.game?.fen?.() || null;
  const sanMoves = (slot.moveHistory || []).map((m) => m.san);
  const stockfishCp =
    enrich.stockfishCp != null
      ? Number(enrich.stockfishCp)
      : enrich.winningLine?.cp != null
        ? Number(enrich.winningLine.cp)
        : stockfishCpFromMatchedRankV0(matchedRank);

  const fusion = fuseChessEvalSourcesV0({ stockfishCp, fen: position, sanMoves });
  const gate = evaluateChessLearningAgreementGateV0(fusion, {
    drifted,
    matchedRank,
    truthAuthoritative: true
  });

  const fenCluster = position
    ? rememberFenClusterObservationV0(position, {
        slotId: slot.slotId,
        matchId: slot.matchId,
        ply: moveRow.ply,
        drifted,
        learningEligible: gate.learningEligible
      })
    : null;

  const row = Object.freeze({
    schema: CHESS_CLUSTER_DRIFT_DATASET_SCHEMA_V0,
    slotId: slot.slotId,
    matchId: slot.matchId,
    ply: moveRow.ply,
    position,
    playedMove: played,
    bestMove: engineBest,
    drifted,
    matchedRank: Number.isFinite(matchedRank) && matchedRank > 0 ? matchedRank : null,
    source: enrich.source || "learn_buffer_enrich",
    fusion,
    gate,
    clusterId: fenCluster?.clusterId || null,
    learningEligible: gate.learningEligible,
    truthAuthoritative: true,
    atMs: Date.now()
  });

  driftRowsV0.push(row);
  while (driftRowsV0.length > MAX_DRIFT_ROWS_V0) driftRowsV0.shift();

  writeChessClusterMemoryNodeV0({
    kind: gate.learningEligible ? "move_drift" : "move_drift_ambiguous",
    slotId: slot.slotId,
    matchId: slot.matchId,
    summary: gate.learningEligible
      ? `Truth ply ${moveRow.ply}: ${played} vs ${engineBest || "?"}`
      : `Truth ambiguous ply ${moveRow.ply} (${gate.reason})`,
    observation: row
  });

  if (gate.learningEligible) {
    enqueueChessLearningBatchSampleV0({
      position,
      playedMove: played,
      bestMove: engineBest,
      drifted,
      matchedRank: row.matchedRank,
      fusion,
      gate,
      clusterId: fenCluster?.clusterId || null
    });
  }

  const policyDiff = Object.freeze({
    schema: "castle.rhizoh.chess_cluster_learning_trace.v0",
    slotId: slot.slotId,
    matchId: slot.matchId,
    played,
    engineBest,
    matchedRank: row.matchedRank,
    drifted,
    source: row.source,
    fusion,
    gate,
    learningEligible: gate.learningEligible,
    truthAuthoritative: true,
    atMs: row.atMs
  });
  dispatchPolicyDiffV0(policyDiff);
  return row;
}

/**
 * Immediate observation — UI/monitor only; does NOT enqueue batch learning.
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
  const position = moveRow.fenBefore || slot.game?.fen?.() || null;

  const row = Object.freeze({
    schema: CHESS_CLUSTER_DRIFT_DATASET_SCHEMA_V0,
    slotId: slot.slotId,
    matchId: slot.matchId,
    ply: moveRow.ply,
    position,
    playedMove: played,
    bestMove: engineBest,
    drifted,
    matchedRank: Number.isFinite(matchedRank) && matchedRank > 0 ? matchedRank : null,
    source: enrich.source || "heuristic_immediate",
    learningEligible: false,
    truthAuthoritative: false,
    observabilityOnly: true,
    atMs: Date.now()
  });

  driftRowsV0.push(row);
  while (driftRowsV0.length > MAX_DRIFT_ROWS_V0) driftRowsV0.shift();

  writeChessClusterMemoryNodeV0({
    kind: "move_drift_preview",
    slotId: slot.slotId,
    matchId: slot.matchId,
    summary: `Preview ply ${moveRow.ply} (awaiting engine truth)`,
    observation: row
  });

  dispatchPolicyDiffV0(
    Object.freeze({
      schema: "castle.rhizoh.chess_cluster_learning_trace.v0",
      slotId: slot.slotId,
      matchId: slot.matchId,
      played,
      engineBest,
      matchedRank: row.matchedRank,
      drifted,
      source: row.source,
      learningEligible: false,
      truthAuthoritative: false,
      observabilityOnly: true,
      atMs: row.atMs
    })
  );

  return row;
}

export function listChessClusterDriftRowsV0(limit = 50) {
  return Object.freeze(driftRowsV0.slice(-limit));
}

/** @internal vitest */
export function clearChessClusterDriftDatasetForTestV0() {
  driftRowsV0.length = 0;
}
