export const WS_MESSAGE = {
  HELLO: "HELLO",
  WORLD_SNAPSHOT: "WORLD_SNAPSHOT",
  WORLD_DELTA: "WORLD_DELTA",
  WORLD_DELTA_PACKED: "WORLD_DELTA_PACKED",
  WORLD_TICK: "WORLD_TICK",
  /** Rhizoh spine — dünya / varlık yaması (payload: createRhizohSpineEnvelope şeması) */
  WORLD_PATCH: "WORLD_PATCH",
  PRESENCE_UPDATE: "PRESENCE_UPDATE",
  ENTITY_EVENT: "ENTITY_EVENT",
  REALITY_PATCH: "REALITY_PATCH",
  SYSTEM_NOTICE: "SYSTEM_NOTICE",
  NETWORK_TICK: "NETWORK_TICK",
  INPUT_FRAME: "INPUT_FRAME",
  SIGNAL: "SIGNAL",
  PEERS: "PEERS",
  OPEN_DATA_QUERY: "OPEN_DATA_QUERY",
  OPEN_DATA_RESULT: "OPEN_DATA_RESULT",
  RHIZOH_QUERY: "RHIZOH_QUERY",
  RHIZOH_RESULT: "RHIZOH_RESULT",
  BROADCAST_REGISTER: "BROADCAST_REGISTER",
  STUDIO_CUE: "STUDIO_CUE",
  BROADCAST_STATE: "BROADCAST_STATE",
  SPIRAL_JOIN_ROOM: "SPIRAL_JOIN_ROOM",
  SPIRAL_CREATE_CHARACTER: "SPIRAL_CREATE_CHARACTER",
  SPIRAL_STATE: "SPIRAL_STATE",
  COMMAND_TEXT: "COMMAND_TEXT",
  COMMAND: "COMMAND",
  COMMAND_RESULT: "COMMAND_RESULT",
  /** Castle multi-user social room sync (pulse in, merged roster broadcast). */
  CASTLE_SOCIAL_PULSE: "CASTLE_SOCIAL_PULSE",
  CASTLE_SOCIAL_ROOM: "CASTLE_SOCIAL_ROOM",
  /** Sprint C.1 — peer WAL history feed (in) + room fan-out (out). */
  CASTLE_WAL_PEER_FEED: "CASTLE_WAL_PEER_FEED",
  CASTLE_WAL_PEER_ROOM: "CASTLE_WAL_PEER_ROOM",
  /** Voice Engine v3 — single live media lane over gateway WS (client -> gateway). */
  RHIZOH_VOICE_LIVE_START: "RHIZOH_VOICE_LIVE_START",
  RHIZOH_VOICE_LIVE_CHUNK: "RHIZOH_VOICE_LIVE_CHUNK",
  RHIZOH_VOICE_LIVE_STOP: "RHIZOH_VOICE_LIVE_STOP",
  /** Voice Engine v3 — live lane result/error (gateway -> client). */
  RHIZOH_VOICE_LIVE_FINAL: "RHIZOH_VOICE_LIVE_FINAL",
  RHIZOH_VOICE_LIVE_ERROR: "RHIZOH_VOICE_LIVE_ERROR",
  /** Matchmaking v1 — server-authoritative pairing (RESEARCH-ONLY until data-plane READY). */
  MATCH_BEACON_EMIT: "MATCH_BEACON_EMIT",
  MATCH_BEACON_CANCEL: "MATCH_BEACON_CANCEL",
  MATCH_BEACON_ACK: "MATCH_BEACON_ACK",
  MATCH_SESSION_CREATED: "MATCH_SESSION_CREATED",
  MATCH_AI_FALLBACK: "MATCH_AI_FALLBACK",
  MATCH_STATE: "MATCH_STATE",
  MATCH_MOVE: "MATCH_MOVE",
  MATCH_MOVE_ACK: "MATCH_MOVE_ACK",
  MATCH_FINISHED: "MATCH_FINISHED",
  MATCH_ERROR: "MATCH_ERROR",
  ERROR: "ERROR"
};

