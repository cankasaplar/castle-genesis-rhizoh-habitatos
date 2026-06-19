/**
 * Chess cluster learning trace — game_state → MultiPV eval → policy_diff → memory_graph.
 * WAL sink via learn buffer (no play-lock dependency); engine enrich when idle.
 * RESEARCH-ONLY
 */

import {
  analyzeChessPositionMultiPvV0,
  getChessStockfishEngineStatusV0
} from "./chessStockfishEngineV0.js";
import { writeChessClusterMemoryNodeV0 } from "./chessClusterMemoryGraphV0.js";
import { resolveChessClusterSlotModeV0 } from "./chessClusterSlotModesV0.js";
import { maybeEnqueueEpistemicCouncilV0 } from "./rhizohEpistemicCouncilV0.js";
import { scheduleUglLearnTaskV0 } from "./rhizohUglMatchSchedulerV0.js";
import {
  enqueueUglLearnBufferObservationV0,
  registerUglLearnBufferEnrichHandlerV0,
  drainUglLearnBufferV0
} from "./rhizohUglLearnBufferSinkV0.js";

export const CHESS_CLUSTER_LEARNING_TRACE_SCHEMA_V0 =
  "castle.rhizoh.chess_cluster_learning_trace.v0";
export const CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 = "rhizoh:chess-cluster-policy-diff-v0";

const MULTIPV_TRACE_THROTTLE_MS_V0 = 3600;
let lastMultiPvTraceAtMsV0 = 0;
let handlerRegisteredV0 = false;

function ensureLearnBufferHandlerV0() {
  if (handlerRegisteredV0) return;
  handlerRegisteredV0 = true;
  registerUglLearnBufferEnrichHandlerV0(async (row) =>
    traceChessClusterPolicyDiffFromBufferV0(row.slot, row.moveRow, row.fenBefore)
  );
}

/**
 * Engine enrichment path — only when buffer drain / learn scheduler runs.
 * @param {object} slot
 * @param {object} moveRow
 * @param {string} fenBefore
 */
export async function traceChessClusterPolicyDiffFromBufferV0(slot, moveRow, fenBefore) {
  if (getChessStockfishEngineStatusV0() !== "stockfish_wasm") return null;
  const now = Date.now();
  if (now - lastMultiPvTraceAtMsV0 < MULTIPV_TRACE_THROTTLE_MS_V0) return null;
  lastMultiPvTraceAtMsV0 = now;

  const mode = resolveChessClusterSlotModeV0(slot.slotId);
  const multi = await scheduleUglLearnTaskV0(
    () =>
      analyzeChessPositionMultiPvV0(fenBefore, {
        multiPv: 6,
        movetimeMs: 320,
        depth: 10
      }),
    { label: `policy_diff_slot_${slot.slotId}`, force: false, fromDeferred: true }
  );
  if (!multi?.lines?.length) return null;

  const played = String(moveRow.uci || "");
  const engineBest = multi.lines[0]?.bestMove || null;
  const matchedRank =
    multi.lines.findIndex((line) => line.bestMove === played) + 1 || null;
  const winningVariation = multi.lines[0] || null;

  const policyDiff = Object.freeze({
    schema: CHESS_CLUSTER_LEARNING_TRACE_SCHEMA_V0,
    slotId: slot.slotId,
    matchId: slot.matchId,
    modeId: mode.modeId,
    learningTag: mode.learningTag,
    played,
    engineBest,
    matchedRank: matchedRank && matchedRank > 0 ? matchedRank : null,
    variationCount: multi.lines.length,
    winningLine: winningVariation,
    drifted: matchedRank == null || matchedRank > 2,
    atMs: now,
    source: "learn_buffer_enrich"
  });

  writeChessClusterMemoryNodeV0({
    kind: "policy_diff",
    slotId: slot.slotId,
    matchId: slot.matchId,
    summary: policyDiff.drifted
      ? `Slot ${slot.slotId} drifted from engine PV (rank ${matchedRank ?? "off-tree"})`
      : `Slot ${slot.slotId} aligned with PV rank ${matchedRank}`,
    observation: policyDiff
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, { detail: policyDiff })
      );
    } catch {
      /* noop */
    }
  }

  if (policyDiff.drifted) {
    maybeEnqueueEpistemicCouncilV0({
      policyDiff,
      matchId: slot.matchId,
      slotId: slot.slotId,
      fenBefore
    });
  }

  return policyDiff;
}

/** Fire-and-forget — WAL immediately, engine enrich async when idle. */
export function enqueueChessClusterLearningTraceV0(slot, moveRow, fenBefore) {
  ensureLearnBufferHandlerV0();
  enqueueUglLearnBufferObservationV0({ slot, moveRow, fenBefore });
  void drainUglLearnBufferV0();
}

/** @internal vitest */
export function __resetChessClusterLearningTraceForTestV0() {
  lastMultiPvTraceAtMsV0 = 0;
  handlerRegisteredV0 = false;
}
