/**
 * Castle-to-castle gateway signaling channel — HELLO, CASTLE_SOCIAL_PULSE, SIGNAL relay.
 * @see apps/gateway/src/server.js validateSignalPayload / WS_MESSAGE.SIGNAL
 */

import { WS_MESSAGE, createEnvelope, safeJsonParse } from "@castle/protocol";

export const CASTLE_C2C_ROOM_KEY_V0 = "world_space_c2c_v0";
export const CASTLE_C2C_SIGNALING_SCHEMA_V0 = "castle.c2c_signaling.v0";

function utf8ByteLength(s) {
  return new TextEncoder().encode(s).length;
}

/**
 * @param {{
 *   wsBaseUrl: string,
 *   userId: string,
 *   token?: string,
 *   castleRoomKey?: string,
 *   onSignal?: (payload: Record<string, unknown>) => void,
 *   onRoster?: (roster: Array<Record<string, unknown>>) => void,
 *   onStatus?: (s: { state: string, detail?: string, clientId?: string }) => void
 * }} opts
 */
export function createCastleC2cSignalingChannelV0(opts) {
  const wsBaseUrl = String(opts.wsBaseUrl || "").trim();
  const userId = String(opts.userId || "anonymous").slice(0, 128);
  const token = opts.token != null ? String(opts.token) : "";
  const castleRoomKey = String(opts.castleRoomKey || CASTLE_C2C_ROOM_KEY_V0).slice(0, 64);

  /** @type {WebSocket | null} */
  let ws = null;
  let seq = 1;
  let disposed = false;
  let clientId = "";
  /** @type {Map<string, string>} */
  const userToClient = new Map();
  /** @type {Map<string, string>} */
  const clientToUser = new Map();

  const emit = (s) => {
    try {
      opts.onStatus?.(s);
    } catch {
      /* noop */
    }
  };

  const publishClientId = (id) => {
    clientId = String(id || "").trim();
    if (typeof window !== "undefined" && clientId) {
      try {
        window.__CASTLE_C2C_CLIENT_ID__ = clientId;
      } catch {
        /* noop */
      }
    }
    emit({ state: "client_id", clientId });
  };

  const ingestRoster = (roster) => {
    if (!Array.isArray(roster)) return;
    for (const row of roster) {
      const uid = String(row?.userId || "").trim();
      const gwId = String(row?.gatewayClientId || row?.clientId || "").trim();
      if (uid && gwId) {
        userToClient.set(uid, gwId);
        clientToUser.set(gwId, uid);
      }
    }
    try {
      opts.onRoster?.(roster);
    } catch {
      /* noop */
    }
  };

  const sendPulse = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !clientId) return false;
    const env = createEnvelope(WS_MESSAGE.CASTLE_SOCIAL_PULSE, {
      castleRoomKey,
      userId,
      seq: seq++,
      socialPulse: {
        surface: "world_space",
        gatewayClientId: clientId,
        c2cReady: true
      }
    });
    const raw = JSON.stringify(env);
    if (utf8ByteLength(raw) > 4096) return false;
    ws.send(raw);
    return true;
  };

  const connect = () => {
    if (disposed || typeof WebSocket === "undefined") return;
    if (!wsBaseUrl) {
      emit({ state: "error", detail: "missing_wsBaseUrl" });
      return;
    }
    try {
      const u = new URL(wsBaseUrl);
      if (token) u.searchParams.set("token", token);
      ws = new WebSocket(u.toString());
    } catch (e) {
      emit({ state: "error", detail: String(e?.message || e || "bad_url") });
      return;
    }
    ws.addEventListener("open", () => {
      emit({ state: "open" });
      sendPulse();
    });
    ws.addEventListener("close", () => emit({ state: "close" }));
    ws.addEventListener("error", () => emit({ state: "error", detail: "socket_error" }));
    ws.addEventListener("message", (ev) => {
      const raw = String(ev.data || "");
      if (utf8ByteLength(raw) > 96 * 1024) return;
      const parsed = safeJsonParse(raw);
      if (!parsed?.type) return;

      if (parsed.type === WS_MESSAGE.HELLO) {
        publishClientId(parsed.payload?.clientId);
        sendPulse();
        return;
      }

      if (parsed.type === WS_MESSAGE.CASTLE_SOCIAL_ROOM) {
        ingestRoster(parsed.payload?.roster);
        return;
      }

      if (parsed.type === WS_MESSAGE.SIGNAL) {
        try {
          opts.onSignal?.(parsed.payload || {});
        } catch {
          /* noop */
        }
      }
    });
  };

  /**
   * @param {string} peerUid
   */
  const resolveClientIdForUserV0 = (peerUid) => {
    const uid = String(peerUid || "").trim();
    if (!uid) return "";
    return userToClient.get(uid) || "";
  };

  /**
   * @param {{ signalType: 'OFFER'|'ANSWER'|'ICE', to: string, sdp?: object, candidate?: object }} payload
   */
  const sendSignal = (payload) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    const env = createEnvelope(WS_MESSAGE.SIGNAL, payload);
    const raw = JSON.stringify(env);
    if (utf8ByteLength(raw) > 32 * 1024) return false;
    ws.send(raw);
    return true;
  };

  const dispose = () => {
    disposed = true;
    try {
      ws?.close();
    } catch {
      /* noop */
    }
    ws = null;
    clientId = "";
    userToClient.clear();
    clientToUser.clear();
    if (typeof window !== "undefined") {
      try {
        delete window.__CASTLE_C2C_CLIENT_ID__;
      } catch {
        /* noop */
      }
    }
  };

  /**
   * @param {string} peerClientId
   */
  const resolveUserForClientIdV0 = (peerClientId) => {
    const id = String(peerClientId || "").trim();
    if (!id) return "";
    return clientToUser.get(id) || "";
  };

  return {
    connect,
    sendPulse,
    sendSignal,
    resolveClientIdForUserV0,
    resolveUserForClientIdV0,
    getClientId: () => clientId,
    dispose
  };
}
