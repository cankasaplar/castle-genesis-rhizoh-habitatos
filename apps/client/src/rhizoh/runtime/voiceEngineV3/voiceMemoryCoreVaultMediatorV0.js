/**
 * Voice MemoryCore / Vault mediator.
 *
 * Orchestrator never receives capability tokens and does not resolve raw
 * personal data directly. It sends an event + intent scope; MemoryCore performs
 * the just-in-time gate and returns an ephemeral decision packet.
 */

import {
  createRhizohPayloadRefV0,
  RHIZOH_EVENT_POLICY_TAG_V0,
  rhizohChecksumStringV0
} from "@castle/protocol";
import { classifyVoiceDirectedSpeechBandV0 } from "../voiceDirectedSpeechObservationV0.js";
import {
  buildInputProvenanceEnvelopeV0,
  RHIZOH_INPUT_MODALITY_V0,
  RHIZOH_INPUT_SOURCE_V0
} from "../rhizohInputProvenanceV0.js";
import { resolveVoicePipelineDecisionV0 } from "../rhizohVoiceDualPathRouterV0.js";
import { recordVoiceImmutableEventV0 } from "./voiceImmutableEventTimelineV0.js";

export const RHIZOH_VOICE_MEMORY_CORE_VAULT_MEDIATOR_SCHEMA_V0 =
  "rhizoh.voice_memory_core_vault_mediator.v0";
export const RHIZOH_VOICE_NORMALIZED_DECISION_SCHEMA_V0 =
  "rhizoh.voice_normalized_decision.v0";

const ALLOWED_SCOPE_V0 = new Set(["voice_intent_decision", "voice_llm_turn"]);
const VOICE_NORMALIZED_ACTION_V0 = Object.freeze({
  SILENT_DROP: "VOICE_SILENT_DROP",
  HOLD: "VOICE_HOLD",
  FAST_REFLEX: "VOICE_FAST_REFLEX",
  SLOW_LLM: "VOICE_SLOW_LLM",
  UNHANDLED: "VOICE_UNHANDLED"
});

function buildEphemeralPacketRefV0(sessionId, traceId, scope, eventId) {
  return createRhizohPayloadRefV0(`${sessionId}:${traceId}:${scope}:${eventId}:ephemeral`);
}

function sanitizeVaultPacketValueV0(value) {
  if (Array.isArray(value)) return Object.freeze(value.map((item) => sanitizeVaultPacketValueV0(item)));
  if (!value || typeof value !== "object") return value;
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, inner] of Object.entries(value)) {
    if (["text", "transcript", "message", "preview", "audioBase64", "raw"].includes(key)) continue;
    out[key] = sanitizeVaultPacketValueV0(inner);
  }
  return Object.freeze(out);
}

