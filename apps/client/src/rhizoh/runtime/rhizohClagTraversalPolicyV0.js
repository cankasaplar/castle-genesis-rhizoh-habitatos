/**
 * CLAG graph traversal policy v0 — explicit "how to walk" rules (observability only).
 * Replaces implicit routing with frozen profile · seed order · edge priority · canonical chains.
 */

import { CLAG_EDGE_KIND_V0, CLAG_NODE_KIND_V0 } from "./rhizohClagTypesV0.js";

export const RHIZOH_CLAG_TRAVERSAL_POLICY_SCHEMA_V0 =
  "castle.rhizoh.clag_traversal_policy.v0";

export const CLAG_TRAVERSAL_STRATEGY_V0 = Object.freeze({
  PRIORITY_OUTBOUND_V0: "priority_outbound_v0"
});

/** Entry profile selects seed order + which canonical chains must be evaluated first. */
export const CLAG_TRAVERSAL_PROFILE_V0 = Object.freeze({
  LLM_TURN: "llm_turn",
  LIVING_WORLD_FRAME: "living_world_frame",
  STUDIO_DECISION: "studio_decision"
});

/** Higher = traverse earlier when multiple out-edges compete. */
export const CLAG_EDGE_KIND_TRAVERSAL_PRIORITY_V0 = Object.freeze({
  [CLAG_EDGE_KIND_V0.SHAPES_MEMORY]: 4,
  [CLAG_EDGE_KIND_V0.INFLUENCES]: 3,
  [CLAG_EDGE_KIND_V0.MAPS_TO]: 2,
  [CLAG_EDGE_KIND_V0.PROPAGATES]: 1
});

const TRAVERSAL_LIMITS_V0 = Object.freeze({
  maxHops: 4,
  minEdgeWeight: 0.2,
  maxStepsPerTick: 24
});

/** When multiple canonical chains match, profile picks primary route (not implicit max score only). */
const PROFILE_PRIMARY_CHAIN_PRIORITY_V0 = Object.freeze({
  [CLAG_TRAVERSAL_PROFILE_V0.LLM_TURN]: [
    "measured_influence_depth",
    "conversation_memory_shaping",
    "depth_modes_conversation",
    "studio_decision_narrative_impact",
    "spiral_real_life_mapping",
    "geo_scene_grounding"
  ],
  [CLAG_TRAVERSAL_PROFILE_V0.LIVING_WORLD_FRAME]: [
    "spiral_real_life_mapping",
    "geo_scene_grounding",
    "conversation_memory_shaping",
    "studio_decision_narrative_impact",
    "measured_influence_depth"
  ],
  [CLAG_TRAVERSAL_PROFILE_V0.STUDIO_DECISION]: [
    "studio_decision_narrative_impact",
    "academy_studio_propagation",
    "conversation_memory_shaping",
    "measured_influence_depth"
  ]
});

/** Frozen seed order per profile (node kinds). */
const PROFILE_SEED_ORDER_V0 = Object.freeze({
  [CLAG_TRAVERSAL_PROFILE_V0.LLM_TURN]: [
    CLAG_NODE_KIND_V0.INFLUENCE,
    CLAG_NODE_KIND_V0.DEPTH,
    CLAG_NODE_KIND_V0.CONVERSATION,
    CLAG_NODE_KIND_V0.NARRATIVE,
    CLAG_NODE_KIND_V0.STUDIO,
    CLAG_NODE_KIND_V0.ACADEMY,
    CLAG_NODE_KIND_V0.SPIRAL,
    CLAG_NODE_KIND_V0.REAL_LIFE,
    CLAG_NODE_KIND_V0.SOCIAL
  ],
  [CLAG_TRAVERSAL_PROFILE_V0.LIVING_WORLD_FRAME]: [
    CLAG_NODE_KIND_V0.SPIRAL,
    CLAG_NODE_KIND_V0.REAL_LIFE,
    CLAG_NODE_KIND_V0.NARRATIVE,
    CLAG_NODE_KIND_V0.SOCIAL,
    CLAG_NODE_KIND_V0.CONVERSATION,
    CLAG_NODE_KIND_V0.DEPTH,
    CLAG_NODE_KIND_V0.STUDIO,
    CLAG_NODE_KIND_V0.INFLUENCE,
    CLAG_NODE_KIND_V0.ACADEMY
  ],
  [CLAG_TRAVERSAL_PROFILE_V0.STUDIO_DECISION]: [
    CLAG_NODE_KIND_V0.STUDIO,
    CLAG_NODE_KIND_V0.ACADEMY,
    CLAG_NODE_KIND_V0.NARRATIVE,
    CLAG_NODE_KIND_V0.CONVERSATION,
    CLAG_NODE_KIND_V0.DEPTH,
    CLAG_NODE_KIND_V0.INFLUENCE,
    CLAG_NODE_KIND_V0.SPIRAL,
    CLAG_NODE_KIND_V0.REAL_LIFE,
    CLAG_NODE_KIND_V0.SOCIAL
  ]
});

