/**
 * Match broadcast transport v0 — live_gateway_ws_transport + session fan-out client.
 * Client proposes via MATCH_MOVE · receives MATCH_MOVE_ACK + MATCH_STATE from room.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_MATCH_BROADCAST_LAYER_V0.md
 */

import { WS_MESSAGE, createEnvelope } from "@castle/protocol";
import { applyGatewayMatchMoveAckV0 } from "./matchmakingGatewayCommitBridgeV0.js";
import { ingestMatchCastleInviteFromGatewayV0 } from "./matchCastleInboxBridgeV0.js";
import {
  dispatchMatchmakingTruthEventV0,
  getMatchmakingTruthSnapshotV0,
  MATCH_TRUTH_EVENT_V0
} from "./matchmakingTruthKernelV0.js";
import { MATCH_SESSION_STATE_V0 } from "./matchSessionLifecycleV0.js";
import {
  ensureMatchGatewayWsV0,
  getMatchGatewayWsStatusV0,
  getMatchGatewayWsV0,
  waitForMatchGatewayWsOpenV0
} from "./matchmakingGatewayWsV0.js";
import { applyRemoteMatchWorldStateV0 } from "./matchmakingWorldProjectionV0.js";
import { recordBroadcastVisibilityV1 } from "./rhizohObservationStateV1.js";

export const MATCH_BROADCAST_TRANSPORT_SCHEMA_V0 =
  "castle.rhizoh.match_broadcast_transport.v0";

/** @type {Map<string, number>} */
const lastTransportServerSeqV0 = new Map();

/** @internal vitest */
export function resetMatchBroadcastTransportDedupeForTestV0() {
  lastTransportServerSeqV0.clear();
}

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
        recordBroadcastVisibilityV1({ presence: msg.payload });
        opts.onPresence?.(msg.payload);
        return;
      }
      if (msg.type === WS_MESSAGE.MATCH_MOVE_ACK) {
        recordBroadcastVisibilityV1({
          commitSeq: msg.payload?.serverSeq,
          broadcastSeq: msg.payload?.serverSeq,
          recipientCount: msg.payload?.broadcast?.recipientCount ?? msg.payload?.recipientCount,
          delivered: msg.payload?.broadcast?.delivered
        });
        opts.onAck?.({ envelope: msg });
        return;
      }
      if (msg.type === WS_MESSAGE.MATCH_CASTLE_INVITE) {
        ingestMatchCastleInviteFromGatewayV0({
          ...(msg.payload || {}),
          fromGatewayClientId: msg.payload?.fromGatewayClientId || null
        });
        opts.onInvite?.({ envelope: msg });
        return;
      }
      if (msg.type === WS_MESSAGE.MATCH_STATE) {
        const payload = msg.payload || {};
        const remoteSeq = Number(payload.serverSeq) || 0;
        const dedupeKey = `${sessionId}:${remoteSeq}`;
        if (remoteSeq > 0 && lastTransportServerSeqV0.get(dedupeKey) === remoteSeq) {
          return;
        }
        if (remoteSeq > 0) {
          lastTransportServerSeqV0.set(dedupeKey, remoteSeq);
        }
        const projected = applyRemoteMatchWorldStateV0(
          { sessionId, ...payload },
          { origin: "broadcast_transport" }
        );
        recordBroadcastVisibilityV1({
          commitSeq: payload.serverSeq,
          broadcastSeq: payload.serverSeq,
          recipientCount: payload.recipientCount ?? payload.presenceCount,
          delivered: payload.recipientCount ?? payload.presenceCount,
          gatewayServerSeq: payload.serverSeq,
          gatewayFen: payload.fen,
          localAck: projected.ok === true && !projected.skipped
        });
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

function resolveBroadcastSessionIdV0(input = {}) {
  const explicit = String(input.sessionId || "").trim();
  if (explicit) return explicit;
  const snap = getMatchmakingTruthSnapshotV0();
  return String(snap.activeSession?.sessionId || "").trim();
}

function ensureBroadcastSessionV0(input = {}) {
  let sessionId = resolveBroadcastSessionIdV0(input);
  if (sessionId) {
    return Object.freeze({ ok: true, sessionId, created: false });
  }
  const playerId = String(input.playerId || "broadcast_console_user");
  const created = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
    payload: {
      initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE,
      players: [{ userId: playerId, color: "white" }]
    }
  });
  sessionId = String(created.session?.sessionId || "").trim();
  return Object.freeze({
    ok: created.ok === true && Boolean(sessionId),
    sessionId,
    created: true,
    sessionStep: created
  });
}

/**
 * Console helper — connect gateway WS if needed, join session room.
 * @param {{ sessionId?: string, role?: string, playerId?: string, traceId?: string }} [input]
 */
