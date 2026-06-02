/**
 * FAST PRECHECK — O(1) exact + hot phrase + regex micro (before intent router).
 * Target: 0–2ms CPU; bypasses LLM and full classifier on hot paths.
 */

import { normalizeVoiceCommandTokenV0 } from "./rhizohVoiceCommandRouterV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { readHotPhraseV0, recordHotPhraseV0 } from "./rhizohMicroPatternMemoryV0.js";
import {
  hotPhraseContextMatchesV0,
  publishHotPhraseContextWindowV0,
  readHotPhraseContextWindowV0,
  resolveHotPhraseContextTagV0
} from "./rhizohHotPhraseContextV0.js";
import { applyMicroPersonalityToReplyV0 } from "./rhizohMicroPersonalityV0.js";
import { logRhizohReflexTurnV0 } from "./rhizohReflexTurnLogV0.js";

export const RHIZOH_FAST_PRECHECK_SCHEMA_V0 = "castle.rhizoh.fast_precheck.v0";

export const PRECHECK_HIT_SOURCE_V0 = Object.freeze({
  EXACT: "exact_map",
  HOT: "hot_phrase_memory",
  REGEX: "regex_micro"
});

/** Normalized key → { intent, tr, en } */
const FAST_EXACT_MAP_V0 = Object.freeze({
  nasilsin: { intent: "wellbeing", tr: "İyiyim, sen nasılsın?", en: "I'm well — how are you?" },
  "nasılsın": { intent: "wellbeing", tr: "İyiyim, sen nasılsın?", en: "I'm well — how are you?" },
  merhaba: { intent: "greeting", tr: "Merhaba.", en: "Hello." },
  selam: { intent: "greeting", tr: "Selam — buradayım.", en: "Hi — I'm here." },
  hello: { intent: "greeting", tr: "Hello.", en: "Hello." },
  hi: { intent: "greeting", tr: "Hi.", en: "Hi." },
  hey: { intent: "greeting", tr: "Hey.", en: "Hey." },
  tamam: { intent: "ack", tr: "Tamam.", en: "Okay." },
  ok: { intent: "ack", tr: "Tamam.", en: "Okay." },
  okay: { intent: "ack", tr: "Tamam.", en: "Okay." },
  peki: { intent: "ack", tr: "Peki.", en: "Sure." },
  evet: { intent: "yes", tr: "Evet.", en: "Yes." },
  yes: { intent: "yes", tr: "Evet.", en: "Yes." },
  hayir: { intent: "no", tr: "Hayır.", en: "No." },
  hayır: { intent: "no", tr: "Hayır.", en: "No." },
  no: { intent: "no", tr: "Hayır.", en: "No." },
  tesekkur: { intent: "thanks", tr: "Rica ederim.", en: "You're welcome." },
  tesekkurler: { intent: "thanks", tr: "Rica ederim.", en: "You're welcome." },
  "teşekkür": { intent: "thanks", tr: "Rica ederim.", en: "You're welcome." },
  "teşekkürler": { intent: "thanks", tr: "Rica ederim.", en: "You're welcome." },
  thanks: { intent: "thanks", tr: "Rica ederim.", en: "You're welcome." },
  "thank you": { intent: "thanks", tr: "Rica ederim.", en: "You're welcome." },
  yardim: { intent: "help", tr: "Kısa komutlar anında çalışır — örn. haritayı aç.", en: "Short commands run instantly — e.g. open map." },
  yardım: { intent: "help", tr: "Kısa komutlar anında çalışır — örn. haritayı aç.", en: "Short commands run instantly — e.g. open map." },
  help: { intent: "help", tr: "Short commands run instantly.", en: "Short commands run instantly." },
  start: { intent: "ack", tr: "Başlıyorum.", en: "Starting." },
  stop: { intent: "ack", tr: "Duruyorum.", en: "Stopping." }
});

/** @type {ReadonlyArray<{ intent: string, re: RegExp, tr: string, en: string }>} */
const FAST_REGEX_MICRO_V0 = Object.freeze([
  { intent: "greeting", re: /^(selam|merhaba|hey|hi|hello)\b/i, tr: "Merhaba.", en: "Hello." },
  { intent: "wellbeing", re: /^(nasılsın|nasilsin|how are you)\b/i, tr: "İyiyim, sen nasılsın?", en: "I'm well — and you?" },
  { intent: "thanks", re: /^(teşekkür|tesekkur|thanks)\b/i, tr: "Rica ederim.", en: "You're welcome." }
]);

