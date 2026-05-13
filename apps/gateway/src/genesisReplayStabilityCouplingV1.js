/**
 * Couples cross-scale alignment coherence with metric-stability score and identity churn.
 */
export const GENESIS_REPLAY_STABILITY_COUPLING_SCHEMA = "castle.genesis.replay_stability_coupling.v1";

/**
 * @param {{
 *   metricStabilityAxis: unknown,
 *   crossManifoldAlignment: unknown,
 *   equivalenceClassStabilityField: unknown
 * }} p
 */
export function computeStabilityCouplingAxisV1(p) {
  const stab = Math.min(1, Math.max(0, Number(/** @type {{ metricStabilityScore?: unknown }} */ (p.metricStabilityAxis)?.metricStabilityScore) || 0));
  const instab = Math.min(
    1,
    Math.max(0, Number(/** @type {{ instabilityIndex?: unknown }} */ (p.equivalenceClassStabilityField)?.instabilityIndex) || 0)
  );
  const ratioComfort =
    /** @type {{ flags?: { epsilonRatioInComfortBand?: boolean } }} */ (p.metricStabilityAxis)?.flags
      ?.epsilonRatioInComfortBand === true
      ? 1
      : 0.72;

  /** @type {number[]} */
  const jaccards = [];
  const pairwise = Array.isArray(
    /** @type {{ pairwiseAlignments?: unknown[] }} */ (p.crossManifoldAlignment)?.pairwiseAlignments
  )
    ? /** @type {{ pairs?: { windowJaccard?: unknown }[] }[]} */ (
        /** @type {{ pairwiseAlignments: unknown[] }} */ (p.crossManifoldAlignment).pairwiseAlignments
      )
    : [];
  for (const pa of pairwise) {
    const pairs = Array.isArray(pa.pairs) ? pa.pairs : [];
    for (const pair of pairs) {
      jaccards.push(Math.min(1, Math.max(0, Number(pair.windowJaccard) || 0)));
    }
  }
  const alignmentCoherence =
    jaccards.length > 0 ? Math.round((jaccards.reduce((a, b) => a + b, 0) / jaccards.length) * 10000) / 10000 : 1;

  const raw =
    Math.sqrt(Math.max(0, stab) * Math.max(0, alignmentCoherence)) * ratioComfort * (1 - 0.38 * instab);
  const couplingScore = Math.round(Math.max(0, Math.min(1, raw)) * 10000) / 10000;

  /** @type {string[]} */
  const feedbackTags = [];
  if (stab < 0.48 && alignmentCoherence >= 0.52) {
    feedbackTags.push("stability_soft_alignment_strong");
  }
  if (stab >= 0.55 && alignmentCoherence < 0.42) {
    feedbackTags.push("alignment_soft_metric_stable");
  }
  if (instab > 0.58 && couplingScore < 0.48) {
    feedbackTags.push("identity_churn_limits_coupling");
  }
  if (stab < 0.4 && alignmentCoherence < 0.4) {
    feedbackTags.push("joint_stress");
  }

  return {
    schema: GENESIS_REPLAY_STABILITY_COUPLING_SCHEMA,
    alignmentCoherence,
    metricStabilityScore: Math.round(stab * 10000) / 10000,
    equivalenceInstabilityIndex: Math.round(instab * 10000) / 10000,
    epsilonComfortAttenuation: ratioComfort,
    couplingScore,
    feedbackTags: feedbackTags.slice(0, 6)
  };
}
