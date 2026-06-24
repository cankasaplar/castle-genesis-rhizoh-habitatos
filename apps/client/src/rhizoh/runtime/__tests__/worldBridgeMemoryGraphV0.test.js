import { describe, expect, it, beforeEach } from "vitest";
import {
  ingestCalendarEventV0,
  normalizeCalendarEventV0,
  resetCalendarEventAdapterForTestV0
} from "../calendarEventAdapterV0.js";
import {
  ingestMediaTimelineEventV0,
  normalizeMediaTimelineEventV0,
  resetMediaEventAdapterForTestV0
} from "../mediaEventAdapterV0.js";
import { resetCalendarShadowTimelineForTestV0 } from "../calendarShadowTimelineV0.js";
import { resetMediaShadowTimelineForTestV0 } from "../mediaShadowTimelineV0.js";
import { resetUserActivityShadowTimelineForTestV0 } from "../userActivityShadowTimelineV0.js";
import {
  ingestUserActivityEventV0,
  normalizeUserActivityEventV0,
  resetUserActivityAdapterForTestV0
} from "../userActivityEventAdapterV0.js";
import {
  getWorldBridgeMemoryGraphSnapshotV0,
  resetWorldBridgeMemoryGraphForTestV0
} from "../worldBridgeMemoryGraphV0.js";

describe("worldBridgeMemoryGraphV0", () => {
  beforeEach(() => {
    resetCalendarEventAdapterForTestV0();
    resetMediaEventAdapterForTestV0();
    resetCalendarShadowTimelineForTestV0();
    resetMediaShadowTimelineForTestV0();
    resetUserActivityShadowTimelineForTestV0();
    resetUserActivityAdapterForTestV0();
    resetWorldBridgeMemoryGraphForTestV0();
  });

  it("records calendar shadow ingress into memory graph", () => {
    ingestCalendarEventV0(normalizeCalendarEventV0({ title: "Focus block" }), { dispatchEvent: false });
    const snap = getWorldBridgeMemoryGraphSnapshotV0();
    expect(snap.nodeCount).toBe(1);
    expect(snap.bySource.calendar).toBe(1);
    expect(snap.recent[0].interpretationOnly).toBe(true);
  });

  it("records media shadow ingress into memory graph", () => {
    ingestMediaTimelineEventV0(normalizeMediaTimelineEventV0({ title: "VOD" }), { dispatchEvent: false });
    const snap = getWorldBridgeMemoryGraphSnapshotV0();
    expect(snap.nodeCount).toBe(1);
    expect(snap.bySource.media).toBe(1);
  });

  it("records user activity shadow ingress into memory graph", () => {
    ingestUserActivityEventV0(
      normalizeUserActivityEventV0({ activityType: "focus", surface: "world_map" }),
      { dispatchEvent: false }
    );
    const snap = getWorldBridgeMemoryGraphSnapshotV0();
    expect(snap.nodeCount).toBe(1);
    expect(snap.bySource.user_activity).toBe(1);
    expect(snap.recent[0].source).toBe("user_activity");
  });
});
