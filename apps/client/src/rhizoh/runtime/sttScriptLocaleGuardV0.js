/**
 * STT validation — dual-check: lang match AND (script match OR semantic high confidence).
 * Avoids dropping Latin Turkish at ~0.55–0.65 conf under TV noise; still blocks Persian script garbage.
 */

import { detectRhizohMultilingualLocaleV0 } from "./rhizohMultilingualBridgeV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { readSttInputLanguageCodeHintV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { isConversationalTurkishUtteranceV3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";
import { normalizeSttCrossScriptForTurkishUiV0 } from "./rhizohSttCrossScriptNormalizeV0.js";

export const STT_SCRIPT_LOCALE_GUARD_SCHEMA_V0 = "castle.rhizoh.stt_script_locale_guard.v0";

export const STT_VALIDATION_PASS_MODE_V0 = Object.freeze({
  SCRIPT: "script",
  SEMANTIC: "semantic",
  LANG_ONLY: "lang_only"
});

/** Arabic + Persian presentation forms */
const ARABIC_SCRIPT_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u;

const LATIN_SCRIPT_RE = /[A-Za-zğüşıöçĞÜŞİÖÇ]/u;

const CYRILLIC_RE = /[\u0400-\u04FF]/u;

const TR_LATIN_HINT_RE =
  /[ğüşıöçĞÜŞİÖÇ]|\b(merhaba|selam|bir|ve|için|nasıl|neden|tamam|rhizoh|harita|aç|kapat|evet|hayır)\b/iu;

const SEMANTIC_CONF_MIN_V0 = 0.55;
const ARABIC_REJECT_RATIO_V0 = 0.42;
const ARABIC_SOFT_RATIO_V0 = 0.22;
export const VEPM_SCRIPT_GATE_SOFT_CONF_MAX_V0 = 0.7;

/**
 * @param {string} text
 */
export function measureArabicScriptRatioV0(text) {
  const t = String(text || "");
  let script = 0;
  let letters = 0;
  for (const ch of t) {
    if (/\s/.test(ch)) continue;
    letters += 1;
    if (ARABIC_SCRIPT_RE.test(ch)) script += 1;
  }
  return letters ? script / letters : 0;
}

/**
 * @param {string} text
 */
export function measureLatinScriptRatioV0(text) {
  const t = String(text || "");
  let script = 0;
  let letters = 0;
  for (const ch of t) {
    if (/\s/.test(ch)) continue;
    letters += 1;
    if (LATIN_SCRIPT_RE.test(ch)) script += 1;
  }
  return letters ? script / letters : 0;
}

/**
 * @param {string} text
 */
export function measureCyrillicScriptRatioV0(text) {
  const t = String(text || "");
  let script = 0;
  let letters = 0;
  for (const ch of t) {
    if (/\s/.test(ch)) continue;
    letters += 1;
    if (CYRILLIC_RE.test(ch)) script += 1;
  }
  return letters ? script / letters : 0;
}

/**
 * @param {{
 *   expectedLocale?: string,
 *   sttLanguageHint?: string,
 *   confidence?: number,
 *   strategy?: string
 * }} langCtx
 * @param {string} raw
 */
function evaluateSemanticPlausibilityV0(raw, langCtx) {
  const conf = Number(langCtx.confidence);
  const confOk = Number.isFinite(conf) && conf >= SEMANTIC_CONF_MIN_V0;
  const hasTrLatin = TR_LATIN_HINT_RE.test(raw);
  const conversational = isConversationalTurkishUtteranceV3(raw);
  const detected = detectRhizohMultilingualLocaleV0(raw, "");
  const detectedTr = detected.code === "tr" && detected.confidence >= 0.5;
  const latinRatio = measureLatinScriptRatioV0(raw);

  const semanticHigh =
    confOk &&
    (hasTrLatin || conversational || detectedTr) &&
    (latinRatio >= 0.35 || hasTrLatin);

  return Object.freeze({
    semanticHigh,
    whisperConfidence: confOk ? conf : null,
    hasTrLatin,
    conversational,
    detectedLocale: detected.code,
    detectedConfidence: detected.confidence,
    latinRatio
  });
}

/**
 * PASS = langMatch AND (scriptMatch OR semanticHigh)
 * @param {string} text
 * @param {{
 *   expectedLocale?: string,
 *   sttLanguageHint?: string,
 *   confidence?: number,
 *   strategy?: string
 * }} [opts]
 */
