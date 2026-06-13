/**
 * Chess opening detection v0 — heuristic names from move prefix (no LLM).
 */

export const CHESS_OPENING_DETECT_SCHEMA_V0 = "castle.chess_opening_detect.v0";

const OPENING_PREFIXES_V0 = Object.freeze([
  { moves: ["e4", "c5"], name: "Sicilian Defense", eco: "B20" },
  { moves: ["e4", "e5"], name: "Open Game", eco: "C20" },
  { moves: ["e4", "c6"], name: "Caro-Kann Defense", eco: "B10" },
  { moves: ["e4", "e6"], name: "French Defense", eco: "C00" },
  { moves: ["d4", "d5"], name: "Queen's Pawn Game", eco: "D00" },
  { moves: ["d4", "Nf6"], name: "Indian Defense", eco: "A40" },
  { moves: ["d4", "f5"], name: "Dutch Defense", eco: "A80" },
  { moves: ["c4"], name: "English Opening", eco: "A10" },
  { moves: ["Nf3"], name: "Réti Opening", eco: "A04" }
]);

function normalizeSanV0(san) {
  return String(san || "")
    .replace(/[+#?!]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * @param {ReadonlyArray<string|{ san?: string }>} moves
 */
export function detectChessOpeningV0(moves = []) {
  const sans = moves
    .map((m) => (typeof m === "string" ? m : m?.san || ""))
    .map(normalizeSanV0)
    .filter(Boolean);
  if (!sans.length) {
    return Object.freeze({ name: "Unknown Opening", eco: null, moves: Object.freeze([]) });
  }

  let best = null;
  let bestLen = 0;
  for (const row of OPENING_PREFIXES_V0) {
    const prefix = row.moves.map(normalizeSanV0);
    if (prefix.length > sans.length) continue;
    const match = prefix.every((m, i) => sans[i] === m);
    if (match && prefix.length >= bestLen) {
      best = row;
      bestLen = prefix.length;
    }
  }

  if (best) {
    return Object.freeze({
      name: best.name,
      eco: best.eco,
      moves: Object.freeze(sans.slice(0, best.moves.length))
    });
  }

  const label =
    sans.length >= 2
      ? `${sans[0].toUpperCase()} ${sans[1]} System`
      : `${sans[0].toUpperCase()} Opening`;
  return Object.freeze({ name: label, eco: null, moves: Object.freeze(sans.slice(0, 4)) });
}

/**
 * Rough endgame phase from piece count on board.
 * @param {string} fen
 */
export function detectChessPhaseV0(fen) {
  const placement = String(fen || "").split(" ")[0] || "";
  const pieces = placement.replace(/[^a-zA-Z]/g, "").length;
  if (pieces <= 10) return "endgame";
  if (pieces <= 20) return "middlegame";
  return "opening";
}
