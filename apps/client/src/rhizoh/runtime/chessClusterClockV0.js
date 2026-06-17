/**
 * Chess cluster clocks — per-board time limits from arena session time controls.
 * RESEARCH-ONLY
 */

import {
  readChessArenaSessionV0,
  resolveChessTimeControlV0
} from "./chessArenaSessionV0.js";

export const CHESS_CLUSTER_CLOCK_SCHEMA_V0 = "castle.rhizoh.chess_cluster_clock.v0";

/**
 * @param {string} [timeControlId]
 */
export function createChessClusterClockStateV0(timeControlId) {
  const tc = resolveChessTimeControlV0(
    timeControlId || readChessArenaSessionV0().timeControlId
  );
  return Object.freeze({
    schema: CHESS_CLUSTER_CLOCK_SCHEMA_V0,
    timeControlId: tc.id,
    labelTr: tc.labelTr,
    labelEn: tc.labelEn,
    whiteClockMs: tc.initialMs,
    blackClockMs: tc.initialMs,
    incrementMs: tc.incrementMs
  });
}

/**
 * @param {object} slot — mutable cluster slot
 * @param {"w"|"b"} moverColor
 */
export function applyChessClusterClockIncrementV0(slot, moverColor) {
  if (!slot || slot.incrementMs == null) return;
  if (moverColor === "w") {
    slot.whiteClockMs = Math.max(0, Number(slot.whiteClockMs) + Number(slot.incrementMs));
  } else {
    slot.blackClockMs = Math.max(0, Number(slot.blackClockMs) + Number(slot.incrementMs));
  }
}

/**
 * @param {object} slot
 * @param {number} [deltaMs=1000]
 * @returns {"white_wins"|"black_wins"|null} flag outcome if time expired
 */
export function tickChessClusterSlotClockV0(slot, deltaMs = 1000) {
  if (!slot || slot.status !== "active") return null;
  if ((slot.ply || 0) < 1) return null;
  const turn = slot.game?.turn?.();
  if (turn === "w") {
    slot.whiteClockMs = Math.max(0, Number(slot.whiteClockMs) - deltaMs);
    if (slot.whiteClockMs <= 0) return "black_wins";
  } else {
    slot.blackClockMs = Math.max(0, Number(slot.blackClockMs) - deltaMs);
    if (slot.blackClockMs <= 0) return "white_wins";
  }
  return null;
}

export function formatChessClusterClockV0(ms) {
  const safe = Math.max(0, Number(ms) || 0);
  const totalSec = Math.floor(safe / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function summarizeChessClusterClockV0(slot) {
  if (!slot) return null;
  return Object.freeze({
    timeControlId: slot.timeControlId || null,
    whiteClockMs: slot.whiteClockMs,
    blackClockMs: slot.blackClockMs,
    incrementMs: slot.incrementMs,
    whiteClock: formatChessClusterClockV0(slot.whiteClockMs),
    blackClock: formatChessClusterClockV0(slot.blackClockMs)
  });
}
