/**
 * SPECFLOW: RESEARCH-ONLY — Castle social room sync over gateway WebSocket (`CASTLE_SOCIAL_*`).
 *
 * Server fan-out: `apps/gateway/src/server.js`. Protocol: `@castle/protocol`.
 */

import { WS_MESSAGE, createEnvelope, safeJsonParse } from "@castle/protocol";

function utf8ByteLength(s) {
  return new TextEncoder().encode(s).length;
}

const MAX_PULSE_BYTES = 4096;

/**
 * @param {{
 *   wsBaseUrl: string,
 *   castleRoomKey: string,
 *   userId: string,
 *   token?: string,
 *   onRoom?: (envelope: { type: string, payload: Record<string, unknown>, ts?: number }) => void,
 *   onStatus?: (s: { state: string, detail?: string }) => void
 * }} opts
 */
export function createCastleSocialWsChannelV0(opts) {
  const wsBaseUrl = String(opts.wsBaseUrl || "").trim();
  const castleRoomKey = String(opts.castleRoomKey || "default").slice(0, 64);
  const userId = String(opts.userId || "anonymous").slice(0, 128);
  const token = opts.token != null ? String(opts.token) : "";

  let ws = null;
  let seq = 1;
  let disposed = false;

  const emit = (s) => {
    try {
      opts.onStatus?.(s);
    } catch {
      /* noop */
    }
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
    ws.addEventListener("open", () => emit({ state: "open" }));
    ws.addEventListener("close", () => emit({ state: "close" }));
    ws.addEventListener("error", () => emit({ state: "error", detail: "socket_error" }));
    ws.addEventListener("message", (ev) => {
      const raw = String(ev.data || "");
      if (utf8ByteLength(raw) > 64 * 1024) return;
      const parsed = safeJsonParse(raw);
      if (!parsed?.type) return;
      if (
        parsed.type === WS_MESSAGE.CASTLE_SOCIAL_ROOM ||
        parsed.type === WS_MESSAGE.CASTLE_WAL_PEER_ROOM
      ) {
        try {
          opts.onRoom?.(parsed);
        } catch {
          /* noop */
        }
      }
    });
  };

  /**
   * @param {Record<string, unknown>} socialPulse — language, modeHint, lastSpokeAt, energyHint01, …
   */
  const sendPulse = (socialPulse = {}) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    const env = createEnvelope(WS_MESSAGE.CASTLE_SOCIAL_PULSE, {
      castleRoomKey,
      userId,
      seq: seq++,
      socialPulse: socialPulse && typeof socialPulse === "object" ? socialPulse : {}
    });
    const raw = JSON.stringify(env);
    if (utf8ByteLength(raw) > MAX_PULSE_BYTES) return false;
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
  };

  return { connect, sendPulse, dispose };
}
