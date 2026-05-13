/**
 * Prefix keyframe "field" trajectories: tensor drift, coupling proxy flow, invariance growth/decay.
 */
import { computeMetricTensorFieldV1 } from "./genesisReplayMetricTensorFieldV1.js";
import { computeCrossManifoldAlignmentV1 } from "./genesisReplayCrossManifoldAlignmentV1.js";
import { segmentManifoldFromEmbeddingV1 } from "./genesisReplayManifoldSegmentV1.js";
import { computeTemporalRenormalizationAxisV1 } from "./genesisReplayTemporalRenormalizeV1.js";

export const GENESIS_REPLAY_FIELD_EVOLUTION_LAW_SCHEMA = "castle.genesis.replay_field_evolution_law.v1";

/**
 * @param {{ windowIndex: number, from: number, to: number, x: number, y: number, z: number }[]} points
 */
function sortedEmbedPoints(points) {
  const pts = Array.isArray(points) ? [...points] : [];
  pts.sort((a, b) => Math.floor(Number(a.windowIndex) || 0) - Math.floor(Number(b.windowIndex) || 0));
  return pts;
}

/** @param {number} n sample count */
function prefixKeyframeEnds(n) {
  if (n < 2) return [];
  if (n === 2) return [2];
  const mid = Math.min(n - 1, Math.max(3, Math.floor((2 + n) / 2)));
  return [...new Set([2, mid, n])]
    .filter((m) => m >= 2 && m <= n)
    .sort((a, b) => a - b);
}

/**
 * @param {unknown} cm
 */
function meanJaccardFromCrossAlignment(cm) {
  /** @type {number[]} */
  const j = [];
  const pairwise = Array.isArray(
    /** @type {{ pairwiseAlignments?: unknown[] }} */ (cm)?.pairwiseAlignments
  )
    ? /** @type {{ pairs?: { windowJaccard?: unknown }[] }[]} */ (
        /** @type {{ pairwiseAlignments: unknown[] }} */ (cm).pairwiseAlignments
      )
    : [];
  for (const pa of pairwise) {
    const pairs = Array.isArray(pa.pairs) ? pa.pairs : [];
    for (const pair of pairs) {
      j.push(Math.min(1, Math.max(0, Number(pair.windowJaccard) || 0)));
    }
  }
  return j.length > 0 ? j.reduce((a, b) => a + b, 0) / j.length : 1;
}

/**
 * @param {number[][]} A
 * @param {number[][]} B
 */
function tensorFrobeniusDiff(A, B) {
  let s = 0;
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      const u = Number(A[i]?.[j]) || 0;
      const v = Number(B[i]?.[j]) || 0;
      const d = u - v;
      s += d * d;
    }
  }
  return Math.sqrt(s);
}

/**
 * @param {number} d
 */
function trend3(d) {
  if (d > 0.04) return "growth";
  if (d < -0.04) return "decay";
  return "flat";
}

/**
 * @param {{
 *   temporalEmbeddingProjection: unknown,
 *   equivalenceClassStabilityField: unknown,
 *   metricTensorField?: unknown,
 *   stabilityCouplingAxis?: unknown,
 *   invarianceManifoldAxis?: unknown
 * }} bundle
 */
