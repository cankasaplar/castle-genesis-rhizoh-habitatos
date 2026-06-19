/**
 * Pattern extraction from historical / live SAN lists.
 * PR-A: opening fingerprint + tactical density proxy.
 * PR-B/C: style embeddings + batch trainer consume these rows.
 * RESEARCH-ONLY
 */

import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";

export const CHESS_HISTORY_PATTERN_SCHEMA_V0 = "castle.rhizoh.chess_history_pattern.v0";

const OPENING_BUCKETS_V0 = Object.freeze([
  "Italian",
  "Scotch",
  "English",
  "Queen's Gambit",
  "King's Pawn",
  "Nimzo-Indian",
  "Other"
]);

/**
 * @param {string[]} moves
 */
export function resolveOpeningFingerprintV0(moves = []) {
  const san = moves.map((m) => String(m || "").trim()).filter(Boolean).slice(0, 12);
  return san.join(" ").toLowerCase() || "empty";
}

/**
 * @param {string[]} moves
 */
export function classifyOpeningBucketV0(moves = []) {
  const san = moves.map((m) => String(m || "").trim()).filter(Boolean).slice(0, 8);
  const joined = san.join(" ").toLowerCase();
  if (!joined) return "Other";
  if (joined.startsWith("c4")) return "English";
  if (joined.startsWith("d4") && /\bc6\b|\be6\b/.test(joined)) return "Queen's Gambit";
  if (joined.startsWith("d4")) return "Queen's Gambit";
  if (joined.startsWith("e4")) {
    if (/\bd4\b/.test(joined)) return "Scotch";
    if (/\bbc4\b/.test(joined) || /\bnf3\b/.test(joined)) return "Italian";
    return "King's Pawn";
  }
  if (/\bd4\b/.test(joined) && /\bc4\b/.test(joined)) return "Nimzo-Indian";
  return "Other";
}

/**
 * Proxy tactical density without engine eval (PR-A).
 * @param {string[]} moves
 */
export function resolveTacticalDensityProxyV0(moves = []) {
  const san = moves.map((m) => String(m || "").trim()).filter(Boolean);
  if (!san.length) {
    return Object.freeze({ checks: 0, captures: 0, tacticalDensity: 0 });
  }
  let checks = 0;
  let captures = 0;
  for (const m of san) {
    if (m.includes("+") || m.includes("#")) checks += 1;
    if (m.includes("x")) captures += 1;
  }
  const tacticalDensity = Number(((checks + captures * 0.5) / san.length).toFixed(3));
  return Object.freeze({ checks, captures, tacticalDensity });
}

/**
 * @param {string[]} moves
 */
export function extractChessHistoryPatternsV0(moves = []) {
  const fenRows = buildMatchMovesWithFenV0(moves);
  const uniquePositions = new Set(fenRows.map((r) => r.before)).size;
  const opening = classifyOpeningBucketV0(moves);
  const tactical = resolveTacticalDensityProxyV0(moves);

  return Object.freeze({
    schema: CHESS_HISTORY_PATTERN_SCHEMA_V0,
    openingFingerprint: resolveOpeningFingerprintV0(moves),
    openingBucket: opening,
    openingBuckets: OPENING_BUCKETS_V0,
    moveCount: moves.length,
    uniquePositions,
    tactical,
    blunderDensity: null,
    evalSwingCurve: null,
    endgameConversionRate: null,
    note: "blunder/eval/endgame fields reserved for PR-B offline batch trainer"
  });
}
