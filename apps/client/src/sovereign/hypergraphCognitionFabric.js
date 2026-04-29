/**
 * Hypergraph Cognition Fabric — RHIZOH bilişim substratı.
 * Graf: A→B. Hipergraf: (A,B,C,…) → outcome (tek hiperkenar).
 */

export const HG_NODE_KIND = {
  CONCEPT: "concept",
  EXPERIENCE: "experience",
  POLICY: "policy",
  FAILURE: "failure",
  SUCCESS: "success",
  TOOL: "tool",
  GOAL: "goal",
  BELIEF: "belief",
  CONSTRAINT: "constraint"
};

/** Hiperkenar: çoklu öncül → sonuç; ağırlık tensörü meta. */
export class HypergraphCognitionFabric {
  constructor() {
    /** @type {Map<string, { id: string, kind: string, label: string, props: Record<string, unknown> }>} */
    this.nodes = new Map();
    /** @type {Array<{ id: string, members: string[], outcomeId: string, causal: string, w: { confidence: number; novelty: number; stability: number; recency: number; risk: number } }>} */
    this.hyperedges = [];
  }

  upsertNode(id, kind, label, props = {}) {
    const cur = this.nodes.get(id) || { id, kind, label: "", props: {} };
    cur.kind = kind;
    cur.label = label;
    cur.props = { ...cur.props, ...props };
    this.nodes.set(id, cur);
    return cur;
  }

  addHyperedge(members, outcomeId, causal = "causal_tensor", weights = {}) {
    const id = `he:${this.hyperedges.length}:${Date.now()}`;
    const w = {
      confidence: weights.confidence ?? 0.7,
      novelty: weights.novelty ?? 0.5,
      stability: weights.stability ?? 0.6,
      recency: weights.recency ?? 1,
      risk: weights.risk ?? 0.2
    };
    this.hyperedges.push({ id, members: [...members], outcomeId, causal, w });
    return id;
  }

  /** outcome’a giden hiperkenarları döndür (basit tarama; 5M ölçekte indeks gerekir). */
  hyperedgesTouching(nodeId) {
    return this.hyperedges.filter((e) => e.members.includes(nodeId) || e.outcomeId === nodeId);
  }
}
