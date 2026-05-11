/**
 * RHIZOH θ fixed-point convergence — adaptasyon yasası ± çekim alanı ile uzun vadeli θ* keşfi.
 */

import { stepRhizohConstitutionalAdaptation } from "./constitutionalDynamicsV1.js";
import { computeRhizohThetaAttractorField } from "./thetaAttractorFieldV1.js";

export const RHIZOH_THETA_FIXED_POINT_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Sabit stres altında yalnızca constitutional adaptation adımlarının sabit noktası.
 * @param {{
 *   theta0?: number,
 *   stressIndex: number,
 *   adaptation?: { disabled?: boolean },
 *   targetStress?: number,
 *   alpha?: number,
 *   thetaMin?: number,
 *   thetaMax?: number,
 *   maxSteps?: number,
 *   epsilon?: number
 * }} input
 */
export function iterateRhizohAdaptationFixedPoint(input) {
  const maxSteps = Math.max(4, Math.min(500, Math.floor(input.maxSteps ?? 120)));
  const epsilon = Math.max(1e-8, Number(input.epsilon) || 5e-5);
  let theta = clamp01(input.theta0 ?? 0);
  /** @type {{ step: number, theta: number }[]} */
  const path = [{ step: 0, theta }];

  for (let k = 1; k <= maxSteps; k++) {
    const step = stepRhizohConstitutionalAdaptation({
      thetaPrev: theta,
      stressIndex: clamp01(input.stressIndex),
      targetStress: input.targetStress,
      alpha: input.alpha,
      thetaMin: input.thetaMin,
      thetaMax: input.thetaMax,
      adaptation: input.adaptation
    });
    const delta = Math.abs(step.thetaNext - theta);
    theta = step.thetaNext;
    path.push({ step: k, theta });
    if (delta < epsilon) {
      return {
        thetaStar: theta,
        converged: true,
        iterations: k,
        path,
        mode: "adaptation_only"
      };
    }
  }

  return {
    thetaStar: theta,
    converged: false,
    iterations: maxSteps,
    path,
    mode: "adaptation_only"
  };
}

/**
 * Adaptasyon + θ attractor alanı karışımı ile ortak gevşeme (uzun vadeli kişilik çekişi).
 * @param {{
 *   theta0?: number,
 *   stressIndex: number,
 *   attractorBlend?: number,
 *   adaptation?: { disabled?: boolean },
 *   targetStress?: number,
 *   alpha?: number,
 *   thetaMin?: number,
 *   thetaMax?: number,
 *   maxSteps?: number,
 *   epsilon?: number,
 *   attractorFieldOpts?: Parameters<typeof computeRhizohThetaAttractorField>[1]
 * }} input
 */
export function discoverRhizohThetaLongTermAttractor(input) {
  const maxSteps = Math.max(8, Math.min(500, Math.floor(input.maxSteps ?? 160)));
  const epsilon = Math.max(1e-8, Number(input.epsilon) || 5e-5);
  const attractorBlend = clamp01(input.attractorBlend ?? 0.14);
  let theta = clamp01(input.theta0 ?? 0);

  /** @type {{ step: number, theta: number, compositeAttractorTheta?: number }[]} */
  const path = [{ step: 0, theta }];

  for (let k = 1; k <= maxSteps; k++) {
    const step = stepRhizohConstitutionalAdaptation({
      thetaPrev: theta,
      stressIndex: clamp01(input.stressIndex),
      targetStress: input.targetStress,
      alpha: input.alpha,
      thetaMin: input.thetaMin,
      thetaMax: input.thetaMax,
      adaptation: input.adaptation
    });
    let thetaNext = step.thetaNext;
    const field = computeRhizohThetaAttractorField(thetaNext, input.attractorFieldOpts || {});
    thetaNext = clamp01(
      (1 - attractorBlend) * thetaNext + attractorBlend * field.compositeAttractorTheta
    );

    const delta = Math.abs(thetaNext - theta);
    theta = thetaNext;
    path.push({ step: k, theta, compositeAttractorTheta: field.compositeAttractorTheta });
    if (delta < epsilon) {
      return {
        thetaStar: theta,
        converged: true,
        iterations: k,
        path,
        attractorBlend,
        mode: "adaptation_attractor_joint",
        terminalField: computeRhizohThetaAttractorField(theta, input.attractorFieldOpts || {})
      };
    }
  }

  return {
    thetaStar: theta,
    converged: false,
    iterations: maxSteps,
    path,
    attractorBlend,
    mode: "adaptation_attractor_joint",
    terminalField: computeRhizohThetaAttractorField(theta, input.attractorFieldOpts || {})
  };
}
