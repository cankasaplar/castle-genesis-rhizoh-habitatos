/**
 * Rhizoh Cross-Layer Awareness Graph (CLAG) v0 — RESEARCH-ONLY observability + read-side memory hints.
 * Unifies: conversation · narrative · studio · spiral · real_life · academy · depth · social.
 * Does NOT mutate execution unless VITE_RHIZOH_CLAG_MEMORY_SHAPING=1 (experimental).
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  isInfluenceFeedbackToCognitionEnabledV0,
  RHIZOH_OBSERVATION_EXECUTION_BOUNDARY_V0
} from "./rhizohInfluenceObservabilityFirewallV0.js";
import {
  CLAG_EDGE_KIND_V0,
  CLAG_NODE_KIND_V0,
  RHIZOH_CLAG_SCHEMA_V0
} from "./rhizohClagTypesV0.js";
import {
  CLAG_TRAVERSAL_PROFILE_V0,
  runClagTraversalPolicyV0
} from "./rhizohClagTraversalPolicyV0.js";
import { allocateBoundedEmergenceV0 } from "./rhizohClagBoundedEmergenceAllocatorV0.js";
import { applyTemporalBeaV0, resetTemporalBeaStateV0 } from "./rhizohClagTemporalBeaV0.js";
import { buildPhaseCouplingGraphV0 } from "./rhizohClagPhaseCouplingGraphV0.js";
import {
  persistInterPhaseMemoryV0,
  resetInterPhaseMemoryV0
} from "./rhizohClagInterPhaseMemoryV0.js";
import { applySemanticForgettingRegulatorV0 } from "./rhizohClagSemanticForgettingRegulatorV0.js";
import { resetRuntimeStabilityLayerV0 } from "./rhizohRuntimeStabilityLayerV0.js";
import { resetRhizohGlobalMeaningEngineV0 } from "./rhizohGlobalMeaningEngineV0.js";
import {
  CLAG_NODE_REGISTRY_ROLE_V0,
  CLAG_REGISTRY_SCOPE_V0,
  CLAG_SIMULATION_NODE_ID_V0,
  filterClagGraphToActiveRuntimeV0,
  getClagActiveNodeRegistryV0,
  isClagSimulationGeographicAnchorIdV0,
  resolveClagPrimaryActiveSovereignNodeV0
} from "./rhizohClagNodeRegistryV0.js";

export { CLAG_EDGE_KIND_V0, CLAG_NODE_KIND_V0, RHIZOH_CLAG_SCHEMA_V0 };

const MAX_NODES = 96;
const MAX_EDGES = 160;

/** @type {Map<string, { id: string, kind: string, label: string, atMs: number, traceId: string | null, meta: Record<string, unknown> }>} */
const nodesById = new Map();
/** @type {Array<{ id: string, from: string, to: string, kind: string, weight: number, label: string }>} */
const edges = [];

let sessionId = null;
let lastTraceId = null;
let graphRevision = 0;
let lastTraversalProfile = CLAG_TRAVERSAL_PROFILE_V0.LLM_TURN;
let lastAttemptedGeographicAnchor = null;

/**
 * @returns {boolean}
 */
export function isClagMemoryShapingEnabledV0() {
  try {
    return String(import.meta.env?.VITE_RHIZOH_CLAG_MEMORY_SHAPING || "") === "1";
  } catch {
    return false;
  }
}

function nodeId(kind, suffix) {
  return `${kind}:${String(suffix || "default").slice(0, 48)}`;
}

function pruneGraphV0() {
  if (nodesById.size <= MAX_NODES) return;
  const sorted = [...nodesById.values()].sort((a, b) => a.atMs - b.atMs);
  const drop = sorted.slice(0, sorted.length - MAX_NODES);
  for (const n of drop) nodesById.delete(n.id);
  while (edges.length > MAX_EDGES) edges.shift();
}

/**
 * @param {{ kind: string, suffix?: string, label: string, traceId?: string, meta?: Record<string, unknown> }} input
 */
export function upsertClagNodeV0(input) {
  const kind = String(input.kind || "unknown").slice(0, 32);
  const id = nodeId(kind, input.suffix || "main");
  const existing = nodesById.get(id);
  const atMs = Date.now();
  nodesById.set(
    id,
    Object.freeze({
      id,
      kind,
      label: String(input.label || kind).slice(0, 200),
      atMs: existing?.atMs ?? atMs,
      traceId: input.traceId ? String(input.traceId).slice(0, 128) : null,
      meta: Object.freeze(input.meta && typeof input.meta === "object" ? input.meta : {})
    })
  );
  pruneGraphV0();
  return id;
}

