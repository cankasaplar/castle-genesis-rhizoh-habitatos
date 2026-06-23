/**
 * Chess cluster move picker — mode-aware moves via single shared engine.
 * RESEARCH-ONLY
 */

import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";
import { pickChessAgentHeuristicMoveV0 } from "./chessAgentHeuristicV0.js";
import {
  resolveChessClusterAgentPolicyV0,
  resolveChessClusterStockfishOptsV0,
  resolveFeaturedSlotStockfishOptsV0,
  CHESS_CLUSTER_AGENT_ID_V0
} from "./chessClusterAgentPolicyV0.js";
import { resolveChessClusterSlotModeV0 } from "./chessClusterSlotModesV0.js";
import { scheduleClusterEngineMoveV0 } from "./chessClusterEngineSchedulerV0.js";
import {
  awaitChessStockfishEngineReadyV0,
  getChessStockfishEngineStatusV0
} from "./chessStockfishEngineV0.js";
import { pickRhizohChessMoveV0 } from "./rhizohChessPlayerV0.js";
import { enqueueRhizohPredictionCompareV0 } from "./rhizohChessPredictionCompareV0.js";
import { isChessEngineContendedV0 } from "./chessEngineContentionGateV0.js";
import {
  shouldPreferClusterHeuristicUnderContentionV0
} from "./chessEngineAdaptiveSliceV0.js";
import {
  applyTeacherLeagueToStockfishOptsV0,
  resolveChessClusterTeacherLeagueRowV0
} from "./chessClusterLearningThroughputV0.js";
import { shouldUseStockfishForClusterSlotV0 } from "./chessClusterBroadcastEnginePolicyV0.js";
import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "./chessLearningMonitorV0.js";
import {
  isRhizohClusterTurnV0,
  resolveChessLegalMoveUciV0
} from "./chessArenaMoveResolveV0.js";

const CLUSTER_OPENING_FAST_HEURISTIC_PLY_V0 = 6;

function clusterModeUsesStockfishV0(mode) {
  return ["rhizoh_vs_stockfish", "stockfish", "stockfish_aggressive", "random_perturb"].includes(
    mode.moveStrategy
  );
}

async function resolveClusterStockfishReadyV0(mode) {
  if (!clusterModeUsesStockfishV0(mode)) {
    return getChessStockfishEngineStatusV0() === "stockfish_wasm";
  }
  await awaitChessStockfishEngineReadyV0();
  return getChessStockfishEngineStatusV0() === "stockfish_wasm";
}

function pickClusterHeuristicMoveV0(game, slot, agentId, policy) {
  const uci = pickChessAgentHeuristicMoveV0(game, policy, {
    slotId: slot?.slotId,
    agentId
  });
  if (uci) return uci;
  return pickChessArenaAiMoveV0(game);
}

