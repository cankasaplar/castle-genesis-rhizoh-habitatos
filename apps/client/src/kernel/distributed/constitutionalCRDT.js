/**
 * Minimal CRDT-style merges for shared constitutional fields (pressure + policy LWW).
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @param {number[]} a
 * @param {number[]} b
 */
export function mergePressureVectorsSemilattice(a, b) {
  const n = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    out.push(clamp01(Math.max(x, y) * 0.55 + Math.min(x, y) * 0.45));
  }
  return Object.freeze(out);
}

/**
 * @param {Float32Array} a
 * @param {Float32Array} b
 * @param {number} stampA
 * @param {number} stampB
 */
export function mergePolicyWeightsLWW(a, b, stampA, stampB) {
  const n = Math.max(a.length, b.length);
  const out = new Float32Array(n);
  const useA = stampA >= stampB;
  for (let i = 0; i < n; i++) {
    const x = useA ? a[i] : b[i];
    out[i] = clamp01(x ?? 0.5);
  }
  return out;
}
