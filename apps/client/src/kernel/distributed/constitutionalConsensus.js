/**
 * Pick a canonical fork among competing heads (single-node / regional quorum iskelesi).
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @typedef {object} ForkCandidate
 * @property {string} epochHash
 * @property {number} lineageDepth
 * @property {number} sealConfidence
 * @property {number} legitimacyResonance
 * @property {number} contradictionCost
 * @property {number} constitutionalSimilarity
 */

/**
 * @param {ForkCandidate} c
 * @param {object} [w]
 * @param {number} [w.seal]
 * @param {number} [w.legitimacy]
 * @param {number} [w.contradiction]
 * @param {number} [w.depth]
 * @param {number} [w.similarity]
 */
export function scoreForkCandidate(c, w = {}) {
  const ws = w.seal ?? 0.22;
  const wl = w.legitimacy ?? 0.26;
  const wc = w.contradiction ?? 0.2;
  const wd = w.depth ?? 0.14;
  const wi = w.similarity ?? 0.18;
  const depthNorm = clamp01(c.lineageDepth / 32);
  return clamp01(
    ws * c.sealConfidence +
      wl * c.legitimacyResonance +
      wc * (1 - c.contradictionCost) +
      wd * depthNorm +
      wi * c.constitutionalSimilarity
  );
}

/**
 * @param {ForkCandidate[]} candidates
 * @param {object} [weights]
 * @returns {{ winner: ForkCandidate, score: number, scores: number[] }}
 */
export function selectCanonicalFork(candidates, weights) {
  const scores = candidates.map((c) => scoreForkCandidate(c, weights));
  let best = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[best]) best = i;
  }
  return Object.freeze({
    winner: candidates[best],
    score: scores[best],
    scores
  });
}
