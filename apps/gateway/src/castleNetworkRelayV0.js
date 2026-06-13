/**
 * Castle Network relay v0 — gateway signaling for REALTIME + PEER_* messages.
 * Sprint #34 Phase 1: Castle A ↔ Gateway ↔ Castle B
 */

import { WS_MESSAGE, createEnvelope } from "@castle/protocol";

export const CASTLE_NETWORK_RELAY_SCHEMA_V0 = "castle.network_relay.v0";

export const CASTLE_NETWORK_SIGNAL_V0 = Object.freeze({
  REALTIME: "REALTIME",
  PEER_JOIN: "PEER_JOIN",
  PEER_LEAVE: "PEER_LEAVE",
  PEER_DISCOVER: "PEER_DISCOVER",
  PEER_HEARTBEAT: "PEER_HEARTBEAT"
});

export const CASTLE_PRESENCE_STATE_V0 = Object.freeze({
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  THINKING: "THINKING",
  BROADCASTING: "BROADCASTING",
  SYNCING: "SYNCING"
});

const MEMBER_TTL_MS = 90_000;
const MAX_REALTIME_BYTES = 24 * 1024;
const MAX_ROSTER = 128;

/** @type {Map<string, { seq: number, members: Map<string, object> }>} */
const networkRooms = new Map();

function nowMs() {
  return Date.now();
}

function normalizeRoomKey(key) {
  return String(key || "world_space_c2c_v0").slice(0, 64);
}

function normalizeCastleId(socket, payload) {
  return String(
    payload?.castleId || payload?.presence?.castleId || socket.auth?.user?.uid || socket.clientId || "anonymous"
  ).slice(0, 64);
}

function normalizeUserId(socket, payload) {
  return String(payload?.userId || socket.auth?.user?.uid || socket.clientId || "anonymous").slice(0, 128);
}

function ensureRoom(roomKey) {
  const key = normalizeRoomKey(roomKey);
  let room = networkRooms.get(key);
  if (!room) {
    room = { seq: 0, members: new Map() };
    networkRooms.set(key, room);
  }
  return room;
}

function pruneRoom(room) {
  const now = nowMs();
  for (const [cid, m] of [...room.members.entries()]) {
    if (now - m.lastMs > MEMBER_TTL_MS) room.members.delete(cid);
  }
}

/**
 * @param {object} member
 */
function publicPresenceFromMemberV0(member) {
  return Object.freeze({
    castleId: member.castleId,
    userId: member.userId,
    gatewayClientId: member.clientId,
    state: member.state,
    viewers: member.viewers,
    region: member.region,
    lat: member.lat,
    lon: member.lon,
    lastMs: member.lastMs
  });
}

/**
 * @param {string} roomKey
 */
export function listCastleNetworkPresenceV0(roomKey) {
  const room = networkRooms.get(normalizeRoomKey(roomKey));
  if (!room) return Object.freeze([]);
  pruneRoom(room);
  return Object.freeze(
    [...room.members.values()].slice(0, MAX_ROSTER).map((m) => publicPresenceFromMemberV0(m))
  );
}

/**
 * @param {import("ws").WebSocket} socket
 * @param {Record<string, unknown>} payload
 */
export function validateCastleNetworkSignalPayloadV0(socket, payload) {
  if (!payload || typeof payload !== "object") return "Invalid network payload.";
  const signalType = String(payload.signalType || "");
  if (!Object.values(CASTLE_NETWORK_SIGNAL_V0).includes(signalType)) return "Invalid network signal type.";

  if (signalType === CASTLE_NETWORK_SIGNAL_V0.REALTIME) {
    const body = payload.realtime || payload.message;
    if (!body || typeof body !== "object") return "REALTIME message required.";
    if (JSON.stringify(body).length > MAX_REALTIME_BYTES) return "REALTIME payload too large.";
    const to = payload.to;
    const broadcast = payload.broadcast === true || to === "*" || to === "room";
    if (!broadcast && (typeof to !== "string" || to.length < 3)) return "REALTIME destination required.";
    return null;
  }

  if (signalType === CASTLE_NETWORK_SIGNAL_V0.PEER_DISCOVER) return null;

  const presence = payload.presence && typeof payload.presence === "object" ? payload.presence : {};
  const state = String(presence.state || payload.state || CASTLE_PRESENCE_STATE_V0.ONLINE).slice(0, 32);
  if (!Object.values(CASTLE_PRESENCE_STATE_V0).includes(state) && state !== "ONLINE") {
    /* allow custom future states but clamp unknown to ONLINE */
  }
  if (JSON.stringify(payload).length > 12 * 1024) return "Network payload too large.";
  if (!normalizeCastleId(socket, payload)) return "castleId required.";
  return null;
}

/**
 * @param {import("ws").WebSocketServer} wss
 * @param {string} roomKey
 * @param {object} envelopePayload
 * @param {string} [exceptClientId]
 */
