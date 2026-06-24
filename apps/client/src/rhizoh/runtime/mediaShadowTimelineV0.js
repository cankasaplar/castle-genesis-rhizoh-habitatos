/**
 * Media Shadow Timeline v0 — Life Shadow branch for media playhead/chapter events.
 * RESEARCH-ONLY — observation-only counterfactual; no execution authority.
 */

import { MEDIA_EVENT_TYPE_V0 } from "./mediaEventAdapterV0.js";
import { recordWorldBridgeShadowMemoryV0 } from "./worldBridgeMemoryGraphV0.js";

export const MEDIA_SHADOW_TIMELINE_SCHEMA_V0 = "castle.rhizoh.media_shadow_timeline.v0";
export const MEDIA_SHADOW_TIMELINE_EVENT_V0 = "rhizoh:media-shadow-timeline-v0";

export const MEDIA_SHADOW_BRANCH_ID_V0 = Object.freeze({
  IMMERSIVE: "shadow_immersive",
  SCATTERED: "shadow_scattered"
});

/**
 * @param {object} normalized
 */
export function deriveMediaShadowOutcomeV0(normalized = {}) {
  const eventType = String(normalized.eventType || MEDIA_EVENT_TYPE_V0.PLAYHEAD);
  const world = Number(normalized.foxSignals?.worldSignal01) || 0.5;
  const positionSec = Number(normalized.positionSec) || 0;

  if (eventType === MEDIA_EVENT_TYPE_V0.PAUSE) {
    return Object.freeze({
      branchId: MEDIA_SHADOW_BRANCH_ID_V0.SCATTERED,
      attentionScore01: 0.25,
      immersionMinutes: 0,
      narrative: "Pause — attention scatters; continuity hold broken."
    });
  }

  const immersionMin = Math.min(90, Math.round((positionSec / 60) * world * 12));
  const attentionScore01 = Number(Math.min(1, world * 0.55 + immersionMin * 0.008).toFixed(3));

  return Object.freeze({
    branchId: MEDIA_SHADOW_BRANCH_ID_V0.IMMERSIVE,
    attentionScore01,
    immersionMinutes: immersionMin,
    narrative: `Shadow immersive — ~${immersionMin}m sustained attention at playhead.`
  });
}

const MAX_EVENTS = 64;
/** @type {object[]} */
const shadowEventsV0 = [];

/**
 * @param {object} normalized
 * @param {{ atMs?: number }} [opts]
 */
export function recordMediaShadowTimelineEventV0(normalized, opts = {}) {
  const atMs = Number(opts.atMs) || Date.now();
  const outcome = deriveMediaShadowOutcomeV0(normalized);
  const entry = Object.freeze({
    schema: `${MEDIA_SHADOW_TIMELINE_SCHEMA_V0}.event`,
    mediaId: normalized.mediaId,
    title: normalized.title,
    eventType: normalized.eventType,
    positionSec: normalized.positionSec,
    shadow: outcome,
    atMs,
    interpretationOnly: true,
    nonExecutive: true
  });

  shadowEventsV0.unshift(entry);
  if (shadowEventsV0.length > MAX_EVENTS) shadowEventsV0.length = MAX_EVENTS;

  recordWorldBridgeShadowMemoryV0(entry, "media");

  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(MEDIA_SHADOW_TIMELINE_EVENT_V0, { detail: entry }));
  }

  return entry;
}

export function buildMediaShadowTimelineViewV0() {
  const branches = Object.freeze({
    [MEDIA_SHADOW_BRANCH_ID_V0.IMMERSIVE]: shadowEventsV0.filter(
      (e) => e.shadow?.branchId === MEDIA_SHADOW_BRANCH_ID_V0.IMMERSIVE
    ).length,
    [MEDIA_SHADOW_BRANCH_ID_V0.SCATTERED]: shadowEventsV0.filter(
      (e) => e.shadow?.branchId === MEDIA_SHADOW_BRANCH_ID_V0.SCATTERED
    ).length
  });

  const avgAttention =
    shadowEventsV0.length > 0
      ? shadowEventsV0.reduce((sum, e) => sum + (e.shadow?.attentionScore01 || 0), 0) /
        shadowEventsV0.length
      : null;

  return Object.freeze({
    schema: MEDIA_SHADOW_TIMELINE_SCHEMA_V0,
    view: "media_shadow_timeline",
    policyAuthority: "observation_only",
    eventCount: shadowEventsV0.length,
    branches,
    avgAttentionScore01: avgAttention != null ? Number(avgAttention.toFixed(3)) : null,
    events: Object.freeze([...shadowEventsV0]),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function ensureMediaShadowTimelineDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.mediaShadowTimeline = () => buildMediaShadowTimelineViewV0();
  return window.__rhizoh.mediaShadowTimeline;
}

/** @internal vitest */
export function resetMediaShadowTimelineForTestV0() {
  shadowEventsV0.length = 0;
}
