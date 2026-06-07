import { describe, expect, it } from "vitest";
import { ALIGNMENT_DRIFT_RISK_V0 } from "../perceptionAlignmentSnapshotV0.js";
import {
  evaluateProjectionFrameCoherenceV0,
  PROJECTION_SURFACE_V0,
  PROJECTION_SYNC_HARD_RULES_V0
} from "../projectionSyncContractV0.js";

describe("projectionSyncContractV0", () => {
  it("reports coherent when all surfaces share tick", () => {
    const snap = evaluateProjectionFrameCoherenceV0({
      tickMs: 10_000,
      anchorFrameMs: 10_000,
      cameraFrameMs: 10_000,
      socialFrameMs: 10_000,
      speciesId: "fox_v1"
    });
    expect(snap.coherent).toBe(true);
    expect(snap.flickerRisk).toBe(ALIGNMENT_DRIFT_RISK_V0.LOW);
    expect(snap.maxSpreadMs).toBe(0);
    expect(snap.observabilityOnly).toBe(true);
  });

  it("flags high flicker risk on large frame spread", () => {
    const snap = evaluateProjectionFrameCoherenceV0({
      tickMs: 10_000,
      anchorFrameMs: 10_000,
      cameraFrameMs: 10_400,
      socialFrameMs: 10_000
    });
    expect(snap.coherent).toBe(false);
    expect(snap.flickerRisk).toBe(ALIGNMENT_DRIFT_RISK_V0.HIGH);
    expect(snap.maxSpreadMs).toBe(400);
  });

  it("maps surfaces to anchor camera social", () => {
    const snap = evaluateProjectionFrameCoherenceV0({ tickMs: 5000 });
    expect(snap.surfaces[PROJECTION_SURFACE_V0.ANCHOR]).toBe(5000);
    expect(snap.surfaces[PROJECTION_SURFACE_V0.CAMERA]).toBe(5000);
    expect(snap.surfaces[PROJECTION_SURFACE_V0.SOCIAL]).toBe(5000);
  });

  it("exports projection hard rules separate from cap wheel", () => {
    expect(PROJECTION_SYNC_HARD_RULES_V0.never).toContain("anchor_to_wheel_feedback");
    expect(PROJECTION_SYNC_HARD_RULES_V0.always).toContain("cap_wheel_interpreter_only");
  });
});
