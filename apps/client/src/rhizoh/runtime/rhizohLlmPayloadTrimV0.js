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
 * Trim-proof cognition summaries — never drop perception/narrative signal entirely.
 * @param {Record<string, unknown>} cont
 */
export function buildRhizohCriticalContextV0(cont) {
  const c = cont && typeof cont === "object" ? cont : {};
  const rel = c.relationship && typeof c.relationship === "object" ? c.relationship : {};
  const thread =
    c.rhizohNarrativeThread && typeof c.rhizohNarrativeThread === "object"
      ? c.rhizohNarrativeThread
      : null;
  const arc =
    c.rhizohNarrativeArc && typeof c.rhizohNarrativeArc === "object" ? c.rhizohNarrativeArc : null;
  const dialogue =
    c.rhizohDialogueThread && typeof c.rhizohDialogueThread === "object" ? c.rhizohDialogueThread : null;
  const ghost =
    c.rhizohGhostPerceptionV1 && typeof c.rhizohGhostPerceptionV1 === "object"
      ? c.rhizohGhostPerceptionV1
      : null;
  const arb =
    c.rhizohPerceptionArbitrationV1 && typeof c.rhizohPerceptionArbitrationV1 === "object"
      ? c.rhizohPerceptionArbitrationV1
      : null;

  const narrativeSummary = [
    thread?.focusIntent ? `focus=${String(thread.focusIntent).slice(0, 48)}` : "",
    thread?.arcSummary ? `arc=${String(thread.arcSummary).slice(0, 220)}` : "",
    Array.isArray(thread?.intentChain) && thread.intentChain.length
      ? `intents=${thread.intentChain.slice(-4).join("→")}`
      : "",
    arc?.phase ? `phase=${String(arc.phase).slice(0, 24)}` : "",
    arc?.direction ? `direction=${String(arc.direction).slice(0, 120)}` : ""
  ]
    .filter(Boolean)
    .join(" | ");

  const dialogueSummary = dialogue
    ? [
        dialogue.dialogueCurve?.momentum ? `momentum=${dialogue.dialogueCurve.momentum}` : "",
        dialogue.emotionalTrajectory?.direction
          ? `emotion=${String(dialogue.emotionalTrajectory.direction).slice(0, 24)}`
          : "",
        dialogue.unresolvedSemanticTension?.aggregate != null
          ? `tension=${dialogue.unresolvedSemanticTension.aggregate}`
          : "",
        dialogue.previousTurn?.user
          ? `prevUser=${trimStrV0(dialogue.previousTurn.user, 100)}`
          : ""
      ]
        .filter(Boolean)
        .join(" | ")
    : "";

  const ghostSummary = [
    ghost?.overallTone ? `tone=${String(ghost.overallTone).slice(0, 48)}` : "",
    ghost?.semanticPromptBlock
      ? trimStrV0(ghost.semanticPromptBlock, 420)
      : ghost?.promptBlock
        ? trimStrV0(ghost.promptBlock, 420)
        : ""
  ]
    .filter(Boolean)
    .join(" ");

  const arbitrationSummary = [
    arb?.dominantFrame ? `frame=${String(arb.dominantFrame).slice(0, 32)}` : "",
    arb?.rationale ? trimStrV0(arb.rationale, 200) : "",
    arb?.orderedPromptBlock ? trimStrV0(arb.orderedPromptBlock, 360) : ""
  ]
    .filter(Boolean)
    .join(" ");

  const relationshipSummary = [
    rel.bondScore != null ? `bond=${rel.bondScore}` : "",
    rel.trust != null ? `trust=${rel.trust}` : "",
    rel.relationalTone && typeof rel.relationalTone === "object"
      ? `tone=${JSON.stringify(rel.relationalTone).slice(0, 120)}`
      : typeof rel.relationalTone === "string"
        ? trimStrV0(rel.relationalTone, 80)
        : ""
  ]
    .filter(Boolean)
    .join(" ");

  return Object.freeze({
    schema: "castle.rhizoh.critical_context.v0",
    narrativeSummary: narrativeSummary || null,
    dialogueSummary: dialogueSummary || null,
    ghostSummary: ghostSummary || null,
    arbitrationSummary: arbitrationSummary || null,
    relationshipSummary: relationshipSummary || null
  });
}

/**
 * @param {Record<string, unknown>} cont
 * @param {{ voiceTurn?: boolean }} [opts]
 */
