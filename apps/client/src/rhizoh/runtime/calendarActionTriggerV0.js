/**
 * Calendar Action Trigger v0 — calendar event → suggest-only action intent.
 * RESEARCH-ONLY — no executive scheduling; observation ≠ execution.
 */

import { CALENDAR_EVENT_TYPE_V0, normalizeCalendarEventV0 } from "./calendarEventAdapterV0.js";
import {
  evaluateExecutionPermissionV0,
  EXECUTION_ACTION_CLASS_V0
} from "./executionPermissionLayerV0.js";

export const CALENDAR_ACTION_TRIGGER_SCHEMA_V0 = "castle.rhizoh.calendar_action_trigger.v0";
export const CALENDAR_ACTION_TRIGGER_EVENT_V0 = "rhizoh:calendar-action-trigger-v0";

/**
 * @param {string} eventType
 */
export function deriveCalendarActionIntentV0(eventType) {
  const type = String(eventType || CALENDAR_EVENT_TYPE_V0.SCHEDULED);
  if (type === CALENDAR_EVENT_TYPE_V0.CANCELLED) {
    return Object.freeze({
      intentId: "calendar_void_ack",
      label: "Acknowledge cancellation (suggest)",
      priority: 0.2
    });
  }
  if (type === CALENDAR_EVENT_TYPE_V0.REMINDER) {
    return Object.freeze({
      intentId: "calendar_reminder_nudge",
      label: "Reminder nudge (suggest)",
      priority: 0.75
    });
  }
  if (type === CALENDAR_EVENT_TYPE_V0.RSVP) {
    return Object.freeze({
      intentId: "calendar_rsvp_followup",
      label: "RSVP follow-up (suggest)",
      priority: 0.55
    });
  }
  return Object.freeze({
    intentId: "calendar_focus_block",
    label: "Focus block alignment (suggest)",
    priority: 0.65
  });
}

/**
 * @param {object} raw
 */
export function buildCalendarActionTriggerV0(raw = {}) {
  const normalized = normalizeCalendarEventV0(raw);
  const permission = evaluateExecutionPermissionV0({
    actionClass: EXECUTION_ACTION_CLASS_V0.SUGGEST,
    domain: "calendar"
  });
  const intent = deriveCalendarActionIntentV0(normalized.eventType);

  return Object.freeze({
    schema: CALENDAR_ACTION_TRIGGER_SCHEMA_V0,
    eventId: normalized.eventId,
    eventType: normalized.eventType,
    title: normalized.title,
    startAtMs: normalized.startAtMs,
    intent,
    permission,
    executionClass: "suggest",
    triggered: permission.suggestPermitted,
    feedbackToExecution: false,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/**
 * @param {object} raw
 */
export function emitCalendarActionTriggerV0(raw = {}) {
  const trigger = buildCalendarActionTriggerV0(raw);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CALENDAR_ACTION_TRIGGER_EVENT_V0, { detail: trigger }));
  }
  return trigger;
}

export function ensureCalendarActionTriggerDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.calendarActionTrigger = (raw) => buildCalendarActionTriggerV0(raw);
  return window.__rhizoh.calendarActionTrigger;
}