/**
 * Canonical cross-layer chains — SSOT routing templates (not implicit graph walk).
 * @type {readonly { id: string, label: string, kinds: readonly string[], minWeight: number }[]}
 */
export const CLAG_CANONICAL_ROUTE_CHAINS_V0 = Object.freeze([
  Object.freeze({
    id: "studio_decision_narrative_impact",
    label: "studio decisions → narrative impact",
    kinds: [CLAG_NODE_KIND_V0.STUDIO, CLAG_NODE_KIND_V0.NARRATIVE, CLAG_NODE_KIND_V0.CONVERSATION],
    minWeight: 0.35
  }),
  Object.freeze({
    id: "spiral_real_life_mapping",
    label: "spiral events → real-life mapping",
    kinds: [CLAG_NODE_KIND_V0.SPIRAL, CLAG_NODE_KIND_V0.REAL_LIFE, CLAG_NODE_KIND_V0.NARRATIVE],
    minWeight: 0.3
  }),
  Object.freeze({
    id: "measured_influence_depth",
    label: "influence measurement → depth → conversation",
    kinds: [CLAG_NODE_KIND_V0.INFLUENCE, CLAG_NODE_KIND_V0.DEPTH, CLAG_NODE_KIND_V0.CONVERSATION],
    minWeight: 0.25
  }),
  Object.freeze({
    id: "conversation_memory_shaping",
    label: "conversation → system-wide memory shaping",
    kinds: [CLAG_NODE_KIND_V0.CONVERSATION, CLAG_NODE_KIND_V0.NARRATIVE],
    minWeight: 0.4
  }),
  Object.freeze({
    id: "academy_studio_propagation",
    label: "academy → studio path",
    kinds: [CLAG_NODE_KIND_V0.ACADEMY, CLAG_NODE_KIND_V0.STUDIO],
    minWeight: 0.15
  }),
  Object.freeze({
    id: "depth_modes_conversation",
    label: "depth modes conversation",
    kinds: [CLAG_NODE_KIND_V0.DEPTH, CLAG_NODE_KIND_V0.CONVERSATION],
    minWeight: 0.5
  }),
  Object.freeze({
    id: "geo_scene_grounding",
    label: "geo grounds scene",
    kinds: [CLAG_NODE_KIND_V0.REAL_LIFE, CLAG_NODE_KIND_V0.NARRATIVE],
    minWeight: 0.35
  })
]);

/**
 * @param {string} profile
 * @returns {string}
 */
export function normalizeClagTraversalProfileV0(profile) {
  const p = String(profile || "").trim();
  if (Object.values(CLAG_TRAVERSAL_PROFILE_V0).includes(p)) return p;
  return CLAG_TRAVERSAL_PROFILE_V0.LLM_TURN;
}

/**
 * @param {object[]} nodes
 * @param {object[]} edgeList
 * @returns {Map<string, object[]>}
 */
function buildOutboundAdjacencyV0(nodes, edgeList) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  /** @type {Map<string, object[]>} */
  const adj = new Map();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edgeList) {
    if (!byId.has(e.from) || !byId.has(e.to)) continue;
    if (e.weight < TRAVERSAL_LIMITS_V0.minEdgeWeight) continue;
    const list = adj.get(e.from) || [];
    list.push(e);
    adj.set(e.from, list);
  }
  for (const [id, list] of adj) {
    list.sort((a, b) => compareEdgesForTraversalV0(a, b));
    adj.set(id, list);
  }
  return adj;
}

