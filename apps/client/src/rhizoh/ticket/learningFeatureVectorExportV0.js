/**
 * Learning Feature Vector Export V0 — RESEARCH-ONLY substrate for downstream learning.
 *
 * Exports read-only feature vectors from mutation ledger + live index + drift.
 * Never writes CubeState, admission, or trace truth.
 * @see docs/RHIZOH_LEARNING_FEATURE_VECTOR_EXPORT_V1.md
 */

import { MUTATION_REASON_CATEGORY_V1 } from "./mutationReasonCodeOntologyV1.js";

export const LEARNING_FEATURE_VECTOR_SCHEMA_V0 = "castle.rhizoh.learning_feature_vector.v0";

/**
 * @param {{
 *   records: object[],
 *   indexSnapshot?: object,
 *   drift?: { signals?: object[], categoryCounts?: Record<string, number> },
 *   analytics?: { forecast?: { risks?: object[] } },
 *   alerts?: { alerts?: object[] }
 * }} input
 */
export function exportLearningFeatureVectorV0(input) {
  const records = input.records || [];
  const total = records.length;

  /** @type {Record<string, number>} */
  const categoryCounts = {};
  let accepted = 0;
  let rejected = 0;
  let quotaDenied = 0;

  for (const r of records) {
    const cat = r?.reason?.category || "NONE";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    if (r?.status === "accepted") accepted += 1;
    else if (r?.status === "quota_denied") quotaDenied += 1;
    else rejected += 1;
  }

  const categoryShares = {};
  for (const [cat, count] of Object.entries(categoryCounts)) {
    categoryShares[cat] = total > 0 ? count / total : 0;
  }

  const scShare = categoryShares[MUTATION_REASON_CATEGORY_V1.SC] || 0;
  const quotaShare = categoryShares[MUTATION_REASON_CATEGORY_V1.QUOTA] || 0;
  const recShare = categoryShares[MUTATION_REASON_CATEGORY_V1.REC] || 0;

  const driftSignals = input.drift?.signals || [];
  const maxDriftSeverity = driftSignals.reduce((max, s) => Math.max(max, s.share01 || 0), 0);

  const epochTrend = computeEpochTrendV0(records);
  const acceptanceRatio = total > 0 ? accepted / total : 0;
  const permissionStress = scShare;

  const forecastRisks = input.analytics?.forecast?.risks || [];
  const alertCount = input.alerts?.alerts?.length ?? 0;

  return Object.freeze({
    schema: LEARNING_FEATURE_VECTOR_SCHEMA_V0,
    vector: Object.freeze({
      reasonCategoryShares: Object.freeze({ ...categoryShares }),
      driftSeverity01: maxDriftSeverity,
      epochTrend: Object.freeze(epochTrend),
      acceptanceRatio01: acceptanceRatio,
      rejectionRatio01: total > 0 ? rejected / total : 0,
      quotaDeniedRatio01: total > 0 ? quotaDenied / total : 0,
      permissionStress01: permissionStress,
      quotaStress01: quotaShare,
      recContinuityStress01: recShare,
      forecastRiskCount: forecastRisks.length,
      alertPacketCount: alertCount,
      sampleCount: total
    }),
    indexSnapshot: input.indexSnapshot
      ? Object.freeze({
          liveIngestCount: input.indexSnapshot.liveIngestCount,
          mutationPointerCount: input.indexSnapshot.mutationPointerCount
        })
      : undefined,
    interpretationOnly: true,
    nonExecutive: true,
    researchOnly: true
  });
}

/**
 * @param {object[]} records
 */
function computeEpochTrendV0(records) {
  /** @type {Map<string, number>} */
  const epochCounts = new Map();
  for (const r of records) {
    const epoch = String(r?.epoch || "rec_soft");
    epochCounts.set(epoch, (epochCounts.get(epoch) || 0) + 1);
  }
  const epochs = [...epochCounts.entries()].map(([epoch, count]) =>
    Object.freeze({ epoch, count })
  );
  return Object.freeze(epochs);
}
