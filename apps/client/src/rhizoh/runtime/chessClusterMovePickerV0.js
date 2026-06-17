/**
 * Chess cluster move picker — mode-aware moves via single shared engine.
 * RESEARCH-ONLY
 */

import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";
import {
  resolveChessClusterAgentPolicyV0,
  resolveChessClusterStockfishOptsV0
} from "./chessClusterAgentPolicyV0.js";
import { resolveChessClusterSlotModeV0 } from "./chessClusterSlotModesV0.js";
import { scheduleClusterEngineMoveV0 } from "./chessClusterEngineSchedulerV0.js";
import { getChessStockfishEngineStatusV0 } from "./chessStockfishEngineV0.js";

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
  const stockfishReady = getChessStockfishEngineStatusV0() === "stockfish_wasm";

  switch (mode.moveStrategy) {
    case "stockfish":
      return scheduleClusterEngineMoveV0(game, {
        useStockfish: stockfishReady,
        ...stockfishOpts
      });
    case "stockfish_aggressive":
      return scheduleClusterEngineMoveV0(game, {
        useStockfish: stockfishReady,
        ...stockfishOpts,
        contempt: Math.max(stockfishOpts.contempt ?? 0, 24),
        movetimeMs: Math.min(stockfishOpts.movetimeMs + 40, 400)
      });
    case "heuristic":
      return Object.freeze({
        move: pickChessArenaAiMoveV0(game),
        engine: "heuristic_defensive"
      });
    case "heuristic_human":
      return Object.freeze({
        move: pickChessArenaAiMoveV0(game),
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
        move: pickChessArenaAiMoveV0(game),
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
        return scheduleClusterEngineMoveV0(game, { useStockfish: true, ...stockfishOpts });
      }
      return Object.freeze({
        move: pickChessArenaAiMoveV0(game),
        engine: "heuristic_fallback"
      });
    }
    default:
      return scheduleClusterEngineMoveV0(game, {
        useStockfish: stockfishReady,
        ...stockfishOpts
      });
  }
}
