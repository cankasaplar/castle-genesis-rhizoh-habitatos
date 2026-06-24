import { describe, expect, it, beforeEach } from "vitest";
import { runFullSystemReportV0 } from "../rhizohFullSystemReportV0.js";
import {
  ingestCalendarEventV0,
  normalizeCalendarEventV0,
  resetCalendarEventAdapterForTestV0
} from "../calendarEventAdapterV0.js";
import {
  ingestUserActivityEventV0,
  normalizeUserActivityEventV0,
  resetUserActivityAdapterForTestV0
} from "../userActivityEventAdapterV0.js";
import { resetCrossSpaceCausalFusionForTestV0 } from "../crossSpaceCausalFusionV0.js";
import { __resetFullSystemReportConsoleForTestV0 } from "../rhizohFullSystemReportV0.js";

describe("rhizohFullSystemReportV0 worldBridge", () => {
  beforeEach(() => {
    resetCalendarEventAdapterForTestV0();
    resetUserActivityAdapterForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
    __resetFullSystemReportConsoleForTestV0();
    window.__rhizoh = {
      ingestCalendarEvent: (raw) => ingestCalendarEventV0(normalizeCalendarEventV0(raw), { dispatchEvent: false }),
      ingestMediaEvent: () => null,
      ingestUserActivity: (raw) =>
        ingestUserActivityEventV0(normalizeUserActivityEventV0(raw), { dispatchEvent: false }),
      fuseCrossSpaceEpistemic: () => null,
      calendarShadowTimeline: () => null,
      mediaShadowTimeline: () => null,
      lifeShadowDayBranches: () => null
    };
  });

  it("includes userActivity, mediaShadow, and lane ingest in worldBridge diagnostic", () => {
    ingestCalendarEventV0(normalizeCalendarEventV0({ title: "Focus" }), { dispatchEvent: false });
    ingestUserActivityEventV0(
      normalizeUserActivityEventV0({ activityType: "focus", surface: "world_map" }),
      { dispatchEvent: false }
    );

    const report = runFullSystemReportV0({ probe: false });
    const wb = report.worldBridge;

    expect(wb.userActivity.recentCount).toBe(1);
    expect(wb.mediaShadow).toBeTruthy();
    expect(wb.laneIngest.calendar).toBe(true);
    expect(wb.laneIngest.userActivity).toBe(true);
    expect(wb.fusionLanes.calendarPresent).toBe(true);
    expect(wb.fusionLanes.userActivityPresent).toBe(true);
    expect(wb.surfaceBound.ingestUserActivity).toBe(true);
    expect(wb.lifeShadowDayAb).toBeTruthy();
    expect(wb.lifeShadowDayAb.dayA).toBe(1);
  });
});
