/**
 * Voice Gateway Citizenship v0 — presence, envelope, ACK on voice live lane.
 * RESEARCH-ONLY until data-plane READY.
 */

import {
  WS_MESSAGE,
  createEnvelope,
  createGatewayBroadcastMetaV0,
  createGatewayEventEnvelopeV0,
  GATEWAY_EVENT_SOURCE_V0
} from "@castle/protocol";
import { registerGatewayServiceNodeV0 } from "./gatewayPresenceRegistryV0.js";

export const VOICE_GATEWAY_CITIZENSHIP_SCHEMA_V0 = "castle.rhizoh.voice_gateway_citizenship.v0";

/** @type {Map<string, Map<number, Set<string>>>} */
const voiceAppliedBySessionV0 = new Map();

/** @type {Map<string, { commitSeq: number, recipientCount: number, delivered: number }>} */
const lastVoiceBroadcastBySessionV0 = new Map();

function voiceSessionMapV0(sessionId) {
  const id = String(sessionId || "").trim();
  if (!id) return null;
  if (!voiceAppliedBySessionV0.has(id)) {
    voiceAppliedBySessionV0.set(id, new Map());
  }
  return voiceAppliedBySessionV0.get(id);
}

function clientKeyV0(socket, payload) {
  return String(
    payload?.clientConnectionId || socket?.clientId || payload?.gatewayClientId || "anonymous"
  ).slice(0, 128);
}

/**
 * @param {object} payload
 */
export function resolveVoiceWorldContextV0(payload = {}) {
  const gatewayEvent = payload.gatewayEvent || {};
  const sessionId = String(
    payload.sessionId || gatewayEvent.sessionId || payload.voiceSessionId || ""
  ).trim();
  const worldId = String(
    payload.worldId || gatewayEvent.worldId || sessionId || "world_default"
  ).slice(0, 128);
  const boundMatchSessionId = String(payload.boundMatchSessionId || gatewayEvent.boundMatchSessionId || "").trim();
  return Object.freeze({
    sessionId: sessionId || `live_${Date.now().toString(36)}`,
    worldId,
    boundMatchSessionId: boundMatchSessionId || null,
    source: GATEWAY_EVENT_SOURCE_V0.VOICE
  });
}

/**
 * @param {import('ws').WebSocket} socket
 * @param {{ sessionId: string, worldId?: string, boundMatchSessionId?: string | null, traceId?: string }} ctx
 */
export function registerVoiceGatewayCitizenV0(socket, ctx = {}) {
  const sessionId = String(ctx.sessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({ ok: false, reason: "missing_session_id" });
  }
  return registerGatewayServiceNodeV0({
    kind: GATEWAY_EVENT_SOURCE_V0.VOICE,
    serviceId: sessionId,
    gatewayClientId: socket?.clientId ?? null,
    state: "LISTENING",
    meta: Object.freeze({
      worldId: ctx.worldId || sessionId,
      boundMatchSessionId: ctx.boundMatchSessionId || null,
      traceId: ctx.traceId || null
    })
  });
}

/**
 * @param {{
 *   sessionId: string,
 *   worldId?: string,
 *   type: string,
 *   seq: number,
 *   payload?: object,
 *   delivery?: object
 * }} input
 */
export function buildVoiceGatewayEventV0(input = {}) {
  return createGatewayEventEnvelopeV0({
    sessionId: input.sessionId,
    worldId: input.worldId || input.sessionId,
    source: GATEWAY_EVENT_SOURCE_V0.VOICE,
    type: input.type,
    seq: input.seq,
    payload: input.payload,
    delivery: input.delivery
  });
}

/**
 * @param {string} sessionId
 * @param {{ commitSeq: number, recipientCount?: number, delivered?: number }} stats
 */
export function recordVoiceBroadcastStatsV0(sessionId, stats = {}) {
  const id = String(sessionId || "").trim();
  if (!id) return;
  lastVoiceBroadcastBySessionV0.set(
    id,
    Object.freeze({
      commitSeq: Math.max(0, Number(stats.commitSeq) || 0),
      recipientCount: Math.max(1, Number(stats.recipientCount) || 1),
      delivered: Math.max(0, Number(stats.delivered) || 1)
    })
  );
}

/**
 * @param {string} sessionId
 * @param {number} [commitSeq]
 */
