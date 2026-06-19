import { beforeEach, describe, expect, it } from "vitest";
import { CHESS_CLUSTER_GAME_END_EVENT_V0, CHESS_CLUSTER_MOVE_EVENT_V0 } from "../chessGameClusterV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "../chessClusterLearningTraceV0.js";
import {
  __resetRhizohChessLearningReportForTestV0,
  buildRhizohChessLearningReportV0,
  ensureRhizohChessLearningReportV0
} from "../rhizohChessLearningReportV0.js";
import { __resetChessLearningMonitorForTestV0 } from "../chessLearningMonitorV0.js";

describe("rhizohChessLearningReportV0", () => {
  beforeEach(() => {
    __resetRhizohChessLearningReportForTestV0();
    __resetChessLearningMonitorForTestV0();
    window.__rhizoh = {};
  });

  it("installs window.__rhizoh.learningReport", () => {
    ensureRhizohChessLearningReportV0();
    expect(typeof window.__rhizoh.learningReport).toBe("function");
  });

  it("aggregates moves, games, and policy diffs from cluster events", () => {
    ensureRhizohChessLearningReportV0();

    window.dispatchEvent(
      new CustomEvent(CHESS_CLUSTER_MOVE_EVENT_V0, {
        detail: {
          move: {
            matchId: "cluster_0_abc",
            slotId: 0,
            san: "e4",
            fenBefore: "startpos_w",
            fenAfter: "after_e4",
            atMs: Date.now()
          }
        }
      })
    );
    window.dispatchEvent(
      new CustomEvent(CHESS_CLUSTER_MOVE_EVENT_V0, {
        detail: {
          move: {
            matchId: "cluster_0_abc",
            slotId: 0,
            san: "Nf3",
            fenBefore: "after_e4",
            fenAfter: "after_nf3",
            atMs: Date.now()
          }
        }
      })
    );
    window.dispatchEvent(
      new CustomEvent(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, {
        detail: { drifted: true, matchedRank: 4 }
      })
    );
    window.dispatchEvent(
      new CustomEvent(CHESS_CLUSTER_GAME_END_EVENT_V0, {
        detail: { slot: { matchId: "cluster_0_abc", slotId: 0 } }
      })
    );

    const report = window.__rhizoh.learningReport();
    expect(report.gamesObserved).toBeGreaterThanOrEqual(1);
    expect(report.gamesCompleted).toBeGreaterThanOrEqual(1);
    expect(report.totalMovesSeen).toBeGreaterThanOrEqual(0);
    expect(report.uniquePositions).toBeGreaterThanOrEqual(2);
    expect(report.policyChanges).toBeGreaterThanOrEqual(0);
    expect(report.preferredOpenings.length).toBeGreaterThan(0);
    expect(report.openingCoverage).toBeTruthy();
    expect(report).toHaveProperty("predictionAccuracy");
    expect(report).toHaveProperty("stockfishAgreement");
    expect(report).toHaveProperty("topLearnedLines");
    expect(report.schema).toContain("chess_learning_report");
  });

  it("computes stockfishAgreement from policy diff rank", () => {
    ensureRhizohChessLearningReportV0();
    window.dispatchEvent(
      new CustomEvent(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, {
        detail: { drifted: false, matchedRank: 1, winningLine: { depth: 12, pv: "e2e4" } }
      })
    );
    window.dispatchEvent(
      new CustomEvent(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, {
        detail: { drifted: true, matchedRank: 4, winningLine: { depth: 10, pv: "d2d4" } }
      })
    );
    const report = window.__rhizoh.learningReport();
    expect(report.stockfishAgreement).toBe(0.5);
    expect(report.predictionAccuracy).toBeGreaterThan(0);
    expect(report.averageDepthSeen).toBe(11);
  });

  it("buildRhizohChessLearningReportV0 returns frozen snapshot", () => {
    const report = buildRhizohChessLearningReportV0();
    expect(() => {
      report.gamesObserved = 999;
    }).toThrow();
  });
});
