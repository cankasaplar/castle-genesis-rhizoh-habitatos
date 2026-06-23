import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetChessLearningBatchOpeningFeedForTestV0,
  feedOpeningBookFromLearningBatchV0,
  getChessLearningBatchOpeningFeedSnapshotV0
} from "../chessLearningBatchOpeningFeedV0.js";
import { listRhizohOpeningBookV0, resetRhizohOpeningBookForTestV0 } from "../rhizohOpeningBookV0.js";
import {
  __resetChessLearningBatchForTestV0,
  enqueueChessLearningBatchSampleV0,
  flushChessLearningBatchV0
} from "../chessLearningBatchV0.js";
import { fuseChessEvalSourcesV0 } from "../chessEvalFusionV0.js";
import { evaluateChessLearningAgreementGateV0 } from "../chessLearningAgreementGateV0.js";
import { resetChessLearningWeightsForTestV0 } from "../chessLearningWeightsV0.js";

describe("chessLearningBatchOpeningFeedV0", () => {
  beforeEach(() => {
    resetRhizohOpeningBookForTestV0();
    __resetChessLearningBatchOpeningFeedForTestV0();
    __resetChessLearningBatchForTestV0();
    resetChessLearningWeightsForTestV0();
    window.__rhizoh = {};
  });

  it("feeds opening book from batch samples with sanMoves", () => {
    const fusion = fuseChessEvalSourcesV0({ stockfishCp: 10, databaseWinrate: 0.52 });
    const gate = evaluateChessLearningAgreementGateV0(fusion, {
      truthAuthoritative: true,
      matchedRank: 1
    });

    const out = feedOpeningBookFromLearningBatchV0([
      {
        sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
        drifted: false,
        matchedRank: 1
      }
    ]);
    expect(out.fed).toBe(1);
    expect(listRhizohOpeningBookV0().length).toBeGreaterThan(0);
    expect(getChessLearningBatchOpeningFeedSnapshotV0().linesFed).toBe(1);
  });

  it("batch flush includes opening feed sidecar", () => {
    const fusion = fuseChessEvalSourcesV0({ stockfishCp: 0, databaseWinrate: 0.5 });
    const gate = evaluateChessLearningAgreementGateV0(fusion, {
      truthAuthoritative: true,
      matchedRank: 1
    });

    enqueueChessLearningBatchSampleV0({
      position: "fen",
      playedMove: "e2e4",
      bestMove: "e2e4",
      drifted: false,
      matchedRank: 1,
      fusion,
      gate,
      sanMoves: ["e4", "e5"]
    });

    const partial = flushChessLearningBatchV0("test_partial");
    expect(partial.flushed).toBe(true);
    expect(partial.openingFeed).toBeDefined();
  });
});
