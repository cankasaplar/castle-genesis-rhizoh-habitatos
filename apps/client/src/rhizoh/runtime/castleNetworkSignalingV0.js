/**
 * Castle Network signaling client v0 — PEER_* + REALTIME over gateway SIGNAL relay.
 */

import { CASTLE_C2C_ROOM_KEY_V0 } from "../../castleSocial/castleC2cSignalingChannelV0.js";
import {
  CASTLE_C2C_MESSAGE_TYPE_V0,
  ingestCastleC2cRealtimeMessageV0,
  registerCastleC2cRealtimeOutboundV0
} from "../../castleSocial/castleC2cRealtimeBusV0.js";
import {
  CASTLE_PRESENCE_STATE_V0,
  removeCastlePresenceV0,
  upsertCastlePresenceV0
} from "./castlePresenceRegistryV0.js";
import { readRhizohTowerLiveStatusV0 } from "./rhizohTowerLiveStatusV0.js";

export const CASTLE_NETWORK_SIGNAL_V0 = Object.freeze({
  REALTIME: "REALTIME",
  PEER_JOIN: "PEER_JOIN",
  PEER_LEAVE: "PEER_LEAVE",
  PEER_DISCOVER: "PEER_DISCOVER",
  PEER_HEARTBEAT: "PEER_HEARTBEAT"
});

export const CASTLE_NETWORK_SIGNALING_SCHEMA_V0 = "castle.network_signaling.v0";

/** @type {import("../../castleSocial/castleC2cSignalingChannelV0.js").ReturnType<import("../../castleSocial/castleC2cSignalingChannelV0.js").createCastleC2cSignalingChannelV0> | null} */
let channelRefV0 = null;
let heartbeatTimerV0 = 0;
let disposedV0 = false;

function readLocalCastlePresenceV0(userId) {
  const geo =
    typeof window !== "undefined" && window.__CASTLE_NEXUS_GEO__
      ? window.__CASTLE_NEXUS_GEO__
      : null;
  const tower = readRhizohTowerLiveStatusV0();
  let state = CASTLE_PRESENCE_STATE_V0.ONLINE;
  if (tower.status === "THINKING") state = CASTLE_PRESENCE_STATE_V0.THINKING;
  else if (tower.status === "SYNCING") state = CASTLE_PRESENCE_STATE_V0.SYNCING;
  else if (tower.status === "OFFLINE") state = CASTLE_PRESENCE_STATE_V0.OFFLINE;

  return Object.freeze({
    castleId: String(userId || "castle_local").slice(0, 64),
    userId: String(userId || "").slice(0, 128),
    state,
    region:
      typeof navigator !== "undefined" && String(navigator.language || "").toLowerCase().startsWith("tr")
        ? "TR"
        : "GLOBAL",
    viewers: 0,
    lat: geo && Number.isFinite(geo.lat) ? geo.lat : null,
    lon: geo && Number.isFinite(geo.lon) ? geo.lon : null,
    lastMs: Date.now()
  });
}

/**
 * @param {object} channel — castle C2C signaling channel
 * @param {string} userId
 */
function sendNetworkSignalV0(channel, payload) {
  if (!channel?.sendSignal) return false;
  return channel.sendSignal({
    castleRoomKey: CASTLE_C2C_ROOM_KEY_V0,
    ...payload
  });
}

function handleIncomingNetworkSignalV0(payload = {}) {
  const signalType = String(payload.signalType || "");
  if (signalType === CASTLE_NETWORK_SIGNAL_V0.PEER_JOIN || signalType === CASTLE_NETWORK_SIGNAL_V0.PEER_HEARTBEAT) {
    if (payload.presence) upsertCastlePresenceV0(payload.presence);
    return;
  }
  if (signalType === CASTLE_NETWORK_SIGNAL_V0.PEER_LEAVE) {
    if (payload.castleId) removeCastlePresenceV0(payload.castleId);
    return;
  }
  if (signalType === CASTLE_NETWORK_SIGNAL_V0.PEER_DISCOVER && Array.isArray(payload.roster)) {
    for (const row of payload.roster) upsertCastlePresenceV0(row);
    return;
  }
  if (signalType === CASTLE_NETWORK_SIGNAL_V0.REALTIME && payload.realtime) {
    const rt = payload.realtime;
    ingestCastleC2cRealtimeMessageV0({
      type: rt.type,
      payload: rt.payload || {},
      peerUid: rt.peerUid || payload.from || ""
    });
  }
}