export function getVoiceBroadcastHealthV0(sessionId, commitSeq) {
  const id = String(sessionId || "").trim();
  const last = lastVoiceBroadcastBySessionV0.get(id);
  const seq = Math.max(0, Number(commitSeq ?? last?.commitSeq) || 0);
  const recipientCount = last?.recipientCount ?? 1;
  const delivered = last?.delivered ?? 1;
  const ackCount = voiceAppliedBySessionV0.get(id)?.get(seq)?.size ?? 0;

  return Object.freeze({
    schema: VOICE_GATEWAY_CITIZENSHIP_SCHEMA_V0,
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
 * @param {object} session
 * @param {string} eventType
 * @param {object} payload
 */
export function enrichVoiceLivePayloadV0(session, eventType, payload = {}) {
  const seq = Math.max(0, Number(session?.eventSeq) || 0);
  const sessionId = String(session?.sessionId || payload.sessionId || "").trim();
  const worldId = String(session?.worldId || payload.worldId || sessionId).slice(0, 128);
  const health = getVoiceBroadcastHealthV0(sessionId, seq);
  const gatewayEvent = buildVoiceGatewayEventV0({
    sessionId,
    worldId,
    type: eventType,
    seq,
    payload: {
      boundMatchSessionId: session?.boundMatchSessionId || payload.boundMatchSessionId || null,
      traceId: session?.traceId || payload.traceId || null
    },
    delivery: health.broadcast
  });
  return Object.freeze({
    ...payload,
    sessionId,
    worldId,
    boundMatchSessionId: session?.boundMatchSessionId || payload.boundMatchSessionId || null,
    gatewayEvent,
    broadcast: health.broadcast,
    interpretationOnly: true
  });
}

/**
 * @param {import('ws').WebSocket} socket
 * @param {object} session
 * @param {object} result
 */
export function sendVoiceTranscriptCommittedV0(socket, session, result = {}) {
  const seq = (Number(session?.eventSeq) || 0) + 1;
  session.eventSeq = seq;
  recordVoiceBroadcastStatsV0(session.sessionId, {
    commitSeq: seq,
    recipientCount: 1,
    delivered: 1
  });
  const health = getVoiceBroadcastHealthV0(session.sessionId, seq);
  const gatewayEvent = buildVoiceGatewayEventV0({
    sessionId: session.sessionId,
    worldId: session.worldId || session.sessionId,
    type: "TRANSCRIPT_COMMITTED",
    seq,
    payload: {
      ok: result.ok === true,
      transportPath: result.transportPath || "gateway_ws_live"
    },
    delivery: health.broadcast
  });
  const payload = enrichVoiceLivePayloadV0(session, "TRANSCRIPT_COMMITTED", {
    ...result,
    sessionId: session.sessionId,
    gatewayEvent,
    broadcast: health.broadcast,
    voiceCommitSeq: seq
  });
  sendVoiceEnvelopeV0(socket, WS_MESSAGE.RHIZOH_VOICE_LIVE_FINAL, payload);
  sendVoiceEnvelopeV0(socket, WS_MESSAGE.VOICE_TRANSCRIPT_COMMITTED, payload);
}

/**
 * @param {import('ws').WebSocket} socket
 * @param {string} type
 * @param {object} payload
 */
export function sendVoiceEnvelopeV0(socket, type, payload) {
  try {
    if (socket?.readyState === 1) {
      socket.send(JSON.stringify(createEnvelope(type, payload)));
    }
  } catch {
    /* noop */
  }
}

/**
 * @param {import('ws').WebSocket} socket
 * @param {object} message
 */
export function handleVoiceStateAppliedV0(socket, message) {
  const payload = message.payload || {};
  const sessionId = String(message.sessionId || payload.sessionId || "").trim();
  const commitSeq = Math.max(
    0,
    Number(payload.commitSeq ?? payload.voiceCommitSeq ?? payload.projectionVersion) || 0
  );
  if (!sessionId || commitSeq <= 0) {
    return Object.freeze({ ok: false, reason: "missing_session_or_commit_seq" });
  }

  const map = voiceSessionMapV0(sessionId);
  if (!map.has(commitSeq)) {
    map.set(commitSeq, new Set());
  }
  map.get(commitSeq).add(clientKeyV0(socket, payload));

  const health = getVoiceBroadcastHealthV0(sessionId, commitSeq);
  sendVoiceEnvelopeV0(socket, WS_MESSAGE.VOICE_BROADCAST_HEALTH, {
    ...health,
    interpretationOnly: true
  });

  return Object.freeze({ ok: true, sessionId, commitSeq, ackCount: health.broadcast.ackCount });
}

/** @internal vitest */
export function clearVoiceGatewayCitizenshipForTestV0() {
  voiceAppliedBySessionV0.clear();
  lastVoiceBroadcastBySessionV0.clear();
}
