/**
 * Calendar Shadow Timeline v0 — Life Shadow skeleton (observation-only).
 * Calendar ingest → shadow day branch → predicted outcome score.
 * RESEARCH-ONLY — no execution authority; builds on interpretationOnly calendar ingress.
 */

import { CALENDAR_EVENT_TYPE_V0 } from "./calendarEventAdapterV0.js";
import { recordWorldBridgeShadowMemoryV0 } from "./worldBridgeMemoryGraphV0.js";

export const CALENDAR_SHADOW_TIMELINE_SCHEMA_V0 = "castle.rhizoh.calendar_shadow_timeline.v0";
export const CALENDAR_SHADOW_TIMELINE_EVENT_V0 = "rhizoh:calendar-shadow-timeline-v0";

export const CALENDAR_SHADOW_BRANCH_ID_V0 = Object.freeze({
  DAY_A: "shadow_day_a",
  DAY_B: "shadow_day_b"
});

export const CALENDAR_SHADOW_OUTCOME_KIND_V0 = Object.freeze({
  FOCUS_DRAIN: "focus_drain",
  TASK_SLIP: "task_slip",
  CONTINUITY_HOLD: "continuity_hold",
  CANCELLED_VOID: "cancelled_void"
});

const MAX_SHADOW_EVENTS = 64;

/** @type {number | null} */
let sessionAnchorMsV0 = null;
/** @type {object[]} */
const shadowEventsV0 = [];

/**
 * Derive simple counterfactual outcome from calendar semantics (heuristic stub).
 * @param {object} normalized
 */
export function deriveCalendarShadowOutcomeV0(normalized = {}) {
  const eventType = String(normalized.eventType || CALENDAR_EVENT_TYPE_V0.SCHEDULED);
  const continuity = Number(normalized.foxSignals?.continuitySignal01) || 0.5;
  const durationMs = Math.max(0, Number(normalized.endAtMs) - Number(normalized.startAtMs)) || 3600000;
  const durationHours = durationMs / 3600000;

  if (eventType === CALENDAR_EVENT_TYPE_V0.CANCELLED) {
    return Object.freeze({
      branchId: CALENDAR_SHADOW_BRANCH_ID_V0.DAY_B,
      outcomeKind: CALENDAR_SHADOW_OUTCOME_KIND_V0.CANCELLED_VOID,
      outcomeScore01: 0.15,
      predictedFocusDrainHours: 0,
      predictedTaskSlips: 0,
      narrative: "Cancelled slot — continuity void; novelty spike without scheduled anchor."
    });
  }

  const focusDrain = Math.min(4, durationHours * continuity * 0.85);
  const taskSlips = Math.min(5, Math.floor(durationHours * continuity * 1.2));
  const outcomeScore01 = Number(Math.min(1, continuity * 0.4 + taskSlips * 0.08).toFixed(3));

  return Object.freeze({
    branchId: CALENDAR_SHADOW_BRANCH_ID_V0.DAY_A,
    outcomeKind:
      taskSlips >= 2
        ? CALENDAR_SHADOW_OUTCOME_KIND_V0.TASK_SLIP
        : focusDrain >= 1.5
          ? CALENDAR_SHADOW_OUTCOME_KIND_V0.FOCUS_DRAIN
          : CALENDAR_SHADOW_OUTCOME_KIND_V0.CONTINUITY_HOLD,
    outcomeScore01,
    predictedFocusDrainHours: Number(focusDrain.toFixed(2)),
    predictedTaskSlips: taskSlips,
    narrative: `Shadow Day A — ~${focusDrain.toFixed(1)}h focus drain, ${taskSlips} task slip(s) predicted.`
  });
}

/**
 * @param {object} normalized — output of normalizeCalendarEventV0
 * @param {{ atMs?: number }} [opts]
 */
export function recordCalendarShadowTimelineEventV0(normalized, opts = {}) {
  const atMs = Number(opts.atMs) || Date.now();
  if (sessionAnchorMsV0 == null) sessionAnchorMsV0 = atMs;

  const outcome = deriveCalendarShadowOutcomeV0(normalized);
  const entry = Object.freeze({
    schema: `${CALENDAR_SHADOW_TIMELINE_SCHEMA_V0}.event`,
    eventId: normalized.eventId,
    title: normalized.title,
    eventType: normalized.eventType,
    startAtMs: normalized.startAtMs,
    foxSignals: normalized.foxSignals,
    shadow: outcome,
    offsetMs: Math.max(0, atMs - sessionAnchorMsV0),
    atMs,
    interpretationOnly: true,
    nonExecutive: true
  });

  shadowEventsV0.unshift(entry);
  if (shadowEventsV0.length > MAX_SHADOW_EVENTS) shadowEventsV0.length = MAX_SHADOW_EVENTS;

  recordWorldBridgeShadowMemoryV0(entry, "calendar");

  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(
      new CustomEvent(CALENDAR_SHADOW_TIMELINE_EVENT_V0, { detail: entry })
    );
  }

  return entry;
}

export function buildCalendarShadowTimelineViewV0() {
  const branches = Object.freeze({
    [CALENDAR_SHADOW_BRANCH_ID_V0.DAY_A]: shadowEventsV0.filter(
      (e) => e.shadow?.branchId === CALENDAR_SHADOW_BRANCH_ID_V0.DAY_A
    ).length,
    [CALENDAR_SHADOW_BRANCH_ID_V0.DAY_B]: shadowEventsV0.filter(
      (e) => e.shadow?.branchId === CALENDAR_SHADOW_BRANCH_ID_V0.DAY_B
    ).length
  });

  const avgOutcome =
    shadowEventsV0.length > 0
      ? shadowEventsV0.reduce((sum, e) => sum + (e.shadow?.outcomeScore01 || 0), 0) /
        shadowEventsV0.length
      : null;

  return Object.freeze({
    schema: CALENDAR_SHADOW_TIMELINE_SCHEMA_V0,
    view: "life_shadow_timeline",
    policyAuthority: "observation_only",
    learningDecision: "none",
    eventCount: shadowEventsV0.length,
    branches,
    avgOutcomeScore01: avgOutcome != null ? Number(avgOutcome.toFixed(3)) : null,
    events: Object.freeze([...shadowEventsV0]),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function ensureCalendarShadowTimelineDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.calendarShadowTimeline = () => buildCalendarShadowTimelineViewV0();
  return window.__rhizoh.calendarShadowTimeline;
}

/** @internal vitest */
export function resetCalendarShadowTimelineForTestV0() {
  sessionAnchorMsV0 = null;
  shadowEventsV0.length = 0;
}
