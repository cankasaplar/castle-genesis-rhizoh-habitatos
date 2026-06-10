/**
 * Rhizoh Live Layer v0 — critical path 0–50ms.
 * Instant ACK · voice trigger · presence — never waits for governance.
 */

import { speakVoiceInstantAckV0 } from "./voiceInstantAckV0.js";
import {
  emitVoiceOutputWithFallbackV0,
  VOICE_OUTPUT_CHANNEL_V0
} from "./rhizohVoiceOutputAdapterChainV0.js";
import {
  buildPresenceSignatureV0,
  PRESENCE_EVENT_KIND_V0
} from "./rhizohPresenceSignatureV0.js";
import {
  RHIZOH_OUTPUT_CONTRACT_SCHEMA_V0,
  OUTPUT_CHANNEL_V0,
  RENDER_AS_V0
} from "./rhizohOutputContractRouterV0.js";
import { scheduleThinkingObservationV0 } from "./rhizohThinkingLayerV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_LIVE_LAYER_SCHEMA_V0 = "rhizoh.live_layer.v0";

/** @type {object | null} */
let lastLiveEmitV0 = null;
/** @type {number} */
let lastLiveEmitAtMsV0 = 0;

export function getLastLiveEmitAtMsV0() {
  return lastLiveEmitAtMsV0 || lastLiveEmitV0?.signature?.atMs || 0;
}

/**
 * Fire-and-forget live presence — voice/UI immediate, thinking async after.
 * @param {object} opts
 */
export function emitLivePresenceV0(opts = {}) {
  const phrase = String(opts.phrase || "").trim();
  if (!phrase) return Object.freeze({ ok: false, reason: "empty_phrase", layer: "live" });

  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const signature = buildPresenceSignatureV0({
    kind: opts.kind || PRESENCE_EVENT_KIND_V0.ACK,
    carrier: opts.carrier || "local",
    emotionalTone: opts.emotionalTone,
    intent: opts.intent
  });

  let spoke = false;
  if (opts.speak !== false && typeof window !== "undefined") {
    const out = emitVoiceOutputWithFallbackV0(
      phrase,
      () =>
        speakVoiceInstantAckV0(phrase, {
          traceId: opts.traceId,
          moduleId: opts.moduleId || "live_layer",
          skipSovereigntyGate: true
        }),
      { source: signature.kind, traceId: opts.traceId, llmBypass: true }
    );
    spoke = out.ok === true && out.channel === VOICE_OUTPUT_CHANNEL_V0.SPEECH_SYNTHESIS;
  }

  if (typeof window !== "undefined") {
    const uiEnvelope = Object.freeze({
      schema: RHIZOH_OUTPUT_CONTRACT_SCHEMA_V0,
      channel: OUTPUT_CHANNEL_V0.UI_PRESENCE,
      renderAs: RENDER_AS_V0.PRESENCE_CHIP,
      isMessage: false,
      isResponse: false,
      isPresenceEvent: true,
      isChatBubble: false,
      signature,
      phrase,
      layer: "live",
      atMs: Date.now()
    });
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastOutputContract = uiEnvelope;
    window.dispatchEvent(new CustomEvent("rhizoh:output-contract-v0", { detail: uiEnvelope }));
  }

  const latencyMs = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0
  );

  const event = Object.freeze({
    ok: true,
    layer: "live",
    schema: RHIZOH_LIVE_LAYER_SCHEMA_V0,
    latencyMs,
    latencyClass: latencyMs <= 50 ? "instant" : "live",
    signature,
    phrase,
    spoke,
    carrier: signature.carrier,
    llmBypass: true,
    blockingGovernance: false,
    fireAndForget: true
  });

  lastLiveEmitV0 = event;
  lastLiveEmitAtMsV0 = Date.now();

  logVoiceInfoV0("LIVE_PRESENCE_EMIT", {
    kind: signature.kind,
    spoke,
    latencyMs,
    source: opts.source || "live_layer"
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastLivePresence = event;
    window.__rhizoh.lastPresenceEvent = event;
    window.dispatchEvent(new CustomEvent("rhizoh:live-presence-v0", { detail: event }));
    window.dispatchEvent(new CustomEvent("rhizoh:presence-event-v0", { detail: event }));
  }

  if (opts.observe !== false) {
    scheduleThinkingObservationV0({
      source: opts.source || "live_presence",
      signature,
      phrase,
      traceId: opts.traceId,
      intent: opts.intent,
      carrier: opts.carrier || signature.carrier,
      kind: opts.kind || signature.kind,
      emotionalTone: opts.emotionalTone,
      modality: opts.modality,
      incrementTurn: opts.incrementTurn,
      userInitiated: opts.userInitiated,
      liveEvent: event
    });
  }

  return event;
}

export function getLiveLayerSnapshotV0() {
  const snap = Object.freeze({
    schema: RHIZOH_LIVE_LAYER_SCHEMA_V0,
    role: "critical_path",
    blocksOnGovernance: false,
    lastEmit: lastLiveEmitV0,
    targetLatencyMs: 50
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.liveLayer = snap;
  }
  return snap;
}

/** @internal vitest */
export function __resetLiveLayerForTestV0() {
  lastLiveEmitV0 = null;
  lastLiveEmitAtMsV0 = 0;
}

/** @internal vitest */
export function __setLastLiveEmitAtMsForTestV0(ms) {
  lastLiveEmitAtMsV0 = Number(ms) || 0;
}
