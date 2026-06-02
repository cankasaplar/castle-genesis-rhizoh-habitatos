/**
 * Voice Engine v3 — transcript accept/retry gate (confidence + Whisper artifact band).
 */

import { evaluateSttScriptAgainstUiLocaleV0 } from "../sttScriptLocaleGuardV0.js";
import { normalizeSttCrossScriptForTurkishUiV0 } from "../rhizohSttCrossScriptNormalizeV0.js";

export const VOICE_TRANSCRIPT_SANITY_V3_SCHEMA = "castle.rhizoh.voice.transcript_sanity.v3";
export const VOICE_TRANSCRIPT_MIN_CONFIDENCE_V3 = 0.35;
export const VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3 = 0.62;
export const VOICE_TRANSCRIPT_MIN_CHARS_V3 = 3;

/** Align with orchestrator VOICE_MIN_RECORD_MS_V3 — long capture ≠ short-text artifact. */
export const VOICE_TRANSCRIPT_MIN_RECORD_MS_V3 = 1200;

/** Conversational TR cues (witness / shadow-forward; not execution bypass alone). */
const CONVERSATIONAL_UTTERANCE_PATTERNS_V3 = [
  /nas[ıi]ls[ıi]n/i,
  /sohbet/i,
  /dostum/i,
  /duyabiliyor\s+musun/i,
  /indirebiliyor\s+musun/i,
  /beni\s+duy/i,
  /bugün/i
];

/** Known Whisper TR training / outro artifacts — only reject in suspicious confidence band. */
const SUSPICIOUS_WHISPER_PHRASES_V3 = [
  /bir\s+sonraki\s+tarifte/i,
  /bu\s+videoyu\s+be[gğ]en/i,
  /payla[sş]may[iı]\s+unut/i,
  /be[gğ]enip\s+payla[sş]/i,
  /altyaz[ıi]\s*m\.?\s*k/i,
  /izledi[ğg]iniz\s+i[çc]in\s+te[sş]ekk/i,
  /i[zş]?ledi[ğg]iniz.*te[sş]ekk/i,
  /te[sş]ekk[üu]rler.*ho[sş][çc]akal/i,
  /thank(s)?\s*for\s*watching/i,
  /^ho[sş][çc]akal[iı]n$/
];

/** Whisper often returns exactly 0.55 when guessing on low-speech audio. */
export const VOICE_WHISPER_DEFAULT_CONF_V3 = 0.55;

let lastAcceptedNorm = "";
let repeatStreak = 0;

