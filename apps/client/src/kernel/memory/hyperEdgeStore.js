/**
 * Hypergraph memory fabric — minimal pure store (nodes + weighted tensor edges).
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

export const HYPER_NODE_TYPES = Object.freeze([
  "ObservationNode",
  "ProofNode",
  "SealNode",
  "MutationIntentNode",
  "MutationReviewNode",
  "MutationProofNode",
  "MutationSealNode",
  "PolicyNode",
  "ContradictionNode",
  "MemoryNode",
  "ReasonNode",
  "AgentNode",
  "ConstitutionNode"
]);

/**
 * @typedef {object} HyperEdge
 * @property {string} id
 * @property {string[]} nodes
 * @property {string} [kind]
 * @property {number} [weight]
 * @property {number} confidence
 * @property {number} [resonance]
 * @property {number} decay
 * @property {number} provenance
 * @property {number} legality
 * @property {number} [timestamp]
 */

/**
 * @typedef {object} HyperNode
 * @property {string} id
 * @property {string} type
 * @property {Record<string, unknown>} [payload]
 * @property {number} [timestamp]
 */

/**
 * @typedef {object} HyperEdgeStore
 * @property {Map<string, HyperNode>} nodes
 * @property {Map<string, HyperEdge>} edges
 */

export function createHyperEdgeStore() {
  return { nodes: new Map(), edges: new Map() };
}

/**
 * @param {HyperEdgeStore} store
 * @param {HyperNode} node
 * @returns {HyperEdgeStore}
 */
export function addHyperNode(store, node) {
  const next = { nodes: new Map(store.nodes), edges: new Map(store.edges) };
  next.nodes.set(node.id, {
    ...node,
    type: HYPER_NODE_TYPES.includes(node.type) ? node.type : "MemoryNode"
  });
  return next;
}

/**
 * @param {HyperEdgeStore} store
 * @param {HyperEdge} edge
 * @returns {HyperEdgeStore}
 */
export function addHyperEdge(store, edge) {
  const next = { nodes: new Map(store.nodes), edges: new Map(store.edges) };
  next.edges.set(edge.id, {
    ...edge,
    weight: clamp01(edge.weight ?? 0.5),
    confidence: clamp01(edge.confidence),
    resonance: clamp01(edge.resonance ?? 0.5),
    decay: clamp01(edge.decay),
    provenance: clamp01(edge.provenance),
    legality: clamp01(edge.legality)
  });
  return next;
}

/**
 * Apply artifacts from pure closure output in outer layer.
 * @param {HyperEdgeStore} store
 * @param {{ nodes?: HyperNode[], edges?: HyperEdge[] }} artifacts
 * @returns {HyperEdgeStore}
 */
export function appendHypergraph(store, artifacts) {
  let next = { nodes: new Map(store.nodes), edges: new Map(store.edges) };
  for (const n of artifacts.nodes || []) next = addHyperNode(next, n);
  for (const e of artifacts.edges || []) next = addHyperEdge(next, e);
  return next;
}

/**
 * Stable hash for replay validation.
 * @param {HyperEdgeStore} store
 */
export function hashHyperEdgeStore(store) {
  const nodeIds = Array.from(store.nodes.keys()).sort();
  const edgeIds = Array.from(store.edges.keys()).sort();
  const canonical = JSON.stringify({
    nodeIds,
    edgeIds,
    edges: edgeIds.map((id) => store.edges.get(id))
  });
  let x = 0;
  for (let i = 0; i < canonical.length; i++) x = (x * 33 + canonical.charCodeAt(i)) >>> 0;
  return `0x${x.toString(16)}`;
}