export function evaluateSttScriptAgainstUiLocaleV0(text, opts = {}) {
  const raw = String(text || "").trim();
  if (!raw) {
    return Object.freeze({
      schema: STT_SCRIPT_LOCALE_GUARD_SCHEMA_V0,
      ok: true,
      reason: "empty"
    });
  }

  const expected = String(opts.expectedLocale || resolveOutputLanguageCodeV0() || "tr")
    .toLowerCase()
    .replace(/-.*/, "");
  const cross =
    expected === "tr" ? normalizeSttCrossScriptForTurkishUiV0(raw) : { text: raw, remapped: false };
  const evalText = cross.text;
  const sttHint = String(
    opts.sttLanguageHint || readSttInputLanguageCodeHintV0() || ""
  )
    .toLowerCase()
    .replace(/-.*/, "");

  const vepmConfidence = Number(opts.vepmConfidence);
  const vepmLow =
    Number.isFinite(vepmConfidence) && vepmConfidence < VEPM_SCRIPT_GATE_SOFT_CONF_MAX_V0;
  const phantomLikely = opts.phantomLikely === true;

  const arabicRatio = measureArabicScriptRatioV0(evalText);
  const cyrillicRatio = measureCyrillicScriptRatioV0(evalText);
  const latinRatio = measureLatinScriptRatioV0(evalText);
  const semantic = evaluateSemanticPlausibilityV0(evalText, opts);

  const langMatch =
    expected === "tr"
      ? sttHint === "tr" || sttHint.startsWith("tr") || expected === "tr"
      : expected === sttHint.replace(/-.*/, "") || expected === "en";

  const scriptMatch =
    expected === "tr"
      ? arabicRatio < ARABIC_SOFT_RATIO_V0 && cyrillicRatio < 0.35 && latinRatio >= 0.4
      : arabicRatio < 0.35 && /[a-z]/i.test(evalText);

  const pass =
    expected !== "tr"
      ? scriptMatch || semantic.semanticHigh
      : langMatch && (scriptMatch || semantic.semanticHigh);

  const softMismatchEligible =
    expected === "tr" &&
    !pass &&
    !semantic.semanticHigh &&
    (phantomLikely || vepmLow || arabicRatio >= ARABIC_SOFT_RATIO_V0) &&
    cross.remapped !== true;

  if (!pass && expected === "tr" && arabicRatio >= ARABIC_SOFT_RATIO_V0 && !semantic.semanticHigh) {
    if (softMismatchEligible) {
      return Object.freeze({
        schema: STT_SCRIPT_LOCALE_GUARD_SCHEMA_V0,
        ok: false,
        reason: "script_locale_mismatch",
        softMismatch: true,
        shadowForward: true,
        passMode: arabicRatio >= ARABIC_REJECT_RATIO_V0 ? "reject_soft" : "reject_soft",
        expectedLocale: expected,
        sttLanguageHint: sttHint,
        langMatch,
        scriptMatch,
        semantic,
        arabicRatio,
        latinRatio,
        preview: raw.slice(0, 96),
        phantomLikely,
        vepmLowConfidence: vepmLow
      });
    }
    return Object.freeze({
      schema: STT_SCRIPT_LOCALE_GUARD_SCHEMA_V0,
      ok: false,
      reason: "script_locale_mismatch",
      passMode: arabicRatio >= ARABIC_REJECT_RATIO_V0 ? "reject_hard" : "reject_soft",
      expectedLocale: expected,
      sttLanguageHint: sttHint,
      langMatch,
      scriptMatch,
      semantic,
      arabicRatio,
      latinRatio,
      preview: raw.slice(0, 96)
    });
  }

  if (!pass && expected === "tr" && cyrillicRatio >= 0.45 && !semantic.semanticHigh) {
    return Object.freeze({
      schema: STT_SCRIPT_LOCALE_GUARD_SCHEMA_V0,
      ok: false,
      reason: "script_locale_mismatch",
      expectedLocale: expected,
      cyrillicRatio,
      preview: raw.slice(0, 96)
    });
  }

  if (!pass) {
    return Object.freeze({
      schema: STT_SCRIPT_LOCALE_GUARD_SCHEMA_V0,
      ok: false,
      reason: "script_locale_mismatch",
      passMode: "reject",
      expectedLocale: expected,
      sttLanguageHint: sttHint,
      langMatch,
      scriptMatch,
      semantic,
      arabicRatio,
      latinRatio,
      cyrillicRatio,
      preview: raw.slice(0, 96)
    });
  }

  return Object.freeze({
    schema: STT_SCRIPT_LOCALE_GUARD_SCHEMA_V0,
    ok: true,
    passMode: scriptMatch
      ? STT_VALIDATION_PASS_MODE_V0.SCRIPT
      : semantic.semanticHigh
        ? STT_VALIDATION_PASS_MODE_V0.SEMANTIC
        : STT_VALIDATION_PASS_MODE_V0.LANG_ONLY,
    langMatch,
    scriptMatch,
    semantic,
    expectedLocale: expected,
    normalizedText: cross.remapped ? evalText : undefined,
    crossScriptRemap: cross.remapped === true,
    arabicRatio,
    latinRatio,
    cyrillicRatio
  });
}
