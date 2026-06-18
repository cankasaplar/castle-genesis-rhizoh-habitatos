/**
 * Minimal PGN parser — headers + SAN history via chess.js.
 * RESEARCH-ONLY
 */

import { Chess } from "chess.js";

export const CHESS_PGN_PARSER_SCHEMA_V0 = "castle.rhizoh.chess_pgn_parser.v0";

/**
 * @param {string} pgnText
 * @returns {{ headers: Record<string, string>, moves: string[], result: string | null } | null}
 */
export function parseChessPgnGameV0(pgnText) {
  const text = String(pgnText || "").trim();
  if (!text) return null;
  const chess = new Chess();
  try {
    chess.loadPgn(text, { sloppy: true });
    const headers = chess.header();
    const moves = chess.history();
    if (!moves.length) return null;
    return Object.freeze({
      headers: Object.freeze({ ...headers }),
      moves: Object.freeze([...moves]),
      result: headers.Result || null
    });
  } catch {
    return null;
  }
}

/**
 * Split multi-game PGN export into individual game strings.
 * @param {string} bundleText
 * @returns {string[]}
 */
export function splitChessPgnBundleV0(bundleText) {
  const text = String(bundleText || "").trim();
  if (!text) return [];
  const chunks = text.split(/\n\n(?=\[)/).map((c) => c.trim()).filter(Boolean);
  if (chunks.length > 0) return chunks;
  return text ? [text] : [];
}

/**
 * @param {string} bundleText
 * @returns {Array<NonNullable<ReturnType<typeof parseChessPgnGameV0>>>}
 */
export function parseChessPgnBundleV0(bundleText) {
  const games = [];
  for (const chunk of splitChessPgnBundleV0(bundleText)) {
    const parsed = parseChessPgnGameV0(chunk);
    if (parsed) games.push(parsed);
  }
  return Object.freeze(games);
}
