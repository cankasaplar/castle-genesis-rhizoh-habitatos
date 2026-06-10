/**
 * Castle Reality Composition Engine v1.3 — blend multiple realities, not one winner.
 * "Who gets how much reality?" — partial execution, interleaved consciousness.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_3.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import { getActiveThreadsV1_2 } from "./castleConversationThreadV1_2.js";
import { resolveContextualIdentityV1_3 } from "./castleContextualIdentityV1_3.js";
import {
  applyContentionDegradationV1_3,
  buildThreadNodesV1_3,
  computeInterferenceMatrixV1_3,
  getContentionSnapshotV1_3
} from "./castleAttentionContentionV1_3.js";

export const CASTLE_REALITY_COMPOSITION_SCHEMA_V1_3 = "castle.reality_composition.v1.3";

export const OUTPUT_BLEND_MODE_V1_3 = Object.freeze({
  SPEECH_MEMORY_HIGHLIGHT: "speech + memory + highlight",
  BACKGROUND_NARRATIVE: "background_narrative",
  SILENT_OBSERVE: "silent_observe"
});

const SPEAK_THRESHOLD_V1_3 = 0.35;
const BACKGROUND_NARRATIVE_THRESHOLD_V1_3 = 0.1;
const MEMORY_THRESHOLD_V1_3 = 0.15;
const HIGHLIGHT_THRESHOLD_V1_3 = 0.2;

function deriveOutputBlendV1_3(contestedNodes, actionPlan, contextualIdentity) {
  if (!contestedNodes.length) {
    const base = contextualIdentity?.intentWeight ?? 0.5;
    return Object.freeze({
      speakShare: actionPlan.speak ? clamp01(base) : 0,
      memoryShare: actionPlan.memoryWrite ? clamp01(base * 0.6) : 0,
      highlightShare: actionPlan.uiHighlight ? clamp01(base * 0.4) : 0,
      backgroundNarrative: false
    });
  }

  const dominant = contestedNodes.reduce((a, b) =>
    b.executionShare > a.executionShare ? b : a
  , contestedNodes[0]);
  const speakShare = clamp01(dominant.executionShare * (contextualIdentity?.momentum ?? 0.5));
  const memoryShare = clamp01(
    contestedNodes.reduce((s, n) => s + n.executionShare * 0.35, 0)
  );
  const highlightShare = clamp01(dominant.executionShare * 0.45);

  return Object.freeze({
    speakShare,
    memoryShare,
    highlightShare,
    backgroundNarrative:
      speakShare >= BACKGROUND_NARRATIVE_THRESHOLD_V1_3 && speakShare < SPEAK_THRESHOLD_V1_3
  });
}

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function buildThreadExecutionSlicesV1_3(contestedNodes, actionPlan) {
  return Object.freeze(
    contestedNodes.map((n) =>
      Object.freeze({
        threadId: n.threadId,
        ownerId: n.ownerId,
        topicLabel: n.topicLabel,
        executionShare: n.executionShare,
        speakShare: clamp01(n.executionShare * (actionPlan.speak ? 1 : 0.3)),
        memoryShare: clamp01(n.executionShare * (actionPlan.memoryWrite ? 0.5 : 0.15)),
        highlightShare: clamp01(n.executionShare * (actionPlan.uiHighlight ? 0.4 : 0.1)),
        interferenceWeight: n.interferenceWeight
      })
    )
  );
}

/**
 * Compose blended reality frame from active threads + ingress context.
 * @param {object} input
 */