/**
 * @param {{ from: string, to: string, kind?: string, weight?: number, label?: string }} input
 */
export function addClagEdgeV0(input) {
  const from = String(input.from || "");
  const to = String(input.to || "");
  if (!from || !to || !nodesById.has(from) || !nodesById.has(to)) return null;
  const edge = Object.freeze({
    id: `e:${edges.length}:${from}->${to}`,
    from,
    to,
    kind: String(input.kind || CLAG_EDGE_KIND_V0.INFLUENCES).slice(0, 24),
    weight: Math.max(0, Math.min(1, Number(input.weight) || 0.5)),
    label: String(input.label || "").slice(0, 120)
  });
  edges.push(edge);
  if (edges.length > MAX_EDGES) edges.shift();
  return edge.id;
}

/**
 * @param {{
 *   traceId?: string,
 *   sessionId?: string,
 *   conversationPhase?: string,
 *   layerSpec?: { id?: number, code?: string },
 *   pathname?: string,
 *   conversationDepth?: Record<string, unknown> | null,
 *   storySnapshot?: Record<string, unknown> | null,
 *   turnInfluencePre?: Record<string, unknown> | null,
 *   spiralAgreement?: Record<string, unknown> | null,
 *   geographicAnchor?: string | null,
 *   studioEventType?: string | null,
 *   socialPulse?: Record<string, unknown> | null,
 *   traversalProfile?: string,
 *   persona?: { firstName?: string, displayName?: string },
 *   calibrationAnchorReference?: string | null
 * }} ctx
 */
