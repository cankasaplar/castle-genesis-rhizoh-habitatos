import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetRhizohOpeningBookGmSeedForTestV0,
  ensureRhizohOpeningBookGmSeedV0,
  RHIZOH_OPENING_BOOK_GM_SEED_ENTRIES_V0
} from "../rhizohOpeningBookGmSeedV0.js";
import { listRhizohOpeningBookV0, resetRhizohOpeningBookForTestV0 } from "../rhizohOpeningBookV0.js";
import { fuseChessEvalSourcesV0 } from "../chessEvalFusionV0.js";

describe("rhizohOpeningBookGmSeedV0", () => {
  beforeEach(() => {
    resetRhizohOpeningBookForTestV0();
    __resetRhizohOpeningBookGmSeedForTestV0();
    window.__rhizoh = {};
  });

  it("seeds empty local book with GM priors", () => {
    expect(listRhizohOpeningBookV0()).toHaveLength(0);
    const out = ensureRhizohOpeningBookGmSeedV0();
    expect(out.applied).toBe(true);
    expect(listRhizohOpeningBookV0().length).toBeGreaterThanOrEqual(
      RHIZOH_OPENING_BOOK_GM_SEED_ENTRIES_V0.length
    );
  });

  it("improves database fusion prior for known opening prefix", () => {
    ensureRhizohOpeningBookGmSeedV0();
    const fusion = fuseChessEvalSourcesV0({
      stockfishCp: 30,
      sanMoves: ["e4", "c5"],
      fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"
    });
    expect(fusion.sourceCount).toBeGreaterThanOrEqual(3);
    expect(fusion.databaseWinrate).not.toBe(0.5);
  });
});
