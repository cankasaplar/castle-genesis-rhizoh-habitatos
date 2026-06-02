/**
 * Input class — COMMAND (deterministic) vs DIALOGUE vs NARRATIVE (silent synthesis → reply).
 * Builds on voice command router; does not replace routeVoiceInputV0 execution choice.
 */

import { isHardSilentCommandRouteV0 } from "./rhizohCommandGateV0.js";
import { routeVoiceInputV0, VOICE_ROUTE_EXECUTION_V0 } from "./rhizohVoiceCommandRouterV0.js";

export const RHIZOH_CONVERSATION_INTENT_SCHEMA_V0 = "castle.rhizoh.conversation_intent.v0";

export const RHIZOH_INPUT_CLASS_V0 = Object.freeze({
  COMMAND: "COMMAND",
  DIALOGUE: "DIALOGUE",
  NARRATIVE: "NARRATIVE"
});

const NARRATIVE_CHAR_MIN_V0 = 220;
const NARRATIVE_WORD_MIN_V0 = 38;

/**
 * @param {string} text
 * @param {{ sttInferred?: string }} [ctx]
 */
export function classifyRhizohInputClassV0(text, ctx = {}) {
  const raw = String(text || "").trim();
  const route = routeVoiceInputV0(raw, ctx);
  const intent = route.intent;
  const gate = route.commandGate;

  if (isHardSilentCommandRouteV0(route)) {
    return Object.freeze({
      schema: RHIZOH_CONVERSATION_INTENT_SCHEMA_V0,
      class: RHIZOH_INPUT_CLASS_V0.COMMAND,
      intentType: intent?.type,
      execution: route.execution,
      matchKind: gate?.matchKind,
      commandConfidence: gate?.commandConfidence,
      canonical: route.canonical || route.grammarLocal?.kind || null,
      silentSynthesis: true,
      suppressFillerSpeech: true,
      suppressInstantAck: true
    });
  }

  const words = raw.split(/\s+/).filter(Boolean).length;
  const isNarrative =
    raw.length >= NARRATIVE_CHAR_MIN_V0 ||
    words >= NARRATIVE_WORD_MIN_V0 ||
    /\b(hikaye|anlat|çünkü|sonra|dün|bugün|hisset|yaşadım|remember|because|yesterday)\b/i.test(raw);

  const inputClass = isNarrative ? RHIZOH_INPUT_CLASS_V0.NARRATIVE : RHIZOH_INPUT_CLASS_V0.DIALOGUE;

  return Object.freeze({
    schema: RHIZOH_CONVERSATION_INTENT_SCHEMA_V0,
    class: inputClass,
    intentType: intent.type,
    execution: route.execution,
    canonical: null,
    silentSynthesis: true,
    suppressFillerSpeech: true,
    suppressInstantAck: true,
    wordCount: words,
    charCount: raw.length
  });
}

/**
 * @param {ReturnType<typeof classifyRhizohInputClassV0>} snap
 */
export function publishRhizohInputClassV0(snap) {
  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_INPUT_CLASS__ = snap;
  }
  return snap;
}
