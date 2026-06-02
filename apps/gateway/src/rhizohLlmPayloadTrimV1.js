/**
 * Gateway safety net — trim oversized /rhizoh/llm bodies before provider call.
 */

export const RHIZOH_LLM_GATEWAY_BODY_LIMIT_V1 = 128 * 1024;
export const RHIZOH_LLM_GATEWAY_TARGET_V1 = 80 * 1024;

/**
 * @param {unknown} value
 */
function measureBytes(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

/**
 * @param {string} s
 * @param {number} max
 */
function trimStr(s, max) {
  const t = String(s ?? "");
  return t.length <= max ? t : `${t.slice(0, Math.max(0, max - 1))}…`;
}

/**
 * @param {Record<string, unknown>} payload
 */
export function trimRhizohLlmGatewayPayloadV1(payload) {
  const bytesBefore = measureBytes(payload);
  if (bytesBefore <= RHIZOH_LLM_GATEWAY_TARGET_V1) {
    return Object.freeze({ payload, meta: { trimmed: false, bytesBefore, bytesAfter: bytesBefore } });
  }

  const next = { ...(payload || {}) };
  const ctx = next.context && typeof next.context === "object" ? { ...next.context } : {};
  delete ctx.languagePropagation;
  if (ctx.continuity && typeof ctx.continuity === "object") {
    const c = ctx.continuity;
    ctx.continuity = {
      sessionId: c.sessionId,
      relationship: c.relationship,
      rhizohMemoryEpisodes: Array.isArray(c.rhizohMemoryEpisodes)
        ? c.rhizohMemoryEpisodes.slice(-2)
        : [],
      runtime:
        c.runtime && typeof c.runtime === "object"
          ? { gatewayPhase: c.runtime.gatewayPhase ?? c.runtime.rhizohGatewayPhase }
          : {}
    };
  }
  delete ctx.life_continuity;
  delete ctx.rhizohMultilingual;
  delete ctx.rhizohRouter;
  if (ctx.rhizohMemoryContract) ctx.rhizohMemoryContract = trimStr(ctx.rhizohMemoryContract, 1200);
  next.context = ctx;
  if (next.languagePropagation && typeof next.languagePropagation === "object") {
    const lp = next.languagePropagation;
    next.languagePropagation = {
      schema: lp.schema,
      uiLang: lp.uiLang,
      speechLang: lp.speechLang,
      llmBcp47: lp.llmBcp47,
      traceId: lp.traceId
    };
  }

  const bytesAfter = measureBytes(next);
  return Object.freeze({
    payload: next,
    meta: Object.freeze({
      trimmed: true,
      bytesBefore,
      bytesAfter,
      withinLimit: bytesAfter <= RHIZOH_LLM_GATEWAY_BODY_LIMIT_V1
    })
  });
}
