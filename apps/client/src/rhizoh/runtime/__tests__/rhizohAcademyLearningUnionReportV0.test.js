import { describe, expect, it } from "vitest";
import {
  ACADEMY_DISCIPLINE_IDS_V0,
  RHIZOH_ACADEMY_LEARNING_UNION_SCHEMA_V0,
  buildRhizohAcademyLearningUnionReportV0,
  resolveAcademyDominantDisciplineV0,
  resolveAcademyUnionLabelV0,
  summarizeAcademyDisciplineV0
} from "../rhizohAcademyLearningUnionReportV0.js";

describe("summarizeAcademyDisciplineV0", () => {
  it("summarizes go report fields", () => {
    const summary = summarizeAcademyDisciplineV0("go", {
      movesSeen: 3,
      arenaMoveCount: 2,
      batchesFlushed: 1,
      batchPending: 4,
      gateAccepted: 2,
      gateRejected: 1,
      spacetimeSample: {
        causalSpaceId: "go.causal.space",
        worldAnchor: { channelId: "rhizoh_go_learning" }
      }
    });
    expect(summary.armed).toBe(true);
    expect(summary.movesSeen).toBe(3);
    expect(summary.causalSpaceId).toBe("go.causal.space");
    expect(summary.channelId).toBe("rhizoh_go_learning");
  });

  it("summarizes chess report via learningV2 batch path", () => {
    const summary = summarizeAcademyDisciplineV0("chess", {
      totalMovesSeen: 12,
      clusterMovesSeen: 10,
      batchFlushesSeen: 2,
      learningV2: {
        agreementGate: { accepted: 5, rejected: 1 },
        batchLearning: { pending: 3 }
      }
    });
    expect(summary.movesSeen).toBe(12);
    expect(summary.batchesFlushed).toBe(2);
    expect(summary.gateAccepted).toBe(5);
    expect(summary.batchPending).toBe(3);
  });

  it("returns dormant summary for missing report", () => {
    const summary = summarizeAcademyDisciplineV0("checkers", null);
    expect(summary.armed).toBe(false);
    expect(summary.movesSeen).toBe(0);
  });
});

describe("resolveAcademyUnionLabelV0", () => {
  it("labels triad when all three armed", () => {
    expect(resolveAcademyUnionLabelV0(["chess", "go", "checkers"])).toBe("triad_active");
  });

  it("labels solo discipline", () => {
    expect(resolveAcademyUnionLabelV0(["go"])).toBe("go_solo");
  });

  it("labels dormant when empty", () => {
    expect(resolveAcademyUnionLabelV0([])).toBe("dormant");
  });
});

describe("resolveAcademyDominantDisciplineV0", () => {
  it("picks highest move count", () => {
    const dominant = resolveAcademyDominantDisciplineV0({
      chess: { movesSeen: 2 },
      go: { movesSeen: 9 },
      checkers: { movesSeen: 4 }
    });
    expect(dominant).toBe("go");
  });
});

describe("buildRhizohAcademyLearningUnionReportV0", () => {
  it("returns frozen union snapshot with three disciplines", () => {
    const report = buildRhizohAcademyLearningUnionReportV0();
    expect(report.schema).toBe(RHIZOH_ACADEMY_LEARNING_UNION_SCHEMA_V0);
    expect(report.interpretationOnly).toBe(true);
    expect(report.nonExecutive).toBe(true);
    expect(Object.keys(report.disciplines).sort()).toEqual([...ACADEMY_DISCIPLINE_IDS_V0].sort());
    expect(report.digests.chess.schema).toContain("chess_learning_report");
    expect(report.digests.go.schema).toContain("go_learning_report");
    expect(report.digests.checkers.schema).toContain("checkers_learning_report");
    expect(["dormant", "chess_solo", "go_solo", "checkers_solo", "multi_active", "triad_active"]).toContain(
      report.unionLabel
    );
  });
});