/**
 * @param {object} a
 * @param {object} b
 */
function compareEdgesForTraversalV0(a, b) {
  const pa = CLAG_EDGE_KIND_TRAVERSAL_PRIORITY_V0[a.kind] ?? 0;
  const pb = CLAG_EDGE_KIND_TRAVERSAL_PRIORITY_V0[b.kind] ?? 0;
  if (pb !== pa) return pb - pa;
  return (Number(b.weight) || 0) - (Number(a.weight) || 0);
}

/**
 * @param {object[]} nodes
 * @param {string} kind
 */
function findNodeIdByKindV0(nodes, kind) {
  const hit = nodes.find((n) => n.kind === kind);
  return hit?.id || null;
}

/**
 * @param {object[]} nodes
 * @param {object[]} edgeList
 * @param {typeof CLAG_CANONICAL_ROUTE_CHAINS_V0[number]} chain
 */
function evaluateCanonicalChainV0(nodes, edgeList, chain) {
  const nodeIds = chain.kinds.map((k) => findNodeIdByKindV0(nodes, k));
  if (nodeIds.some((id) => !id)) {
    return Object.freeze({
      chainId: chain.id,
      label: chain.label,
      matched: false,
      reason: "missing_node_kind",
      hops: [],
      score: 0
    });
  }

  /** @type {object[]} */
  const hops = [];
  let score = 0;
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const from = nodeIds[i];
    const to = nodeIds[i + 1];
    const edge = edgeList.find((e) => e.from === from && e.to === to);
    if (!edge || edge.weight < chain.minWeight) {
      return Object.freeze({
        chainId: chain.id,
        label: chain.label,
        matched: false,
        reason: edge ? "below_min_weight" : "edge_absent",
        hops,
        score
      });
    }
    hops.push(
      Object.freeze({
        fromKind: chain.kinds[i],
        toKind: chain.kinds[i + 1],
        edgeLabel: edge.label,
        edgeKind: edge.kind,
        weight: edge.weight
      })
    );
    score += edge.weight;
  }

  return Object.freeze({
    chainId: chain.id,
    label: chain.label,
    matched: true,
    reason: "canonical_chain_complete",
    hops,
    score: Math.round(score * 1000) / 1000
  });
}

/**
 * Priority outbound walk from profile seeds.
 * @param {object[]} nodes
 * @param {Map<string, object[]>} adj
 * @param {string[]} seedKinds
 */
function runPriorityOutboundTraversalV0(nodes, adj, seedKinds) {
  /** @type {object[]} */
  const steps = [];
  const visitedNodeIds = new Set();
  /** @type {string[]} */
  const layerRoutingOrder = [];

  const recordVisit = (node) => {
    if (!node || visitedNodeIds.has(node.id)) return;
    visitedNodeIds.add(node.id);
    layerRoutingOrder.push(node.kind);
  };

  for (const kind of seedKinds) {
    const startId = findNodeIdByKindV0(nodes, kind);
    if (!startId) continue;
    const startNode = nodes.find((n) => n.id === startId);
    if (!startNode) continue;
    recordVisit(startNode);

    /** @type {Array<{ nodeId: string, hop: number }>} */
    const queue = [{ nodeId: startId, hop: 0 }];
    const queued = new Set([startId]);

    while (queue.length > 0 && steps.length < TRAVERSAL_LIMITS_V0.maxStepsPerTick) {
      const { nodeId, hop } = queue.shift();
      if (hop >= TRAVERSAL_LIMITS_V0.maxHops) continue;

      const outEdges = adj.get(nodeId) || [];
      for (const edge of outEdges) {
        const toNode = nodes.find((n) => n.id === edge.to);
        if (!toNode) continue;

        const stepKey = `${edge.from}->${edge.to}:${edge.label}`;
        if (steps.some((s) => s.stepKey === stepKey)) continue;

        steps.push(
          Object.freeze({
            stepKey,
            hop: hop + 1,
            fromKind: nodes.find((n) => n.id === edge.from)?.kind || "?",
            toKind: toNode.kind,
            edgeLabel: edge.label,
            edgeKind: edge.kind,
            weight: edge.weight,
            traverseReason: `seed:${kind};edge_priority:${edge.kind}`
          })
        );

        recordVisit(toNode);

        if (!queued.has(edge.to) && hop + 1 < TRAVERSAL_LIMITS_V0.maxHops) {
          queued.add(edge.to);
          queue.push({ nodeId: edge.to, hop: hop + 1 });
        }
      }
    }
  }

  return Object.freeze({ steps, layerRoutingOrder: Object.freeze(layerRoutingOrder) });
}