export function ingestClagTurnContextV0(ctx = {}) {
  lastTraceId = ctx.traceId ? String(ctx.traceId).slice(0, 128) : lastTraceId;
  sessionId = ctx.sessionId ? String(ctx.sessionId).slice(0, 128) : sessionId;
  if (ctx.traversalProfile) {
    lastTraversalProfile = String(ctx.traversalProfile).slice(0, 48);
  }
  lastAttemptedGeographicAnchor = ctx.geographicAnchor ?? ctx.calibrationAnchorReference ?? null;
  graphRevision += 1;

  const primarySovereign = resolveClagPrimaryActiveSovereignNodeV0({
    persona: ctx.persona,
    pathname: ctx.pathname,
    geographicAnchor: ctx.geographicAnchor
  });

  const layerMeta = Object.freeze({ registryScope: CLAG_REGISTRY_SCOPE_V0.LAYER_META });

  const nConv = upsertClagNodeV0({
    kind: CLAG_NODE_KIND_V0.CONVERSATION,
    suffix: ctx.conversationPhase || "phase",
    label: `phase:${ctx.conversationPhase || "unknown"}`,
    traceId: lastTraceId,
    meta: { ...layerMeta, phase: ctx.conversationPhase ?? null }
  });

  const depth = ctx.conversationDepth && typeof ctx.conversationDepth === "object" ? ctx.conversationDepth : {};
  const nDepth = upsertClagNodeV0({
    kind: CLAG_NODE_KIND_V0.DEPTH,
    suffix: depth.conversationMode || "mode",
    label: `depth:${depth.conversationMode || "?"} L${depth.depthLevel ?? "?"}`,
    traceId: lastTraceId,
    meta: {
      ...layerMeta,
      conversationMode: depth.conversationMode ?? null,
      depthLevel: depth.depthLevel ?? null,
      continuityStrength: depth.continuityStrength ?? null
    }
  });

  const snap = ctx.storySnapshot && typeof ctx.storySnapshot === "object" ? ctx.storySnapshot : null;
  const nNarr = upsertClagNodeV0({
    kind: CLAG_NODE_KIND_V0.NARRATIVE,
    suffix: "story",
    label: snap?.whatHappenedLast ? String(snap.whatHappenedLast).slice(0, 80) : "no_scene",
    traceId: lastTraceId,
    meta: {
      ...layerMeta,
      storyContinuityScore: snap?.storyContinuityScore ?? null,
      openThreads: Array.isArray(snap?.unresolvedThreads) ? snap.unresolvedThreads.length : 0
    }
  });

  const layerId = Number(ctx.layerSpec?.id);
  const path = String(ctx.pathname || "");
  const studioActive = path.startsWith("/studio") || layerId === 5 || layerId === 11;
  const nStudio = upsertClagNodeV0({
    kind: CLAG_NODE_KIND_V0.STUDIO,
    suffix: studioActive ? "active" : "idle",
    label: studioActive ? `studio:${ctx.studioEventType || path || "focus"}` : "studio:idle",
    traceId: lastTraceId,
    meta: { ...layerMeta, pathname: path || null, layerId: Number.isFinite(layerId) ? layerId : null }
  });

  const spiral = ctx.spiralAgreement && typeof ctx.spiralAgreement === "object" ? ctx.spiralAgreement : null;
  const spiralOn = Boolean(spiral?.agreementLayer || spiral?.meshPhase);
  const nSpiral = upsertClagNodeV0({
    kind: CLAG_NODE_KIND_V0.SPIRAL,
    suffix: spiralOn ? "on" : "off",
    label: spiralOn ? `spiral:${spiral.meshPhase || spiral.phase || "mesh"}` : "spiral:closed",
    traceId: lastTraceId,
    meta: { ...layerMeta, agreementLayer: spiral?.agreementLayer === true }
  });

  /** Active runtime sovereign nodes only (Metehan Ankara + Beşiktaş Serencebey). */
  const activeSovereignIds = [];
  for (const sovereign of getClagActiveNodeRegistryV0()) {
    const suffix = sovereign.id.replace(/^clag_node:/, "");
    const id = upsertClagNodeV0({
      kind: CLAG_NODE_KIND_V0.REAL_LIFE,
      suffix,
      label: sovereign.label,
      traceId: lastTraceId,
      meta: Object.freeze({
        registryScope: CLAG_REGISTRY_SCOPE_V0.SOVEREIGN,
        registryId: sovereign.id,
        registryRole: CLAG_NODE_REGISTRY_ROLE_V0.ACTIVE_RUNTIME,
        anchor: sovereign.geographicAnchorId,
        placeLabel: sovereign.placeLabel,
        lat: sovereign.lat,
        lon: sovereign.lon,
        isPrimary: primarySovereign?.id === sovereign.id
      })
    });
    activeSovereignIds.push(id);
  }

  const nRealPrimary =
    activeSovereignIds.find((id) => {
      const n = nodesById.get(id);
      return n?.meta?.isPrimary === true;
    }) || activeSovereignIds[0];

  if (
    ctx.calibrationAnchorReference &&
    isClagSimulationGeographicAnchorIdV0(ctx.calibrationAnchorReference)
  ) {
    upsertClagNodeV0({
      kind: CLAG_NODE_KIND_V0.REAL_LIFE,
      suffix: CLAG_SIMULATION_NODE_ID_V0.SARIYER_CALIBRATION.replace(/^clag_node:/, ""),
      label: "Sarıyer (simulation/calibration)",
      traceId: lastTraceId,
      meta: Object.freeze({
        registryScope: CLAG_REGISTRY_SCOPE_V0.SOVEREIGN,
        registryId: CLAG_SIMULATION_NODE_ID_V0.SARIYER_CALIBRATION,
        registryRole: CLAG_NODE_REGISTRY_ROLE_V0.SIMULATION_CALIBRATION,
        anchor: ctx.calibrationAnchorReference,
        designTimeOnly: true
      })
    });
  }

  const inf = ctx.turnInfluencePre && typeof ctx.turnInfluencePre === "object" ? ctx.turnInfluencePre : null;
  const nInf = upsertClagNodeV0({
    kind: CLAG_NODE_KIND_V0.INFLUENCE,
    suffix: inf?.dominantShaper || "shaper",
    label: `shaper:${inf?.dominantShaper || "?"}`,
    traceId: lastTraceId,
    meta: { ...layerMeta, shapingAnswer: inf?.shapingAnswer ?? null }
  });

  const academyActive = layerId === 11;
  const nAcad = upsertClagNodeV0({
    kind: CLAG_NODE_KIND_V0.ACADEMY,
    suffix: academyActive ? "L11" : "passive",
    label: academyActive ? "academy:L11_focus" : "academy:passive",
    traceId: lastTraceId,
    meta: { ...layerMeta }
  });

  if (ctx.socialPulse && typeof ctx.socialPulse === "object") {
    upsertClagNodeV0({
      kind: CLAG_NODE_KIND_V0.SOCIAL,
      suffix: "pulse",
      label: `social:${ctx.socialPulse.mode || "field"}`,
      traceId: lastTraceId,
      meta: ctx.socialPulse
    });
  }

  addClagEdgeV0({ from: nDepth, to: nConv, kind: CLAG_EDGE_KIND_V0.INFLUENCES, weight: 0.85, label: "depth_modes_conversation" });
  addClagEdgeV0({ from: nNarr, to: nConv, kind: CLAG_EDGE_KIND_V0.SHAPES_MEMORY, weight: 0.7, label: "story_shapes_dialogue" });
  addClagEdgeV0({ from: nStudio, to: nNarr, kind: CLAG_EDGE_KIND_V0.INFLUENCES, weight: studioActive ? 0.55 : 0.1, label: "studio_decision_narrative" });
  if (nRealPrimary) {
    addClagEdgeV0({
      from: nSpiral,
      to: nRealPrimary,
      kind: CLAG_EDGE_KIND_V0.MAPS_TO,
      weight: spiralOn ? 0.6 : 0.05,
      label: "spiral_maps_real_life"
    });
    addClagEdgeV0({
      from: nRealPrimary,
      to: nNarr,
      kind: CLAG_EDGE_KIND_V0.MAPS_TO,
      weight: 0.45,
      label: "geo_grounds_scene"
    });
  }
  addClagEdgeV0({ from: nInf, to: nDepth, kind: CLAG_EDGE_KIND_V0.PROPAGATES, weight: 0.5, label: "measured_shaper_depth" });
  addClagEdgeV0({ from: nAcad, to: nStudio, kind: CLAG_EDGE_KIND_V0.PROPAGATES, weight: academyActive ? 0.4 : 0, label: "academy_studio_path" });
  addClagEdgeV0({ from: nConv, to: nNarr, kind: CLAG_EDGE_KIND_V0.SHAPES_MEMORY, weight: 0.65, label: "conversation_episodic_thread" });

  return buildRhizohCrossLayerAwarenessGraphV0();
}