function clamp01V0(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normalizeVoiceDecisionForOrchestratorV0(routerDecision = {}, ctx = {}) {
  let action = VOICE_NORMALIZED_ACTION_V0.UNHANDLED;
  if (routerDecision.speakMode === "silent") action = VOICE_NORMALIZED_ACTION_V0.SILENT_DROP;
  else if (routerDecision.speakMode === "hold") action = VOICE_NORMALIZED_ACTION_V0.HOLD;
  else if (routerDecision.speakMode === "speak" && routerDecision.execMode === "fast_reflex") {
    action = VOICE_NORMALIZED_ACTION_V0.FAST_REFLEX;
  } else if (routerDecision.speakMode === "speak" && routerDecision.execMode === "slow_llm") {
    action = VOICE_NORMALIZED_ACTION_V0.SLOW_LLM;
  }

  return Object.freeze({
    schema: RHIZOH_VOICE_NORMALIZED_DECISION_SCHEMA_V0,
    decision: action,
    confidence: clamp01V0(ctx.confidence),
    refs: Object.freeze([ctx.packetRef, ctx.provenanceRef].filter(Boolean)),
    // Minimal machine route retained for execution compatibility; no raw intent text.
    speakMode: routerDecision.speakMode || null,
    execMode: routerDecision.execMode || null,
    semanticGray: routerDecision.semanticGray === true,
    uxGray: routerDecision.uxGray === true,
    grayModifier: routerDecision.grayModifier === true,
    silent: routerDecision.speakMode === "silent"
  });
}

function normalizeBandObservationForOrchestratorV0(bandObs = {}, ctx = {}) {
  return Object.freeze({
    band: bandObs.band || "unknown",
    confidence: clamp01V0(ctx.confidence),
    source: "memory_core_vault"
  });
}

export function createVoiceVaultDataRequestV0(input = {}) {
  const event = input.event && typeof input.event === "object" ? input.event : {};
  const intentScope = String(input.intentScope || "voice_intent_decision");
  const sessionId = String(input.sessionId || event.sessionId || "").slice(0, 128);
  const traceId = String(input.traceId || event.traceId || "").slice(0, 128);
  const eventId = String(event.eventId || input.eventId || "").slice(0, 128);
  const ok =
    event?.schema === "rhizoh.immutable_event.v0" &&
    Boolean(eventId) &&
    ALLOWED_SCOPE_V0.has(intentScope) &&
    !("text" in event) &&
    !("transcript" in event) &&
    !("audioBase64" in event) &&
    !("message" in event);

  return Object.freeze({
    schema: RHIZOH_VOICE_MEMORY_CORE_VAULT_MEDIATOR_SCHEMA_V0,
    ok,
    error: ok ? undefined : "vault_request_rejected",
    requestId: `vreq_${rhizohChecksumStringV0(`${eventId}:${intentScope}:${sessionId}:${traceId}`)}`,
    eventId,
    intentScope,
    sessionId,
    traceId,
    payloadRef: event.payloadRef || null
  });
}

/**
 * @param {{
 *   event: object,
 *   intentScope?: string,
 *   transcript?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   maxRms?: number,
 *   recordedMs?: number,
 *   sessionId?: string,
 *   traceId?: string
 * }} input
 */
export function resolveVoiceDecisionViaMemoryCoreV0(input = {}) {
  const request = createVoiceVaultDataRequestV0(input);
  if (!request.ok) {
    return Object.freeze({ ok: false, error: request.error, request });
  }
  recordVoiceImmutableEventV0({
    type: "VOICE_VAULT_DATA_REQUESTED",
    sessionId: request.sessionId,
    traceId: request.traceId,
    payloadRef: request.payloadRef,
    actorSeed: request.sessionId,
    policyTag: RHIZOH_EVENT_POLICY_TAG_V0.ERASABLE_PAYLOAD_REF
  });

  // Raw transcript is consumed only inside MemoryCore and is never persisted here.
  const transcript = String(input.transcript || "").trim();
  const confidence = Number(input.confidence);
  const strategy = input.strategy ? String(input.strategy) : undefined;
  const maxRms = Number(input.maxRms);
  const bandObs = classifyVoiceDirectedSpeechBandV0({
    text: transcript,
    confidence,
    strategy,
    maxRms,
    source: "mic_v3"
  });
  const provenance = buildInputProvenanceEnvelopeV0({
    text: transcript,
    source: RHIZOH_INPUT_SOURCE_V0.MIC_V3,
    modality: RHIZOH_INPUT_MODALITY_V0.STT,
    confidence,
    strategy,
    band: bandObs.band,
    traceId: request.traceId
  });
  const decision = resolveVoicePipelineDecisionV0({
    text: transcript,
    confidence,
    strategy,
    maxRms,
    recordedMs: input.recordedMs,
    band: bandObs.band,
    provenance,
    sessionId: request.sessionId
  });
  const packetRef = buildEphemeralPacketRefV0(
    request.sessionId,
    request.traceId,
    request.intentScope,
    request.eventId
  );
  const provenanceRef = createRhizohPayloadRefV0(`${provenance.originHash}:${request.eventId}`);
  const normalizedDecision = normalizeVoiceDecisionForOrchestratorV0(decision, {
    confidence,
    packetRef,
    provenanceRef
  });
  const normalizedBandObs = normalizeBandObservationForOrchestratorV0(bandObs, { confidence });
  recordVoiceImmutableEventV0({
    type: "VOICE_VAULT_DATA_REQUEST_RESOLVED",
    sessionId: request.sessionId,
    traceId: request.traceId,
    payloadRef: packetRef,
    actorSeed: request.sessionId,
    policyTag: RHIZOH_EVENT_POLICY_TAG_V0.ERASABLE_PAYLOAD_REF
  });

  return Object.freeze({
    ok: true,
    request,
    packet: Object.freeze({
      schema: `${RHIZOH_VOICE_MEMORY_CORE_VAULT_MEDIATOR_SCHEMA_V0}.packet`,
      packetRef,
      eventId: request.eventId,
      intentScope: request.intentScope,
      ephemeral: true,
      dataClass: "derived_intent_only",
      provenanceRef,
      originHash: provenance.originHash,
      decision: sanitizeVaultPacketValueV0(normalizedDecision),
      bandObs: sanitizeVaultPacketValueV0(normalizedBandObs)
    })
  });
}
