/**
 * User Activity Shadow Timeline v0 — behavioral memory branch for focus/navigation events.
 * RESEARCH-ONLY — observation-only counterfactual; no execution authority.
 */

import { USER_ACTIVITY_TYPE_V0 } from "./userActivityEventAdapterV0.js";
import { recordWorldBridgeShadowMemoryV0 } from "./worldBridgeMemoryGraphV0.js";

export const USER_ACTIVITY_SHADOW_TIMELINE_SCHEMA_V0 =
  "castle.rhizoh.user_activity_shadow_timeline.v0";
export const USER_ACTIVITY_SHADOW_TIMELINE_EVENT_V0 = "rhizoh:user-activity-shadow-timeline-v0";

export const USER_ACTIVITY_SHADOW_BRANCH_ID_V0 = Object.freeze({
  FOCUS_CONTINUITY: "shadow_focus_continuity",
  SCATTERED: "shadow_scattered_attention"
});

/**
 * @param {object} normalized
 */
export function deriveUserActivityShadowOutcomeV0(normalized = {}) {
  const activityType = String(normalized.activityType || USER_ACTIVITY_TYPE_V0.INTERACT);
  const continuity = Number(normalized.foxSignals?.continuitySignal01) || 0.5;
  const world = Number(normalized.foxSignals?.worldSignal01) || 0.5;

  if (activityType === USER_ACTIVITY_TYPE_V0.IDLE) {
    return Object.freeze({
      branchId: USER_ACTIVITY_SHADOW_BRANCH_ID_V0.SCATTERED,
      behaviorScore01: 0.2,
      focusMinutes: 0,
      narrative: "Idle — behavioral continuity hold broken; attention scattered."
    });
  }

  if (activityType === USER_ACTIVITY_TYPE_V0.FOCUS) {
    const focusMin = Math.min(90, Math.round(continuity * world * 45));
    const behaviorScore01 = Number(Math.min(1, continuity * 0.6 + world * 0.25).toFixed(3));
    return Object.freeze({
      branchId: USER_ACTIVITY_SHADOW_BRANCH_ID_V0.FOCUS_CONTINUITY,
      behaviorScore01,
      focusMinutes: focusMin,
      narrative: `Shadow focus — ~${focusMin}m sustained behavioral continuity on ${normalized.payload?.surface || "surface"}.`
    });
  }

  const behaviorScore01 = Number(Math.min(1, continuity * 0.45 + world * 0.35).toFixed(3));
  return Object.freeze({
    branchId:
      behaviorScore01 >= 0.5
        ? USER_ACTIVITY_SHADOW_BRANCH_ID_V0.FOCUS_CONTINUITY
        : USER_ACTIVITY_SHADOW_BRANCH_ID_V0.SCATTERED,
    behaviorScore01,
    focusMinutes: Math.round(behaviorScore01 * 20),
    narrative: `Shadow activity — ${activityType} on ${normalized.payload?.surface || "surface"}.`
  });
}

const MAX_EVENTS = 64;
/** @type {object[]} */
const shadowEventsV0 = [];

/**
 * @param {object} normalized
 * @param {{ atMs?: number }} [opts]
 */
export function recordUserActivityShadowTimelineEventV0(normalized, opts = {}) {
  const atMs = Number(opts.atMs) || normalized.atMs || Date.now();
  const outcome = deriveUserActivityShadowOutcomeV0(normalized);
  const entry = Object.freeze({
    schema: `${USER_ACTIVITY_SHADOW_TIMELINE_SCHEMA_V0}.event`,
    activityId: normalized.activityId,
    activityType: normalized.activityType,
    surface: normalized.payload?.surface || null,
    shadow: outcome,
    foxSignals: normalized.foxSignals,
    atMs,
    interpretationOnly: true,
    nonExecutive: true
  });

  shadowEventsV0.unshift(entry);
  if (shadowEventsV0.length > MAX_EVENTS) shadowEventsV0.length = MAX_EVENTS;

  recordWorldBridgeShadowMemoryV0(entry, "user_activity");

  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(
      new CustomEvent(USER_ACTIVITY_SHADOW_TIMELINE_EVENT_V0, { detail: entry })
    );
  }

  return entry;
}

export function buildUserActivityShadowTimelineViewV0() {
  const branches = Object.freeze({
    [USER_ACTIVITY_SHADOW_BRANCH_ID_V0.FOCUS_CONTINUITY]: shadowEventsV0.filter(
      (e) => e.shadow?.branchId === USER_ACTIVITY_SHADOW_BRANCH_ID_V0.FOCUS_CONTINUITY
    ).length,
    [USER_ACTIVITY_SHADOW_BRANCH_ID_V0.SCATTERED]: shadowEventsV0.filter(
      (e) => e.shadow?.branchId === USER_ACTIVITY_SHADOW_BRANCH_ID_V0.SCATTERED
    ).length
  });

  const avgBehavior =
    shadowEventsV0.length > 0
      ? shadowEventsV0.reduce((sum, e) => sum + (e.shadow?.behaviorScore01 || 0), 0) /
        shadowEventsV0.length
      : null;

  return Object.freeze({
    schema: USER_ACTIVITY_SHADOW_TIMELINE_SCHEMA_V0,
    view: "user_activity_shadow_timeline",
    policyAuthority: "observation_only",
    eventCount: shadowEventsV0.length,
    branches,
    avgBehaviorScore01: avgBehavior != null ? Number(avgBehavior.toFixed(3)) : null,
    events: Object.freeze([...shadowEventsV0]),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function ensureUserActivityShadowTimelineDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.userActivityShadowTimeline = () => buildUserActivityShadowTimelineViewV0();
  return window.__rhizoh.userActivityShadowTimeline;
}

/** @internal vitest */
export function resetUserActivityShadowTimelineForTestV0() {
  shadowEventsV0.length = 0;
}
