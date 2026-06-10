/**
 * Castle Multi-Stream Fusion Bus v1 — immutable append-only ingestion.
 * NormalizedEventV1 frozen schema; events are reality atoms, never mutated.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import { registerMediaSyncV1 } from "../rhizoh/runtime/rhizohExperienceFabricV1.js";
import {
  ATTENTION_EVENT_TYPE_V1,
  ATTENTION_TEMPORAL_SPAN_V1,
  buildCastleRoomV1,
  buildContentVectorV1,
  classifyAttentionEventTypeV1,
  computeCastleAttentionFieldV1,
  mapAttentionSourceV1,
  queueRealityNodeV1,
  setCastleRoomV1,
  tickAttentionFieldV1
} from "./castleAttentionFieldV1.js";
import {
  buildIdentityAttentionEventV1_2,
  initRoomRealityV1_2,
  lockMediaPositionV1_2,
  registerIdentityAttentionEventV1_2,
  __resetRoomRealityForTestV1_2
} from "./castleRoomRealityV1_2.js";
import {
  assignEventToThreadV1_2,
  __resetConversationThreadsForTestV1_2
} from "./castleConversationThreadV1_2.js";

export const CASTLE_FUSION_BUS_SCHEMA_V1 = "castle.multi_stream_fusion_bus.v1";
export const NORMALIZED_EVENT_SCHEMA_V1 = "castle.normalized_event.v1";
export const NORMALIZED_EVENT_PROTOCOL_VERSION_V1 = 1;
export const NORMALIZED_EVENT_PROTOCOL_VERSION_V1_2 = 2;

/** Frozen source registry — equal-weight reality signals. */
export const FUSION_BUS_SOURCE_V1 = Object.freeze({
  MIC: "mic",
  YOUTUBE: "youtube",
  TV: "tv",
  CAMERA: "camera",
  FILE: "file",
  WEB: "web",
  MEDIA: "media"
});

const SOURCE_TO_FROZEN_V1 = Object.freeze({
  mic: FUSION_BUS_SOURCE_V1.MIC,
  youtube: FUSION_BUS_SOURCE_V1.YOUTUBE,
  tv: FUSION_BUS_SOURCE_V1.TV,
  camera: FUSION_BUS_SOURCE_V1.CAMERA,
  file: FUSION_BUS_SOURCE_V1.FILE,
  file_system: FUSION_BUS_SOURCE_V1.FILE,
  filesystem: FUSION_BUS_SOURCE_V1.FILE,
  web: FUSION_BUS_SOURCE_V1.WEB,
  media: FUSION_BUS_SOURCE_V1.MEDIA,
  media_player: FUSION_BUS_SOURCE_V1.MEDIA,
  mediaplayer: FUSION_BUS_SOURCE_V1.MEDIA
});

const IMMUTABLE_LOG_MAX_V1 = 512;
let eventSequenceV1 = 0;

/** Append-only immutable event log — events never mutated after freeze. */
/** @type {object[]} */
const immutableEventLogV1 = [];
/** @type {object | null} */
let activeRoomRefV1 = null;

export function mapFusionBusSourceV1(raw) {
  const attention = mapAttentionSourceV1(raw);
  return SOURCE_TO_FROZEN_V1[attention] || SOURCE_TO_FROZEN_V1[raw] || FUSION_BUS_SOURCE_V1.MIC;
}

function mapTemporalSpanV1(classificationSpan, payloadSpan) {
  if (payloadSpan && Object.values(ATTENTION_TEMPORAL_SPAN_V1).includes(payloadSpan)) {
    return payloadSpan;
  }
  if (classificationSpan === ATTENTION_TEMPORAL_SPAN_V1.LONG) return ATTENTION_TEMPORAL_SPAN_V1.LONG;
  if (classificationSpan === ATTENTION_TEMPORAL_SPAN_V1.INSTANT) return ATTENTION_TEMPORAL_SPAN_V1.INSTANT;
  return ATTENTION_TEMPORAL_SPAN_V1.SHORT;
}

/**
 * NormalizedEventV1 — frozen protocol (immutable reality atom).
 * @param {string} source
 * @param {object} payload
 */
export function normalizeExperienceSignalV1(source, payload = {}) {
  const frozenSource = mapFusionBusSourceV1(source);
  const attentionSource = mapAttentionSourceV1(source);
  const preview = payload.preview
    ? String(payload.preview).slice(0, 160)
    : payload.text
      ? String(payload.text).slice(0, 160)
      : null;
  const timestamp = Number(payload.atMs || payload.timestamp) || Date.now();
  const classification = classifyAttentionEventTypeV1({
    ...payload,
    source: attentionSource,
    preview
  });
  eventSequenceV1 += 1;

  const vector = payload.vector || buildContentVectorV1(preview || payload.text);

  const ownerId = String(payload.ownerId || payload.userId || "user_local");

  return Object.freeze({
    schema: NORMALIZED_EVENT_SCHEMA_V1,
    protocolVersion: NORMALIZED_EVENT_PROTOCOL_VERSION_V1_2,
    id: `evt_${timestamp.toString(36)}_${eventSequenceV1}`,
    source: frozenSource,
    type: classification.type,
    timestamp,
    ownerId,
    threadId: payload.threadId ? String(payload.threadId) : null,
    payload: Object.freeze({
      text: payload.text ? String(payload.text).slice(0, 240) : null,
      mediaPositionMs: Number.isFinite(Number(payload.mediaPositionMs))
        ? Number(payload.mediaPositionMs)
        : null,
      vector: Object.freeze([...vector]),
      preview
    }),
    confidence: Number.isFinite(Number(payload.confidence))
      ? Number(clampConfidenceV1(payload.confidence))
      : 0.5,
    temporalSpan: mapTemporalSpanV1(classification.temporalSpan, payload.temporalSpan),
    rawRef: Object.freeze({ ...payload })
  });
}

