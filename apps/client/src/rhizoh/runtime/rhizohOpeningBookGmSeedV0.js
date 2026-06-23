/**
 * GM / Lichess-style opening book seed — static prior for database fusion.
 * RESEARCH-ONLY — not live API; bootstraps empty local book.
 */

import {
  listRhizohOpeningBookV0,
  mergeRhizohOpeningBookFromCloudV0,
  RHIZOH_OPENING_BOOK_SCHEMA_V0
} from "./rhizohOpeningBookV0.js";

export const RHIZOH_OPENING_BOOK_GM_SEED_SCHEMA_V0 = "castle.rhizoh.opening_book_gm_seed.v0";

/** Approximate master-game priors (white win rate ~0.5 baseline). */
export const RHIZOH_OPENING_BOOK_GM_SEED_ENTRIES_V0 = Object.freeze([
  Object.freeze({
    key: "B20",
    eco: "B20",
    name: "Sicilian Defense",
    moves: ["e4", "c5"],
    games: 420_000,
    wins: 178_000,
    losses: 172_000,
    source: "gm_seed_v0"
  }),
  Object.freeze({
    key: "C50",
    eco: "C50",
    name: "Italian Game",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    games: 310_000,
    wins: 142_000,
    losses: 138_000,
    source: "gm_seed_v0"
  }),
  Object.freeze({
    key: "D06",
    eco: "D06",
    name: "Queen's Gambit",
    moves: ["d4", "d5", "c4"],
    games: 280_000,
    wins: 128_000,
    losses: 126_000,
    source: "gm_seed_v0"
  }),
  Object.freeze({
    key: "A10",
    eco: "A10",
    name: "English Opening",
    moves: ["c4"],
    games: 190_000,
    wins: 88_000,
    losses: 86_000,
    source: "gm_seed_v0"
  }),
  Object.freeze({
    key: "C45",
    eco: "C45",
    name: "Scotch Game",
    moves: ["e4", "e5", "Nf3", "Nc6", "d4"],
    games: 165_000,
    wins: 78_000,
    losses: 76_000,
    source: "gm_seed_v0"
  }),
  Object.freeze({
    key: "C00",
    eco: "C00",
    name: "French Defense",
    moves: ["e4", "e6"],
    games: 240_000,
    wins: 102_000,
    losses: 100_000,
    source: "gm_seed_v0"
  }),
  Object.freeze({
    key: "B10",
    eco: "B10",
    name: "Caro-Kann Defense",
    moves: ["e4", "c6"],
    games: 210_000,
    wins: 92_000,
    losses: 90_000,
    source: "gm_seed_v0"
  }),
  Object.freeze({
    key: "D00",
    eco: "D00",
    name: "London System",
    moves: ["d4", "d5", "Bf4"],
    games: 120_000,
    wins: 58_000,
    losses: 56_000,
    source: "gm_seed_v0"
  }),
  Object.freeze({
    key: "E60",
    eco: "E60",
    name: "King's Indian Defense",
    moves: ["d4", "Nf6", "c4", "g6"],
    games: 175_000,
    wins: 74_000,
    losses: 72_000,
    source: "gm_seed_v0"
  }),
  Object.freeze({
    key: "B01",
    eco: "B01",
    name: "Scandinavian Defense",
    moves: ["e4", "d5"],
    games: 95_000,
    wins: 44_000,
    losses: 43_000,
    source: "gm_seed_v0"
  })
]);

let seedAppliedV0 = false;

/**
 * Merge GM seed when local book is empty or thin (improves eval fusion database prior).
 * @param {{ minEntries?: number, force?: boolean }} [opts]
 */
export function ensureRhizohOpeningBookGmSeedV0(opts = {}) {
  const minEntries = Math.max(1, Number(opts.minEntries) || 3);
  const existing = listRhizohOpeningBookV0();
  if (!opts.force && seedAppliedV0 && existing.length >= minEntries) {
    return Object.freeze({
      schema: RHIZOH_OPENING_BOOK_GM_SEED_SCHEMA_V0,
      applied: false,
      reason: "already_seeded",
      entryCount: existing.length
    });
  }
  if (!opts.force && existing.length >= minEntries) {
    seedAppliedV0 = true;
    return Object.freeze({
      schema: RHIZOH_OPENING_BOOK_GM_SEED_SCHEMA_V0,
      applied: false,
      reason: "local_book_sufficient",
      entryCount: existing.length
    });
  }

  const merged = mergeRhizohOpeningBookFromCloudV0(RHIZOH_OPENING_BOOK_GM_SEED_ENTRIES_V0);
  seedAppliedV0 = true;
  return Object.freeze({
    schema: RHIZOH_OPENING_BOOK_GM_SEED_SCHEMA_V0,
    applied: true,
    reason: "gm_seed_merged",
    entryCount: merged.length,
    seedCount: RHIZOH_OPENING_BOOK_GM_SEED_ENTRIES_V0.length
  });
}

/** @internal vitest */
export function __resetRhizohOpeningBookGmSeedForTestV0() {
  seedAppliedV0 = false;
}
