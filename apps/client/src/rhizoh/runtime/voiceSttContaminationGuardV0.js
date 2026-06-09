/**
 * STT contamination guard — platform outro / UI chrome / loop artifacts.
 * internal_repetition alone is NOT sufficient to drop (stutter-safe).
 */

import { hasInternalTranscriptRepetitionV3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";
import {
  measureArabicScriptRatioV0,
  measureLatinScriptRatioV0
} from "./sttScriptLocaleGuardV0.js";
import { isConversationalTurkishUtteranceV3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";

export const VOICE_STT_CONTAMINATION_GUARD_SCHEMA_V0 =
  "castle.rhizoh.voice_stt_contamination_guard.v0";

/** YouTube / podcast / stream outro leaks (mic picks tab audio). */
const PLATFORM_OUTRO_PATTERNS_V0 = [
  /don['']?t\s+forget\s+to\s+like/i,
  /like\s*,?\s*comment/i,
  /comment\s*,?\s*share/i,
  /share\s+and\s+subscribe/i,
  /subscribe\s+to\s+(my\s+)?(channel|kanal)/i,
  /hit\s+the\s+(like|subscribe)\s+button/i,
  /smash\s+that\s+like/i,
  /thanks?\s+for\s+watching/i,
  /thank\s+you\s+for\s+watching/i,
  /see\s+you\s+in\s+the\s+next/i,
  /\bamen\.?\s*(amen\.?\s*){1,4}$/i,
  /in the name of the father/i,
  /father,\s*and of the son/i,
  /holy spirit\.?\s*amen/i
];

/** Arabic / multilingual tab-audio spam (not user speech). */
const STT_TAB_AUDIO_PATTERNS_V0 = [
  /المترجم/i,
  /للإعجاب بالفيديو/i,
  /سبحانك اللهم/i,
  /استغفرك واتوب اليك/i
];

/** Phantom polite closure — STT echo of assistant lines, not user intent. */
const STT_PHANTOM_POLITE_ONLY_RE_V0 =
  /^(rica ederim|teşekkür ederim|tesekkur ederim|you'?re welcome|thank you)\.?\s*$/i;

/** TR UI footer / creator chrome — not conversational user input. */
const UI_CHROME_ECHO_PATTERNS_V0 = [
  /kanal(a|ıma|ima)\s+(abone|subscribe)/i,
  /abone\s+ol(duğunuz|dugunuz|un)/i,
  /abone\s+olmay[iı]\b/i,
  /abone\s+olmay[iı].*be[gğ]enmey[iı]/i,
  /be[gğ]enmey[iı]\s+unutmay/i,
  /videoyu\s+be[gğ]enmey[iı]/i,
  /izledi[ğg]iniz\s+i[çc]in\s+te[sş]ekk/i,
  /be[gğ]en(me|ip)\s+ve\s+payla[sş]/i,
  /payla[sş]may[iı]\s+unut/i,
  /bu\s+videoyu\s+be[gğ]en/i,
  /mikrofon\s+ses\s+alm/i,
  /en\s+az\s+bir\s+saniye\s+konuş/i,
  /altyaz[ıi]\s+m\.?\s*k\.?/i,
  /^altyaz[ıi](\s+m\.?\s*k\.?)?\s*$/i
];

/** Strong leak signatures — high weight in fuzzy scorer. */
const STRONG_PLATFORM_SCORE_PATTERNS_V0 = [
  { re: /don['']?t\s+forget\s+to\s+like/i, weight: 0.38 },
  { re: /thank\s+you\s+for\s+watching/i, weight: 0.4 },
  { re: /thanks?\s+for\s+watching/i, weight: 0.38 },
  { re: /share\s+and\s+subscribe/i, weight: 0.36 },
  { re: /subscribe\s+to\s+(my\s+)?(channel|kanal)/i, weight: 0.34 },
  { re: /kanal(a|ıma|ima)\s+(abone|subscribe)/i, weight: 0.34 },
  { re: /abone\s+olmay[iı].*be[gğ]enmey[iı].*unutmay/i, weight: 0.4 },
  { re: /be[gğ]enmey[iı]\s+unutmay/i, weight: 0.34 },
  { re: /altyaz[ıi]\s+m\.?\s*k\.?/i, weight: 0.38 },
  { re: /^altyaz[ıi]\s*$/i, weight: 0.32 },
  { re: /المترجم/i, weight: 0.42 },
  { re: /للإعجاب بالفيديو/i, weight: 0.4 },
  { re: /سبحانك اللهم/i, weight: 0.42 }
];

/** Weak cues — conversational mention should not hard-drop alone. */
const WEAK_TEMPLATE_SCORE_PATTERNS_V0 = [
  { re: /\bsubscribe\b/i, weight: 0.12 },
  { re: /\bthank you\b/i, weight: 0.1 },
  { re: /\bte[sş]ekk[üu]r/i, weight: 0.08 },
  { re: /\babone\b/i, weight: 0.11 }
];

const CAPTION_SUBTITLE_SCORE_PATTERNS_V0 = [
  { re: /(?:^|\s)(?:\[?\s*(?:caption|subtitle|altyaz[ıi]|cc)\s*\]?)/iu, weight: 0.45 },
  { re: />>|<<|\(\s*music\s*\)/iu, weight: 0.28 }
];

export const TEMPLATE_SCORE_HARD_DROP_V0 = 0.92;
export const TEMPLATE_SCORE_QUARANTINE_MIN_V0 = 0.75;

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function maxPatternScoreV0(text, patterns) {
  const norm = normalizeContaminationTextV0(text);
  if (!norm) return 0;
  let max = 0;
  for (const { re, weight } of patterns) {
    if (re.test(norm) || re.test(String(text || ""))) {
      max = Math.max(max, weight);
    }
  }
  return max;
}

/**
 * Fuzzy template / UI / subtitle leak score (0..1).
 * @param {string} text
 * @param {{ confidence?: number, strategy?: string, band?: string }} [opts]
 */
export function scoreSttTemplateLeakV0(text, opts = {}) {
  const raw = String(text || "").trim();
  const norm = normalizeContaminationTextV0(raw);
  if (!norm) {
    return Object.freeze({
      templateScore: 0,
      uiLeak: 0,
      subtitleLeak: 0,
      platformOutro: 0,
      uiChrome: 0
    });
  }

  let platformOutro = 0;
  let strongHits = 0;
  for (const { re, weight } of STRONG_PLATFORM_SCORE_PATTERNS_V0) {
    if (re.test(norm) || re.test(raw)) {
      strongHits += 1;
      platformOutro = clamp01(platformOutro + weight * 0.82);
    }
  }
  if (strongHits >= 2) platformOutro = clamp01(platformOutro + 0.22);
  if (isPlatformOutroTemplateV0(raw)) platformOutro = Math.max(platformOutro, 0.93);

  let uiChrome = 0;
  for (const re of UI_CHROME_ECHO_PATTERNS_V0) {
    if (re.test(norm)) uiChrome = Math.max(uiChrome, 0.34);
  }
  if (isUiChromeEchoTemplateV0(raw)) uiChrome = Math.max(uiChrome, 0.82);

  let subtitleLeak = maxPatternScoreV0(raw, CAPTION_SUBTITLE_SCORE_PATTERNS_V0);
  if (STT_TAB_AUDIO_PATTERNS_V0.some((re) => re.test(raw))) {
    subtitleLeak = Math.max(subtitleLeak, 0.78);
  }
  if (isMixedScriptTabLeakV0(raw)) subtitleLeak = Math.max(subtitleLeak, 0.62);

  let weakCue = 0;
  let weakHits = 0;
  for (const { re, weight } of WEAK_TEMPLATE_SCORE_PATTERNS_V0) {
    if (re.test(norm) || re.test(raw)) {
      weakHits += 1;
      weakCue = Math.max(weakCue, weight);
    }
  }
  if (weakHits >= 2) weakCue = clamp01(Math.max(weakCue, 0.53 + weakHits * 0.11));
  if (weakHits >= 3) weakCue = clamp01(Math.max(weakCue, 0.84));
  platformOutro = Math.max(platformOutro, weakCue);

  if (hasInternalTranscriptRepetitionV3(raw, 14) && (platformOutro > 0.2 || uiChrome > 0.2)) {
    platformOutro = clamp01(platformOutro + 0.16);
    uiChrome = clamp01(uiChrome + 0.12);
  }

  const confirmedPlatformTemplate =
    isPlatformOutroTemplateV0(raw) || isUiChromeEchoTemplateV0(raw);

  const conf = Number(opts.confidence);
  const conversational = isConversationalTurkishUtteranceV3(raw);
  if (!confirmedPlatformTemplate) {
    if (Number.isFinite(conf) && conf >= 0.62 && conversational) {
      platformOutro *= 0.55;
      uiChrome *= 0.5;
      weakCue *= 0.45;
    } else if (Number.isFinite(conf) && conf >= 0.55 && raw.split(/\s+/).length >= 4) {
      platformOutro *= 0.72;
      uiChrome *= 0.68;
    }
  }

  const uiLeak = clamp01(Math.max(uiChrome, platformOutro * 0.88));
  subtitleLeak = clamp01(subtitleLeak);
  const templateScore = clamp01(Math.max(platformOutro, uiLeak * 0.95, subtitleLeak * 0.92));

  return Object.freeze({
    templateScore,
    uiLeak,
    subtitleLeak,
    platformOutro: clamp01(platformOutro),
    uiChrome: clamp01(uiChrome)
  });
}

function normalizeContaminationTextV0(text) {
  return String(text || "")
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} text
 */
export function isPlatformOutroTemplateV0(text) {
  const norm = normalizeContaminationTextV0(text);
  if (!norm) return false;
  return PLATFORM_OUTRO_PATTERNS_V0.some((re) => re.test(norm));
}

/**
 * @param {string} text
 */
export function isUiChromeEchoTemplateV0(text) {
  const norm = normalizeContaminationTextV0(text);
  if (!norm) return false;
  return UI_CHROME_ECHO_PATTERNS_V0.some((re) => re.test(norm));
}

/**
 * Platform / UI chrome signature (outro, footer, subscribe CTA).
 * @param {string} text
 */
export function hasPlatformSignatureV0(text) {
  return isPlatformOutroTemplateV0(text) || isUiChromeEchoTemplateV0(text);
}

/**
 * Mixed-script tab leak (Arabic + Latin in one STT blob).
 * @param {string} text
 */
export function isMixedScriptTabLeakV0(text) {
  const raw = String(text || "").trim();
  if (raw.length < 12) return false;
  const arabic = measureArabicScriptRatioV0(raw);
  const latin = measureLatinScriptRatioV0(raw);
  return arabic >= 0.22 && latin >= 0.12;
}

/**
 * @param {string} text
 * @param {{ maxRms?: number, speechMs?: number }} [opts]
 */
export function isSttPhantomPoliteClosureV0(text, opts = {}) {
  const norm = normalizeContaminationTextV0(text);
  if (!STT_PHANTOM_POLITE_ONLY_RE_V0.test(norm)) return false;
  const maxRms = Number(opts.maxRms);
  const speechMs = Number(opts.speechMs);
  if (Number.isFinite(maxRms) && maxRms >= 0.1 && Number.isFinite(speechMs) && speechMs >= 350) {
    return false;
  }
  return true;
}

/**
 * internal_repetition + platform_signature → drop; high_conf_directed → allow stutter.
 * @param {string} text
 * @param {{ confidence?: number, band?: string, strategy?: string, minChunkLen?: number }} [opts]
 */
export function evaluateInternalRepetitionRiskV0(text, opts = {}) {
  const raw = String(text || "").trim();
  const internal = hasInternalTranscriptRepetitionV3(raw, opts.minChunkLen ?? 14);
  if (!internal) {
    return Object.freeze({ risky: false, reason: null, allowStutter: false });
  }

  const conf = Number(opts.confidence);
  const band = String(opts.band || "");
  const highConfDirected =
    band === "directed_candidate" && Number.isFinite(conf) && conf >= 0.62;

  if (highConfDirected) {
    return Object.freeze({ risky: false, reason: "stutter_allowed", allowStutter: true });
  }

  if (hasPlatformSignatureV0(raw)) {
    return Object.freeze({
      risky: true,
      reason: "internal_repetition_platform_sig",
      allowStutter: false
    });
  }

  return Object.freeze({ risky: false, reason: null, allowStutter: true });
}

/**
 * @param {string} text
 * @param {{ strategy?: string, confidence?: number, band?: string, maxRms?: number, speechMs?: number }} [opts]
 */
export function evaluateSttContaminationV0(text, opts = {}) {
  const raw = String(text || "").trim();
  const norm = normalizeContaminationTextV0(raw);

  if (!norm) {
    return Object.freeze({ contaminated: false, kind: null, reason: null, shadowOnly: false });
  }

  if (isPlatformOutroTemplateV0(raw)) {
    return Object.freeze({
      contaminated: true,
      kind: "platform_outro",
      reason: "platform_template_leak",
      shadowOnly: true
    });
  }

  if (isUiChromeEchoTemplateV0(raw)) {
    return Object.freeze({
      contaminated: true,
      kind: "ui_chrome_echo",
      reason: "ui_chrome_echo",
      shadowOnly: true
    });
  }

  if (STT_TAB_AUDIO_PATTERNS_V0.some((re) => re.test(raw))) {
    return Object.freeze({
      contaminated: true,
      kind: "tab_audio_spam",
      reason: "platform_template_leak",
      shadowOnly: true
    });
  }

  if (isMixedScriptTabLeakV0(raw)) {
    return Object.freeze({
      contaminated: true,
      kind: "mixed_script_leak",
      reason: "script_locale_mismatch",
      shadowOnly: true
    });
  }

  if (isSttPhantomPoliteClosureV0(raw, { maxRms: opts.maxRms, speechMs: opts.speechMs })) {
    return Object.freeze({
      contaminated: true,
      kind: "phantom_polite_closure",
      reason: "stt_phantom_polite",
      shadowOnly: true
    });
  }

  const repRisk = evaluateInternalRepetitionRiskV0(raw, opts);
  if (repRisk.risky) {
    return Object.freeze({
      contaminated: true,
      kind: "stt_loop",
      reason: repRisk.reason || "internal_repetition",
      shadowOnly: true
    });
  }

  return Object.freeze({ contaminated: false, kind: null, reason: null, shadowOnly: false });
}
