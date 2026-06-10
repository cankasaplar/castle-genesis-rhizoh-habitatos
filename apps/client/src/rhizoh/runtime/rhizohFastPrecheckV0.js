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
import { isPhantomSystemPromptUtteranceV3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";
import {
  canonicalIntentToPrecheckV1,
  isSubstantivePlanningUtteranceV1,
  probeCanonicalIntentV1,
  probeEmotionalStateUtteranceV1
} from "./rhizohCanonicalIntentV1.js";
import { hasUserGeoForLocalFeedsV0 } from "./rhizohUserGeoConsentV0.js";
import { probeContinuityRecallIntentV0 } from "./rhizohContinuityRecallIntentV0.js";
import { probeSportsLiveQueryV0 } from "./rhizohSportsLiveContextV0.js";
import { resolveFoxIdentityPrecheckV0 } from "./rhizohFoxIdentityExplainV0.js";

export const RHIZOH_FAST_PRECHECK_SCHEMA_V0 = "castle.rhizoh.fast_precheck.v0";

export const PRECHECK_HIT_SOURCE_V0 = Object.freeze({
  CANONICAL: "canonical_intent_v1",
  EXACT: "exact_map",
  HOT: "hot_phrase_memory",
  REGEX: "regex_micro"
});

/** Wake / presence micro-intents — may bypass whisper_default_conf sanity in companion mode. */
export const FAST_PRECHECK_WAKE_INTENTS_V0 = Object.freeze(
  new Set([
    "greeting",
    "ack",
    "yes",
    "no",
    "wellbeing",
    "hearing_check",
    "date_today",
    "time_query",
    "system_status",
    "weather_stub",
    "weather_live",
    "traffic_query",
    "sports_live",
    "sports_fixture",
    "news_headlines",
    "map_context",
    "briefing_query",
    "presence_query",
    "social_ack",
    "chat_invite",
    "fox_identity_explain",
    "fox_naming_defer",
    "fox_naming_reserved"
  ])
);

/** Shallow intents — local TTS reflex; deep reasoning still uses LLM. */
/** Location-bound reflex intents — require user geo; otherwise defer to LLM. */
export const FAST_PRECHECK_LOCATION_BOUND_INTENTS_V0 = Object.freeze(
  new Set(["weather_live", "weather_stub", "traffic_query", "map_context"])
);

/** Shallow hits that must not swallow compound questions. */
const FAST_PRECHECK_SHALLOW_INTENTS_V0 = Object.freeze(
  new Set(["greeting", "ack", "yes", "no", "social_ack", "thanks"])
);

const GREETING_ONLY_DEFER_INTENTS_V0 = Object.freeze(
  new Set(["greeting", "ack", "yes", "no", "social_ack", "thanks"])
);

const SUBSTANTIVE_UTTERANCE_RE_V0 =
  /(?:kendini\s+tan[ıi]t|who\s+are\s+you|what\s+are\s+you|introduce\s+yourself|biliyor\s+musun|biliyor\s+mu|misin\b|m[ıi]s[ıi]n\b|nasıl\s+söyle|nasil\s+soyle|anlat[ıi]r\s+m[ıi]s[ıi]n|briefing|brifing|ingilizce|english|français|deutsch|español)/i;

/**
 * Compound or substantive utterance — do not answer with greeting/ack reflex alone.
 * @param {string} rawText
 * @param {string} [hitIntent]
 */
export function shouldDeferFastPrecheckToLlmV0(rawText, hitIntent) {
  const raw = String(rawText || "").trim();
  if (!raw) return false;
  if (probeContinuityRecallIntentV0(raw).active) return true;
  const intent = String(hitIntent || "");
  if (probeEmotionalStateUtteranceV1(raw) && FAST_PRECHECK_SHALLOW_INTENTS_V0.has(intent)) return true;
  if (probeSportsLiveQueryV0(raw).active && FAST_PRECHECK_SHALLOW_INTENTS_V0.has(intent)) return true;
  const words = raw.split(/\s+/).filter(Boolean);

  if (SUBSTANTIVE_UTTERANCE_RE_V0.test(raw)) {
    if (FAST_PRECHECK_SHALLOW_INTENTS_V0.has(intent)) return true;
    if (intent === "wellbeing" && /\b(kendini|tanıt|introduce|briefing|brifing)\b/i.test(raw)) {
      return true;
    }
  }
  if (raw.includes("?") && GREETING_ONLY_DEFER_INTENTS_V0.has(intent)) return true;
  if (words.length >= 5 && FAST_PRECHECK_SHALLOW_INTENTS_V0.has(intent)) return true;
  if (words.length >= 4 && intent === "greeting" && /\b(rhizoh|rizo|rezo)\b/i.test(raw)) {
    return true;
  }
  if (intent === "hearing_check") {
    if (/\b(gerekiyor|lazım|lazim|olman|olmalı|sanırım|sanirim)\b/i.test(raw)) return true;
    if (/\b(musun|musunuz|misin|misiniz)\b/i.test(raw) || raw.includes("?")) return false;
    if (words.length >= 6) return true;
  }
  return false;
}

export const RHIZOH_SMALL_TALK_PRECHECK_INTENTS_V0 = Object.freeze([
  "greeting",
  "ack",
  "wellbeing",
  "hearing_check",
  "thanks",
  "social_ack",
  "date_today",
  "time_query",
  "system_status",
  "weather_stub",
  "weather_live",
  "traffic_query",
  "sports_live",
  "sports_fixture",
  "news_headlines",
  "map_context",
  "briefing_query",
  "presence_query",
  "chat_invite"
]);

const FAST_REGEX_WORD_LIMIT_V0 = Object.freeze({
  chat_invite: 14,
  hearing_check: 12,
  default: 8
});

const DATE_TODAY_UTTERANCE_RE_V0 =
  /(?:bug[uü]n(?:[uü]n)?\s+tarih|bug[uü]n\s+ka[cç]|bug[uü]n\s+hangi\s+g[uü]n|bug[uü]n\s+ne\s+g[uü]n|tarih\s+ne|what\s+(?:is\s+)?(?:the\s+)?date|today'?s?\s+date)/i;

/**
 * @param {string} [locale]
 */
export function formatTodayDateReplyV0(locale) {
  const loc = String(locale || resolveOutputLanguageCodeV0() || "tr")
    .toLowerCase()
    .slice(0, 2);
  const now = new Date();
  if (loc === "tr") {
    const formatted = now.toLocaleDateString("tr-TR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    return `Bugün ${formatted}.`;
  }
  const formatted = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return `Today is ${formatted}.`;
}

/**
 * @param {string} normalized
 * @param {string} [locale]
 */
function probeDateTodayIntentV0(normalized, locale) {
  const n = String(normalized || "").trim();
  if (!n) return null;
  const words = n.split(/\s+/).filter(Boolean);
  if (words.length > 10) return null;
  const asksDate =
    DATE_TODAY_UTTERANCE_RE_V0.test(n) ||
    (/\bbug[uü]n\b/i.test(n) && /\btarih/i.test(n));
  if (!asksDate) return null;
  return Object.freeze({
    intent: "date_today",
    reply: formatTodayDateReplyV0(locale),
    normalized: n
  });
}

/** Normalized key → { intent, tr, en } */
const FAST_EXACT_MAP_V0 = Object.freeze({
  nasilsin: { intent: "wellbeing", tr: "İyiyim, sen nasılsın?", en: "I'm well — how are you?" },
  "nasılsın": { intent: "wellbeing", tr: "İyiyim, sen nasılsın?", en: "I'm well — how are you?" },
  merhaba: { intent: "greeting", tr: "Merhaba.", en: "Hello." },
  selam: { intent: "greeting", tr: "Selam — buradayım.", en: "Hi — I'm here." },
  gunaydin: { intent: "greeting", tr: "Günaydın — buradayım.", en: "Good morning — I'm here." },
  gunaydın: { intent: "greeting", tr: "Günaydın — buradayım.", en: "Good morning — I'm here." },
  "günaydın": { intent: "greeting", tr: "Günaydın — buradayım.", en: "Good morning — I'm here." },
  rhizoh: { intent: "greeting", tr: "Buradayım.", en: "I'm here." },
  rizo: { intent: "greeting", tr: "Buradayım.", en: "I'm here." },
  rezo: { intent: "greeting", tr: "Buradayım.", en: "I'm here." },
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
  stop: { intent: "ack", tr: "Duruyorum.", en: "Stopping." },
  guzel: { intent: "social_ack", tr: "Güzel — devam edelim.", en: "Nice — let's continue." },
  "sag ol": { intent: "social_ack", tr: "Rica ederim.", en: "You're welcome." },
  "sag olun": { intent: "social_ack", tr: "Rica ederim.", en: "You're welcome." },
  eyvallah: { intent: "social_ack", tr: "Eyvallah — buradayım.", en: "Likewise — I'm here." }
});

/** @type {ReadonlyArray<{ intent: string, re: RegExp, tr: string, en: string }>} */
const FAST_REGEX_MICRO_V0 = Object.freeze([
  {
    intent: "hearing_check",
    re: /(?:merhaba|selam|günaydın|gunaydin).{0,32}\b(rhizoh|rizo|rezo)\b.{0,40}\b(duyabiliyor|duyuyor)\s*musun/i,
    tr: "Merhaba — evet, duyuyorum. Ne konuşmak istersin?",
    en: "Hello — yes, I hear you. What would you like to talk about?"
  },
  {
    intent: "hearing_check",
    re: /\b(rhizoh|rizo|rezo)\b.{0,40}\b(duyabiliyor|duyuyor)\s*musun/i,
    tr: "Evet, duyuyorum — buradayım.",
    en: "Yes, I hear you — I'm here."
  },
  {
    intent: "greeting",
    re: /^(selam|merhaba|hey|hi|hello|günaydın|gunaydin|gunaydın)\b/i,
    tr: "Merhaba.",
    en: "Hello."
  },
  {
    intent: "greeting",
    re: /^merhaba\s+(günaydın|gunaydin|gunaydın)\b/i,
    tr: "Günaydın — buradayım.",
    en: "Good morning — I'm here."
  },
  {
    intent: "greeting",
    re: /^(günaydın|gunaydin|gunaydın)\s+(rhizoh|rizo|rezo)\b/i,
    tr: "Günaydın — buradayım.",
    en: "Good morning — I'm here."
  },
  {
    intent: "greeting",
    re: /^(rhizoh|rizo|rezo)\s+(günaydın|gunaydin|merhaba|selam)\b/i,
    tr: "Merhaba — buradayım.",
    en: "Hello — I'm here."
  },
  {
    intent: "greeting",
    re: /^(rhizoh|rizo|rezo)(\s|!|\?|$)/i,
    tr: "Buradayım.",
    en: "I'm here."
  },
  {
    intent: "briefing_query",
    re: /^(kısa\s+brifing|kisa\s+brifing|brifing|briefing|günlük\s+özet|gunluk\s+ozet)\b/i,
    tr: "Kısa brifing hazırlıyorum.",
    en: "Preparing a quick briefing."
  },
  { intent: "wellbeing", re: /^(nasılsın|nasilsin|how are you)(\s+dostum)?\b/i, tr: "İyiyim, sen nasılsın?", en: "I'm well — and you?" },
  {
    intent: "thanks",
    re: /(?:^|\b)(teşekkür\s+ederim|tesekkur\s+ederim|teşekkürler|tesekkurler|teşekkür|tesekkur|thanks)(\s+rhizoh)?\b/i,
    tr: "Rica ederim.",
    en: "You're welcome."
  },
  {
    intent: "social_ack",
    re: /^eyvallah(\s+dostum)?\b/i,
    tr: "Eyvallah — buradayım.",
    en: "Likewise — I'm here."
  },
  {
    intent: "chat_invite",
    re: /^sohbet\s+edelim\b/i,
    tr: "Tabii — dinliyorum. Ne konuşmak istersin?",
    en: "Sure — I'm listening. What would you like to talk about?"
  },
  {
    intent: "chat_invite",
    re: /^(neler|ne)\s+yap\w+\b/i,
    tr: "Buradayım — sen ne istersin?",
    en: "I'm here — what would you like to do?"
  },
  {
    intent: "chat_invite",
    re: /^konusalim\b|^konusmak\s+isterim\b/i,
    tr: "Olur — dinliyorum.",
    en: "Sure — I'm listening."
  },
  {
    intent: "hearing_check",
    re: /\b(su\s+anda\s+)?(beni\s+)?(duyabiliyor|duyuyor)\s*musunuz?\b/i,
    tr: "Evet, duyuyorum — buradayım.",
    en: "Yes, I hear you — I'm here."
  },
  {
    intent: "wellbeing",
    re: /^(iyi\s+misin|iyi\s+misiniz|ne\s+haber)(\s+dostum)?\b/i,
    tr: "İyiyim, sen nasılsın?",
    en: "I'm well — how are you?"
  },
  {
    intent: "greeting",
    re: /^merhaba\s+[a-z]{2,16}\b/i,
    tr: "Merhaba — buradayım.",
    en: "Hello — I'm here."
  },
  {
    intent: "greeting",
    re: /^(rhizoh|rizo|rezo|resol|erizo),?\s*(merhaba|selam|hey)\b/i,
    tr: "Merhaba — buradayım.",
    en: "Hello — I'm here."
  }
]);

/**
 * @param {string} input
 */
export function normalizeForFastPrecheckV0(input) {
  return normalizeVoiceCommandTokenV0(input)
    .replace(/[,;:!?]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[!?.,;:]+$/g, "")
    .trim();
}

/**
 * @param {string} normalized
 * @param {string} [locale]
 * @param {string} [rawText]
 */
export function runFastPrecheckV0(normalized, locale, rawText) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const n = String(normalized || "").trim();
  const raw = String(rawText || normalized || "").trim();
  const loc = String(locale || resolveOutputLanguageCodeV0() || "tr").toLowerCase().slice(0, 2);
  if (!n) return null;

  const foxHit = resolveFoxIdentityPrecheckV0(n, raw, loc);
  if (foxHit) {
    return finishPrecheckHitV0({
      intent: foxHit.intent,
      reply: foxHit.reply,
      source: PRECHECK_HIT_SOURCE_V0.REGEX,
      normalized: n,
      t0
    });
  }

  const canonicalHit = probeCanonicalIntentV1(n, { locale: loc });
  if (canonicalHit) {
    const mapped = canonicalIntentToPrecheckV1(canonicalHit, loc, n);
    if (mapped) {
      return finishPrecheckHitV0({
        intent: mapped.intent,
        reply: mapped.reply,
        source: PRECHECK_HIT_SOURCE_V0.CANONICAL,
        normalized: n,
        t0,
        canonicalIntent: mapped.canonicalIntent,
        canonicalConfidence: mapped.canonicalConfidence,
        entity: mapped.entity
      });
    }
  }

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

  const dateHit = probeDateTodayIntentV0(n, loc);
  if (dateHit) {
    return finishPrecheckHitV0({
      intent: dateHit.intent,
      reply: dateHit.reply,
      source: PRECHECK_HIT_SOURCE_V0.REGEX,
      normalized: dateHit.normalized,
      t0
    });
  }

  for (const row of FAST_REGEX_MICRO_V0) {
    const wordLimit = FAST_REGEX_WORD_LIMIT_V0[row.intent] || FAST_REGEX_WORD_LIMIT_V0.default;
    if (row.intent === "chat_invite" && isSubstantivePlanningUtteranceV1(n)) continue;
    if (row.re.test(n) && n.split(/\s+/).length <= wordLimit) {
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
  if (isPhantomSystemPromptUtteranceV3(input)) return null;
  const raw = String(input || "").trim();
  const normalized = normalizeForFastPrecheckV0(input);
  const hit = runFastPrecheckV0(normalized, opts.locale, raw);
  if (!hit) return null;
  if (shouldDeferFastPrecheckToLlmV0(raw, hit.intent)) return null;
  if (
    FAST_PRECHECK_LOCATION_BOUND_INTENTS_V0.has(String(hit.intent || "")) &&
    !hasUserGeoForLocalFeedsV0()
  ) {
    return null;
  }
  return Object.freeze({ ...hit, traceId: opts.traceId || null, raw });
}

function finishPrecheckHitV0({
  intent,
  reply,
  source,
  normalized,
  t0,
  canonicalIntent,
  canonicalConfidence,
  entity
}) {
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
    layer: "fast_precheck",
    canonicalIntent: canonicalIntent || undefined,
    canonicalConfidence: canonicalConfidence ?? undefined,
    entity: entity || undefined
  });
}

/**
 * @param {ReturnType<typeof runFastPrecheckFromTextV0>} hit
 * @param {{ traceId?: string, channel?: string }} [opts]
 */
/** Read-only probe for voice gate — no logging or hot-phrase writes. */
export function probeFastPrecheckMatchV0(input) {
  return runFastPrecheckFromTextV0(input);
}

/**
 * @param {string} input
 */
export function isFastPrecheckWakeIntentV0(input) {
  const hit = probeFastPrecheckMatchV0(input);
  return hit != null && FAST_PRECHECK_WAKE_INTENTS_V0.has(String(hit.intent || ""));
}

/**
 * Prod-safe idle globals until first reflex turn (avoids `undefined` in DevTools).
 */
export function installRhizohReflexDebugGlobalsV0() {
  if (typeof window === "undefined") return;
  try {
    if (!window.__CASTLE_RHIZOH_FAST_PRECHECK__) {
      window.__CASTLE_RHIZOH_FAST_PRECHECK__ = Object.freeze({
        status: "awaiting_first_turn",
        schema: RHIZOH_FAST_PRECHECK_SCHEMA_V0
      });
    }
    if (!window.__CASTLE_RHIZOH_REFLEX_STABILITY__) {
      window.__CASTLE_RHIZOH_REFLEX_STABILITY__ = Object.freeze({
        status: "awaiting_first_turn",
        heatmap: Object.freeze({ local_fast: 0, local: 0, llm: 0, total: 0, suppressionRate01: 0 })
      });
    }
  } catch {
    /* noop */
  }
}

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
