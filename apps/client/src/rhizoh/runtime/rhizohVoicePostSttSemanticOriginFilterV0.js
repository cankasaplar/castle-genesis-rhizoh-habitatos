/**
 * Post-STT Semantic Origin Filter — probabilistic origin attribution + fuzzy template scoring.
 * Hard DROP only above confidence thresholds; mid-band → quarantine (no model input).
 */

import {
  scoreSttTemplateLeakV0,
  TEMPLATE_SCORE_HARD_DROP_V0,
  TEMPLATE_SCORE_QUARANTINE_MIN_V0
} from "./voiceSttContaminationGuardV0.js";
import { evaluateSttScriptAgainstUiLocaleV0 } from "./sttScriptLocaleGuardV0.js";
import { normalizeSttCrossScriptForTurkishUiV0 } from "./rhizohSttCrossScriptNormalizeV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { readVoiceLanguageLockV0 } from "./rhizohConversationLanguageV0.js";
import {
  measureArabicScriptRatioV0,
  measureLatinScriptRatioV0
} from "./sttScriptLocaleGuardV0.js";
import { VOICE_TRANSCRIPT_MIN_CONFIDENCE_V3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";
import { isVoicePostSttOriginFilterEnabledV0 } from "./rhizohVoiceIngestGateFlagsV0.js";
import {
  applyOriginConfidenceEmaV0,
  ORIGIN_CONFIDENCE_EMA_WINDOW_V0
} from "./rhizohSttOriginConfidenceEmaV0.js";
import { isVoiceOriginRetryEnabledV0 } from "./rhizohSttOriginRetryBudgetV0.js";

export const RHIZOH_VOICE_POST_STT_ORIGIN_FILTER_SCHEMA_V0 =
  "castle.rhizoh.voice_post_stt_semantic_origin.v0";

export const POST_STT_ORIGIN_ACTION_V0 = Object.freeze({
  PASS: "pass",
  DROP: "drop",
  QUARANTINE: "quarantine"
});

export const POST_STT_LANGUAGE_ENTROPY_DROP_V0 = 0.72;
export const POST_STT_LOW_CONFIDENCE_SILENT_V0 = VOICE_TRANSCRIPT_MIN_CONFIDENCE_V3;
export const ORIGIN_UI_LEAK_HARD_DROP_V0 = 0.7;
export const ORIGIN_SPEECH_LOW_WITH_UI_LEAK_V0 = Object.freeze({
  speechMax: 0.4,
  uiLeakMin: 0.3
});

/** Stable EMA must reach this before mid-band QUARANTINE (retry) fires. */
export const ORIGIN_QUARANTINE_STABLE_TEMPLATE_MIN_V0 = 0.58;

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

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

const MIXED_TR_AR_EN_RE_V0 =
  /[\u0600-\u06FF].*[A-Za-zğüşıöçĞÜŞİÖÇ]|[A-Za-zğüşıöçĞÜŞİÖÇ].*[\u0600-\u06FF]/u;

const RELIGIOUS_PHANTOM_RE_V0 = [
  /\bamen\b.*\bamen\b/i,
  /سبحان/i,
  /الحمد/i,
  /استغفر/i,
  /in the name of (?:the )?father/i
];

/**
 * @param {string} text
 */
export function isMixedLanguageNoiseV0(text) {
  const raw = String(text || "").trim();
  if (!raw) return false;
  if (!MIXED_TR_AR_EN_RE_V0.test(raw)) return false;
  const arabic = measureArabicScriptRatioV0(raw);
  const latin = measureLatinScriptRatioV0(raw);
  const hasEnglishCue = /\b(thank|subscribe|watching|please|hello|amen)\b/i.test(raw);
  return arabic >= 0.12 && latin >= 0.12 && (hasEnglishCue || arabic >= 0.28);
}

/**
 * @param {string} text
 */
export function hasCaptionUiMarkerV0(text) {
  return /(?:^|\s)(?:\[?\s*(?:caption|subtitle|altyaz[ıi]|cc)\s*\]?|>>|<<|\(\s*music\s*\))/iu.test(
    String(text || "")
  );
}

/**
 * @param {{
 *   confidence?: number,
 *   templateScores?: ReturnType<typeof scoreSttTemplateLeakV0>,
 *   scriptGuard?: object,
 *   entropy?: number,
 *   latinRatio?: number
 * }} ctx
 */
export function buildSttOriginConfidenceV0(ctx = {}) {
  const conf = Number(ctx.confidence);
  const scores = ctx.templateScores || scoreSttTemplateLeakV0("");
  const scriptGuard = ctx.scriptGuard || {};

  let speech = Number.isFinite(conf) ? clamp01(conf) : 0.42;
  if (scriptGuard.passMode === "semantic" && Number.isFinite(conf)) {
    speech = clamp01(conf * 1.05);
  }

  let languageMatch = 0.78;
  if (scriptGuard.ok) {
    languageMatch = clamp01(
      scriptGuard.semantic?.semanticHigh ? 0.92 : scriptGuard.langMatch ? 0.86 : 0.78
    );
  } else if (scriptGuard.softMismatch) {
    languageMatch = 0.52;
  } else if (scriptGuard.reason) {
    languageMatch = 0.28;
  }

  return Object.freeze({
    speech,
    uiLeak: clamp01(scores.uiLeak),
    subtitleLeak: clamp01(scores.subtitleLeak),
    languageMatch,
    templateScore: clamp01(scores.templateScore)
  });
}

/**
 * @param {ReturnType<typeof buildSttOriginConfidenceV0>} stable
 * @param {{ instant?: ReturnType<typeof buildSttOriginConfidenceV0> }} [opts]
 */
export function resolveOriginAttributionDecisionV0(stable, opts = {}) {
  const instant = opts.instant || stable;
  const { speech, uiLeak, subtitleLeak, languageMatch, templateScore } = stable;

  if (uiLeak > ORIGIN_UI_LEAK_HARD_DROP_V0) {
    return Object.freeze({
      action: POST_STT_ORIGIN_ACTION_V0.DROP,
      reason: "origin_ui_leak_hard",
      terminalDrop: true,
      retryStt: false
    });
  }
  if (
    speech < ORIGIN_SPEECH_LOW_WITH_UI_LEAK_V0.speechMax &&
    uiLeak > ORIGIN_SPEECH_LOW_WITH_UI_LEAK_V0.uiLeakMin
  ) {
    return Object.freeze({
      action: POST_STT_ORIGIN_ACTION_V0.DROP,
      reason: "origin_low_speech_ui_leak",
      terminalDrop: true,
      retryStt: false
    });
  }
  if (templateScore > TEMPLATE_SCORE_HARD_DROP_V0) {
    return Object.freeze({
      action: POST_STT_ORIGIN_ACTION_V0.DROP,
      reason: "post_stt_template_hard",
      terminalDrop: true,
      retryStt: false
    });
  }
  if (subtitleLeak > 0.82) {
    return Object.freeze({
      action: POST_STT_ORIGIN_ACTION_V0.DROP,
      reason: "origin_subtitle_leak_hard",
      terminalDrop: true,
      retryStt: false
    });
  }
  if (languageMatch < 0.22 && speech < 0.5) {
    return Object.freeze({
      action: POST_STT_ORIGIN_ACTION_V0.DROP,
      reason: "origin_language_mismatch_hard",
      terminalDrop: true,
      retryStt: false
    });
  }
  if (
    instant.templateScore >= TEMPLATE_SCORE_QUARANTINE_MIN_V0 &&
    templateScore >= ORIGIN_QUARANTINE_STABLE_TEMPLATE_MIN_V0 &&
    templateScore <= TEMPLATE_SCORE_HARD_DROP_V0
  ) {
    return Object.freeze({
      action: POST_STT_ORIGIN_ACTION_V0.QUARANTINE,
      reason: "post_stt_template_quarantine",
      terminalDrop: false,
      retryStt: true
    });
  }

  return Object.freeze({
    action: POST_STT_ORIGIN_ACTION_V0.PASS,
    reason: "origin_attribution_ok",
    terminalDrop: false,
    retryStt: false
  });
}

function finalizeOriginVerdict(base, originConfidenceRaw, emaSnap, attribution, extra = {}) {
  const action = attribution.action;
  const pass = action === POST_STT_ORIGIN_ACTION_V0.PASS;
  const quarantineRetry = action === POST_STT_ORIGIN_ACTION_V0.QUARANTINE;
  const terminalDrop = attribution.terminalDrop === true || action === POST_STT_ORIGIN_ACTION_V0.DROP;
  const stable = emaSnap.originConfidenceStable;
  const enrichedOrigin = Object.freeze({
    ...originConfidenceRaw,
    instant: emaSnap.instant,
    originConfidenceStable: stable,
    emaSamples: emaSnap.samples,
    emaWindow: ORIGIN_CONFIDENCE_EMA_WINDOW_V0
  });

  return Object.freeze({
    ...base,
    pass,
    action,
    reason: extra.reason || attribution.reason,
    originConfidence: enrichedOrigin,
    originConfidenceStable: stable,
    templateScore: stable.templateScore,
    silentDrop: terminalDrop,
    modelInput: pass,
    quarantine: quarantineRetry,
    softQuarantine: quarantineRetry,
    retryStt: attribution.retryStt === true,
    terminalDrop,
    ...extra
  });
}

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   maxRms?: number,
 *   sessionLanguage?: string,
 *   sttLanguageHint?: string,
 *   vepmConfidence?: number,
 *   phantomLikely?: boolean,
 *   originReevalPass?: boolean
 * }} input
 */