export function composeRealityV1_3(input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const actionPlan = input.actionPlan || {};
  const contextualIdentity = resolveContextualIdentityV1_3(input.identityEvent, {
    ...input,
    ownerId: input.ownerId || input.identityEvent?.ownerId,
    threadId: input.identityEvent?.threadId,
    atMs
  });

  let activeThreads = getActiveThreadsV1_2();
  const ingressThreadId = input.identityEvent?.threadId;
  if (ingressThreadId && !activeThreads.some((t) => t.threadId === ingressThreadId)) {
    activeThreads = Object.freeze([
      ...activeThreads,
      Object.freeze({
        threadId: ingressThreadId,
        ownerId: input.identityEvent?.ownerId || "user_local",
        topicLabel: input.topicLabel || "general",
        priority: 60,
        lastActivityMs: atMs,
        active: true
      })
    ]);
  }

  const rawNodes = buildThreadNodesV1_3(activeThreads, atMs);
  const interference = computeInterferenceMatrixV1_3(rawNodes);
  const contestedNodes = applyContentionDegradationV1_3(rawNodes, interference, {
    contextualIdentity
  });

  const compositionWeights = Object.freeze(contestedNodes.map((n) => n.executionShare));
  const outputBlend = deriveOutputBlendV1_3(contestedNodes, actionPlan, contextualIdentity);
  const threadExecutionSlices = buildThreadExecutionSlicesV1_3(contestedNodes, actionPlan);

  let speakShare = outputBlend.speakShare;
  let memoryShare = outputBlend.memoryShare;
  let highlightShare = outputBlend.highlightShare;
  let backgroundNarrative = outputBlend.backgroundNarrative;

  if (input.roomArbitration?.disposition === "defer") {
    speakShare = clamp01(speakShare * 0.12);
    backgroundNarrative = speakShare >= BACKGROUND_NARRATIVE_THRESHOLD_V1_3;
    memoryShare = clamp01(memoryShare * 0.5);
  }

  if (!actionPlan.speak) {
    speakShare = actionPlan.backgroundNarrative
      ? clamp01(Math.min(speakShare, 0.25))
      : 0;
    backgroundNarrative = speakShare >= BACKGROUND_NARRATIVE_THRESHOLD_V1_3;
  }

  const dominant =
    contestedNodes.length > 0
      ? contestedNodes.reduce((a, b) => (b.executionShare > a.executionShare ? b : a))
      : null;

  const composedPlan = Object.freeze({
    ...actionPlan,
    partialExecution: true,
    speak: speakShare >= SPEAK_THRESHOLD_V1_3,
    speakShare: Number(speakShare.toFixed(4)),
    memoryWrite: memoryShare >= MEMORY_THRESHOLD_V1_3,
    memoryShare: Number(memoryShare.toFixed(4)),
    uiHighlight: highlightShare >= HIGHLIGHT_THRESHOLD_V1_3,
    highlightShare: Number(highlightShare.toFixed(4)),
    backgroundNarrative,
    shadowWrite: actionPlan.shadowWrite && speakShare < SPEAK_THRESHOLD_V1_3,
    compositionWeights,
    contextualId: contextualIdentity.contextualId,
    dominantThreadId: dominant?.threadId || ingressThreadId || null
  });

  const blendMode =
    speakShare >= SPEAK_THRESHOLD_V1_3
      ? OUTPUT_BLEND_MODE_V1_3.SPEECH_MEMORY_HIGHLIGHT
      : backgroundNarrative
        ? OUTPUT_BLEND_MODE_V1_3.BACKGROUND_NARRATIVE
        : OUTPUT_BLEND_MODE_V1_3.SILENT_OBSERVE;

  const realityFrame = Object.freeze({
    schema: CASTLE_REALITY_COMPOSITION_SCHEMA_V1_3,
    threads: contestedNodes,
    compositionWeights,
    interferenceMatrix: interference.matrix,
    threadExecutionSlices,
    outputBlend: blendMode,
    contextualIdentity,
    atMs
  });

  logVoiceInfoV0("REALITY_COMPOSITION", {
    blendMode,
    threadCount: contestedNodes.length,
    speakShare: composedPlan.speakShare,
    memoryShare: composedPlan.memoryShare,
    dominantThread: composedPlan.dominantThreadId,
    contextualId: contextualIdentity.contextualId
  });

  return Object.freeze({
    schema: CASTLE_REALITY_COMPOSITION_SCHEMA_V1_3,
    realityFrame,
    composedPlan,
    contextualIdentity,
    contention: getContentionSnapshotV1_3(contestedNodes, interference)
  });
}

export function getRealityCompositionSnapshotV1_3() {
  return Object.freeze({
    schema: CASTLE_REALITY_COMPOSITION_SCHEMA_V1_3,
    identity: "perceptual_reality_compositor"
  });
}

/** @internal vitest */
export function __resetRealityCompositionForTestV1_3() {
  /* contextual + thread resets in their modules */
}
