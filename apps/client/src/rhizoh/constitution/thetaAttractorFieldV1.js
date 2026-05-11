/**
 * RHIZOH θ attractor field — uzun vadeli kişilik çekim noktaları (Gaussian havuzları + bileşik merkez).
 * θ ∈ [0,1] üzerinde yumuşak çekiş; faz eşikleriyle uyumlu üç ana havuz.
 */

import { RHIZOH_THETA_PHASE_ELASTIC_MAX, RHIZOH_THETA_PHASE_IMMUNE_MIN } from "./thetaPhaseTransitionV1.js";

export const RHIZOH_THETA_ATTRACTOR_FIELD_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Varsayılan çekiş merkezleri: elastik, dengeli, bağışıklık.
 * `sigma`: havuz genişliği; `strength`: nispi kütle (softmax ağırlığı).
 */
export const RHIZOH_DEFAULT_THETA_ATTRACTORS_V1 = Object.freeze([
  Object.freeze({
    id: "elastic_basin",
    center: 0.1,
    strength: 1,
    sigma: Math.max(0.06, RHIZOH_THETA_PHASE_ELASTIC_MAX * 0.85)
  }),
  Object.freeze({
    id: "constitutional_balanced",
    center: 0.45,
    strength: 1.25,
    sigma: 0.2
  }),
  Object.freeze({
    id: "immune_basin",
    center: 0.88,
    strength: 1,
    sigma: Math.max(0.08, (1 - RHIZOH_THETA_PHASE_IMMUNE_MIN) * 0.55)
  })
]);

/**
 * @typedef {{
 *   id: string,
 *   center: number,
 *   strength?: number,
 *   sigma: number
 * }} RhizohThetaAttractorDef
 */

/**
 * @param {number} theta
 * @param {{
 *   attractors?: ReadonlyArray<RhizohThetaAttractorDef>,
 *   temperature?: number
 * }} [opts]
 */
export function computeRhizohThetaAttractorField(theta, opts = {}) {
  const t = clamp01(theta);
  const attractors = opts.attractors?.length ? opts.attractors : RHIZOH_DEFAULT_THETA_ATTRACTORS_V1;
  const temperature = opts.temperature != null ? Math.max(0.02, Number(opts.temperature)) : 1;

  /** @type {number[]} */
  const logits = attractors.map((a) => {
    const sigma = Math.max(1e-4, Number(a.sigma) || 0.15);
    const d = (t - clamp01(a.center)) / sigma;
    const mass = Math.exp(-(d * d) / temperature) * (Number(a.strength) > 0 ? Number(a.strength) : 1);
    return mass;
  });
  const sum = logits.reduce((s, x) => s + x, 0) || 1;
  const weights = logits.map((w) => w / sum);

  let compositeAttractorTheta = 0;
  for (let i = 0; i < attractors.length; i++) {
    compositeAttractorTheta += weights[i] * clamp01(attractors[i].center);
  }
  compositeAttractorTheta = clamp01(compositeAttractorTheta);

  let domIdx = 0;
  for (let i = 1; i < weights.length; i++) {
    if (weights[i] > weights[domIdx]) domIdx = i;
  }

  const fieldPull = Math.round((compositeAttractorTheta - t) * 10000) / 10000;
  const shallowPotential = -Math.log(sum);

  return {
    theta: t,
    compositeAttractorTheta,
    dominantAttractorId: attractors[domIdx].id,
    dominantWeight: Math.round(weights[domIdx] * 1000) / 1000,
    basinWeights: attractors.map((a, i) => ({
      id: a.id,
      weight: Math.round(weights[i] * 1000) / 1000,
      center: clamp01(a.center)
    })),
    fieldPull,
    shallowPotential: Math.round(shallowPotential * 1000) / 1000,
    longTermPersonalityBasin: attractors[domIdx].id
  };
}

/**
 * Küçük adımda θ’yı alan çekişine doğru kaydırma önerisi (η ile ölçekli).
 * @param {number} theta
 * @param {number} [eta]
 * @param {Parameters<typeof computeRhizohThetaAttractorField>[1]} [fieldOpts]
 */
export function suggestRhizohThetaAttractorStep(theta, eta = 0.08, fieldOpts) {
  const e = clamp01(eta);
  const field = computeRhizohThetaAttractorField(theta, fieldOpts);
  const thetaSuggested = clamp01(theta + e * field.fieldPull);
  return {
    ...field,
    thetaSuggested,
    eta: e
  };
}
