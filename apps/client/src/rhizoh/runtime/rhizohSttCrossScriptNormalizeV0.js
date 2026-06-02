/**
 * Cross-script STT normalize — Arabic-script Whisper output for Turkish speech → Latin TR.
 * Example: مرحبا → merhaba (same word, wrong script).
 */

export const RHIZOH_STT_CROSS_SCRIPT_NORMALIZE_SCHEMA_V0 =
  "castle.rhizoh.stt_cross_script_normalize.v0";

/** Arabic presentation → Turkish Latin tokens (order: longer phrases first). */
const ARABIC_TO_TR_LATIN_V0 = Object.freeze([
  [/السلام\s*عليكم/gu, "selam"],
  [/مرحبا/gu, "merhaba"],
  [/مرحب/gu, "merhaba"],
  [/سلام/gu, "selam"],
  [/شكرا/gu, "tesekkurler"],
  [/شكراً/gu, "tesekkurler"],
  [/كيف\s*حالك/gu, "nasilsin"],
  [/كيف\s*حال/gu, "nasilsin"]
]);

/**
 * @param {string} text
 * @returns {{ schema: string, text: string, remapped: boolean, hits: readonly string[] }}
 */
export function normalizeSttCrossScriptForTurkishUiV0(text) {
  let out = String(text || "").trim();
  /** @type {string[]} */
  const hits = [];
  if (!out) {
    return Object.freeze({
      schema: RHIZOH_STT_CROSS_SCRIPT_NORMALIZE_SCHEMA_V0,
      text: out,
      remapped: false,
      hits: Object.freeze([])
    });
  }
  for (const [re, replacement] of ARABIC_TO_TR_LATIN_V0) {
    if (!re.test(out)) {
      re.lastIndex = 0;
      continue;
    }
    re.lastIndex = 0;
    out = out.replace(re, replacement);
    hits.push(re.source);
  }
  out = out.replace(/\s+/g, " ").trim();
  const words = out.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => w === words[0]) && words[0].length <= 12) {
    out = words[0];
  }
  return Object.freeze({
    schema: RHIZOH_STT_CROSS_SCRIPT_NORMALIZE_SCHEMA_V0,
    text: out,
    remapped: hits.length > 0,
    hits: Object.freeze([...hits])
  });
}
