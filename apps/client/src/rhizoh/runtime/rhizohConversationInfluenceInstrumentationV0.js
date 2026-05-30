/**
 * Observability-only — measures which layer shaped a turn; does NOT steer cognition (see firewall).
 * Default: one bundled log per phase to avoid instrumentation overload.
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { auditRhizohTurnLayerPresenceV0 } from "./rhizohLayerCrossVisibilityV0.js";
import {
  buildInfluenceFeedbackSignalV0,
  isInfluenceObservabilityVerboseV0,
  RHIZOH_INFLUENCE_OBSERVABILITY_SCHEMA_V0,
  RHIZOH_OBSERVATION_EXECUTION_BOUNDARY_V0
} from "./rhizohInfluenceObservabilityFirewallV0.js";
import {
  assertClagInfluenceUsesActiveRegistryOnlyV0,
  getClagActiveNodeRegistryV0
} from "./rhizohClagNodeRegistryV0.js";
import { applyProjectionSafeInfluenceReductionV0 } from "./rhizohClagProjectionSafeInfluenceV0.js";

/** @typedef {"passive"|"shadow"|"active"|"partial"} LayerInfluenceVerdict */

/**
 * @param {LayerInfluenceVerdict} v
 * @returns {number}
 */
function influenceToScoreV0(v) {
  if (v === "active") return 1;
  if (v === "partial") return 0.55;
  if (v === "shadow") return 0.25;
  return 0;
}

/**
 * @param {{
 *   traceId?: string,
 *   layerSpec?: { id?: number, code?: string },
 *   conversationPhase?: string,
 *   continuity?: Record<string, unknown>,
 *   conversationDepth?: Record<string, unknown> | null,
 *   rhizohRouter?: Record<string, unknown> | null,
 *   turnAcceptance?: { accepted?: boolean, reason?: string },
 *   sourcePath?: string
 * }} input
 */
export function buildRhizohTurnInfluencePreLlmV0(input = {}) {
  const audit = auditRhizohTurnLayerPresenceV0(input);
  const depth = input.conversationDepth && typeof input.conversationDepth === "object" ? input.conversationDepth : {};
  const snap = depth.storySnapshot && typeof depth.storySnapshot === "object" ? depth.storySnapshot : null;
  const router = input.rhizohRouter && typeof input.rhizohRouter === "object" ? input.rhizohRouter : {};
  const cont = input.continuity && typeof input.continuity === "object" ? input.continuity : {};
  const rel = cont.relationship && typeof cont.relationship === "object" ? cont.relationship : {};

  const academyEffectScore =
    audit.academy.influence === "active"
      ? 0.85
      : audit.academy.influence === "shadow"
        ? 0.2
        : 0;

  const narrativeFlowing = Boolean(
    snap?.storyContinuityGuarantee ||
      (snap?.whatHappenedLast && Array.isArray(snap?.unresolvedThreads) && snap.unresolvedThreads.length > 0)
  );

  const depthLayer = Object.freeze({
    conversationMode: depth.conversationMode ?? null,
    conversationIntent: depth.conversationIntent ?? null,
    depthLevel: depth.depthLevel ?? null,
    continuityStrength: depth.continuityStrength ?? null,
    responseLength: depth.responseLength ?? null,
    maxTokensCeiling: depth.maxTokensCeiling ?? null,
    needsRecall: depth.needsRecall === true,
    phraseChunking: depth.phraseChunking === true,
    controlMode: depth.controlMode ?? null,
    injectedTo: ["options", "gateway_depth_directive"]
  });

  const narrativeLayer = Object.freeze({
    influence: audit.narrative.influence,
    storyContinuityScore: snap?.storyContinuityScore ?? null,
    storyContinuityGuarantee: snap?.storyContinuityGuarantee === true,
    storyFlowing: narrativeFlowing,
    openThreadCount: Array.isArray(snap?.unresolvedThreads) ? snap.unresolvedThreads.length : 0,
    lastSceneChars: String(snap?.whatHappenedLast || snap?.lastScene || "").length,
    injectedTo: snap ? ["context.rhizohStoryContinuitySnapshot", "gateway_story_block"] : []
  });

  const academyLayer = Object.freeze({
    influence: audit.academy.influence,
    effectScore: academyEffectScore,
    effectPresent: academyEffectScore > 0.15,
    injectedTo:
      audit.academy.influence === "active"
        ? ["layer_L11", "brain_v2_event"]
        : audit.academy.influence === "shadow"
          ? ["runtime_academics_hint"]
          : []
  });

  const continuityLayer = Object.freeze({
    phase: String(input.conversationPhase || "").slice(0, 32),
    bond01:
      rel.trust != null && rel.familiarity != null
        ? Math.round(((Number(rel.trust) + Number(rel.familiarity)) / 2) * 1000) / 1000
        : null,
    turnAccepted: input.turnAcceptance?.accepted !== false,
    turnReason: input.turnAcceptance?.reason ?? null,
    injectedTo: ["context.continuity", "rhizohMemoryContract"]
  });

  const routerLayer = Object.freeze({
    intent: router.intent ?? null,
    subIntent: router.subIntent ?? null,
    confidence: router.confidence ?? null,
    emotionalSignal: router.emotionalSignal ?? null,
    injectedTo: router.intent ? ["context.rhizohRouter", "system_intent_routing_line"] : []
  });

  const shaperScores = Object.freeze({
    depth:
      (Number(depth.depthLevel) || 0) * 0.12 +
      (depth.needsRecall ? 0.08 : 0) +
      (depth.phraseChunking ? 0.05 : 0),
    narrative:
      influenceToScoreV0(audit.narrative.influence) * 0.35 +
      (Number(snap?.storyContinuityScore) || 0) * 0.25,
    academy: academyEffectScore * 0.4,
    continuity: (continuityLayer.bond01 != null ? continuityLayer.bond01 * 0.12 : 0.04) + 0.03,
    router: (Number(router.confidence) || 0.35) * 0.15
  });

  const dominantShaper = pickDominantShaperV0(shaperScores);

  return Object.freeze({
    schema: "castle.rhizoh.turn_influence_pre_llm.v0",
    traceId: audit.traceId,
    audit,
    layers: Object.freeze({
      depth: depthLayer,
      narrative: narrativeLayer,
      academy: academyLayer,
      continuity: continuityLayer,
      router: routerLayer,
      observation: audit.observation
    }),
    shaperScores,
    dominantShaper,
    shapingAnswer: formatShapingAnswerV0(dominantShaper, shaperScores, audit)
  });
}

