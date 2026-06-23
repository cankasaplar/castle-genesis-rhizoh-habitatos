import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetChessClusterLearningTraceForTestV0,
  traceChessClusterPolicyDiffFromBufferV0
} from "../chessClusterLearningTraceV0.js";
import { __resetChessLearningAgreementGateForTestV0 } from "../chessLearningAgreementGateV0.js";
import { __resetChessLearningBatchForTestV0 } from "../chessLearningBatchV0.js";
import { __resetChessFenClusterMemoryForTestV0 } from "../chessFenClusterMemoryV0.js";
import { clearChessClusterDriftDatasetForTestV0 } from "../chessClusterDriftDatasetV0.js";
import { __resetChessEngineTaskQueueForTestV0 } from "../chessEngineTaskQueueV0.js";
import { getUglLearnBufferSnapshotV0, registerUglLearnBufferEnrichHandlerV0 } from "../rhizohUglLearnBufferSinkV0.js";

const FEN =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";

vi.mock("../chessStockfishEngineV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getChessStockfishEngineStatusV0: vi.fn(() => "stockfish_wasm"),
    analyzeChessPositionMultiPvV0: vi.fn(async () =>
      Object.freeze({
        fen: FEN,
        multiPv: 2,
        lines: Object.freeze([
          Object.freeze({ bestMove: "e7e5", cp: 22, depth: 10, multipv: 1 }),
          Object.freeze({ bestMove: "c7c5", cp: 18, depth: 10, multipv: 2 })
        ])
      })
    )
  };
});

describe("chessClusterLearningTraceV0", () => {
  beforeEach(() => {
    __resetChessClusterLearningTraceForTestV0();
    __resetChessLearningAgreementGateForTestV0();
    __resetChessLearningBatchForTestV0();
    __resetChessFenClusterMemoryForTestV0();
    clearChessClusterDriftDatasetForTestV0();
    __resetChessEngineTaskQueueForTestV0();
    registerUglLearnBufferEnrichHandlerV0(null);
    window.__rhizoh = {};
  });

  it("enriches buffer without double-queue deadlock", async () => {
    const slot = {
      slotId: 2,
      matchId: "cluster_2_test",
      moveHistory: [{ san: "e4" }],
      game: { fen: () => FEN }
    };
    const moveRow = { ply: 2, uci: "e7e5", san: "e5", fenBefore: FEN };

    const out = await traceChessClusterPolicyDiffFromBufferV0(slot, moveRow, FEN);
    expect(out?.engineBest).toBe("e7e5");
    expect(out?.source).toBe("learn_buffer_enrich");
    expect(getUglLearnBufferSnapshotV0().handlerRegistered).toBe(false);
  });
});
