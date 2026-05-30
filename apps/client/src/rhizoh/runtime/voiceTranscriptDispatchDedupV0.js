/**
 * Voice dispatch dedup — transcript accept ≠ LLM dispatch; blocks repeat sends in a window.
 */

export const VOICE_DISPATCH_DEDUP_WINDOW_MS = 20_000;

let lastDispatchNorm = "";
let lastDispatchAtMs = 0;

function normalizeDispatchTextV0(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""''`.,!?]/g, "")
    .trim();
}

/**
 * @param {string} text
 * @param {number} [nowMs]
 */
export function probeVoiceTranscriptDispatchV0(text, nowMs = Date.now()) {
  const norm = normalizeDispatchTextV0(text);
  if (!norm) return { ok: false, reason: "empty", text: "" };
  const ageMs = Math.max(0, nowMs - lastDispatchAtMs);
  if (norm === lastDispatchNorm && ageMs < VOICE_DISPATCH_DEDUP_WINDOW_MS) {
    return {
      ok: false,
      reason: "duplicate_dispatch",
      text: norm,
      ageMs,
      windowMs: VOICE_DISPATCH_DEDUP_WINDOW_MS
    };
  }
  return { ok: true, text: norm };
}

/** @param {string} text @param {number} [nowMs] */
export function noteVoiceTranscriptDispatchedV0(text, nowMs = Date.now()) {
  lastDispatchNorm = normalizeDispatchTextV0(text);
  lastDispatchAtMs = nowMs;
}

export function resetVoiceTranscriptDispatchDedupForTestV0() {
  lastDispatchNorm = "";
  lastDispatchAtMs = 0;
}
