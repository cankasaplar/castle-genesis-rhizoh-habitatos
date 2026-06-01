/**
 * Rhizoh Grammar Constitution System (RGCS) v0 — sealed dictionary + utterance mapping.
 * @see docs/RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md
 */

import {
  T0_INTENT_CONNECT_V0,
  T0_INTENT_EXPLORE_V0,
  T0_INTENT_OBSERVE_V0,
  T0_INTENT_PRODUCE_V0
} from "./t0ContextStripV0.js";
import { T0_GRAMMAR_AXIS_INTENT_V0, T0_GRAMMAR_AXIS_STATE_V0 } from "./rhizohT0CognitiveGrammarV0.js";

export const RHIZOH_GRAMMAR_CONSTITUTION_CONTRACT_V0 = "rhizoh-grammar-constitution-v0";

export const RGCS_EVOLUTION_BINDING_SENTENCE_V0 =
  "Rhizoh language evolves in meaning space, not in rule space.";

/** Immutable constitution pillars — never extended at runtime in v0 */
export const RHIZOH_GRAMMAR_CONSTITUTION_V0 = Object.freeze({
  state: Object.freeze({ id: "state", mutable: false }),
  intent: Object.freeze({
    id: "intent",
    mutable: false,
    values: Object.freeze([
      T0_INTENT_EXPLORE_V0,
      T0_INTENT_PRODUCE_V0,
      T0_INTENT_OBSERVE_V0,
      T0_INTENT_CONNECT_V0
    ])
  }),
  field: Object.freeze({
    id: "field",
    mutable: false,
    signals: Object.freeze(["density", "deformation", "tension"])
  }),
  transition: Object.freeze({
    id: "transition",
    mutable: false,
    kinds: Object.freeze(["entry", "micro_rtl", "pal_restore"])
  })
});

/** Sealed dictionary tokens → grammar projection */
export const RHIZOH_GRAMMAR_DICTIONARY_V0 = Object.freeze({
  studio: Object.freeze({
    seal: "dictionary_seal_v0",
    surface: "studio",
    intentBias: T0_INTENT_PRODUCE_V0,
    pillar: T0_GRAMMAR_AXIS_STATE_V0
  }),
  map: Object.freeze({
    seal: "dictionary_seal_v0",
    surface: "world",
    intentBias: T0_INTENT_EXPLORE_V0,
    pillar: T0_GRAMMAR_AXIS_STATE_V0
  }),
  world: Object.freeze({
    seal: "dictionary_seal_v0",
    surface: "world",
    intentBias: T0_INTENT_EXPLORE_V0,
    pillar: T0_GRAMMAR_AXIS_STATE_V0
  }),
  chat: Object.freeze({
    seal: "dictionary_seal_v0",
    surface: "chat",
    intentBias: T0_INTENT_CONNECT_V0,
    pillar: T0_GRAMMAR_AXIS_STATE_V0
  }),
  pal: Object.freeze({
    seal: "dictionary_seal_v0",
    transition: "pal_restore",
    pillar: "transition"
  }),
  continuity: Object.freeze({
    seal: "dictionary_seal_v0",
    transition: "entry",
    pillar: "transition"
  })
});

/**
 * @param {string} proposedPillar
 * @returns {{ allowed: boolean, reason: string }}
 */
export function evaluateConstitutionMutationV0(proposedPillar) {
  const id = String(proposedPillar || "").trim().toLowerCase();
  if (!id) {
    return Object.freeze({ allowed: false, reason: "empty_pillar" });
  }
  if (Object.prototype.hasOwnProperty.call(RHIZOH_GRAMMAR_CONSTITUTION_V0, id)) {
    return Object.freeze({ allowed: false, reason: "constitution_immutable" });
  }
  return Object.freeze({ allowed: false, reason: "new_rule_system_forbidden" });
}

/**
 * Deterministic v0 utterance → grammar (no LLM). Turkish + English fragments.
 * @param {string} utterance
 */
export function resolveGrammarFromUtteranceV0(utterance) {
  const text = String(utterance || "")
    .trim()
    .toLowerCase();
  const empty = Object.freeze({
    action: null,
    surface: null,
    intentBias: null,
    mutation: Object.freeze({ allowed: false, reason: "no_match" }),
    seal: null
  });
  if (!text) return empty;

  const enter =
    /\b(geç|geçelim|geçer|gidelim|git|gidelim|aç|open|enter|go to|switch|göster)\b/.test(text) ||
    text.includes("katman") ||
    /\b(ya|ye)\s*geç\b/.test(text);
  const studio = /\b(studio|stüdyo|studyo)\b/.test(text);
  const map = /\b(map|harita|world|dünya|dunya)\b/.test(text);

  if (studio && (enter || /\b(studio|stüdyo)\s*(ya|ye)?\s*geç/.test(text))) {
    const dict = RHIZOH_GRAMMAR_DICTIONARY_V0.studio;
    return Object.freeze({
      action: "ENTER_SURFACE",
      surface: dict.surface,
      intentBias: dict.intentBias,
      mutation: Object.freeze({ allowed: true, reason: "meaning_variation" }),
      seal: dict.seal,
      pillar: dict.pillar
    });
  }

  if (map && enter) {
    const dict = RHIZOH_GRAMMAR_DICTIONARY_V0.map;
    return Object.freeze({
      action: "ENTER_SURFACE",
      surface: dict.surface,
      intentBias: dict.intentBias,
      mutation: Object.freeze({ allowed: true, reason: "meaning_variation" }),
      seal: dict.seal,
      pillar: dict.pillar
    });
  }

  if (/\b(keşfet|explore)\b/.test(text)) {
    return Object.freeze({
      action: "SET_INTENT",
      surface: null,
      intentBias: T0_INTENT_EXPLORE_V0,
      mutation: Object.freeze({ allowed: true, reason: "meaning_variation" }),
      seal: "dictionary_seal_v0",
      pillar: T0_GRAMMAR_AXIS_INTENT_V0
    });
  }

  return empty;
}
