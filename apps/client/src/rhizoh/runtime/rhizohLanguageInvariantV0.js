/**
 * Global invariant — audit entrypoints; LLM uses FINAL_COMMIT only (no dual repair).
 */

import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { checkTextMatchesOutputLanguageV0 } from "./rhizohLanguageViolationV0.js";
import { selectInstantAckV0 } from "./rhizohInstantAckSelectV0.js";
import {
  commitFinalUserVisibleLanguageV0,
  LANGUAGE_COMMIT_LOCK_KEY_V0
} from "./rhizohFinalLanguageCommitV0.js";

export const CASTLE_LANGUAGE_INVARIANT_V0 = Object.freeze({
  schema: "castle.language_invariant.v0",
  rule: "outputLocale is single source of all user-visible text",
  enforcedAt: Object.freeze(["instant_ack", "llm", "tts", "ui_helpers"]),
  finalCommitStage: "castle.final_language_commit.v0"
});

/**
 * Non-LLM surfaces — instant_ack / tts / ui_helpers (LLM must use commitFinalUserVisibleLanguageV0).
 * @param {string} source
 * @param {string} text
 * @returns {{ text: string, ok: boolean, repaired: boolean }}
 */
export function enforceUserVisibleTextLocaleV0(source, text, opts = {}) {
  const raw = String(text || "").trim();
  if (!raw) return { text: raw, ok: true, repaired: false };

  const src = String(source || "unknown");
  if (src === "llm") {
    const traceId = opts.traceId ? String(opts.traceId) : undefined;
    const commit = commitFinalUserVisibleLanguageV0(raw, {
      source: "llm",
      traceId,
      idempotencyKey: traceId,
      lockKey: LANGUAGE_COMMIT_LOCK_KEY_V0
    });
    return { text: commit.text, ok: commit.ok, repaired: commit.repaired };
  }

  if (src === "instant_ack") {
    const check = checkTextMatchesOutputLanguageV0(raw, "instant_ack");
    if (check.ok) return { text: raw, ok: true, repaired: false };
    return {
      text: selectInstantAckV0({ intent: "acknowledge" }).text,
      ok: true,
      repaired: true
    };
  }

  if (src === "tts" || src === "ui_helpers") {
    const check = checkTextMatchesOutputLanguageV0(raw, src);
    if (check.ok) return { text: raw, ok: check.ok, repaired: false };
    const commit = commitFinalUserVisibleLanguageV0(raw, { source: src });
    return { text: commit.text, ok: commit.ok, repaired: commit.repaired };
  }

  return { text: raw, ok: true, repaired: false };
}

/**
 * @returns {Readonly<{ invariant: typeof CASTLE_LANGUAGE_INVARIANT_V0, outputLocale: string }>}
 */
export function readCastleLanguageInvariantV0() {
  const snap = Object.freeze({
    invariant: CASTLE_LANGUAGE_INVARIANT_V0,
    outputLocale: resolveOutputLanguageCodeV0()
  });
  if (typeof window !== "undefined") {
    window.__CASTLE_LANGUAGE_INVARIANT__ = snap;
  }
  return snap;
}