/**
 * @param {typeof CLAG_CANONICAL_ROUTE_CHAINS_V0[number][]} evaluations
 * @param {object[]} steps
 * @param {string} profile
 */
function pickPrimaryRouteV0(evaluations, steps, profile) {
  const matched = evaluations.filter((e) => e.matched);
  const priority = PROFILE_PRIMARY_CHAIN_PRIORITY_V0[profile] || [];
  const best =
    priority
      .map((id) => matched.find((e) => e.chainId === id))
      .find(Boolean) ||
    [...matched].sort((a, b) => b.score - a.score)[0];

  if (best) {
    return Object.freeze({
      source: "canonical_chain",
      chainId: best.chainId,
      label: best.label,
      score: best.score,
      path: best.hops.map((h) => `${h.fromKind}→${h.toKind}`).join(" · "),
      hops: best.hops
    });
  }

  if (steps.length === 0) {
    return Object.freeze({
      source: "none",
      chainId: null,
      label: "no_traversable_edges",
      score: 0,
      path: "",
      hops: []
    });
  }

  const top = [...steps].sort((a, b) => b.weight - a.weight)[0];
  return Object.freeze({
    source: "outbound_step",
    chainId: top.edgeLabel,
    label: top.edgeLabel,
    score: top.weight,
    path: `${top.fromKind}→${top.toKind}`,
    hops: [top]
  });
}

/**
 * @param {{
 *   nodes: object[],
 *   edges: object[],
 *   traversalProfile?: string
 * }} input
 */
export function runClagTraversalPolicyV0(input) {
  const nodes = Array.isArray(input.nodes) ? input.nodes : [];
  const edgeList = Array.isArray(input.edges) ? input.edges : [];
  const profile = normalizeClagTraversalProfileV0(input.traversalProfile);
  const seedKinds = PROFILE_SEED_ORDER_V0[profile] || PROFILE_SEED_ORDER_V0[CLAG_TRAVERSAL_PROFILE_V0.LLM_TURN];

  const adj = buildOutboundAdjacencyV0(nodes, edgeList);
  const { steps, layerRoutingOrder } = runPriorityOutboundTraversalV0(nodes, adj, seedKinds);

  const canonicalEvaluations = CLAG_CANONICAL_ROUTE_CHAINS_V0.map((chain) =>
    evaluateCanonicalChainV0(nodes, edgeList, chain)
  );
  const matchedChains = canonicalEvaluations.filter((e) => e.matched);
  const rejectedChains = canonicalEvaluations.filter((e) => !e.matched);

  const primaryRoute = pickPrimaryRouteV0(canonicalEvaluations, steps, profile);

  const implicitEdgesSkipped = edgeList
    .filter((e) => e.weight < TRAVERSAL_LIMITS_V0.minEdgeWeight)
    .map((e) => e.label);

  return Object.freeze({
    schema: RHIZOH_CLAG_TRAVERSAL_POLICY_SCHEMA_V0,
    routingExplicit: true,
    strategy: CLAG_TRAVERSAL_STRATEGY_V0.PRIORITY_OUTBOUND_V0,
    traversalProfile: profile,
    seedOrder: Object.freeze([...seedKinds]),
    limits: TRAVERSAL_LIMITS_V0,
    edgeKindPriority: CLAG_EDGE_KIND_TRAVERSAL_PRIORITY_V0,
    layerRoutingOrder,
    traversalSteps: Object.freeze(steps.slice(0, TRAVERSAL_LIMITS_V0.maxStepsPerTick)),
    canonicalRoutes: Object.freeze({
      matched: Object.freeze(matchedChains),
      rejected: Object.freeze(rejectedChains.slice(0, 8))
    }),
    primaryRoute,
    implicitEdgesSkipped: Object.freeze(implicitEdgesSkipped)
  });
}
