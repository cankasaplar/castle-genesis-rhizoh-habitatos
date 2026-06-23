import { describe, expect, it, beforeEach } from "vitest";
import {
  CALENDAR_EVENT_TYPE_V0,
  deriveCalendarFoxSignalsV0,
  getCalendarEventAdapterSnapshotV0,
  ingestCalendarEventV0,
  normalizeCalendarEventV0,
  resetCalendarEventAdapterForTestV0
} from "../calendarEventAdapterV0.js";
import {
  getCrossSpaceFusionLaneAuditV0,
  resetCrossSpaceCausalFusionForTestV0
} from "../crossSpaceCausalFusionV0.js";
import {
  bindRhizohRuntimeSurfaceV0,
  RUNTIME_SURFACE_API_KEYS_V0
} from "../rhizohRuntimeSurfaceBinderV0.js";

describe("calendarEventAdapterV0", () => {
  beforeEach(() => {
    resetCalendarEventAdapterForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
  });

  it("normalizes scheduled events with fox-axis signals", () => {
    const normalized = normalizeCalendarEventV0({
      eventType: CALENDAR_EVENT_TYPE_V0.SCHEDULED,
      title: "Team sync",
      startAtMs: 1_700_000_000_000
    });
    expect(normalized.schema).toContain("calendar_event_adapter");
    expect(normalized.foxSignals.continuitySignal01).toBeGreaterThan(0);
    expect(normalized.interpretationOnly).toBe(true);
  });

  it("maps reminder to higher continuity signal", () => {
    const reminder = deriveCalendarFoxSignalsV0(CALENDAR_EVENT_TYPE_V0.REMINDER);
    const cancelled = deriveCalendarFoxSignalsV0(CALENDAR_EVENT_TYPE_V0.CANCELLED);
    expect(reminder.continuitySignal01).toBeGreaterThan(cancelled.continuitySignal01);
  });

  it("ingests into calendar continuity lane", () => {
    const normalized = normalizeCalendarEventV0({
      eventType: CALENDAR_EVENT_TYPE_V0.RSVP,
      eventId: "evt_1",
      title: "Dinner"
    });
    const result = ingestCalendarEventV0(normalized, { dispatchEvent: false });
    expect(result.lane?.lane).toBe("calendar_continuity");
    const audit = getCrossSpaceFusionLaneAuditV0();
    expect(audit.calendar.present).toBe(true);
  });

  it("snapshot tracks recent events", () => {
    ingestCalendarEventV0(
      normalizeCalendarEventV0({ eventId: "a", title: "A" }),
      { dispatchEvent: false }
    );
    const snap = getCalendarEventAdapterSnapshotV0();
    expect(snap.recentCount).toBe(1);
  });
});

describe("rhizohRuntimeSurfaceBinder calendar API", () => {
  beforeEach(() => {
    window.__rhizoh = {};
    resetCalendarEventAdapterForTestV0();
    resetCrossSpaceCausalFusionForTestV0();
  });

  it("binds ingestCalendarEvent", () => {
    bindRhizohRuntimeSurfaceV0(window.__rhizoh);
    expect(RUNTIME_SURFACE_API_KEYS_V0).toContain("ingestCalendarEvent");
    expect(typeof window.__rhizoh.ingestCalendarEvent).toBe("function");
    const result = window.__rhizoh.ingestCalendarEvent({
      title: "Bridge test",
      eventType: CALENDAR_EVENT_TYPE_V0.SCHEDULED
    });
    expect(result.normalized.title).toBe("Bridge test");
  });
});
