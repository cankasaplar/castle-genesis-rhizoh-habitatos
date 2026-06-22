/**
 * Match truth → UI projection v0 — server committed state as render snapshot.
 * UI reads projection only; chess.js is input checker, not authority.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_P0_REALITY_SYNC_IMPLEMENTATION_BLUEPRINT_V1.md
 */

import { getMatchmakingTruthSnapshotV0 } from "./matchmakingTruthKernelV0.js";

export const MATCH_TRUTH_UI_PROJECTION_SCHEMA_V0 =
  "castle.rhizoh.match_truth_ui_projection.v0";

export const MATCH_GAME_TYPE_V0 = Object.freeze({
  CHESS: "chess",
  GO: "go"
});

/**
 * @param {object} [snap]
 * @returns {object}
 */
export function projectMatchTruthToUiV0(snap = getMatchmakingTruthSnapshotV0()) {
  const session = snap?.activeSession ?? null;
  const committed = session?.committed ?? null;
  const shadow = session?.shadow ?? null;
  const sessionId = String(session?.sessionId || "").trim();

  if (!sessionId) {
    return Object.freeze({
      schema: MATCH_TRUTH_UI_PROJECTION_SCHEMA_V0,
      ok: false,
      reason: "no_active_session",
      interpretationOnly: true,
      shadowRehearsal: true
    });
  }

  const fen = String(committed?.fen || session?.fen || "").trim();
  const turn = String(committed?.turn || session?.turn || "white");
  const moveCount = Number(committed?.moveCount ?? session?.moveCount ?? 0);
  const serverSeq = Number(committed?.serverSeq ?? 0);
  const lastSan = String(committed?.lastSan || shadow?.lastSan || "").trim() || null;
  const gameType = String(session?.gameType || MATCH_GAME_TYPE_V0.CHESS);

  return Object.freeze({
    schema: MATCH_TRUTH_UI_PROJECTION_SCHEMA_V0,
    ok: true,
    sessionId,
    gameType,
    fen,
    turn,
    moveCount,
    serverSeq,
    lastSan,
    serverAuthoritative: Boolean(committed?.serverSeq > 0 || snap?.authority?.serverAuthoritative),
    previewFen: shadow?.fen ? String(shadow.fen) : null,
    previewOnly: false,
    interpretationOnly: true,
    shadowRehearsal: session?.shadowRehearsal !== false,
    atMs: Date.now()
  });
}

/**
 * Chess-specific render bundle (FEN + turn for board component).
 * @param {object} [projection]
 */
export function projectChessUiFromTruthV0(projection = projectMatchTruthToUiV0()) {
  if (!projection.ok) return projection;
  return Object.freeze({
    ...projection,
    chessTurn: projection.turn === "black" ? "b" : "w",
    boardFen: projection.fen
  });
}
