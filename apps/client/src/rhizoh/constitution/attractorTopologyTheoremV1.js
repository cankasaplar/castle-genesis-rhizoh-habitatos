/**
 * RHIZOH attractor / topology theorem layer — [0,1] üzerinde sabit nokta göstergeleri, Banach şartı, ara değer tanığı.
 */

import { stepRhizohConstitutionalAdaptation } from "./constitutionalDynamicsV1.js";

export const RHIZOH_ATTRACTOR_TOPOLOGY_THEOREM_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * g(x) = f(x) − x işaret değişimi → Brouwer tanığı ([0,1] otomorfizm için klasik önsel).
 * @param {(x: number) => number} f
 * @param {number} [gridN]
 */
export function witnessRhizohIntervalFixedPointBrouwer(f, gridN = 96) {
  const n = Math.max(8, Math.min(512, Math.floor(gridN)));
  /** @type {{ x: number, gx: number }[]} */
  const samples = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    const fx = clamp01(f(x));
    const gx = fx - x;
    samples.push({ x, gx });
  }
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    if (a.gx === 0) return { found: true, kind: "exact_grid", x: a.x, gx: 0 };
    if (a.gx * b.gx < 0) {
      return {
        found: true,
        kind: "bracket",
        interval: [a.x, b.x],
        gxAtEnds: [a.gx, b.gx]
      };
    }
  }
  return { found: false, kind: "no_sign_change_on_grid", samples };
}

/**
 * Adaptasyon bir adımını θ_prev için kapalı görünüm: θ' = clamp(θ + α·(σ−τ)).
 * @param {{
 *   stressIndex: number,
 *   targetStress?: number,
 *   alpha?: number,
 *   thetaMin?: number,
 *   thetaMax?: number,
 *   adaptation?: { disabled?: boolean }
 * }} p
 */
export function rhizohAdaptationIntervalStepMap(p) {
  return (/** @type {number} */ thetaPrev) => {
    const step = stepRhizohConstitutionalAdaptation({
      thetaPrev: clamp01(thetaPrev),
      stressIndex: clamp01(p.stressIndex),
      targetStress: p.targetStress,
      alpha: p.alpha,
      thetaMin: p.thetaMin,
      thetaMax: p.thetaMax,
      adaptation: p.adaptation
    });
    return clamp01(step.thetaNext);
  };
}

/**
 * Adaptasyon haritası için Brouwer tanığı (ızgara üzerinde).
 */
export function theoremRhizohAdaptationFixedPointExistence(p, gridN = 96) {
  const f = rhizohAdaptationIntervalStepMap(p);
  return witnessRhizohIntervalFixedPointBrouwer(f, gridN);
}

/**
 * Banach: ||T(x)−T(y)|| ≤ L||x−y|| ve L<1 ise tek sabit nokta; burada T örneklenir.
 * @param {(x: number) => number} T
 * @param {number} x0
 * @param {number} L
 * @param {number} epsilon
 * @param {number} maxSteps
 */
export function banachRhizohIterateUniqueFixedPoint(T, x0, L, epsilon = 1e-5, maxSteps = 200) {
  const lip = clamp01(L);
  let x = clamp01(x0);
  /** @type {number[]} */
  const path = [x];
  for (let k = 1; k <= maxSteps; k++) {
    const Tx = clamp01(T(x));
    const delta = Math.abs(Tx - x);
    path.push(Tx);
    if (delta < epsilon) {
      return {
        converged: true,
        thetaStar: Tx,
        iterations: k,
        contractionCertified: lip < 1,
        lipUpperBound: lip,
        path
      };
    }
    x = Tx;
  }
  return {
    converged: false,
    thetaStar: x,
    iterations: maxSteps,
    contractionCertified: lip < 1,
    lipUpperBound: lip,
    path
  };
}

/**
 * θ' = θ + δ(θ) için |∂δ/∂θ| üst sınırı ~ 1 (stress sabitken kaydırma); sıkıştırma genelde Banach'ta sağlanmaz — raporlar.
 */
export function lipschitzRhizohAdaptationDriftMap(p) {
  const f = rhizohAdaptationIntervalStepMap(p);
  let maxSlope = 0;
  const grid = 64;
  for (let i = 1; i <= grid; i++) {
    const xa = (i - 1) / grid;
    const xb = i / grid;
    const dy = Math.abs(f(xb) - f(xa));
    const dx = xb - xa;
    maxSlope = Math.max(maxSlope, dy / Math.max(1e-12, dx));
  }
  return {
    empiricalLipschitzTheta: Math.round(maxSlope * 10000) / 10000,
    banachContractionLikely: maxSlope < 0.999,
    note:
      "Adaptasyon kayması θ_prev'tan çoğu senaryoda birim Lipschitz; teknik sıkıştırma için attractor karışımı / η daraltması gerekir."
  };
}

/**
 * Bir θ yörüngesinin grafında özduranlılık sayısı (periyod-1 sabit nokta yakınlığı).
 * @param {number[]} trajectory
 * @param {number} tol
 */
export function countRhizohTrajectoryAlmostFixedPoints(trajectory, tol = 0.012) {
  let c = 0;
  for (let i = 1; i < trajectory.length; i++) {
    if (Math.abs(trajectory[i] - trajectory[i - 1]) < tol) c += 1;
  }
  return { count: c, tol };
}
