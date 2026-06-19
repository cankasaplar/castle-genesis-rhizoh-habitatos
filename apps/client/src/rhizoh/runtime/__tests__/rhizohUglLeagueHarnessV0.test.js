import { beforeEach, describe, expect, it } from "vitest";
import { __resetChessEngineHealthForTestV0, buildChessEngineHealthReportV0, recordChessEngineTimeoutV0 } from "../rhizohChessEngineHealthV0.js";
import {
  __resetUglLeagueHarnessForTestV0,
  buildUglLeagueHarnessReportV0,
  getActiveUglLeagueTierV0,
  resolveUglLeagueTierIndexV0
} from "../rhizohUglLeagueHarnessV0.js";
import {
  __resetUglTrainingRecordsForTestV0,
  appendUglTrainingRecordV0,
  readUglTrainingRecordsV0,
  trainingRecordFromPolicyDiffV0
} from "../rhizohUglTrainingRecordV0.js";
import { __resetRhizohUglBootForTestV0, ensureRhizohUglV0 } from "../rhizohUglBootV0.js";

describe("rhizohUglLeagueHarnessV0", () => {
  beforeEach(() => {
    __resetUglTrainingRecordsForTestV0();
    __resetUglLeagueHarnessForTestV0();
    __resetChessEngineHealthForTestV0();
    __resetRhizohUglBootForTestV0();
    window.__rhizoh = {};
    localStorage.clear();
  });

  it("appends training record with required fields", () => {
    const row = appendUglTrainingRecordV0({
      position: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      expectedMove: "e7e5",
      playedMove: "c7c5",
      evalDelta: 42,
      leagueTier: "ARENA",
      uglReward: 0.4,
      matchId: "cluster_0_x"
    });
    expect(row.schema).toContain("training_record");
    expect(row.expectedMove).toBe("e7e5");
    expect(row.playedMove).toBe("c7c5");
    expect(readUglTrainingRecordsV0(4)).toHaveLength(1);
  });

  it("creates training record from policy_diff", () => {
    trainingRecordFromPolicyDiffV0(
      {
        matchId: "cluster_1_a",
        slotId: 1,
        played: "e2e4",
        engineBest: "d2d4",
        winningLine: { bestMove: "d2d4", cp: 30 }
      },
      { fenBefore: "startpos", leagueTier: "STRONG", uglReward: 0.5 }
    );
    const records = readUglTrainingRecordsV0(4);
    expect(records[0].source).toBe("policy_diff");
    expect(records[0].leagueTier).toBe("STRONG");
  });

  it("promotes league tier from prediction accuracy", () => {
    expect(getActiveUglLeagueTierV0()).toBe("ARENA");
    resolveUglLeagueTierIndexV0(0.7);
    expect(getActiveUglLeagueTierV0()).toBe("STRONG");
  });

  it("league harness report includes tiers and training snapshot", () => {
    appendUglTrainingRecordV0({
      position: "fen",
      expectedMove: "a",
      playedMove: "b",
      leagueTier: "ARENA"
    });
    const report = buildUglLeagueHarnessReportV0();
    expect(report.tiers.length).toBe(5);
    expect(report.training.total).toBeGreaterThanOrEqual(1);
    expect(report.sampleFields).toContain("outcome");
  });

  it("records engine timeouts for health dashboard", () => {
    recordChessEngineTimeoutV0({ movetimeMs: 2500, depth: 14, timeoutMs: 5200 });
    const health = buildChessEngineHealthReportV0();
    expect(health.timeoutCount).toBe(1);
    expect(health.recentTimeouts[0].movetimeMs).toBe(2500);
  });

  it("ugl boot exposes league and training DevTools", () => {
    ensureRhizohUglV0();
    expect(typeof window.__rhizoh.uglLeagueHarness).toBe("function");
    expect(typeof window.__rhizoh.uglTrainingRecords).toBe("function");
    expect(typeof window.__rhizoh.uglLearnBuffer).toBe("function");
    const report = window.__rhizoh.uglReport();
    expect(report.leagueHarness).toBeTruthy();
    expect(report.trainingRecords).toBeTruthy();
    expect(report.learnBuffer).toBeTruthy();
  });
});