/**
 * @returns {Readonly<{
 *   schema: string,
 *   sessionId: string | null,
 *   traceId: string | null,
 *   revision: number,
 *   nodes: readonly object[],
 *   edges: readonly object[],
 *   layerVisibility: Record<string, unknown>,
 *   memoryShapingHints: Record<string, unknown>
 * }>}
 */
export function buildRhizohCrossLayerAwarenessGraphV0() {
  const nodeList = [...nodesById.values()].sort((a, b) => b.atMs - a.atMs);
  const edgeSlice = edges.slice(-48);
  const runtimeView = filterClagGraphToActiveRuntimeV0({
    nodes: nodeList,
    edges: edgeSlice,
    attemptedGeographicAnchor: lastAttemptedGeographicAnchor
  });
  const activeNodes = [...runtimeView.nodes];
  const activeEdges = [...runtimeView.edges];
  const layerVisibility = summarizeClagLayerVisibilityV0(activeNodes, activeEdges);
  const traversalPlan = runClagTraversalPolicyV0({
    nodes: activeNodes,
    edges: activeEdges,
    traversalProfile: lastTraversalProfile
  });
  const memoryShapingHints = deriveClagMemoryShapingHintsV0(activeNodes, activeEdges, traversalPlan);
  const boundedEmergence = applyTemporalBeaV0(
    allocateBoundedEmergenceV0({
      nodes: activeNodes,
      edges: activeEdges,
      traversalPlan,
      graphContamination: runtimeView.graphContamination,
      activeSovereignNodeCount: runtimeView.activeSovereignNodeCount
    }),
    { sessionId, traceId: lastTraceId, revision: graphRevision }
  );
  const phaseCouplingGraph = buildPhaseCouplingGraphV0({
    boundedEmergence,
    nodes: activeNodes,
    activeNodeRegistry: runtimeView.activeNodeRegistry
  });
  const interPhaseMemory = applySemanticForgettingRegulatorV0(
    persistInterPhaseMemoryV0({
      sessionId,
      traceId: lastTraceId,
      revision: graphRevision,
      phaseCouplingGraph,
      boundedEmergence,
      memoryShapingHints,
      graphContamination: runtimeView.graphContamination
    }),
    { sessionId, graphContamination: runtimeView.graphContamination }
  );

  return Object.freeze({
    schema: RHIZOH_CLAG_SCHEMA_V0,
    boundary: RHIZOH_OBSERVATION_EXECUTION_BOUNDARY_V0,
    sessionId,
    traceId: lastTraceId,
    revision: graphRevision,
    nodeCount: activeNodes.length,
    edgeCount: activeEdges.length,
    activeSovereignNodeCount: runtimeView.activeSovereignNodeCount,
    nodes: Object.freeze(activeNodes.slice(0, 32)),
    edges: Object.freeze(activeEdges),
    fullNodeRegistry: runtimeView.fullNodeRegistry,
    activeNodeRegistry: runtimeView.activeNodeRegistry,
    fullNodes: runtimeView.fullNodes,
    fullEdges: runtimeView.fullEdges,
    graphContamination: runtimeView.graphContamination,
    layerVisibility,
    traversalPlan,
    boundedEmergence,
    phaseCouplingGraph,
    interPhaseMemory,
    semanticForgetting: interPhaseMemory.semanticForgetting,
    memoryShapingHints
  });
}

