/**
 * Castle Reality Stability Governor v1.5.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_5.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import {
  applyLearnedInteractionV1_5,
  observeInteractionOutcomeV1_5
} from "./castleAdaptiveInteractionV1_5.js";
import {
  applyVectorResistanceV1_5,
  buildInertiaVectorFieldV1_5
} from "./castleInertiaVectorFieldV1_5.js";
import { computeRealityPhaseV1_5, REALITY_PHASE_V1_5 } from "./castleRealityPhaseEngineV1_5.js";

export const CASTLE_REALITY_STABILITY_SCHEMA_V1_5 = "castle.reality_stability.v1.5";

const VOLATILITY_WINDOW_V1_5 = 8;
/** @type {Map<string, number[]>} */
const volatilityRingV1_5 = new Map();
/** @type {Map<string, object>} */
const freezeSnapshotByOwnerV1_5 = new Map();

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function recordVolatilityV1_5(ownerId, delta) {
  if (!volatilityRingV1_5.has(ownerId)) volatilityRingV1_5.set(ownerId, []);
  const ring = volatilityRingV1_5.get(ownerId);
  ring.push(Math.abs(delta));
  if (ring.length > VOLATILITY_WINDOW_V1_5) ring.shift();
  const mean = ring.reduce((s, v) => s + v, 0) / ring.length;
  const variance = ring.reduce((s, v) => s + (v - mean) ** 2, 0) / ring.length;
  return Number(clamp01(Math.sqrt(variance) * 2 + mean).toFixed(4));
}

function stabilizeSharesV1_5(nodes, phaseState, vectorField, priorSnapshot) {
  if (phaseState.freezeFrame && priorSnapshot?.shares) {
    return Object.freeze(
      nodes.map((n) => {
        const frozen = priorSnapshot.shares[n.threadId] ?? n.deformedShare ?? n.executionShare;
        return Object.freeze({
          ...n,
          stabilizedShare: frozen,
          executionShare: frozen,
          deformedShare: frozen,
          frozen: true
        });
      })
    );
  }

  return Object.freeze(
    nodes.map((n) => {
      const base = n.deformedShare ?? n.executionShare ?? 0;
      const linear = n.linearShare ?? base;
      const resisted = applyVectorResistanceV1_5(base, vectorField, n.topicLabel);
      const blended = Number(
        clamp01(linear * (1 - phaseState.deformationScale) + resisted * phaseState.deformationScale).toFixed(4)
      );
      return Object.freeze({
        ...n,
        stabilizedShare: blended,
        executionShare: blended,
        deformedShare: blended,
        frozen: false
      });
    })
  );
}

function normalizeSharesV1_5(nodes) {
  const sum = nodes.reduce((s, n) => s + (n.stabilizedShare ?? n.executionShare ?? 0), 0) || 1;
  return Object.freeze(
    nodes.map((n) => {
      const share = Number(((n.stabilizedShare ?? n.executionShare) / sum).toFixed(4));
      return Object.freeze({ ...n, stabilizedShare: share, executionShare: share, deformedShare: share });
    })
  );
}

function deriveStabilizedOutputV1_5(nodes, deformedPlan, phaseState) {
  if (!nodes.length) {
    return Object.freeze({
      speakShare: deformedPlan.speakShare,
      memoryShare: deformedPlan.memoryShare,
      highlightShare: deformedPlan.highlightShare
    });
  }
  const dominant = nodes.reduce((a, b) =>
    (b.stabilizedShare ?? 0) > (a.stabilizedShare ?? 0) ? b : a
  );
  const damp = phaseState.phase === REALITY_PHASE_V1_5.STABLE ? 0.85 : 1;
  const speakShare = clamp01((dominant.stabilizedShare ?? 0) * (deformedPlan.speak ? 1.05 : 0.35) * damp);
  const memoryShare = clamp01(nodes.reduce((s, n) => s + (n.stabilizedShare ?? 0) * 0.36, 0));
  const highlightShare = clamp01((dominant.stabilizedShare ?? 0) * 0.46);
  return Object.freeze({ speakShare, memoryShare, highlightShare });
}

