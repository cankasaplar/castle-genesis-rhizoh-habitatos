/**
 * Sprint C.1 — Gateway WS channel for peer WAL convergence (`CASTLE_WAL_PEER_*`).
 */

import { WS_MESSAGE, createEnvelope, safeJsonParse } from "@castle/protocol";
import { ingestPeerWalRoomBroadcastV0, buildLocalWalPeerFeedV0 } from "./peerWalConvergenceWireV0.js";

export const CASTLE_WAL_PEER_WS_SYNC_SCHEMA_V0 = "castle.rhizoh.castle_wal_peer_ws_sync.v0";

const MAX_PEER_FEED_BYTES = 48 * 1024;

function utf8ByteLength(s) {
  return new TextEncoder().encode(s).length;
}

/**
 * @param {{
 *   wsBaseUrl: string,
 *   castleRoomKey: string,
 *   castleId: string,
 *   userId?: string,
 *   token?: string,
 *   getState: () => import("../../studio/types/rskOntology.js").StudioKernelState,
 *   onPeerResult?: (results: unknown[]) => void,
 *   onStatus?: (s: { state: string, detail?: string }) => void
 * }} opts
 */
export function createCastleWalPeerWsChannelV0(opts) {
  const wsBaseUrl = String(opts.wsBaseUrl || "").trim();
  const castleRoomKey = String(opts.castleRoomKey || "default").slice(0, 64);
  const castleId = String(opts.castleId || "local").slice(0, 64);
  const userId = String(opts.userId || "anonymous").slice(0, 128);
  const token = opts.token != null ? String(opts.token) : "";
  const getState = opts.getState;

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
      if (utf8ByteLength(raw) > 96 * 1024) return;
      const parsed = safeJsonParse(raw);
      if (!parsed?.type) return;
      if (parsed.type === WS_MESSAGE.CASTLE_WAL_PEER_ROOM) {
        try {
          const results = ingestPeerWalRoomBroadcastV0(parsed, {
            getState,
            nowMs: Date.now()
          });
          opts.onPeerResult?.(results);
        } catch {
          /* noop */
        }
      }
    });
  };

  /**
   * Publish local WAL history to room peers.
   */
  const sendLocalWalPeerFeed = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    const built = buildLocalWalPeerFeedV0(getState, { castleId });
    const env = createEnvelope(WS_MESSAGE.CASTLE_WAL_PEER_FEED, {
      castleRoomKey,
      castleId,
      userId,
      seq: seq++,
      walPeerFeed: built.walPeerFeed
    });
    const raw = JSON.stringify(env);
    if (utf8ByteLength(raw) > MAX_PEER_FEED_BYTES) return false;
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

  return { connect, sendLocalWalPeerFeed, dispose };
}
