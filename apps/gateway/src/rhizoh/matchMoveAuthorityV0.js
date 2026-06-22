/**
 * Gateway match move authority v0 — sole server commit writer for match sessions.
 * Client sends MATCH_MOVE (proposal) · server validates · MATCH_MOVE_ACK (authoritative commit).
 * RESEARCH-ONLY until data-plane READY.
 */

import { Chess } from "chess.js";
import {
  WS_MESSAGE,
  createEnvelope,
  createGatewayBroadcastMetaV0,
  createGatewayEventEnvelopeV0,
  GATEWAY_EVENT_SOURCE_V0,
  attachGatewayEventMetaV0
} from "@castle/protocol";
import {
  fanOutMatchSessionV0,
  getMatchSessionPresenceV0,
  leaveMatchBroadcastRoomV0
} from "./matchBroadcastRoomV0.js";
import { getMatchBroadcastHealthV0, recordMatchBroadcastStatsV0 } from "./matchAckAggregatorV0.js";

export const MATCH_MOVE_AUTHORITY_SCHEMA_V0 = "castle.rhizoh.match_move_authority.v0";

const STARTING_FEN_V0 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** @type {Map<string, { sessionId: string, fen: string, turn: string, moveCount: number, serverSeq: number, lastSan: string | null }>} */
const serverSessionsV0 = new Map();

function getOrCreateServerSessionV0(sessionId) {
  const id = String(sessionId || "").trim();
  if (!id) return null;
  if (!serverSessionsV0.has(id)) {
    serverSessionsV0.set(
      id,
      Object.freeze({
        sessionId: id,
        fen: STARTING_FEN_V0,
        turn: "white",
        moveCount: 0,
        serverSeq: 0,
        lastSan: null
      })
    );
  }
  return serverSessionsV0.get(id);
}

function validateServerMoveV0(session, payload) {
  const san = String(payload?.san || "").trim();
  const playerId = String(payload?.playerId || "").trim();
  if (!san || !playerId) {
    return { ok: false, reason: "missing_san_or_player" };
  }

  const game = new Chess(session.fen);
  const currentTurn = game.turn() === "b" ? "black" : "white";
  if (currentTurn !== session.turn) {
    return { ok: false, reason: "wrong_turn" };
  }

  let result = null;
  try {
    result = game.move(san, { strict: false });
  } catch {
    return { ok: false, reason: "illegal_move" };
  }
  if (!result) {
    return { ok: false, reason: "illegal_move" };
  }

  const nextTurn = game.turn() === "b" ? "black" : "white";
  return {
    ok: true,
    san: result.san,
    fen: game.fen(),
    turn: nextTurn,
    playerId
  };
}

/**
 * @param {import("ws").WebSocket} socket
 * @param {{ type: string, sessionId?: string, traceId?: string, payload?: object }} message
 * @param {import("ws").WebSocketServer} wss
 */
