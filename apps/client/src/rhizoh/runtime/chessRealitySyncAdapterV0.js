/**
 * Chess reality sync adapter v0 — UI projection binding for chess arena.
 * chess.js validates input only; committed FEN comes from truth projection.
 * RESEARCH-ONLY
 */

import { Chess } from "chess.js";
import { createChessArenaGameV0 } from "./chessArenaEngineV0.js";
import { proposeMatchGameMoveV0 } from "./matchGameTransportV0.js";
import {
  isMatchRealitySyncActiveV0,
  getMatchSessionSyncSnapshotV0
} from "./matchSessionSyncBridgeV0.js";
import { projectChessUiFromTruthV0 } from "./matchTruthUiProjectionV0.js";
import { MATCH_REALITY_SYNC_STATE_EVENT_V0 } from "./matchSessionSyncBridgeV0.js";

export const CHESS_REALITY_SYNC_SCHEMA_V0 = "castle.rhizoh.chess_reality_sync.v0";

/**
 * Validate move locally without mutating authoritative game state.
 * @param {string} fen
 * @param {string} move
 */
export function validateChessMoveInputV0(fen, move) {
  try {
    const probe = new Chess(String(fen || ""));
    const raw = String(move || "").trim();
    let result = null;
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(raw)) {
      result = probe.move({
        from: raw.slice(0, 2),
        to: raw.slice(2, 4),
        promotion: raw.length > 4 ? raw[4].toLowerCase() : undefined
      });
    } else {
      result = probe.move(raw);
    }
    if (!result) return Object.freeze({ ok: false, reason: "illegal_move" });
    return Object.freeze({ ok: true, san: result.san, fen: probe.fen() });
  } catch {
    return Object.freeze({ ok: false, reason: "illegal_move" });
  }
}

/**
 * Propose chess move through reality sync transport (no local authoritative commit).
 * @param {{ move: string, playerId?: string, sessionId?: string }} input
 */
export async function proposeChessRealityMoveV0(input = {}) {
  const snap = getMatchSessionSyncSnapshotV0();
  const sessionId = String(input.sessionId || snap.sessionId || "").trim();
  const fen = snap.projection?.fen || projectChessUiFromTruthV0().fen;

  const validated = validateChessMoveInputV0(fen, input.move);
  if (!validated.ok) return validated;

  const sent = await proposeMatchGameMoveV0({
    sessionId,
    move: validated.san,
    playerId: input.playerId
  });

  return Object.freeze({
    ...sent,
    validatedSan: validated.san,
    previewFen: validated.fen,
    interpretationOnly: true,
    shadowRehearsal: true
  });
}

/**
 * Build fresh chess arena game from truth projection (authoritative render).
 * @param {{ mode?: string }} [opts]
 */
export function createChessGameFromTruthProjectionV0(opts = {}) {
  const chessUi = projectChessUiFromTruthV0();
  if (!chessUi.ok || !chessUi.boardFen) {
    return createChessArenaGameV0({ mode: opts.mode });
  }
  return createChessArenaGameV0({ mode: opts.mode, fen: chessUi.boardFen });
}

export function isChessRealitySyncActiveV0() {
  return isMatchRealitySyncActiveV0();
}

/**
 * @param {(detail: object) => void} handler
 * @returns {() => void}
 */
export function subscribeChessRealitySyncV0(handler) {
  if (typeof window === "undefined") return () => {};
  const fn = (ev) => {
    try {
      handler(ev?.detail || {});
    } catch {
      /* noop */
    }
  };
  window.addEventListener(MATCH_REALITY_SYNC_STATE_EVENT_V0, fn);
  return () => window.removeEventListener(MATCH_REALITY_SYNC_STATE_EVENT_V0, fn);
}
