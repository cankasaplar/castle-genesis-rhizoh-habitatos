/**
 * SPECFLOW: CORE-ELIGIBLE — lightweight, synchronous; no network.
 * Detection only; reaction lives in state machine + persona + initiative.
 */

/**
 * @param {string} text
 * @param {string} [navLang] — e.g. navigator.language
 * @returns {{
 *   detectedLocale: string,
 *   register: "informal" | "formal" | "unknown",
 *   audience: "solo" | "guest" | "group" | "unknown",
 *   confidence: number
 * }}
 */
export function detectLanguageContextV0(text, navLang = "") {
  const raw = String(text || "").trim();
  const nav = String(navLang || "").toLowerCase();

  let detectedLocale = "und";
  let confidence = 0.35;

  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(raw)) {
    detectedLocale = "ja";
    confidence = 0.78;
  } else if (/[\u4e00-\u9fff]/.test(raw) && !/[\u3040-\u30ff]/.test(raw)) {
    detectedLocale = "zh";
    confidence = 0.55;
  } else if (/[а-яёії]/i.test(raw)) {
    detectedLocale = "ru";
    confidence = 0.62;
  } else if (/[ğüşıöçĞÜŞİÖÇ]/.test(raw) || /\b(merhaba|selam|nasılsın|nasilsin|teşekkür|tesekkur|yap|musun|mısın|misin)\b/i.test(raw)) {
    detectedLocale = "tr";
    confidence = 0.82;
  } else if (/[a-z]{4,}/i.test(raw) && raw.split(/\s+/).filter(Boolean).length >= 2) {
    detectedLocale = "en";
    confidence = 0.58;
  } else if (raw.length >= 2 && /^[\x00-\x7f]+$/.test(raw)) {
    detectedLocale = nav.startsWith("tr") ? "tr" : nav.startsWith("en") ? "en" : "en";
    confidence = 0.42;
  }

  let register = "unknown";
  const informalHit =
    /\b(hey|yo|lol|haha|selam|slm|naber|nbr|pls|thx|thanks|tnx|ok|tamam|kanka)\b/i.test(raw) || /[!?]{2,}/.test(raw);
  const formalHit =
    /\b(sayın|değerli|rica etsem|lütfen|would you|could you|please|yours sincerely)\b/i.test(raw) || /^Sayın\b/m.test(raw);
  if (informalHit && !formalHit) register = "informal";
  else if (formalHit && !informalHit) register = "formal";

  let audience = "unknown";
  if (/\b(herkese|arkadaşlar|everyone|guys|folks|team)\b/i.test(raw)) {
    audience = "group";
    confidence = Math.min(0.95, confidence + 0.08);
  } else if (raw.length > 0) {
    audience = "solo";
  }

  return { detectedLocale, register, audience, confidence: Math.round(confidence * 1000) / 1000 };
}
