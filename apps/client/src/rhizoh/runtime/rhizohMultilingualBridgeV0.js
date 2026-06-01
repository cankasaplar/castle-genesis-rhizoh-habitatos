/**
 * Rhizoh Multilingual Bridge v0 — detect · respond · cross-language curiosity (not curriculum).
 * @see docs/RHIZOH_MULTILINGUAL_BRIDGE_V0.md
 */

import { detectInputLanguageV0, MF0_DETECTED_LANGUAGE_V0 } from "./rhizohMeaningFrameV0.js";
import { detectLanguageContextV0 } from "../social/socialRuntime/languageContextDetectorV0.js";
import { pushT0ContinuityPulseV0 } from "./t0ContinuitySurfaceStreamV0.js";

export const RHIZOH_MULTILINGUAL_BRIDGE_CONTRACT_V0 = "rhizoh-multilingual-bridge-v0";
const SESSION_LANG_KEY_V0 = "rhizoh.user.language.v0";

/**
 * Supported locales — BCP-47 + bridge family (expand without breaking MF-0 core).
 * @type {readonly { code: string, bcp47: string, label: string, family: string }[]}
 */
export const RHIZOH_LANGUAGE_CATALOG_V0 = Object.freeze([
  { code: "tr", bcp47: "tr-TR", label: "Türkçe", family: "turkic" },
  { code: "en", bcp47: "en-US", label: "English", family: "germanic" },
  { code: "es", bcp47: "es-ES", label: "Español", family: "romance" },
  { code: "pt", bcp47: "pt-BR", label: "Português", family: "romance" },
  { code: "fr", bcp47: "fr-FR", label: "Français", family: "romance" },
  { code: "it", bcp47: "it-IT", label: "Italiano", family: "romance" },
  { code: "ca", bcp47: "ca-ES", label: "Català", family: "romance" },
  { code: "gl", bcp47: "gl-ES", label: "Galego", family: "romance" },
  { code: "ro", bcp47: "ro-RO", label: "Română", family: "romance" },
  { code: "de", bcp47: "de-DE", label: "Deutsch", family: "germanic" },
  { code: "nl", bcp47: "nl-NL", label: "Nederlands", family: "germanic" },
  { code: "sv", bcp47: "sv-SE", label: "Svenska", family: "germanic" },
  { code: "no", bcp47: "nb-NO", label: "Norsk", family: "germanic" },
  { code: "da", bcp47: "da-DK", label: "Dansk", family: "germanic" },
  { code: "pl", bcp47: "pl-PL", label: "Polski", family: "slavic" },
  { code: "cs", bcp47: "cs-CZ", label: "Čeština", family: "slavic" },
  { code: "sk", bcp47: "sk-SK", label: "Slovenčina", family: "slavic" },
  { code: "uk", bcp47: "uk-UA", label: "Українська", family: "slavic" },
  { code: "ru", bcp47: "ru-RU", label: "Русский", family: "slavic" },
  { code: "bg", bcp47: "bg-BG", label: "Български", family: "slavic" },
  { code: "hr", bcp47: "hr-HR", label: "Hrvatski", family: "slavic" },
  { code: "sr", bcp47: "sr-RS", label: "Српски", family: "slavic" },
  { code: "el", bcp47: "el-GR", label: "Ελληνικά", family: "hellenic" },
  { code: "hu", bcp47: "hu-HU", label: "Magyar", family: "uralic" },
  { code: "fi", bcp47: "fi-FI", label: "Suomi", family: "uralic" },
  { code: "et", bcp47: "et-EE", label: "Eesti", family: "uralic" },
  { code: "lv", bcp47: "lv-LV", label: "Latviešu", family: "baltic" },
  { code: "lt", bcp47: "lt-LT", label: "Lietuvių", family: "baltic" },
  { code: "ar", bcp47: "ar-SA", label: "العربية", family: "semitic" },
  { code: "he", bcp47: "he-IL", label: "עברית", family: "semitic" },
  { code: "fa", bcp47: "fa-IR", label: "فارسی", family: "iranian" },
  { code: "hi", bcp47: "hi-IN", label: "हिन्दी", family: "indo_aryan" },
  { code: "bn", bcp47: "bn-BD", label: "বাংলা", family: "indo_aryan" },
  { code: "ur", bcp47: "ur-PK", label: "اردو", family: "indo_aryan" },
  { code: "ja", bcp47: "ja-JP", label: "日本語", family: "japonic" },
  { code: "ko", bcp47: "ko-KR", label: "한국어", family: "koreanic" },
  { code: "zh", bcp47: "zh-CN", label: "中文", family: "sinitic" },
  { code: "vi", bcp47: "vi-VN", label: "Tiếng Việt", family: "austroasiatic" },
  { code: "th", bcp47: "th-TH", label: "ไทย", family: "tai" },
  { code: "id", bcp47: "id-ID", label: "Bahasa Indonesia", family: "malayo_polynesian" },
  { code: "ms", bcp47: "ms-MY", label: "Bahasa Melayu", family: "malayo_polynesian" },
  { code: "tl", bcp47: "fil-PH", label: "Filipino", family: "malayo_polynesian" },
  { code: "sw", bcp47: "sw-KE", label: "Kiswahili", family: "bantu" },
  { code: "am", bcp47: "am-ET", label: "አማርኛ", family: "semitic" },
  { code: "mixed", bcp47: "und", label: "Mixed", family: "mixed" },
  { code: "und", bcp47: "und", label: "Undetermined", family: "unknown" }
]);