function normalizeTranscriptV3(text) {
  return String(text || "")
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .replace(/[""''`.,!?]/g, "")
    .trim();
}

/**
 * @param {string} text
 * @param {number} [confidence]
 */
export function isSuspiciousWhisperArtifactV3(text, confidence) {
  const norm = normalizeTranscriptV3(text);
  if (!norm) return false;
  const conf = Number(confidence);
  const inBand = !Number.isFinite(conf) || conf < VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3;
  if (!inBand) return false;
  return SUSPICIOUS_WHISPER_PHRASES_V3.some((re) => re.test(norm));
}

/**
 * Detect repeated clause inside a single transcript (Whisper loop on ambient audio).
 * @param {string} text
 * @param {number} [minChunkLen]
 */
export function hasInternalTranscriptRepetitionV3(text, minChunkLen = 14) {
  const norm = normalizeTranscriptV3(text);
  if (norm.length < minChunkLen * 2) return false;

  const parts = norm
    .split(/[.!?]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= minChunkLen);
  if (parts.length >= 2) {
    const seen = new Set();
    for (const part of parts) {
      if (seen.has(part)) return true;
      seen.add(part);
    }
  }

  const maxLen = Math.min(48, Math.floor(norm.length / 2));
  for (let len = maxLen; len >= minChunkLen; len -= 1) {
    for (let i = 0; i <= norm.length - len * 2; i += 1) {
      const chunk = norm.slice(i, i + len);
      if (norm.indexOf(chunk, i + len) !== -1) return true;
    }
  }
  return false;
}

/**
 * @param {number} [confidence]
 * @param {string} [strategy]
 */
/**
 * @param {string} text
 */
export function isConversationalTurkishUtteranceV3(text) {
  const norm = normalizeTranscriptV3(text);
  if (!norm || norm.length < 6) return false;
  return CONVERSATIONAL_UTTERANCE_PATTERNS_V3.some((re) => re.test(norm));
}

export function isWhisperDefaultConfidenceV3(confidence, strategy) {
  const conf = Number(confidence);
  if (!Number.isFinite(conf) || conf !== VOICE_WHISPER_DEFAULT_CONF_V3) return false;
  return String(strategy || "").includes("whisper");
}

/**
 * @param {string} text
 */
export function noteVoiceTranscriptRepeatV3(text) {
  const norm = normalizeTranscriptV3(text);
  if (!norm) {
    repeatStreak = 0;
    lastAcceptedNorm = "";
    return { repeated: false, streak: 0 };
  }
  if (norm === lastAcceptedNorm) {
    repeatStreak += 1;
  } else {
    lastAcceptedNorm = norm;
    repeatStreak = 1;
  }
  return { repeated: repeatStreak >= 2, streak: repeatStreak };
}

export function resetVoiceTranscriptRepeatForTestV3() {
  lastAcceptedNorm = "";
  repeatStreak = 0;
}

/**
 * @param {string} text
 * @param {{ confidence?: number, checkRepeat?: boolean, strategy?: string, recordedMs?: number }} [opts]
 */
export function sanitizeVoiceTranscriptForDispatchV3(text, opts = {}) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return { ok: false, reason: "empty", text: "" };

  const cross = normalizeSttCrossScriptForTurkishUiV0(trimmed);
  const dispatchText = cross.text || trimmed;

  const scriptGuard = evaluateSttScriptAgainstUiLocaleV0(dispatchText, {
    confidence: opts.confidence,
    strategy: opts.strategy,
    sttLanguageHint: opts.sttLanguageHint,
    vepmConfidence: opts.vepmConfidence,
    phantomLikely: opts.phantomLikely === true
  });
  if (!scriptGuard.ok) {
    return {
      ok: false,
      reason: scriptGuard.reason || "script_locale_mismatch",
      text: dispatchText,
      scriptGuard,
      shadowForward: scriptGuard.softMismatch === true || scriptGuard.shadowForward === true,
      softScriptMismatch: scriptGuard.softMismatch === true
    };
  }

  if (dispatchText.length < VOICE_TRANSCRIPT_MIN_CHARS_V3) {
    return { ok: false, reason: "too_short", text: dispatchText };
  }

  const conf = Number(opts.confidence);
  const strategy = String(opts.strategy || "");

  if (Number.isFinite(conf) && conf < VOICE_TRANSCRIPT_MIN_CONFIDENCE_V3) {
    return { ok: false, reason: "low_confidence", text: dispatchText, confidence: conf };
  }

  if (isSuspiciousWhisperArtifactV3(dispatchText, conf)) {
    return { ok: false, reason: "whisper_artifact", text: dispatchText, confidence: conf };
  }

  if (hasInternalTranscriptRepetitionV3(dispatchText)) {
    return { ok: false, reason: "internal_repetition", text: dispatchText, confidence: conf };
  }

  if (isWhisperDefaultConfidenceV3(conf, strategy)) {
    const recordedMs = Number(opts.recordedMs);
    const longCapture =
      Number.isFinite(recordedMs) && recordedMs >= VOICE_TRANSCRIPT_MIN_RECORD_MS_V3;
    const shortTextFragile =
      dispatchText.length <= 48 || hasInternalTranscriptRepetitionV3(dispatchText, 10);
    const conversational = isConversationalTurkishUtteranceV3(dispatchText);

    if (longCapture && conversational && !hasInternalTranscriptRepetitionV3(dispatchText, 10)) {
      return {
        ok: false,
        reason: "whisper_default_conf",
        text: dispatchText,
        confidence: conf,
        strategy,
        shadowForward: true
      };
    }

    if (longCapture && !shortTextFragile) {
      return {
        ok: false,
        reason: "whisper_default_conf",
        text: dispatchText,
        confidence: conf,
        strategy,
        shadowForward: true
      };
    }

    if (shortTextFragile) {
      return {
        ok: false,
        reason: "whisper_default_conf",
        text: dispatchText,
        confidence: conf,
        strategy,
        shadowForward: conversational
      };
    }
  }

  if (opts.checkRepeat !== false) {
    const rep = noteVoiceTranscriptRepeatV3(dispatchText);
    if (rep.repeated) {
      return {
        ok: false,
        reason: "repeated_hallucination",
        text: dispatchText,
        confidence: conf,
        streak: rep.streak
      };
    }
  }

  return {
    ok: true,
    text: dispatchText,
    confidence: Number.isFinite(conf) ? conf : undefined,
    crossScriptRemap: cross.remapped === true
  };
}

/** @deprecated */
export function isLikelyJunkVoiceTranscriptV3(text) {
  return isSuspiciousWhisperArtifactV3(text, 0.5);
}