/**
 * @param {Record<string, number>} scores
 * @returns {string}
 */
function pickDominantShaperV0(scores) {
  const entries = Object.entries(scores || {}).filter(([, v]) => Number(v) > 0);
  if (!entries.length) return "unknown";
  entries.sort((a, b) => Number(b[1]) - Number(a[1]));
  const top = Number(entries[0][1]);
  const tied = entries.filter(([, v]) => Number(v) >= top * 0.92).map(([k]) => k);
  if (tied.length > 1) return tied.join("+");
  return entries[0][0];
}

/**
 * @param {string} dominant
 * @param {Record<string, number>} scores
 * @param {ReturnType<typeof auditRhizohTurnLayerPresenceV0>} audit
 */
function formatShapingAnswerV0(dominant, scores, audit) {
  const top = String(dominant || "unknown");
  const academy = audit?.academy?.influence ?? "passive";
  const narrative = audit?.narrative?.influence ?? "passive";
  if (top === "academy" || top.includes("academy")) {
    return "academy_layer_actively_shaping";
  }
  if (top.includes("narrative") || (top.includes("depth") && narrative === "partial")) {
    return "narrative_and_depth_co_shaping";
  }
  if (top === "depth" || top.includes("depth")) {
    return "conversation_depth_mode_shaping";
  }
  if (academy === "passive" && narrative === "partial") {
    return "narrative_enrichment_only_academy_silent";
  }
  if (academy === "passive") {
    return "depth_and_continuity_shaping_academy_not_in_path";
  }
  return `multi_layer:${top}:scores=${JSON.stringify(scores)}`;
}

/**
 * @param {ReturnType<typeof buildRhizohTurnInfluencePreLlmV0>} pre
 * @param {{
 *   replyChars?: number,
 *   rhizohDeliveryKind?: string,
 *   replyParsingConfidence?: number | null,
 *   replyFormatDriftScore?: number | null,
 *   replyExtractPath?: string | null
 * }} post
 */
