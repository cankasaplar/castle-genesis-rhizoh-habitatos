import { beforeEach, describe, expect, it } from "vitest";
import { CHESS_CLUSTER_MOVE_EVENT_V0 } from "../chessGameClusterV0.js";
import { __resetRhizohChessLearningReportForTestV0 } from "../rhizohChessLearningReportV0.js";
import { __resetChessLearningMonitorForTestV0 } from "../chessLearningMonitorV0.js";
import { __resetChessLifetimeStatsForTestV0 } from "../rhizohChessLifetimeStatsV0.js";
import { __resetChessMemoryStoreForTestV0 } from "../chessMemoryStoreV0.js";
import {
  __resetRhizohChessEvolutionCurveForTestV0,
  buildRhizohChessEvolutionCurveV0,
  ensureRhizohChessEvolutionCurveV0,
  recordChessEvolutionPointV0
} from "../rhizohChessEvolutionCurveV0.js";

describe("rhizohChessEvolutionCurveV0", () => {
  beforeEach(() => {
    __resetRhizohChessEvolutionCurveForTestV0();
    __resetRhizohChessLearningReportForTestV0();
    __resetChessLifetimeStatsForTestV0();
    __resetChessLearningMonitorForTestV0();
    __resetChessMemoryStoreForTestV0();
    window.__rhizoh = {};
    localStorage.clear();
  });

  it("installs window.__rhizoh.chessEvolutionCurve", () => {
    ensureRhizohChessEvolutionCurveV0();
    expect(typeof window.__rhizoh.chessEvolutionCurve).toBe("function");
  });

  it("unifies session, lifetime, and corpus in current snapshot", async () => {
    ensureRhizohChessEvolutionCurveV0();
    window.dispatchEvent(
      new CustomEvent(CHESS_CLUSTER_MOVE_EVENT_V0, {
        detail: {
          move: {
            matchId: "cluster_0_x",
            san: "e4",
            fenBefore: "a",
            fenAfter: "b",
            atMs: Date.now()
          }
        }
      })
    );
    recordChessEvolutionPointV0({ force: true, reason: "test" });
    const report = await buildRhizohChessEvolutionCurveV0();
    expect(report.continuity.layersUnified).toBe(true);
    expect(report.current).toHaveProperty("sessionMoves");
    expect(report.current).toHaveProperty("lifetimeMoves");
    expect(report.current).toHaveProperty("corpusGames");
    expect(report.current).toHaveProperty("weightFingerprint");
    expect(report.curvePoints).toBeGreaterThanOrEqual(1);
  });
});
