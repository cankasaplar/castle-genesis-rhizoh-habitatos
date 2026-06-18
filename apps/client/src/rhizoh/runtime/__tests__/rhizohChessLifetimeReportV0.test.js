import { beforeEach, describe, expect, it } from "vitest";
import { CHESS_CLUSTER_MOVE_EVENT_V0 } from "../chessGameClusterV0.js";
import { __resetRhizohChessLearningReportForTestV0 } from "../rhizohChessLearningReportV0.js";
import { __resetChessLearningMonitorForTestV0 } from "../chessLearningMonitorV0.js";
import { __resetChessLifetimeStatsForTestV0 } from "../rhizohChessLifetimeStatsV0.js";
import {
  __resetRhizohChessLifetimeReportForTestV0,
  buildRhizohChessLifetimeReportV0,
  ensureRhizohChessLifetimeReportV0,
  listRhizohChessNamespaceKeysV0
} from "../rhizohChessLifetimeReportV0.js";

describe("rhizohChessLifetimeReportV0", () => {
  beforeEach(() => {
    __resetRhizohChessLifetimeReportForTestV0();
    __resetRhizohChessLearningReportForTestV0();
    __resetChessLifetimeStatsForTestV0();
    __resetChessLearningMonitorForTestV0();
    window.__rhizoh = { chessLearningGraph: { nodeCount: 3 } };
    localStorage.clear();
  });

  it("installs window.__rhizoh.chessLifetimeReport", () => {
    ensureRhizohChessLifetimeReportV0();
    expect(typeof window.__rhizoh.chessLifetimeReport).toBe("function");
  });

  it("exposes sessionCluster separately from lifetime counters", () => {
    ensureRhizohChessLifetimeReportV0();
    window.dispatchEvent(
      new CustomEvent(CHESS_CLUSTER_MOVE_EVENT_V0, {
        detail: {
          move: {
            matchId: "cluster_0_x",
            san: "e4",
            fenBefore: "start",
            fenAfter: "after_e4",
            atMs: Date.now()
          }
        }
      })
    );

    const report = window.__rhizoh.chessLifetimeReport();
    expect(report.sessionCluster.gamesObserved).toBeGreaterThanOrEqual(1);
    expect(report.lifetimeMovesSeen).toBeGreaterThanOrEqual(1);
    expect(report).toHaveProperty("openingHistogram");
    expect(report).toHaveProperty("rhizohChessKeys");
    expect(report.graphs.note).toContain("causalMap");
    expect(report.schema).toContain("chess_lifetime_report");
  });

  it("listRhizohChessNamespaceKeysV0 filters chess-related keys", () => {
    window.__rhizoh.chessManager = {};
    window.__rhizoh.codexState = {};
    const keys = listRhizohChessNamespaceKeysV0();
    expect(keys).toContain("chessManager");
    expect(keys).not.toContain("codexState");
  });

  it("buildRhizohChessLifetimeReportV0 returns frozen snapshot", () => {
    const report = buildRhizohChessLifetimeReportV0();
    expect(() => {
      report.lifetimeMovesSeen = 999;
    }).toThrow();
  });
});
