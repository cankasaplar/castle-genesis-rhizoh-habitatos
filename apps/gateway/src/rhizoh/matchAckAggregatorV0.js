/**
 * Match ACK Aggregator v0 — tracks client MATCH_STATE_APPLIED per commitSeq.
 * RESEARCH-ONLY until data-plane READY.
 */

import { WS_MESSAGE, createEnvelope, createGatewayBroadcastMetaV0 } from "@castle/protocol";

export const MATCH_ACK_AGGREGATOR_SCHEMA_V0 = "castle.rhizoh.match_ack_aggregator.v0";

/** @type {Map<string, Map<number, Set<string>>>} */
const appliedBySessionV0 = new Map();

/** @type {Map<string, { commitSeq: number, recipientCount: number, delivered: number }>} */
const lastBroadcastBySessionV0 = new Map();

function sessionMapV0(sessionId) {
  const id = String(sessionId || "").trim();
  if (!id) return null;
  if (!appliedBySessionV0.has(id)) {
    appliedBySessionV0.set(id, new Map());
  }
  return appliedBySessionV0.get(id);
}

function clientKeyV0(socket, payload) {
  return String(
    payload?.clientConnectionId || socket?.clientId || payload?.gatewayClientId || "anonymous"
  ).slice(0, 128);
}

/**
 * Record gateway broadcast stats for a commit.
 * @param {string} sessionId
 * @param {{ commitSeq: number, recipientCount: number, delivered: number }} stats
 */
export function recordMatchBroadcastStatsV0(sessionId, stats = {}) {
  const id = String(sessionId || "").trim();
  if (!id) return;
  lastBroadcastBySessionV0.set(
    id,
    Object.freeze({
      commitSeq: Math.max(0, Number(stats.commitSeq) || 0),
      recipientCount: Math.max(0, Number(stats.recipientCount) || 0),
      delivered: Math.max(0, Number(stats.delivered) || 0)
    })
  );
}

/**
 * @param {string} sessionId
 * @param {number} commitSeq
 */
export function getMatchAckCountV0(sessionId, commitSeq) {
  const map = appliedBySessionV0.get(String(sessionId || "").trim());
  if (!map) return 0;
  return map.get(Math.max(0, Number(commitSeq) || 0))?.size ?? 0;
}

/**
 * @param {string} sessionId
 * @param {number} [commitSeq]
 */
export function getMatchBroadcastHealthV0(sessionId, commitSeq) {
  const id = String(sessionId || "").trim();
  const last = lastBroadcastBySessionV0.get(id);
  const seq = Math.max(0, Number(commitSeq ?? last?.commitSeq) || 0);
  const recipientCount = last?.recipientCount ?? 0;
  const delivered = last?.delivered ?? 0;
  const ackCount = getMatchAckCountV0(id, seq);

  return Object.freeze({
    schema: MATCH_ACK_AGGREGATOR_SCHEMA_V0,
    sessionId: id,
    broadcast: createGatewayBroadcastMetaV0({
      commitSeq: seq,
      broadcastSeq: seq,
      recipientCount,
      delivered,
      ackCount
    }),
    interpretationOnly: true
  });
}

/**
 * @param {import('ws').WebSocket} socket
 * @param {object} message
 * @param {import('ws').WebSocketServer} wss
 */
export function handleMatchStateAppliedV0(socket, message, wss) {
  const payload = message.payload || {};
  const sessionId = String(message.sessionId || payload.sessionId || "").trim();
  const commitSeq = Math.max(0, Number(payload.commitSeq ?? payload.serverSeq ?? payload.projectionVersion) || 0);
  if (!sessionId || commitSeq <= 0) {
    return Object.freeze({ ok: false, reason: "missing_session_or_commit_seq" });
  }

  const map = sessionMapV0(sessionId);
  if (!map.has(commitSeq)) {
    map.set(commitSeq, new Set());
  }
  map.get(commitSeq).add(clientKeyV0(socket, payload));

  const health = getMatchBroadcastHealthV0(sessionId, commitSeq);
  const envelope = createEnvelope(WS_MESSAGE.MATCH_BROADCAST_HEALTH, {
    ...health,
    interpretationOnly: true
  });
  envelope.sessionId = sessionId;

  if (socket.readyState === 1) {
    socket.send(JSON.stringify(envelope));
  }

  return Object.freeze({ ok: true, sessionId, commitSeq, ackCount: health.broadcast.ackCount });
}

/** @internal vitest */
export function clearMatchAckAggregatorForTestV0() {
  appliedBySessionV0.clear();
  lastBroadcastBySessionV0.clear();
}
