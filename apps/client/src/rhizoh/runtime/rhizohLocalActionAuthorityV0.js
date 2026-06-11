/**
 * Local Action Authority — Local Rhizoh vs Remote LLM routing.
 * @see docs/RHIZOH_LOCAL_ACTION_AUTHORITY_V0.md
 */

import { resolveGrammarFromUtteranceV0 } from "./rhizohGrammarConstitutionV0.js";
import { detectCastleIntentWithoutCoords } from "../../kernel/rhizohCommandParser.js";
import {
  formatLocalSurfaceEnterReplyV0,
  formatPlainIntentChosenV0,
  resolveLocalMapToolLineV0,
  resolveLocalPanelOpenLineV0
} from "./rhizohProductCopyI18nV0.js";
import { readUiLocaleV0 } from "./rhizohUiLocaleV0.js";
import { T0_INTENT_ANCHORS_V0 } from "./t0ContextStripV0.js";

export const RHIZOH_LOCAL_ACTION_BINDING_V0 =
  "Local Rhizoh acts first — surface, grammar, and continuity without the remote model.";

export const RHIZOH_LOCAL_ACTION_AUTHORITY_CONTRACT_V0 = "rhizoh-local-action-authority-v0";
export const RHIZOH_LOCAL_ACTION_EVENT_V0 = "rhizoh:local-action";

export const LOCAL_AUTHORITY_LOCAL_V0 = "local";
export const LOCAL_AUTHORITY_REMOTE_V0 = "remote";

/**
 * @param {ReturnType<typeof resolveGrammarFromUtteranceV0>} grammar
 */
function buildLocalPayloadFromGrammarV0(grammar, utterance) {
  const locale = readUiLocaleV0();
  if (detectCastleIntentWithoutCoords(utterance)) {
    const reply =
      locale === "tr"
        ? "Kale oluşturma kapısını açıyorum — konum seçebilir, GPS kullanabilir veya soyut düğümle başlayabilirsin."
        : "Opening castle creation — choose a place, use GPS, or start with an abstract node.";
    return Object.freeze({
      authority: LOCAL_AUTHORITY_LOCAL_V0,
      kind: "CASTLE_CREATE",
      surface: "world",
      intentBias: "produce",
      user_reply_tr: reply,
      pulse_line: `Local · ${reply}`,
      grammar,
      utterance: String(utterance || "").slice(0, 240),
      binding: RHIZOH_LOCAL_ACTION_BINDING_V0
    });
  }
  if (grammar.action === "OPEN_PANEL" && grammar.panel) {
    const panel = String(grammar.panel);
    const label = resolveLocalPanelOpenLineV0(panel, locale);
    return Object.freeze({
      authority: LOCAL_AUTHORITY_LOCAL_V0,
      kind: "OPEN_PANEL",
      panel,
      surface: null,
      intentBias: grammar.intentBias,
      user_reply_tr: label,
      pulse_line: `Local · ${label}`,
      grammar,
      utterance: String(utterance || "").slice(0, 240),
      binding: RHIZOH_LOCAL_ACTION_BINDING_V0
    });
  }
  if (grammar.action === "OPEN_MAP_TOOL") {
    const mapTool = String(grammar.mapTool || "city_map");
    const label = resolveLocalMapToolLineV0(mapTool, locale);
    return Object.freeze({
      authority: LOCAL_AUTHORITY_LOCAL_V0,
      kind: "OPEN_MAP_TOOL",
      mapTool,
      surface: "world",
      intentBias: grammar.intentBias,
      user_reply_tr: label,
      pulse_line: `Local · ${label}`,
      grammar,
      utterance: String(utterance || "").slice(0, 240),
      binding: RHIZOH_LOCAL_ACTION_BINDING_V0
    });
  }
  if (grammar.action === "ENTER_SURFACE" && grammar.surface) {
    const surface = String(grammar.surface);
    return Object.freeze({
      authority: LOCAL_AUTHORITY_LOCAL_V0,
      kind: "ENTER_SURFACE",
      surface,
      intentBias: grammar.intentBias,
      user_reply_tr: formatLocalSurfaceEnterReplyV0(surface, locale),
      pulse_line: `Local · ${formatLocalSurfaceEnterReplyV0(surface, locale)}`,
      grammar,
      utterance: String(utterance || "").slice(0, 240),
      binding: RHIZOH_LOCAL_ACTION_BINDING_V0
    });
  }
  if (grammar.action === "SET_INTENT" && grammar.intentBias) {
    const intent = String(grammar.intentBias);
    const row = T0_INTENT_ANCHORS_V0.find((a) => a.id === intent);
    const label = locale === "tr" ? row?.label_tr || intent : row?.label_en || intent;
    const reply = formatPlainIntentChosenV0(intent, locale);
    return Object.freeze({
      authority: LOCAL_AUTHORITY_LOCAL_V0,
      kind: "SET_INTENT",
      surface: null,
      intentBias: intent,
      user_reply_tr: reply,
      pulse_line: `Local · ${label}`,
      grammar,
      utterance: String(utterance || "").slice(0, 240),
      binding: RHIZOH_LOCAL_ACTION_BINDING_V0
    });
  }
  return null;
}

/**
 * @param {string} utterance
 * @returns {ReturnType<typeof buildLocalPayloadFromGrammarV0> | {
 *   authority: typeof LOCAL_AUTHORITY_REMOTE_V0,
 *   kind: 'llm',
 *   binding: string
 * }}
 */
export function resolveLocalActionAuthorityV0(utterance) {
  const grammar = resolveGrammarFromUtteranceV0(utterance);
  const local = buildLocalPayloadFromGrammarV0(grammar, utterance);
  if (local) return local;
  return Object.freeze({
    authority: LOCAL_AUTHORITY_REMOTE_V0,
    kind: "llm",
    binding: RHIZOH_LOCAL_ACTION_BINDING_V0
  });
}

/**
 * @param {NonNullable<ReturnType<typeof buildLocalPayloadFromGrammarV0>>} payload
 */
export function emitLocalActionAuthorityV0(payload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_LOCAL_ACTION_EVENT_V0, { detail: payload })
  );
}
