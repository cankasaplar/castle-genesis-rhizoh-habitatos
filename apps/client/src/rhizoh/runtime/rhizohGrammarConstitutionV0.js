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
  hall: Object.freeze({
    seal: "dictionary_seal_v0",
    surface: "hall",
    intentBias: T0_INTENT_OBSERVE_V0,
    pillar: T0_GRAMMAR_AXIS_STATE_V0
  }),
  greenroom: Object.freeze({
    seal: "dictionary_seal_v0",
    surface: "greenroom",
    intentBias: T0_INTENT_CONNECT_V0,
    pillar: T0_GRAMMAR_AXIS_STATE_V0
  }),
  broadcast: Object.freeze({
    seal: "dictionary_seal_v0",
    surface: "broadcast",
    intentBias: T0_INTENT_CONNECT_V0,
    pillar: T0_GRAMMAR_AXIS_STATE_V0
  }),
  profile: Object.freeze({
    seal: "dictionary_seal_v0",
    surface: "profile",
    intentBias: T0_INTENT_OBSERVE_V0,
    pillar: T0_GRAMMAR_AXIS_STATE_V0
  }),
  map_tool: Object.freeze({
    seal: "dictionary_seal_v0",
    surface: "world",
    mapTool: "city_map",
    intentBias: T0_INTENT_EXPLORE_V0,
    pillar: T0_GRAMMAR_AXIS_STATE_V0,
    opensMapTool: true
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
    /(?:^|\s)(geç|geçelim|geçer|gidelim|git|aç|göster|goster)(?:\s|$|[!.?])/i.test(text) ||
    text.includes("katman") ||
    /\b(ya|ye)\s*geç\b/.test(text) ||
    /(?:^|\s)(ya|ye)\s*geç(?:\s|$|[!.?])/i.test(text);
  const bareSurface =
    /^(studio|stüdyo|studyo|dünya|dunya|harita|map|world|salon|hall|green\s*room|greenroom|yayın|yayin|broadcast|profil|profile|akademi|academy)\s*[!.?]*$/.test(
      text
    );

  /** @type {Array<{ match: boolean, dict: typeof RHIZOH_GRAMMAR_DICTIONARY_V0.studio }>} */
  const surfaceRules = [
    {
      match:
        (/\b(küre|kure|globe|soyut)\b/.test(text) || /\bküreye\b/.test(text) || /\bkureye\b/.test(text)) &&
        (enter || bareSurface),
      dict: Object.freeze({
        ...RHIZOH_GRAMMAR_DICTIONARY_V0.map_tool,
        mapTool: "globe"
      })
    },
    {
      match:
        /\b(istanbul|şehir\s*haritası|sehir\s*haritasi|city\s*map)\b/.test(text) &&
        (enter || bareSurface),
      dict: Object.freeze({
        ...RHIZOH_GRAMMAR_DICTIONARY_V0.map_tool,
        mapTool: "city_map"
      })
    },
    {
      match:
        /\b(bağlantı\s*nokt|baglanti\s*nokt|anchor|kaleme\s*git|kalene)\b/.test(text) &&
        (enter || bareSurface),
      dict: Object.freeze({
        ...RHIZOH_GRAMMAR_DICTIONARY_V0.map_tool,
        mapTool: "anchor_map"
      })
    },
    {
      match:
        /\b(studio|stüdyo|studyo)\b/.test(text) &&
        (enter || bareSurface || /\b(studio|stüdyo)\s*(ya|ye)?\s*geç/.test(text)),
      dict: RHIZOH_GRAMMAR_DICTIONARY_V0.studio
    },
    {
      match:
        (/\b(harita|map)\b/.test(text) || /\bharitaya\b/.test(text) || /haritas/i.test(text)) &&
        !/\b(dünya|dunyaya|dunya|world)\b/.test(text) &&
        (enter || bareSurface || /\bharitaya\s+geç/.test(text)),
      dict: RHIZOH_GRAMMAR_DICTIONARY_V0.map_tool
    },
    {
      match:
        (/\b(dünya|dunya|world)\b/.test(text) || /\bdünyaya\b/.test(text)) &&
        !/\b(harita|map)\b/.test(text) &&
        !/\bharitaya\b/.test(text) &&
        (enter || bareSurface || /\bdünyaya\s+geç/.test(text)),
      dict: RHIZOH_GRAMMAR_DICTIONARY_V0.world
    },
    {
      match: /\b(salon|hall)\b/.test(text) && (enter || bareSurface),
      dict: RHIZOH_GRAMMAR_DICTIONARY_V0.hall
    },
    {
      match: /\b(green\s*room|greenroom|yeşil\s*oda)\b/.test(text) && (enter || bareSurface),
      dict: RHIZOH_GRAMMAR_DICTIONARY_V0.greenroom
    },
    {
      match: /\b(yayın|yayin|broadcast|canlı|canli)\b/.test(text) && (enter || bareSurface),
      dict: RHIZOH_GRAMMAR_DICTIONARY_V0.broadcast
    },
    {
      match: /\b(profil|profile|ayarlar|settings|akademi|academy)\b/.test(text) && (enter || bareSurface),
      dict: RHIZOH_GRAMMAR_DICTIONARY_V0.profile
    }
  ];

  for (const rule of surfaceRules) {
    if (!rule.match) continue;
    if (rule.dict.opensMapTool) {
      return Object.freeze({
        action: "OPEN_MAP_TOOL",
        surface: rule.dict.surface,
        mapTool: rule.dict.mapTool || "city_map",
        intentBias: rule.dict.intentBias,
        mutation: Object.freeze({ allowed: true, reason: "meaning_variation" }),
        seal: rule.dict.seal,
        pillar: rule.dict.pillar
      });
    }
    return Object.freeze({
      action: "ENTER_SURFACE",
      surface: rule.dict.surface,
      intentBias: rule.dict.intentBias,
      mutation: Object.freeze({ allowed: true, reason: "meaning_variation" }),
      seal: rule.dict.seal,
      pillar: rule.dict.pillar
    });
  }

  if (
    (/\b(tekerlek|yetenek|dünya|dunya)\b/.test(text) || /\b(world|wheel)\b/.test(text)) &&
    (/\b(aç|göster|goster|açık|acik)\b/.test(text) || enter)
  ) {
    return Object.freeze({
      action: "OPEN_PANEL",
      surface: "world",
      panel: "world",
      intentBias: T0_INTENT_EXPLORE_V0,
      mutation: Object.freeze({ allowed: true, reason: "meaning_variation" }),
      seal: "dictionary_seal_v0",
      pillar: T0_GRAMMAR_AXIS_STATE_V0
    });
  }

  if (
    /\b(salon|hall)\b/.test(text) &&
    (/\b(aç|göster|goster|açık|acik)\b/.test(text) || enter)
  ) {
    return Object.freeze({
      action: "OPEN_PANEL",
      surface: "hall",
      panel: "hall",
      intentBias: T0_INTENT_OBSERVE_V0,
      mutation: Object.freeze({ allowed: true, reason: "meaning_variation" }),
      seal: "dictionary_seal_v0",
      pillar: T0_GRAMMAR_AXIS_STATE_V0
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
