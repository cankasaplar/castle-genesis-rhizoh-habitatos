/**
 * Match broadcast transport v0 — live_gateway_ws_transport + session fan-out client.
 * Client proposes via MATCH_MOVE · receives MATCH_MOVE_ACK + MATCH_STATE from room.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_MATCH_BROADCAST_LAYER_V0.md
 */

import { WS_MESSAGE, createEnvelope } from "@castle/protocol";
import { applyGatewayMatchMoveAckV0 } from "./matchmakingGatewayCommitBridgeV0.js";
import { applyRemoteMatchWorldStateV0 } from "./matchmakingWorldProjectionV0.js";
import { dispatchMatchmakingTruthEventV0, MATCH_TRUTH_EVENT_V0 } from "./matchmakingTruthKernelV0.js";

export const MATCH_BROADCAST_TRANSPORT_SCHEMA_V0 =
  "castle.rhizoh.match_broadcast_transport.v0";

/** Re-export roles for client (avoid deep gateway import in prod bundle — duplicate const) */
export const MATCH_BROADCAST_ROLE_V0 = Object.freeze({
  PLAYER: "player",
  OBSERVER: "observer",
  AI_NODE: "ai_node"
});

/**
 * @param {{
 *   ws: WebSocket,
 *   sessionId: string,
 *   role?: string,
 *   playerId?: string,
 *   onPresence?: (p: object) => void,
 *   onState?: (s: object) => void,
 *   onAck?: (a: object) => void
 * }} opts
 */
export function bindMatchBroadcastTransportV0(opts) {
  const ws = opts.ws;
  const sessionId = String(opts.sessionId || "").trim();
  if (!ws || !sessionId) {
    return () => {};
  }

  const handler = (evt) => {
    try {
      const msg = JSON.parse(String(evt.data || ""));
      if (msg.sessionId && msg.sessionId !== sessionId) return;

      if (msg.type === WS_MESSAGE.MATCH_SESSION_PRESENCE) {
        opts.onPresence?.(msg.payload);
        return;
      }
      if (msg.type === WS_MESSAGE.MATCH_MOVE_ACK) {
        const ack = applyGatewayMatchMoveAckV0({ sessionId, ...(msg.payload || {}) });
        opts.onAck?.({ envelope: msg, ack });
        return;
      }
      if (msg.type === WS_MESSAGE.MATCH_STATE) {
        const projected = applyRemoteMatchWorldStateV0(
          { sessionId, ...(msg.payload || {}) },
          { origin: "broadcast_transport" }
        );
        opts.onState?.({ envelope: msg, projected });
      }
    } catch {
      /* noop */
    }
  };

  ws.addEventListener("message", handler);
  return () => ws.removeEventListener("message", handler);
}

/**
 * Join match session room on gateway.
 * @param {WebSocket} ws
 * @param {{ sessionId: string, role?: string, playerId?: string, traceId?: string }} input
 */
export function sendMatchSessionJoinV0(ws, input = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Object.freeze({ ok: false, reason: "ws_not_open" });
  }
  const envelope = createEnvelope(WS_MESSAGE.MATCH_SESSION_JOIN, {
    sessionId: input.sessionId,
    role: input.role || MATCH_BROADCAST_ROLE_V0.PLAYER,
    playerId: input.playerId ?? null,
    interpretationOnly: true
  });
  envelope.sessionId = input.sessionId;
  envelope.traceId = input.traceId || `match_join_${Date.now()}`;
  ws.send(JSON.stringify(envelope));
  return Object.freeze({ ok: true, sent: true });
}

/**
 * Propose move to gateway (does not authoritative-commit locally).
 * @param {WebSocket} ws
 * @param {{ sessionId: string, san: string, playerId: string, traceId?: string }} input
 */
export function sendMatchMoveProposalV0(ws, input = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Object.freeze({ ok: false, reason: "ws_not_open" });
  }

  dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE,
    sessionId: input.sessionId,
    payload: {
      san: input.san,
      playerId: input.playerId,
      autoCommitShadow: false
    }
  });

  const envelope = createEnvelope(WS_MESSAGE.MATCH_MOVE, {
    sessionId: input.sessionId,
    san: input.san,
    playerId: input.playerId,
    interpretationOnly: true
  });
  envelope.sessionId = input.sessionId;
  envelope.traceId = input.traceId || `match_move_${Date.now()}`;
  ws.send(JSON.stringify(envelope));
  return Object.freeze({ ok: true, sent: true, preview: true });
}

export function mountMatchBroadcastTransportConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchBroadcast = Object.freeze({
    schema: MATCH_BROADCAST_TRANSPORT_SCHEMA_V0,
    roles: MATCH_BROADCAST_ROLE_V0,
    join: sendMatchSessionJoinV0,
    propose: sendMatchMoveProposalV0,
    bind: bindMatchBroadcastTransportV0,
    interpretationOnly: true,
    shadowRehearsal: true
  });
}
