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

/**
 * @param {object} slot
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 */
export async function pickChessClusterMoveV0(slot, game) {
  const mode = resolveChessClusterSlotModeV0(slot.slotId);
  const turn = game.turn();
  const agentId = turn === "w" ? mode.whiteAgent : mode.blackAgent;
  const policy = resolveChessClusterAgentPolicyV0(agentId);
  const stockfishOpts = resolveChessClusterStockfishOptsV0(agentId);
  const stockfishReady = await resolveClusterStockfishReadyV0(mode);

  switch (mode.moveStrategy) {
    case "rhizoh_vs_stockfish":
      if (turn === "w") {
        const rhizohPick = await pickRhizohChessMoveV0(game);
        return Object.freeze({
          move: rhizohPick?.move || pickClusterHeuristicMoveV0(game, slot, agentId, policy),
          engine: rhizohPick?.engine || "rhizoh_ai"
        });
      }
      return scheduleClusterEngineMoveV0(game, {
        useStockfish: stockfishReady,
        queueLabel: `cluster_slot_${slot.slotId}`,
        ...(slot.slotId === 0 || mode.spectatorFeatured
          ? resolveFeaturedSlotStockfishOptsV0()
          : resolveChessClusterStockfishOptsV0(CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH))
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
        movetimeMs: Math.min(stockfishOpts.movetimeMs + 40, 400)
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
