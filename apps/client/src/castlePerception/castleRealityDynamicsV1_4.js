/**
 * Castle Reality Dynamics Engine v1.4 — deformation, not linear blend.
 * Threads reshape each other; attention has inertia; field evolves over time.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_4.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import {
  aggregateInboundInteractionV1_4,
  buildThreadInteractionFieldV1_4
} from "./castleThreadInteractionFieldV1_4.js";
import {
  applyInertiaToShareV1_4,
  tickAttentionInertiaV1_4
} from "./castleAttentionInertiaV1_4.js";

export const CASTLE_REALITY_DYNAMICS_SCHEMA_V1_4 = "castle.reality_dynamics.v1.4";

const NONLINEAR_TEMPERATURE_V1_4 = 1.35;
const MIN_DEFORMED_SHARE_V1_4 = 0.04;

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

/**
 * Nonlinear softmax mix — shares are not commutative linear weights.
 * @param {number[]} logits
 */
function nonlinearNormalizeV1_4(logits) {
  if (!logits.length) return [];
  const max = Math.max(...logits);
  const exp = logits.map((l) => Math.exp((l - max) / NONLINEAR_TEMPERATURE_V1_4));
  const sum = exp.reduce((s, v) => s + v, 0) || 1;
  return exp.map((v) => Number(Math.max(MIN_DEFORMED_SHARE_V1_4, v / sum).toFixed(4)));
}

/**
 * Apply directional interaction deformation to thread nodes.
 * @param {object[]} nodes
 * @param {object} interactionField
 * @param {object} inertia
 */
function deformThreadSharesV1_4(nodes, interactionField, inertia) {
  if (!nodes.length) return Object.freeze([]);

  const edges = interactionField.edges || [];
  /** @type {number[]} */
  const logits = nodes.map((node) => {
    const inbound = aggregateInboundInteractionV1_4(node.threadId, edges);
    let logit = Math.log(Math.max(MIN_DEFORMED_SHARE_V1_4, node.executionShare || node.salience || 0.1));

    logit += inbound.enhances * 0.85;
    logit -= inbound.suppresses * 1.1;
    logit += inbound.reframes * 0.45;
    logit -= inbound.delays * 0.55;

    const inertialShare = applyInertiaToShareV1_4(node.executionShare || 0, inertia, node.topicLabel);
    logit += Math.log(Math.max(MIN_DEFORMED_SHARE_V1_4, inertialShare)) * 0.5;

    return logit;
  });

  const deformedShares = nonlinearNormalizeV1_4(logits);
  const shareSum = deformedShares.reduce((s, v) => s + v, 0) || 1;

  return Object.freeze(
    nodes.map((node, i) => {
      const inbound = aggregateInboundInteractionV1_4(node.threadId, edges);
      const normalizedShare = Number((deformedShares[i] / shareSum).toFixed(4));
      return Object.freeze({
        ...node,
        linearShare: node.executionShare,
        deformedShare: normalizedShare,
        executionShare: normalizedShare,
        inboundInteraction: inbound,
        deformationDelta: Number((normalizedShare - (node.executionShare || 0)).toFixed(4))
      });
    })
  );
}

function buildDeformationGraphV1_4(deformedNodes, interactionField) {
  return Object.freeze({
    schema: "castle.state_deformation_graph.v1.4",
    nodes: Object.freeze(
      deformedNodes.map((n) =>
        Object.freeze({
          threadId: n.threadId,
          topicLabel: n.topicLabel,
          linearShare: n.linearShare,
          deformedShare: n.deformedShare,
          delta: n.deformationDelta
        })
      )
    ),
    interactionEdges: interactionField.edges
  });
}

function remapExecutionSlicesV1_4(slices, deformedNodes, actionPlan) {
  const byId = new Map(deformedNodes.map((n) => [n.threadId, n]));
  return Object.freeze(
    slices.map((slice) => {
      const node = byId.get(slice.threadId);
      const share = node?.deformedShare ?? slice.executionShare;
      return Object.freeze({
        ...slice,
        linearExecutionShare: slice.executionShare,
        executionShare: share,
        speakShare: clamp01(share * (actionPlan.speak ? 1 : 0.3)),
        memoryShare: clamp01(share * (actionPlan.memoryWrite ? 0.5 : 0.15)),
        highlightShare: clamp01(share * (actionPlan.uiHighlight ? 0.4 : 0.1)),
        reframed: (node?.inboundInteraction?.reframes || 0) > 0.15,
        delayed: (node?.inboundInteraction?.delays || 0) > 0.15
      });
    })
  );
}

