/**
 * Web Speech API — extract transcript from onresult (resultIndex-aware).
 */

/**
 * @param {SpeechRecognitionEvent} ev
 */
export function extractSpeechRecognitionTranscriptV0(ev) {
  const results = ev?.results;
  if (!results?.length) return { text: "", isFinal: false };

  const start = typeof ev.resultIndex === "number" ? ev.resultIndex : 0;
  let text = "";
  let isFinal = false;

  for (let i = start; i < results.length; i += 1) {
    const res = results[i];
    const chunk = String(res?.[0]?.transcript || "").trim();
    if (!chunk) continue;
    text = chunk;
    if (res.isFinal === true) isFinal = true;
  }

  if (!text) {
    const last = results[results.length - 1];
    text = String(last?.[0]?.transcript || "").trim();
    isFinal = last?.isFinal === true;
  }

  return { text, isFinal };
}
