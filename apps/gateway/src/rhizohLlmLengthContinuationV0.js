/**
 * Gateway LLM length continuation — finish_reason:length → auto-continue merge.
 */

export const RHIZOH_LLM_LENGTH_CONTINUATION_SCHEMA_V0 = "castle.rhizoh.llm_length_continuation.v0";

const LENGTH_ALIASES_V0 = new Set([
  "length",
  "max_tokens",
  "maxtokens",
  "max_output_tokens",
  "maxoutputtokens",
  "length_limit",
  "model_length"
]);

/**
 * @param {unknown} reason
 * @returns {"length"|"stop"|"other"}
 */
export function normalizeProviderFinishReasonV0(reason) {
  const r = String(reason || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (!r) return "other";
  if (LENGTH_ALIASES_V0.has(r)) return "length";
  if (r === "stop" || r === "end_turn" || r === "complete" || r === "stop_sequence") return "stop";
  return "other";
}

/**
 * @param {unknown} reason
 */
export function isLlmCompletionTruncatedByLengthV0(reason) {
  return normalizeProviderFinishReasonV0(reason) === "length";
}

/**
 * @param {number} [n]
 */
export function resolveMaxLlmLengthContinuationsV0(n) {
  const env = Number(process.env.CASTLE_LLM_MAX_LENGTH_CONTINUATIONS);
  const cap = Number.isFinite(env) && env >= 0 ? Math.floor(env) : 2;
  const requested = Number.isFinite(Number(n)) ? Math.floor(Number(n)) : cap;
  return Math.max(0, Math.min(requested, 4));
}

/**
 * @param {string} partialReply
 * @param {string} [userMessage]
 */
export function buildLlmContinuationUserMessageV0(partialReply, userMessage = "") {
  const partial = String(partialReply || "").trim();
  const user = String(userMessage || "").trim().slice(0, 1200);
  return [
    "The previous assistant reply was cut off because of the output token limit.",
    "Continue EXACTLY where the text stopped.",
    "Do NOT repeat earlier sentences.",
    'Return JSON only: {"reply":"<continuation only>","directive":"NONE","intents":[]}',
    "",
    user ? `Original user message:\n${user}\n` : "",
    `Partial reply so far:\n${partial}`
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * @param {string} base
 * @param {string} continuation
 */
export function mergeLlmContinuationRepliesV0(base, continuation) {
  const a = String(base || "").trim();
  const b = String(continuation || "").trim();
  if (!a) return b;
  if (!b) return a;
  if (b.startsWith(a)) return b;
  if (a.endsWith(b) || a.includes(b)) return a;

  const overlap = findSuffixPrefixOverlapV0(a, b, 120);
  if (overlap > 12) {
    return `${a}${b.slice(overlap)}`.trim();
  }

  const joiner = /[.!?…]$/.test(a) ? " " : /[,;:\-–—]$/.test(a) ? " " : ". ";
  return `${a}${joiner}${b}`.trim();
}

/**
 * @param {string} a
 * @param {string} b
 * @param {number} maxScan
 */
function findSuffixPrefixOverlapV0(a, b, maxScan = 80) {
  const cap = Math.max(0, Math.min(maxScan, a.length, b.length));
  for (let n = cap; n > 0; n -= 1) {
    if (a.slice(-n) === b.slice(0, n)) return n;
  }
  return 0;
}