function deriveDeformedOutputSharesV1_4(deformedNodes, composedPlan, inertia) {
  if (!deformedNodes.length) {
    return Object.freeze({
      speakShare: composedPlan.speakShare,
      memoryShare: composedPlan.memoryShare,
      highlightShare: composedPlan.highlightShare
    });
  }

  const dominant = deformedNodes.reduce((a, b) =>
    b.deformedShare > a.deformedShare ? b : a
  );
  const momentum = inertia.cognitiveMomentum ?? 0.5;
  const speakShare = clamp01(dominant.deformedShare * momentum * (composedPlan.speak ? 1.1 : 0.35));
  const memoryShare = clamp01(
    deformedNodes.reduce((s, n) => s + n.deformedShare * 0.38, 0)
  );
  const highlightShare = clamp01(dominant.deformedShare * 0.48);

  return Object.freeze({ speakShare, memoryShare, highlightShare });
}

/**
 * Deform v1.3 composition through interaction physics + attention inertia.
 * @param {object} composition — output of composeRealityV1_3
 * @param {object} [input]
 */
export function applyRealityDynamicsV1_4(composition, input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const contextualIdentity = composition.contextualIdentity;
  const ownerId = contextualIdentity?.ownerId || input.ownerId || "user_local";

  const inertia = tickAttentionInertiaV1_4({
    ownerId,
    contextLens: contextualIdentity?.contextLens,
    intentWeight: contextualIdentity?.intentWeight,
    momentum: contextualIdentity?.momentum,
    atMs
  });

  const nodes = composition.realityFrame?.threads || [];
  const interactionField = buildThreadInteractionFieldV1_4(nodes);
  const deformedNodes = deformThreadSharesV1_4(nodes, interactionField, inertia);
  const deformationGraph = buildDeformationGraphV1_4(deformedNodes, interactionField);

  const composedPlan = composition.composedPlan || {};
  const outputShares = deriveDeformedOutputSharesV1_4(deformedNodes, composedPlan, inertia);

  let speakShare = outputShares.speakShare;
  let memoryShare = outputShares.memoryShare;
  let highlightShare = outputShares.highlightShare;

  if (!composedPlan.speak) {
    speakShare = composedPlan.backgroundNarrative ? clamp01(Math.min(speakShare, 0.25)) : 0;
  }

  const SPEAK_THRESHOLD = 0.35;
  const BACKGROUND_THRESHOLD = 0.1;

  const deformedSlices = remapExecutionSlicesV1_4(
    composition.realityFrame?.threadExecutionSlices || [],
    deformedNodes,
    composedPlan
  );

  const dominant =
    deformedNodes.length > 0
      ? deformedNodes.reduce((a, b) => (b.deformedShare > a.deformedShare ? b : a))
      : null;

  const deformedPlan = Object.freeze({
    ...composedPlan,
    partialExecution: true,
    dynamicsApplied: true,
    speak: speakShare >= SPEAK_THRESHOLD,
    speakShare: Number(speakShare.toFixed(4)),
    memoryWrite: memoryShare >= 0.15,
    memoryShare: Number(memoryShare.toFixed(4)),
    uiHighlight: highlightShare >= 0.2,
    highlightShare: Number(highlightShare.toFixed(4)),
    backgroundNarrative:
      speakShare >= BACKGROUND_THRESHOLD && speakShare < SPEAK_THRESHOLD,
    dominantThreadId: dominant?.threadId || composedPlan.dominantThreadId,
    laggedContextLens: inertia.laggedLens,
    cognitiveMomentum: inertia.cognitiveMomentum
  });

  const deformedFrame = Object.freeze({
    ...composition.realityFrame,
    schema: CASTLE_REALITY_DYNAMICS_SCHEMA_V1_4,
    threads: deformedNodes,
    threadExecutionSlices: deformedSlices,
    interactionField,
    deformationGraph,
    attentionInertia: inertia,
    linearCompositionWeights: composition.realityFrame?.compositionWeights,
    deformedCompositionWeights: Object.freeze(deformedNodes.map((n) => n.deformedShare)),
    atMs
  });

  logVoiceInfoV0("REALITY_DYNAMICS", {
    threadCount: deformedNodes.length,
    interactionEdges: interactionField.edgeCount,
    laggedLens: inertia.laggedLens,
    contextShiftPending: inertia.contextShiftPending,
    speakShare: deformedPlan.speakShare,
    dominantThread: deformedPlan.dominantThreadId,
    maxDeformationDelta: deformedNodes.reduce(
      (m, n) => Math.max(m, Math.abs(n.deformationDelta || 0)),
      0
    )
  });

  return Object.freeze({
    schema: CASTLE_REALITY_DYNAMICS_SCHEMA_V1_4,
    deformedFrame,
    deformedPlan,
    interactionField,
    attentionInertia: inertia,
    deformationGraph,
    composition,
    contextualIdentity: Object.freeze({
      ...contextualIdentity,
      historyGradient: inertia.historyGradient,
      laggedLens: inertia.laggedLens,
      cognitiveMomentum: inertia.cognitiveMomentum
    })
  });
}

export function getRealityDynamicsSnapshotV1_4() {
  return Object.freeze({
    schema: CASTLE_REALITY_DYNAMICS_SCHEMA_V1_4,
    identity: "real_time_cognition_physics_simulator"
  });
}

/** @internal vitest */
export function __resetRealityDynamicsForTestV1_4() {
  /* inertia reset in its module */
}
