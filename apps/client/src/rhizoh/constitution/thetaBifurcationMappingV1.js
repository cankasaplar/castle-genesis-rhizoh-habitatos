/**
 * RHIZOH θ bifurcation mapping — küçük θ sapması → ayrık faz sıçraması hassasiyeti ve kritik şeritler.
 */

import {
  RHIZOH_THETA_PHASE_ELASTIC_MAX,
  RHIZOH_THETA_PHASE_IMMUNE_MIN,
  resolveRhizohThetaPhase
} from "./thetaPhaseTransitionV1.js";

export const RHIZOH_THETA_BIFURCATION_MAPPING_VERSION = "1.0.0";

/** Anayasal faz geçiş eşikleri (rezonan bölgeler). */
export const RHIZOH_THETA_PHASE_CRITICAL_BOUNDARIES_V1 = Object.freeze([
  Object.freeze({ theta: RHIZOH_THETA_PHASE_ELASTIC_MAX, label: "elastic_balanced_cusp" }),
  Object.freeze({ theta: RHIZOH_THETA_PHASE_IMMUNE_MIN, label: "balanced_immune_cusp" })
]);

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** @param {import('./thetaPhaseTransitionV1.js').RhizohThetaPhase} p */
function phaseRank(p) {
  if (p === "elastic_trust") return 0;
  if (p === "constitutional_balanced") return 1;
  return 2;
}

/**
 * @param {number} theta
 * @param {{
 *   epsilon?: number,
 *   boundaries?: ReadonlyArray<{ theta: number, label?: string }>
 * }} [opts]
 */
export function computeRhizohThetaBifurcationSensitivity(theta, opts = {}) {
  const t = clamp01(theta);
  const epsilon = Math.max(1e-6, Math.min(0.12, Number(opts.epsilon) || 0.025));

  const boundaries = opts.boundaries?.length ? opts.boundaries : RHIZOH_THETA_PHASE_CRITICAL_BOUNDARIES_V1;

  const minus = resolveRhizohThetaPhase(Math.max(0, t - epsilon)).phase;
  const base = resolveRhizohThetaPhase(t).phase;
  const plus = resolveRhizohThetaPhase(Math.min(1, t + epsilon)).phase;

  const jumpMinus = phaseRank(base) !== phaseRank(minus);
  const jumpPlus = phaseRank(base) !== phaseRank(plus);
  const regimeMarginal = jumpMinus || jumpPlus;

  let nearestBoundaryDist = 1;
  let nearestBoundaryLabel = "";
  for (const b of boundaries) {
    const bt = clamp01(b.theta);
    const d = Math.abs(t - bt);
    if (d < nearestBoundaryDist) {
      nearestBoundaryDist = d;
      nearestBoundaryLabel = String(b.label || "");
    }
  }

  const cuspVulnerability = clamp01(1 - nearestBoundaryDist / 0.18);

  const gainMinus = Math.abs(phaseRank(base) - phaseRank(minus)) / epsilon;
  const gainPlus = Math.abs(phaseRank(plus) - phaseRank(base)) / epsilon;
  const amplificationFactor = Math.round(Math.max(gainMinus, gainPlus) * 1000) / 1000;

  return {
    theta: t,
    epsilon,
    phases: { minus, base, plus },
    regimeMarginal,
    jumpDown: jumpMinus,
    jumpUp: jumpPlus,
    nearestBoundaryDist: Math.round(nearestBoundaryDist * 10000) / 10000,
    nearestBoundaryLabel,
    cuspVulnerability: Math.round(cuspVulnerability * 1000) / 1000,
    amplificationFactor,
    bifurcationBandHint:
      regimeMarginal || cuspVulnerability > 0.55 ? "high_discontinuity_risk" : "smooth_local"
  };
}

/**
 * θ aralığını tarayıp sıçrama bölgelerini özetler.
 * @param {{
 *   thetaMin?: number,
 *   thetaMax?: number,
 *   steps?: number,
 *   epsilon?: number
 * }} scan
 */
export function scanRhizohThetaBifurcationCurve(scan = {}) {
  const lo = clamp01(scan.thetaMin ?? 0);
  const hi = clamp01(scan.thetaMax ?? 1);
  const steps = Math.max(8, Math.min(256, Math.floor(scan.steps ?? 64)));
  const epsilon = scan.epsilon;

  /** @type {ReturnType<typeof computeRhizohThetaBifurcationSensitivity>[]} */
  const samples = [];
  for (let i = 0; i <= steps; i++) {
    const theta = lo + ((hi - lo) * i) / steps;
    samples.push(computeRhizohThetaBifurcationSensitivity(theta, { epsilon }));
  }

  const hotspots = samples.filter(
    (s) => s.regimeMarginal || s.cuspVulnerability >= 0.45 || s.amplificationFactor >= 8
  );

  return {
    samples,
    hotspots,
    criticalBoundaries: RHIZOH_THETA_PHASE_CRITICAL_BOUNDARIES_V1
  };
}
