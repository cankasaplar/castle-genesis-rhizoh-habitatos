/**
 * Çok-bölge policy quorum ipucu — ağırlıklı çoğunluk (saf fonksiyon).
 * v1.1: eski oy damgaları (observedAtMs) ile kartinite güvenli latency politikası ipuçları.
 */

export const RHIZOH_CONSTITUTIONAL_REGIONAL_QUORUM_VERSION = "1.1.0";

/**
 * @param {ReadonlyArray<{ regionId: string, stance?: string, weight?: number, observedAtMs?: number }>} votes
 * @param {{
 *   quorumRatio?: number,
 *   maxVoteAgeMs?: number,
 *   waitCapMs?: number,
 *   holdOnStaleExcluded?: boolean,
 *   nowMs?: number
 * }} [opts]
 */
export function computeRhizohConstitutionalRegionalQuorum(votes = [], opts = {}) {
  const quorumRatio =
    opts.quorumRatio != null && Number.isFinite(Number(opts.quorumRatio))
      ? Math.max(0, Math.min(1, Number(opts.quorumRatio)))
      : 0.51;

  const nowMs =
    opts.nowMs != null && Number.isFinite(Number(opts.nowMs)) ? Number(opts.nowMs) : Date.now();
  const waitCapMs =
    opts.waitCapMs != null && Number.isFinite(Number(opts.waitCapMs)) && Number(opts.waitCapMs) >= 0
      ? Number(opts.waitCapMs)
      : null;
  const maxVoteAgeMs =
    opts.maxVoteAgeMs != null && Number.isFinite(Number(opts.maxVoteAgeMs)) && Number(opts.maxVoteAgeMs) > 0
      ? Number(opts.maxVoteAgeMs)
      : null;
  const holdOnStaleExcluded = opts.holdOnStaleExcluded === true;

  const clean = votes.filter((v) => v && typeof v === "object" && String(v.regionId || "").trim());

  /** @type {string[]} */
  const staleExcludedRegions = [];
  /** @type {typeof clean} */
  let quorumVotes = clean;

  if (maxVoteAgeMs != null) {
    quorumVotes = [];
    for (const v of clean) {
      const regionId = String(v.regionId || "").trim();
      const observed = v.observedAtMs != null ? Number(v.observedAtMs) : null;
      if (observed != null && Number.isFinite(observed) && nowMs - observed > maxVoteAgeMs) {
        staleExcludedRegions.push(regionId);
      } else {
        quorumVotes.push(v);
      }
    }
  }

  let approve = 0;
  let reject = 0;
  let abstain = 0;
  let total = 0;

  for (const v of quorumVotes) {
    const w = Number.isFinite(Number(v.weight)) ? Math.max(0, Number(v.weight)) : 1;
    total += w;
    const s = String(v.stance || "abstain").toLowerCase();
    if (s === "approve" || s === "yes") approve += w;
    else if (s === "reject" || s === "no") reject += w;
    else abstain += w;
  }

  const denom = total > 0 ? total : 1;
  const approveRatio = approve / denom;
  const rejectRatio = reject / denom;

  let recommendation = "hold";
  if (approveRatio >= quorumRatio && approveRatio > rejectRatio) recommendation = "promote_policy";
  else if (rejectRatio >= quorumRatio && rejectRatio > approveRatio) recommendation = "rollback_policy";

  const quorumReached =
    approveRatio >= quorumRatio || rejectRatio >= quorumRatio || abstain === total;

  /** @type {{ quorumLatencySchemaVersion: string, waitCapMs: number | null, maxVoteAgeMs: number | null, staleExcludedRegions: string[], eligibleRegions: number, submittedRegions: number, holdDueToStaleVotes: boolean, holdReason: string | null }} */
  const latencyPolicy = {
    quorumLatencySchemaVersion: "1.0.0",
    waitCapMs,
    maxVoteAgeMs,
    staleExcludedRegions,
    eligibleRegions: quorumVotes.length,
    submittedRegions: clean.length,
    holdDueToStaleVotes: false,
    holdReason: null
  };

  if (holdOnStaleExcluded && staleExcludedRegions.length > 0) {
    recommendation = "hold";
    latencyPolicy.holdDueToStaleVotes = true;
    latencyPolicy.holdReason = "stale_vote_age_exceeded";
  }

  return {
    quorumSchemaVersion: RHIZOH_CONSTITUTIONAL_REGIONAL_QUORUM_VERSION,
    participatingRegions: quorumVotes.length,
    totalWeight: total,
    approveRatio: Math.round(approveRatio * 10000) / 10000,
    rejectRatio: Math.round(rejectRatio * 10000) / 10000,
    abstainRatio: Math.round((abstain / denom) * 10000) / 10000,
    quorumRatio,
    quorumReached,
    recommendation,
    latencyPolicy
  };
}
