/**
 * Chess arena autoplay move picker — engine retry before heuristic cap fallback.
 * Fixes Na3/Na6 loop when Stockfish is ready but queue-contended.
 */

import { CHESS_GAME_MODE_V0 } from "./chessArenaEngineV0.js";
import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";
import {
  getChessTeacherStatusV0,
  pickChessArenaMoveViaTeacherV0
} from "./chessTeacherInterfaceV0.js";
import { shouldDeferArenaEngineWorkV0 } from "./chessEngineContentionGateV0.js";
import { pickRhizohChessMoveV0 } from "./rhizohChessPlayerV0.js";

export const CHESS_ARENA_AUTOPLAY_PICK_SCHEMA_V0 = "castle.chess_arena_autoplay_pick.v0";

/** Per-attempt cap while waiting on engine queue. */
export const ARENA_AUTOPLAY_MOVE_PICK_CAP_MS_V0 = 5500;
/** Total retry budget before heuristic fallback. */
export const ARENA_AUTOPLAY_MAX_WAIT_MS_V0 = 14_000;
const DEFER_POLL_MS_V0 = 400;
const RETRY_GAP_MS_V0 = 280;

function delayMsV0(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isHeuristicEngineV0(engine) {
  const e = String(engine || "");
  return (
    e === "heuristic_autoplay_cap" ||
    e === "heuristic_fallback" ||
    e.includes("heuristic") ||
    e === "cluster_contention_heuristic" ||
    e === "cluster_fast_heuristic_contention"
  );
}

/**
 * @param {{
 *   game: object,
 *   rhizohTurnNow: boolean,
 *   teacherOnline: boolean,
 *   activeMode: string,
 *   policyMode?: string,
 *   mindId?: string,
 *   opponentPreset?: string
 * }} input
 */
async function pickOnceV0(input) {
  const { game, rhizohTurnNow, teacherOnline, activeMode, policyMode, mindId, opponentPreset } =
    input;

  if (activeMode === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH) {
    if (rhizohTurnNow) {
      return pickRhizohChessMoveV0(game, { policyMode, mindId });
    }
    const useStockfish = teacherOnline && getChessTeacherStatusV0() === "stockfish_wasm";
    return pickChessArenaMoveViaTeacherV0(game, {
      useStockfish,
      preset: opponentPreset
    });
  }

  const useStockfish = teacherOnline && getChessTeacherStatusV0() === "stockfish_wasm";
  return pickChessArenaMoveViaTeacherV0(game, {
    useStockfish,
    preset: opponentPreset || "ARENA"
  });
}

/**
 * Wait for cluster defer to clear, then retry Stockfish before heuristic cap.
 * @param {Parameters<typeof pickOnceV0>[0]} input
 */
export async function pickArenaAutoplayMoveV0(input) {
  const deadline = Date.now() + ARENA_AUTOPLAY_MAX_WAIT_MS_V0;

  while (Date.now() < deadline) {
    if (shouldDeferArenaEngineWorkV0()) {
      await delayMsV0(DEFER_POLL_MS_V0);
      continue;
    }

    try {
      const raced = await Promise.race([
        pickOnceV0(input),
        delayMsV0(ARENA_AUTOPLAY_MOVE_PICK_CAP_MS_V0).then(() => null)
      ]);
      if (raced?.move) {
        return Object.freeze({
          ...raced,
          fallbackMode: isHeuristicEngineV0(raced.engine)
        });
      }
    } catch {
      /* retry */
    }

    await delayMsV0(RETRY_GAP_MS_V0);
  }

  return Object.freeze({
    move: pickChessArenaAiMoveV0(input.game),
    engine: "heuristic_autoplay_cap",
    fallbackMode: true
  });
}
