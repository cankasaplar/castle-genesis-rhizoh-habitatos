/**
 * Chess cluster learning — game end → pattern compression → memory write.
 * Decoupled from spatial/world gates; uses existing intelligence pipeline.
 * RESEARCH-ONLY
 */

import { runChessIntelligencePipelineV0 } from "./chessLearningBridgeV0.js";
import { getChessClusterPatternCountsV0 } from "./chessClusterObserverV0.js";
import {
  writeChessClusterMemoryNodeV0,
  getChessClusterMemoryGraphSnapshotV0
} from "./chessClusterMemoryGraphV0.js";
import { upsertRhizohKnowledgeV0, RHIZOH_TEACHER_SOURCE_V0 } from "./rhizohKnowledgeStoreV0.js";

export const CHESS_CLUSTER_LEARNING_SCHEMA_V0 = "castle.rhizoh.chess_cluster_learning.v0";
export const CHESS_CLUSTER_LEARNING_EVENT_V0 = "rhizoh:chess-cluster-learning-v0";

/**
 * Compress recurring patterns across cluster games.
 * @param {object} slot
 */
function compressClusterPatternsV0(slot) {
  const globalPatterns = getChessClusterPatternCountsV0();
  const recurring = globalPatterns.filter((p) => p.count >= 3);
  const slotCritical = (slot.criticalEvents || []).length;
  const reinforcement = Math.min(0.95, 0.2 + slotCritical * 0.08 + recurring.length * 0.05);

  const clusters = recurring.map((p) =>
    Object.freeze({
      pattern: p.tag,
      count: p.count,
      correlationHint:
        p.tag === "fork_candidate"
          ? "recurring fork pattern across cluster"
          : `${p.tag} cluster frequency`
    })
  );

  return Object.freeze({
    recurring,
    clusters,
    reinforcement,
    slotCritical
  });
}

/**
 * @param {object} slot — mutable slot with moveHistory, outcome
 */
export async function finalizeChessClusterGameV0(slot) {
  const moves = slot.moveHistory || [];
  const compression = compressClusterPatternsV0(slot);

  let pipeline = null;
  try {
    pipeline = await runChessIntelligencePipelineV0({
      moves: moves.map((m) => m.san),
      outcome: slot.outcome,
      matchId: slot.matchId,
      gameId: slot.matchId,
      localColor: "w",
      opponentCastleId: `cluster_slot_${slot.slotId}`,
      runLearningLoop: true,
      policyMode: "cluster_observer"
    });
  } catch {
    pipeline = null;
  }

  const summaryLines = compression.clusters.map(
    (c) => `${c.pattern} → ${c.correlationHint} (n=${c.count})`
  );
  const summary =
    summaryLines.length > 0
      ? summaryLines.join("; ")
      : `Game ${slot.matchId} ended ${slot.outcome || "unknown"}`;

  writeChessClusterMemoryNodeV0({
    kind: "game_compression",
    slotId: slot.slotId,
    matchId: slot.matchId,
    summary,
    reinforcement: compression.reinforcement,
    observation: Object.freeze({
      outcome: slot.outcome,
      moveCount: moves.length,
      clusters: compression.clusters
    })
  });

  if (compression.recurring.length > 0) {
    upsertRhizohKnowledgeV0({
      question: `What pattern did Rhizoh observe in cluster slot ${slot.slotId}?`,
      answer: summary,
      teacher: RHIZOH_TEACHER_SOURCE_V0.STOCKFISH,
      tags: ["chess", "cluster", "pattern", ...compression.recurring.map((r) => r.tag)],
      confidence: compression.reinforcement
    });
  }

  const result = Object.freeze({
    schema: CHESS_CLUSTER_LEARNING_SCHEMA_V0,
    slotId: slot.slotId,
    matchId: slot.matchId,
    outcome: slot.outcome,
    compression,
    pipelineLayers: pipeline?.layers || null,
    memoryGraph: getChessClusterMemoryGraphSnapshotV0(),
    spatialIndependent: true,
    atMs: Date.now()
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessClusterLearning = result;
    try {
      window.dispatchEvent(new CustomEvent(CHESS_CLUSTER_LEARNING_EVENT_V0, { detail: result }));
    } catch {
      /* noop */
    }
  }

  return result;
}