function broadcastToRoom(wss, roomKey, envelopePayload, exceptClientId = "") {
  const room = networkRooms.get(normalizeRoomKey(roomKey));
  if (!room) return;
  const memberIds = new Set(room.members.keys());
  const encoded = JSON.stringify(createEnvelope(WS_MESSAGE.SIGNAL, envelopePayload));
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;
    if (exceptClientId && client.clientId === exceptClientId) continue;
    if (memberIds.has(client.clientId)) client.send(encoded);
  }
}

function unicastToClient(wss, toClientId, envelopePayload) {
  const encoded = JSON.stringify(createEnvelope(WS_MESSAGE.SIGNAL, envelopePayload));
  for (const client of wss.clients) {
    if (client.clientId === toClientId && client.readyState === 1) {
      client.send(encoded);
      return true;
    }
  }
  return false;
}

/**
 * @param {import("ws").WebSocket} socket
 * @param {Record<string, unknown>} payload
 * @param {import("ws").WebSocketServer} wss
 * @param {import("ws").WebSocketServer} wss
 */
export function handleCastleNetworkSignalV0(socket, payload, wss) {
  const signalType = String(payload.signalType || "");
  const roomKey = normalizeRoomKey(payload.castleRoomKey);
  const room = ensureRoom(roomKey);
  const now = nowMs();
  const castleId = normalizeCastleId(socket, payload);
  const userId = normalizeUserId(socket, payload);
  const presenceRaw =
    payload.presence && typeof payload.presence === "object" ? payload.presence : payload;
  const state = String(presenceRaw.state || CASTLE_PRESENCE_STATE_V0.ONLINE).slice(0, 32);
  const region = String(presenceRaw.region || payload.region || "GLOBAL").slice(0, 16);
  const viewers = Math.max(0, Math.min(9999, Number(presenceRaw.viewers ?? payload.viewers) || 0));
  const lat = Number(presenceRaw.lat ?? payload.lat);
  const lon = Number(presenceRaw.lon ?? payload.lon);

  if (signalType === CASTLE_NETWORK_SIGNAL_V0.PEER_JOIN || signalType === CASTLE_NETWORK_SIGNAL_V0.PEER_HEARTBEAT) {
    room.seq += 1;
    room.members.set(socket.clientId, {
      clientId: socket.clientId,
      userId,
      castleId,
      state,
      region,
      viewers,
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
      lastMs: now
    });
    pruneRoom(room);
    if (signalType === CASTLE_NETWORK_SIGNAL_V0.PEER_JOIN) {
      broadcastToRoom(
        wss,
        roomKey,
        {
          signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_JOIN,
          castleRoomKey: roomKey,
          from: socket.clientId,
          presence: publicPresenceFromMemberV0(room.members.get(socket.clientId))
        },
        socket.clientId
      );
    }
    return { handled: true, roster: listCastleNetworkPresenceV0(roomKey) };
  }

  if (signalType === CASTLE_NETWORK_SIGNAL_V0.PEER_LEAVE) {
    room.members.delete(socket.clientId);
    broadcastToRoom(wss, roomKey, {
      signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_LEAVE,
      castleRoomKey: roomKey,
      from: socket.clientId,
      castleId
    });
    return { handled: true };
  }

  if (signalType === CASTLE_NETWORK_SIGNAL_V0.PEER_DISCOVER) {
    pruneRoom(room);
    const roster = listCastleNetworkPresenceV0(roomKey);
    unicastToClient(wss, socket.clientId, {
      signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_DISCOVER,
      castleRoomKey: roomKey,
      from: "gateway",
      roster,
      ts: now
    });
    return { handled: true, roster };
  }

  if (signalType === CASTLE_NETWORK_SIGNAL_V0.REALTIME) {
    const realtime = payload.realtime || payload.message;
    const relayBody = {
      signalType: CASTLE_NETWORK_SIGNAL_V0.REALTIME,
      castleRoomKey: roomKey,
      from: socket.clientId,
      realtime
    };
    if (payload.broadcast === true || payload.to === "*" || payload.to === "room") {
      broadcastToRoom(wss, roomKey, relayBody, socket.clientId);
    } else {
      unicastToClient(wss, String(payload.to), relayBody);
    }
    return { handled: true };
  }

  return { handled: false };
}

export function removeCastleNetworkClientV0(clientId, wss) {
  const cid = String(clientId || "");
  if (!cid) return;
  for (const [roomKey, room] of networkRooms.entries()) {
    const member = room.members.get(cid);
    if (!member) continue;
    room.members.delete(cid);
    if (wss) {
      broadcastToRoom(
        wss,
        roomKey,
        {
          signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_LEAVE,
          castleRoomKey: roomKey,
          from: cid,
          castleId: member.castleId
        },
        cid
      );
    }
  }
}

export function resetCastleNetworkRelayForTestV0() {
  networkRooms.clear();
}
