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
  ERROR: "ERROR"
};

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
