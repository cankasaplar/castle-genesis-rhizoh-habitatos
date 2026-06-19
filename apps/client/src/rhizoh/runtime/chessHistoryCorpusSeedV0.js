/**
 * Seed historical game corpus — offline GM classics (no network).
 * RESEARCH-ONLY — interpretation / training input only.
 */

export const CHESS_HISTORY_CORPUS_SEED_SCHEMA_V0 = "castle.rhizoh.chess_history_corpus_seed.v0";
export const CHESS_HISTORY_CORPUS_SEED_BUNDLE_ID_V0 = "gm_classics_v0";

export const CHESS_HISTORY_QUALITY_TIER_V0 = Object.freeze({
  GM_CLASSICAL: "gm_classical",
  ENGINE_LEAGUE: "engine_league",
  TITLED_LEAGUE: "titled_league",
  LIVE_RHIZOH: "live_rhizoh",
  SEED_CORPUS: "seed_corpus"
});

/** @type {ReadonlyArray<object>} */
export const CHESS_HISTORY_SEED_GAMES_V0 = Object.freeze([
  Object.freeze({
    id: "fischer_sicilian_classic",
    qualityTier: CHESS_HISTORY_QUALITY_TIER_V0.GM_CLASSICAL,
    headers: Object.freeze({
      Event: "Candidates",
      White: "Fischer, Robert J.",
      Black: "Larsen, Bent",
      Result: "1-0"
    }),
    moves: Object.freeze(["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "d6"])
  }),
  Object.freeze({
    id: "kasparov_kings_indian",
    qualityTier: CHESS_HISTORY_QUALITY_TIER_V0.GM_CLASSICAL,
    headers: Object.freeze({
      Event: "World Championship",
      White: "Kasparov, Garry",
      Black: "Karpov, Anatoly",
      Result: "1-0"
    }),
    moves: Object.freeze(["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5"])
  }),
  Object.freeze({
    id: "carlsen_queens_gambit",
    qualityTier: CHESS_HISTORY_QUALITY_TIER_V0.GM_CLASSICAL,
    headers: Object.freeze({
      Event: "World Championship",
      White: "Carlsen, Magnus",
      Black: "Anand, Viswanathan",
      Result: "1-0"
    }),
    moves: Object.freeze(["d4", "Nf6", "c4", "e6", "Nf3", "d5", "Nc3", "Be7", "Bf4", "O-O", "e3", "c5"])
  }),
  Object.freeze({
    id: "stockfish_style_engine",
    qualityTier: CHESS_HISTORY_QUALITY_TIER_V0.ENGINE_LEAGUE,
    headers: Object.freeze({
      Event: "Engine League (synthetic)",
      White: "Stockfish",
      Black: "Leela",
      Result: "1/2-1/2"
    }),
    moves: Object.freeze(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"])
  })
]);

export function getChessHistorySeedBundleV0() {
  return Object.freeze({
    schema: CHESS_HISTORY_CORPUS_SEED_SCHEMA_V0,
    bundleId: CHESS_HISTORY_CORPUS_SEED_BUNDLE_ID_V0,
    qualityTier: CHESS_HISTORY_QUALITY_TIER_V0.SEED_CORPUS,
    games: CHESS_HISTORY_SEED_GAMES_V0
  });
}
