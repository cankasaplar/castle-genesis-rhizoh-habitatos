/**
 * Local Action Authority — Local Rhizoh vs Remote LLM routing.
 * @see docs/RHIZOH_LOCAL_ACTION_AUTHORITY_V0.md
 */

import { resolveGrammarFromUtteranceV0 } from "./rhizohGrammarConstitutionV0.js";
import {
  formatLocalIntentReplyTrV0,
  formatLocalSurfaceEnterReplyTrV0,
  RHIZOH_LOCAL_ACTION_BINDING_V0
} from "./rhizohProductCopyV0.js";
import { T0_INTENT_ANCHORS_V0 } from "./t0ContextStripV0.js";

export const RHIZOH_LOCAL_ACTION_AUTHORITY_CONTRACT_V0 = "rhizoh-local-action-authority-v0";
export const RHIZOH_LOCAL_ACTION_EVENT_V0 = "rhizoh:local-action";

export const LOCAL_AUTHORITY_LOCAL_V0 = "local";
export const LOCAL_AUTHORITY_REMOTE_V0 = "remote";

/**
 * @param {ReturnType<typeof resolveGrammarFromUtteranceV0>} grammar
 */
function buildLocalPayloadFromGrammarV0(grammar, utterance) {
  if (grammar.action === "ENTER_SURFACE" && grammar.surface) {
    const surface = String(grammar.surface);
    return Object.freeze({
      authority: LOCAL_AUTHORITY_LOCAL_V0,
      kind: "ENTER_SURFACE",
      surface,
      intentBias: grammar.intentBias,
      user_reply_tr: formatLocalSurfaceEnterReplyTrV0(surface),
      pulse_line: `Yerel · ${formatLocalSurfaceEnterReplyTrV0(surface)}`,
      grammar,
      utterance: String(utterance || "").slice(0, 240),
      binding: RHIZOH_LOCAL_ACTION_BINDING_V0
    });
  }
  if (grammar.action === "SET_INTENT" && grammar.intentBias) {
    const intent = String(grammar.intentBias);
    const label = T0_INTENT_ANCHORS_V0.find((a) => a.id === intent)?.label_tr || intent;
    return Object.freeze({
      authority: LOCAL_AUTHORITY_LOCAL_V0,
      kind: "SET_INTENT",
      surface: null,
      intentBias: intent,
      user_reply_tr: formatLocalIntentReplyTrV0(intent),
      pulse_line: `Yerel · ${label}`,
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
