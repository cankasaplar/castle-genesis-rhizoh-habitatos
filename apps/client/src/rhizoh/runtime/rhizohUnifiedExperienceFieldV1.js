/**
 * Unified Experience Field v1 — multimodal ambient cognition scaffold.
 * Rhizoh lives inside an experience stream, not a single mic input.
 * @see apps/client/docs/RHIZOH_UNIFIED_EXPERIENCE_FIELD_V1.md
 */

import { runSpikeEngineV1, classifyExperienceAttentionSignalsV1 } from "./rhizohExperienceFabricV1.js";

export { classifyExperienceAttentionSignalsV1 };

export const RHIZOH_UNIFIED_EXPERIENCE_FIELD_SCHEMA_V1 = "rhizoh.unified_experience_field.v1";

/** Experience ingress sources — not mic-only. */
export const EXPERIENCE_SOURCE_V1 = Object.freeze({
  MIC: "mic",
  YOUTUBE_AUDIO: "youtube_audio",
  SYSTEM_AUDIO: "system_audio",
  MEDIA_PLAYER: "media_player",
  CAMERA_CONTEXT: "camera_context",
  FILE_STREAM: "file_stream",
  MEMORY_CLIP: "memory_clip",
  EXTERNAL_DEVICE: "external_device",
  USER_ACTION: "user_action",
  SCREEN_CONTEXT: "screen_context"
});

/** Multimodal attention signal kinds. */
export const EXPERIENCE_ATTENTION_KIND_V1 = Object.freeze({
  SPEECH: "speech",
  INTERACTION: "interaction",
  MEDIA_STATE: "media_state",
  SCENE_CHANGE: "scene_change",
  VISUAL: "visual",
  MEMORY_RECALL: "memory_recall",
  EMERGENCY: "emergency",
  NONE: "none"
});

const SOURCE_DEFAULT_PRIORITY_V1 = Object.freeze({
  [EXPERIENCE_SOURCE_V1.MIC]: 0.85,
  [EXPERIENCE_SOURCE_V1.USER_ACTION]: 0.92,
  [EXPERIENCE_SOURCE_V1.MEDIA_PLAYER]: 0.55,
  [EXPERIENCE_SOURCE_V1.FILE_STREAM]: 0.55,
  [EXPERIENCE_SOURCE_V1.YOUTUBE_AUDIO]: 0.35,
  [EXPERIENCE_SOURCE_V1.SYSTEM_AUDIO]: 0.32,
  [EXPERIENCE_SOURCE_V1.CAMERA_CONTEXT]: 0.6,
  [EXPERIENCE_SOURCE_V1.MEMORY_CLIP]: 0.7,
  [EXPERIENCE_SOURCE_V1.EXTERNAL_DEVICE]: 0.4,
  [EXPERIENCE_SOURCE_V1.SCREEN_CONTEXT]: 0.45
});

const FIELD_RING_MAX_V1 = 128;
const FIELD_SESSION_MS_V1 = 300_000;

/** @type {object[]} */
const fieldTimelineV1 = [];

/**
 * @param {object} event
 */
export function noteExperienceFieldEventV1(event = {}) {
  const source = String(event.source || EXPERIENCE_SOURCE_V1.MIC);
  const row = Object.freeze({
    schema: RHIZOH_UNIFIED_EXPERIENCE_FIELD_SCHEMA_V1,
    id: `efx_${Date.now().toString(36)}_${fieldTimelineV1.length}`,
    source,
    kind: event.kind || "observation",
    priority: SOURCE_DEFAULT_PRIORITY_V1[source] ?? 0.4,
    preview: event.preview ? String(event.preview).slice(0, 160) : null,
    mediaPositionMs: Number.isFinite(Number(event.mediaPositionMs))
      ? Number(event.mediaPositionMs)
      : null,
    meta: event.meta && typeof event.meta === "object" ? Object.freeze({ ...event.meta }) : null,
    atMs: Number(event.atMs) || Date.now()
  });
  fieldTimelineV1.push(row);
  if (fieldTimelineV1.length > FIELD_RING_MAX_V1) fieldTimelineV1.shift();
  publishExperienceFieldSnapshotV1();
  return row;
}

/**
 * Fuse speech spike (co-presence) with field signals.
 * Delegates to Experience Fabric spike engine (SSOT).
 * @param {object} input
 */
export function fuseExperienceAttentionSpikeV1(input = {}) {
  const fabricSpike = runSpikeEngineV1(input);
  return Object.freeze({
    schema: RHIZOH_UNIFIED_EXPERIENCE_FIELD_SCHEMA_V1,
    fabric: true,
    fusedKind: fabricSpike.intent,
    fusedScore: fabricSpike.relevance,
    utility: fabricSpike.relevance,
    respond: fabricSpike.respond,
    reason: fabricSpike.reason,
    source: fabricSpike.source,
    speechSpike: fabricSpike.speechSpike,
    fieldSignals: fabricSpike.fieldSignals,
    coWatchMass: fabricSpike.attentionField?.backgroundMass ?? 0,
    preview: fabricSpike.preview,
    mediaPositionMs: fabricSpike.mediaPositionMs,
    anchor: fabricSpike.anchor ?? null,
    retrieval: fabricSpike.retrieval ?? null,
    atMs: fabricSpike.atMs
  });
}

export function getExperienceFieldSnapshotV1(nowMs = Date.now()) {
  const cutoff = nowMs - FIELD_SESSION_MS_V1;
  return Object.freeze({
    schema: RHIZOH_UNIFIED_EXPERIENCE_FIELD_SCHEMA_V1,
    identity: "unified_experience_field",
    eventCount: fieldTimelineV1.length,
    sessionWindowMs: FIELD_SESSION_MS_V1,
    recent: Object.freeze(fieldTimelineV1.filter((e) => e.atMs >= cutoff).slice(-16)),
    sources: EXPERIENCE_SOURCE_V1,
    attentionKinds: EXPERIENCE_ATTENTION_KIND_V1
  });
}

/** @param {object} [lastSpike] */
function publishExperienceFieldSnapshotV1(lastSpike) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.experienceField = getExperienceFieldSnapshotV1();
  if (lastSpike) window.__rhizoh.lastExperienceSpike = lastSpike;
}

/** @internal vitest */
export function __resetExperienceFieldForTestV1() {
  fieldTimelineV1.length = 0;
}
