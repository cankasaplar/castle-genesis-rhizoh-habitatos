/**
 * Display-path reply sanitize — chat HUD + TTS share artifact strip;
 * display adds orthography repair and truncation guards.
 */

import { stripRhizohReplyArtifactsV0 } from "./rhizohReplyArtifactCleanupV0.js";

export const RHIZOH_REPLY_DISPLAY_SANITIZE_SCHEMA_V0 = "castle.rhizoh.reply_display_sanitize.v0";

const ORTHOGRAPHY_FIXES_V0 = Object.freeze([
  [/\bmerhaba\b/gi, "merhaba"],
  [/\btesekkur\b/gi, "teşekkür"],
  [/\btesekkurler\b/gi, "teşekkürler"],
  [/\bsimdilik\b/gi, "şimdilik"],
  [/\bbisey\b/gi, "bir şey"],
  [/\bbirsey\b/gi, "bir şey"],
  [/\bsuan\b/gi, "şu an"],
  [/\bguzel\b/gi, "güzel"],
  [/\bolur\b/gi, "olur"],
  [/\s+,\s*/g, ", "],
  [/\s+\.\s*/g, ". "],
  [/\s+\?\s*/g, "? "],
  [/\s+!\s*/g, "! "]
]);

const TERMINAL_PUNCT_V0 = /[.!?…»"')\]}]$/u;
const TRAILING_FRAGMENT_V0 =
  /\b(ve|ama|fakat|çünkü|için|ile|ki|de|da|the|and|but|because|for|with|that|which|veya|or|so|then|when|while|although)\s*$/iu;

/**
 * @param {string} text
 * @returns {string}
 */
export function fixRhizohReplyOrthographyV0(text) {
  let t = String(text || "");
  if (!t.trim()) return "";
  for (const [pattern, replacement] of ORTHOGRAPHY_FIXES_V0) {
    t = t.replace(pattern, replacement);
  }
  return t.replace(/\s+/g, " ").trim();
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isRhizohReplyLikelyTruncatedV0(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  if (t.endsWith("…") || t.endsWith("...")) return true;
  if (/\[(?:constitutional|belirsiz):/i.test(t.slice(-80))) return false;
  if (TERMINAL_PUNCT_V0.test(t)) return false;
  if (TRAILING_FRAGMENT_V0.test(t)) return true;
  const last = t.slice(-1);
  if (/[,;:\-–—(]/.test(last)) return true;
  if (t.length > 40 && !TERMINAL_PUNCT_V0.test(t)) return true;
  return false;
}

/**
 * Close reply at last complete sentence when generation stopped mid-thought.
 * @param {string} text
 * @returns {{ text: string, repaired: boolean }}
 */
export function repairRhizohTruncatedReplyV0(text) {
  const raw = String(text || "").trim();
  if (!raw || !isRhizohReplyLikelyTruncatedV0(raw)) {
    return Object.freeze({ text: raw, repaired: false });
  }

  const sentenceEnd = Math.max(
    raw.lastIndexOf(". "),
    raw.lastIndexOf("! "),
    raw.lastIndexOf("? "),
    raw.lastIndexOf("… ")
  );
  if (sentenceEnd > Math.floor(raw.length * 0.35)) {
    const closed = raw.slice(0, sentenceEnd + 1).trim();
    if (closed.length >= 24) {
      return Object.freeze({ text: closed, repaired: true });
    }
  }

  const wordCut = raw.lastIndexOf(" ");
  if (wordCut > Math.floor(raw.length * 0.5)) {
    return Object.freeze({ text: `${raw.slice(0, wordCut).trim()}.`, repaired: true });
  }

  return Object.freeze({ text: `${raw}.`, repaired: true });
}

/**
 * Full display sanitize pipeline.
 * @param {string} text
 * @param {{ repairTruncation?: boolean }} [opts]
 */
export function sanitizeRhizohReplyForDisplayV0(text, opts = {}) {
  let t = stripRhizohReplyArtifactsV0(text);
  t = fixRhizohReplyOrthographyV0(t);
  if (opts.repairTruncation !== false) {
    const repaired = repairRhizohTruncatedReplyV0(t);
    t = repaired.text;
  }
  return t;
}
