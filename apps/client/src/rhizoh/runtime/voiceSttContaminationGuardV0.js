/**
 * STT contamination guard — platform outro / UI chrome / loop artifacts.
 * These are never user-directed speech; shadow-only observation.
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
 * @param {string} text
 * @param {{ strategy?: string }} [opts]
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

  if (hasInternalTranscriptRepetitionV3(raw) && norm.length >= 40) {
    return Object.freeze({
      contaminated: true,
      kind: "stt_loop",
      reason: "stt_loop_artifact",
      shadowOnly: true
    });
  }

  const strategy = String(opts.strategy || "");
  if (
    strategy === "split_merged" &&
    hasInternalTranscriptRepetitionV3(raw, 10) &&
    norm.split(/\s+/).length >= 8
  ) {
    return Object.freeze({
      contaminated: true,
      kind: "stt_loop",
      reason: "internal_repetition",
      shadowOnly: true
    });
  }

  return Object.freeze({ contaminated: false, kind: null, reason: null, shadowOnly: false });
}
