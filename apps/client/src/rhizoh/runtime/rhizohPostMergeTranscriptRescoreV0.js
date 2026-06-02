/**
 * Post-merge transcript rescore — language inference + phantom detection after split merge.
 */

import { detectRhizohMultilingualLocaleV0 } from "./rhizohMultilingualBridgeV0.js";
import { normalizeSttCrossScriptForTurkishUiV0 } from "./rhizohSttCrossScriptNormalizeV0.js";
import { measureArabicScriptRatioV0, measureLatinScriptRatioV0, VEPM_SCRIPT_GATE_SOFT_CONF_MAX_V0 } from "./sttScriptLocaleGuardV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { getActiveVoiceEnvironmentSessionV0 } from "./voiceEnvironmentProfileMemoryV0.js";

export const RHIZOH_POST_MERGE_TRANSCRIPT_RESCORE_SCHEMA_V0 =
  "castle.rhizoh.post_merge_transcript_rescore.v0";

const PHANTOM_ARABIC_RATIO_V0 = 0.5;

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   languageHint?: string
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
    languageHint: languageHint || undefined,
    detectedLocale: detected.code,
    detectedConfidence: detected.confidence,
    arabicRatioOriginal: arabicOriginal,
    arabicRatioText: arabicText,
    phantomLikely,
    vepmLowConfidence,
    vepmConfidence: Number.isFinite(vepmConfidence) ? vepmConfidence : null,
    confidence: Number.isFinite(confidence) ? confidence : undefined,
    strategy
  });
}