/**
 * @param {string} input
 */
export function normalizeForFastPrecheckV0(input) {
  return normalizeVoiceCommandTokenV0(input)
    .replace(/[!?.,;:]+$/g, "")
    .trim();
}

/**
 * @param {string} normalized
 * @param {string} [locale]
 */
export function runFastPrecheckV0(normalized, locale) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const n = String(normalized || "").trim();
  const loc = String(locale || resolveOutputLanguageCodeV0() || "tr").toLowerCase().slice(0, 2);
  if (!n) return null;

  const exact = FAST_EXACT_MAP_V0[n];
  if (exact) {
    return finishPrecheckHitV0({
      intent: exact.intent,
      reply: loc === "tr" ? exact.tr : exact.en,
      source: PRECHECK_HIT_SOURCE_V0.EXACT,
      normalized: n,
      t0
    });
  }

  const ctxWin = readHotPhraseContextWindowV0();
  const hot = readHotPhraseV0(n, loc, { requiredTag: ctxWin?.tag });
  if (hot && hotPhraseContextMatchesV0(hot.intent, { tag: hot.contextTag || ctxWin?.tag })) {
    const reply = applyMicroPersonalityToReplyV0(hot.reply);
    return finishPrecheckHitV0({
      intent: hot.intent,
      reply,
      source: PRECHECK_HIT_SOURCE_V0.HOT,
      normalized: n,
      t0
    });
  }

  for (const row of FAST_REGEX_MICRO_V0) {
    if (row.re.test(n) && n.split(/\s+/).length <= 6) {
      return finishPrecheckHitV0({
        intent: row.intent,
        reply: loc === "tr" ? row.tr : row.en,
        source: PRECHECK_HIT_SOURCE_V0.REGEX,
        normalized: n,
        t0
      });
    }
  }

  return null;
}

/**
 * @param {string} input raw transcript
 * @param {{ locale?: string, traceId?: string }} [opts]
 */
export function runFastPrecheckFromTextV0(input, opts = {}) {
  const normalized = normalizeForFastPrecheckV0(input);
  const hit = runFastPrecheckV0(normalized, opts.locale);
  if (!hit) return null;
  return Object.freeze({ ...hit, traceId: opts.traceId || null, raw: String(input || "").trim() });
}

function finishPrecheckHitV0({ intent, reply, source, normalized, t0 }) {
  const styled = applyMicroPersonalityToReplyV0(reply);
  const latencyMs = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0
  );
  return Object.freeze({
    schema: RHIZOH_FAST_PRECHECK_SCHEMA_V0,
    intent,
    reply: styled,
    source,
    normalized,
    latencyMs,
    llmBypass: true,
    layer: "fast_precheck"
  });
}

/**
 * @param {ReturnType<typeof runFastPrecheckFromTextV0>} hit
 * @param {{ traceId?: string, channel?: string }} [opts]
 */
export function publishFastPrecheckHitV0(hit, opts = {}) {
  if (!hit) return;
  const loc = resolveOutputLanguageCodeV0();
  const ctxTag = resolveHotPhraseContextTagV0(hit.intent, opts.routeClass || "");
  publishHotPhraseContextWindowV0({ tag: ctxTag, intent: hit.intent, routeClass: opts.routeClass || "" });
  recordHotPhraseV0(hit.normalized, loc, hit.intent, hit.reply, ctxTag);
  logRhizohReflexTurnV0({
    intent: hit.intent,
    response: hit.reply,
    latencyMs: hit.latencyMs,
    source: hit.source,
    layer: "fast_precheck",
    traceId: opts.traceId,
    channel: opts.channel || "voice",
    successScore: 0.82,
    userReaction: "none",
    responseEffectiveness: Object.freeze({
      pending: true,
      contextTag: ctxTag
    })
  });
  if (typeof window !== "undefined") {
    try {
      window.__CASTLE_RHIZOH_FAST_PRECHECK__ = Object.freeze({
        ...hit,
        atMs: Date.now()
      });
    } catch {
      /* noop */
    }
  }
}