function sendPeerDiscoverV0() {
  if (!channelRefV0) return;
  sendNetworkSignalV0(channelRefV0, { signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_DISCOVER });
}

function sendPeerHeartbeatV0(userId) {
  if (!channelRefV0) return;
  const presence = readLocalCastlePresenceV0(userId);
  upsertCastlePresenceV0(presence);
  sendNetworkSignalV0(channelRefV0, {
    signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_HEARTBEAT,
    userId,
    castleId: presence.castleId,
    presence
  });
}

function sendPeerJoinV0(userId) {
  if (!channelRefV0) return;
  const presence = readLocalCastlePresenceV0(userId);
  upsertCastlePresenceV0(presence);
  sendNetworkSignalV0(channelRefV0, {
    signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_JOIN,
    userId,
    castleId: presence.castleId,
    presence
  });
  sendPeerDiscoverV0();
}

function sendPeerLeaveV0(userId) {
  if (!channelRefV0) return;
  sendNetworkSignalV0(channelRefV0, {
    signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_LEAVE,
    userId,
    castleId: String(userId || "").slice(0, 64)
  });
}

function sendRealtimeRelayV0(msg) {
  if (!channelRefV0) return false;
  const peerUid = String(msg.peerUid || "").trim();
  const peerClientId = peerUid ? channelRefV0.resolveClientIdForUserV0(peerUid) : "";
  return sendNetworkSignalV0(channelRefV0, {
    signalType: CASTLE_NETWORK_SIGNAL_V0.REALTIME,
    to: peerClientId || (peerUid ? "" : "room"),
    broadcast: !peerClientId,
    realtime: Object.freeze({
      type: msg.type,
      payload: msg.payload,
      peerUid: msg.peerUid || ""
    })
  });
}

/**
 * Attach network layer to an existing C2C signaling channel.
 * @param {ReturnType<import("../../castleSocial/castleC2cSignalingChannelV0.js").createCastleC2cSignalingChannelV0>} channel
 * @param {string} userId
 */
export function bootCastleNetworkSignalingV0(channel, userId) {
  if (!channel || !String(userId || "").trim()) return;
  disposedV0 = false;
  channelRefV0 = channel;
  registerCastleC2cRealtimeOutboundV0(sendRealtimeRelayV0);

  window.setTimeout(() => {
    if (!disposedV0) {
      sendPeerJoinV0(userId);
      sendPeerDiscoverV0();
    }
  }, 400);

  if (heartbeatTimerV0) window.clearInterval(heartbeatTimerV0);
  heartbeatTimerV0 = window.setInterval(() => {
    if (!disposedV0) sendPeerHeartbeatV0(userId);
  }, 15_000);

  return Object.freeze({
    schema: CASTLE_NETWORK_SIGNALING_SCHEMA_V0,
    discover: () => sendPeerDiscoverV0(),
    heartbeat: () => sendPeerHeartbeatV0(userId),
    leave: () => sendPeerLeaveV0(userId)
  });
}

/**
 * Wire signal ingress from C2C channel onSignal callback.
 * @param {Record<string, unknown>} payload
 */
export function ingestCastleNetworkSignalV0(payload) {
  if (!payload?.signalType) return false;
  if (!Object.values(CASTLE_NETWORK_SIGNAL_V0).includes(String(payload.signalType))) return false;
  handleIncomingNetworkSignalV0(payload);
  return true;
}

export function disposeCastleNetworkSignalingV0(userId) {
  disposedV0 = true;
  if (heartbeatTimerV0) {
    window.clearInterval(heartbeatTimerV0);
    heartbeatTimerV0 = 0;
  }
  sendPeerLeaveV0(userId);
  registerCastleC2cRealtimeOutboundV0(null);
  channelRefV0 = null;
}

export { CASTLE_C2C_MESSAGE_TYPE_V0 };
