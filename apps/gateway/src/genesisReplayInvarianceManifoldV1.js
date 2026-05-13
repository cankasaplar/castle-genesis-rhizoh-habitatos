/**
 * Declarative "safe generators" vs fragile directions from observed invariances (bounded, deterministic).
 */
import { GENESIS_REPLAY_MANIFOLD_EPSILON_SCALES } from "./genesisReplayCrossManifoldAlignmentV1.js";

export const GENESIS_REPLAY_INVARIANCE_MANIFOLD_SCHEMA = "castle.genesis.replay_invariance_manifold.v1";

/**
 * @param {{
 *   metricTensorField: unknown,
 *   temporalRenormalizationAxis: unknown,
 *   crossManifoldAlignment: unknown,
 *   stabilityCouplingAxis: unknown
 * }} p
 */
export function computeInvarianceManifoldAxisV1(p) {
  const invScore = Math.min(
    1,
    Math.max(0, Number(/** @type {{ manifoldInvarianceScore?: unknown }} */ (p.temporalRenormalizationAxis)?.manifoldInvarianceScore) || 0)
  );
  const coAg = Math.min(
    1,
    Math.max(0, Number(/** @type {{ coClusteringAgreement?: unknown }} */ (p.temporalRenormalizationAxis)?.coClusteringAgreement) || 0)
  );
  const axisCoupling = Math.min(
    2,
    Math.max(0, Number(/** @type {{ axisCouplingIndex?: unknown }} */ (p.metricTensorField)?.axisCouplingIndex) || 0)
  );
  const couplingScore = Math.min(
    1,
    Math.max(0, Number(/** @type {{ couplingScore?: unknown }} */ (p.stabilityCouplingAxis)?.couplingScore) || 0)
  );

  const segs = Array.isArray(
    /** @type {{ segmentations?: { regionCount?: unknown }[] }} */ (p.crossManifoldAlignment)?.segmentations
  )
    ? /** @type {{ regionCount: number }[]} */ (
        /** @type {{ segmentations: unknown[] }} */ (p.crossManifoldAlignment).segmentations
      )
    : [];
  const counts = segs.map((s) => Math.max(0, Math.floor(Number(s.regionCount) || 0))).filter((c) => c > 0);
  let scaleRobustness = 1;
  if (counts.length >= 2) {
    const mx = Math.max(...counts);
    const mn = Math.min(...counts);
    scaleRobustness = mx <= 1 ? 1 : Math.min(1, mn / mx + 0.25);
    scaleRobustness = Math.round(scaleRobustness * 10000) / 10000;
  }

  const confMinmax = Math.round(Math.min(1, 0.15 + 0.85 * (0.55 * invScore + 0.45 * coAg)) * 10000) / 10000;
  const confEpsilon = Math.round(Math.min(1, 0.2 + 0.8 * scaleRobustness * (0.5 + 0.5 * couplingScore)) * 10000) / 10000;

  /** @type {{ id: string, family: string, confidence: number, basis: Record<string, unknown> }[]} */
  const safeGenerators = [
    {
      id: "per_axis_minmax_embed",
      family: "affine_measure",
      confidence: confMinmax,
      basis: {
        manifoldInvarianceScore: Math.round(invScore * 10000) / 10000,
        coClusteringAgreement: Math.round(coAg * 10000) / 10000,
        normalization: String(/** @type {{ normalization?: unknown }} */ (p.temporalRenormalizationAxis)?.normalization || "")
      }
    },
    {
      id: "epsilon_scale_band",
      family: "linkage_rescale",
      confidence: confEpsilon,
      basis: {
        epsilonScales: [...GENESIS_REPLAY_MANIFOLD_EPSILON_SCALES],
        regionCountSpreadRobustness: scaleRobustness,
        stabilityCouplingScore: Math.round(couplingScore * 10000) / 10000
      }
    }
  ];

  /** @type {{ id: string, family: string, when: string, severity: number }[]} */
  const fragileDirections = [];
  if (axisCoupling >= 0.48) {
    fragileDirections.push({
      id: "cross_axis_linear_mix",
      family: "linear",
      when: `axisCouplingIndex>=${0.48}`,
      severity: Math.round(Math.min(1, (axisCoupling - 0.48) / 0.85) * 10000) / 10000
    });
  }
  if (invScore < 0.35 && coAg < 0.35) {
    fragileDirections.push({
      id: "aggressive_nonlinear_embed_warp",
      family: "nonlinear",
      when: "low_coClustering_and_invariance",
      severity: Math.round((1 - Math.max(invScore, coAg)) * 10000) / 10000
    });
  }

  const breadth =
    safeGenerators.reduce((s, g) => s + g.confidence, 0) / Math.max(1, safeGenerators.length) -
    fragileDirections.reduce((s, f) => s + f.severity, 0) * 0.22;
  const invarianceBreadthScore = Math.round(Math.max(0, Math.min(1, breadth)) * 10000) / 10000;

  return {
    schema: GENESIS_REPLAY_INVARIANCE_MANIFOLD_SCHEMA,
    safeGenerators,
    fragileDirections,
    invarianceBreadthScore,
    observedAxisCouplingIndex: Math.round(axisCoupling * 10000) / 10000
  };
}
