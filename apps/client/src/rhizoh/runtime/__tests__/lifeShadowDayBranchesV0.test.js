import { describe, expect, it, beforeEach } from "vitest";
import {
  ingestCalendarEventV0,
  normalizeCalendarEventV0,
  resetCalendarEventAdapterForTestV0,
  CALENDAR_EVENT_TYPE_V0
} from "../calendarEventAdapterV0.js";
import {
  ingestMediaTimelineEventV0,
  normalizeMediaTimelineEventV0,
  resetMediaEventAdapterForTestV0,
  MEDIA_EVENT_TYPE_V0
} from "../mediaEventAdapterV0.js";
import { resetCalendarShadowTimelineForTestV0 } from "../calendarShadowTimelineV0.js";
import { resetMediaShadowTimelineForTestV0 } from "../mediaShadowTimelineV0.js";
import { buildLifeShadowDayBranchComparisonV0 } from "../lifeShadowDayBranchesV0.js";

describe("lifeShadowDayBranchesV0", () => {
  beforeEach(() => {
    resetCalendarEventAdapterForTestV0();
    resetMediaEventAdapterForTestV0();
    resetCalendarShadowTimelineForTestV0();
    resetMediaShadowTimelineForTestV0();
  });

  it("returns empty comparison when no shadow events", () => {
    const view = buildLifeShadowDayBranchComparisonV0();
    expect(view.view).toBe("life_shadow_day_ab");
    expect(view.comparison.totalEvents).toBe(0);
    expect(view.interpretationOnly).toBe(true);
  });

  it("synthesizes Day A vs Day B from calendar and media shadows", () => {
    ingestCalendarEventV0(
      normalizeCalendarEventV0({ title: "Focus", eventType: CALENDAR_EVENT_TYPE_V0.SCHEDULED }),
      { dispatchEvent: false }
    );
    ingestCalendarEventV0(
      normalizeCalendarEventV0({ title: "Cancelled", eventType: CALENDAR_EVENT_TYPE_V0.CANCELLED }),
      { dispatchEvent: false }
    );
    ingestMediaTimelineEventV0(
      normalizeMediaTimelineEventV0({ title: "VOD", eventType: MEDIA_EVENT_TYPE_V0.PLAYHEAD }),
      { dispatchEvent: false }
    );
    ingestMediaTimelineEventV0(
      normalizeMediaTimelineEventV0({ title: "Paused", eventType: MEDIA_EVENT_TYPE_V0.PAUSE }),
      { dispatchEvent: false }
    );

    const view = buildLifeShadowDayBranchComparisonV0();
    expect(view.dayA.eventCount).toBe(2);
    expect(view.dayB.eventCount).toBe(2);
    expect(view.comparison.dominantBranch).toBe("tie");
    expect(view.dayA.label).toContain("Day A");
    expect(view.dayB.label).toContain("Day B");
  });
});
