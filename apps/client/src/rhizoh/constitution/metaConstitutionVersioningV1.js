/**
 * RHIZOH meta-constitution versioning — anayasa paketi sürümlerinin evrim grafiği (düğüm + kenar + soy).
 */

export const RHIZOH_META_CONSTITUTION_VERSIONING_VERSION = "1.0.0";

/**
 * @typedef {{
 *   id: string,
 *   at: number,
 *   label?: string,
 *   constitutionVersions: Record<string, string>,
 *   parentIds?: string[],
 *   notes?: string
 * }} RhizohMetaConstitutionNode
 */

/**
 * @typedef {{
 *   nodes: Record<string, RhizohMetaConstitutionNode>,
 *   childrenByParent: Record<string, string[]>
 * }} RhizohMetaConstitutionGraph
 */

/**
 * Boş graf — düğümler id ile indekslenir; childrenByParent ebeveyn → çocuk listesi.
 */
export function createRhizohMetaConstitutionGraph() {
  return /** @type {RhizohMetaConstitutionGraph} */ ({
    nodes: {},
    childrenByParent: {}
  });
}

function uniq(ids) {
  const out = [];
  const seen = new Set();
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Grafın kopyasına düğüm ekler (saf fonksiyon).
 * @param {RhizohMetaConstitutionGraph} graph
 * @param {RhizohMetaConstitutionNode} node
 */
export function registerRhizohMetaConstitutionNode(graph, node) {
  const parentIds = uniq(node.parentIds || []);
  const copy = {
    nodes: { ...graph.nodes, [node.id]: { ...node, parentIds } },
    childrenByParent: { ...graph.childrenByParent }
  };
  for (const p of parentIds) {
    const prev = copy.childrenByParent[p] || [];
    if (!prev.includes(node.id)) {
      copy.childrenByParent[p] = [...prev, node.id];
    }
  }
  return copy;
}

/**
 * @param {RhizohMetaConstitutionGraph} graph
 */
export function listRhizohMetaConstitutionRoots(graph) {
  return Object.keys(graph.nodes).filter((id) => !(graph.nodes[id].parentIds || []).length);
}

/**
 * nodeId’den köke doğru soy — çoklu ebeveynde yalnızca `parentIds[0]` zinciri izlenir.
 * @param {RhizohMetaConstitutionGraph} graph
 * @param {string} nodeId
 */
export function getRhizohMetaConstitutionLineage(graph, nodeId) {
  /** @type {string[]} */
  const path = [];
  const visited = new Set();
  let cur = nodeId;
  while (cur && graph.nodes[cur] && !visited.has(cur)) {
    visited.add(cur);
    path.push(cur);
    const parents = graph.nodes[cur].parentIds || [];
    cur = parents[0] || "";
  }
  return path.reverse();
}

/**
 * İki sürüm kaydı arasında modül bazlı fark.
 * @param {Record<string, string>} prev
 * @param {Record<string, string>} next
 */
export function diffRhizohMetaConstitutionVersions(prev, next) {
  const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
  /** @type {{ module: string, from: string | undefined, to: string | undefined }[]} */
  const changed = [];
  for (const k of keys) {
    const a = prev?.[k];
    const b = next?.[k];
    if (a !== b) changed.push({ module: k, from: a, to: b });
  }
  changed.sort((x, y) => x.module.localeCompare(y.module));
  return changed;
}

/**
 * Graf üzerinde üstten alta doğru sıralı tur (BFS, köklerden).
 * @param {RhizohMetaConstitutionGraph} graph
 */
export function traverseRhizohMetaConstitutionEvolutionOrder(graph) {
  const roots = listRhizohMetaConstitutionRoots(graph);
  /** @type {string[]} */
  const order = [];
  const seen = new Set();
  const q = [...roots];
  while (q.length) {
    const id = q.shift();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    const kids = graph.childrenByParent[id] || [];
    for (const c of kids) {
      q.push(c);
    }
  }
  for (const id of Object.keys(graph.nodes)) {
    if (!seen.has(id)) order.push(id);
  }
  return order;
}
