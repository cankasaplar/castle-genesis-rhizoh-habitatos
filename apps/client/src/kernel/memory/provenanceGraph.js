/**
 * Provenance DAG fragment — pure adjacency for proof legality hints.
 */

/**
 * @typedef {{ id: string, parentIds: string[], weight: number }} ProvenanceNode
 * @typedef {Map<string, ProvenanceNode>} ProvenanceGraph
 */

export function createProvenanceGraph() {
  return new Map();
}

/**
 * @param {ProvenanceGraph} g
 * @param {ProvenanceNode} node
 * @returns {ProvenanceGraph}
 */
export function addProvenanceNode(g, node) {
  const next = new Map(g);
  next.set(node.id, { ...node, weight: Math.max(0, Math.min(1, node.weight)) });
  return next;
}

/**
 * Pure hook payload for outer appendHypergraph(memoryArtifacts).
 * @param {object} o
 * @param {number} o.now
 * @param {number} o.resonanceDelta
 * @param {string} o.constitutionId
 * @param {object | null} o.mutationIntent
 * @param {object | null} o.mutationReview
 * @param {object | null} o.mutationProof
 * @param {object | null} o.mutationSeal
 * @param {object | null} o.seal
 * @param {object} o.observation
 * @param {object} o.proof
 * @param {number} o.contradiction
 */
export function createMemoryArtifactsFromClosure(o) {
  const nodes = [];
  const edges = [];
  const constitutionId = o.constitutionId || "constitution.default";
  nodes.push({ id: constitutionId, type: "ConstitutionNode", timestamp: o.now });
  nodes.push({ id: `obs_${o.now}`, type: "ObservationNode", payload: o.observation, timestamp: o.now });
  nodes.push({ id: `proof_${o.now}`, type: "ProofNode", payload: o.proof, timestamp: o.now });
  nodes.push({ id: `contr_${o.now}`, type: "ContradictionNode", payload: { value: o.contradiction }, timestamp: o.now });
  nodes.push({ id: `memory_${o.now}`, type: "MemoryNode", timestamp: o.now });

  if (o.seal) nodes.push({ id: o.seal.id, type: "SealNode", payload: o.seal, timestamp: o.now });
  if (o.mutationIntent) {
    nodes.push({ id: o.mutationIntent.id, type: "MutationIntentNode", payload: o.mutationIntent, timestamp: o.now });
    nodes.push({
      id: `reason_${o.mutationIntent.id}`,
      type: "ReasonNode",
      payload: { reason: o.mutationIntent.reason },
      timestamp: o.now
    });
    nodes.push({
      id: `policy_${o.mutationIntent.targetPolicy}`,
      type: "PolicyNode",
      payload: { key: o.mutationIntent.targetPolicy },
      timestamp: o.now
    });
  }
  if (o.mutationReview) nodes.push({ id: `mreview_${o.now}`, type: "MutationReviewNode", payload: o.mutationReview, timestamp: o.now });
  if (o.mutationProof) nodes.push({ id: `mproof_${o.now}`, type: "MutationProofNode", payload: o.mutationProof, timestamp: o.now });
  if (o.mutationSeal) nodes.push({ id: o.mutationSeal.sealId, type: "MutationSealNode", payload: o.mutationSeal, timestamp: o.now });

  if (o.mutationIntent && o.mutationReview) {
    edges.push({
      id: `edge_just_${o.now}`,
      kind: "justification",
      nodes: [`reason_${o.mutationIntent.id}`, o.mutationIntent.id, `mreview_${o.now}`],
      weight: 0.7,
      confidence: 0.72,
      legality: o.mutationReview.reviewScore ?? 0.5,
      resonance: 0.6,
      decay: 0.18,
      provenance: 0.84,
      timestamp: o.now
    });
  }
  if (o.mutationProof && o.mutationSeal) {
    edges.push({
      id: `edge_legit_${o.now}`,
      kind: "legitimacy",
      nodes: [`mproof_${o.now}`, o.mutationSeal.sealId, constitutionId],
      weight: 0.82,
      confidence: o.mutationProof.confidence ?? 0.5,
      legality: o.mutationSeal.reviewScore ?? 0.5,
      resonance: 0.7,
      decay: 0.12,
      provenance: 0.9,
      timestamp: o.now
    });
  }
  if (o.mutationIntent) {
    edges.push({
      id: `edge_cons_${o.now}`,
      kind: "consequence",
      nodes: [`policy_${o.mutationIntent.targetPolicy}`, `obs_${o.now}`, `contr_${o.now}`],
      weight: 0.58,
      confidence: 0.64,
      legality: 0.72,
      resonance: 0.46,
      decay: 0.22,
      provenance: 0.77,
      timestamp: o.now
    });
  }
  if (o.seal) {
    edges.push({
      id: `edge_mem_${o.now}`,
      kind: "memory_resonance",
      nodes: [`memory_${o.now}`, constitutionId, o.seal.id],
      weight: 0.76,
      confidence: 0.79,
      legality: 0.88,
      resonance: 0.82,
      decay: 0.1,
      provenance: 0.91,
      timestamp: o.now
    });
  }

  return { nodes, edges, resonanceDelta: o.resonanceDelta };
}
