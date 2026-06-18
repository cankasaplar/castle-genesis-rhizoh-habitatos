import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetChessMemoryStoreForTestV0, upsertChessMemoryGameV0 } from "../chessMemoryStoreV0.js";
import { __resetChessUnifiedMemoryGraphForTestV0 } from "../chessUnifiedMemoryGraphV0.js";
import { resetChessLearningWeightsForTestV0, readChessLearningWeightsV0 } from "../chessLearningWeightsV0.js";
import {
  aggregateBatchRegretV0,
  buildCorpusRegretProxyV0
} from "../chessBatchRegretProxyV0.js";
import {
  __resetChessOfflineBatchTrainerForTestV0,
  ensureChessOfflineBatchTrainerV0,
  runChessOfflineBatchTrainerV0
} from "../chessOfflineBatchTrainerV0.js";
import { __resetRhizohChessLearningCheckpointForTestV0 } from "../rhizohChessLearningCheckpointV0.js";

describe("chessOfflineBatchTrainerV0", () => {
  beforeEach(() => {
    __resetChessOfflineBatchTrainerForTestV0();
    __resetChessUnifiedMemoryGraphForTestV0();
    __resetChessMemoryStoreForTestV0();
    __resetRhizohChessLearningCheckpointForTestV0();
    resetChessLearningWeightsForTestV0();
    window.__rhizoh = {};
    localStorage.clear();
    vi.stubGlobal("window", window);
  });

  it("buildCorpusRegretProxy detects tactical decisive games", () => {
    const proxy = buildCorpusRegretProxyV0({
      id: "g1",
      result: "1-0",
      moves: ["e4", "e5", "Nf3"],
      patterns: { tactical: { tacticalDensity: 0.35, checks: 2, captures: 1 } }
    });
    expect(proxy.forcedWinIgnored).toBe(true);
  });

  it("aggregateBatchRegret rolls up corpus signals", () => {
    const agg = aggregateBatchRegretV0([
      buildCorpusRegretProxyV0({
        id: "a",
        result: "1-0",
        moves: ["e4"],
        patterns: { tactical: { tacticalDensity: 0.4, checks: 2, captures: 1 } }
      }),
      buildCorpusRegretProxyV0({
        id: "b",
        result: "1/2-1/2",
        moves: new Array(12).fill("Nf3"),
        patterns: { tactical: { tacticalDensity: 0.05, checks: 0, captures: 0 } }
      })
    ]);
    expect(agg.gamesSampled).toBe(2);
    expect(agg.forcedWinSignals).toBeGreaterThanOrEqual(1);
  });

  it("runChessOfflineBatchTrainer updates weights and graph weight_update edge", async () => {
    upsertChessMemoryGameV0({
      id: "train_1",
      qualityTier: "gm_classical",
      result: "1-0",
      moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
      patterns: {
        openingBucket: "Italian",
        tactical: { tacticalDensity: 0.32, checks: 1, captures: 2 }
      }
    });
    const before = readChessLearningWeightsV0();
    const out = await runChessOfflineBatchTrainerV0({ force: true });
    expect(out.ok).toBe(true);
    expect(out.gamesTrained).toBeGreaterThanOrEqual(1);
    const after = readChessLearningWeightsV0();
    expect(after.matchesLearned).toBeGreaterThan(before.matchesLearned);
    expect(out.accuracy.modelEstimate).toBeGreaterThan(0.25);
  });

  it("installs window batch trainer APIs", () => {
    ensureChessOfflineBatchTrainerV0();
    expect(typeof window.__rhizoh.runChessOfflineBatchTrainer).toBe("function");
    expect(typeof window.__rhizoh.chessOfflineBatchTrainer).toBe("function");
  });
});
