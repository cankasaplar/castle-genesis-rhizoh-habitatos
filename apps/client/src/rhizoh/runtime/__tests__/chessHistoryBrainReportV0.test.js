import { beforeEach, describe, expect, it } from "vitest";
import { __resetChessMemoryStoreForTestV0 } from "../chessMemoryStoreV0.js";
import { __resetRhizohChessLearningReportForTestV0 } from "../rhizohChessLearningReportV0.js";
import { __resetChessLearningMonitorForTestV0 } from "../chessLearningMonitorV0.js";
import {
  __resetChessHistoryBrainForTestV0,
  buildChessHistoryBrainReportV0,
  ensureChessHistoryBrainV0
} from "../chessHistoryBrainReportV0.js";

describe("chessHistoryBrainReportV0", () => {
  beforeEach(() => {
    __resetChessHistoryBrainForTestV0();
    __resetChessMemoryStoreForTestV0();
    __resetRhizohChessLearningReportForTestV0();
    __resetChessLearningMonitorForTestV0();
    window.__rhizoh = {};
    localStorage.clear();
  });

  it("installs window.__rhizoh.chessHistoryBrain", () => {
    ensureChessHistoryBrainV0();
    expect(typeof window.__rhizoh.chessHistoryBrain).toBe("function");
    expect(typeof window.__rhizoh.importChessPgn).toBe("function");
  });

  it("buildChessHistoryBrainReportV0 loads seed corpus and exposes quality tiers", () => {
    const report = buildChessHistoryBrainReportV0();
    expect(report.corpusGamesLoaded).toBeGreaterThanOrEqual(2);
    expect(report.qualityTierHistogram.gm_classical).toBeGreaterThanOrEqual(2);
    expect(report.playerStylesKnown.length).toBeGreaterThanOrEqual(3);
    expect(report.intelligenceEvolution.weightMatrix).toBeTruthy();
    expect(report.batchTrainer.status).toBe("active_pr_c");
    expect(report.unifiedMemoryGraph).toHaveProperty("stats");
  });
});
