/**
 * Local / edge reflex layer — 0–50ms target, template + pattern memory, no LLM.
 */

import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { commitFinalUserVisibleLanguageV0 } from "./rhizohFinalLanguageCommitV0.js";
import {
  classifyMicroIntentFromTextV0,
  MICRO_INTENT_V0,
  MICRO_REPLY_TEMPLATES_V0
} from "./rhizohMicroIntentRouterV0.js";
import { pickMicroReplyWithMemoryV0, recordMicroReplyPatternV0 } from "./rhizohMicroPatternMemoryV0.js";
import {
  classifyRhizohIntentV0,
  INTENT_ROUTE_CLASS_V0,
  shouldInvokeRhizohLlmV0,
  resolveAmbientReplyV0,
  resolveContinuationHoldReplyV0,
  detectAmbientSpeechV0,
  detectContinuationSpeechV0
} from "./rhizohIntentRouterV0.js";
import { logRhizohReflexTurnV0 } from "./rhizohReflexTurnLogV0.js";
import { executeMicroIntentVoiceV0 } from "./rhizohMicroIntentRouterV0.js";
import { executeLocalVoiceCommandV0 } from "./rhizohVoiceCommandRouterV0.js";
import { VOICE_ROUTE_EXECUTION_V0 } from "./rhizohVoiceCommandRouterV0.js";

export const RHIZOH_LOCAL_REFLEX_SCHEMA_V0 = "castle.rhizoh.local_reflex.v0";

/** Short unknown utterance — minimal ack without LLM. */
const UNKNOWN_ACK_V0 = Object.freeze({
  tr: Object.freeze(["Buradayım.", "Dinliyorum.", "Devam edebilirsin."]),
  en: Object.freeze(["I'm here.", "Listening.", "Go ahead."])
});

/**
 * @param {string} intentId
 * @param {string} [locale]
 */
function pickTemplateReplyV0(intentId, locale) {
  const loc = String(locale || resolveOutputLanguageCodeV0() || "tr").toLowerCase().slice(0, 2);
  const table = MICRO_REPLY_TEMPLATES_V0[intentId] || MICRO_REPLY_TEMPLATES_V0[MICRO_INTENT_V0.ACK];
  const list = table[loc] || table.en || table.tr;
  return pickMicroReplyWithMemoryV0(intentId, loc, list);
}

/**
 * @param {string} message
 * @param {{ traceId?: string, locale?: string }} [opts]
 */
export function tryLocalReflexReplyV0(message, opts = {}) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const locale = opts.locale || resolveOutputLanguageCodeV0();

  if (detectAmbientSpeechV0(message)) {
    const reply = resolveAmbientReplyV0(locale);
    if (!reply) {
      return Object.freeze({
        reply: "",
        silencePreferred: true,
        llmBypass: true,
        routeClass: INTENT_ROUTE_CLASS_V0.AMBIENT,
        source: "ambient"
      });
    }
    const traceId = opts.traceId ? String(opts.traceId) : null;
    const committed = commitFinalUserVisibleLanguageV0(reply, {
      source: "ambient",
      traceId,
      lockKey: "language_commit_lock"
    });
    return Object.freeze({
      reply: committed.text,
      directive: "FOCUS_RHIZOH",
      source: "ambient",
      routeClass: INTENT_ROUTE_CLASS_V0.AMBIENT,
      llmBypass: true
    });
  }

  if (detectContinuationSpeechV0(message)) {
    const hold = resolveContinuationHoldReplyV0(message, locale);
    const traceId = opts.traceId ? String(opts.traceId) : null;
    const committed = commitFinalUserVisibleLanguageV0(hold.reply, {
      source: "continuation_hold",
      traceId,
      lockKey: "language_commit_lock"
    });
    logRhizohReflexTurnV0({
      intent: "continuation",
      response: committed.text,
      latencyMs: hold.latencyMs,
      source: "continuation_hold",
      traceId,
      channel: "text"
    });
    return Object.freeze({
      reply: committed.text,
      directive: "FOCUS_RHIZOH",
      source: "continuation_hold",
      routeClass: INTENT_ROUTE_CLASS_V0.CONTINUATION,
      llmBypass: true,
      latencyMs: hold.latencyMs
    });
  }

  const intent = classifyRhizohIntentV0(message);
  if (shouldInvokeRhizohLlmV0(intent)) return null;
  let reply = "";
  let kind = intent.routeClass;

  if (intent.routeClass === INTENT_ROUTE_CLASS_V0.COMMAND) {
    return null;
  }

  if (intent.microIntent) {
    reply = pickTemplateReplyV0(intent.microIntent, locale);
    kind = intent.microIntent;
  } else if (intent.routeClass === INTENT_ROUTE_CLASS_V0.UNKNOWN) {
    const loc = String(locale).slice(0, 2);
    const list = UNKNOWN_ACK_V0[loc] || UNKNOWN_ACK_V0.en;
    reply = list[Math.floor(Math.random() * list.length)];
    kind = "unknown_ack";
  } else {
    return null;
  }

  const traceId = opts.traceId ? String(opts.traceId) : null;
  const committed = commitFinalUserVisibleLanguageV0(reply, {
    source: "local_reflex",
    traceId,
    idempotencyKey: traceId ? `reflex:${traceId}:${kind}` : `reflex:${kind}`,
    lockKey: "language_commit_lock"
  });
  recordMicroReplyPatternV0(kind, locale, committed.text);
  logRhizohReflexTurnV0({
    intent: kind,
    response: committed.text,
    latencyMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0),
    source: "local_reflex",
    layer: "intent_router",
    traceId: opts.traceId,
    channel: "text"
  });

  return Object.freeze({
    reply: committed.text,
    directive: "FOCUS_RHIZOH",
    source: "local_reflex",
    routeClass: intent.routeClass,
    microIntent: intent.microIntent,
    confidence: intent.confidence,
    llmBypass: true,
    latencyMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0)
  });
}

/**
 * Voice route execution for reflex layer.
 * @param {ReturnType<import("./rhizohVoiceCommandRouterV0.js").routeVoiceInputV0>} route
 * @param {{ traceId?: string }} [opts]
 */
export function executeLocalReflexFromRouteV0(route, opts = {}) {
  if (route.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL) {
    return executeLocalVoiceCommandV0(route, opts);
  }
  if (route.execution === VOICE_ROUTE_EXECUTION_V0.FAST_LOCAL) {
    return executeMicroIntentVoiceV0(route, opts);
  }
  return null;
}