export async function joinMatchBroadcastSessionV0(input = {}) {
  const session = ensureBroadcastSessionV0(input);
  if (!session.ok) {
    return Object.freeze({ ok: false, reason: "session_unavailable", session, interpretationOnly: true });
  }
  const gatewayWait =
    input.waitForGateway === false
      ? Object.freeze({
          ok: Boolean((await ensureMatchGatewayWsV0())?.readyState === WebSocket.OPEN),
          ws: await ensureMatchGatewayWsV0(),
          reason: "ws_not_open",
          waitedMs: 0
        })
      : await waitForMatchGatewayWsOpenV0({
          timeoutMs: input.gatewayTimeoutMs,
          pollMs: input.gatewayPollMs
        });
  const ws = gatewayWait.ws;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Object.freeze({
      ok: false,
      reason: gatewayWait.reason || "ws_not_open",
      wsStatus: getMatchGatewayWsStatusV0(),
      gatewayWait,
      sessionId: session.sessionId,
      interpretationOnly: true
    });
  }
  const join = sendMatchSessionJoinV0(ws, {
    sessionId: session.sessionId,
    role: input.role,
    playerId: input.playerId,
    traceId: input.traceId
  });
  return Object.freeze({
    ...join,
    sessionId: session.sessionId,
    ws,
    gatewayWait,
    sessionCreated: session.created === true,
    interpretationOnly: true,
    shadowRehearsal: true
  });
}

/**
 * Console helper — connect + propose move (no manual `ws` variable).
 * @param {{ sessionId?: string, san: string, playerId?: string, traceId?: string }} input
 */
export async function proposeMatchBroadcastMoveV0(input = {}) {
  const session = ensureBroadcastSessionV0(input);
  if (!session.ok) {
    return Object.freeze({ ok: false, reason: "session_unavailable", session, interpretationOnly: true });
  }
  const ws = await ensureMatchGatewayWsV0();
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Object.freeze({
      ok: false,
      reason: "ws_not_open",
      wsStatus: getMatchGatewayWsStatusV0(),
      sessionId: session.sessionId,
      interpretationOnly: true
    });
  }
  const playerId = String(input.playerId || "broadcast_console_user");
  const propose = sendMatchMoveProposalV0(ws, {
    sessionId: session.sessionId,
    san: input.san,
    playerId,
    traceId: input.traceId
  });
  return Object.freeze({
    ...propose,
    sessionId: session.sessionId,
    ws,
    interpretationOnly: true,
    shadowRehearsal: true
  });
}

/**
 * One-shot console rehearsal: connect · join · bind listeners.
 * @param {{
 *   sessionId?: string,
 *   role?: string,
 *   playerId?: string,
 *   san?: string,
 *   onPresence?: (p: object) => void,
 *   onState?: (s: object) => void,
 *   onAck?: (a: object) => void,
 *   proposeFirstMove?: boolean
 * }} [input]
 */
export async function quickStartMatchBroadcastV0(input = {}) {
  const joined = await joinMatchBroadcastSessionV0(input);
  if (!joined.ok) return joined;

  const unbind = bindMatchBroadcastTransportV0({
    ws: joined.ws,
    sessionId: joined.sessionId,
    role: input.role,
    playerId: input.playerId,
    onPresence: input.onPresence,
    onState: input.onState,
    onAck: input.onAck
  });

  let propose = null;
  if (input.proposeFirstMove === true || input.san) {
    propose = await proposeMatchBroadcastMoveV0({
      sessionId: joined.sessionId,
      san: input.san || "e4",
      playerId: input.playerId
    });
  }

  if (typeof console !== "undefined" && console.info) {
    console.info("[MATCH_BROADCAST_QUICK_START]", {
      sessionId: joined.sessionId,
      wsOpen: joined.ws?.readyState === WebSocket.OPEN,
      proposeSent: propose?.sent === true,
      interpretationOnly: true
    });
  }

  return Object.freeze({
    ok: true,
    sessionId: joined.sessionId,
    ws: joined.ws,
    unbind,
    joined,
    propose,
    interpretationOnly: true,
    shadowRehearsal: true
  });
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
    getWs: getMatchGatewayWsV0,
    wsStatus: getMatchGatewayWsStatusV0,
    connect: ensureMatchGatewayWsV0,
    joinSession: joinMatchBroadcastSessionV0,
    proposeMove: proposeMatchBroadcastMoveV0,
    quickStart: quickStartMatchBroadcastV0,
    consoleHint:
      "await window.__rhizoh.matchBroadcast.quickStart({ playerId: 'you', proposeFirstMove: true })",
    interpretationOnly: true,
    shadowRehearsal: true
  });
}
