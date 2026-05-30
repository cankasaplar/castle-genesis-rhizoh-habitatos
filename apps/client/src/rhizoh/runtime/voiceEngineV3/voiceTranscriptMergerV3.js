/**
 * Voice Engine v3 — transcript merger (client-side mirror of gateway resolve).
 */

export const VOICE_TRANSCRIPT_MERGER_V3_SCHEMA = "castle.rhizoh.voice.transcript_merger.v3";

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {{ text?: string, confidence?: number } | null | undefined} google
 * @param {{ text?: string, confidence?: number } | null | undefined} whisper
 */
export function resolveVoiceTranscriptV3(google, whisper) {
  const gConf = clamp01(Number(google?.confidence ?? 0));
  const wConf = clamp01(Number(whisper?.confidence ?? 0));
  const gText = String(google?.text || "").trim();
  const wText = String(whisper?.text || "").trim();

  if (!gText && !wText) {
    return Object.freeze({ text: "", confidence: 0, source: "none", strategy: "empty" });
  }
  if (!gText && wText) {
    return Object.freeze({ text: wText, confidence: wConf, source: "whisper", strategy: "whisper_only" });
  }
  if (gText && !wText) {
    return Object.freeze({ text: gText, confidence: gConf, source: "google", strategy: "google_only" });
  }
  if (gConf > 0.85) {
    return Object.freeze({ text: gText, confidence: gConf, source: "google", strategy: "google_high_confidence" });
  }
  if (wConf > gConf) {
    return Object.freeze({ text: wText, confidence: wConf, source: "whisper", strategy: "whisper_higher_confidence" });
  }
  return Object.freeze({
    text: `${gText} (verified)`,
    confidence: Math.max(gConf, wConf),
    source: "hybrid",
    strategy: "google_with_verified_suffix"
  });
}
