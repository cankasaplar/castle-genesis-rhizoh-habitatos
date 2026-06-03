/**
 * STT contamination guard — platform outro / UI chrome / loop artifacts.
 * internal_repetition alone is NOT sufficient to drop (stutter-safe).
 */

import { hasInternalTranscriptRepetitionV3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";

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
  /see\s+you\s+in\s+the\s+next/i
];

/** TR UI footer / creator chrome — not conversational user input. */
const UI_CHROME_ECHO_PATTERNS_V0 = [
  /kanal(a|ıma|ima)\s+(abone|subscribe)/i,
  /abone\s+ol(duğunuz|dugunuz|un)/i,
  /izledi[ğg]iniz\s+i[çc]in\s+te[sş]ekk/i,
  /be[gğ]en(me|ip)\s+ve\s+payla[sş]/i,
  /payla[sş]may[iı]\s+unut/i,
  /bu\s+videoyu\s+be[gğ]en/i,
  /mikrofon\s+ses\s+alm/i,
  /en\s+az\s+bir\s+saniye\s+konuş/i
];

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
 * @param {{ strategy?: string, confidence?: number, band?: string }} [opts]
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
