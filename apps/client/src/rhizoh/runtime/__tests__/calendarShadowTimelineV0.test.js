import { describe, expect, it, beforeEach } from "vitest";
import {
  CALENDAR_EVENT_TYPE_V0,
  ingestCalendarEventV0,
  normalizeCalendarEventV0,
  resetCalendarEventAdapterForTestV0
} from "../calendarEventAdapterV0.js";
import {
  buildCalendarShadowTimelineViewV0,
  CALENDAR_SHADOW_BRANCH_ID_V0,
  CALENDAR_SHADOW_OUTCOME_KIND_V0,
  deriveCalendarShadowOutcomeV0,
  recordCalendarShadowTimelineEventV0,
  resetCalendarShadowTimelineForTestV0
} from "../calendarShadowTimelineV0.js";
import { resetCrossSpaceCausalFusionForTestV0 } from "../crossSpaceCausalFusionV0.js";

describe("calendarShadowTimelineV0", () => {
  beforeEach(() => {
    resetCalendarShadowTimelineForTestV0();
    resetCalendarEventAdapterForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
  });

  it("derives Shadow Day A outcome for scheduled events", () => {
    const normalized = normalizeCalendarEventV0({
      eventType: CALENDAR_EVENT_TYPE_V0.SCHEDULED,
      title: "Team sync",
      startAtMs: Date.now(),
      endAtMs: Date.now() + 2 * 3600000
    });
    const outcome = deriveCalendarShadowOutcomeV0(normalized);
    expect(outcome.branchId).toBe(CALENDAR_SHADOW_BRANCH_ID_V0.DAY_A);
    expect(outcome.predictedTaskSlips).toBeGreaterThanOrEqual(0);
    expect(outcome.outcomeScore01).toBeGreaterThan(0);
  });

  it("derives cancelled void branch", () => {
    const normalized = normalizeCalendarEventV0({
      eventType: CALENDAR_EVENT_TYPE_V0.CANCELLED,
      title: "Cancelled standup"
    });
    const outcome = deriveCalendarShadowOutcomeV0(normalized);
    expect(outcome.branchId).toBe(CALENDAR_SHADOW_BRANCH_ID_V0.DAY_B);
    expect(outcome.outcomeKind).toBe(CALENDAR_SHADOW_OUTCOME_KIND_V0.CANCELLED_VOID);
  });

  it("records shadow timeline events", () => {
    const normalized = normalizeCalendarEventV0({ title: "Focus block" });
    recordCalendarShadowTimelineEventV0(normalized);
    const view = buildCalendarShadowTimelineViewV0();
    expect(view.eventCount).toBe(1);
    expect(view.view).toBe("life_shadow_timeline");
    expect(view.interpretationOnly).toBe(true);
  });

  it("calendar ingest wires shadow entry", () => {
    const result = ingestCalendarEventV0(
      normalizeCalendarEventV0({ title: "Team sync", eventType: "scheduled" }),
      { dispatchEvent: false }
    );
    expect(result.shadowEntry?.shadow?.branchId).toBe(CALENDAR_SHADOW_BRANCH_ID_V0.DAY_A);
    expect(buildCalendarShadowTimelineViewV0().eventCount).toBe(1);
  });
});
