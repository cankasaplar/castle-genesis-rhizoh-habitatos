/**
 * Post-merge transcript rescore — language inference + phantom detection after split merge.
 * Rule: silent / low-confidence / high-entropy RTL output → SKIP language inference.
 */

import { detectRhizohMultilingualLocaleV0 } from "./rhizohMultilingualBridgeV0.js";
import { normalizeSttCrossScriptForTurkishUiV0 } from "./rhizohSttCrossScriptNormalizeV0.js";
import {
  measureArabicScriptRatioV0,
  measureLatinScriptRatioV0,
  VEPM_SCRIPT_GATE_SOFT_CONF_MAX_V0
} from "./sttScriptLocaleGuardV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { getActiveVoiceEnvironmentSessionV0 } from "./voiceEnvironmentProfileMemoryV0.js";

export const RHIZOH_POST_MERGE_TRANSCRIPT_RESCORE_SCHEMA_V0 =
  "castle.rhizoh.post_merge_transcript_rescore.v0";

const PHANTOM_ARABIC_RATIO_V0 = 0.5;
const LOW_RMS_INFERENCE_SKIP_V0 = 0.018;
const LOW_CONF_INFERENCE_SKIP_V0 = 0.58;
const HIGH_SCRIPT_ENTROPY_V0 = 0.72;

/**
 * @param {string} text
 */
export function measureTranscriptScriptEntropyV0(text) {
  const t = String(text || "");
  const compact = t.replace(/\s+/g, "");
  if (!compact) return 0;
  const unique = new Set([...compact]).size;
  const uniqueRatio = unique / compact.length;
  const arabicRatio = measureArabicScriptRatioV0(t);
  return Math.max(0, Math.min(1, uniqueRatio * 0.55 + arabicRatio * 0.45));
}

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   maxRms?: number
 * }} input
 */
export function shouldSkipLanguageInferenceForTranscriptV0(input = {}) {
  const text = String(input.text || "").trim();
  const strategy = String(input.strategy || "");
  const maxRms = Number(input.maxRms);
  const confidence = Number(input.confidence);
  const uiLocale = resolveOutputLanguageCodeV0();
  const cross =
    uiLocale === "tr"
      ? normalizeSttCrossScriptForTurkishUiV0(text)
      : { text, remapped: false };

  const arabicRatio = measureArabicScriptRatioV0(text);
  const latinRatio = measureLatinScriptRatioV0(cross.text || text);
  const entropy = measureTranscriptScriptEntropyV0(text);
  const lowRms = Number.isFinite(maxRms) && maxRms < LOW_RMS_INFERENCE_SKIP_V0;
  const lowConfidence = !Number.isFinite(confidence) || confidence < LOW_CONF_INFERENCE_SKIP_V0;
  const highEntropyRtl = arabicRatio >= 0.42 && latinRatio < 0.12;
  const splitMergedWeak = strategy === "split_merged" && lowConfidence;

  /** @type {string[]} */
  const reasons = [];
  if (lowRms) reasons.push("low_rms");
  if (lowConfidence) reasons.push("low_confidence");
  if (highEntropyRtl) reasons.push("high_entropy_rtl");
  if (splitMergedWeak) reasons.push("split_merge_weak");
  if (entropy >= HIGH_SCRIPT_ENTROPY_V0 && latinRatio < 0.2) reasons.push("script_entropy");

  const skip =
    cross.remapped !== true &&
    highEntropyRtl &&
    (lowRms || lowConfidence || splitMergedWeak || entropy >= HIGH_SCRIPT_ENTROPY_V0);

  return Object.freeze({
    skip,
    reasons: Object.freeze(reasons),
    entropy,
    arabicRatio,
    latinRatio,
    lowRms,
    lowConfidence,
    crossScriptRemap: cross.remapped === true
  });
}

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   languageHint?: string,
 *   maxRms?: number,
 *   recordedMs?: number
 * }} input
 */
export function rescoreVoiceTranscriptAfterMergeV0(input = {}) {
  const originalText = String(input.text || "").trim();
  const strategy = String(input.strategy || "");
  const uiLocale = resolveOutputLanguageCodeV0();
  const cross =
    uiLocale === "tr"
      ? normalizeSttCrossScriptForTurkishUiV0(originalText)
      : { text: originalText, remapped: false };
  const text = cross.text || originalText;

  const skipEval = shouldSkipLanguageInferenceForTranscriptV0({
    text: originalText,
    confidence: input.confidence,
    strategy,
    maxRms: input.maxRms
  });

  if (skipEval.skip) {
    return Object.freeze({
      schema: RHIZOH_POST_MERGE_TRANSCRIPT_RESCORE_SCHEMA_V0,
      text,
      originalText,
      crossScriptRemap: cross.remapped === true,
      skipLanguageInference: true,
      skipReasons: skipEval.reasons,
      scriptEntropy: skipEval.entropy,
      phantomLikely: true,
      maxRms: Number.isFinite(Number(input.maxRms)) ? Number(input.maxRms) : null,
      confidence: Number.isFinite(Number(input.confidence)) ? Number(input.confidence) : undefined,
      strategy
    });
  }

  const detected = detectRhizohMultilingualLocaleV0(text, "");
  const arabicOriginal = measureArabicScriptRatioV0(originalText);
  const arabicText = measureArabicScriptRatioV0(text);

  const vepmSession = getActiveVoiceEnvironmentSessionV0();
  const vepmConfidence = Number(vepmSession?.profile?.confidence);
  const vepmLowConfidence =
    Number.isFinite(vepmConfidence) && vepmConfidence < VEPM_SCRIPT_GATE_SOFT_CONF_MAX_V0;

  const phantomLikely =
    (strategy === "split_merged" || strategy === "whisper_only") &&
    arabicOriginal >= PHANTOM_ARABIC_RATIO_V0 &&
    cross.remapped !== true &&
    measureLatinScriptRatioV0(text) < 0.15;

  let languageHint = String(input.languageHint || "");
  if (uiLocale === "tr" && arabicOriginal >= 0.22 && (phantomLikely || vepmLowConfidence)) {
    languageHint = "tr";
  }

  let confidence = Number(input.confidence);
  if (!Number.isFinite(confidence)) {
    if (detected.confidence >= 0.45) confidence = Math.min(0.6, detected.confidence);
    else if (vepmLowConfidence) confidence = 0.52;
  }

  return Object.freeze({
    schema: RHIZOH_POST_MERGE_TRANSCRIPT_RESCORE_SCHEMA_V0,
    text,
    originalText,
    crossScriptRemap: cross.remapped === true,
    skipLanguageInference: false,
    languageHint: languageHint || undefined,
    detectedLocale: detected.code,
    detectedConfidence: detected.confidence,
    arabicRatioOriginal: arabicOriginal,
    arabicRatioText: arabicText,
    scriptEntropy: measureTranscriptScriptEntropyV0(text),
    phantomLikely,
    vepmLowConfidence,
    vepmConfidence: Number.isFinite(vepmConfidence) ? vepmConfidence : null,
    confidence: Number.isFinite(confidence) ? confidence : undefined,
    strategy
  });
}