/** Romance ↔ Germanic bridge hints for curiosity (not translation drills). */
export const RHIZOH_CROSS_LANGUAGE_BRIDGE_HINTS_V0 = Object.freeze({
  "en-es": Object.freeze([
    "continuity ↔ continuidad",
    "memory ↔ memoria",
    "seed ↔ semilla",
    "castle ↔ castillo (proper names stay as user wrote them)"
  ]),
  "es-en": Object.freeze([
    "continuidad ↔ continuity",
    "semilla ↔ seed",
    "use cognates only when they sharpen curiosity — never as a language lesson"
  ]),
  "en-tr": Object.freeze(["bridge via clear simple English; respect Turkish proper names when user switches"]),
  "tr-en": Object.freeze(["respond in Turkish unless user clearly writes in English; then match English"])
});

/** @type {readonly { code: string, re: RegExp }[]} */
const EXTENDED_LOCALE_PATTERNS_V0 = Object.freeze([
  { code: "de", re: /\b(hallo|danke|bitte|nicht|und|ich|wir|schön|guten)\b/ui },
  { code: "fr", re: /\b(bonjour|merci|je|vous|pas|une|être|c'est)\b/ui },
  { code: "it", re: /\b(ciao|grazie|perché|sono|non|buongiorno)\b/ui },
  { code: "pt", re: /\b(olá|obrigad|você|não|porque|bom dia)\b/ui },
  { code: "nl", re: /\b(hallo|dank|niet|een|van|goedemorgen)\b/ui },
  { code: "pl", re: /\b(cześć|dziękuj|proszę|nie|jest|dlaczego)\b/ui },
  { code: "ru", re: /\b(привет|спасибо|пожалуйста|нет|да|почему)\b/ui },
  { code: "uk", re: /\b(привіт|дякую|будь ласка|чому)\b/ui },
  { code: "ar", re: /[\u0600-\u06ff]/ },
  { code: "he", re: /[\u0590-\u05ff]/ },
  { code: "fa", re: /[\u0600-\u06ff]/ },
  { code: "hi", re: /[\u0900-\u097f]/ },
  { code: "bn", re: /[\u0980-\u09ff]/ },
  { code: "ko", re: /[\uac00-\ud7af]/ },
  { code: "vi", re: /\b(xin chào|cảm ơn|không|tại sao)\b/ui },
  { code: "th", re: /[\u0e00-\u0e7f]/ },
  { code: "id", re: /\b(halo|terima kasih|tidak|mengapa)\b/ui },
  { code: "sv", re: /\b(hej|tack|inte|varför|god morgon)\b/ui },
  { code: "ro", re: /\b(bună|mulțumesc|nu|de ce)\b/ui },
  { code: "el", re: /[\u0370-\u03ff]/ },
  { code: "hu", re: /\b(szia|köszönöm|nem|miért)\b/ui }
]);

/**
 * @param {string} code
 */
export function resolveRhizohLanguageCatalogRowV0(code) {
  const c = String(code || "und").toLowerCase().slice(0, 8);
  const row = RHIZOH_LANGUAGE_CATALOG_V0.find((r) => r.code === c);
  return row || RHIZOH_LANGUAGE_CATALOG_V0.find((r) => r.code === "und");
}

/**
 * @param {string} code
 */
export function resolveRhizohBcp47V0(code) {
  return resolveRhizohLanguageCatalogRowV0(code).bcp47;
}

function readNavigatorLocaleV0() {
  if (typeof navigator === "undefined") return "und";
  const lang = String(navigator.language || "und").toLowerCase();
  return lang.split("-")[0] || "und";
}

export function readRhizohSessionLanguagePreferenceV0() {
  try {
    return String(sessionStorage.getItem(SESSION_LANG_KEY_V0) || "").toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * @param {string} code
 */
export function writeRhizohSessionLanguagePreferenceV0(code) {
  const row = resolveRhizohLanguageCatalogRowV0(code);
  if (!row || row.code === "und") return;
  try {
    sessionStorage.setItem(SESSION_LANG_KEY_V0, row.code);
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} text
 * @param {string} [navLang]
 */
export function detectRhizohMultilingualLocaleV0(text, navLang = "") {
  let mf = detectInputLanguageV0(text);
  if (mf === MF0_DETECTED_LANGUAGE_V0.JP) mf = "ja";
  if (mf !== MF0_DETECTED_LANGUAGE_V0.UNKNOWN && mf !== MF0_DETECTED_LANGUAGE_V0.MIXED) {
    return Object.freeze({ code: mf, source: "mf0", confidence: 0.85 });
  }

  const social = detectLanguageContextV0(text, navLang || readNavigatorLocaleV0());
  if (social.detectedLocale !== "und" && social.confidence >= 0.55) {
    const code =
      social.detectedLocale === "ja"
        ? "ja"
        : social.detectedLocale === "zh"
          ? "zh"
          : social.detectedLocale;
    return Object.freeze({ code, source: "social", confidence: social.confidence });
  }

  const raw = String(text || "");
  for (const p of EXTENDED_LOCALE_PATTERNS_V0) {
    if (p.re.test(raw)) {
      return Object.freeze({ code: p.code, source: "pattern", confidence: 0.72 });
    }
  }

  const pref = readRhizohSessionLanguagePreferenceV0();
  if (pref) {
    return Object.freeze({ code: pref, source: "session", confidence: 0.5 });
  }

  const nav = String(navLang || readNavigatorLocaleV0()).split("-")[0];
  if (resolveRhizohLanguageCatalogRowV0(nav).code !== "und") {
    return Object.freeze({ code: nav, source: "navigator", confidence: 0.4 });
  }

  return Object.freeze({ code: "tr", source: "default_product", confidence: 0.35 });
}

/**
 * @param {string} primary
 * @param {string} [secondary]
 */
function bridgeHintsForPairV0(primary, secondary) {
  const key = `${primary}-${secondary}`;
  return RHIZOH_CROSS_LANGUAGE_BRIDGE_HINTS_V0[key] || null;
}

/**
 * @param {{ code: string, label: string }} row
 * @param {string} userCode
 */
function buildBridgeLinesForLocaleV0(row, userCode) {
  /** @type {string[]} */
  const lines = [];
  if (userCode === "en" || userCode === "es") {
    const hints = bridgeHintsForPairV0("en", "es") || bridgeHintsForPairV0("es", "en");
    if (hints) lines.push(...hints);
  }
  if (userCode === "en" && row.code === "tr") {
    const h = bridgeHintsForPairV0("en", "tr");
    if (h) lines.push(...h);
  }
  if (userCode === "tr" && row.code === "en") {
    const h = bridgeHintsForPairV0("tr", "en");
    if (h) lines.push(...h);
  }
  if (lines.length === 0 && row.family === "romance" && userCode === "en") {
    lines.push("optional romance cognates may sharpen a thought — never as homework");
  }
  return lines;
}

/**
 * @param {{
 *   message?: string,
 *   navLocale?: string,
 *   preferredCode?: string
 * }} [input]
 */
export function buildRhizohMultilingualPackV0(input = {}) {
  const message = String(input.message || "");
  const detected = detectRhizohMultilingualLocaleV0(message, input.navLocale);
  const code = String(input.preferredCode || detected.code);
  const row = resolveRhizohLanguageCatalogRowV0(code);
  writeRhizohSessionLanguagePreferenceV0(row.code);

  const bridgeLines = buildBridgeLinesForLocaleV0(row, detected.code);
  const respondLabel = row.label;

  const directive = [
    "[RHIZOH_MULTILINGUAL_BRIDGE_V0]",
    `Respond primarily in: ${respondLabel} (${row.bcp47}).`,
    `Detected user locale: ${detected.code} (source=${detected.source}, confidence=${detected.confidence}).`,
    "Match the user's language when clear; if mixed, follow the dominant language of the latest message.",
    "Keep proper names, castle labels, and thread IDs untranslated.",
    "Rhizoh grows through curiosity — use cross-language bridges only to sharpen meaning, never as a lesson plan.",
    "User may read continuity pulse logs in any language; your reply stays in the matched language.",
    bridgeLines.length ? `Bridge hints: ${bridgeLines.join(" · ")}` : "",
    `Catalog size: ${RHIZOH_LANGUAGE_CATALOG_V0.length} locales registered.`
  ]
    .filter(Boolean)
    .join("\n");

  const memoryContractAddon = [
    `Answer in ${respondLabel} when the user writes in that language.`,
    "Continuity state remains authoritative; do not invent facts beyond session memory.",
    "When companionship without speech is right, output only <SILENCE> with optional attributes."
  ].join(" ");

  return Object.freeze({
    contract_version: RHIZOH_MULTILINGUAL_BRIDGE_CONTRACT_V0,
    detected,
    respondCode: row.code,
    respondBcp47: row.bcp47,
    respondLabel: row.label,
    directive,
    memoryContractAddon,
    context: Object.freeze({
      schemaVersion: "0",
      detected_locale: detected.code,
      respond_locale: row.code,
      respond_bcp47: row.bcp47,
      confidence: detected.confidence,
      catalog_codes: RHIZOH_LANGUAGE_CATALOG_V0.map((r) => r.code)
    })
  });
}

/**
 * Turn + PAL continuity pulse for T0 stream.
 * @param {{
 *   message?: string,
 *   normalized?: Record<string, unknown> | null,
 *   palLabel?: string
 * }} [input]
 */
export function pushRhizohTurnContinuityPulseV0(input = {}) {
  const message = String(input.message || "").trim();
  const ml = buildRhizohMultilingualPackV0({ message });
  const normalized = input.normalized && typeof input.normalized === "object" ? input.normalized : {};
  const pal =
    String(input.palLabel || "").trim() ||
    (normalized.lifeEntityProjection
      ? extractPalLabelFromProjectionV0(normalized.lifeEntityProjection)
      : "");

  const seedBit = pal ? ` · PAL ${pal.slice(0, 48)}` : "";
  const replyBit =
    normalized.reply && String(normalized.reply).trim()
      ? ` · turn işlendi`
      : "";

  const templates = {
    tr: `Süreklilik · ${ml.respondLabel}${seedBit}${replyBit}`,
    en: `Continuity · ${ml.respondLabel}${seedBit}${replyBit}`,
    es: `Continuidad · ${ml.respondLabel}${seedBit}${replyBit}`,
    de: `Kontinuität · ${ml.respondLabel}${seedBit}${replyBit}`,
    fr: `Continuité · ${ml.respondLabel}${seedBit}${replyBit}`
  };

  const line = templates[ml.respondCode] || templates.en;
  pushT0ContinuityPulseV0(line, pal ? "pal_seed" : "turn");
}

/**
 * @param {unknown} projection
 */
function extractPalLabelFromProjectionV0(projection) {
  const bundle =
    projection && typeof projection === "object" ? /** @type {Record<string, unknown>} */ (projection) : {};
  const projections = Array.isArray(bundle.projections) ? bundle.projections : [];
  for (const item of projections) {
    if (!item || typeof item !== "object") continue;
    const row = /** @type {Record<string, unknown>} */ (item);
    if (String(row.projection_kind) === "map_pin") {
      return String(row.label || "");
    }
  }
  return "";
}

/**
 * Pulse when a new interpreted seed is available (aesthetic / semantic).
 * @param {{ label?: string, message?: string }} [input]
 */
export function pushRhizohSeedInterpretationPulseV0(input = {}) {
  const message = String(input.message || "");
  const ml = buildRhizohMultilingualPackV0({ message });
  const label = String(input.label || "").trim();
  const lines = {
    tr: label
      ? `Yeni bilgi tohumu yorumlandı: ${label.slice(0, 64)}`
      : "Yeni bilgi tohumu · Rhizoh yorumladı",
    en: label
      ? `New seed interpreted: ${label.slice(0, 64)}`
      : "New information seed · Rhizoh interpreted",
    es: label
      ? `Nueva semilla interpretada: ${label.slice(0, 64)}`
      : "Nueva semilla · Rhizoh interpretó"
  };
  const line = lines[ml.respondCode] || lines.en;
  pushT0ContinuityPulseV0(line, "seed");
}
