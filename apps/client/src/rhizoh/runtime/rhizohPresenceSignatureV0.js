/**
 * Presence Signature v0 — delegates to Live Layer (immediate), Thinking Layer (async).
 */

import { emitLivePresenceV0 } from "./rhizohLiveLayerV0.js";

export const RHIZOH_PRESENCE_SIGNATURE_SCHEMA_V0 = "rhizoh.presence_signature.v0";

export const PRESENCE_EVENT_KIND_V0 = Object.freeze({
  ACK: "presence_ack",
  PULSE: "presence_pulse",
  OBSERVE: "presence_observe",
  THINK: "presence_think",
  LISTEN: "presence_listen"
});

/**
 * @param {object} opts
 */
export function buildPresenceSignatureV0(opts = {}) {
  return Object.freeze({
    schema: RHIZOH_PRESENCE_SIGNATURE_SCHEMA_V0,
    kind: opts.kind || PRESENCE_EVENT_KIND_V0.ACK,
    signature: `prs_${opts.kind || "ack"}_${Date.now().toString(36)}`,
    carrier: opts.carrier || "local",
    emotionalTone: opts.emotionalTone || "steady",
    intent: opts.intent || null,
    atMs: Date.now(),
    isMessage: false,
    isResponse: false,
    isPresenceEvent: true,
    isChatBubble: false,
    outputContract: "rhizoh.output_contract_router.v0"
  });
}

/**
 * Live-first presence — never blocked by governance.
 * @param {object} opts
 */
export function emitPresenceEventV0(opts = {}) {
  return emitLivePresenceV0({
    phrase: opts.phrase,
    kind: opts.kind,
    intent: opts.intent,
    emotionalTone: opts.emotionalTone,
    carrier: opts.carrier,
    traceId: opts.traceId,
    speak: opts.speak,
    modality: opts.modality,
    incrementTurn: opts.incrementTurn,
    source: opts.source || "presence_event",
    userInitiated: opts.userInitiated,
    moduleId: "presence_signature",
    observe: opts.observe !== false
  });
}
