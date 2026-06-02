/**
 * LLM → UI text contract — never render raw objects; single display string SSOT.
 */

export const RHIZOH_LLM_UI_CONTRACT_V0 = "castle.rhizoh.llm_ui_contract.v0";

const REPLY_FIELD_KEYS_V0 = Object.freeze([
  "text",
  "reply",
  "message",
  "content",
  "output",
  "answer",
  "response"
]);

/**
 * @param {unknown} value
 * @param {{ fallback?: string, allowJsonStringify?: boolean, maxLen?: number }} [opts]
 * @returns {string}
 */
export function coerceRhizohUiReplyTextV0(value, opts = {}) {
  const fallback = String(opts.fallback ?? "");
  const maxLen = Number.isFinite(Number(opts.maxLen)) ? Number(opts.maxLen) : 8000;

  if (value == null) return fallback;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).slice(0, maxLen);
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t || t === "[object Object]") return fallback;
    return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
  }
  if (typeof value === "object") {
    const o = /** @type {Record<string, unknown>} */ (value);
    for (const key of REPLY_FIELD_KEYS_V0) {
      const nested = coerceRhizohUiReplyTextV0(o[key], { maxLen });
      if (nested) return nested;
    }
    if (opts.allowJsonStringify === true) {
      try {
        const j = JSON.stringify(o);
        if (j && j !== "{}" && j !== "[]") {
          return j.length > maxLen ? `${j.slice(0, maxLen)}…` : j;
        }
      } catch {
        /* noop */
      }
    }
    return fallback;
  }
  return fallback;
}

/**
 * @param {ReturnType<import("../presence/normalizeRhizohOutput.js").normalizeRhizohOutput>} norm
 * @param {string} [rawReply]
 * @param {{ emptyHint?: string }} [opts]
 */
export function materializeRhizohHudReplyFromNormalizedV0(norm, rawReply = "", opts = {}) {
  const emptyHint =
    String(opts.emptyHint ?? "") ||
    "Rhizoh yanıt üretti; metin görüntülenemedi. Tekrar dene veya kısa bir cümle yaz.";

  if (norm?.type === "QPP_STATE") {
    const stripped = coerceRhizohUiReplyTextV0(rawReply);
    const pr = norm.payload?.presence;
    const quietLabel =
      typeof pr?.state === "string" && pr.state.trim() ? pr.state.trim() : "listening";
    return Object.freeze({
      text: stripped || `Rhizoh şu an sessiz eşlik modunda (${quietLabel}).`,
      skipSpeech: true
    });
  }

  const fromNorm = coerceRhizohUiReplyTextV0(norm?.payload);
  const fromRaw = coerceRhizohUiReplyTextV0(rawReply);
  const text = fromNorm || fromRaw || emptyHint;

  return Object.freeze({
    text,
    skipSpeech: false
  });
}
