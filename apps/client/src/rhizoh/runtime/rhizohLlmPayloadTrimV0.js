/**
 * LLM request body trim — control plane (lang) vs data plane (message + slim context).
 * Gateway readHttpJson default 128 KiB; stay under RHIZOH_LLM_MAX_BODY_BYTES_V0.
 */

export const RHIZOH_LLM_PAYLOAD_TRIM_SCHEMA_V0 = "castle.rhizoh.llm_payload_trim.v0";
/** Safe under gateway 128 KiB readHttpJson default. */
export const RHIZOH_LLM_MAX_BODY_BYTES_V0 = 96 * 1024;
export const RHIZOH_LLM_TARGET_BODY_BYTES_V0 = 72 * 1024;

/**
 * @param {unknown} value
 */
export function measureRhizohJsonUtf8BytesV0(value) {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return 0;
  }
}

/**
 * @param {string} s
 * @param {number} max
 */
function trimStrV0(s, max) {
  const t = String(s ?? "");
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

/**
 * @param {unknown} value
 * @param {number} maxDepth
 * @param {number} [depth]
 */
function pruneDeepV0(value, maxDepth, depth = 0) {
  if (value == null || depth >= maxDepth) return value;
  if (typeof value === "string") return trimStrV0(value, 2000);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.slice(-8).map((item) => pruneDeepV0(item, maxDepth, depth + 1));
  }
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(value)) {
    if (n >= 24) break;
    out[k] = pruneDeepV0(v, maxDepth, depth + 1);
    n += 1;
  }
  return out;
}

/**
 * @param {Record<string, unknown>} ep
 */
function trimMemoryEpisodeV0(ep) {
  if (!ep || typeof ep !== "object") return ep;
  return {
    id: ep.id,
    kind: ep.kind,
    summary: trimStrV0(ep.summary ?? ep.text ?? ep.content, 280),
    atMs: ep.atMs ?? ep.ts
  };
}

/**
 * @param {Record<string, unknown>} cont
 * @param {{ voiceTurn?: boolean }} [opts]
 */
export function trimRhizohContinuityForLlmV0(cont, opts = {}) {
  const c = cont && typeof cont === "object" ? cont : {};
  const rel = c.relationship && typeof c.relationship === "object" ? c.relationship : {};
  const runtime = c.runtime && typeof c.runtime === "object" ? c.runtime : {};
  const episodeCap = opts.voiceTurn === true ? 2 : 4;
  const trimmed = {
    sessionId: String(c.sessionId || c.session_id || "").slice(0, 64),
    identity: pruneDeepV0(c.identity, 3),
    castleState: pruneDeepV0(c.castleState, 2),
    recentReality: pruneDeepV0(c.recentReality, 2),
    relationship: {
      trust: rel.trust,
      familiarity: rel.familiarity,
      bondScore: rel.bondScore,
      relationalTone: trimStrV0(rel.relationalTone, 120),
      emotions: pruneDeepV0(rel.emotions, 2)
    },
    runtime: {
      gatewayPhase: runtime.gatewayPhase ?? runtime.rhizohGatewayPhase,
      rhizohGatewayPhase: runtime.rhizohGatewayPhase,
      rhizohFastSpeech: runtime.rhizohFastSpeech,
      scheduling: runtime.scheduling,
      rhizohProductOrchestration: pruneDeepV0(runtime.rhizohProductOrchestration, 2)
    },
    rhizohMemoryEpisodes: Array.isArray(c.rhizohMemoryEpisodes)
      ? c.rhizohMemoryEpisodes.slice(-episodeCap).map(trimMemoryEpisodeV0)
      : [],
    rhizohNarrativeThread: pruneDeepV0(c.rhizohNarrativeThread, 2),
    rhizohRecallIdentityFeedback: c.rhizohRecallIdentityFeedback
      ? pruneDeepV0(c.rhizohRecallIdentityFeedback, 2)
      : undefined,
    rhizohStabilityAnchor: pruneDeepV0(c.rhizohStabilityAnchor, 2)
  };
  if (!trimmed.rhizohRecallIdentityFeedback) delete trimmed.rhizohRecallIdentityFeedback;
  return trimmed;
}

/**
 * @param {Record<string, unknown>} ctx
 * @param {{ voiceTurn?: boolean }} [opts]
 */
