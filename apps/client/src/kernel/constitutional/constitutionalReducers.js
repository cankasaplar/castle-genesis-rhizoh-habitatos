/**
 * Small bounded blends for auxiliary state scalars (keeps closure file thin).
 */

import { clamp01 } from "./constitutionalState.js";

export function emaScalar(prev, target, lambda) {
  const l = clamp01(lambda);
  return clamp01(prev * (1 - l) + target * l);
}

/**
 * Nudge constitution embedding from observation (bounded).
 * @param {Float32Array} vec
 * @param {{ novelty: number, coherence: number, uncertainty: number, conflict: number, salience: number }} obs
 * @param {number} [gain]
 */
export function nudgeConstitutionVector(vec, obs, gain = 0.07) {
  const g = clamp01(gain);
  const targets = [
    obs.coherence,
    1 - obs.uncertainty,
    obs.salience,
    1 - obs.conflict,
    1 - obs.novelty * 0.5,
    obs.coherence * obs.salience,
    clamp01(1 - obs.conflict - obs.uncertainty * 0.5),
    obs.novelty
  ];
  for (let i = 0; i < vec.length && i < targets.length; i++) {
    vec[i] = clamp01(vec[i] * (1 - g) + targets[i] * g);
  }
}

/**
 * Drift impulse from step dynamics (fed into EMA in closure).
 * @param {number} deltaConfidence
 * @param {number} contradiction
 * @param {number} [lambda] volatility weight, default 0.62
 */
export function driftImpulse(deltaConfidence, contradiction, lambda = 0.62) {
  const l = clamp01(lambda);
  return clamp01(l * Math.abs(deltaConfidence) + (1 - l) * clamp01(contradiction));
}
