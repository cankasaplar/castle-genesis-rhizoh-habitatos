/**
 * CORE-ELIGIBLE — conversation depth primary, response length secondary.
 * Replaces token-only short/long as the main control axis for LLM turns.
 */

import { RHIZOH_CONVERSATION_PHASE } from "../product/rhizohConversationOrchestratorV1.js";
import {
  buildStorySnapshotForTurnV0,
  storyContinuityGuaranteeFromScoreV0
} from "./rhizohStorySnapshotEngineV0.js";

export const RHIZOH_CONVERSATION_MODE_V0 = Object.freeze({
  GREET: "greet",
  EXPLORE: "explore",
  DEBATE: "debate",
  NARRATIVE: "narrative",
  SYNTHESIS: "synthesis",
  DISCOURSE: "discourse"
});

export const RHIZOH_CONVERSATION_INTENT_V0 = Object.freeze({
  ASK: "ask",
  CHALLENGE: "challenge",
  EXTEND: "extend",
  REFLECT: "reflect",
  CONCLUDE: "conclude"
});

/** @type {Readonly<Record<string, { depthLevel: number, responseLength: string, maxTokensCeiling: number, directive: string }>>} */
export const RHIZOH_CONVERSATION_MODE_PROFILE_V0 = Object.freeze({
  [RHIZOH_CONVERSATION_MODE_V0.GREET]: {
    depthLevel: 1,
    responseLength: "short",
    maxTokensCeiling: 200,
    directive:
      "Mode GREET: warmth and presence; reciprocal but low density; no lecture; invite without interrogation."
  },
  [RHIZOH_CONVERSATION_MODE_V0.EXPLORE]: {
    depthLevel: 2,
    responseLength: "medium",
    maxTokensCeiling: 480,
    directive:
      "Mode EXPLORE: curious questions; open threads; medium depth; co-discovery not monologue."
  },
  [RHIZOH_CONVERSATION_MODE_V0.DEBATE]: {
    depthLevel: 4,
    responseLength: "long",
    maxTokensCeiling: 1200,
    directive:
      "Mode DEBATE: thesis and counterpoint; steelman when challenging; multi-step reasoning; mark uncertainty."
  },
  [RHIZOH_CONVERSATION_MODE_V0.NARRATIVE]: {
    depthLevel: 4,
    responseLength: "long",
    maxTokensCeiling: 1500,
    directive:
      "Mode NARRATIVE: scene continuity; emotional cadence; refer to memory threads; story-forward not summary-only."
  },
  [RHIZOH_CONVERSATION_MODE_V0.SYNTHESIS]: {
    depthLevel: 5,
    responseLength: "dynamic",
    maxTokensCeiling: 2000,
    directive:
      "Mode SYNTHESIS: integrate prior turns; name open loops; offer closure paths without forcing end."
  },
  [RHIZOH_CONVERSATION_MODE_V0.DISCOURSE]: {
    depthLevel: 5,
    responseLength: "dynamic",
    maxTokensCeiling: 2600,
    directive:
      "Mode DISCOURSE: long-horizon thread; explicit callbacks; topic map when helpful; sustained mutual discourse."
  }
});