function clampConfidenceV1(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function appendImmutableEventV1(event) {
  immutableEventLogV1.push(event);
  if (immutableEventLogV1.length > IMMUTABLE_LOG_MAX_V1) {
    immutableEventLogV1.shift();
  }
}

export function getImmutableEventLogV1() {
  return Object.freeze([...immutableEventLogV1]);
}

export function initCastleRoomV1(roomInput = {}) {
  activeRoomRefV1 = setCastleRoomV1(roomInput);
  initRoomRealityV1_2({
    roomId: roomInput.roomId || activeRoomRefV1?.roomId,
    users: roomInput.users || roomInput.participants?.map((p) => ({ userId: p })),
    rhizohInstances: roomInput.rhizohInstances
  });
  publishFusionBusSnapshotV1();
  return activeRoomRefV1;
}

/**
 * ingest(source, payload) → append-only NormalizedEventV1.
 * Bus does NOT interpret — only normalizes and appends.
 */
export function ingestFusionBusV1(source, payload = {}) {
  const normalized = normalizeExperienceSignalV1(source, payload);
  appendImmutableEventV1(normalized);

  queueRealityNodeV1({
    id: normalized.id,
    source: mapAttentionSourceV1(source),
    preview: normalized.payload.preview,
    text: normalized.payload.text,
    temporalSpan: normalized.temporalSpan,
    contentVector: normalized.payload.vector,
    mediaPositionMs: normalized.payload.mediaPositionMs,
    confidence: normalized.confidence,
    atMs: normalized.timestamp,
    userInitiated: payload.userInitiated || normalized.source === FUSION_BUS_SOURCE_V1.MIC,
    ownerId: normalized.ownerId
  });

  const identityRaw = buildIdentityAttentionEventV1_2(normalized, {
    ...payload,
    ownerId: normalized.ownerId,
    threadId: normalized.threadId,
    salience: payload.salience
  });
  const identityEvent = assignEventToThreadV1_2(identityRaw, {
    threadId: normalized.threadId,
    topicLabel: payload.topicLabel
  });
  registerIdentityAttentionEventV1_2(identityEvent);

  if (Number.isFinite(normalized.payload.mediaPositionMs)) {
    registerMediaSyncV1({
      source: mapAttentionSourceV1(source),
      positionMs: normalized.payload.mediaPositionMs,
      durationMs: payload.durationMs,
      playing: payload.playing !== false
    });
    lockMediaPositionV1_2({
      ownerId: normalized.ownerId,
      source: normalized.source,
      mediaPositionMs: normalized.payload.mediaPositionMs,
      locked: payload.mediaLock !== false
    });
  }

  if (
    normalized.type === ATTENTION_EVENT_TYPE_V1.INTENT ||
    normalized.type === ATTENTION_EVENT_TYPE_V1.EMERGENCY
  ) {
    logVoiceInfoV0("FUSION_BUS_APPEND", {
      id: normalized.id,
      source: normalized.source,
      type: normalized.type,
      preview: normalized.payload.preview
    });
  }

  const busRow = Object.freeze({
    schema: CASTLE_FUSION_BUS_SCHEMA_V1,
    id: normalized.id,
    roomId: activeRoomRefV1?.roomId || "local_room",
    normalized,
    identityEvent,
    atMs: normalized.timestamp
  });

  publishFusionBusSnapshotV1();
  return busRow;
}

export function publishStreamEventV1(event = {}) {
  const row = ingestFusionBusV1(event.source || "mic", event);
  tickAttentionFieldV1(event.atMs || Date.now());
  return row;
}

export function publishNarrativeStreamTickV1(tick = {}) {
  return publishStreamEventV1({
    ...tick,
    source: tick.source || "file",
    temporalSpan: ATTENTION_TEMPORAL_SPAN_V1.LONG,
    userInitiated: false
  });
}

/** Bus-only ingress — no spike/interpretation (moved to Spike Engine). */
export function ingestStreamOnlyV1(input = {}) {
  if (input.text || input.preview) {
    return publishStreamEventV1(input);
  }
  return null;
}

export function getFusionBusSnapshotV1() {
  return Object.freeze({
    schema: CASTLE_FUSION_BUS_SCHEMA_V1,
    identity: "immutable_append_only_bus",
    protocolVersion: NORMALIZED_EVENT_PROTOCOL_VERSION_V1,
    normalizedEventSchema: NORMALIZED_EVENT_SCHEMA_V1,
    immutable: true,
    appendOnly: true,
    room: activeRoomRefV1 || buildCastleRoomV1({ roomId: "local_room" }),
    eventCount: immutableEventLogV1.length,
    attentionField: computeCastleAttentionFieldV1(),
    recentEvents: Object.freeze(immutableEventLogV1.slice(-10)),
    sources: FUSION_BUS_SOURCE_V1
  });
}

function publishFusionBusSnapshotV1() {
  if (typeof window === "undefined") return;
  window.__castle = window.__castle || {};
  window.__castle.fusionBus = getFusionBusSnapshotV1();
  window.__castle.immutableEventLog = getImmutableEventLogV1();
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.fusionBus = getFusionBusSnapshotV1();
}

/** @internal vitest */
export function __resetFusionBusForTestV1() {
  immutableEventLogV1.length = 0;
  activeRoomRefV1 = null;
  eventSequenceV1 = 0;
  __resetRoomRealityForTestV1_2();
  __resetConversationThreadsForTestV1_2();
}
