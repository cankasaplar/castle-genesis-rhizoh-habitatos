/**
 * L11 bilgi grafiği: düğüm (kavram, yetenek, bellek, güven) + kenar (semantik rol).
 * Gezinme: BFS ile sınırlı derinlik (ana iş parçacığında O(branch^depth)).
 */

export const KG_EDGE = {
  CAUSES: "causes",
  SUPPORTS: "supports",
  CONTRADICTS: "contradicts",
  TEACHES: "teaches",
  RELATES: "relates"
};

export const KG_NODE = {
  CONCEPT: "concept",
  SKILL: "skill",
  MEMORY: "memory",
  TRUST: "trust",
  AGENT: "agent"
};

export class KnowledgeGraphSubstrate {
  constructor() {
    /** @type {Map<string, { id: string, kind: string, label: string, props: Record<string, unknown> }>} */
    this.nodes = new Map();
    /** @type {Map<string, Array<{ to: string, kind: string, w: number }>>} */
    this.adj = new Map();
  }

  upsertNode(id, kind, label, props = {}) {
    const cur = this.nodes.get(id) || { id, kind, label: "", props: {} };
    cur.kind = kind;
    cur.label = label;
    cur.props = { ...cur.props, ...props };
    this.nodes.set(id, cur);
    if (!this.adj.has(id)) this.adj.set(id, []);
    return cur;
  }

  link(fromId, edgeKind, toId, weight = 1) {
    if (!this.adj.has(fromId)) this.adj.set(fromId, []);
    this.adj.get(fromId).push({ to: toId, kind: edgeKind, w: weight });
  }

  /** @returns {Generator<string, void, unknown>} */
  *bfs(startId, maxDepth = 3, maxNodes = 256) {
    const q = [[String(startId), 0]];
    const seen = new Set();
    let count = 0;
    while (q.length && count < maxNodes) {
      const [id, d] = q.shift();
      if (seen.has(id)) continue;
      seen.add(id);
      count++;
      yield id;
      if (d >= maxDepth) continue;
      const outs = this.adj.get(id);
      if (!outs) continue;
      for (const e of outs) {
        if (!seen.has(e.to)) q.push([e.to, d + 1]);
      }
    }
  }

  subgraphForAgent(agentKey, depth = 2) {
    return Array.from(this.bfs(agentKey, depth, 128));
  }

  clear() {
    this.nodes.clear();
    this.adj.clear();
  }
}
