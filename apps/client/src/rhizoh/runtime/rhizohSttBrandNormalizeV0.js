/**
 * STT phonetic repair for product name "Rhizoh" (not in Whisper/Google lexicon).
 * Applied before command registry matching — does not change LLM semantic payload unless caller uses repaired text.
 */

export const RHIZOH_STT_BRAND_NORMALIZE_SCHEMA_V0 = "castle.rhizoh.stt_brand_normalize.v0";

/** Whole-phrase / token patterns → canonical wake word (lowercase). */
const BRAND_PHONETIC_REPLACEMENTS_V0 = [
  [/\brise\s+or\b/gi, "rhizoh"],
  [/\brise\s+oh\b/gi, "rhizoh"],
  [/\brise\s+up\b/gi, "rhizoh"],
  [/\bryzo\b/gi, "rhizoh"],
  [/\brizo\b/gi, "rhizoh"],
  [/\brezo\b/gi, "rhizoh"],
  [/\bresol\b/gi, "rhizoh"],
  [/\berizo\b/gi, "rhizoh"],
  [/\beriso\b/gi, "rhizoh"],
  [/\brhizo\b/gi, "rhizoh"],
  [/\briso\b/gi, "rhizoh"],
  [/\brizoh\b/gi, "rhizoh"],
  [/\blüzum\b/gi, "rhizoh"],
  [/\bluzum\b/gi, "rhizoh"],
  [/\brizum\b/gi, "rhizoh"]
];

/**
 * @param {string} text
 * @returns {{ text: string, repaired: boolean, hits: string[] }}
 */
export function normalizeRhizohSttBrandPhoneticsV0(text) {
  let out = String(text || "");
  /** @type {string[]} */
  const hits = [];
  if (!out.trim()) {
    return Object.freeze({ text: out, repaired: false, hits });
  }
  for (const [re, replacement] of BRAND_PHONETIC_REPLACEMENTS_V0) {
    if (!re.test(out)) {
      re.lastIndex = 0;
      continue;
    }
    re.lastIndex = 0;
    out = out.replace(re, replacement);
    hits.push(String(re));
  }
  return Object.freeze({
    schema: RHIZOH_STT_BRAND_NORMALIZE_SCHEMA_V0,
    text: out,
    repaired: hits.length > 0,
    hits
  });
}
