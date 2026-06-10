/**
 * Cognition → LLM bridge — wires conversationDepth + FOX attention into queryRhizohLLM.
 * CORE-ELIGIBLE habitat layer (no frozen phase*.js).
 */

import {
  resolveRhizohConversationDepthV0,
  RHIZOH_CONVERSATION_MODE_V0
} from "./rhizohConversationDepthV0.js";
import {
  resolveFoxAttentionEngineV1,
  computeFoxAttentionScoreV0,
  mapFoxAttentionScoreToGenerationModeV0
} from "./foxAttentionEngineV1.js";
import {
  resolveFoxSignificanceEngineV1,
  evaluateFoxBehaviorPostureV1,
  buildFoxSignificancePromptBlockV1
} from "./foxSignificanceEngineV1.js";
import { readCastleAwarenessFieldV1 } from "./castleAwarenessFieldV1.js";
import {
  computeFoxContinuityPressureV1,
  buildRhizohDialogueThreadPromptBlockV1,
  coalesceRhizohDialogueThreadV1
} from "./rhizohDialogueThreadV1.js";
import {
  resolveGhostPresentationBiasV1,
  publishGhostPresentationBiasV1,
  buildGhostPresentationTonePromptBlockV1
} from "./ghostStateEngineV1.js";

export const RHIZOH_CONVERSATION_DEPTH_LLM_BRIDGE_SCHEMA_V0 =
  "castle.rhizoh.conversation_depth_llm_bridge.v0";

function roundComfortV0(relationshipImpact, bond) {
  const r = Number(relationshipImpact);
  const b = Number(bond);
  const base = Number.isFinite(r) ? r : 0.35;
  const boost = Number.isFinite(b) ? b * 0.25 : 0;
  return Math.round(Math.min(1, Math.max(0, base + boost)) * 1000) / 1000;
}

function roundContinuityV0(pressure, dialogueContinuity) {
  const p = Number(pressure);
  const d = Number(dialogueContinuity);
  const a = Number.isFinite(p) ? p : 0;
  const b = Number.isFinite(d) ? d : 0;
  return Math.round(Math.min(1, Math.max(a, b * 0.85)) * 1000) / 1000;
}

/** @type {Readonly<Record<string, string>>} */
const DEPTH_MODE_TO_GENERATION_V0 = Object.freeze({
  [RHIZOH_CONVERSATION_MODE_V0.GREET]: "FAST_DIALOGUE",
  [RHIZOH_CONVERSATION_MODE_V0.EXPLORE]: "STANDARD",
  [RHIZOH_CONVERSATION_MODE_V0.DEBATE]: "DEEP_REASONING",
  [RHIZOH_CONVERSATION_MODE_V0.NARRATIVE]: "NARRATIVE",
  [RHIZOH_CONVERSATION_MODE_V0.SYNTHESIS]: "REFLECTIVE",
  [RHIZOH_CONVERSATION_MODE_V0.DISCOURSE]: "NARRATIVE"
});

/** @type {Readonly<Record<string, number>>} */
const GENERATION_MODE_RANK_V0 = Object.freeze({
  FAST_DIALOGUE: 0,
  STANDARD: 1,
  REFLECTIVE: 2,
  NARRATIVE: 3,
  DEEP_REASONING: 4
});

function normalizeGenerationModeIdV0(mode) {
  const key = String(mode || "STANDARD")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  return key in GENERATION_MODE_RANK_V0 ? key : "STANDARD";
}

/**
 * @param {string} a
 * @param {string} b
 */
function maxGenerationModeV0(a, b) {
  const ka = normalizeGenerationModeIdV0(a);
  const kb = normalizeGenerationModeIdV0(b);
  return (GENERATION_MODE_RANK_V0[ka] ?? 1) >= (GENERATION_MODE_RANK_V0[kb] ?? 1) ? ka : kb;
}

export { computeFoxAttentionScoreV0, mapFoxAttentionScoreToGenerationModeV0 };

/**
 * @param {ReturnType<typeof resolveRhizohConversationDepthV0>} depth
 * @param {{
 *   generationModeHint?: string,
 *   fox?: ReturnType<typeof resolveFoxAttentionEngineV1>
 * }} [opts]
 */
