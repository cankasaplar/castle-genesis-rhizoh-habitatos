/**
 * Cross-Lingual Intent Canonicalizer (CLIC) — Phase 1–2
 * Order-invariant token-bag intent projection. Language is surface noise only.
 * RESEARCH-ONLY spec · CORE-ELIGIBLE runtime (rhizoh/runtime, not frozen phase*.js)
 */

import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { collapseEntityPhoneticTokenV1 } from "./rhizohCanonicalPhoneticClusterV1.js";
import {
  CANONICAL_WEATHER_MODE_V1,
  formatPresenceQueryReplyV1,
  formatSystemStatusReplyV1,
  formatWeatherReplyV1
} from "./rhizohCanonicalReflexSnapshotV1.js";
import { executeFastPrecheckReflexV0 } from "./rhizohFastPrecheckLiveReflexV1.js";
import { isEmptySportsReflexReplyV0 } from "./rhizohSportsLiveContextV0.js";
import { readCanonicalLiveSnapshotV1 } from "./rhizohCanonicalLiveSnapshotV1.js";
import {
  probeCanonicalClusterMemoryV1,
  recordCanonicalClusterHitV1
} from "./rhizohCanonicalClusterMemoryV1.js";

export const RHIZOH_CANONICAL_INTENT_SCHEMA_V1 = "castle.rhizoh.canonical_intent.v1";

/** Language-free canonical intent space */
export const CANONICAL_INTENT_V1 = Object.freeze({
  GREETING_WAKE: "GREETING_WAKE",
  GREETING: "GREETING",
  MORNING_GREETING: "MORNING_GREETING",
  HEARING_CHECK: "HEARING_CHECK",
  TIME_QUERY: "TIME_QUERY",
  DATE_QUERY: "DATE_QUERY",
  WEATHER_STUB: "WEATHER_STUB",
  WEATHER_LIVE: "WEATHER_LIVE",
  TRAFFIC_QUERY: "TRAFFIC_QUERY",
  SPORTS_LIVE: "SPORTS_LIVE",
  SPORTS_FIXTURE: "SPORTS_FIXTURE",
  NEWS_HEADLINES: "NEWS_HEADLINES",
  MAP_CONTEXT: "MAP_CONTEXT",
  BRIEFING_QUERY: "BRIEFING_QUERY",
  SYSTEM_STATUS: "SYSTEM_STATUS",
  PRESENCE_QUERY: "PRESENCE_QUERY",
  CHAT_INVITE: "CHAT_INVITE",
  WELLBEING: "WELLBEING",
  THANKS: "THANKS",
  ACK: "ACK",
  YES: "YES",
  NO: "NO",
  SOCIAL_ACK: "SOCIAL_ACK",
  COMMAND_LITE: "COMMAND_LITE"
});

/** Surface token → atomic feature (order-invariant bag) */
const TOKEN_FEATURE_MAP_V1 = Object.freeze({
  merhaba: "greeting",
  selam: "greeting",
  hello: "greeting",
  hi: "greeting",
  hey: "greeting",
  hola: "greeting",
  ola: "greeting",
  ciao: "greeting",
  salut: "greeting",
  bonjour: "greeting",
  konnichiwa: "greeting",
  annyeong: "greeting",
  gunaydin: "morning",
  gunaydın: "morning",
  saat: "time",
  time: "time",
  hora: "time",
  clock: "time",
  kac: "question",
  kaç: "question",
  what: "question",
  cuando: "question",
  que: "question",
  qué: "question",
  bugun: "today",
  bugün: "today",
  today: "today",
  tarih: "date",
  date: "date",
  duyabiliyor: "hearing",
  duyuyor: "hearing",
  hear: "hearing",
  hearing: "hearing",
  listening: "hearing",
  sohbet: "chat",
  edelim: "chat",
  chat: "chat",
  talk: "chat",
  konusalim: "chat",
  konusmak: "chat",
  neler: "chat",
  yap: "chat",
  yapabiliriz: "chat",
  yapalim: "chat",
  yapalım: "chat",
  nasilsin: "wellbeing",
  nasılsın: "wellbeing",
  haber: "wellbeing",
  misiniz: "wellbeing",
  tesekkur: "thanks",
  tesekkurler: "thanks",
  thanks: "thanks",
  thank: "thanks",
  guzel: "social",
  eyvallah: "social",
  tamam: "ack",
  okay: "ack",
  peki: "ack",
  evet: "yes",
  yes: "yes",
  hayir: "no",
  hayır: "no",
  no: "no",
  dur: "command",
  stop: "command",
  bekle: "command",
  wait: "command",
  devam: "command",
  start: "command",
  brifing: "briefing",
  briefing: "briefing",
  ozet: "briefing",
  summary: "briefing",
  kisa: "briefing",
  hava: "weather",
  weather: "weather",
  tiempo: "weather",
  sistem: "system",
  system: "system",
  durum: "system",
  status: "system",
  online: "online",
  bagli: "online",
  connected: "online",
  saglik: "system",
  health: "system",
  ne: "presence",
  doing: "presence",
  it: "filler",
  is: "filler",
  the: "filler",
  a: "filler",
  mi: "filler",
  misin: "filler",
  musun: "filler",
  musunuz: "filler",
  dostum: "filler",
  su: "filler",
  anda: "filler",
  beni: "filler",
  söyler: "filler",
  soyler: "filler",
  sorma: "filler",
  cok: "filler"
});