export const RHIZOH_IMMUTABLE_EVENT_SCHEMA_V0 = "rhizoh.immutable_event.v0";
export const RHIZOH_VOICE_LIVE_CHUNK_SCHEMA_V0 = "rhizoh.voice_live_chunk.v0";

export const RHIZOH_EVENT_POLICY_TAG_V0 = Object.freeze({
  EVENT_ONLY: "event_only",
  ERASABLE_PAYLOAD_REF: "erasable_payload_ref",
  TOMBSTONE: "tombstone"
});

function stableHash32V0(input) {
  const text = String(input || "");
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function rhizohChecksumStringV0(input) {
  return stableHash32V0(input);
}

export function createRhizohAnonActorIdV0(seed = "") {
  return `anon_hash_${stableHash32V0(seed).slice(0, 12)}`;
}

export function createRhizohPayloadRefV0(seed = "") {
  return `ptr_${stableHash32V0(seed).slice(0, 12)}`;
}

/**
 * Immutable event law: no raw personal payload. Store only an anonymized actor
 * and an erasable payload reference/tombstone.
 */
export function createRhizohImmutableEventV0(input = {}) {
  const type = String(input.type || "UNKNOWN_EVENT").trim().toUpperCase() || "UNKNOWN_EVENT";
  const traceId = String(input.traceId || "").slice(0, 128);
  const sessionId = String(input.sessionId || "").slice(0, 128);
  const eventSeq = Math.max(0, Number(input.eventSeq) || 0);
  const actorId =
    input.actorId === "deleted_user"
      ? "deleted_user"
      : String(input.actorId || "").startsWith("anon_hash_")
        ? String(input.actorId)
        : createRhizohAnonActorIdV0(input.actorSeed || sessionId || traceId || type);
  const payloadRef =
    input.payloadRef === null
      ? null
      : input.payloadRef
        ? String(input.payloadRef).slice(0, 96)
        : createRhizohPayloadRefV0(`${sessionId}:${traceId}:${type}:${eventSeq}`);
  const policyTag = Object.values(RHIZOH_EVENT_POLICY_TAG_V0).includes(input.policyTag)
    ? input.policyTag
    : RHIZOH_EVENT_POLICY_TAG_V0.ERASABLE_PAYLOAD_REF;
  const timestamp = Number.isFinite(Number(input.timestamp)) ? Number(input.timestamp) : Date.now();
  return Object.freeze({
    schema: RHIZOH_IMMUTABLE_EVENT_SCHEMA_V0,
    eventId: `evt_${stableHash32V0(`${sessionId}:${traceId}:${type}:${eventSeq}:${timestamp}`)}`,
    actorId,
    type,
    timestamp,
    traceId: traceId || undefined,
    sessionId: sessionId || undefined,
    eventSeq,
    payloadRef,
    policyTag
  });
}

export function createRhizohUserDeletedTombstoneEventV0(input = {}) {
  return createRhizohImmutableEventV0({
    ...input,
    type: "USER_DELETED",
    actorId: "deleted_user",
    payloadRef: null,
    policyTag: RHIZOH_EVENT_POLICY_TAG_V0.TOMBSTONE
  });
}

export function createRhizohVoiceLiveChunkPayloadV0(input = {}) {
  const audioBase64 = String(input.audioBase64 || "");
  const chunkIndex = Math.max(1, Number(input.chunkIndex ?? input.index) || 1);
  const timestamp = Number.isFinite(Number(input.timestamp)) ? Number(input.timestamp) : Date.now();
  const checksum = rhizohChecksumStringV0(`${input.sessionId || ""}:${chunkIndex}:${audioBase64}`);
  return Object.freeze({
    schema: RHIZOH_VOICE_LIVE_CHUNK_SCHEMA_V0,
    sessionId: String(input.sessionId || "").slice(0, 128),
    traceId: String(input.traceId || "").slice(0, 128),
    chunkIndex,
    timestamp,
    checksum,
    audioBase64,
    mimeType: String(input.mimeType || "audio/webm").slice(0, 80)
  });
}

export function validateRhizohVoiceLiveChunkPayloadV0(payload = {}, opts = {}) {
  const sessionId = String(payload.sessionId || "").trim();
  const audioBase64 = String(payload.audioBase64 || "").trim();
  const chunkIndex = Number(payload.chunkIndex ?? payload.index);
  if (!sessionId) return { ok: false, error: "session_id_required" };
  if (!Number.isInteger(chunkIndex) || chunkIndex < 1) return { ok: false, error: "chunk_index_invalid" };
  if (Number.isInteger(opts.expectedChunkIndex) && chunkIndex !== opts.expectedChunkIndex) {
    return {
      ok: false,
      error: "chunk_out_of_order",
      expectedChunkIndex: opts.expectedChunkIndex,
      chunkIndex
    };
  }
  if (!audioBase64) return { ok: false, error: "audio_base64_required" };
  if (!payload.checksum) return { ok: false, error: "chunk_checksum_required", chunkIndex };
  const expectedChecksum = rhizohChecksumStringV0(`${sessionId}:${chunkIndex}:${audioBase64}`);
  if (payload.checksum && String(payload.checksum) !== expectedChecksum) {
    return { ok: false, error: "chunk_checksum_mismatch", chunkIndex };
  }
  return { ok: true, sessionId, chunkIndex, expectedChecksum };
}

export const COMMAND = {
  SPAWN_AGENT: "SPAWN_AGENT",
  LIST_CASTLES: "LIST_CASTLES",
  SPAWN_ENTITY: "SPAWN_ENTITY",
  CREATE_CASTLE: "CREATE_CASTLE"
};

/**
 * Presence room mesh (gateway): REST paths `/presence/mesh/*`; payload `{ node?, projectionPatch?, seq, roomUid }` on deltas.
 * SSE `data` JSON uses `type` in {@link PRESENCE_MESH_SSE}.
 */
export const PRESENCE_MESH = {
  JOIN: "JOIN",
  LEAVE: "LEAVE",
  SNAPSHOT: "SNAPSHOT",
  DELTA: "DELTA",
  SUBSCRIBE: "SUBSCRIBE",
  REPLAY: "REPLAY"
};

/** SSE stream (`GET /presence/mesh/subscribe`) — each event is JSON in `data:`. */
export const PRESENCE_MESH_SSE = {
  HELLO: "hello",
  DELTA: "delta",
  MEMBER_JOIN: "member_join",
  MEMBER_LEAVE: "member_leave"
};

export function createEnvelope(type, payload = {}) {
  return { type, payload, ts: Date.now() };
}

/** Rhizoh spine WS — payload.scope için sabitler */
export const RHIZOH_SPINE_SCOPE = {
  USER: "user",
  ROOM: "room",
  GLOBAL: "global"
};

/**
 * Rhizoh spine / world bus — dış kabuk her zaman `createEnvelope` ile aynı: `{ type, payload, ts }`.
 * İstemci `payload` içinden `v`, `traceId`, `source`, `scope` okur; tip-özel veri aynı nesnede (örn. `patch`, `entity`).
 *
 * @param {string} type - WS_MESSAGE.WORLD_PATCH | PRESENCE_UPDATE | ENTITY_EVENT | REALITY_PATCH | SYSTEM_NOTICE
 * @param {Record<string, unknown>} [spineFields]
 * @param {string} [spineFields.traceId]
 * @param {string} [spineFields.source] - varsayılan rhizoh.gateway
 * @param {"user"|"room"|"global"} [spineFields.scope] - varsayılan global
 */
export function createRhizohSpineEnvelope(type, spineFields = {}) {
  const { traceId, source = "rhizoh.gateway", scope = RHIZOH_SPINE_SCOPE.GLOBAL, ...rest } = spineFields;
  return createEnvelope(type, {
    ...rest,
    v: 1,
    ...(traceId ? { traceId: String(traceId) } : {}),
    source: String(source || "rhizoh.gateway"),
    scope: scope === "user" || scope === "room" || scope === "global" ? scope : RHIZOH_SPINE_SCOPE.GLOBAL
  });
}

export function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function quantize2(value) {
  return Math.round(value * 100) / 100;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
