/**
 * Resonance index over hyperedges — vector field + weighted norm.
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

const DEFAULT_VECTOR = Object.freeze({
  truthResonance: 0.45,
  contradictionResonance: 0.2,
  memoryResonance: 0.45,
  legitimacyResonance: 0.45,
  noveltyResonance: 0.35
});

/**
 * Backward-compatible scalar resonance.
 * @param {import('./hyperEdgeStore.js').HyperEdgeStore} store
 */
export function aggregateResonanceFromStore(store) {
  return resonanceWeightedNorm(solveResonanceField(store));
}

/**
 * @param {import('./hyperEdgeStore.js').HyperEdgeStore} store
 */
export function solveResonanceField(store) {
  if (!store?.edges?.size) return { ...DEFAULT_VECTOR };

  let truth = 0;
  let contradiction = 0;
  let memory = 0;
  let legitimacy = 0;
  let novelty = 0;
  let acc = 0;
  let n = 0;
  for (const e of store.edges.values()) {
    const base = e.confidence * (1 - e.decay * 0.5) * e.provenance * e.legality;
    const weight = clamp01(e.weight ?? 0.5);
    const res = clamp01(e.resonance ?? 0.5);
    const kind = e.kind || "memory_resonance";
    if (kind === "legitimacy") legitimacy += base * weight;
    if (kind === "consequence") contradiction += (1 - e.legality) * 0.4 + (1 - e.confidence) * 0.2;
    if (kind === "justification") truth += base * 0.8;
    if (kind === "memory_resonance") memory += base * res;
    novelty += clamp01(Math.abs(0.5 - weight) * 2) * 0.15 + (1 - e.provenance) * 0.12;
    acc += base;
    n++;
  }
  const scalar = clamp01(acc / n);
  return {
    truthResonance: clamp01((truth / Math.max(1, n)) * 0.7 + scalar * 0.3),
    contradictionResonance: clamp01(contradiction / Math.max(1, n)),
    memoryResonance: clamp01((memory / Math.max(1, n)) * 0.75 + scalar * 0.25),
    legitimacyResonance: clamp01((legitimacy / Math.max(1, n)) * 0.75 + scalar * 0.25),
    noveltyResonance: clamp01(novelty / Math.max(1, n))
  };
}

/**
 * @param {{ truthResonance: number, contradictionResonance: number, memoryResonance: number, legitimacyResonance: number, noveltyResonance: number }} vector
 */
export function resonanceWeightedNorm(vector) {
  return clamp01(
    vector.truthResonance * 0.22 +
      vector.memoryResonance * 0.28 +
      vector.legitimacyResonance * 0.26 +
      vector.noveltyResonance * 0.14 +
      (1 - vector.contradictionResonance) * 0.1
  );
}
