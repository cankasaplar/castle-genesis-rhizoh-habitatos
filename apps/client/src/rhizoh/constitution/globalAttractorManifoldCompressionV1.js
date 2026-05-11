/**
 * RHIZOH global attractor manifold compression — uzun θ izinin düşük parametreli özeti (sıkıştırılmış manifold kodlayıcı).
 */

import { resolveRhizohThetaPhase } from "./thetaPhaseTransitionV1.js";

export const RHIZOH_GLOBAL_ATTRACTOR_MANIFOLD_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {{ at?: number, theta: number, phase?: string | null }[]} samples kronolojik
 */
function linearRegressionThetaVsTime(samples) {
  const pts = samples.filter((s) => Number.isFinite(s.at) && Number.isFinite(s.theta));
  if (pts.length < 3) return { slopePerMs: 0, intercept: 0, residualVar: 0 };
  let sumT = 0;
  let sumY = 0;
  for (const p of pts) {
    sumT += p.at;
    sumY += clamp01(p.theta);
  }
  const n = pts.length;
  const meanT = sumT / n;
  const meanY = sumY / n;
  let num = 0;
  let den = 0;
  let ssY = 0;
  for (const p of pts) {
    const t = p.at - meanT;
    const y = clamp01(p.theta) - meanY;
    num += t * y;
    den += t * t;
    ssY += y * y;
  }
  const slopePerMs = den > 1e-12 ? num / den : 0;
  const intercept = meanY - slopePerMs * meanT;
  let resid = 0;
  for (const p of pts) {
    const pred = intercept + slopePerMs * p.at;
    const e = clamp01(p.theta) - pred;
    resid += e * e;
  }
  const residualVar = resid / Math.max(1, n - 2);
  return {
    slopePerMs: Math.round(slopePerMs * 1e12) / 1e12,
    intercept: Math.round(intercept * 10000) / 10000,
    residualVar: Math.round(residualVar * 100000) / 100000
  };
}

/**
 * @param {{
 *   samples?: import('./thetaMemoryDriftV1.js').RhizohThetaMemorySample[],
 *   path?: ReadonlyArray<{ at?: number, theta: number, phase?: string | null }>
 * }} input
 */
export function compressRhizohGlobalAttractorManifold(input) {
  const raw =
    input.samples?.length ? [...input.samples] : (input.path || []).map((p) => ({ ...p }));

  const sorted = [...raw].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const thetas = sorted.map((s) => clamp01(s.theta));

  const n = thetas.length;
  const thetaMean = n ? thetas.reduce((a, b) => a + b, 0) / n : 0;
  let varTheta = 0;
  for (const t of thetas) varTheta += (t - thetaMean) ** 2;
  varTheta = n > 1 ? varTheta / (n - 1) : 0;
  const thetaStd = Math.sqrt(varTheta);

  const regression = linearRegressionThetaVsTime(sorted);

  /** @type {Record<string, number>} */
  const phaseHistogram = {};
  for (const s of sorted) {
    const ph = s.phase || resolveRhizohThetaPhase(clamp01(s.theta)).phase;
    phaseHistogram[ph] = (phaseHistogram[ph] || 0) + 1;
  }
  for (const k of Object.keys(phaseHistogram)) {
    phaseHistogram[k] = Math.round((phaseHistogram[k] / Math.max(1, n)) * 1000) / 1000;
  }

  const paramsStored =
    5 +
    Object.keys(phaseHistogram).length +
    (Number.isFinite(regression.slopePerMs) ? 3 : 0);
  const compressionRatio = n > 0 ? Math.round((n / Math.max(8, paramsStored)) * 1000) / 1000 : 0;

  const lastAt = sorted[n - 1]?.at ?? 0;
  const representativeThetaStar = clamp01(regression.intercept + regression.slopePerMs * lastAt);

  return {
    compressedVersion: RHIZOH_GLOBAL_ATTRACTOR_MANIFOLD_VERSION,
    sampleCount: n,
    thetaMean: Math.round(thetaMean * 10000) / 10000,
    thetaStd: Math.round(thetaStd * 10000) / 10000,
    regression,
    phaseHistogram,
    representativeThetaStar: Math.round(representativeThetaStar * 10000) / 10000,
    intrinsicDimensionEstimate: 1,
    parameterBudget: paramsStored,
    compressionRatio,
    decodeHint:
      "Tek θ ekseni + zaman eğimi + faz histogramı ile yeniden örnekleme veya replay ile yaklaşık geri çözüm."
  };
}

/**
 * İki sıkıştırılmış manifold özetinin θ-mahal uzaklığı [0,1] ölçeği.
 */
export function distanceRhizohCompressedAttractorManifolds(a, b) {
  const dm = Math.abs((a.thetaMean ?? 0) - (b.thetaMean ?? 0));
  const ds = Math.abs((a.thetaStd ?? 0) - (b.thetaStd ?? 0));
  const drift = Math.abs((a.regression?.slopePerMs ?? 0) - (b.regression?.slopePerMs ?? 0));
  return clamp01(0.55 * dm + 0.25 * ds + Math.min(1, drift * 1e9) * 0.2);
}