export function trimRhizohLlmContextV0(ctx, opts = {}) {
  const src = ctx && typeof ctx === "object" ? ctx : {};
  const next = {
    agentId: trimStrV0(src.agentId, 64),
    layerId: src.layerId,
    layerCode: trimStrV0(src.layerCode, 32),
    layerName: trimStrV0(src.layerName, 64),
    mission: trimStrV0(src.mission, 400),
    detail: trimStrV0(src.detail, 400),
    reality: trimStrV0(src.reality, 400),
    camera: trimStrV0(src.camera, 200),
    simTime: src.simTime,
    continuity: trimRhizohContinuityForLlmV0(
      src.continuity && typeof src.continuity === "object" ? src.continuity : {},
      opts
    ),
    rhizohRouter: pruneDeepV0(src.rhizohRouter, 2),
    rhizohProductOrchestration: pruneDeepV0(src.rhizohProductOrchestration, 2),
    rhizohConversationLlmDirective: trimStrV0(src.rhizohConversationLlmDirective, 1200),
    rhizohMultilingualDirective: trimStrV0(src.rhizohMultilingualDirective, 800),
    rhizohMultilingual: pruneDeepV0(src.rhizohMultilingual, 2),
    cohortId: src.cohortId ? trimStrV0(src.cohortId, 64) : undefined,
    life_continuity: pruneDeepV0(src.life_continuity, 2),
    rhizohMemoryContract: trimStrV0(src.rhizohMemoryContract, 1600)
  };
  if (!next.cohortId) delete next.cohortId;
  return next;
}

/**
 * @param {Record<string, unknown>} raw
 * @param {{ voiceTurn?: boolean }} [opts]
 */
export function trimRhizohLlmRequestBodyV0(raw, opts = {}) {
  const bytesBefore = measureRhizohJsonUtf8BytesV0(raw);
  /** @type {string[]} */
  const tiersApplied = [];
  let body =
    raw && typeof raw === "object"
      ? JSON.parse(JSON.stringify(raw))
      : { message: String(raw?.message || "") };

  const applyTier = (name, mutator) => {
    mutator(body);
    tiersApplied.push(name);
    body.payloadTrimMeta = {
      schema: RHIZOH_LLM_PAYLOAD_TRIM_SCHEMA_V0,
      tiersApplied: [...tiersApplied],
      bytesBefore,
      voiceTurn: opts.voiceTurn === true
    };
    return measureRhizohJsonUtf8BytesV0(body);
  };

  let bytes = bytesBefore;

  if (body.context && typeof body.context === "object" && body.context.languagePropagation) {
    bytes = applyTier("drop_context_languagePropagation", (b) => {
      delete b.context.languagePropagation;
    });
  }

  if (bytes > RHIZOH_LLM_TARGET_BODY_BYTES_V0 && body.context) {
    bytes = applyTier("trim_context", (b) => {
      b.context = trimRhizohLlmContextV0(b.context, opts);
    });
  }

  if (bytes > RHIZOH_LLM_TARGET_BODY_BYTES_V0 && body.context?.life_continuity) {
    bytes = applyTier("drop_life_continuity", (b) => {
      delete b.context.life_continuity;
    });
  }

  if (bytes > RHIZOH_LLM_TARGET_BODY_BYTES_V0 && body.context?.rhizohMultilingual) {
    bytes = applyTier("drop_rhizohMultilingual_blob", (b) => {
      delete b.context.rhizohMultilingual;
    });
  }

  if (bytes > RHIZOH_LLM_TARGET_BODY_BYTES_V0 && body.context?.rhizohRouter) {
    bytes = applyTier("drop_rhizohRouter", (b) => {
      delete b.context.rhizohRouter;
    });
  }

  if (bytes > RHIZOH_LLM_TARGET_BODY_BYTES_V0 && body.context?.continuity) {
    bytes = applyTier("continuity_minimal", (b) => {
      const c = b.context.continuity;
      b.context.continuity = {
        sessionId: c.sessionId,
        relationship: c.relationship,
        rhizohMemoryEpisodes: Array.isArray(c.rhizohMemoryEpisodes)
          ? c.rhizohMemoryEpisodes.slice(-1)
          : [],
        runtime: { gatewayPhase: c.runtime?.gatewayPhase ?? c.runtime?.rhizohGatewayPhase }
      };
    });
  }

  if (bytes > RHIZOH_LLM_MAX_BODY_BYTES_V0 && body.languagePropagation) {
    bytes = applyTier("slim_languagePropagation", (b) => {
      const lp = b.languagePropagation;
      b.languagePropagation = {
        schema: lp.schema,
        uiLang: lp.uiLang,
        speechLang: lp.speechLang,
        llmBcp47: lp.llmBcp47,
        traceId: lp.traceId
      };
    });
  }

  const bytesAfter = measureRhizohJsonUtf8BytesV0(body);
  body.payloadTrimMeta = Object.freeze({
    schema: RHIZOH_LLM_PAYLOAD_TRIM_SCHEMA_V0,
    tiersApplied: Object.freeze([...tiersApplied]),
    bytesBefore,
    bytesAfter,
    trimmed: tiersApplied.length > 0,
    voiceTurn: opts.voiceTurn === true,
    withinLimit: bytesAfter <= RHIZOH_LLM_MAX_BODY_BYTES_V0
  });

  return Object.freeze({
    body,
    meta: body.payloadTrimMeta
  });
}
