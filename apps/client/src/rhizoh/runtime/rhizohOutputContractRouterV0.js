/**
 * Output Contract Router v0 — semantic output boundary.
 * presence → UI strip only · voice → audio only · system → log only
 */

import { speakVoiceInstantAckV0 } from "./voiceInstantAckV0.js";
import { enqueueTextOutputV0 } from "./rhizohVoiceOutputAdapterChainV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_OUTPUT_CONTRACT_SCHEMA_V0 = "rhizoh.output_contract_router.v0";

export const OUTPUT_CHANNEL_V0 = Object.freeze({
  VOICE: "voice_only",
  UI_PRESENCE: "ui_presence_strip",
  LOG: "log_only",
  NONE: "none"
});

export const RENDER_AS_V0 = Object.freeze({
  PRESENCE_CHIP: "presence_chip",
  PRESENCE_PULSE: "presence_pulse",
  SYSTEM_LOG: "system_log",
  CHAT_MESSAGE: "chat_message"
});

/**
 * @param {object} governance — from governPulseEventV0
 * @param {object} payload
 */
export function routeGovernedOutputV0(governance, payload = {}) {
  const phrase = String(payload.phrase || "").trim();
  const signature = payload.signature;
  if (!phrase || !governance?.emit) {
    return Object.freeze({ ok: false, reason: "governance_blocked", channels: [] });
  }

  /** @type {object[]} */
  const channels = [];

  if (governance.voiceEligible) {
    let spoke = false;
    try {
      spoke =
        speakVoiceInstantAckV0(phrase, {
          traceId: payload.traceId,
          moduleId: "output_contract_voice"
        }) === true;
    } catch {
      spoke = false;
    }
    if (!spoke) {
      enqueueTextOutputV0(phrase, {
        source: "voice_contract_fallback",
        traceId: payload.traceId,
        contract: RHIZOH_OUTPUT_CONTRACT_SCHEMA_V0,
        renderAs: RENDER_AS_V0.PRESENCE_CHIP
      });
    }
    channels.push(
      Object.freeze({
        channel: OUTPUT_CHANNEL_V0.VOICE,
        renderAs: RENDER_AS_V0.PRESENCE_CHIP,
        spoke,
        contractBound: true
      })
    );
  }

  if (governance.uiEligible) {
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
      eventWeight: governance.eventWeight,
      atMs: Date.now()
    });
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.lastOutputContract = uiEnvelope;
      window.dispatchEvent(
        new CustomEvent("rhizoh:output-contract-v0", { detail: uiEnvelope })
      );
    }
    channels.push(
      Object.freeze({
        channel: OUTPUT_CHANNEL_V0.UI_PRESENCE,
        renderAs: RENDER_AS_V0.PRESENCE_CHIP,
        contractBound: true
      })
    );
  }

  if (governance.logAllowed || governance.logOnly) {
    logVoiceInfoV0("OUTPUT_CONTRACT_LOG", {
      kind: signature?.kind,
      weight: governance.eventWeight,
      preview: phrase.slice(0, 64),
      suppressed: governance.suppressed
    });
    channels.push(
      Object.freeze({
        channel: OUTPUT_CHANNEL_V0.LOG,
        renderAs: RENDER_AS_V0.SYSTEM_LOG,
        contractBound: true
      })
    );
  }

  const result = Object.freeze({
    ok: channels.length > 0,
    channels: Object.freeze(channels),
    dominantChannel: governance.dominantChannel,
    contract: RHIZOH_OUTPUT_CONTRACT_SCHEMA_V0
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.outputContractRouter = result;
  }

  return result;
}

export function getOutputContractSnapshotV0() {
  if (typeof window === "undefined") {
    return Object.freeze({ schema: RHIZOH_OUTPUT_CONTRACT_SCHEMA_V0, available: false });
  }
  return Object.freeze({
    schema: RHIZOH_OUTPUT_CONTRACT_SCHEMA_V0,
    available: true,
    lastContract: window.__rhizoh?.lastOutputContract ?? null,
    channels: Object.freeze(Object.values(OUTPUT_CHANNEL_V0))
  });
}