export function trimRhizohContinuityForLlmV0(cont, opts = {}) {
  const c = cont && typeof cont === "object" ? cont : {};
  const rel = c.relationship && typeof c.relationship === "object" ? c.relationship : {};
  const runtime = c.runtime && typeof c.runtime === "object" ? c.runtime : {};
  const recallActive = Boolean(c.rhizohContinuityRecallBoost?.active);
  const episodeCap = opts.voiceTurn === true ? (recallActive ? 3 : 2) : recallActive ? 6 : 4;
  const recallLineCap = recallActive ? 8 : 0;
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
    rhizohDialogueThread: pruneDeepV0(c.rhizohDialogueThread, 2),
    rhizohCriticalContext: buildRhizohCriticalContextV0(c),
    rhizohRecallIdentityFeedback: c.rhizohRecallIdentityFeedback
      ? pruneDeepV0(c.rhizohRecallIdentityFeedback, 2)
      : undefined,
    rhizohWeightedRecollection: Array.isArray(c.rhizohWeightedRecollection)
      ? c.rhizohWeightedRecollection.slice(0, recallActive ? 16 : 12)
      : undefined,
    rhizohContinuityRecallBoost: c.rhizohContinuityRecallBoost
      ? {
          active: c.rhizohContinuityRecallBoost.active === true,
          tier: c.rhizohContinuityRecallBoost.tier,
          reason: trimStrV0(c.rhizohContinuityRecallBoost.reason, 64),
          anchorTokens: Array.isArray(c.rhizohContinuityRecallBoost.anchorTokens)
            ? c.rhizohContinuityRecallBoost.anchorTokens.slice(0, 8)
            : [],
          promptDirective: trimStrV0(c.rhizohContinuityRecallBoost.promptDirective, 480),
          lines: Array.isArray(c.rhizohContinuityRecallBoost.lines)
            ? c.rhizohContinuityRecallBoost.lines.slice(0, recallLineCap || 6).map((row) => ({
                ts: row?.ts,
                user: trimStrV0(row?.user || row?.text, 180),
                assistant: trimStrV0(row?.assistant, 220),
                retrievalWeight: row?.retrievalWeight,
                recallBoost: row?.recallBoost === true
              }))
            : []
        }
      : undefined,
    rhizohSportsLiveContext: c.rhizohSportsLiveContext
      ? {
          active: c.rhizohSportsLiveContext.active === true,
          team: c.rhizohSportsLiveContext.team,
          source: trimStrV0(c.rhizohSportsLiveContext.source, 32),
          promptDirective: trimStrV0(c.rhizohSportsLiveContext.promptDirective, 480),
          lines: Array.isArray(c.rhizohSportsLiveContext.lines)
            ? c.rhizohSportsLiveContext.lines.slice(0, 8).map((line) => trimStrV0(line, 180))
            : [],
          emptyLabel: trimStrV0(c.rhizohSportsLiveContext.emptyLabel, 160)
        }
      : undefined,
    rhizohPersonaAddressing: c.rhizohPersonaAddressing
      ? pruneDeepV0(c.rhizohPersonaAddressing, 2)
      : undefined,
    rhizohStabilityAnchor: pruneDeepV0(c.rhizohStabilityAnchor, 2)
  };
  if (!trimmed.rhizohRecallIdentityFeedback) delete trimmed.rhizohRecallIdentityFeedback;
  if (!trimmed.rhizohWeightedRecollection?.length) delete trimmed.rhizohWeightedRecollection;
  if (!trimmed.rhizohContinuityRecallBoost) delete trimmed.rhizohContinuityRecallBoost;
  if (!trimmed.rhizohSportsLiveContext) delete trimmed.rhizohSportsLiveContext;
  if (!trimmed.rhizohPersonaAddressing) delete trimmed.rhizohPersonaAddressing;
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
    rhizohMemoryContract: trimStrV0(src.rhizohMemoryContract, 1600),
    rhizohStoryContinuitySnapshot: pruneDeepV0(src.rhizohStoryContinuitySnapshot, 2),
    rhizohConversationDepth: pruneDeepV0(src.rhizohConversationDepth, 2),
    rhizohFoxAttentionPromptBlock: trimStrV0(src.rhizohFoxAttentionPromptBlock, 600),
    rhizohFoxAttentionField: pruneDeepV0(src.rhizohFoxAttentionField, 2),
    rhizohGhostAttentionBindingsV1: pruneDeepV0(src.rhizohGhostAttentionBindingsV1, 2),
    towerId: trimStrV0(src.towerId, 64),
    surface: trimStrV0(src.surface, 64),
    towerLabel: trimStrV0(src.towerLabel, 96),
    towerVision:
      src.towerVision && typeof src.towerVision === "object"
        ? {
            mimeType: trimStrV0(src.towerVision.mimeType, 32),
            base64:
              typeof src.towerVision.base64 === "string"
                ? src.towerVision.base64.slice(0, 600_000)
                : undefined
          }
        : undefined
  };
  if (!next.towerId) delete next.towerId;
  if (!next.surface) delete next.surface;
  if (!next.towerLabel) delete next.towerLabel;
  if (!next.towerVision?.base64) delete next.towerVision;
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
        rhizohCriticalContext:
          c.rhizohCriticalContext && typeof c.rhizohCriticalContext === "object"
            ? c.rhizohCriticalContext
            : buildRhizohCriticalContextV0(c),
        rhizohMemoryEpisodes: Array.isArray(c.rhizohMemoryEpisodes)
          ? c.rhizohMemoryEpisodes.slice(-1)
          : [],
        rhizohWeightedRecollection: Array.isArray(c.rhizohWeightedRecollection)
          ? c.rhizohWeightedRecollection.slice(0, c.rhizohContinuityRecallBoost?.active ? 14 : 8)
          : undefined,
        rhizohContinuityRecallBoost: c.rhizohContinuityRecallBoost || undefined,
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