export function buildRhizohInfluenceDeltaV0(pre, post = {}) {
  const preScores = pre?.shaperScores && typeof pre.shaperScores === "object" ? pre.shaperScores : {};
  const replyChars = Math.max(0, Math.floor(Number(post.replyChars) || 0));
  const parseOk = post.replyParsingConfidence != null ? Number(post.replyParsingConfidence) : null;

  const postAdjustments = Object.freeze({
    gateway_parse:
      parseOk != null && parseOk < 0.7
        ? 0.25
        : post.rhizohDeliveryKind === "empty_reply"
          ? 0.35
          : 0.05,
    reply_length: replyChars > 0 ? Math.min(0.15, replyChars / 4000) : 0
  });

  const mergedScores = { ...preScores };
  mergedScores.gateway_parse = (mergedScores.gateway_parse || 0) + postAdjustments.gateway_parse;
  mergedScores.reply_surface = postAdjustments.reply_length;

  const dominantAfter = pickDominantShaperV0(mergedScores);
  const delta = Object.freeze({
    preDominant: pre?.dominantShaper ?? null,
    postDominant: dominantAfter,
    shifted: String(pre?.dominantShaper || "") !== String(dominantAfter),
    postAdjustments,
    replyChars,
    rhizohDeliveryKind: post.rhizohDeliveryKind ?? null,
    replyParsingConfidence: parseOk,
    replyFormatDriftScore: post.replyFormatDriftScore ?? null,
    replyExtractPath: post.replyExtractPath ?? null
  });

  return Object.freeze({
    schema: "castle.rhizoh.influence_delta.v0",
    traceId: pre?.traceId ?? null,
    layersChanged: Object.freeze({
      depth: pre?.layers?.depth ?? null,
      narrative: {
        ...(pre?.layers?.narrative || {}),
        postReplyChars: replyChars
      },
      academy: {
        ...(pre?.layers?.academy || {}),
        postEffectVisible: pre?.layers?.academy?.effectPresent === true
      }
    }),
    delta,
    shaperScores: Object.freeze(mergedScores),
    dominantShaper: dominantAfter
  });
}

/**
 * @param {ReturnType<typeof buildRhizohTurnInfluencePreLlmV0>} pre
 * @param {ReturnType<typeof buildRhizohInfluenceDeltaV0> | null} [delta]
 */
export function buildInfluenceObservabilityBundleV0(pre, delta = null) {
  const audit = pre?.audit;
  const deltaPayload =
    delta ||
    buildRhizohInfluenceDeltaV0(pre, {
      replyChars: 0,
      rhizohDeliveryKind: null,
      replyParsingConfidence: null
    });

  const academyTick = Object.freeze({
    influence: audit?.academy?.influence ?? "passive",
    effectScore: pre?.layers?.academy?.effectScore ?? 0,
    effectPresent: pre?.layers?.academy?.effectPresent === true,
    verdict: audit?.academy?.verdict ?? null
  });

  const narrativeTick = Object.freeze({
    influence: audit?.narrative?.influence ?? "passive",
    storyFlowing: pre?.layers?.narrative?.storyFlowing === true,
    storyContinuityScore: pre?.layers?.narrative?.storyContinuityScore ?? null,
    openThreadCount: pre?.layers?.narrative?.openThreadCount ?? 0,
    verdict: audit?.narrative?.verdict ?? null
  });

  const influenceDelta = Object.freeze({
    preDominant: deltaPayload.delta?.preDominant ?? pre?.dominantShaper,
    postDominant: deltaPayload.dominantShaper,
    shifted: deltaPayload.delta?.shifted ?? false,
    replyChars: deltaPayload.delta?.replyChars ?? 0,
    rhizohDeliveryKind: deltaPayload.delta?.rhizohDeliveryKind ?? null,
    replyParsingConfidence: deltaPayload.delta?.replyParsingConfidence ?? null
  });

  const clagSnap =
    typeof window !== "undefined" && window.__CASTLE_RHIZOH_CLAG_INTERNAL__
      ? window.__CASTLE_RHIZOH_CLAG_INTERNAL__
      : null;
  const clagActiveGuard = clagSnap
    ? assertClagInfluenceUsesActiveRegistryOnlyV0(clagSnap)
    : assertClagInfluenceUsesActiveRegistryOnlyV0({
        activeNodeRegistry: getClagActiveNodeRegistryV0(),
        nodes: []
      });

  const projectionSafe = applyProjectionSafeInfluenceReductionV0(pre, clagSnap);
  const conversationShaper = Object.freeze({
    dominantShaper: projectionSafe.dominantShaper,
    shapingAnswer: projectionSafe.shapingAnswer ?? pre?.shapingAnswer ?? null,
    shaperScores: projectionSafe.shaperScores,
    projectionSafe: Object.freeze({
      applied: projectionSafe.reductionApplied,
      softContaminationRisk: projectionSafe.softContaminationRisk,
      activeRegistryOnly: clagActiveGuard.ok
    })
  });

  const feedbackSignal = buildInfluenceFeedbackSignalV0(
    { ...pre, shaperScores: projectionSafe.shaperScores, dominantShaper: projectionSafe.dominantShaper },
    { ...deltaPayload, shaperScores: projectionSafe.shaperScores, dominantShaper: projectionSafe.dominantShaper }
  );

  return Object.freeze({
    schema: RHIZOH_INFLUENCE_OBSERVABILITY_SCHEMA_V0,
    boundary: RHIZOH_OBSERVATION_EXECUTION_BOUNDARY_V0,
    traceId: pre?.traceId ?? null,
    academy_tick: academyTick,
    narrative_tick: narrativeTick,
    influence_delta: influenceDelta,
    conversation_shaper: conversationShaper,
    projection_safe_influence: projectionSafe,
    feedbackSignal,
    crossLayerRisk: audit?.crossLayerRisk ?? null,
    runtimeStability:
      typeof window !== "undefined" && window.__CASTLE_RHIZOH_RUNTIME_STABILITY__
        ? Object.freeze({
            regime: window.__CASTLE_RHIZOH_RUNTIME_STABILITY__.stability?.regime,
            rhythm: window.__CASTLE_RHIZOH_RUNTIME_STABILITY__.conversationBehavior?.rhythm,
            activeRegistryOnly: clagActiveGuard.ok
          })
        : null,
    clagInternal: clagSnap
      ? Object.freeze({
          revision: clagSnap.revision,
          graphContamination: clagSnap.graphContamination,
          activeRegistryOnly: clagActiveGuard.ok
        })
      : null
  });
}

