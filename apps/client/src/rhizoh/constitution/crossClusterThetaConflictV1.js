/**
 * RHIZOH cross-cluster θ — explicit merge / arbitration when clusters disagree.
 */

export const RHIZOH_CROSS_CLUSTER_THETA_CONFLICT_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @typedef {{
 *   clusterId: string,
 *   theta: number,
 *   weight?: number,
 *   fingerprint?: string | null
 * }} RhizohCrossClusterThetaInput
 */

/**
 * @param {{
 *   clusters: RhizohCrossClusterThetaInput[],
 *   policy?:
 *     | "conservative_union_max"
 *     | "trust_elastic_floor"
 *     | "weighted_blend"
 *     | "median_dispersion_gate"
 *     | "deadlock_partition_hold",
 *   holdTheta?: number | null,
 *   dispersionTau?: number,
 *   localClusterId?: string | null
 * }} input
 */
export function resolveRhizohCrossClusterThetaConflict(input) {
  const clusters = (input.clusters || [])
    .map((c) => ({
      clusterId: String(c.clusterId || "unknown"),
      theta: clamp01(Number(c.theta)),
      weight: Math.max(0, Number(c.weight) || 1),
      fingerprint: c.fingerprint ?? null
    }))
    .filter((c) => Number.isFinite(c.theta));

  const policy = input.policy || "conservative_union_max";
  const holdTheta = input.holdTheta != null ? clamp01(Number(input.holdTheta)) : null;
  const dispersionTau =
    typeof input.dispersionTau === "number" && Number.isFinite(input.dispersionTau)
      ? clamp01(input.dispersionTau)
      : 0.18;

  if (clusters.length === 0) {
    return {
      resolvedTheta: holdTheta ?? 0,
      conflictResidual: 0,
      mergeRecommended: false,
      resolutionTrace: [{ step: "empty_clusters", value: holdTheta ?? 0 }],
      minorityClusters: [],
      dispersion: 0,
      policy
    };
  }

  const thetas = clusters.map((c) => c.theta);
  const minT = Math.min(...thetas);
  const maxT = Math.max(...thetas);
  const dispersion = maxT - minT;
  const wSum = clusters.reduce((s, c) => s + c.weight, 0);
  const weightedMean =
    wSum > 0 ? clusters.reduce((s, c) => s + c.theta * c.weight, 0) / wSum : mean(thetas);

  /** @type {Record<string, unknown>[]} */
  const resolutionTrace = [];
  let resolvedTheta = maxT;
  let mergeRecommended = true;

  if (policy === "conservative_union_max") {
    resolvedTheta = maxT;
    resolutionTrace.push({ step: "conservative_union_max", value: resolvedTheta });
  } else if (policy === "trust_elastic_floor") {
    resolvedTheta = minT;
    resolutionTrace.push({ step: "trust_elastic_floor", value: resolvedTheta });
  } else if (policy === "weighted_blend") {
    resolvedTheta = clamp01(weightedMean);
    resolutionTrace.push({ step: "weighted_blend", value: resolvedTheta });
  } else if (policy === "median_dispersion_gate") {
    const sorted = [...thetas].sort((a, b) => a - b);
    const mid = sorted[Math.floor(sorted.length / 2)];
    if (dispersion <= dispersionTau) {
      resolvedTheta = mid;
      resolutionTrace.push({ step: "median_low_dispersion", dispersion, value: resolvedTheta });
    } else if (holdTheta != null) {
      resolvedTheta = holdTheta;
      mergeRecommended = false;
      resolutionTrace.push({ step: "hold_local_high_dispersion", dispersion, value: resolvedTheta });
    } else {
      resolvedTheta = maxT;
      mergeRecommended = false;
      resolutionTrace.push({ step: "fallback_max_high_dispersion", dispersion, value: resolvedTheta });
    }
  } else if (policy === "deadlock_partition_hold") {
    resolvedTheta = holdTheta != null ? holdTheta : mean(thetas);
    mergeRecommended = dispersion <= dispersionTau;
    resolutionTrace.push({
      step: "deadlock_partition_hold",
      dispersion,
      mergeRecommended,
      value: resolvedTheta
    });
  } else {
    resolvedTheta = maxT;
    resolutionTrace.push({ step: "unknown_policy_fallback_max", policy });
  }

  const conflictResidual = clamp01(dispersion + (mergeRecommended ? 0 : 0.15));

  const minorityClusters = clusters
    .filter((c) => Math.abs(c.theta - resolvedTheta) > 0.12)
    .map((c) => c.clusterId);

  return {
    resolvedTheta,
    conflictResidual,
    mergeRecommended,
    resolutionTrace,
    minorityClusters,
    dispersion,
    policy,
    localClusterId: input.localClusterId ?? null
  };
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