/**
 * @param {object[]} nodeList
 * @param {object[]} edgeList
 */
function summarizeClagLayerVisibilityV0(nodeList, edgeList) {
  const byKind = {};
  for (const k of Object.values(CLAG_NODE_KIND_V0)) {
    byKind[k] = { active: false, edgeIn: 0, edgeOut: 0 };
  }
  for (const n of nodeList) {
    if (byKind[n.kind]) byKind[n.kind].active = true;
  }
  for (const e of edgeList) {
    const fromN = nodesById.get(e.from);
    const toN = nodesById.get(e.to);
    if (fromN && byKind[fromN.kind]) byKind[fromN.kind].edgeOut += 1;
    if (toN && byKind[toN.kind]) byKind[toN.kind].edgeIn += 1;
  }
  return Object.freeze(byKind);
}

/**
 * Read-side hints for story / continuity (applied only when CLAG memory shaping flag on).
 * @param {object[]} nodeList
 * @param {object[]} edgeList
 * @param {ReturnType<typeof runClagTraversalPolicyV0>} [traversalPlan]
 */
export function deriveClagMemoryShapingHintsV0(nodeList, edgeList, traversalPlan = null) {
  const narrative = nodeList.find((n) => n.kind === CLAG_NODE_KIND_V0.NARRATIVE);
  const realLifeNodes = nodeList.filter(
    (n) =>
      n.kind === CLAG_NODE_KIND_V0.REAL_LIFE &&
      n.meta?.registryRole === CLAG_NODE_REGISTRY_ROLE_V0.ACTIVE_RUNTIME
  );
  const realLife = realLifeNodes.find((n) => n.meta?.isPrimary) || realLifeNodes[0];
  const studio = nodeList.find((n) => n.kind === CLAG_NODE_KIND_V0.STUDIO);
  const spiral = nodeList.find((n) => n.kind === CLAG_NODE_KIND_V0.SPIRAL);
  const depth = nodeList.find((n) => n.kind === CLAG_NODE_KIND_V0.DEPTH);

  const studioToNarrative = edgeList.some(
    (e) => e.label === "studio_decision_narrative" && e.weight >= 0.4
  );
  const spiralToReal = edgeList.some((e) => e.label === "spiral_maps_real_life" && e.weight >= 0.35);

  return Object.freeze({
    schema: "castle.rhizoh.clag_memory_shaping_hints.v0",
    appliedToCognition: isClagMemoryShapingEnabledV0() && isInfluenceFeedbackToCognitionEnabledV0(),
    openThreadsBoost: narrative?.meta?.openThreads > 0 ? ["clag:narrative_open"] : [],
    spatialEcho: realLife?.meta?.placeLabel || realLife?.meta?.anchor || null,
    activeSovereignNodes: Object.freeze(
      realLifeNodes.map((n) => ({
        registryId: n.meta?.registryId,
        label: n.label,
        isPrimary: n.meta?.isPrimary === true
      }))
    ),
    studioEcho: studioToNarrative ? studio?.label || null : null,
    spiralEcho: spiralToReal ? spiral?.label || null : null,
    depthEcho: depth?.meta?.conversationMode || null,
    crossLayerPaths: Object.freeze(
      traversalPlan?.traversalSteps?.length
        ? traversalPlan.traversalSteps.map(
            (s) => `${s.fromKind}→${s.toKind}:${s.edgeLabel}`
          )
        : edgeList
            .filter((e) => e.weight >= 0.4)
            .map((e) => `${e.from.split(":")[0]}→${e.to.split(":")[0]}:${e.label}`)
            .slice(-12)
    ),
    primaryRoute: traversalPlan?.primaryRoute ?? null,
    layerRoutingOrder: traversalPlan?.layerRoutingOrder ?? []
  });
}

