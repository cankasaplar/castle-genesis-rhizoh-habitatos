/**
 * Merge two epoch heads into merge metadata for a successor epoch (pure).
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

function fnv1a32Hex(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `0x${h.toString(16)}`;
}

/**
 * @param {object} o
 * @param {{ epochHash: string, legitimacyResonance?: number, atomicSnapshot?: { constitution?: { confidence: number, contradiction: number } } }} o.left
 * @param {{ epochHash: string, legitimacyResonance?: number, atomicSnapshot?: { constitution?: { confidence: number, contradiction: number } } }} o.right
 */
export function mergeEpochLineages(o) {
  const left = o.left;
  const right = o.right;
  const mergeAncestry = Object.freeze([left.epochHash, right.epochHash].sort());
  const legL = left.legitimacyResonance ?? 0.45;
  const legR = right.legitimacyResonance ?? 0.45;
  const mergedLegitimacyResonance = clamp01((legL + legR) / 2);
  const cL = left.atomicSnapshot?.constitution?.confidence ?? 0.5;
  const cR = right.atomicSnapshot?.constitution?.confidence ?? 0.5;
  const kL = left.atomicSnapshot?.constitution?.contradiction ?? 0.2;
  const kR = right.atomicSnapshot?.constitution?.contradiction ?? 0.2;
  const constitutionalSimilarity = clamp01(1 - (Math.abs(cL - cR) * 0.5 + Math.abs(kL - kR) * 0.5));
  const mergeHash = fnv1a32Hex(JSON.stringify({ m: mergeAncestry, ml: mergedLegitimacyResonance, sim: constitutionalSimilarity }));
  return Object.freeze({
    mergeAncestry,
    mergedLegitimacyResonance,
    constitutionalSimilarity,
    mergeHash
  });
}
