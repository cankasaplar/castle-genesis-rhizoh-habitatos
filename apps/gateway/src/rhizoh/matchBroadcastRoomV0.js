/**
 * Match broadcast room v0 — session-scoped fan-out + presence (P0 world propagation).
 * RESEARCH-ONLY until data-plane READY.
 * @see docs/RHIZOH_MATCH_BROADCAST_LAYER_V0.md
 */

import { WS_MESSAGE, createEnvelope } from "@castle/protocol";

export const MATCH_BROADCAST_ROOM_SCHEMA_V0 = "castle.rhizoh.match_broadcast_room.v0";

export const MATCH_OBSERVER_ROLE_V0 = Object.freeze({
  PLAYER: "player",
  OBSERVER: "observer",
  AI_NODE: "ai_node"
});

/** @type {Map<string, Map<import('ws').WebSocket, { role: string, playerId: string | null, joinedAtMs: number }>>} */
const sessionRoomsV0 = new Map();

/** @type {WeakMap<import('ws').WebSocket, string>} */
const socketSessionV0 = new WeakMap();

function getRoom(sessionId) {
  const id = String(sessionId || "").trim();
  if (!id) return null;
  if (!sessionRoomsV0.has(id)) {
    sessionRoomsV0.set(id, new Map());
  }
  return sessionRoomsV0.get(id);
}

/**
 * @param {import('ws').WebSocket} socket
 * @param {{ sessionId: string, role?: string, playerId?: string | null }} input
 */
export function joinMatchBroadcastRoomV0(socket, input = {}) {
  const sessionId = String(input.sessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({ ok: false, reason: "missing_session_id" });
  }

  const prev = socketSessionV0.get(socket);
  if (prev && prev !== sessionId) {
    leaveMatchBroadcastRoomV0(socket);
  }

  const role = Object.values(MATCH_OBSERVER_ROLE_V0).includes(input.role)
    ? input.role
    : MATCH_OBSERVER_ROLE_V0.OBSERVER;
  const playerId = input.playerId ? String(input.playerId) : null;

  const room = getRoom(sessionId);
  room.set(
    socket,
    Object.freeze({ role, playerId, joinedAtMs: Date.now() })
  );
  socketSessionV0.set(socket, sessionId);

  return Object.freeze({
    ok: true,
    sessionId,
    role,
    playerId,
    presenceCount: room.size
  });
}

/**
 * @param {import('ws').WebSocket} socket
 */
export function leaveMatchBroadcastRoomV0(socket) {
  const sessionId = socketSessionV0.get(socket);
  if (!sessionId) {
    return Object.freeze({ ok: true, skipped: true });
  }
  const room = sessionRoomsV0.get(sessionId);
  room?.delete(socket);
  if (room && room.size === 0) {
    sessionRoomsV0.delete(sessionId);
  }
  socketSessionV0.delete(socket);
  return Object.freeze({ ok: true, sessionId });
}

/**
 * @param {string} sessionId
 */
export function getMatchSessionPresenceV0(sessionId) {
  const room = sessionRoomsV0.get(String(sessionId || "").trim());
  if (!room) {
    return Object.freeze({
      schema: MATCH_BROADCAST_ROOM_SCHEMA_V0,
      sessionId,
      members: Object.freeze([]),
      count: 0
    });
  }
  const members = [...room.entries()].map(([socket, meta]) =>
    Object.freeze({
      gatewayClientId: socket.clientId ?? null,
      role: meta.role,
      playerId: meta.playerId,
      joinedAtMs: meta.joinedAtMs
    })
  );
  return Object.freeze({
    schema: MATCH_BROADCAST_ROOM_SCHEMA_V0,
    sessionId,
    members: Object.freeze(members),
    count: members.length
  });
}

/**
 * Session-scoped fan-out — world propagation layer.
 * @param {string} sessionId
 * @param {object} envelope
 * @param {{ exceptSocket?: import('ws').WebSocket | null }} [opts]
 */
export function fanOutMatchSessionV0(sessionId, envelope, opts = {}) {
  const room = sessionRoomsV0.get(String(sessionId || "").trim());
  if (!room || room.size === 0) {
    return Object.freeze({ ok: true, delivered: 0, skipped: true, reason: "empty_room" });
  }

  const raw = JSON.stringify(envelope);
  let delivered = 0;
  for (const socket of room.keys()) {
    if (opts.exceptSocket && socket === opts.exceptSocket) continue;
    if (socket.readyState === 1) {
      socket.send(raw);
      delivered += 1;
    }
  }
  return Object.freeze({ ok: true, delivered, sessionId, type: envelope?.type ?? null });
}

/**
 * @param {import('ws').WebSocket} socket
 * @param {{ sessionId: string, role?: string, playerId?: string | null }} message
 * @param {import('ws').WebSocketServer} wss
 */
export function handleMatchSessionJoinV0(socket, message, wss) {
  const joined = joinMatchBroadcastRoomV0(socket, {
    sessionId: message.sessionId || message.payload?.sessionId,
    role: message.payload?.role,
    playerId: message.payload?.playerId
  });
  if (!joined.ok) {
    socket.send(
      JSON.stringify(
        createEnvelope(WS_MESSAGE.MATCH_ERROR, {
          error: joined.reason,
          interpretationOnly: true
        })
      )
    );
    return joined;
  }

  const presence = getMatchSessionPresenceV0(joined.sessionId);
  const presenceEnvelope = createEnvelope(WS_MESSAGE.MATCH_SESSION_PRESENCE, {
    schema: MATCH_BROADCAST_ROOM_SCHEMA_V0,
    sessionId: joined.sessionId,
    members: presence.members,
    count: presence.count,
    interpretationOnly: true
  });
  presenceEnvelope.sessionId = joined.sessionId;

  socket.send(JSON.stringify(presenceEnvelope));
  fanOutMatchSessionV0(joined.sessionId, presenceEnvelope, { exceptSocket: socket });

  return Object.freeze({ ok: true, joined, presence });
}

/**
 * Fan-out castle chess invite to connected gateway peers (inbox projection).
 * @param {import('ws').WebSocket} socket
 * @param {object} message
 * @param {import('ws').WebSocketServer} wss
 */
export function handleMatchCastleInviteV0(socket, message, wss) {
  const payload = message.payload || {};
  const sessionId = String(payload.sessionId || message.sessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({ ok: false, reason: "missing_session_id" });
  }

  const envelope = createEnvelope(WS_MESSAGE.MATCH_CASTLE_INVITE, {
    ...payload,
    sessionId,
    fromGatewayClientId: socket.clientId ?? null,
    interpretationOnly: true
  });
  envelope.sessionId = sessionId;
  envelope.traceId = message.traceId || `match_invite_fanout_${Date.now()}`;

  const targetGatewayClientId = String(payload.targetGatewayClientId || "").trim();
  let delivered = 0;
  for (const client of wss.clients) {
    if (client === socket || client.readyState !== 1) continue;
    if (targetGatewayClientId && client.clientId !== targetGatewayClientId) continue;
    client.send(JSON.stringify(envelope));
    delivered += 1;
  }

  return Object.freeze({ ok: true, delivered, sessionId, targeted: Boolean(targetGatewayClientId) });
}

/** @internal vitest */
export function clearMatchBroadcastRoomsForTestV0() {
  sessionRoomsV0.clear();
}