function maybeContentionHeuristicClusterMoveV0(slot, game, mode, agentId, policy) {
  if (Number(slot?.slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0) return null;
  if (!clusterModeUsesStockfishV0(mode)) return null;
  if (!shouldPreferClusterHeuristicUnderContentionV0({ slotId: slot?.slotId })) return null;
  return Object.freeze({
    move: pickClusterHeuristicMoveV0(game, slot, agentId, policy),
    engine: "cluster_contention_heuristic"
  });
}

function maybeFastHeuristicClusterMoveV0(slot, game, mode, agentId, policy) {
  if (!clusterModeUsesStockfishV0(mode)) return null;
  // Slot #0 = LIVE / YouTube featured — never downgrade to contention heuristic.
  if (Number(slot?.slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0) return null;
  if (shouldUseStockfishForClusterSlotV0(slot?.slotId)) return null;
  if ((slot?.ply || 0) >= CLUSTER_OPENING_FAST_HEURISTIC_PLY_V0) return null;
  if (!isChessEngineContendedV0()) return null;
  return Object.freeze({
    move: pickClusterHeuristicMoveV0(game, slot, agentId, policy),
    engine: "cluster_fast_heuristic_contention"
  });
}

function maybeBroadcastGridHeuristicMoveV0(slot, game, mode, agentId, policy) {
  if (shouldUseStockfishForClusterSlotV0(slot?.slotId)) return null;
  if (!clusterModeUsesStockfishV0(mode)) return null;
  return Object.freeze({
    move: pickClusterHeuristicMoveV0(game, slot, agentId, policy),
    engine: "broadcast_grid_heuristic"
  });
}

/**
 * @param {object} slot
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 */
export async function pickChessClusterMoveV0(slot, game) {
  const mode = resolveChessClusterSlotModeV0(slot.slotId);
  const turn = game.turn();
  const agentId = turn === "w" ? mode.whiteAgent : mode.blackAgent;
  const policy = resolveChessClusterAgentPolicyV0(agentId);
  const stockfishOpts = applyTeacherLeagueToStockfishOptsV0(
    slot.slotId,
    resolveChessClusterStockfishOptsV0(agentId)
  );
  const stockfishReady = await resolveClusterStockfishReadyV0(mode);
  const fastHeuristic = maybeFastHeuristicClusterMoveV0(slot, game, mode, agentId, policy);
  if (fastHeuristic) return fastHeuristic;
  const contentionHeuristic = maybeContentionHeuristicClusterMoveV0(
    slot,
    game,
    mode,
    agentId,
    policy
  );
  if (contentionHeuristic) return contentionHeuristic;
  const gridHeuristic = maybeBroadcastGridHeuristicMoveV0(slot, game, mode, agentId, policy);
  if (gridHeuristic) return gridHeuristic;

  switch (mode.moveStrategy) {
    case "rhizoh_vs_stockfish":
      if (isRhizohClusterTurnV0(slot, turn)) {
        const fenBefore = game.fen();
        const rhizohPick = await pickRhizohChessMoveV0(game, { clusterPlay: true });
        const uci = resolveChessLegalMoveUciV0(game, rhizohPick?.move);
        if (uci) {
          enqueueRhizohPredictionCompareV0(fenBefore, uci, {
            slotId: slot?.slotId,
            matchId: slot?.matchId,
            engine: rhizohPick?.engine || "rhizoh_ai",
            san: rhizohPick?.move
          });
        }
        return Object.freeze({
          move:
            uci ||
            pickClusterHeuristicMoveV0(game, slot, agentId, policy),
          engine: uci ? rhizohPick?.engine || "rhizoh_ai" : "rhizoh_heuristic_fallback"
        });
      }
      return scheduleClusterEngineMoveV0(game, {
        useStockfish: stockfishReady,
        queueLabel: `cluster_slot_${slot.slotId}`,
        ...applyTeacherLeagueToStockfishOptsV0(
          slot.slotId,
          slot.slotId === 0 || mode.spectatorFeatured
            ? resolveFeaturedSlotStockfishOptsV0()
            : resolveChessClusterStockfishOptsV0(CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH)
        ),
        teacherLeague: resolveChessClusterTeacherLeagueRowV0(slot.slotId).label
      });
    case "stockfish":
      return scheduleClusterEngineMoveV0(game, {
        useStockfish: stockfishReady,
        queueLabel: `cluster_slot_${slot.slotId}`,
        ...stockfishOpts
      });
    case "stockfish_aggressive":
      return scheduleClusterEngineMoveV0(game, {
        useStockfish: stockfishReady,
        queueLabel: `cluster_slot_${slot.slotId}`,
        ...stockfishOpts,
        contempt: Math.max(stockfishOpts.contempt ?? 0, 24),
        movetimeMs: Math.min(stockfishOpts.movetimeMs + 80, 1200)
      });
    case "heuristic":
      return Object.freeze({
        move: pickClusterHeuristicMoveV0(game, slot, agentId, policy),
        engine: stockfishReady ? "heuristic_pending_sf" : `heuristic_${policy.riskProfile || "defensive"}`
      });
    case "heuristic_human":
      return Object.freeze({
        move: pickClusterHeuristicMoveV0(game, slot, agentId, {
          ...policy,
          riskProfile: "human_like",
          explorationRate: 0.14
        }),
        engine: "heuristic_human_mirror"
      });
    case "heuristic_explore": {
      const legal = game.legalMoves();
      if (legal.length > 1 && Math.random() < policy.explorationRate) {
        const pick = legal[Math.floor(Math.random() * legal.length)];
        const uci = `${pick.from}${pick.to}${pick.promotion || ""}`;
        return Object.freeze({ move: uci, engine: "heuristic_rl_explore" });
      }
      return Object.freeze({
        move: pickClusterHeuristicMoveV0(game, slot, agentId, policy),
        engine: "heuristic_rl_trace"
      });
    }
    case "random_perturb": {
      const legal = game.legalMoves();
      if (!legal.length) return Object.freeze({ move: null, engine: "none" });
      if (Math.random() < 0.18) {
        const pick = legal[Math.floor(Math.random() * legal.length)];
        const uci = `${pick.from}${pick.to}${pick.promotion || ""}`;
        return Object.freeze({ move: uci, engine: "random_perturbation" });
      }
      if (stockfishReady) {
        return scheduleClusterEngineMoveV0(game, {
          useStockfish: true,
          queueLabel: `cluster_slot_${slot.slotId}`,
          ...stockfishOpts
        });
      }
      return Object.freeze({
        move: pickClusterHeuristicMoveV0(game, slot, agentId, policy),
        engine: "heuristic_fallback"
      });
    }
    default:
      return scheduleClusterEngineMoveV0(game, {
        useStockfish: stockfishReady,
        queueLabel: `cluster_slot_${slot.slotId}`,
        ...stockfishOpts
      });
  }
}