export function evaluatePostSttSemanticOriginV0(input = {}) {
  if (!isVoicePostSttOriginFilterEnabledV0()) {
    return Object.freeze({
      schema: RHIZOH_VOICE_POST_STT_ORIGIN_FILTER_SCHEMA_V0,
      pass: true,
      action: POST_STT_ORIGIN_ACTION_V0.PASS,
      reason: "post_stt_origin_disabled",
      disabled: true,
      modelInput: true,
      silentDrop: false
    });
  }

  const originalText = String(input.text || "").trim();
  const strategy = String(input.strategy || "");
  const sessionLanguage = String(
    input.sessionLanguage || readVoiceLanguageLockV0() || resolveOutputLanguageCodeV0() || "tr"
  ).slice(0, 2);
  const uiLocale = resolveOutputLanguageCodeV0();
  const cross =
    uiLocale === "tr"
      ? normalizeSttCrossScriptForTurkishUiV0(originalText)
      : { text: originalText, remapped: false };
  const text = cross.text || originalText;
  const confidence = Number(input.confidence);
  const entropy = measureTranscriptScriptEntropyV0(text);
  const arabicRatio = measureArabicScriptRatioV0(text);
  const latinRatio = measureLatinScriptRatioV0(text);
  const templateScores = scoreSttTemplateLeakV0(text, {
    confidence: input.confidence,
    strategy,
    band: input.band
  });

  const base = Object.freeze({
    schema: RHIZOH_VOICE_POST_STT_ORIGIN_FILTER_SCHEMA_V0,
    preview: text.slice(0, 96),
    entropy,
    arabicRatio,
    latinRatio,
    confidence: Number.isFinite(confidence) ? confidence : null,
    sessionLanguage,
    crossScriptRemap: cross.remapped === true,
    templateScores
  });

  if (!text) {
    const emptyConfidence = buildSttOriginConfidenceV0({ confidence, templateScores });
    const emptyEma = applyOriginConfidenceEmaV0(emptyConfidence);
    return finalizeOriginVerdict(
      base,
      emptyConfidence,
      emptyEma,
      {
        action: POST_STT_ORIGIN_ACTION_V0.DROP,
        reason: "post_stt_empty",
        terminalDrop: true,
        retryStt: false
      },
      { reason: "post_stt_empty" }
    );
  }

  const scriptGuard = evaluateSttScriptAgainstUiLocaleV0(text, {
    confidence: input.confidence,
    strategy,
    sttLanguageHint: input.sttLanguageHint || sessionLanguage,
    vepmConfidence: input.vepmConfidence,
    phantomLikely: input.phantomLikely === true
  });

  const originConfidenceRaw = buildSttOriginConfidenceV0({
    confidence: input.confidence,
    templateScores,
    scriptGuard,
    entropy,
    latinRatio
  });

  const emaSnap = applyOriginConfidenceEmaV0(originConfidenceRaw);
  const stableConfidence = emaSnap.originConfidenceStable;
  const attribution = resolveOriginAttributionDecisionV0(stableConfidence, {
    instant: emaSnap.instant
  });
  if (attribution.action !== POST_STT_ORIGIN_ACTION_V0.PASS) {
    if (
      input.originReevalPass === true &&
      attribution.action === POST_STT_ORIGIN_ACTION_V0.QUARANTINE
    ) {
      return finalizeOriginVerdict(
        base,
        originConfidenceRaw,
        emaSnap,
        {
          action: POST_STT_ORIGIN_ACTION_V0.DROP,
          reason: "origin_reeval_still_quarantine",
          terminalDrop: true,
          retryStt: false
        },
        { scriptGuard: scriptGuard.ok ? undefined : scriptGuard, reason: "origin_reeval_still_quarantine" }
      );
    }
    const allowRetry =
      attribution.retryStt === true &&
      isVoiceOriginRetryEnabledV0() &&
      input.originReevalPass !== true;
    if (attribution.action === POST_STT_ORIGIN_ACTION_V0.QUARANTINE && !allowRetry) {
      return finalizeOriginVerdict(
        base,
        originConfidenceRaw,
        emaSnap,
        {
          action: POST_STT_ORIGIN_ACTION_V0.DROP,
          reason:
            attribution.reason === "post_stt_template_quarantine"
              ? "origin_quarantine_retry_disabled"
              : attribution.reason,
          terminalDrop: true,
          retryStt: false
        },
        { scriptGuard: scriptGuard.ok ? undefined : scriptGuard }
      );
    }
    return finalizeOriginVerdict(base, originConfidenceRaw, emaSnap, attribution, {
      scriptGuard: scriptGuard.ok ? undefined : scriptGuard
    });
  }

  if (
    RELIGIOUS_PHANTOM_RE_V0.some((re) => re.test(text)) &&
    stableConfidence.templateScore > 0.55
  ) {
    return finalizeOriginVerdict(
      base,
      originConfidenceRaw,
      emaSnap,
      {
        action: POST_STT_ORIGIN_ACTION_V0.DROP,
        reason: "post_stt_religious_phantom",
        terminalDrop: true,
        retryStt: false
      },
      { reason: "post_stt_religious_phantom" }
    );
  }

  if (isMixedLanguageNoiseV0(text) && stableConfidence.uiLeak > 0.35) {
    return finalizeOriginVerdict(
      base,
      originConfidenceRaw,
      emaSnap,
      {
        action: POST_STT_ORIGIN_ACTION_V0.DROP,
        reason: "post_stt_mixed_language_noise",
        terminalDrop: true,
        retryStt: false
      },
      { reason: "post_stt_mixed_language_noise" }
    );
  }

  if (
    entropy >= POST_STT_LANGUAGE_ENTROPY_DROP_V0 &&
    latinRatio < 0.2 &&
    stableConfidence.speech < 0.55
  ) {
    return finalizeOriginVerdict(
      base,
      originConfidenceRaw,
      emaSnap,
      {
        action: POST_STT_ORIGIN_ACTION_V0.DROP,
        reason: "post_stt_high_script_entropy",
        terminalDrop: true,
        retryStt: false
      },
      { reason: "post_stt_high_script_entropy" }
    );
  }

  if (!scriptGuard.ok && scriptGuard.softMismatch !== true && scriptGuard.shadowForward !== true) {
    return finalizeOriginVerdict(
      base,
      originConfidenceRaw,
      emaSnap,
      {
        action: POST_STT_ORIGIN_ACTION_V0.DROP,
        reason: scriptGuard.reason || "post_stt_language_mismatch",
        terminalDrop: true,
        retryStt: false
      },
      { scriptGuard, reason: scriptGuard.reason || "post_stt_language_mismatch" }
    );
  }

  if (!Number.isFinite(confidence) || confidence < POST_STT_LOW_CONFIDENCE_SILENT_V0) {
    return finalizeOriginVerdict(
      base,
      originConfidenceRaw,
      emaSnap,
      {
        action: POST_STT_ORIGIN_ACTION_V0.DROP,
        reason: "post_stt_low_confidence_silent",
        terminalDrop: true,
        retryStt: false
      },
      { reason: "post_stt_low_confidence_silent" }
    );
  }

  return finalizeOriginVerdict(
    base,
    originConfidenceRaw,
    emaSnap,
    {
      action: POST_STT_ORIGIN_ACTION_V0.PASS,
      reason: "post_stt_origin_ok",
      terminalDrop: false,
      retryStt: false
    },
    { reason: "post_stt_origin_ok", scriptGuard: scriptGuard.ok ? scriptGuard : undefined }
  );
}

/**
 * @param {ReturnType<typeof evaluatePostSttSemanticOriginV0>} verdict
 */
export function publishPostSttOriginFilterDebugV0(verdict) {
  if (typeof window === "undefined" || !verdict) return;
  try {
    window.__CASTLE_RHIZOH_POST_STT_ORIGIN__ = Object.freeze({
      ...verdict,
      atMs: Date.now()
    });
  } catch {
    /* noop */
  }
}
