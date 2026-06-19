/**
 * Chess move SAN normalization — moveHistory stores chess.js verbose objects.
 */

/**
 * @param {unknown} raw
 */
export function formatChessMoveSanV0(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object" && raw !== null) {
    const san = /** @type {{ san?: string }} */ (raw).san;
    if (san) return String(san);
    const from = /** @type {{ from?: string, to?: string, promotion?: string }} */ (raw).from;
    const to = /** @type {{ from?: string, to?: string, promotion?: string }} */ (raw).to;
    if (from && to) {
      return `${from}${to}${raw.promotion || ""}`;
    }
  }
  return String(raw);
}

/**
 * @param {ReadonlyArray<unknown>} moves
 */
export function normalizeChessMovesToSanV0(moves = []) {
  return moves.map(formatChessMoveSanV0).filter(Boolean);
}

/**
 * @param {ReadonlyArray<unknown>} moves
 */
export function formatChessMoveListPgnV0(moves = []) {
  const sans = normalizeChessMovesToSanV0(moves);
  const parts = [];
  for (let i = 0; i < sans.length; i += 2) {
    const num = Math.floor(i / 2) + 1;
    const white = sans[i] || "";
    const black = sans[i + 1] || "";
    parts.push(black ? `${num}. ${white} ${black}` : `${num}. ${white}`);
  }
  return parts.join(" ");
}
