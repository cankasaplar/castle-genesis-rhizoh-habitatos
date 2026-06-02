/**
 * Micro intent router — greetings, acks, micro-dialogue without LLM.
 * Control plane: classify → template reply. No castle context attach.
 */

import { commitFinalUserVisibleLanguageV0 } from "./rhizohFinalLanguageCommitV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { normalizeVoiceCommandTokenV0 } from "./rhizohVoiceCommandRouterV0.js";
import { pickMicroReplyWithMemoryV0, recordMicroReplyPatternV0 } from "./rhizohMicroPatternMemoryV0.js";

export const RHIZOH_MICRO_INTENT_SCHEMA_V0 = "castle.rhizoh.micro_intent_router.v0";

export const MICRO_INTENT_V0 = Object.freeze({
  GREETING: "greeting",
  WELLBEING: "wellbeing",
  ACK: "ack",
  YES: "yes",
  NO: "no",
  THANKS: "thanks",
  HELP: "help"
});

/** @type {ReadonlyArray<{ id: string, re: RegExp, maxWords: number }>} */
const MICRO_PATTERNS_V0 = Object.freeze([
  { id: MICRO_INTENT_V0.GREETING, re: /^(selam|merhaba|hey|hi|hello|hola|günaydın|iyi akşam|iyi geceler|naber)(\s|!|\?|$)/, maxWords: 4 },
  {
    id: MICRO_INTENT_V0.WELLBEING,
    re: /^(nasılsın|nasilsin|nasılsınız|how are you|how r u|ne haber|iyi misin)(\s|!|\?|$)/,
    maxWords: 5
  },
  { id: MICRO_INTENT_V0.ACK, re: /^(tamam|ok|okay|peki|anladım|anladim|understood|olur|roger)(\s|!|$)/, maxWords: 3 },
  { id: MICRO_INTENT_V0.YES, re: /^(evet|yes|yeah|aynen|yep)(\s|!|$)/, maxWords: 2 },
  { id: MICRO_INTENT_V0.NO, re: /^(hayır|hayir|no|yok|nope)(\s|!|$)/, maxWords: 2 },
  {
    id: MICRO_INTENT_V0.THANKS,
    re: /^(teşekkür|tesekkur|teşekkürler|sağol|sagol|thanks|thank you)(\s|!|\.|$)/,
    maxWords: 4
  },
  { id: MICRO_INTENT_V0.HELP, re: /^(yardım|yardim|help)(\s|!|\?|$)/, maxWords: 3 }
]);

/** @type {Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>} */
export const MICRO_REPLY_TEMPLATES_V0 = Object.freeze({
  [MICRO_INTENT_V0.GREETING]: Object.freeze({
    tr: Object.freeze(["Merhaba.", "Selam — buradayım.", "Hey, hazırım."]),
    en: Object.freeze(["Hello.", "Hi — I'm here.", "Hey, ready when you are."])
  }),
  [MICRO_INTENT_V0.WELLBEING]: Object.freeze({
    tr: Object.freeze(["İyiyim, sen nasılsın?", "Stabilim — sen nasılsın?", "Hazırım. Sen nasılsın?"]),
    en: Object.freeze(["I'm well — how are you?", "Steady here. And you?", "Ready. How are you?"])
  }),
  [MICRO_INTENT_V0.ACK]: Object.freeze({
    tr: Object.freeze(["Tamam.", "Anladım.", "Peki."]),
    en: Object.freeze(["Okay.", "Got it.", "Sure."])
  }),
  [MICRO_INTENT_V0.YES]: Object.freeze({
    tr: Object.freeze(["Evet.", "Tamam, devam."]),
    en: Object.freeze(["Yes.", "Okay, continuing."])
  }),
  [MICRO_INTENT_V0.NO]: Object.freeze({
    tr: Object.freeze(["Hayır.", "Tamam, yapmıyorum."]),
    en: Object.freeze(["No.", "Okay, won't do that."])
  }),
  [MICRO_INTENT_V0.THANKS]: Object.freeze({
    tr: Object.freeze(["Rica ederim.", "Ne demek.", "Buradayım."]),
    en: Object.freeze(["You're welcome.", "Anytime.", "Here with you."])
  }),
  [MICRO_INTENT_V0.HELP]: Object.freeze({
    tr: Object.freeze([
      "Harita, kamera, ses ve mod komutlarını söyleyebilirsin. Örnek: haritayı aç.",
      "Komut verebilir veya sohbet edebilirsin — kısa komutlar anında çalışır."
    ]),
    en: Object.freeze([
      "Try map, camera, voice, or mode commands — e.g. open map.",
      "You can command or chat — short commands run instantly."
    ])
  })
});