export function applyRealityStabilityV1_5(dynamics, input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const ownerId = String(input.ownerId || dynamics.contextualIdentity?.ownerId || "user_local");
  const deformedPlan = dynamics.deformedPlan || {};
  const deformedFrame = dynamics.deformedFrame || {};
  const nodes = [...(deformedFrame.threads || [])];

  const maxDeformationDelta = nodes.reduce(
    (m, n) => Math.max(m, Math.abs(n.deformationDelta || 0)),
    0
  );
  const volatility = recordVolatilityV1_5(ownerId, maxDeformationDelta);

  const inertia = dynamics.attentionInertia || {};
  const userIntentBoost = clamp01(
    input.userInitiated ? 0.85 : input.intentWeight ?? inertia.laggedIntentWeight ?? 0.5
  );

  const vectorField = buildInertiaVectorFieldV1_5({
    laggedLens: inertia.laggedLens,
    currentLens: inertia.currentLens,
    cognitiveMomentum: inertia.cognitiveMomentum,
    inertiaFactor: inertia.inertiaFactor,
    userIntentBoost,
    intentWeight: userIntentBoost
  });

  const learnedEdges = (dynamics.interactionField?.edges || []).map((edge) =>
    applyLearnedInteractionV1_5(edge, {
      userIntentBoost,
      invertSuppresses: volatility > 0.55 && userIntentBoost > 0.6
    })
  );

  const phaseState = computeRealityPhaseV1_5({
    atMs,
    volatility,
    maxDeformationDelta,
    contextShiftPending: inertia.contextShiftPending,
    userInitiated: input.userInitiated,
    emergency: input.emergency || deformedPlan.mode === "emergency",
    dominantThreadStable: maxDeformationDelta < 0.12 && volatility < 0.25
  });

  const priorSnapshot = freezeSnapshotByOwnerV1_5.get(ownerId);
  let stabilizedNodes = stabilizeSharesV1_5(nodes, phaseState, vectorField, priorSnapshot);
  stabilizedNodes = normalizeSharesV1_5(stabilizedNodes);

  const outputShares = deriveStabilizedOutputV1_5(stabilizedNodes, deformedPlan, phaseState);
  let speakShare = outputShares.speakShare;
  let memoryShare = outputShares.memoryShare;
  let highlightShare = outputShares.highlightShare;

  if (!deformedPlan.speak) {
    speakShare = deformedPlan.backgroundNarrative ? clamp01(Math.min(speakShare, 0.25)) : 0;
  }

  const SPEAK_THRESHOLD = 0.35;
  const BACKGROUND_THRESHOLD = 0.1;

  const dominant = stabilizedNodes.reduce(
    (a, b) => ((b.stabilizedShare ?? 0) > (a.stabilizedShare ?? 0) ? b : a),
    stabilizedNodes[0]
  );

  const stabilizedPlan = Object.freeze({
    ...deformedPlan,
    stabilityApplied: true,
    phase: phaseState.phase,
    speak: speakShare >= SPEAK_THRESHOLD,
    speakShare: Number(speakShare.toFixed(4)),
    memoryWrite: memoryShare >= 0.15,
    memoryShare: Number(memoryShare.toFixed(4)),
    uiHighlight: highlightShare >= 0.2,
    highlightShare: Number(highlightShare.toFixed(4)),
    backgroundNarrative: speakShare >= BACKGROUND_THRESHOLD && speakShare < SPEAK_THRESHOLD,
    dominantThreadId: dominant?.threadId || deformedPlan.dominantThreadId,
    stabilityScore: phaseState.stabilityScore,
    volatility
  });

  const shareMap = Object.fromEntries(
    stabilizedNodes.map((n) => [n.threadId, n.stabilizedShare])
  );
  if (phaseState.phase === REALITY_PHASE_V1_5.LOCKED || phaseState.phase === REALITY_PHASE_V1_5.STABLE) {
    freezeSnapshotByOwnerV1_5.set(ownerId, Object.freeze({ shares: Object.freeze(shareMap), atMs }));
  }

  if (phaseState.learningEnabled && learnedEdges.length) {
    const topEdge = learnedEdges.find((e) => e.suppresses > 0.2) || learnedEdges[0];
    observeInteractionOutcomeV1_5({
      fromTopic: topEdge.fromTopic,
      toTopic: topEdge.toTopic,
      userIntentBoost,
      volatility,
      dominantShift: maxDeformationDelta > 0.15
    });
  }

  const stabilizedFrame = Object.freeze({
    ...deformedFrame,
    schema: CASTLE_REALITY_STABILITY_SCHEMA_V1_5,
    threads: stabilizedNodes,
    learnedInteractionField: Object.freeze({ edges: Object.freeze(learnedEdges) }),
    inertiaVectorField: vectorField,
    phase: phaseState,
    stabilizedCompositionWeights: Object.freeze(stabilizedNodes.map((n) => n.stabilizedShare)),
    freezeResume: Object.freeze({
      frozen: phaseState.freezeFrame,
      snapshotAgeMs: priorSnapshot ? atMs - priorSnapshot.atMs : null,
      canResume: phaseState.phase !== REALITY_PHASE_V1_5.LOCKED || input.userInitiated === true
    }),
    atMs
  });

  logVoiceInfoV0("REALITY_STABILITY", {
    phase: phaseState.phase,
    stabilityScore: phaseState.stabilityScore,
    volatility,
    speakShare: stabilizedPlan.speakShare,
    transitionResistance: vectorField.transitionResistance,
    freezeFrame: phaseState.freezeFrame,
    dominantThread: stabilizedPlan.dominantThreadId
  });

  return Object.freeze({
    schema: CASTLE_REALITY_STABILITY_SCHEMA_V1_5,
    stabilizedPlan,
    stabilizedFrame,
    phase: phaseState,
    inertiaVectorField: vectorField,
    volatility,
    dynamics
  });
}

export function resumeRealityContextV1_5(ownerId) {
  freezeSnapshotByOwnerV1_5.delete(String(ownerId));
  return Object.freeze({ resumed: true, ownerId: String(ownerId) });
}

export function getStabilitySnapshotV1_5() {
  return Object.freeze({
    schema: CASTLE_REALITY_STABILITY_SCHEMA_V1_5,
    identity: "reality_stability_governor"
  });
}

/** @internal vitest */
export function __resetRealityStabilityForTestV1_5() {
  volatilityRingV1_5.clear();
  freezeSnapshotByOwnerV1_5.clear();
}
