/**
 * Merge STT discourse fragments — avoid dialog framing leak to LLM.
 */

/**
 * @param {string} text
 */
export function mergeSttUtteranceFragmentsV0(text) {
  let t = String(text || "").trim();
  if (!t) return t;

  const parts = t
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) return t;

  const last = parts[parts.length - 1];
  const isShortFollowUp =
    parts.length === 2 &&
    last.length <= 48 &&
    (/^(nasılsın|nasilsin|how are you|what's up|ne var|neden|why|who|what)\b/i.test(last) ||
      last.endsWith("?"));

  if (isShortFollowUp) {
    const head = parts[0].replace(/[.!?]+\s*$/u, "").trim();
    return `${head} — ${last}`.replace(/\s{2,}/g, " ");
  }

  if (parts.length === 2 && parts[1].length < 24) {
    return `${parts[0].replace(/[.!?]+\s*$/u, "")}, ${parts[1]}`.replace(/\s{2,}/g, " ");
  }

  return t;
}
