import { describe, expect, it } from "vitest";
import {
  RHIZOH_STUDIO_VISIBILITY_SCHEMA_V0,
  STUDIO_VISIBILITY_PANEL_IDS_V0,
  STUDIO_EIGHT_CAMERA_IDS_V0,
  buildRhizohStudioVisibilitySnapshotV0,
  summarizeStudioLearningCameraV0
} from "../rhizohStudioVisibilitySnapshotV0.js";

describe("summarizeStudioLearningCameraV0", () => {
  it("summarizes go camera pipeline", () => {
    const summary = summarizeStudioLearningCameraV0(
      {
        pipeline: { movesSeen: 2, batchPending: 1, batchesFlushed: 0, gateAccepted: 1 },
        arena: { moveCount: 2 },
        spacetime: { causalSpaceId: "go.causal.space" }
      },
      "go"
    );
    expect(summary.armed).toBe(true);
    expect(summary.causalSpaceId).toBe("go.causal.space");
  });
});

describe("buildRhizohStudioVisibilitySnapshotV0", () => {
  it("returns frozen studio visibility with five panel ids", () => {
    const snap = buildRhizohStudioVisibilitySnapshotV0();
    expect(snap.schema).toBe(RHIZOH_STUDIO_VISIBILITY_SCHEMA_V0);
    expect(snap.interpretationOnly).toBe(true);
    expect(snap.panels).toEqual(STUDIO_VISIBILITY_PANEL_IDS_V0);
    expect(snap.lifeOs.schema).toContain("life_os");
    expect(snap.learningCameras.chess.discipline).toBe("chess");
    expect(snap.learningCameras.go.discipline).toBe("go");
    expect(snap.learningCameras.checkers.discipline).toBe("checkers");
    expect(Object.keys(snap.eightCameras).sort()).toEqual([...STUDIO_EIGHT_CAMERA_IDS_V0].sort());
    expect(snap.eightCameras.chess_arena).toHaveProperty("clusterRunning");
    expect(["ACHIEVED", "DORMANT"]).toContain(snap.lifeOsStatus);
  });
});
