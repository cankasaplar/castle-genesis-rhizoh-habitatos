/**
 * OLP-bound instant ack — semantic intent + render locale + tone (no UI fast-path pools).
 */

import { readOlpInteractionToneV0 } from "./rhizohOlpInteractionToneV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { normalizeUiLocaleV0 } from "./rhizohUiLocaleV0.js";

export const INSTANT_ACK_SCHEMA_V0 = "castle.instant_ack.v0";

const INSTANT_ACK_PHRASES_V0 = Object.freeze({
  en: Object.freeze(["Got it, listening.", "Okay, one moment.", "Yes, give me a second."]),
  tr: Object.freeze(["Anladım, bakıyorum.", "Tamam, dinliyorum.", "Evet, bir saniye."]),
  es: Object.freeze(["Entendido, escucho.", "Un momento.", "Sí, un segundo."]),
  fr: Object.freeze(["Compris, j'écoute.", "Un instant.", "Oui, une seconde."]),
  fi: Object.freeze(["Selvä, kuuntelen.", "Hetki.", "Kyllä, hetki."]),
  zh: Object.freeze(["好的，在听。", "请稍等。", "嗯，一秒钟。"]),
  ja: Object.freeze(["わかりました、聞いています。", "少々お待ちください。", "はい、少し待って。"])
});

function pickFromPool(pool, locale) {
  const loc = normalizeUiLocaleV0(locale);
  const list = pool[loc] || pool.en;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * @param {{ locale?: string, intent?: "acknowledge" }} [opts]
 * @returns {Readonly<{
 *   schema: string,
 *   semanticIntent: string,
 *   renderLocale: string,
 *   tone: string,
 *   text: string
 * }>}
 */
export function selectInstantAckV0(opts = {}) {
  const semanticIntent = String(opts.intent || "acknowledge");
  const renderLocale = normalizeUiLocaleV0(opts.locale ?? resolveOutputLanguageCodeV0());
  const tone = readOlpInteractionToneV0();
  const text = pickFromPool(INSTANT_ACK_PHRASES_V0, renderLocale);
  return Object.freeze({
    schema: INSTANT_ACK_SCHEMA_V0,
    semanticIntent,
    renderLocale,
    tone,
    text
  });
}

/** @param {string} [locale] */
export function pickVoiceInstantAckPhraseV0(locale) {
  return selectInstantAckV0({ locale, intent: "acknowledge" }).text;
}