export function handleMatchMoveAuthorityV0(socket, message, wss) {
  const sessionId = String(message.sessionId || message.payload?.sessionId || "").trim();
  const session = getOrCreateServerSessionV0(sessionId);
  if (!session) {
    socket.send(
      JSON.stringify(
        createEnvelope(WS_MESSAGE.MATCH_ERROR, {
          sessionId,
          error: "missing_session_id",
          interpretationOnly: true
        })
      )
    );
    return { ok: false, reason: "missing_session_id" };
  }

  const validation = validateServerMoveV0(session, message.payload || {});
  if (!validation.ok) {
    socket.send(
      JSON.stringify(
        createEnvelope(WS_MESSAGE.MATCH_ERROR, {
          sessionId,
          error: validation.reason,
          san: message.payload?.san,
          interpretationOnly: true
        })
      )
    );
    return { ok: false, reason: validation.reason };
  }

  const serverSeq = session.serverSeq + 1;
  const nextSession = Object.freeze({
    sessionId,
    fen: validation.fen,
    turn: validation.turn,
    moveCount: session.moveCount + 1,
    serverSeq,
    lastSan: validation.san
  });
  serverSessionsV0.set(sessionId, nextSession);

  const presenceCount = getMatchSessionPresenceV0(sessionId).count;
  const priorHealth = getMatchBroadcastHealthV0(sessionId, serverSeq - 1);
  const broadcastMeta = createGatewayBroadcastMetaV0({
    commitSeq: serverSeq,
    broadcastSeq: serverSeq,
    recipientCount: presenceCount,
    delivered: 0,
    ackCount: priorHealth.broadcast.ackCount
  });

  const ackPayload = Object.freeze({
    schema: MATCH_MOVE_AUTHORITY_SCHEMA_V0,
    sessionId,
    san: validation.san,
    playerId: validation.playerId,
    fen: validation.fen,
    turn: validation.turn,
    serverSeq,
    moveCount: nextSession.moveCount,
    commitAuthority: "server",
    truthOrigin: "gateway_ack",
    validationSource: "authority_gateway",
    broadcast: broadcastMeta,
    gatewayEvent: createGatewayEventEnvelopeV0({
      sessionId,
      worldId: sessionId,
      source: GATEWAY_EVENT_SOURCE_V0.CHESS,
      type: "MOVE_COMMITTED",
      seq: serverSeq,
      payload: {
        san: validation.san,
        playerId: validation.playerId,
        fen: validation.fen
      },
      delivery: broadcastMeta
    }),
    interpretationOnly: true
  });

  const ackEnvelope = createEnvelope(WS_MESSAGE.MATCH_MOVE_ACK, ackPayload);
  ackEnvelope.sessionId = sessionId;
  ackEnvelope.traceId = message.traceId || `match_ack_${serverSeq}`;

  const statePayload = {
    schema: MATCH_MOVE_AUTHORITY_SCHEMA_V0,
    sessionId,
    fen: validation.fen,
    turn: validation.turn,
    moveCount: nextSession.moveCount,
    serverSeq,
    lastSan: validation.san,
    commitAuthority: "server",
    truthOrigin: "gateway_ack",
    broadcast: broadcastMeta,
    gatewayEvent: createGatewayEventEnvelopeV0({
      sessionId,
      worldId: sessionId,
      source: GATEWAY_EVENT_SOURCE_V0.CHESS,
      type: "MATCH_STATE",
      seq: serverSeq,
      payload: { fen: validation.fen, turn: validation.turn, lastSan: validation.san },
      delivery: broadcastMeta
    }),
    interpretationOnly: true
  };
  const stateEnvelope = attachGatewayEventMetaV0(
    createEnvelope(WS_MESSAGE.MATCH_STATE, statePayload),
    statePayload.gatewayEvent
  );
  stateEnvelope.sessionId = sessionId;
  stateEnvelope.traceId = ackEnvelope.traceId;

  const fanState = fanOutMatchSessionV0(sessionId, stateEnvelope, { exceptSocket: socket });
  const totalDelivered = fanState.delivered + 1;
  const finalBroadcast = createGatewayBroadcastMetaV0({
    commitSeq: serverSeq,
    broadcastSeq: serverSeq,
    recipientCount: presenceCount,
    delivered: totalDelivered,
    ackCount: 0
  });

  recordMatchBroadcastStatsV0(sessionId, {
    commitSeq: serverSeq,
    recipientCount: presenceCount,
    delivered: totalDelivered
  });

  if (stateEnvelope.payload && typeof stateEnvelope.payload === "object") {
    stateEnvelope.payload.broadcast = finalBroadcast;
    stateEnvelope.payload.recipientCount = presenceCount;
    stateEnvelope.payload.delivered = totalDelivered;
    stateEnvelope.payload.gatewayEvent = createGatewayEventEnvelopeV0({
      sessionId,
      worldId: sessionId,
      source: GATEWAY_EVENT_SOURCE_V0.CHESS,
      type: "MATCH_STATE",
      seq: serverSeq,
      payload: { fen: validation.fen, turn: validation.turn, lastSan: validation.san },
      delivery: finalBroadcast
    });
  }

  const finalAckPayload = Object.freeze({
    ...ackPayload,
    broadcast: finalBroadcast,
    gatewayEvent: createGatewayEventEnvelopeV0({
      sessionId,
      worldId: sessionId,
      source: GATEWAY_EVENT_SOURCE_V0.CHESS,
      type: "MOVE_COMMITTED",
      seq: serverSeq,
      payload: {
        san: validation.san,
        playerId: validation.playerId,
        fen: validation.fen
      },
      delivery: finalBroadcast
    })
  });
  const finalAckEnvelope = createEnvelope(WS_MESSAGE.MATCH_MOVE_ACK, finalAckPayload);
  finalAckEnvelope.sessionId = sessionId;
  finalAckEnvelope.traceId = ackEnvelope.traceId;

  socket.send(JSON.stringify(finalAckEnvelope));
  socket.send(JSON.stringify(stateEnvelope));

  return Object.freeze({
    ok: true,
    ack: finalAckPayload,
    broadcast: Object.freeze({
      state: fanState,
      recipientCount: presenceCount,
      delivered: totalDelivered,
      meta: finalBroadcast
    })
  });
}

export { leaveMatchBroadcastRoomV0 };

/**
 * Late-join snapshot — send authoritative server session state to one socket.
 * @param {import("ws").WebSocket} socket
 * @param {string} sessionId
 */
export function sendMatchSessionSnapshotOnJoinV0(socket, sessionId) {
  const id = String(sessionId || "").trim();
  const session = serverSessionsV0.get(id);
  if (!socket || socket.readyState !== 1 || !session || session.serverSeq <= 0) {
    return Object.freeze({ ok: false, skipped: true, reason: "no_snapshot" });
  }

  const stateEnvelope = createEnvelope(WS_MESSAGE.MATCH_STATE, {
    schema: MATCH_MOVE_AUTHORITY_SCHEMA_V0,
    sessionId: id,
    fen: session.fen,
    turn: session.turn,
    moveCount: session.moveCount,
    serverSeq: session.serverSeq,
    lastSan: session.lastSan || null,
    commitAuthority: "server",
    truthOrigin: "gateway_snapshot_on_join",
    snapshot: true,
    interpretationOnly: true
  });
  stateEnvelope.sessionId = id;
  stateEnvelope.traceId = `match_snapshot_join_${session.serverSeq}`;

  socket.send(JSON.stringify(stateEnvelope));
  return Object.freeze({
    ok: true,
    sessionId: id,
    serverSeq: session.serverSeq,
    interpretationOnly: true
  });
}

/** @internal vitest */
export function seedMatchMoveAuthoritySessionForTestV0(sessionId, patch = {}) {
  const id = String(sessionId || "").trim();
  serverSessionsV0.set(
    id,
    Object.freeze({
      sessionId: id,
      fen: patch.fen || STARTING_FEN_V0,
      turn: patch.turn || "white",
      moveCount: patch.moveCount ?? 1,
      serverSeq: patch.serverSeq ?? 1,
      lastSan: patch.lastSan ?? "e4"
    })
  );
}

/** @internal vitest */
export function clearMatchMoveAuthoritySessionsForTestV0() {
  serverSessionsV0.clear();
}

/** @internal vitest */
export function getMatchMoveAuthoritySessionForTestV0(sessionId) {
  return serverSessionsV0.get(sessionId) ?? null;
}
