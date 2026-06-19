import { describe, expect, it } from "vitest";
import {
  CHESS_HISTORICAL_MIND_V0,
  getChessHistoricalMindV0,
  listChessHistoricalMindsV0,
  resolveChessMindBlendV0
} from "../chessHistoricalMindV0.js";

describe("chessHistoricalMindV0", () => {
  it("lists historical minds", () => {
    const minds = listChessHistoricalMindsV0();
    expect(minds.length).toBeGreaterThanOrEqual(5);
    expect(minds.some((m) => m.id === CHESS_HISTORICAL_MIND_V0.KASPAROV)).toBe(true);
  });

  it("kasparov is more aggressive than carlsen", () => {
    const kasparov = getChessHistoricalMindV0(CHESS_HISTORICAL_MIND_V0.KASPAROV);
    const carlsen = getChessHistoricalMindV0(CHESS_HISTORICAL_MIND_V0.CARLSEN);
    expect(kasparov.aggressionBias).toBeGreaterThan(carlsen.aggressionBias);
    expect(kasparov.contemptOffset).toBeGreaterThan(carlsen.contemptOffset);
  });

  it("blends mind with learning weights", () => {
    const blend = resolveChessMindBlendV0({
      mindId: CHESS_HISTORICAL_MIND_V0.ANAND,
      learningWeights: Object.freeze({
        aggressionBias: 0.1,
        winForcingWeight: 1.15,
        riskPenaltyWeight: 0.45
      })
    });
    expect(blend.mindId).toBe(CHESS_HISTORICAL_MIND_V0.ANAND);
    expect(blend.winForcingMult).toBeGreaterThan(1);
  });
});
