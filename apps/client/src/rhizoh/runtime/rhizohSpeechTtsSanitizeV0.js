/**
 * TTS sanitize — strip list markers / chunk artifacts before speech synthesis.
 * Shares artifact strip with chat display path.
 */

import { stripRhizohReplyArtifactsV0 } from "./rhizohReplyArtifactCleanupV0.js";

export const RHIZOH_SPEECH_TTS_SANITIZE_SCHEMA_V0 = "castle.rhizoh.speech_tts_sanitize.v0";

/**
 * @param {string} text
 * @returns {string}
 */
export function sanitizeSpeechTextForTtsV0(text) {
  let t = stripRhizohReplyArtifactsV0(text);
  if (!t) return "";
  t = t.replace(/[\r\n]+/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/**
 * Split an overlong TTS chunk at word boundaries (avoid mid-sentence hard cut).
 * @param {string} chunk
 * @param {number} [maxLen]
 * @returns {string[]}
 */
export function splitLongTtsChunkV0(chunk, maxLen = 280) {
  const t = String(chunk || "").trim();
  const cap = Math.max(80, Math.floor(Number(maxLen) || 280));
  if (!t || t.length <= cap) return t ? [t] : [];

  const parts = [];
  let rest = t;
  while (rest.length > cap) {
    let cut = rest.lastIndexOf(" ", cap);
    if (cut < Math.floor(cap * 0.45)) cut = cap;
    const piece = rest.slice(0, cut).trim();
    if (piece) parts.push(piece);
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts.length ? parts : [t.slice(0, cap)];
}
