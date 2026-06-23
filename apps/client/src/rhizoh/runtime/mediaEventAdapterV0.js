/**
 * Media Timeline Event Adapter v0 — World Bridge Layer 2 ingress stub.
 * Normalizes playhead / chapter / clip signals → media timeline lane.
 * RESEARCH-ONLY — distinct from locked ingestMediaFrameArena (arena binding).
 */

import {
  INGESTION_LANE_V0,
  schedulePhaseCommitV0
} from "./executionPhaseSynchronizerV0.js";
import { ingestMediaTimelineLaneV0 } from "./crossSpaceCausalFusionV0.js";
import { recordMediaShadowTimelineEventV0 } from "./mediaShadowTimelineV0.js";

export const MEDIA_EVENT_ADAPTER_SCHEMA_V0 = "castle.rhizoh.media_event_adapter.v0";
export const MEDIA_TIMELINE_EVENT_V0 = "rhizoh:media-timeline-event-v0";
export const MEDIA_TIMELINE_SPACE_ID_V0 = "media.timeline.space";

export const MEDIA_EVENT_TYPE_V0 = Object.freeze({
  PLAYHEAD: "playhead",
  CHAPTER: "chapter",
  CLIP_START: "clip_start",
  CLIP_END: "clip_end",
  PAUSE: "pause"
});

/**
 * Map media semantics to Fox-axis signals (no new axis).
 * @param {string} eventType
 */
export function deriveMediaFoxSignalsV0(eventType) {
  const type = String(eventType || MEDIA_EVENT_TYPE_V0.PLAYHEAD);
  if (type === MEDIA_EVENT_TYPE_V0.PAUSE) {
    return Object.freeze({ continuitySignal01: 0.3, noveltySignal01: 0.1, worldSignal01: 0.55 });
  }
  if (type === MEDIA_EVENT_TYPE_V0.CHAPTER) {
    return Object.freeze({ continuitySignal01: 0.5, noveltySignal01: 0.35, worldSignal01: 0.6 });
  }
  if (type === MEDIA_EVENT_TYPE_V0.CLIP_START || type === MEDIA_EVENT_TYPE_V0.CLIP_END) {
    return Object.freeze({ continuitySignal01: 0.45, noveltySignal01: 0.4, worldSignal01: 0.7 });
  }
  return Object.freeze({ continuitySignal01: 0.4, noveltySignal01: 0.25, worldSignal01: 0.65 });
}

/**
 * @param {object} raw
 */
export function normalizeMediaTimelineEventV0(raw = {}) {
  const eventType = String(raw.eventType || raw.type || MEDIA_EVENT_TYPE_V0.PLAYHEAD);
  const mediaId = String(raw.mediaId || raw.id || `media_${Date.now()}`);
  const title = String(raw.title || raw.label || "Untitled media").slice(0, 160);
  const atMs = Number(raw.atMs || raw.timestampMs) || Date.now();
  const positionSec = Number(raw.positionSec ?? raw.playheadSec ?? 0);

  return Object.freeze({
    schema: MEDIA_EVENT_ADAPTER_SCHEMA_V0,
    eventType,
    mediaId,
    title,
    atMs,
    positionSec: Math.max(0, positionSec),
    durationSec: Number(raw.durationSec) > 0 ? Number(raw.durationSec) : null,
    causalSpaceId: MEDIA_TIMELINE_SPACE_ID_V0,
    payload: Object.freeze({
      source: raw.source ? String(raw.source).slice(0, 80) : null,
      chapterId: raw.chapterId ? String(raw.chapterId) : null,
      clipId: raw.clipId ? String(raw.clipId) : null,
      detail: raw.detail ? String(raw.detail).slice(0, 240) : null
    }),
    foxSignals: deriveMediaFoxSignalsV0(eventType),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/** @type {object[]} */
const mediaEventLogV0 = [];

/**
 * @param {object} normalized
 * @param {{ dispatchEvent?: boolean }} [opts]
 */
export function ingestMediaTimelineEventV0(normalized, opts = {}) {
  mediaEventLogV0.unshift(normalized);
  if (mediaEventLogV0.length > 64) mediaEventLogV0.length = 64;

  schedulePhaseCommitV0({
    atMs: normalized.atMs,
    source: `media:${normalized.eventType}`,
    ingest: [
      {
        lane: INGESTION_LANE_V0.MEDIA,
        payload: {
          mediaId: normalized.mediaId,
          eventType: normalized.eventType,
          positionSec: normalized.positionSec,
          foxSignals: normalized.foxSignals
        }
      }
    ]
  });

  const lane = ingestMediaTimelineLaneV0({
    mediaId: normalized.mediaId,
    eventType: normalized.eventType,
    positionSec: normalized.positionSec,
    foxSignals: normalized.foxSignals,
    source: `media:${normalized.eventType}`
  });

  const shadowEntry = recordMediaShadowTimelineEventV0(normalized);

  if (opts.dispatchEvent !== false && typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(
      new CustomEvent(MEDIA_TIMELINE_EVENT_V0, {
        detail: Object.freeze({ normalized, lane, shadowEntry })
      })
    );
  }

  return Object.freeze({
    schema: MEDIA_EVENT_ADAPTER_SCHEMA_V0,
    normalized,
    lane,
    shadowEntry,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getMediaEventAdapterSnapshotV0() {
  return Object.freeze({
    schema: `${MEDIA_EVENT_ADAPTER_SCHEMA_V0}.snapshot`,
    recentCount: mediaEventLogV0.length,
    recent: Object.freeze(mediaEventLogV0.slice(0, 8)),
    spaceId: MEDIA_TIMELINE_SPACE_ID_V0,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function resetMediaEventAdapterForTestV0() {
  mediaEventLogV0.length = 0;
}
