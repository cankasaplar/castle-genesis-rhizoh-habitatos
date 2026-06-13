/**
 * Castle ↔ Castle realtime bus v0 — typed messages over existing C2C signaling.
 */

import { CASTLE_C2C_STATE_EVENT_V0 } from "../castleSocial/castleC2cWebRtcTransportV0.js";

export const CASTLE_C2C_REALTIME_BUS_SCHEMA_V0 = "castle.c2c_realtime_bus.v0";
export const CASTLE_C2C_REALTIME_MESSAGE_EVENT_V0 = "castle:c2c-realtime-message-v0";

export const CASTLE_C2C_MESSAGE_TYPE_V0 = Object.freeze({
  SYNC_PING: "SYNC_PING",
  SYNC_STATE: "SYNC_STATE",
  CHESS_MOVE: "CHESS_MOVE",
  CHESS_MATCH: "CHESS_MATCH",
  ARCHIVE_PUSH: "ARCHIVE_PUSH"
});

/** @type {((msg: object) => void) | null} */
let outboundHookV0 = null;

/**
 * Register transport hook (WebRTC data channel or signaling relay).
 * @param {(msg: object) => void} fn
 */
export function registerCastleC2cRealtimeOutboundV0(fn) {
  outboundHookV0 = typeof fn === "function" ? fn : null;
}

/**
 * @param {string} type
 * @param {Record<string, unknown>} payload
 * @param {string} [peerUid]
 */
export function publishCastleC2cRealtimeMessageV0(type, payload = {}, peerUid = "") {
  const msg = Object.freeze({
    schema: CASTLE_C2C_REALTIME_BUS_SCHEMA_V0,
    type: String(type || ""),
    peerUid: String(peerUid || ""),
    payload: Object.freeze({ ...payload }),
    atMs: Date.now()
  });
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CASTLE_C2C_REALTIME_MESSAGE_EVENT_V0, { detail: msg }));
    } catch {
      /* noop */
    }
  }
  if (outboundHookV0) {
    try {
      outboundHookV0(msg);
    } catch {
      /* noop */
    }
  }
  return msg;
}

/**
 * @param {object} msg
 */
export function ingestCastleC2cRealtimeMessageV0(msg) {
  if (!msg?.type) return;
  publishCastleC2cRealtimeMessageV0(msg.type, msg.payload || {}, msg.peerUid || "");
}

/**
 * Subscribe to C2C transport state for UI.
 * @param {(detail: object) => void} cb
 */
export function subscribeCastleC2cRealtimeStateV0(cb) {
  if (typeof window === "undefined") return () => {};
  const handler = (ev) => cb(ev?.detail || {});
  window.addEventListener(CASTLE_C2C_STATE_EVENT_V0, handler);
  return () => window.removeEventListener(CASTLE_C2C_STATE_EVENT_V0, handler);
}

/**
 * Chess move over castle link.
 */
export function sendCastleChessMoveV0({ matchId, move, fen, peerUid }) {
  return publishCastleC2cRealtimeMessageV0(
    CASTLE_C2C_MESSAGE_TYPE_V0.CHESS_MOVE,
    { matchId, move, fen },
    peerUid
  );
}

/**
 * Heartbeat for castle-to-castle presence mesh.
 */
export function sendCastleSyncPingV0(peerUid = "") {
  return publishCastleC2cRealtimeMessageV0(CASTLE_C2C_MESSAGE_TYPE_V0.SYNC_PING, { ok: true }, peerUid);
}
