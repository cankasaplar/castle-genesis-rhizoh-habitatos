/**
 * Voice Gateway Citizenship v0 — client-side envelope, world bind, presence, observation.
 * RESEARCH-ONLY
 */

import {
  WS_MESSAGE,
  createEnvelope,
  createGatewayEventEnvelopeV0,
  GATEWAY_EVENT_SOURCE_V0
} from "@castle/protocol";
import { registerGatewayServiceV0 } from "./gatewayServiceRegistrationV0.js";
import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getOrCreateCastleDevUid, getRhizohApiBase } from "../useRhizohGatewayMonitor.js";
import { getMatchSessionSyncSnapshotV0 } from "./matchSessionSyncBridgeV0.js";
import { getMatchmakingTruthSnapshotV0 } from "./matchmakingTruthKernelV0.js";
import { recordVoiceObservationV1, isVoiceGatewayCitizenshipRegisteredV0 } from "./rhizohObservationStateV1.js";

export const VOICE_GATEWAY_CITIZENSHIP_CLIENT_SCHEMA_V0 =
  "castle.rhizoh.voice_gateway_citizenship_client.v0";

/** @type {string | null} */
let voiceClientConnectionIdV0 = null;

function resolveVoiceClientConnectionIdV0() {
  if (voiceClientConnectionIdV0) return voiceClientConnectionIdV0;
  if (typeof window !== "undefined") {
    const key = "rhizoh.voice.clientConnectionId";
    const existing = window.sessionStorage?.getItem(key);
    if (existing) {
      voiceClientConnectionIdV0 = existing;
      return existing;
    }
    const created = `vcc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage?.setItem(key, created);
    voiceClientConnectionIdV0 = created;
    return created;
  }
  voiceClientConnectionIdV0 = `vcc_node_${Date.now()}`;
  return voiceClientConnectionIdV0;
}

export function resolveVoiceWorldContextV0(input = {}) {
  const syncSnap = getMatchSessionSyncSnapshotV0();
  const truthSnap = getMatchmakingTruthSnapshotV0();
  const boundMatchSessionId =
    String(input.boundMatchSessionId || syncSnap.sessionId || truthSnap?.activeSession?.sessionId || "").trim() ||
    null;
  const voiceSessionId = String(
    input.sessionId || input.voiceSessionId || boundMatchSessionId || `live_${Date.now().toString(36)}`
  ).slice(0, 128);
  const worldId = String(input.worldId || boundMatchSessionId || voiceSessionId).slice(0, 128);

  return Object.freeze({
    sessionId: voiceSessionId,
    worldId,
    boundMatchSessionId,
    clientConnectionId: resolveVoiceClientConnectionIdV0(),
    source: GATEWAY_EVENT_SOURCE_V0.VOICE,
    interpretationOnly: true
  });
}

export function wrapVoiceGatewayEnvelopeV0(wireType, payload = {}, ctx = {}) {
  const sessionId = String(ctx.sessionId || payload.sessionId || "").trim();
  const worldId = String(ctx.worldId || payload.worldId || sessionId).slice(0, 128);
  const seq = Math.max(0, Number(ctx.seq ?? payload.voiceCommitSeq ?? payload.chunkIndex) || 0);
  const gatewayEvent = createGatewayEventEnvelopeV0({
    sessionId,
    worldId,
    source: GATEWAY_EVENT_SOURCE_V0.VOICE,
    type: ctx.eventType || wireType,
    seq,
    payload: {
      boundMatchSessionId: ctx.boundMatchSessionId || payload.boundMatchSessionId || null,
      traceId: payload.traceId || null
    }
  });
  return Object.freeze({
    envelope: createEnvelope(wireType, {
      ...payload,
      sessionId,
      worldId,
      boundMatchSessionId: ctx.boundMatchSessionId || payload.boundMatchSessionId || null,
      clientConnectionId: resolveVoiceClientConnectionIdV0(),
      gatewayEvent,
      interpretationOnly: true
    }),
    gatewayEvent,
    sessionId,
    worldId
  });
}

export async function registerVoiceGatewayCitizenV0(ws, ctx = {}) {
  const sessionId = String(ctx.sessionId || "").trim();
  if (!sessionId) {
    return Object.freeze({ ok: false, reason: "missing_session_id" });
  }
  const reg = await registerGatewayServiceV0({
    ws,
    kind: GATEWAY_EVENT_SOURCE_V0.VOICE,
    serviceId: sessionId,
    state: "LISTENING",
    meta: Object.freeze({
      worldId: ctx.worldId || sessionId,
      boundMatchSessionId: ctx.boundMatchSessionId || null
    })
  });
  if (reg.ok) {
    recordVoiceObservationV1({
      registered: true,
      sessionId,
      worldId: ctx.worldId || sessionId,
      boundMatchSessionId: ctx.boundMatchSessionId || null
    });
  }
  return reg;
}

export function sendVoiceStateAppliedV0(ws, input = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Object.freeze({ ok: false, reason: "ws_not_open" });
  }
  const sessionId = String(input.sessionId || "").trim();
  const commitSeq = Math.max(0, Number(input.commitSeq ?? input.voiceCommitSeq) || 0);
  if (!sessionId || commitSeq <= 0) {
    return Object.freeze({ ok: false, reason: "missing_session_or_commit" });
  }
  const envelope = createEnvelope(WS_MESSAGE.VOICE_STATE_APPLIED, {
    sessionId,
    commitSeq,
    voiceCommitSeq: commitSeq,
    projectionVersion: input.projectionVersion ?? commitSeq,
    clientConnectionId: resolveVoiceClientConnectionIdV0(),
    interpretationOnly: true
  });
  envelope.sessionId = sessionId;
  ws.send(JSON.stringify(envelope));
  recordVoiceObservationV1({ localAck: true, voiceCommitSeq: commitSeq, sessionId });
  return Object.freeze({ ok: true, sent: true, commitSeq });
}

export function ingestVoiceGatewayMessageV0(msg) {
  if (!msg?.type) return;
  const payload = msg.payload || {};
  const broadcast = payload.broadcast || {};

  if (msg.type === WS_MESSAGE.VOICE_TRANSCRIPT_COMMITTED || msg.type === WS_MESSAGE.RHIZOH_VOICE_LIVE_FINAL) {
    const seq = Number(payload.voiceCommitSeq ?? payload.gatewayEvent?.seq ?? broadcast.commitSeq) || 0;
    recordVoiceObservationV1({
      sessionId: payload.sessionId || msg.sessionId,
      worldId: payload.worldId,
      boundMatchSessionId: payload.boundMatchSessionId,
      voiceCommitSeq: seq,
      transcriptCommitted: payload.ok === true,
      delivered: broadcast.delivered ?? 1,
      gatewayAckCount: broadcast.ackCount
    });
    return;
  }

  if (msg.type === WS_MESSAGE.VOICE_BROADCAST_HEALTH) {
    recordVoiceObservationV1({
      sessionId: payload.sessionId || msg.sessionId,
      voiceCommitSeq: broadcast.commitSeq,
      gatewayAckCount: broadcast.ackCount,
      delivered: broadcast.delivered
    });
  }
}

export { isVoiceGatewayCitizenshipRegisteredV0 };

export function resetVoiceGatewayCitizenshipClientForTestV0() {
  voiceClientConnectionIdV0 = null;
}

/**
 * Authenticated presence read via app gateway base (not raw render.com — CORS + token).
 * @param {{ room?: string, sessionId?: string }} [opts]
 */
export async function fetchGatewayPresenceV0(opts = {}) {
  const base = String(getRhizohApiBase() || "").trim().replace(/\/+$/, "");
  if (!base) {
    return Object.freeze({ ok: false, error: "no_gateway_base" });
  }
  const cfg = getCastleFlightConfig();
  /** @type {Record<string, string>} */
  const headers = {
    Accept: "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };
  const gt = String(cfg.gatewayToken || "").trim();
  if (gt) headers["X-Castle-Gateway-Token"] = gt;

  const url = new URL(`${base}/rhizoh/network/presence`);
  if (opts.room) url.searchParams.set("room", String(opts.room));
  if (opts.sessionId) url.searchParams.set("sessionId", String(opts.sessionId));

  const res = await fetch(url.toString(), { headers, credentials: "include" });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return Object.freeze({
    ok: res.ok,
    status: res.status,
    ...(json && typeof json === "object" ? json : { error: "invalid_json" }),
    interpretationOnly: true
  });
}

export function mountVoiceGatewayCitizenshipConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.voiceGateway = Object.freeze({
    schema: VOICE_GATEWAY_CITIZENSHIP_CLIENT_SCHEMA_V0,
    resolveContext: resolveVoiceWorldContextV0,
    register: registerVoiceGatewayCitizenV0,
    stateApplied: sendVoiceStateAppliedV0,
    ingest: ingestVoiceGatewayMessageV0,
    fetchPresence: fetchGatewayPresenceV0,
    consoleHint: "await window.__rhizoh.voiceGateway.fetchPresence()",
    interpretationOnly: true
  });
}
