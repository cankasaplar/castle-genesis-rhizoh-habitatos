/**
 * Post-generation validator (step 2) — prompt/OLP directive alone is not deterministic.
 */

import { OLP_MODE_V0, readOutputLanguagePolicyV0, resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { checkTextMatchesOutputLanguageV0 } from "./rhizohLanguageViolationV0.js";

const HARD_REWRITE_STUBS = Object.freeze({
  en: "I'm here with you. Could you say that once more?",
  tr: "Buradayım. Bir kez daha söyler misin?",
  es: "Estoy aquí. ¿Podrías decirlo una vez más?",
  fr: "Je suis là. Peux-tu le redire une fois?"
});

/**
 * @param {string} text
 * @param {{ source?: string, hardRewrite?: boolean }} [opts]
 * @returns {{ text: string, repaired: boolean, violation?: { expected?: string, actual?: string } }}
 */
function shouldHardRewriteV0(opts = {}) {
  return (
    opts.hardRewrite === true ||
    String(typeof import.meta !== "undefined" ? import.meta.env?.VITE_RHIZOH_OLP_HARD_REWRITE || "" : "")
      .trim() === "1"
  );
}

/**
 * Step 1: OLP directive (elsewhere). Step 2: post-generation validate + repair.
 * @param {string} text
 * @param {{ source?: string, hardRewrite?: boolean }} [opts]
 */
export function guardLlmOutputLanguageV0(text, opts = {}) {
  const source = String(opts.source || "llm");
  const raw = String(text || "").trim();
  if (!raw) return { text: raw, repaired: false, step: "pass" };

  const olp = readOutputLanguagePolicyV0();
  const expected = resolveOutputLanguageCodeV0();
  const check = checkTextMatchesOutputLanguageV0(raw, source);

  if (check.ok) {
    return { text: raw, repaired: false, step: "pass", expected };
  }

  const hard = shouldHardRewriteV0(opts) && olp.mode === OLP_MODE_V0.UI_LOCKED_OUTPUT;
  if (!hard) {
    return { text: raw, repaired: false, violation: check, step: "soft_repair", expected };
  }

  const stub = HARD_REWRITE_STUBS[expected] || HARD_REWRITE_STUBS.en;
  return { text: stub, repaired: true, violation: check, step: "hard_rewrite", expected };
}