export function mapConversationDepthToGenerationModeV0(depth, opts = {}) {
  const fox = opts.fox && typeof opts.fox === "object" ? opts.fox : null;
  const mode = String(depth?.conversationMode || RHIZOH_CONVERSATION_MODE_V0.EXPLORE);
  const fromDepth = DEPTH_MODE_TO_GENERATION_V0[mode] || "STANDARD";
  const fromAttention = fox?.recommendedGenerationMode || "STANDARD";
  let resolved = maxGenerationModeV0(fromDepth, fromAttention);

  const hint = normalizeGenerationModeIdV0(opts.generationModeHint);
  if (hint && hint !== "STANDARD") {
    resolved = maxGenerationModeV0(resolved, hint);
  }

  return Object.freeze({
    generationMode: resolved,
    attentionScore: fox?.attentionScore ?? null,
    fromDepth,
    fromAttention,
    fox
  });
}

/**
 * @param {{
 *   message?: string,
 *   conversationPhase?: string,
 *   userTurnCount?: number,
 *   voiceTurn?: boolean,
 *   generationModeHint?: string,
 *   narrativeThread?: Record<string, unknown> | null,
 *   narrativeArc?: Record<string, unknown> | null,
 *   memoryEpisodes?: unknown[],
 *   recentTurns?: Array<{ user?: string, assistant?: string }>,
 *   persona?: { firstName?: string, displayName?: string },
 *   layerMission?: string,
 *   traceId?: string,
 *   router?: Record<string, unknown> | null,
 *   emotions?: Record<string, number> | null,
 *   runtime?: Record<string, unknown> | null,
 *   continuity?: Record<string, unknown> | null,
 *   dialogueThread?: Record<string, unknown> | null,
 *   pinGenerationMode?: boolean,
 *   callerGenerationMode?: string
 * }} input
 */
