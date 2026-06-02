/**
 * STT → LLM bridge — strip locale artifacts; keep semantic transcript only.
 * Inferred locale is hint-only (logged), never overrides OLP output.
 */

import { detectRhizohMultilingualLocaleV0 } from "./rhizohMultilingualBridgeV0.js";
import { recordSttInferredLanguageHintV0 } from "./rhizohConversationLanguageV0.js";
import { mergeSttUtteranceFragmentsV0 } from "./mergeSttUtteranceFragmentsV0.js";
import { normalizeSttProsodyV0 } from "./normalizeSttProsodyV0.js";

const LOCALE_TAG_RE = /\s*[\[(]?\s*(?:lang|locale|dil)\s*[:=]\s*[a-z]{2}(?:-[a-z]{2})?\s*[\])]?\s*$/i;
const GREETING_NORMALIZE_RE = /^(merhaba|selam|hello|hi)[,!\s]+/i;

/**
 * @param {string} text
 * @param {{ stripLanguageHints?: boolean, neutralizePunctuationBias?: boolean }} [opts]
 */
export function normalizeSttTranscriptForOlpV0(text, opts = {}) {
  const stripHints = opts.stripLanguageHints !== false;
  const neutralizePunct = opts.neutralizePunctuationBias !== false;
  let t = String(text || "").trim();
  const raw = t;

  if (stripHints) {
    t = t.replace(LOCALE_TAG_RE, "").trim();
  }

  if (neutralizePunct && t.length > 12) {
    const withoutGreeting = t.replace(GREETING_NORMALIZE_RE, "").trim();
    if (withoutGreeting.length >= 8) {
      t = withoutGreeting;
    }
    t = t.replace(/\s{2,}/g, " ");
    t = t.replace(/[!?]{2,}/g, "?");
  }

  const prosody = normalizeSttProsodyV0(t || raw);
  t = prosody.text;
  t = mergeSttUtteranceFragmentsV0(t);

  const detected = detectRhizohMultilingualLocaleV0(raw, "");
  const hintObs = recordSttInferredLanguageHintV0(detected.code);

  return Object.freeze({
    text: t || raw,
    raw,
    inferredInputLocale: detected.code,
    hintObservation: hintObs,
    neutralized: t !== raw,
    prosodyNeutralized: prosody.prosodyNeutralized
  });
}
