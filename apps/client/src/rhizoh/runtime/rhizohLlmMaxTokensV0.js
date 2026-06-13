/**
 * LLM max_tokens — align generation mode with voice turn length (rhythm / completeness).
 */

export const RHIZOH_GENERATION_MODE_MAX_TOKENS_V0 = Object.freeze({
  FAST_DIALOGUE: 120,
  STANDARD: 320,
  REFLECTIVE: 480,
  NARRATIVE: 640,
  DEEP_REASONING: 900
});

function normalizeRhizohGenerationModeIdV0(mode) {
  const key = String(mode || "STANDARD").trim().toUpperCase();
  if (key in RHIZOH_GENERATION_MODE_MAX_TOKENS_V0) return key;
  return "STANDARD";
}

/**
 * Voice FAST_DIALOGUE alone truncates long-story replies (~120 tokens).
 * Scale ceiling with user message length so LLM can finish a thought.
 * @param {{
 *   generationMode?: string,
 *   userMessageChars?: number,
 *   voiceTurn?: boolean,
 *   depthMaxTokensCeiling?: number
 * }} [opts]
 */
export function resolveRhizohLlmMaxTokensV0(opts = {}) {
  const modeKey = normalizeRhizohGenerationModeIdV0(opts.generationMode || "STANDARD");
  const modeMax =
    RHIZOH_GENERATION_MODE_MAX_TOKENS_V0[modeKey] ?? RHIZOH_GENERATION_MODE_MAX_TOKENS_V0.STANDARD;
  const depthCeil = Math.max(0, Number(opts.depthMaxTokensCeiling) || 0);
  let cap = modeMax;
  if (depthCeil > 0) cap = Math.max(cap, Math.min(depthCeil, 2000));

  const chars = Math.max(0, Number(opts.userMessageChars) || 0);
  if (opts.voiceTurn !== true) {
    if (chars >= 720) return Math.max(cap, RHIZOH_GENERATION_MODE_MAX_TOKENS_V0.DEEP_REASONING);
    if (chars >= 420) return Math.max(cap, RHIZOH_GENERATION_MODE_MAX_TOKENS_V0.NARRATIVE);
    if (chars >= 180) return Math.max(cap, RHIZOH_GENERATION_MODE_MAX_TOKENS_V0.REFLECTIVE);
    return cap;
  }

  if (chars >= 520) {
    return Math.max(cap, RHIZOH_GENERATION_MODE_MAX_TOKENS_V0.NARRATIVE);
  }
  if (chars >= 220) {
    return Math.max(cap, RHIZOH_GENERATION_MODE_MAX_TOKENS_V0.REFLECTIVE);
  }
  if (chars >= 90) {
    return Math.max(cap, RHIZOH_GENERATION_MODE_MAX_TOKENS_V0.STANDARD);
  }
  return cap;
}