export function buildRhizohLlmDepthBundleV0(input = {}) {
  const depth = resolveRhizohConversationDepthV0({
    message: input.message,
    conversationPhase: input.conversationPhase,
    userTurnCount: input.userTurnCount,
    voiceTurn: input.voiceTurn === true,
    generationModeHint: input.generationModeHint,
    narrativeThread: input.narrativeThread,
    narrativeArc: input.narrativeArc,
    memoryEpisodes: input.memoryEpisodes,
    recentTurns: input.recentTurns,
    persona: input.persona,
    layerMission: input.layerMission,
    turnIndex: input.userTurnCount,
    traceId: input.traceId
  });

  const dialogueThread = coalesceRhizohDialogueThreadV1(input.dialogueThread);
  const foxContinuityPressure = computeFoxContinuityPressureV1(dialogueThread);

  const fox = resolveFoxAttentionEngineV1({
    message: input.message,
    router: input.router,
    depth,
    emotions: input.emotions,
    narrativeThread: input.narrativeThread,
    narrativeArc: input.narrativeArc,
    memoryEpisodes: input.memoryEpisodes,
    recentTurns: input.recentTurns,
    runtime: input.runtime,
    continuity: input.continuity,
    continuityPressure: foxContinuityPressure.pressure
  });

  const significance = resolveFoxSignificanceEngineV1({
    message: input.message,
    router: input.router,
    emotions: input.emotions,
    narrativeThread: input.narrativeThread,
    narrativeArc: input.narrativeArc,
    memoryEpisodes: input.memoryEpisodes,
    userTurnCount: input.userTurnCount,
    conversationPhase: input.conversationPhase,
    continuity: input.continuity
  });

  const awarenessField = readCastleAwarenessFieldV1();

  const behaviorPosture = evaluateFoxBehaviorPostureV1({
    attentionField: fox.attentionField,
    significanceField: significance.significanceField,
    userInitiated: String(input.message || "").trim().length > 0,
    message: input.message
  });

  const rel = input.continuity?.relationship;
  const bond = rel && typeof rel === "object" ? Number(rel.bondScore ?? rel.trust) : 0;
  const ghostState = Object.freeze({
    curiosity: fox.attentionField?.noveltySignal ?? 0,
    focus: fox.attentionField?.continuitySignal ?? 0,
    alertness: fox.attentionField?.worldSignal ?? 0,
    comfort: roundComfortV0(
      significance.significanceField?.relationshipImpact,
      bond
    ),
    continuity: roundContinuityV0(
      foxContinuityPressure.pressure,
      dialogueThread?.dialogueCurve?.continuity
    )
  });

  const ghostPresentation = resolveGhostPresentationBiasV1({
    ghostState,
    dialogueThread,
    behaviorPosture,
    foxContinuityPressure
  });
  publishGhostPresentationBiasV1(ghostPresentation.presentationBias);

  const effectiveDepth = fox.adjustedDepth;

  const pin = input.pinGenerationMode === true;
  const modePick = pin
    ? Object.freeze({
        generationMode: normalizeGenerationModeIdV0(input.callerGenerationMode),
        attentionScore: null,
        fromDepth: null,
        fromAttention: null,
        fox: null
      })
    : mapConversationDepthToGenerationModeV0(effectiveDepth, { generationModeHint: input.generationModeHint, fox });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.foxAttentionField = fox.attentionField;
    window.__rhizoh.foxSignificanceField = significance.significanceField;
    window.__rhizoh.castleAwarenessField = awarenessField;
    window.__rhizoh.foxBehaviorPosture = behaviorPosture;
    window.__rhizoh.ghostState = ghostState;
    window.__rhizoh.rhizohDialogueThread = dialogueThread;
    window.__rhizoh.foxContinuityPressure = foxContinuityPressure;
    window.__rhizoh.ghostPresentationBias = ghostPresentation.presentationBias;
    window.__rhizoh.foxAttentionEngine = Object.freeze({
      schema: fox.schema,
      atMs: Date.now(),
      traceId: input.traceId || null,
      attentionScore: fox.attentionScore,
      attentionField: fox.attentionField,
      ghostBindings: fox.ghostBindings,
      components: fox.components,
      recommendedConversationMode: fox.recommendedConversationMode,
      recommendedGenerationMode: fox.recommendedGenerationMode,
      promptBlock: fox.promptBlock,
      significanceField: significance.significanceField,
      behaviorPosture,
      ghostState,
      ghostPresentation: ghostPresentation.presentationBias
    });
  }

  return Object.freeze({
    schema: RHIZOH_CONVERSATION_DEPTH_LLM_BRIDGE_SCHEMA_V0,
    depth: effectiveDepth,
    baseDepth: depth,
    fox,
    generationMode: modePick.generationMode,
    attentionScore: modePick.attentionScore,
    modeResolution: Object.freeze({
      fromDepth: modePick.fromDepth,
      fromAttention: modePick.fromAttention,
      pinned: pin
    }),
    gatewayOptions: Object.freeze({
      conversationMode: fox.recommendedConversationMode,
      conversationIntent: effectiveDepth.conversationIntent,
      depthLevel: fox.recommendedDepthLevel,
      continuityStrength: fox.recommendedContinuityStrength,
      needsRecall: effectiveDepth.needsRecall === true,
      phraseChunking: effectiveDepth.phraseChunking === true,
      attentionScore: fox.attentionScore,
      dominantSource: fox.attentionField?.dominantSource || null
    }),
    foxAttentionField: fox.attentionField,
    foxAttentionPromptBlock: fox.promptBlock,
    foxSignificanceField: significance.significanceField,
    foxSignificancePromptBlock: buildFoxSignificancePromptBlockV1(significance),
    castleAwarenessField: awarenessField,
    foxBehaviorPosture: behaviorPosture,
    ghostAttentionBindings: fox.ghostBindings,
    ghostState,
    ghostPresentationBias: ghostPresentation.presentationBias,
    ghostPresentationTonePromptBlock: buildGhostPresentationTonePromptBlockV1(
      ghostPresentation.presentationBias
    ),
    dialogueThread,
    foxContinuityPressure,
    rhizohDialogueThreadPromptBlock: buildRhizohDialogueThreadPromptBlockV1(dialogueThread)
  });
}