const EMOTIONAL_STATE_PREFIXES_V1 = Object.freeze([
  "yorgun",
  "bitkin",
  "uzgun",
  "mutsuz",
  "stres",
  "gergin",
  "bunalm",
  "yoruldum",
  "uykum",
  "hastayim",
  "hasta",
  "kotu",
  "kötü",
  "yalniz",
  "yalnız",
  "yalvar",
  "tired",
  "exhausted",
  "stressed",
  "sick"
]);

/**
 * Fatigue / emotional state — must reach LLM, not greeting wake reflex.
 * @param {string} raw
 */
export function probeEmotionalStateUtteranceV1(raw) {
  const n = foldCanonicalSurfaceV1(String(raw || "").trim());
  if (!n) return false;
  return EMOTIONAL_STATE_PREFIXES_V1.some((p) => {
    const folded = foldCanonicalSurfaceV1(p);
    return new RegExp(`\\b${folded}\\w*\\b`).test(n);
  });
}

/** Lexeme → surface language hint (output locale bias only, not routing) */
const LEXEME_SURFACE_LANG_V1 = Object.freeze({
  merhaba: "tr",
  selam: "tr",
  gunaydin: "tr",
  saat: "tr",
  kac: "tr",
  bugun: "tr",
  tarih: "tr",
  hola: "es",
  ola: "es",
  hora: "es",
  tiempo: "es",
  hello: "en",
  hi: "en",
  hey: "en",
  time: "en",
  today: "en",
  date: "en",
  thanks: "en",
  bonjour: "fr",
  salut: "fr",
  ciao: "it",
  konnichiwa: "ja"
});

const PLANNING_PLACE_SUBSTRINGS_V1 = Object.freeze([
  "istanbul",
  "ankara",
  "izmir",
  "antalya",
  "bursa",
  "bodrum",
  "izmit",
  "kadikoy",
  "besiktas",
  "uskudar",
  "turkiye",
  "turkey"
]);

const PLANNING_CONTEXT_TOKENS_V1 = Object.freeze(
  new Set(["havada", "guzel", "burada", "orada", "burayi", "aksam", "sabah", "hafta"])
);

/** SpiralLive octo_commands.json + intents_tr.json token port — substring + token bag */
export const CLIC_LIVE_TOKEN_BAGS_V1 = Object.freeze({
  [CANONICAL_INTENT_V1.TRAFFIC_QUERY]: Object.freeze([
    "trafik",
    "yogunluk",
    "kopru",
    "traffic",
    "jam",
    "yogun",
    "gecikme"
  ]),
  [CANONICAL_INTENT_V1.SPORTS_LIVE]: Object.freeze([
    "mac",
    "skor",
    "gol",
    "match",
    "sports",
    "spor",
    "canli",
    "kazandi",
    "sonuc",
    "karsilasma",
    "macsonuc"
  ]),
  [CANONICAL_INTENT_V1.SPORTS_FIXTURE]: Object.freeze(["fikstur", "fixture", "maclar", "macvar", "turkiye", "turkey"]),
  [CANONICAL_INTENT_V1.NEWS_HEADLINES]: Object.freeze([
    "haberler",
    "gundem",
    "manset",
    "news",
    "headlines",
    "haber",
    "dakika"
  ]),
  [CANONICAL_INTENT_V1.WEATHER_LIVE]: Object.freeze([
    "hava",
    "sicaklik",
    "yagmur",
    "gunes",
    "iklim",
    "weather",
    "temperature",
    "derece"
  ]),
  [CANONICAL_INTENT_V1.MAP_CONTEXT]: Object.freeze([
    "burada",
    "disari",
    "cevrede",
    "cikilir",
    "disarida"
  ])
});

