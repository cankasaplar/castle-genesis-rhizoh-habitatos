/**
 * Expanded offline chess corpus bundles — GM / engine league / opening tree / tactics.
 * RESEARCH-ONLY — training input only.
 */

import { CHESS_HISTORY_QUALITY_TIER_V0 } from "./chessHistoryCorpusSeedV0.js";

export const CHESS_CORPUS_BUNDLE_SCHEMA_V0 = "castle.rhizoh.chess_corpus_bundle.v0";

export const CHESS_CORPUS_EXPANSION_BUNDLES_V0 = Object.freeze([
  Object.freeze({
    bundleId: "gm_expansion_v0",
    qualityTier: CHESS_HISTORY_QUALITY_TIER_V0.GM_CLASSICAL,
    games: Object.freeze([
      Object.freeze({
        id: "fischer_poisoned_pawn",
        headers: Object.freeze({
          Event: "Candidates",
          White: "Fischer, Robert J.",
          Black: "Petrosian, Tigran",
          Result: "1-0"
        }),
        moves: Object.freeze([
          "e4",
          "c5",
          "Nf3",
          "d6",
          "d4",
          "cxd4",
          "Nxd4",
          "Nf6",
          "Nc3",
          "a6",
          "Bg5",
          "e6",
          "f4",
          "Qb6"
        ])
      }),
      Object.freeze({
        id: "kasparov_immortal",
        headers: Object.freeze({
          Event: "Wijk aan Zee",
          White: "Kasparov, Garry",
          Black: "Topalov, Veselin",
          Result: "1-0"
        }),
        moves: Object.freeze([
          "e4",
          "d6",
          "d4",
          "Nf6",
          "Nc3",
          "g6",
          "Be3",
          "Bg7",
          "Qd2",
          "c6",
          "f3",
          "b5",
          "Nge2",
          "Nbd7"
        ])
      }),
      Object.freeze({
        id: "carlsen_berlin",
        headers: Object.freeze({
          Event: "World Championship",
          White: "Carlsen, Magnus",
          Black: "Karjakin, Sergey",
          Result: "1-0"
        }),
        moves: Object.freeze([
          "e4",
          "e5",
          "Nf3",
          "Nc6",
          "Bb5",
          "Nf6",
          "O-O",
          "Nxe4",
          "d4",
          "Nd6",
          "Bxc6",
          "dxc6",
          "dxe5",
          "Nf5"
        ])
      })
    ])
  }),
  Object.freeze({
    bundleId: "engine_league_v0",
    qualityTier: CHESS_HISTORY_QUALITY_TIER_V0.ENGINE_LEAGUE,
    games: Object.freeze([
      Object.freeze({
        id: "sf_vs_leela_berlin",
        headers: Object.freeze({
          Event: "TCEC",
          White: "Stockfish",
          Black: "Leela Chess Zero",
          Result: "1/2-1/2"
        }),
        moves: Object.freeze([
          "e4",
          "e5",
          "Nf3",
          "Nc6",
          "Bb5",
          "Nf6",
          "O-O",
          "Nxe4",
          "Re1",
          "Nd6",
          "Nxe5",
          "Nxe5",
          "Rxe5",
          "O-O"
        ])
      }),
      Object.freeze({
        id: "sf_vs_leela_qgd",
        headers: Object.freeze({
          Event: "CCC",
          White: "Stockfish",
          Black: "Leela Chess Zero",
          Result: "1-0"
        }),
        moves: Object.freeze([
          "d4",
          "d5",
          "c4",
          "e6",
          "Nc3",
          "Nf6",
          "Bg5",
          "Be7",
          "e3",
          "O-O",
          "Nf3",
          "Nbd7",
          "Rc1",
          "c6"
        ])
      })
    ])
  }),
  Object.freeze({
    bundleId: "opening_tree_v0",
    qualityTier: CHESS_HISTORY_QUALITY_TIER_V0.SEED_CORPUS,
    games: Object.freeze([
      Object.freeze({
        id: "tree_italian_main",
        motif: "opening_tree",
        headers: Object.freeze({ Opening: "Italian Game" }),
        moves: Object.freeze(["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+"])
      }),
      Object.freeze({
        id: "tree_sicilian_najdorf",
        motif: "opening_tree",
        headers: Object.freeze({ Opening: "Sicilian Najdorf" }),
        moves: Object.freeze(["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e5"])
      }),
      Object.freeze({
        id: "tree_qgd_exchange",
        motif: "opening_tree",
        headers: Object.freeze({ Opening: "Queen's Gambit Declined" }),
        moves: Object.freeze(["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7", "Rc1", "c6"])
      }),
      Object.freeze({
        id: "tree_kings_indian",
        motif: "opening_tree",
        headers: Object.freeze({ Opening: "King's Indian" }),
        moves: Object.freeze(["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6"])
      })
    ])
  }),
  Object.freeze({
    bundleId: "tactical_motifs_v0",
    qualityTier: CHESS_HISTORY_QUALITY_TIER_V0.SEED_CORPUS,
    games: Object.freeze([
      Object.freeze({
        id: "motif_fork_knight",
        motif: "fork",
        headers: Object.freeze({ Theme: "Knight fork" }),
        moves: Object.freeze(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "O-O", "c3", "d5"])
      }),
      Object.freeze({
        id: "motif_pin_bishop",
        motif: "pin",
        headers: Object.freeze({ Theme: "Bishop pin" }),
        moves: Object.freeze(["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Nc3", "Nxe4", "O-O", "Nxc3"])
      }),
      Object.freeze({
        id: "motif_skewer_rook",
        motif: "skewer",
        headers: Object.freeze({ Theme: "Rook skewer" }),
        moves: Object.freeze(["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7", "Rc1", "c6", "Bd3", "dxc4"])
      }),
      Object.freeze({
        id: "motif_discovered_check",
        motif: "discovered_check",
        headers: Object.freeze({ Theme: "Discovered check" }),
        moves: Object.freeze(["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e6", "f3", "b5", "Qd2", "Bb7"])
      })
    ])
  })
]);

export function listChessCorpusExpansionBundlesV0() {
  return CHESS_CORPUS_EXPANSION_BUNDLES_V0;
}
