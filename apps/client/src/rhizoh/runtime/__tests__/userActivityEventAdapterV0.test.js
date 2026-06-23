import { describe, expect, it, beforeEach } from "vitest";
import {
  USER_ACTIVITY_TYPE_V0,
  ingestUserActivityEventV0,
  normalizeUserActivityEventV0,
  resetUserActivityAdapterForTestV0
} from "../userActivityEventAdapterV0.js";
import {
  fuseCrossSpaceEpistemicV0,
  getCrossSpaceFusionLaneAuditV0,
  resetCrossSpaceCausalFusionForTestV0
} from "../crossSpaceCausalFusionV0.js";
import {
  bindRhizohRuntimeSurfaceV0,
  RUNTIME_SURFACE_API_KEYS_V0
} from "../rhizohRuntimeSurfaceBinderV0.js";

describe("userActivityEventAdapterV0", () => {
  beforeEach(() => {
    resetUserActivityAdapterForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
  });

  it("normalizes focus activity with fox signals", () => {
    const normalized = normalizeUserActivityEventV0({
      activityType: USER_ACTIVITY_TYPE_V0.FOCUS,
      surface: "world_map"
    });
    expect(normalized.causalSpaceId).toBe("user.activity.stream.space");
    expect(normalized.foxSignals.continuitySignal01).toBeGreaterThan(0.6);
    expect(normalized.interpretationOnly).toBe(true);
  });

  it("ingests into user activity lane and fusion", () => {
    ingestUserActivityEventV0(
      normalizeUserActivityEventV0({ activityType: USER_ACTIVITY_TYPE_V0.NAVIGATE }),
      { dispatchEvent: false }
    );
    expect(getCrossSpaceFusionLaneAuditV0().userActivity.present).toBe(true);
    const fusion = fuseCrossSpaceEpistemicV0();
    expect(fusion.epistemicUpdate.laneContributions.userActivity.present).toBe(true);
    expect(fusion.epistemicUpdate.laneContributions.userActivity.weight).toBe(0.07);
  });
});

describe("runtime surface ingestUserActivity", () => {
  beforeEach(() => {
    window.__rhizoh = {};
    resetUserActivityAdapterForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
  });

  it("binds ingestUserActivity", () => {
    bindRhizohRuntimeSurfaceV0(window.__rhizoh);
    expect(RUNTIME_SURFACE_API_KEYS_V0).toContain("ingestUserActivity");
    const result = window.__rhizoh.ingestUserActivity({
      activityType: USER_ACTIVITY_TYPE_V0.INTERACT,
      target: "spiral_pin"
    });
    expect(result.normalized.payload.target).toBe("spiral_pin");
  });
});
