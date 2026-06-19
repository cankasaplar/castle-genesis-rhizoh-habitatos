import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolvePredictionAccuracyFromRankV0,
  __resetRhizohChessLearningReportForTestV0
} from "../rhizohChessLearningReportV0.js";
import {
  __resetChessSchedulerUnifyForTestV0
} from "../chessSchedulerUnifyV0.js";
import { compareRhizohMoveWithStockfishV0 } from "../rhizohChessPredictionCompareV0.js";

vi.mock("../chessStockfishEngineV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getChessStockfishEngineStatusV0: vi.fn(() => "stockfish_wasm"),
    analyzeChessPositionMultiPvV0: vi.fn(async () => ({
      lines: [
        { bestMove: "e2e4", depth: 12, pv: "e2e4 e7e5" },
        { bestMove: "d2d4", depth: 11, pv: "d2d4 d7d5" }
      ]
    }))
  };
});

describe("rhizohChessPredictionCompareV0", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetRhizohChessLearningReportForTestV0();
    __resetChessSchedulerUnifyForTestV0();
    window.__rhizoh = {};
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetChessSchedulerUnifyForTestV0();
  });

  it("resolvePredictionAccuracyFromRankV0 scores rank 1 as 100%", () => {
    expect(resolvePredictionAccuracyFromRankV0(1)).toBe(1);
    expect(resolvePredictionAccuracyFromRankV0(4)).toBe(0.25);
    expect(resolvePredictionAccuracyFromRankV0(null)).toBe(0);
  });

  it("compareRhizohMoveWithStockfishV0 records agreement when move matches engine", async () => {
    const row = await compareRhizohMoveWithStockfishV0(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "e2e4",
      { slotId: 0, matchId: "cluster_0_x", san: "e4", testFast: true }
    );
    expect(row?.stockfishAgreement).toBe(true);
    expect(row?.predictionAccuracy).toBe(1);
  });
});
