/**
 * Match Stockfish Validator Bridge v0 — domain validator (referee only).
 * Uses chess.js for legal move validation; Stockfish eval path optional later.
 * Does NOT own session truth — kernel SM commits.
 * @see docs/RHIZOH_MATCH_AUTHORITY_KERNEL_V1.md
 */

import { createChessArenaGameV0 } from "./chessArenaEngineV0.js";

export const MATCH_VALIDATOR_SCHEMA_V0 = "castle.rhizoh.match_validator_result.v1";

/**
 * @param {{ fen: string, san: string, expectedTurn?: string, playerId?: string }} input
 */
export function validateMatchMoveV0(input = {}) {
  const fen = String(input.fen || "").trim();
  const san = String(input.san || "").trim();
  if (!fen || !san) {
    return Object.freeze({
      schema: MATCH_VALIDATOR_SCHEMA_V0,
      ok: false,
      reason: "missing_fen_or_san",
      validator: "chess.js",
      influencesAuthority: false,
      interpretationOnly: true
    });
  }

  const game = createChessArenaGameV0({ fen });
  const currentTurn = game.turn() === "b" ? "black" : "white";
  if (input.expectedTurn && input.expectedTurn !== currentTurn) {
    return Object.freeze({
      schema: MATCH_VALIDATOR_SCHEMA_V0,
      ok: false,
      reason: "wrong_turn",
      expectedTurn: input.expectedTurn,
      actualTurn: currentTurn,
      validator: "chess.js",
      influencesAuthority: false,
      interpretationOnly: true
    });
  }

  const result = game.tryMove(san);
  if (!result.ok) {
    return Object.freeze({
      schema: MATCH_VALIDATOR_SCHEMA_V0,
      ok: false,
      reason: result.reason || "illegal_move",
      validator: "chess.js",
      influencesAuthority: false,
      interpretationOnly: true
    });
  }

  const nextTurn = game.turn() === "b" ? "black" : "white";
  return Object.freeze({
    schema: MATCH_VALIDATOR_SCHEMA_V0,
    ok: true,
    san,
    fen: result.fen,
    turn: nextTurn,
    validator: "chess.js",
    stockfishEval: null,
    influencesAuthority: false,
    interpretationOnly: true
  });
}

export function mountMatchStockfishValidatorConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchmaking = window.__rhizoh.matchmaking || {};
  window.__rhizoh.matchmaking.validator = Object.freeze({
    validate: validateMatchMoveV0,
    engine: "chess.js",
    shadowRehearsal: true,
    influencesAuthority: false,
    interpretationOnly: true
  });
}
