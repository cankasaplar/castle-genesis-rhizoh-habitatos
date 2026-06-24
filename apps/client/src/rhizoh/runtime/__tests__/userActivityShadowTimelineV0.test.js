import { describe, expect, it, beforeEach } from "vitest";
import {
  USER_ACTIVITY_TYPE_V0,
  normalizeUserActivityEventV0
} from "../userActivityEventAdapterV0.js";
import {
  buildUserActivityShadowTimelineViewV0,
  deriveUserActivityShadowOutcomeV0,
  recordUserActivityShadowTimelineEventV0,
  resetUserActivityShadowTimelineForTestV0,
  USER_ACTIVITY_SHADOW_BRANCH_ID_V0
} from "../userActivityShadowTimelineV0.js";
import {
  getWorldBridgeMemoryGraphSnapshotV0,
  resetWorldBridgeMemoryGraphForTestV0
} from "../worldBridgeMemoryGraphV0.js";

describe("userActivityShadowTimelineV0", () => {
  beforeEach(() => {
    resetUserActivityShadowTimelineForTestV0();
    resetWorldBridgeMemoryGraphForTestV0();
  });

  it("maps focus activity to continuity branch", () => {
    const normalized = normalizeUserActivityEventV0({
      activityType: USER_ACTIVITY_TYPE_V0.FOCUS,
      surface: "world_map"
    });
    const outcome = deriveUserActivityShadowOutcomeV0(normalized);
    expect(outcome.branchId).toBe(USER_ACTIVITY_SHADOW_BRANCH_ID_V0.FOCUS_CONTINUITY);
    expect(outcome.behaviorScore01).toBeGreaterThan(0.5);
  });

  it("records shadow and memory graph node", () => {
    const normalized = normalizeUserActivityEventV0({
      activityType: USER_ACTIVITY_TYPE_V0.FOCUS,
      surface: "world_map"
    });
    recordUserActivityShadowTimelineEventV0(normalized);
    const view = buildUserActivityShadowTimelineViewV0();
    expect(view.eventCount).toBe(1);
    const memory = getWorldBridgeMemoryGraphSnapshotV0();
    expect(memory.bySource.user_activity).toBe(1);
  });
});
