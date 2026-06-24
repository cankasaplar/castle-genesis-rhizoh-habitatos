/**
 * Calendar Event Adapter v0 — World Bridge Layer 2 ingress stub.
 * Normalizes scheduled events → continuity lane (interpretation-only).
 * RESEARCH-ONLY — no WAL write, no execution authority.
 */

import {
  INGESTION_LANE_V0,
  schedulePhaseCommitV0
} from "./executionPhaseSynchronizerV0.js";
import { ingestCalendarContinuityLaneV0 } from "./crossSpaceCausalFusionV0.js";
import { recordCalendarShadowTimelineEventV0 } from "./calendarShadowTimelineV0.js";
import { wireWorldBridgeFusionAfterIngestV0 } from "./worldBridgeFusionWireV0.js";
import { emitCalendarActionTriggerV0 } from "./calendarActionTriggerV0.js";

export const CALENDAR_EVENT_ADAPTER_SCHEMA_V0 = "castle.rhizoh.calendar_event_adapter.v0";
export const CALENDAR_EVENT_V0 = "rhizoh:calendar-event-v0";
export const CALENDAR_SPACE_ID_V0 = "calendar.continuity.space";

export const CALENDAR_EVENT_TYPE_V0 = Object.freeze({
  SCHEDULED: "scheduled",
  REMINDER: "reminder",
  RSVP: "rsvp",
  CANCELLED: "cancelled"
});

/**
 * Map calendar semantics to Fox-axis continuity/novelty (no new axis).
 * @param {string} eventType
 */
export function deriveCalendarFoxSignalsV0(eventType) {
  const type = String(eventType || CALENDAR_EVENT_TYPE_V0.SCHEDULED);
  if (type === CALENDAR_EVENT_TYPE_V0.CANCELLED) {
    return Object.freeze({ continuitySignal01: 0.2, noveltySignal01: 0.35, worldSignal01: 0.1 });
  }
  if (type === CALENDAR_EVENT_TYPE_V0.REMINDER) {
    return Object.freeze({ continuitySignal01: 0.75, noveltySignal01: 0.15, worldSignal01: 0.2 });
  }
  if (type === CALENDAR_EVENT_TYPE_V0.RSVP) {
    return Object.freeze({ continuitySignal01: 0.55, noveltySignal01: 0.25, worldSignal01: 0.3 });
  }
  return Object.freeze({ continuitySignal01: 0.65, noveltySignal01: 0.2, worldSignal01: 0.25 });
}

/**
 * @param {object} raw
 */
export function normalizeCalendarEventV0(raw = {}) {
  const eventType = String(raw.eventType || raw.type || CALENDAR_EVENT_TYPE_V0.SCHEDULED);
  const eventId = String(raw.eventId || raw.id || `cal_${Date.now()}`);
  const title = String(raw.title || raw.summary || "Untitled event").slice(0, 160);
  const startAtMs = Number(raw.startAtMs || raw.startMs || raw.start) || Date.now();
  const endAtMs = Number(raw.endAtMs || raw.endMs || raw.end) || startAtMs + 3600000;

  return Object.freeze({
    schema: CALENDAR_EVENT_ADAPTER_SCHEMA_V0,
    eventType,
    eventId,
    title,
    startAtMs,
    endAtMs,
    timezone: raw.timezone ? String(raw.timezone) : null,
    causalSpaceId: CALENDAR_SPACE_ID_V0,
    payload: Object.freeze({
      location: raw.location ? String(raw.location).slice(0, 120) : null,
      organizer: raw.organizer ? String(raw.organizer).slice(0, 80) : null,
      rsvpStatus: raw.rsvpStatus ? String(raw.rsvpStatus) : null,
      detail: raw.detail ? String(raw.detail).slice(0, 240) : null
    }),
    foxSignals: deriveCalendarFoxSignalsV0(eventType),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/** @type {object[]} */
const calendarEventLogV0 = [];

/**
 * @param {object} normalized
 * @param {{ dispatchEvent?: boolean, fuse?: boolean }} [opts]
 */
export function ingestCalendarEventV0(normalized, opts = {}) {
  calendarEventLogV0.unshift(normalized);
  if (calendarEventLogV0.length > 64) calendarEventLogV0.length = 64;

  schedulePhaseCommitV0({
    atMs: normalized.startAtMs,
    source: `calendar:${normalized.eventType}`,
    ingest: [
      {
        lane: INGESTION_LANE_V0.CALENDAR,
        payload: {
          eventId: normalized.eventId,
          eventType: normalized.eventType,
          title: normalized.title,
          foxSignals: normalized.foxSignals,
          continuitySignal01: normalized.foxSignals.continuitySignal01
        }
      }
    ]
  });

  const lane = ingestCalendarContinuityLaneV0({
    eventId: normalized.eventId,
    eventType: normalized.eventType,
    foxSignals: normalized.foxSignals,
    source: `calendar:${normalized.eventType}`
  });

  const shadowEntry = recordCalendarShadowTimelineEventV0(normalized);
  const actionTrigger = emitCalendarActionTriggerV0(normalized);
  const fusion = wireWorldBridgeFusionAfterIngestV0({
    atMs: normalized.startAtMs,
    fuse: opts.fuse,
    suppressEvent: opts.dispatchEvent === false
  });

  if (opts.dispatchEvent !== false && typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(
      new CustomEvent(CALENDAR_EVENT_V0, {
        detail: Object.freeze({ normalized, lane, shadowEntry })
      })
    );
  }

  return Object.freeze({
    schema: CALENDAR_EVENT_ADAPTER_SCHEMA_V0,
    normalized,
    lane,
    shadowEntry,
    actionTrigger,
    fusion,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getCalendarEventAdapterSnapshotV0() {
  return Object.freeze({
    schema: `${CALENDAR_EVENT_ADAPTER_SCHEMA_V0}.snapshot`,
    recentCount: calendarEventLogV0.length,
    recent: Object.freeze(calendarEventLogV0.slice(0, 8)),
    spaceId: CALENDAR_SPACE_ID_V0,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function resetCalendarEventAdapterForTestV0() {
  calendarEventLogV0.length = 0;
}