const LEGACY_GENERATION_TO_MODE_V0 = Object.freeze({
  FAST_DIALOGUE: RHIZOH_CONVERSATION_MODE_V0.GREET,
  STANDARD: RHIZOH_CONVERSATION_MODE_V0.EXPLORE,
  REFLECTIVE: RHIZOH_CONVERSATION_MODE_V0.EXPLORE,
  NARRATIVE: RHIZOH_CONVERSATION_MODE_V0.NARRATIVE,
  DEEP_REASONING: RHIZOH_CONVERSATION_MODE_V0.DEBATE
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function clampDepth(n) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return 2;
  return Math.max(1, Math.min(5, x));
}

/**
 * @param {string} message
 * @returns {string}
 */
function inferIntentFromMessageV0(message) {
  const t = String(message || "").trim().toLowerCase();
  if (!t) return RHIZOH_CONVERSATION_INTENT_V0.REFLECT;
  if (/\b(özet|sonuç|kapan|bitir|toparla|conclude)\b/u.test(t)) {
    return RHIZOH_CONVERSATION_INTENT_V0.CONCLUDE;
  }
  if (/\b(ama|fakat|yanlış|katılm|challenge|neden öyle)\b/u.test(t) || t.includes("?") && t.length > 80) {
    return RHIZOH_CONVERSATION_INTENT_V0.CHALLENGE;
  }
  if (/\?/.test(t)) return RHIZOH_CONVERSATION_INTENT_V0.ASK;
  if (t.length > 220) return RHIZOH_CONVERSATION_INTENT_V0.EXTEND;
  if (/^(selam|merhaba|hey|günaydın|iyi akşam|naber|ne var)\b/u.test(t)) {
    return RHIZOH_CONVERSATION_INTENT_V0.REFLECT;
  }
  return RHIZOH_CONVERSATION_INTENT_V0.EXTEND;
}

/**
 * @param {string} intent
 * @param {string} phase
 * @param {number} userTurnCount
 * @returns {string}
 */
function inferModeFromSignalsV0(intent, phase, userTurnCount) {
  const turns = Math.max(0, Math.floor(Number(userTurnCount) || 0));
  if (intent === RHIZOH_CONVERSATION_INTENT_V0.CONCLUDE) return RHIZOH_CONVERSATION_MODE_V0.SYNTHESIS;
  if (intent === RHIZOH_CONVERSATION_INTENT_V0.CHALLENGE) return RHIZOH_CONVERSATION_MODE_V0.DEBATE;
  if (phase === RHIZOH_CONVERSATION_PHASE.NEW_USER || phase === RHIZOH_CONVERSATION_PHASE.INTRO) {
    return intent === RHIZOH_CONVERSATION_INTENT_V0.ASK
      ? RHIZOH_CONVERSATION_MODE_V0.EXPLORE
      : RHIZOH_CONVERSATION_MODE_V0.GREET;
  }
  if (turns >= 24 && (intent === RHIZOH_CONVERSATION_INTENT_V0.EXTEND || intent === RHIZOH_CONVERSATION_INTENT_V0.ASK)) {
    return RHIZOH_CONVERSATION_MODE_V0.DISCOURSE;
  }
  if (turns >= 12 && intent === RHIZOH_CONVERSATION_INTENT_V0.EXTEND) {
    return RHIZOH_CONVERSATION_MODE_V0.NARRATIVE;
  }
  if (intent === RHIZOH_CONVERSATION_INTENT_V0.ASK) return RHIZOH_CONVERSATION_MODE_V0.EXPLORE;
  if (phase === RHIZOH_CONVERSATION_PHASE.TRUST_BUILD) return RHIZOH_CONVERSATION_MODE_V0.EXPLORE;
  return RHIZOH_CONVERSATION_MODE_V0.EXPLORE;
}

/**
 * @param {string} phase
 * @param {number} userTurnCount
 * @param {boolean} hasNarrativeThread
 */
function continuityStrengthFromSessionV0(phase, userTurnCount, hasNarrativeThread) {
  const turns = Math.max(0, Math.floor(Number(userTurnCount) || 0));
  let base = 0.45;
  if (phase === RHIZOH_CONVERSATION_PHASE.NEW_USER || phase === RHIZOH_CONVERSATION_PHASE.INTRO) base = 0.3;
  else if (phase === RHIZOH_CONVERSATION_PHASE.TRUST_BUILD) base = 0.55;
  else if (phase === RHIZOH_CONVERSATION_PHASE.NORMAL_CHAT || phase === RHIZOH_CONVERSATION_PHASE.POWER_MODE) {
    base = 0.78;
  }
  const turnBoost = Math.min(0.15, turns * 0.008);
  const threadBoost = hasNarrativeThread ? 0.08 : 0;
  return Math.round(clamp01(base + turnBoost + threadBoost) * 1000) / 1000;
}

/**
 * @param {{
 *   message?: string,
 *   conversationPhase?: string,
 *   userTurnCount?: number,
 *   generationModeHint?: string,
 *   conversationMode?: string,
 *   conversationIntent?: string,
 *   depthLevel?: number,
 *   continuityStrength?: number,
 *   voiceTurn?: boolean,
 *   narrativeThread?: Record<string, unknown> | null,
 *   narrativeArc?: Record<string, unknown> | null,
 *   memoryEpisodes?: unknown[],
 *   recentTurns?: Array<{ user?: string, assistant?: string }>,
 *   persona?: { firstName?: string, displayName?: string },
 *   layerMission?: string,
 *   turnIndex?: number,
 *   traceId?: string,
 *   priorStorySnapshot?: Record<string, unknown> | null,
 *   storySnapshot?: Record<string, unknown> | null
 * }} input
 */
export function resolveRhizohConversationDepthV0(input = {}) {
  const generationHint = String(input.generationModeHint || "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  const explicitMode = String(input.conversationMode || "").trim().toLowerCase();
  const intent =
    String(input.conversationIntent || "").trim().toLowerCase() ||
    inferIntentFromMessageV0(input.message);
  const phase = String(input.conversationPhase || RHIZOH_CONVERSATION_PHASE.INTRO);
  const userTurnCount = Math.max(0, Math.floor(Number(input.userTurnCount) || 0));
  const hasThread =
    input.narrativeThread != null && typeof input.narrativeThread === "object" && Object.keys(input.narrativeThread).length > 0;

  let conversationMode =
    explicitMode && Object.values(RHIZOH_CONVERSATION_MODE_V0).includes(explicitMode)
      ? explicitMode
      : inferModeFromSignalsV0(intent, phase, userTurnCount);

  if (!explicitMode && generationHint && LEGACY_GENERATION_TO_MODE_V0[generationHint]) {
    conversationMode = LEGACY_GENERATION_TO_MODE_V0[generationHint];
  }

  const profile =
    RHIZOH_CONVERSATION_MODE_PROFILE_V0[conversationMode] ||
    RHIZOH_CONVERSATION_MODE_PROFILE_V0[RHIZOH_CONVERSATION_MODE_V0.EXPLORE];

  const depthLevel =
    input.depthLevel != null ? clampDepth(input.depthLevel) : profile.depthLevel;
  const continuityStrength =
    input.continuityStrength != null
      ? clamp01(input.continuityStrength)
      : continuityStrengthFromSessionV0(phase, userTurnCount, hasThread);

  const storySnapshot =
    input.storySnapshot && typeof input.storySnapshot === "object"
      ? input.storySnapshot
      : buildStorySnapshotForTurnV0({
          userMessage: input.message,
          priorSnapshot: input.priorStorySnapshot,
          narrativeThread: input.narrativeThread,
          narrativeArc: input.narrativeArc,
          memoryEpisodes: input.memoryEpisodes,
          recentTurns: input.recentTurns,
          conversationPhase: phase,
          conversationMode,
          persona: input.persona,
          layerMission: input.layerMission,
          turnIndex: input.turnIndex,
          traceId: input.traceId
        });

  const storyContinuityGuarantee =
    storySnapshot.storyContinuityGuarantee === true ||
    storyContinuityGuaranteeFromScoreV0(storySnapshot.storyContinuityScore);

  const needsRecall =
    continuityStrength >= 0.62 || depthLevel >= 4 || storyContinuityGuarantee;
  const phraseChunking = Boolean(input.voiceTurn) || depthLevel >= 3;

  const depthDirective = [
    `## Rhizoh conversation depth (primary)`,
    profile.directive,
    `INTENT: ${intent} (ask|challenge|extend|reflect|conclude).`,
    `depthLevel: ${depthLevel}/5 — control thinking depth, not verbosity alone.`,
    `continuityStrength: ${continuityStrength} — ${needsRecall ? "recall prior session facts when relevant." : "light recall; stay in the moment."}`,
    `responseLength (secondary ceiling): ${profile.responseLength}.`,
    phraseChunking
      ? "Structure reply as 2-4 short meaning blocks separated by blank lines (phrase chunks); one idea per block; natural pauses for voice."
      : "Single coherent block is fine when depth is low."
  ].join("\n");

  return Object.freeze({
    schema: "castle.rhizoh.conversation_depth.v0",
    conversationMode,
    conversationIntent: intent,
    depthLevel,
    continuityStrength,
    responseLength: profile.responseLength,
    maxTokensCeiling: profile.maxTokensCeiling,
    needsRecall,
    phraseChunking,
    depthDirective,
    storySnapshot,
    storyContinuityScore: storySnapshot.storyContinuityScore ?? null,
    storyContinuityGuarantee,
    controlMode: storySnapshot.controlMode ?? "soft_prompt_only",
    generationModeHint: generationHint || null
  });
}