/**
 * One log per phase (default). Granular CASTLE_* ticks only when verbose.
 * @param {"pre_llm"|"post_llm"} phase
 * @param {ReturnType<typeof buildInfluenceObservabilityBundleV0>} bundle
 */
export function emitRhizohInfluenceObservabilityV0(phase, bundle) {
  logCastleLifecycleV0("influence_observability", Object.freeze({
    phase,
    traceId: bundle.traceId,
    boundary: bundle.boundary,
    academy_tick: bundle.academy_tick,
    narrative_tick: bundle.narrative_tick,
    influence_delta: bundle.influence_delta,
    conversation_shaper: bundle.conversation_shaper,
    feedbackSignal: bundle.feedbackSignal
  }));

  if (isInfluenceObservabilityVerboseV0()) {
    logCastleLifecycleV0("academy_tick", Object.freeze({ traceId: bundle.traceId, ...bundle.academy_tick }));
    logCastleLifecycleV0("narrative_tick", Object.freeze({ traceId: bundle.traceId, ...bundle.narrative_tick }));
    logCastleLifecycleV0("influence_delta", Object.freeze({ traceId: bundle.traceId, phase, ...bundle.influence_delta }));
    logCastleLifecycleV0("conversation_shaper", Object.freeze({ traceId: bundle.traceId, phase, ...bundle.conversation_shaper }));
  }

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_INFLUENCE_LAST__ = Object.freeze({
      at: Date.now(),
      phase,
      ...bundle
    });
  }

  return bundle;
}

/** @deprecated Use emitRhizohInfluenceObservabilityV0 — kept for callers. */
export function emitRhizohTurnInfluenceInstrumentationV0(pre, delta = null) {
  const bundle = buildInfluenceObservabilityBundleV0(pre, delta);
  return emitRhizohInfluenceObservabilityV0("pre_llm", bundle);
}

/**
 * @param {ReturnType<typeof buildRhizohTurnInfluencePreLlmV0>} pre
 * @param {Parameters<typeof buildRhizohInfluenceDeltaV0>[1]} post
 */
export function emitRhizohInfluenceDeltaPostLlmV0(pre, post) {
  const delta = buildRhizohInfluenceDeltaV0(pre, post);
  const bundle = buildInfluenceObservabilityBundleV0(pre, delta);
  emitRhizohInfluenceObservabilityV0("post_llm", bundle);
  return delta;
}