/** Multi-word phrase boosts (normalized joined text) */
const CLIC_LIVE_PHRASE_BOOSTS_V1 = Object.freeze([
  { phrase: "yol yogun", intent: CANONICAL_INTENT_V1.TRAFFIC_QUERY, boost: 4 },
  { phrase: "trafik nasil", intent: CANONICAL_INTENT_V1.TRAFFIC_QUERY, boost: 4 },
  { phrase: "canli skor", intent: CANONICAL_INTENT_V1.SPORTS_LIVE, boost: 5 },
  { phrase: "spor karsilasma", intent: CANONICAL_INTENT_V1.SPORTS_LIVE, boost: 5 },
  { phrase: "mac sonuclari", intent: CANONICAL_INTENT_V1.SPORTS_LIVE, boost: 5 },
  { phrase: "kim kazandi", intent: CANONICAL_INTENT_V1.SPORTS_LIVE, boost: 4 },
  { phrase: "son dakika", intent: CANONICAL_INTENT_V1.NEWS_HEADLINES, boost: 4 },
  { phrase: "spor haber", intent: CANONICAL_INTENT_V1.SPORTS_LIVE, boost: 5 },
  { phrase: "kac derece", intent: CANONICAL_INTENT_V1.WEATHER_LIVE, boost: 4 },
  { phrase: "hava nasil", intent: CANONICAL_INTENT_V1.WEATHER_LIVE, boost: 4 },
  { phrase: "burada durum", intent: CANONICAL_INTENT_V1.MAP_CONTEXT, boost: 5 },
  { phrase: "disari cik", intent: CANONICAL_INTENT_V1.MAP_CONTEXT, boost: 5 },
  { phrase: "cevrede ne", intent: CANONICAL_INTENT_V1.MAP_CONTEXT, boost: 4 },
  { phrase: "turkiye mac", intent: CANONICAL_INTENT_V1.SPORTS_FIXTURE, boost: 6 },
  { phrase: "turkiye fikstur", intent: CANONICAL_INTENT_V1.SPORTS_FIXTURE, boost: 7 },
  { phrase: "a milli mac", intent: CANONICAL_INTENT_V1.SPORTS_FIXTURE, boost: 6 },
  { phrase: "mac fikstur", intent: CANONICAL_INTENT_V1.SPORTS_FIXTURE, boost: 5 },
  { phrase: "kısa brifing", intent: CANONICAL_INTENT_V1.BRIEFING_QUERY, boost: 6 },
  { phrase: "gunluk ozet", intent: CANONICAL_INTENT_V1.BRIEFING_QUERY, boost: 5 },
  { phrase: "günlük özet", intent: CANONICAL_INTENT_V1.BRIEFING_QUERY, boost: 5 }
]);

let sessionPresenceAckedV1 = false;
let sessionGreetingCountV1 = 0;

/**
 * Session-aware wake/greeting reply — first wake is short presence, later turns greet briefly.
 * @param {string} [locale]
 */
export function resolveGreetingWakeReplyV1(locale) {
  const tr = String(locale || resolveOutputLanguageCodeV0() || "tr")
    .toLowerCase()
    .startsWith("tr");
  if (!sessionPresenceAckedV1) {
    sessionPresenceAckedV1 = true;
    return tr ? "Buradayım." : "I'm here.";
  }
  sessionGreetingCountV1 += 1;
  if (sessionGreetingCountV1 <= 2) {
    return tr ? "Merhaba." : "Hello.";
  }
  return tr ? "Buradayım." : "I'm here.";
}

/** @param {string} [locale] */
export function resolveMorningGreetingReplyV1(locale) {
  const tr = String(locale || resolveOutputLanguageCodeV0() || "tr")
    .toLowerCase()
    .startsWith("tr");
  if (!sessionPresenceAckedV1) {
    sessionPresenceAckedV1 = true;
    return tr ? "Günaydın." : "Good morning.";
  }
  return tr ? "Günaydın." : "Good morning.";
}

export function __resetSessionGreetingStateForTestV1() {
  sessionPresenceAckedV1 = false;
  sessionGreetingCountV1 = 0;
}

const LIVE_INTENT_PRIORITY_V1 = Object.freeze([
  CANONICAL_INTENT_V1.BRIEFING_QUERY,
  CANONICAL_INTENT_V1.TRAFFIC_QUERY,
  CANONICAL_INTENT_V1.SPORTS_LIVE,
  CANONICAL_INTENT_V1.NEWS_HEADLINES,
  CANONICAL_INTENT_V1.WEATHER_LIVE,
  CANONICAL_INTENT_V1.MAP_CONTEXT,
  CANONICAL_INTENT_V1.SPORTS_FIXTURE
]);

const LIVE_INTENT_MIN_SCORE_V1 = 2;

/**
 * Fold Turkish surface text for substring token-bag matching (ı→i, ş→s, …).
 * @param {string} input
 */