/**
 * @param {string} normalized
 */
export function classifyMicroIntentV0(normalized) {
  const n = String(normalized || "").trim();
  if (!n) return null;
  const words = n.split(/\s+/).filter(Boolean);
  for (const row of MICRO_PATTERNS_V0) {
    if (words.length > row.maxWords) continue;
    if (row.re.test(n)) {
      return Object.freeze({
        id: row.id,
        confidence: 0.94,
        normalized: n
      });
    }
  }
  return null;
}

/**
 * @param {string} input raw or normalized
 */
export function classifyMicroIntentFromTextV0(input) {
  const normalized = normalizeVoiceCommandTokenV0(input);
  const hit = classifyMicroIntentV0(normalized);
  if (!hit) return null;
  return Object.freeze({
    ...hit,
    raw: String(input || "").trim()
  });
}

/**
 * @param {string} intentId
 * @param {string} [locale] tr | en
 */
export function pickMicroIntentReplyV0(intentId, locale) {
  const loc = String(locale || resolveOutputLanguageCodeV0() || "tr").toLowerCase().slice(0, 2);
  const table = MICRO_REPLY_TEMPLATES_V0[intentId] || MICRO_REPLY_TEMPLATES_V0[MICRO_INTENT_V0.ACK];
  const list = table[loc] || table.en || table.tr;
  return pickMicroReplyWithMemoryV0(intentId, loc, list) || list[0] || "OK.";
}

/**
 * @param {string} intentId
 * @param {{ traceId?: string, locale?: string }} [opts]
 */
export function resolveMicroIntentReplyV0(intentId, opts = {}) {
  const loc = String(opts.locale || resolveOutputLanguageCodeV0() || "tr").toLowerCase().slice(0, 2);
  const raw = pickMicroIntentReplyV0(intentId, loc);
  const traceId = opts.traceId ? String(opts.traceId) : null;
  const committed = commitFinalUserVisibleLanguageV0(raw, {
    source: "micro_intent",
    traceId,
    idempotencyKey: traceId ? `micro:${traceId}:${intentId}` : `micro:${intentId}`,
    lockKey: "language_commit_lock"
  });
  recordMicroReplyPatternV0(intentId, loc, committed.text);
  return committed.text;
}

/**
 * Text / dock path — instant reply without LLM.
 * @param {string} message
 */
export function tryMicroIntentTextReplyV0(message, opts = {}) {
  const hit = classifyMicroIntentFromTextV0(message);
  if (!hit) return null;
  const reply = resolveMicroIntentReplyV0(hit.id, { traceId: opts.traceId, locale: opts.locale });
  return Object.freeze({
    reply,
    directive: "FOCUS_RHIZOH",
    source: "micro_intent",
    microIntent: hit.id,
    llmBypass: true
  });
}

/**
 * @param {{ microIntent?: string }} route
 * @param {{ traceId?: string }} [opts]
 */
export function executeMicroIntentVoiceV0(route, opts = {}) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const intentId = String(route?.microIntent || route?.intent?.microIntent || "");
  const reply = resolveMicroIntentReplyV0(intentId, { traceId: opts.traceId });
  return Object.freeze({
    ok: true,
    execution: "fast_local",
    kind: intentId,
    reply,
    latencyMs: (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0,
    llmBypass: true
  });
}
