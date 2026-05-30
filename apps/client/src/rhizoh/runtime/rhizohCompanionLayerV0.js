/**
 * Companion rendering bias v0 — NOT a separate meaning layer.
 * Human tonal bias on meaning → speech conversion; no new facts, no dialogue ownership.
 */

import { MF0_INTENT_V0 } from "./rhizohMeaningFrameV0.js";
import { FAST_ROUTE_V0 } from "./rhizohFastConversationRouterV0.js";

export const RHIZOH_COMPANION_LAYER_SCHEMA_V0 = "castle.rhizoh.companion_layer.v0";

export const COMPANION_PRESENCE_MODE_V0 = Object.freeze({
  SILENT: "silent",
  ADAPTIVE: "adaptive",
  EXPRESSIVE: "expressive"
});

export const COMPANION_RELATIONAL_TONE_V0 = Object.freeze({
  CLOSE: "close",
  NEUTRAL: "neutral",
  REFLECTIVE: "reflective"
});

export const COMPANION_INITIATIVE_BIAS_V0 = Object.freeze({
  USER_LED: "user-led",
  CO_LED: "co-led",
  AUTONOMOUS_FLOW: "autonomous-flow"
});

export const COMPANION_CONTINUITY_STYLE_V0 = Object.freeze({
  MEMORY_AWARE: "memory-aware",
  MOMENT_BASED: "moment-based"
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {{
 *   meaningFrame: ReturnType<import("./rhizohMeaningFrameV0.js").extractMeaningFrameV0>,
 *   route?: ReturnType<import("./rhizohFastConversationRouterV0.js").routeFastConversationV0>,
 *   conversationDepth?: Record<string, unknown> | null,
 *   userTurnCount?: number,
 *   voiceTurn?: boolean
 * }} input
 */
export function resolveCompanionLayerV0(input) {
  const mf = input.meaningFrame;
  const route = input.route;
  const depth = mf?.depth ?? 2;
  const turns = Math.max(0, Math.floor(Number(input.userTurnCount) || 0));
  const continuity01 = clamp01(input.conversationDepth?.continuityStrength ?? 0.45);
  const e = mf?.emotionVector || { calm: 0.5, tension: 0.2, curiosity: 0.35 };

  let presenceMode = COMPANION_PRESENCE_MODE_V0.ADAPTIVE;
  if (route?.route === FAST_ROUTE_V0.FAST_GREET) {
    presenceMode = COMPANION_PRESENCE_MODE_V0.EXPRESSIVE;
  } else if (route?.fastPath && mf?.intent === MF0_INTENT_V0.REFLECT && depth <= 2) {
    presenceMode = COMPANION_PRESENCE_MODE_V0.ADAPTIVE;
  } else if (depth >= 4 || mf?.intent === MF0_INTENT_V0.CHALLENGE) {
    presenceMode = COMPANION_PRESENCE_MODE_V0.ADAPTIVE;
  } else if (input.voiceTurn && (mf?.tokenEstimate || 0) === 0) {
    presenceMode = COMPANION_PRESENCE_MODE_V0.SILENT;
  }

  let relationalTone = COMPANION_RELATIONAL_TONE_V0.NEUTRAL;
  if (continuity01 >= 0.65 || turns >= 12) relationalTone = COMPANION_RELATIONAL_TONE_V0.CLOSE;
  else if (mf?.intent === MF0_INTENT_V0.REFLECT || mf?.intent === MF0_INTENT_V0.NARRATE) {
    relationalTone = COMPANION_RELATIONAL_TONE_V0.REFLECTIVE;
  }

  let initiativeBias = COMPANION_INITIATIVE_BIAS_V0.USER_LED;
  if (mf?.intent === MF0_INTENT_V0.NARRATE && continuity01 >= 0.5) {
    initiativeBias = COMPANION_INITIATIVE_BIAS_V0.CO_LED;
  } else if (route?.route === FAST_ROUTE_V0.CONTINUATION) {
    initiativeBias = COMPANION_INITIATIVE_BIAS_V0.CO_LED;
  } else if (depth >= 5) {
    initiativeBias = COMPANION_INITIATIVE_BIAS_V0.AUTONOMOUS_FLOW;
  }

  const continuityStyle =
    mf?.continuityHook || continuity01 >= 0.5
      ? COMPANION_CONTINUITY_STYLE_V0.MEMORY_AWARE
      : COMPANION_CONTINUITY_STYLE_V0.MOMENT_BASED;

  const emotionalAttunement = Object.freeze({
    calm: clamp01(e.calm),
    tension: clamp01(e.tension),
    curiosity: clamp01(e.curiosity),
    warmth: clamp01(e.calm * 0.6 + (1 - e.tension) * 0.25 + e.curiosity * 0.15)
  });

  return Object.freeze({
    schema: RHIZOH_COMPANION_LAYER_SCHEMA_V0,
    renderingBias: true,
    presenceMode,
    relationalTone,
    initiativeBias,
    emotionalAttunement,
    continuityStyle,
    flowModel: "shared_speech_field",
    ownsConversation: false,
    generatesResponses: false,
    shapesResonance: true
  });
}

/**
 * @param {ReturnType<typeof resolveCompanionLayerV0>} companion
 */
export function collapseCompanionPresenceV0(companion) {
  return Object.freeze({
    presenceMode: companion.presenceMode,
    relationalTone: companion.relationalTone,
    initiativeBias: companion.initiativeBias,
    continuityStyle: companion.continuityStyle,
    warmth01: companion.emotionalAttunement.warmth
  });
}

/**
 * @param {ReturnType<import("./rhizohGlobalMeaningProjectorV0.js").projectMeaningFrameV0>} projection
 * @param {ReturnType<typeof resolveCompanionLayerV0>} companion
 */
export function applyCompanionToProjectionV0(projection, companion) {
  let pacing = projection.pacing;
  if (companion.presenceMode === COMPANION_PRESENCE_MODE_V0.EXPRESSIVE) {
    pacing = pacing === "calm" ? "flowing" : pacing;
  } else if (companion.presenceMode === COMPANION_PRESENCE_MODE_V0.SILENT) {
    pacing = "calm";
  }
  if (companion.relationalTone === COMPANION_RELATIONAL_TONE_V0.REFLECTIVE) {
    pacing = "measured";
  }

  const pauseMultiplier =
    companion.relationalTone === COMPANION_RELATIONAL_TONE_V0.CLOSE
      ? projection.pauseMultiplier * 0.95
      : companion.relationalTone === COMPANION_RELATIONAL_TONE_V0.REFLECTIVE
        ? projection.pauseMultiplier * 1.08
        : projection.pauseMultiplier;

  return Object.freeze({
    ...projection,
    pacing,
    pauseMultiplier,
    companionAttunement: Object.freeze({
      presenceMode: companion.presenceMode,
      relationalTone: companion.relationalTone,
      initiativeBias: companion.initiativeBias
    }),
    projectionDirective: Object.freeze({
      ...projection.projectionDirective,
      hint: `${projection.projectionDirective.hint} Companion field: ${companion.presenceMode} presence, ${companion.relationalTone} tone, ${companion.initiativeBias} initiative — sustain flow, do not service-answer.`,
      responseShape:
        companion.initiativeBias === COMPANION_INITIATIVE_BIAS_V0.USER_LED
          ? "co_presence_light"
          : projection.projectionDirective.responseShape
    })
  });
}

/**
 * @param {Record<string, unknown>} conversationBehavior
 * @param {ReturnType<typeof resolveCompanionLayerV0>} companion
 */
export function mergeCompanionIntoConversationBehaviorV0(conversationBehavior, companion) {
  if (!conversationBehavior || typeof conversationBehavior !== "object") return conversationBehavior;
  return Object.freeze({
    ...conversationBehavior,
    companionPresence: collapseCompanionPresenceV0(companion),
    flowModel: companion.flowModel
  });
}

/**
 * Companion flow ack — co-presence, not assistant reply.
 * @param {string} language
 */
export function resolveCompanionFlowAckV0(language) {
  const lang = String(language || "tr").toLowerCase();
  const table = {
    tr: "Buradayız — akış devam edebilir.",
    en: "We're here — the flow can continue.",
    es: "Aquí estamos — el flujo puede seguir.",
    jp: "ここにいます。流れを続けられます。"
  };
  return table[lang] || table.tr;
}

/** @deprecated Use resolveCompanionFlowAckV0 */
export function resolveFastGreetAckV0(language) {
  return resolveCompanionFlowAckV0(language);
}