export function foldCanonicalSurfaceV1(input) {
  return String(input || "")
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Substantive planning questions should reach LLM, not chat_invite reflex.
 * @param {string | string[]} input raw text or normalized token list
 */
export function isSubstantivePlanningUtteranceV1(input) {
  const tokens = Array.isArray(input)
    ? input
    : normalizeCanonicalTokensV1(String(input || "")).tokens;
  if (!tokens.length) return false;

  const joined = tokens.join(" ");
  if (PLANNING_PLACE_SUBSTRINGS_V1.some((place) => joined.includes(place))) return true;
  if (tokens.some((t) => t === "nerede" || t === "where")) return true;
  if (tokens.some((t) => t === "yapabilirim" || t.startsWith("yapabilirim"))) return true;

  const hasNelerYap =
    tokens.includes("neler") && tokens.some((t) => t.startsWith("yap"));
  if (!hasNelerYap) return false;
  if (tokens.some((t) => PLANNING_CONTEXT_TOKENS_V1.has(t))) return true;
  if (tokens.length >= 5) return true;

  return false;
}

/**
 * @param {string} input
 */
export function normalizeCanonicalTokensV1(input) {
  const raw = String(input || "")
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .replace(/[,;:!?.'"]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return Object.freeze({ raw: "", tokens: [], joined: "" });

  const tokens = raw
    .split(/\s+/)
    .map((w) =>
      w
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/[^a-z0-9]/gi, "")
        .trim()
    )
    .filter(Boolean);

  return Object.freeze({ raw, tokens, joined: tokens.join(" ") });
}

/**
 * @param {string[]} tokens
 */
export function buildCanonicalFeatureBagV1(tokens) {
  /** @type {Set<string>} */
  const features = new Set();
  let entity = null;
  /** @type {Record<string, number>} */
  const langVotes = Object.create(null);

  for (const token of tokens) {
    const collapsed = collapseEntityPhoneticTokenV1(token);
    if (collapsed) {
      entity = collapsed;
      features.add("entity_rhizoh");
      continue;
    }

    let feature = TOKEN_FEATURE_MAP_V1[token];
    if (!feature) {
      if (token.startsWith("tarih")) feature = "date";
      else if (token.startsWith("bugun")) feature = "today";
      else if (token.startsWith("duy")) feature = "hearing";
      else if (token.startsWith("tesekkur")) feature = "thanks";
      else if (token.startsWith("yapiyor") || token.startsWith("yapıyor")) feature = "presence";
      else if (token.startsWith("nasil") || token.startsWith("nasıl")) feature = "question";
    }
    if (feature && feature !== "filler") {
      features.add(feature);
    }

    const lang = LEXEME_SURFACE_LANG_V1[token];
    if (lang) langVotes[lang] = (langVotes[lang] || 0) + 1;

    if (EMOTIONAL_STATE_PREFIXES_V1.some((p) => token.startsWith(foldCanonicalSurfaceV1(p)))) {
      features.add("emotional_state");
    }
  }

  if (
    !isSubstantivePlanningUtteranceV1(tokens) &&
    ((tokens.includes("sohbet") && tokens.includes("edelim")) ||
      (tokens.includes("neler") && tokens.some((t) => t.startsWith("yap"))) ||
      tokens.includes("konusalim") ||
      tokens.includes("konusmak"))
  ) {
    features.add("chat_invite");
  }
  if (features.has("time") && (features.has("question") || features.has("saat"))) {
    features.add("time_query");
  }
  if (features.has("saat") && tokens.some((t) => t === "kac" || t === "kaç")) {
    features.add("time_query");
  }
  if (
    (features.has("today") && features.has("date")) ||
    (features.has("today") && tokens.some((t) => t === "tarih")) ||
    (tokens.some((t) => t === "bugun" || t === "bugün") && tokens.some((t) => t === "tarih"))
  ) {
    features.add("date_query");
  }
  const hasHearingFailure = tokens.some(
    (t) => t.startsWith("duyamad") || t.startsWith("duyulmad")
  );
  const hasHearingQuery =
    tokens.some((t) => /^duyabiliyor|^duyuyor/.test(t)) &&
    tokens.some((t) => /^(musun|musunuz|misin|misiniz)$/.test(t));
  const assertiveHearingStatement =
    tokens.some((t) =>
      /^(gerekiyor|lazim|lazım|olman|olmalı|olmalısın|sanırım|sanirim|gerek)$/.test(t)
    ) && !features.has("question");
  if (!hasHearingFailure && !assertiveHearingStatement && hasHearingQuery) {
    features.add("hearing_check");
  }
  if (
    features.has("weather") &&
    (features.has("question") ||
      tokens.some((t) => t.startsWith("nasil")) ||
      tokens.some((t) => t.startsWith("durum")) ||
      tokens.some((t) => t.startsWith("soyle") || t.startsWith("soyler")))
  ) {
    features.add("weather_stub");
  }
  if (
    (features.has("system") || features.has("online")) &&
    (features.has("question") || features.has("entity_rhizoh") || tokens.length <= 6)
  ) {
    features.add("system_status");
  }
  if (features.has("presence") && (features.has("question") || tokens.some((t) => t === "ne"))) {
    features.add("presence_query");
  }

  const surfaceLanguage =
    Object.entries(langVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

  return Object.freeze({
    features,
    entity,
    surfaceLanguage,
    tokenCount: tokens.length,
    substantivePlanning: isSubstantivePlanningUtteranceV1(tokens)
  });
}

/**
 * @param {ReturnType<typeof buildCanonicalFeatureBagV1>} bag
 */
export function projectCanonicalIntentV1(bag) {
  const f = bag.features;
  const n = bag.tokenCount;
  if (!n || n > 16) return null;
  if (bag.substantivePlanning) return null;
  if (f.has("emotional_state")) return null;

  const has = (key) => f.has(key);

  if (has("hearing_check")) {
    return { canonicalIntent: CANONICAL_INTENT_V1.HEARING_CHECK, confidence: 0.92 };
  }
  if (has("hearing") && has("entity_rhizoh") && has("question")) {
    return { canonicalIntent: CANONICAL_INTENT_V1.HEARING_CHECK, confidence: 0.88 };
  }
  if (has("time_query") || (has("time") && has("question"))) {
    return { canonicalIntent: CANONICAL_INTENT_V1.TIME_QUERY, confidence: 0.9 };
  }
  if (has("date_query")) {
    return { canonicalIntent: CANONICAL_INTENT_V1.DATE_QUERY, confidence: 0.9 };
  }
  if (has("briefing") && n <= 8) {
    return { canonicalIntent: CANONICAL_INTENT_V1.BRIEFING_QUERY, confidence: 0.91 };
  }
  if (has("system_status") && n <= 8) {
    return { canonicalIntent: CANONICAL_INTENT_V1.SYSTEM_STATUS, confidence: 0.9 };
  }
  if (has("weather_stub") || (has("weather") && n <= 6)) {
    return { canonicalIntent: CANONICAL_INTENT_V1.WEATHER_STUB, confidence: 0.85 };
  }
  if (has("presence_query") && n <= 6) {
    return { canonicalIntent: CANONICAL_INTENT_V1.PRESENCE_QUERY, confidence: 0.87 };
  }
  if (has("wellbeing") && n <= 4) {
    return { canonicalIntent: CANONICAL_INTENT_V1.WELLBEING, confidence: 0.86 };
  }
  if (has("thanks") && n <= 8) {
    return { canonicalIntent: CANONICAL_INTENT_V1.THANKS, confidence: 0.88 };
  }
  if (has("chat_invite") && n <= 5) {
    return { canonicalIntent: CANONICAL_INTENT_V1.CHAT_INVITE, confidence: 0.88 };
  }
  if (has("social") && n <= 5) {
    return { canonicalIntent: CANONICAL_INTENT_V1.SOCIAL_ACK, confidence: 0.84 };
  }
  if (has("yes") && n <= 3) {
    return { canonicalIntent: CANONICAL_INTENT_V1.YES, confidence: 0.9 };
  }
  if (has("no") && n <= 3) {
    return { canonicalIntent: CANONICAL_INTENT_V1.NO, confidence: 0.9 };
  }
  if (has("command") && n <= 4) {
    return { canonicalIntent: CANONICAL_INTENT_V1.COMMAND_LITE, confidence: 0.88 };
  }
  if (has("ack") && n <= 3) {
    return { canonicalIntent: CANONICAL_INTENT_V1.ACK, confidence: 0.88 };
  }
  if ((has("greeting") || has("morning")) && has("entity_rhizoh")) {
    return {
      canonicalIntent: has("morning")
        ? CANONICAL_INTENT_V1.MORNING_GREETING
        : CANONICAL_INTENT_V1.GREETING_WAKE,
      confidence: 0.94
    };
  }
  if (has("entity_rhizoh") && n <= 4 && !has("emotional_state")) {
    const wakeOnly =
      n <= 2 ||
      (n <= 4 &&
        !f.has("question") &&
        !f.has("chat") &&
        !f.has("command") &&
        (has("greeting") || has("morning") || has("ack") || has("presence")));
    if (wakeOnly) {
      return { canonicalIntent: CANONICAL_INTENT_V1.GREETING_WAKE, confidence: 0.9 };
    }
  }
  if (has("morning") && n <= 4) {
    return { canonicalIntent: CANONICAL_INTENT_V1.MORNING_GREETING, confidence: 0.88 };
  }
  if (has("greeting") && n <= 6) {
    return { canonicalIntent: CANONICAL_INTENT_V1.GREETING, confidence: 0.86 };
  }

  return null;
}

/**
 * Score live-world intents (traffic / sports / news / weather / map). TIME stays in feature bag.
 * @param {ReturnType<typeof normalizeCanonicalTokensV1>} norm
 * @param {ReturnType<typeof buildCanonicalFeatureBagV1>} [bag]
 */
export function scoreIntentV1(norm, bag) {
  const text = norm.joined;
  const folded = foldCanonicalSurfaceV1(norm.raw);
  const tokens = norm.tokens;
  if ((!text && !folded) || !tokens.length || tokens.length > 16) return Object.freeze({});

  /** @type {Record<string, number>} */
  const scores = Object.create(null);
  const add = (intent, n) => {
    if (n > 0) scores[intent] = (scores[intent] || 0) + n;
  };

  for (const [intent, tokenBag] of Object.entries(CLIC_LIVE_TOKEN_BAGS_V1)) {
    for (const token of tokenBag) {
      if (tokens.includes(token) || text.includes(token) || folded.includes(token)) add(intent, 2);
    }
  }

  for (const row of CLIC_LIVE_PHRASE_BOOSTS_V1) {
    if (text.includes(row.phrase) || folded.includes(row.phrase)) add(row.intent, row.boost);
  }

  if (bag?.features?.has("weather")) {
    add(CANONICAL_INTENT_V1.WEATHER_LIVE, 3);
    if (bag.features.has("question")) add(CANONICAL_INTENT_V1.WEATHER_LIVE, 2);
  }

  if (scores[CANONICAL_INTENT_V1.SPORTS_LIVE] && scores[CANONICAL_INTENT_V1.NEWS_HEADLINES]) {
    if (
      (text.includes("spor") || folded.includes("spor")) &&
      (text.includes("haber") || folded.includes("haber"))
    ) {
      add(CANONICAL_INTENT_V1.SPORTS_LIVE, 3);
      scores[CANONICAL_INTENT_V1.NEWS_HEADLINES] = Math.max(
        0,
        (scores[CANONICAL_INTENT_V1.NEWS_HEADLINES] || 0) - 2
      );
    }
  }

  if (
    (text.includes("burada") || folded.includes("burada")) &&
    (text.includes("durum") || text.includes("nasil") || folded.includes("nasil"))
  ) {
    add(CANONICAL_INTENT_V1.MAP_CONTEXT, 3);
  }

  if (
    text.includes("brifing") ||
    folded.includes("brifing") ||
    text.includes("briefing") ||
    folded.includes("briefing") ||
    (tokens.includes("ozet") && tokens.includes("kisa")) ||
    (tokens.includes("ozet") && tokens.includes("kisa"))
  ) {
    add(CANONICAL_INTENT_V1.BRIEFING_QUERY, 5);
  }

  if (
    (text.includes("trafik") || folded.includes("trafik")) &&
    (text.includes("durum") ||
      text.includes("nasil") ||
      folded.includes("durum") ||
      folded.includes("nasil") ||
      tokens.includes("ne"))
  ) {
    add(CANONICAL_INTENT_V1.TRAFFIC_QUERY, 4);
  }

  return Object.freeze({ ...scores });
}

/**
 * @param {ReturnType<typeof normalizeCanonicalTokensV1>} norm
 * @param {ReturnType<typeof buildCanonicalFeatureBagV1>} bag
 */
export function resolveCanonicalLiveIntentV1(norm, bag) {
  if (bag.substantivePlanning) return null;
  const scores = scoreIntentV1(norm, bag);
  const ranked = Object.entries(scores)
    .filter(([, score]) => score >= LIVE_INTENT_MIN_SCORE_V1)
    .sort((a, b) => b[1] - a[1]);

  if (!ranked.length) return null;

  let [topIntent, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] || 0;
  if (topScore - secondScore < 1 && secondScore >= LIVE_INTENT_MIN_SCORE_V1) {
    const secondIntent = ranked[1][0];
    const topIdx = LIVE_INTENT_PRIORITY_V1.indexOf(topIntent);
    const secondIdx = LIVE_INTENT_PRIORITY_V1.indexOf(secondIntent);
    if (secondIdx >= 0 && (topIdx < 0 || secondIdx < topIdx)) {
      topIntent = secondIntent;
      topScore = secondScore;
    }
  }

  const canonicalIntent =
    topIntent === CANONICAL_INTENT_V1.WEATHER_LIVE
      ? CANONICAL_INTENT_V1.WEATHER_STUB
      : topIntent;

  return Object.freeze({
    canonicalIntent,
    confidence: Math.min(0.95, 0.72 + topScore * 0.04),
    liveScores: scores
  });
}

/**
 * @param {string} [locale]
 */
export function formatTodayDateReplyV1(locale) {
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
 * @param {string} [locale]
 */
export function formatTimeReplyV1(locale) {
  const loc = String(locale || resolveOutputLanguageCodeV0() || "tr")
    .toLowerCase()
    .slice(0, 2);
  const now = new Date();
  if (loc === "tr") {
    const formatted = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    return `Saat ${formatted}.`;
  }
  const formatted = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `It's ${formatted}.`;
}

const CANONICAL_REPLY_V1 = Object.freeze({
  [CANONICAL_INTENT_V1.GREETING]: Object.freeze({
    tr: "Merhaba.",
    en: "Hello."
  }),
  [CANONICAL_INTENT_V1.HEARING_CHECK]: Object.freeze({
    tr: "Evet, duyuyorum — buradayım.",
    en: "Yes, I hear you — I'm here."
  }),
  [CANONICAL_INTENT_V1.CHAT_INVITE]: Object.freeze({
    tr: "Tabii — dinliyorum. Ne konuşmak istersin?",
    en: "Sure — I'm listening. What would you like to talk about?"
  }),
  [CANONICAL_INTENT_V1.WELLBEING]: Object.freeze({
    tr: "İyiyim, sen nasılsın?",
    en: "I'm well — how are you?"
  }),
  [CANONICAL_INTENT_V1.THANKS]: Object.freeze({
    tr: "Rica ederim.",
    en: "You're welcome."
  }),
  [CANONICAL_INTENT_V1.SOCIAL_ACK]: Object.freeze({
    tr: "Güzel — devam edelim.",
    en: "Nice — let's continue."
  }),
  [CANONICAL_INTENT_V1.ACK]: Object.freeze({ tr: "Tamam.", en: "Okay." }),
  [CANONICAL_INTENT_V1.YES]: Object.freeze({ tr: "Evet.", en: "Yes." }),
  [CANONICAL_INTENT_V1.NO]: Object.freeze({ tr: "Hayır.", en: "No." }),
  [CANONICAL_INTENT_V1.COMMAND_LITE]: Object.freeze({ tr: "Tamam.", en: "Okay." }),
  [CANONICAL_INTENT_V1.WEATHER_STUB]: Object.freeze({
    tr: "Canlı hava verisi henüz bağlı değil — yakında.",
    en: "Live weather isn't connected yet — soon."
  })
});

/** Maps canonical intent → fast_precheck intent id */
const CANONICAL_TO_PRECHECK_INTENT_V1 = Object.freeze({
  [CANONICAL_INTENT_V1.GREETING_WAKE]: "greeting",
  [CANONICAL_INTENT_V1.GREETING]: "greeting",
  [CANONICAL_INTENT_V1.MORNING_GREETING]: "greeting",
  [CANONICAL_INTENT_V1.HEARING_CHECK]: "hearing_check",
  [CANONICAL_INTENT_V1.TIME_QUERY]: "time_query",
  [CANONICAL_INTENT_V1.DATE_QUERY]: "date_today",
  [CANONICAL_INTENT_V1.WEATHER_STUB]: "weather_stub",
  [CANONICAL_INTENT_V1.WEATHER_LIVE]: "weather_live",
  [CANONICAL_INTENT_V1.TRAFFIC_QUERY]: "traffic_query",
  [CANONICAL_INTENT_V1.SPORTS_LIVE]: "sports_live",
  [CANONICAL_INTENT_V1.SPORTS_FIXTURE]: "sports_fixture",
  [CANONICAL_INTENT_V1.NEWS_HEADLINES]: "news_headlines",
  [CANONICAL_INTENT_V1.MAP_CONTEXT]: "map_context",
  [CANONICAL_INTENT_V1.SYSTEM_STATUS]: "system_status",
  [CANONICAL_INTENT_V1.PRESENCE_QUERY]: "presence_query",
  [CANONICAL_INTENT_V1.CHAT_INVITE]: "chat_invite",
  [CANONICAL_INTENT_V1.WELLBEING]: "wellbeing",
  [CANONICAL_INTENT_V1.THANKS]: "thanks",
  [CANONICAL_INTENT_V1.SOCIAL_ACK]: "social_ack",
  [CANONICAL_INTENT_V1.ACK]: "ack",
  [CANONICAL_INTENT_V1.YES]: "yes",
  [CANONICAL_INTENT_V1.NO]: "no",
  [CANONICAL_INTENT_V1.COMMAND_LITE]: "ack"
});

/**
 * @param {string} input raw transcript
 * @param {{ locale?: string }} [opts]
 */
export function probeCanonicalIntentV1(input, opts = {}) {
  const norm = normalizeCanonicalTokensV1(input);
  if (!norm.tokens.length) return null;

  const bag = buildCanonicalFeatureBagV1(norm.tokens);
  const liveProjected = resolveCanonicalLiveIntentV1(norm, bag);
  let projected = projectCanonicalIntentV1(bag);
  if (liveProjected && projected) {
    projected =
      liveProjected.confidence >= projected.confidence ? liveProjected : projected;
  } else if (liveProjected) {
    projected = liveProjected;
  }
  let fromClusterMemory = false;
  if (!projected && !bag.substantivePlanning) {
    const cluster = probeCanonicalClusterMemoryV1(bag);
    if (cluster) {
      projected = {
        canonicalIntent: cluster.canonicalIntent,
        confidence: cluster.confidence
      };
      fromClusterMemory = true;
    }
  }
  if (!projected) return null;

  if (!fromClusterMemory) {
    recordCanonicalClusterHitV1(bag, projected.canonicalIntent);
  }

  const locale =
    bag.surfaceLanguage !== "unknown"
      ? bag.surfaceLanguage
      : String(opts.locale || resolveOutputLanguageCodeV0() || "tr").slice(0, 2);

  return Object.freeze({
    schema: RHIZOH_CANONICAL_INTENT_SCHEMA_V1,
    canonicalIntent: projected.canonicalIntent,
    confidence: projected.confidence,
    entity: bag.entity,
    surfaceLanguage: bag.surfaceLanguage,
    features: Array.from(bag.features).sort(),
    normalized: norm.joined,
    localeHint: locale,
    fromClusterMemory
  });
}

/**
 * @param {ReturnType<typeof probeCanonicalIntentV1>} hit
 * @param {string} [locale]
 * @param {string} [queryNormalized]
 */
export function canonicalIntentToPrecheckV1(hit, locale, queryNormalized = "") {
  if (!hit?.canonicalIntent) return null;
  const loc = String(locale || hit.localeHint || resolveOutputLanguageCodeV0() || "tr")
    .toLowerCase()
    .slice(0, 2);
  const intent = CANONICAL_TO_PRECHECK_INTENT_V1[hit.canonicalIntent];
  if (!intent) return null;

  const LIVE_REFLEX_INTENTS_V1 = new Set([
    CANONICAL_INTENT_V1.WEATHER_STUB,
    CANONICAL_INTENT_V1.WEATHER_LIVE,
    CANONICAL_INTENT_V1.TRAFFIC_QUERY,
    CANONICAL_INTENT_V1.SPORTS_LIVE,
    CANONICAL_INTENT_V1.SPORTS_FIXTURE,
    CANONICAL_INTENT_V1.NEWS_HEADLINES,
    CANONICAL_INTENT_V1.MAP_CONTEXT,
    CANONICAL_INTENT_V1.BRIEFING_QUERY
  ]);

  if (LIVE_REFLEX_INTENTS_V1.has(hit.canonicalIntent)) {
    const snapshot = readCanonicalLiveSnapshotV1(Date.now(), loc);
    const reflexIntent =
      hit.canonicalIntent === CANONICAL_INTENT_V1.WEATHER_STUB
        ? CANONICAL_INTENT_V1.WEATHER_LIVE
        : hit.canonicalIntent;
    const liveReply = executeFastPrecheckReflexV0(reflexIntent, snapshot, loc, queryNormalized);
    if (liveReply) {
      if (
        (hit.canonicalIntent === CANONICAL_INTENT_V1.SPORTS_FIXTURE ||
          hit.canonicalIntent === CANONICAL_INTENT_V1.SPORTS_LIVE) &&
        isEmptySportsReflexReplyV0(liveReply)
      ) {
        return null;
      }
      const weather = formatWeatherReplyV1(loc);
      const isWeather = hit.canonicalIntent === CANONICAL_INTENT_V1.WEATHER_STUB ||
        hit.canonicalIntent === CANONICAL_INTENT_V1.WEATHER_LIVE;
      return Object.freeze({
        intent: isWeather
          ? weather.mode === CANONICAL_WEATHER_MODE_V1.LIVE
            ? "weather_live"
            : "weather_stub"
          : intent,
        reply: liveReply,
        canonicalIntent: isWeather && weather.mode === CANONICAL_WEATHER_MODE_V1.LIVE
          ? CANONICAL_INTENT_V1.WEATHER_LIVE
          : hit.canonicalIntent,
        canonicalConfidence: hit.confidence,
        entity: hit.entity,
        weatherMode: isWeather ? weather.mode : undefined,
        weatherSource: isWeather ? weather.source : undefined,
        snapshotVersion: snapshot.version,
        snapshotSource: snapshot.source
      });
    }
  }

  let reply = "";
  if (hit.canonicalIntent === CANONICAL_INTENT_V1.TIME_QUERY) {
    reply = formatTimeReplyV1(loc);
  } else if (hit.canonicalIntent === CANONICAL_INTENT_V1.DATE_QUERY) {
    reply = formatTodayDateReplyV1(loc);
  } else if (hit.canonicalIntent === CANONICAL_INTENT_V1.SYSTEM_STATUS) {
    reply = formatSystemStatusReplyV1(loc);
  } else if (hit.canonicalIntent === CANONICAL_INTENT_V1.PRESENCE_QUERY) {
    reply = formatPresenceQueryReplyV1(loc);
  } else if (hit.canonicalIntent === CANONICAL_INTENT_V1.GREETING_WAKE) {
    reply = resolveGreetingWakeReplyV1(loc);
  } else if (hit.canonicalIntent === CANONICAL_INTENT_V1.MORNING_GREETING) {
    reply = resolveMorningGreetingReplyV1(loc);
  } else {
    const table = CANONICAL_REPLY_V1[hit.canonicalIntent];
    reply = table ? (loc === "tr" ? table.tr : table.en) : "";
  }
  if (!reply) return null;

  return Object.freeze({
    intent,
    reply,
    canonicalIntent: hit.canonicalIntent,
    canonicalConfidence: hit.confidence,
    entity: hit.entity
  });
}
