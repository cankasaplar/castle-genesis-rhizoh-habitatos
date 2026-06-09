/**
 * TTS sanitize — strip list markers / chunk artifacts before speech synthesis.
 * Read-side only; does not alter chat UI text.
 */

export const RHIZOH_SPEECH_TTS_SANITIZE_SCHEMA_V0 = "castle.rhizoh.speech_tts_sanitize.v0";

/**
 * @param {string} text
 * @returns {string}
 */
export function sanitizeSpeechTextForTtsV0(text) {
  let t = String(text || "");
  if (!t.trim()) return "";

  t = t.replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1");
  t = t.replace(/_{1,2}([^_]+)_{1,2}/g, "$1");
  t = t.replace(/^\s*[-*•]\s+/gm, "");
  t = t.replace(/(?:^|\s)[nN]?[0-9]+[.)]\s*/g, " ");
  t = t.replace(/\b[nN][0-9]+\b/g, "");
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
