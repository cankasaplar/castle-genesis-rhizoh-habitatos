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
import {
  ingestUserActivityEventV0,
  normalizeUserActivityEventV0,
  resetUserActivityAdapterForTestV0
} from "../userActivityEventAdapterV0.js";
import {
  getCrossSpaceFusionSnapshotV0,
  resetCrossSpaceCausalFusionForTestV0
} from "../crossSpaceCausalFusionV0.js";

describe("worldBridgeFusionWireV0", () => {
  beforeEach(() => {
    resetCalendarEventAdapterForTestV0();
    resetMediaEventAdapterForTestV0();
    resetUserActivityAdapterForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
  });

  it("auto-fuses calendar ingest without manual fuseCrossSpaceEpistemic", () => {
    const result = ingestCalendarEventV0(
      normalizeCalendarEventV0({ title: "Standup" }),
      { dispatchEvent: false }
    );
    expect(result.fusion?.epistemicUpdate?.laneContributions?.calendar?.present).toBe(true);
    const snap = getCrossSpaceFusionSnapshotV0();
    expect(snap.lastFusion?.epistemicUpdate?.laneContributions?.calendar?.weight).toBe(0.1);
  });

  it("auto-fuses media ingest", () => {
    const result = ingestMediaTimelineEventV0(
      normalizeMediaTimelineEventV0({ title: "VOD chapter" }),
      { dispatchEvent: false }
    );
    expect(result.fusion?.epistemicUpdate?.laneContributions?.media?.present).toBe(true);
  });

  it("auto-fuses user activity ingest", () => {
    const result = ingestUserActivityEventV0(
      normalizeUserActivityEventV0({ activityType: "focus", surface: "world_map" }),
      { dispatchEvent: false }
    );
    expect(result.fusion?.epistemicUpdate?.laneContributions?.userActivity?.present).toBe(true);
  });

  it("skips fuse when opts.fuse is false", () => {
    const result = ingestCalendarEventV0(normalizeCalendarEventV0({ title: "No fuse" }), {
      dispatchEvent: false,
      fuse: false
    });
    expect(result.fusion).toBeNull();
  });
});
