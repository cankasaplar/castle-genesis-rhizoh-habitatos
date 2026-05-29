/**
 * Web Speech API — extract latest final transcript from onresult event.
 */

/**
 * @param {SpeechRecognitionEvent} ev
 * @param {{ finalOnly?: boolean }} [opts]
 */
export function extractSpeechRecognitionTranscriptV0(ev, opts = {}) {
  const finalOnly = opts.finalOnly !== false;
  const results = ev?.results;
  if (!results?.length) return { text: "", isFinal: false };

  for (let i = results.length - 1; i >= 0; i -= 1) {
    const res = results[i];
    const isFinal = res?.isFinal !== false;
    const text = String(res?.[0]?.transcript || "").trim();
    if (!text) continue;
    if (finalOnly && !isFinal) continue;
    return { text, isFinal };
  }

  const last = results[results.length - 1];
  const fallback = String(last?.[0]?.transcript || "").trim();
  return { text: fallback, isFinal: last?.isFinal !== false };
}
