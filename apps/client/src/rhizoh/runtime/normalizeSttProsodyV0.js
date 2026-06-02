/**
 * Prosody / rhythm bias strip — reduces TR structure leak into LLM (hint-only path).
 */

const CAPITALIZED_GREETING_RE =
  /^(?:Günaydın|İyi\s+(?:günler|akşamlar|geceler)|Good\s+(?:morning|afternoon|evening)|Merhaba|Selam|Hello|Hi)\b[,!.\s]*/iu;
const VOCATIVE_COMMA_RE = /,\s*([A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,})\s*([.!?]|$)/gu;

/**
 * @param {string} text
 * @param {{ stripCapitalizedGreetingPatterns?: boolean, flattenNameVocatives?: boolean }} [opts]
 */
export function normalizeSttProsodyV0(text, opts = {}) {
  const stripGreeting = opts.stripCapitalizedGreetingPatterns !== false;
  const flattenVocative = opts.flattenNameVocatives !== false;
  let t = String(text || "").trim();
  const raw = t;

  if (stripGreeting && t.length > 10) {
    const stripped = t.replace(CAPITALIZED_GREETING_RE, "").trim();
    if (stripped.length >= 6) t = stripped;
  }

  if (flattenVocative) {
    t = t.replace(VOCATIVE_COMMA_RE, ". $1$2");
    t = t.replace(/\s{2,}/g, " ").trim();
  }

  return Object.freeze({
    text: t || raw,
    raw,
    prosodyNeutralized: t !== raw
  });
}
