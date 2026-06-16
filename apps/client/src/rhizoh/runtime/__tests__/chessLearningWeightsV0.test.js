import { describe, expect, it, beforeEach } from "vitest";
import {
  applyChessLearningCorrectionV0,
  readChessLearningWeightsV0,
  resetChessLearningWeightsForTestV0,
  resolveLearningWeightDeltasV0
} from "../chessLearningWeightsV0.js";
import { CHESS_REGRET_FLAG_V0 } from "../chessRegretAnalysisV0.js";

describe("chessLearningWeightsV0", () => {
  beforeEach(() => {
    resetChessLearningWeightsForTestV0();
  });

  it("starts with learning mode on", () => {
    const w = readChessLearningWeightsV0();
    expect(w.learningMode).toBe(true);
    expect(w.winForcingWeight).toBe(1);
  });

  it("boosts aggression when forced win ignored", () => {
    const regret = Object.freeze({
      forcedWinIgnored: true,
      lossAvoidanceBias: true,
      regretCount: 1,
      anomalyFlags: Object.freeze([CHESS_REGRET_FLAG_V0.BUT_NOT_TAKEN])
    });
    const after = applyChessLearningCorrectionV0(regret);
    expect(after.winForcingWeight).toBeGreaterThan(1);
    expect(after.aggressionBias).toBeGreaterThan(0);
    expect(after.riskPenaltyWeight).toBeLessThan(0.55);
    expect(after.forcedWinCorrections).toBe(1);
  });

  it("maps weights to engine deltas", () => {
    const deltas = resolveLearningWeightDeltasV0(
      Object.freeze({
        learningMode: true,
        aggressionBias: 0.2,
        winForcingWeight: 1.2,
        riskPenaltyWeight: 0.4,
        matchesLearned: 3,
        forcedWinCorrections: 1
      })
    );
    expect(deltas.contemptDelta).toBeGreaterThan(0);
    expect(deltas.winForcingActive).toBe(true);
  });
});
