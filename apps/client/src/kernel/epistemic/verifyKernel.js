/**
 * verify(observation, options) → ProofVector + tier (Chronos budget shapes L0..L3 strictness).
 */

import { clamp01 } from "../constitutional/constitutionalState.js";
import { VERIFY_TIER } from "../constitutional/constitutionalSeals.js";

/**
 * @typedef {object} ProofVector
 * @property {number} confidence
 * @property {number} legality
 * @property {number} provenance
 * @property {number} contradiction
 */

/**
 * @param {ReturnType<import('./observeKernel.js').observe>} observation
 * @param {{ tier?: number, chronosBudgetMs?: number, provenanceHint?: number }} [options]
 * @returns {{ proof: ProofVector, tier: number, timedOut: boolean }}
 */
export function verify(observation, options = {}) {
  const tier = Math.max(0, Math.min(3, options.tier ?? VERIFY_TIER.L0));
  const budget = options.chronosBudgetMs ?? 120;
  const strict = tier * 0.06 + (budget < 40 ? 0.08 : 0);

  const baseConf =
    observation.coherence * (1 - observation.uncertainty * 0.55) * (1 - observation.conflict * 0.35) +
    observation.salience * 0.12;

  const legality = clamp01(0.92 - strict - observation.conflict * 0.25);
  const provenance = clamp01(
    (options.provenanceHint ?? 0.75) * (1 - observation.novelty * 0.15) * (1 - tier * 0.05)
  );

  const contradiction = clamp01(
    observation.conflict * 0.55 + observation.uncertainty * 0.35 + (1 - legality) * 0.25
  );

  const confidence = clamp01(baseConf * (1 - contradiction * 0.45));

  const timedOut = budget <= 0;

  const proof = timedOut
    ? { confidence: 0.2, legality: 0.2, provenance: 0.2, contradiction: 0.85 }
    : { confidence, legality, provenance, contradiction };

  return { proof, tier, timedOut };
}
