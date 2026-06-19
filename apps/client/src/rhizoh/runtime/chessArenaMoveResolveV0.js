/**
 * Resolve SAN or UCI hints to legal UCI for chess.js tryMove.
 * RESEARCH-ONLY
 */

/**
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 * @param {string|null|undefined} moveHint
 */
export function resolveChessLegalMoveUciV0(game, moveHint) {
  const raw = String(moveHint || "").trim();
  if (!raw || !game) return null;
  const legal = game.legalMoves();
  if (!legal.length) return null;

  if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(raw)) {
    const from = raw.slice(0, 2).toLowerCase();
    const to = raw.slice(2, 4).toLowerCase();
    const promotion = raw.length > 4 ? raw[4].toLowerCase() : undefined;
    const match = legal.find(
      (m) => m.from === from && m.to === to && (promotion ? m.promotion === promotion : true)
    );
    return match ? `${match.from}${match.to}${match.promotion || ""}` : null;
  }

  const bySan = legal.find((m) => m.san === raw);
  if (bySan) return `${bySan.from}${bySan.to}${bySan.promotion || ""}`;

  const loose = legal.find((m) => m.san.replace(/[+#]/g, "") === raw.replace(/[+#]/g, ""));
  if (loose) return `${loose.from}${loose.to}${loose.promotion || ""}`;

  return null;
}

/**
 * @param {{ rhizohColor?: 'w'|'b' }} slot
 * @param {'w'|'b'} turn
 */
export function isRhizohClusterTurnV0(slot, turn) {
  const rhizoh = slot?.rhizohColor === "b" ? "b" : "w";
  return turn === rhizoh;
}