/**
 * @param {ReturnType<typeof buildRhizohCrossLayerAwarenessGraphV0>} graph
 */
/** @deprecated Product surface uses publishRuntimeStabilityV0. Internal/debug only. */
export function emitClagObservabilityV0(graph) {
  logCastleLifecycleV0("clag_internal", Object.freeze({
    traceId: graph.traceId,
    sessionId: graph.sessionId,
    revision: graph.revision,
    nodeCount: graph.nodeCount,
    edgeCount: graph.edgeCount,
    activeSovereignNodeCount: graph.activeSovereignNodeCount,
    activeNodeRegistry: graph.activeNodeRegistry.map((n) => n.id),
    graphContamination: graph.graphContamination,
    boundedEmergence: graph.boundedEmergence
      ? Object.freeze({
          regime: graph.boundedEmergence.regime,
          resonanceBudget01: graph.boundedEmergence.resonanceBudget01,
          emergenceBudgetRemaining: graph.boundedEmergence.emergenceBudgetRemaining,
          resonanceEdgeCount: graph.boundedEmergence.controlledResonance.length,
          temporalPhase: graph.boundedEmergence.temporal?.strategicFlow?.phase,
          controlledSurpriseInjected: graph.boundedEmergence.controlledSurpriseInjected === true,
          emergencePool01: graph.boundedEmergence.temporal?.emergencePoolRemaining01
        })
      : null,
    phaseCoupling: graph.phaseCouplingGraph
      ? Object.freeze({
          phase: graph.phaseCouplingGraph.currentPhase,
          transition: graph.phaseCouplingGraph.phaseTransition,
          dominantNodes: graph.phaseCouplingGraph.dominantNodesThisPhase,
          breath: graph.phaseCouplingGraph.systemBreath?.current
        })
      : null,
    interPhaseMemory: graph.interPhaseMemory
      ? Object.freeze({
          transition: graph.interPhaseMemory.phaseTransition,
          carriedCount: graph.interPhaseMemory.explicitMeaningTransfer.carriedIntoThisPhase.length,
          bornCount: graph.interPhaseMemory.explicitMeaningTransfer.bornThisTick.length,
          implicitBefore: false
        })
      : null,
    semanticForgetting: graph.semanticForgetting
      ? Object.freeze({
          forgottenCount: graph.semanticForgetting.summary.forgottenCount,
          compressedCount: graph.semanticForgetting.summary.compressedCount,
          retainedCount: graph.semanticForgetting.summary.retainedCount,
          naturalResolution: graph.semanticForgetting.summary.naturalResolution
        })
      : null,
    layerVisibility: graph.layerVisibility,
    traversalPlan: graph.traversalPlan
      ? Object.freeze({
          strategy: graph.traversalPlan.strategy,
          profile: graph.traversalPlan.traversalProfile,
          primaryRoute: graph.traversalPlan.primaryRoute,
          layerRoutingOrder: graph.traversalPlan.layerRoutingOrder,
          matchedChains: graph.traversalPlan.canonicalRoutes.matched.map((c) => c.chainId)
        })
      : null,
    memoryShapingHints: graph.memoryShapingHints,
    topNodes: graph.nodes.slice(0, 8).map((n) => ({ kind: n.kind, label: n.label }))
  }));
  return graph;
}

export function resetClagGraphV0() {
  nodesById.clear();
  edges.length = 0;
  sessionId = null;
  lastTraceId = null;
  graphRevision = 0;
  lastTraversalProfile = CLAG_TRAVERSAL_PROFILE_V0.LLM_TURN;
  lastAttemptedGeographicAnchor = null;
  resetTemporalBeaStateV0();
  resetInterPhaseMemoryV0();
  resetRuntimeStabilityLayerV0();
  resetRhizohGlobalMeaningEngineV0();
}

export function getClagGraphSnapshotV0() {
  return buildRhizohCrossLayerAwarenessGraphV0();
}
