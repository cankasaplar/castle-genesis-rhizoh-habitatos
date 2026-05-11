import { clamp01 } from "../constitutional/constitutionalState.js";

function reasonOf(node) {
  return typeof node?.payload?.reason === "string" ? node.payload.reason : "unknown_reason";
}

/**
 * Similar reason clusters -> closer wake cycle.
 * Contradiction-heavy clusters -> earlier sovereign review.
 * @param {{ nodes?: Array<{ id: string, type: string, payload?: Record<string, unknown> }>, edges?: Array<{ kind?: string, legality?: number, confidence?: number }> }} artifacts
 */
export function planWakeTopology(artifacts) {
  const nodes = artifacts.nodes || [];
  const edges = artifacts.edges || [];
  const reasonNodes = nodes.filter((n) => n.type === "ReasonNode");
  const clusters = new Map();
  for (const n of reasonNodes) {
    const key = reasonOf(n);
    clusters.set(key, (clusters.get(key) || 0) + 1);
  }
  const clusterCount = clusters.size;
  const dominantCluster = Math.max(0, ...clusters.values());
  const coherence = clusterCount > 0 ? dominantCluster / Math.max(1, reasonNodes.length) : 0;

  let contradictionLoad = 0;
  for (const e of edges) {
    if (e.kind === "consequence") {
      contradictionLoad += clamp01((1 - (e.legality ?? 0.5)) * 0.6 + (1 - (e.confidence ?? 0.5)) * 0.4);
    }
  }
  contradictionLoad = clamp01(contradictionLoad / Math.max(1, edges.length || 1));

  const wakeCycleMultiplier = clamp01(0.2 + (1 - coherence) * 0.55 + contradictionLoad * 0.25);
  const sovereignReviewBias = clamp01(contradictionLoad * 0.75 + (1 - coherence) * 0.25);

  return Object.freeze({
    clusterCount,
    dominantCluster,
    coherence,
    contradictionLoad,
    wakeCycleMultiplier,
    sovereignReviewBias
  });
}
