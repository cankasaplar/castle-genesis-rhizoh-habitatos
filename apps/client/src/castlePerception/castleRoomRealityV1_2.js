/**
 * Castle Room Reality v1.2 — shared multi-agent perception container.
 * Room = users + Rhizoh instances + media streams + shared attention + conflict graph.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_2.md
 */

export const CASTLE_ROOM_REALITY_SCHEMA_V1_2 = "castle.room_reality.v1.2";

export const ROOM_PARTICIPANT_KIND_V1_2 = Object.freeze({
  USER: "user",
  RHIZOH: "rhizoh"
});

/** @type {object | null} */
let activeRoomRealityV1_2 = null;
/** @type {Map<string, object[]>} ownerId → identity events */
const sharedAttentionByOwnerV1_2 = new Map();
/** @type {object[]} */
const conflictEdgesV1_2 = [];
const CONFLICT_EDGE_MAX_V1_2 = 128;
const EVENTS_PER_OWNER_MAX_V1_2 = 48;

/**
 * @param {object} input
 */
export function buildRoomRealityV1_2(input = {}) {
  const roomId = String(input.roomId || "local_room").trim();
  const users = Array.isArray(input.users)
    ? input.users.map((u) =>
        Object.freeze({
          userId: String(u.userId || u.id),
          role: String(u.role || "guest"),
          affinityWeight: Number(u.affinityWeight) || 1
        })
      )
    : Object.freeze([Object.freeze({ userId: "user_local", role: "host", affinityWeight: 1 })]);

  const rhizohInstances = Array.isArray(input.rhizohInstances)
    ? input.rhizohInstances.map((r) =>
        Object.freeze({
          instanceId: String(r.instanceId || r.id),
          boundUserId: r.boundUserId ? String(r.boundUserId) : null,
          role: String(r.role || "companion")
        })
      )
    : Object.freeze([
        Object.freeze({ instanceId: "rhizoh_local", boundUserId: "user_local", role: "companion" })
      ]);

  return Object.freeze({
    schema: CASTLE_ROOM_REALITY_SCHEMA_V1_2,
    roomId,
    users: Object.freeze(users),
    rhizohInstances: Object.freeze(rhizohInstances),
    mediaStreams: Object.freeze([]),
    activeRealityOwnerId: input.activeRealityOwnerId || users[0]?.userId || "user_local",
    primaryThreadId: input.primaryThreadId || null,
    atMs: Date.now()
  });
}

/**
 * @param {object} roomInput
 */
export function initRoomRealityV1_2(roomInput = {}) {
  activeRoomRealityV1_2 = buildRoomRealityV1_2(roomInput);
  publishRoomRealityV1_2();
  return activeRoomRealityV1_2;
}

export function getRoomRealityV1_2() {
  return activeRoomRealityV1_2 || buildRoomRealityV1_2({ roomId: "local_room" });
}

/**
 * Identity-bound attention event — "who does this spike belong to?"
 * @param {object} normalized
 * @param {object} payload
 */
export function buildIdentityAttentionEventV1_2(normalized, payload = {}) {
  const room = getRoomRealityV1_2();
  const ownerId = String(payload.ownerId || payload.userId || room.activeRealityOwnerId || "user_local");
  const rhizohInstanceId = payload.rhizohInstanceId
    ? String(payload.rhizohInstanceId)
    : room.rhizohInstances[0]?.instanceId || "rhizoh_local";

  return Object.freeze({
    schema: "castle.identity_attention_event.v1.2",
    eventId: normalized.id,
    source: normalized.source,
    ownerId,
    rhizohInstanceId,
    threadId: payload.threadId ? String(payload.threadId) : null,
    type: normalized.type,
    intent: normalized.type,
    salience: Number(payload.salience) || normalized.confidence || 0.5,
    timestamp: normalized.timestamp,
    preview: normalized.payload?.preview || null,
    mediaPositionMs: normalized.payload?.mediaPositionMs ?? null
  });
}

/**
 * Register identity event into per-owner shared attention field.
 * @param {object} identityEvent
 */