export function computeFieldEvolutionLawV1(bundle) {
  const pts = sortedEmbedPoints(
    /** @type {{ points?: { windowIndex: number, from: number, to: number, x: number, y: number, z: number }[] }} */ (
      bundle.temporalEmbeddingProjection
    )?.points
  );
  const n = pts.length;
  const instab = Math.min(
    1,
    Math.max(0, Number(/** @type {{ instabilityIndex?: unknown }} */ (bundle.equivalenceClassStabilityField)?.instabilityIndex) || 0)
  );

  if (n < 2) {
    const gCoupling = Number(/** @type {{ couplingScore?: unknown }} */ (bundle.stabilityCouplingAxis)?.couplingScore);
    const gInv = Number(/** @type {{ invarianceBreadthScore?: unknown }} */ (bundle.invarianceManifoldAxis)?.invarianceBreadthScore);
    return {
      schema: GENESIS_REPLAY_FIELD_EVOLUTION_LAW_SCHEMA,
      windowSampleCount: n,
      prefixKeyframeEnds: [],
      tensorKeyframes: [],
      tensorEvolution: null,
      couplingKeyframes: [],
      couplingFlow: null,
      invarianceKeyframes: [],
      invarianceDynamics: null,
      lawTags: ["insufficient_prefix_samples"],
      globalCouplingScore: Number.isFinite(gCoupling)
        ? Math.round(Math.min(1, Math.max(0, gCoupling)) * 10000) / 10000
        : 0,
      globalInvarianceBreadth: Number.isFinite(gInv)
        ? Math.round(Math.min(1, Math.max(0, gInv)) * 10000) / 10000
        : 0
    };
  }

  const ends = prefixKeyframeEnds(n);

  /** @type {{ prefixLength: number, tensor: number[][], axisCouplingIndex: number, totalVariance: number, anisotropyRatio: number }[]} */
  const tensorKeyframes = [];
  /** @type {{ prefixLength: number, alignmentCoherence: number, spreadProxy: number, couplingProxy: number }[]} */
  const couplingKeyframes = [];
  /** @type {{ prefixLength: number, manifoldInvarianceScore: number, coClusteringAgreement: number }[]} */
  const invarianceKeyframes = [];

  for (const m of ends) {
    const slice = pts.slice(0, m);
    const T = computeMetricTensorFieldV1(slice);
    tensorKeyframes.push({
      prefixLength: m,
      tensor: T.tensor,
      axisCouplingIndex: T.axisCouplingIndex,
      totalVariance: T.totalVariance,
      anisotropyRatio: T.anisotropyRatio
    });

    const cm = computeCrossManifoldAlignmentV1(slice);
    const align = meanJaccardFromCrossAlignment(cm);
    const tv = Number(T.totalVariance) || 0;
    const spreadProxy = Math.min(1, Math.max(0.05, 1 / (1 + tv * 6)));
    const couplingProxy =
      Math.round(Math.sqrt(Math.max(0, align) * spreadProxy) * (1 - 0.35 * instab) * 10000) / 10000;
    couplingKeyframes.push({
      prefixLength: m,
      alignmentCoherence: Math.round(align * 10000) / 10000,
      spreadProxy: Math.round(spreadProxy * 10000) / 10000,
      couplingProxy
    });

    const man = segmentManifoldFromEmbeddingV1(slice);
    const tr = computeTemporalRenormalizationAxisV1(slice, man);
    invarianceKeyframes.push({
      prefixLength: m,
      manifoldInvarianceScore: Math.round((Number(tr.manifoldInvarianceScore) || 0) * 10000) / 10000,
      coClusteringAgreement: Math.round((Number(tr.coClusteringAgreement) || 0) * 10000) / 10000
    });
  }

  const firstT = tensorKeyframes[0];
  const lastT = tensorKeyframes[tensorKeyframes.length - 1];
  const firstC = couplingKeyframes[0];
  const lastC = couplingKeyframes[couplingKeyframes.length - 1];
  const firstI = invarianceKeyframes[0];
  const lastI = invarianceKeyframes[invarianceKeyframes.length - 1];

  /** @type {{ fromPrefix: number, toPrefix: number, tensorFrobeniusVelocity: number }[]} */
  const tensorSegmentVelocity = [];
  for (let u = 1; u < tensorKeyframes.length; u += 1) {
    const prev = tensorKeyframes[u - 1];
    const cur = tensorKeyframes[u];
    const df = tensorFrobeniusDiff(prev.tensor, cur.tensor);
    const dsteps = Math.max(1, cur.prefixLength - prev.prefixLength);
    tensorSegmentVelocity.push({
      fromPrefix: prev.prefixLength,
      toPrefix: cur.prefixLength,
      tensorFrobeniusVelocity: Math.round((df / dsteps) * 10000) / 10000
    });
  }

  const dCoupling = lastC.couplingProxy - firstC.couplingProxy;
  const dAxis = lastT.axisCouplingIndex - firstT.axisCouplingIndex;
  const dVar = lastT.totalVariance - firstT.totalVariance;
  const dAniso = lastT.anisotropyRatio - firstT.anisotropyRatio;
  const dInv = lastI.manifoldInvarianceScore - firstI.manifoldInvarianceScore;
  const dCoAg = lastI.coClusteringAgreement - firstI.coClusteringAgreement;

  const tensorEvolution = {
    deltaAxisCouplingIndex: Math.round(dAxis * 10000) / 10000,
    deltaTotalVariance: Math.round(dVar * 10000) / 10000,
    deltaAnisotropyRatio: Math.round(dAniso * 10000) / 10000,
    axisCouplingTrend: trend3(dAxis),
    totalVarianceTrend: trend3(dVar),
    tensorSegmentVelocity
  };

  const couplingFlow = {
    deltaCouplingProxy: Math.round(dCoupling * 10000) / 10000,
    couplingProxyTrend: trend3(dCoupling),
    alignmentDelta: Math.round((lastC.alignmentCoherence - firstC.alignmentCoherence) * 10000) / 10000
  };

  const invarianceDynamics = {
    deltaManifoldInvarianceScore: Math.round(dInv * 10000) / 10000,
    deltaCoClusteringAgreement: Math.round(dCoAg * 10000) / 10000,
    invarianceTrend: trend3(dInv),
    coClusterTrend: trend3(dCoAg)
  };

  /** @type {string[]} */
  const lawTags = [];
  if (dAxis > 0.03 && dCoupling < -0.03) {
    lawTags.push("tensor_coupling_counterflow");
  }
  if (dInv < -0.05 && dCoupling > 0.03) {
    lawTags.push("invariance_decouples_from_coupling_proxy_rise");
  }
  if (dInv > 0.05 && dAxis > 0.04) {
    lawTags.push("joint_metric_churn_with_invariance_recovery");
  }
  if (dInv < -0.06 && dCoAg < -0.06) {
    lawTags.push("invariance_decay_channel");
  }
  if (tensorEvolution.totalVarianceTrend === "growth" && invarianceDynamics.invarianceTrend === "growth") {
    lawTags.push("variance_invariance_co_growth");
  }
  if (lawTags.length === 0) {
    lawTags.push("no_strong_cross_term");
  }

  const globalCouplingScore = Math.min(
    1,
    Math.max(0, Number(/** @type {{ couplingScore?: unknown }} */ (bundle.stabilityCouplingAxis)?.couplingScore) || 0)
  );
  const globalInvarianceBreadth = Math.min(
    1,
    Math.max(0, Number(/** @type {{ invarianceBreadthScore?: unknown }} */ (bundle.invarianceManifoldAxis)?.invarianceBreadthScore) || 0)
  );

  return {
    schema: GENESIS_REPLAY_FIELD_EVOLUTION_LAW_SCHEMA,
    windowSampleCount: n,
    prefixKeyframeEnds: ends,
    tensorKeyframes,
    tensorEvolution,
    couplingKeyframes,
    couplingFlow,
    invarianceKeyframes,
    invarianceDynamics,
    lawTags: lawTags.slice(0, 8),
    globalCouplingScore: Math.round(globalCouplingScore * 10000) / 10000,
    globalInvarianceBreadth: Math.round(globalInvarianceBreadth * 10000) / 10000
  };
}