export function registerIdentityAttentionEventV1_2(identityEvent) {
  const ownerId = identityEvent.ownerId;
  if (!sharedAttentionByOwnerV1_2.has(ownerId)) {
    sharedAttentionByOwnerV1_2.set(ownerId, []);
  }
  const list = sharedAttentionByOwnerV1_2.get(ownerId);
  list.push(identityEvent);
  if (list.length > EVENTS_PER_OWNER_MAX_V1_2) list.shift();

  recordConflictEdgeV1_2(identityEvent);
  publishRoomRealityV1_2();
  return identityEvent;
}

function recordConflictEdgeV1_2(identityEvent) {
  if (identityEvent.type !== "intent" && identityEvent.type !== "emergency") return;

  for (const [otherOwner, events] of sharedAttentionByOwnerV1_2.entries()) {
    if (otherOwner === identityEvent.ownerId) continue;
    const recentIntent = events.slice(-3).find((e) => e.type === "intent" || e.type === "emergency");
    if (!recentIntent) continue;
    if (Math.abs(identityEvent.timestamp - recentIntent.timestamp) > 30_000) continue;

    conflictEdgesV1_2.push(
      Object.freeze({
        fromOwner: identityEvent.ownerId,
        toOwner: otherOwner,
        conflictType: "parallel_intent",
        weight: Number(
          ((identityEvent.salience + recentIntent.salience) / 2).toFixed(3)
        ),
        atMs: identityEvent.timestamp
      })
    );
    if (conflictEdgesV1_2.length > CONFLICT_EDGE_MAX_V1_2) conflictEdgesV1_2.shift();
  }
}

/**
 * Media position lock per owner — YouTube/TV/audiobook sync isolation.
 * @param {object} lock
 */
export function lockMediaPositionV1_2(lock = {}) {
  const room = getRoomRealityV1_2();
  const ownerId = String(lock.ownerId || "user_local");
  const source = String(lock.source || "youtube");
  const entry = Object.freeze({
    streamId: `${ownerId}:${source}`,
    ownerId,
    source,
    mediaPositionMs: Number.isFinite(Number(lock.mediaPositionMs)) ? Number(lock.mediaPositionMs) : 0,
    locked: lock.locked !== false,
    atMs: Date.now()
  });

  const streams = [...(room.mediaStreams || [])].filter((s) => s.streamId !== entry.streamId);
  streams.push(entry);

  activeRoomRealityV1_2 = Object.freeze({
    ...room,
    mediaStreams: Object.freeze(streams)
  });
  publishRoomRealityV1_2();
  return entry;
}

export function getMediaLockV1_2(ownerId, source) {
  const room = getRoomRealityV1_2();
  return room.mediaStreams?.find((s) => s.ownerId === ownerId && s.source === source) || null;
}

export function getSharedAttentionFieldV1_2() {
  /** @type {Record<string, object[]>} */
  const byOwner = {};
  for (const [ownerId, events] of sharedAttentionByOwnerV1_2.entries()) {
    byOwner[ownerId] = Object.freeze([...events.slice(-8)]);
  }
  return Object.freeze(byOwner);
}

export function getConflictGraphV1_2() {
  return Object.freeze({
    edges: Object.freeze(conflictEdgesV1_2.slice(-24).map((e) => Object.freeze({ ...e })))
  });
}

export function setActiveRealityOwnerV1_2(ownerId) {
  const room = getRoomRealityV1_2();
  activeRoomRealityV1_2 = Object.freeze({
    ...room,
    activeRealityOwnerId: String(ownerId)
  });
  publishRoomRealityV1_2();
  return activeRoomRealityV1_2;
}

export function getRoomRealitySnapshotV1_2() {
  const room = getRoomRealityV1_2();
  return Object.freeze({
    schema: CASTLE_ROOM_REALITY_SCHEMA_V1_2,
    room,
    sharedAttentionField: getSharedAttentionFieldV1_2(),
    conflictGraph: getConflictGraphV1_2()
  });
}

function publishRoomRealityV1_2() {
  if (typeof window === "undefined") return;
  window.__castle = window.__castle || {};
  window.__castle.roomReality = getRoomRealitySnapshotV1_2();
}

/** @internal vitest */
export function __resetRoomRealityForTestV1_2() {
  activeRoomRealityV1_2 = null;
  sharedAttentionByOwnerV1_2.clear();
  conflictEdgesV1_2.length = 0;
}
