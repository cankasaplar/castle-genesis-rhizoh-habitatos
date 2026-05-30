/**
 * SPECFLOW: RESEARCH-ONLY — **Feedback weighting governance**: explicit per-channel weights, clamps,
 * and rate limits so EWMA channels stay **separable** and bias cannot **run away**.
 *
 * `coherenceFeedbackLoopV0` holds per-lane state; this module defines **how much** each lane
 * may influence `kernelHints` (energy bias, language gate, conflict gate).
 *
 * Long-horizon **meta** adjustments (avoid over-stabilized personality) live in `coherenceGovernanceEvolutionV0.js`.
 * When evolution and this base profile disagree on numeric weights, precedence is explicit in
 * `coherenceGovernanceConflictResolverV0.js` (`resolveGovernanceFeedbackVsEvolutionV0`).
 */

export const COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0 = "castle.rhizoh.coherence_feedback_governance.v0";

/**
 * All weights are dimensionless; tune without changing loop state machine.
 * Negative weights = stabilizing / dampening contribution on energy bias.
 */
export const DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0 = Object.freeze({
  schema: COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0,
  /** Scale (youtubeEwma - 0.5) into bias contribution. */
  weightYoutubeOnEnergyBias: 0.14,
  /** WS chat metrics lane only (`wsMetricsEwma`). */
  weightWsMetricsOnEnergyBias: -0.1,
  /** Distributor network-activity lane only (`distributorPulseEwma`), not WS metrics. */
  weightDistributorPulseOnEnergyBias: -0.06,
  /** Drift / full-snapshot pressure from distributor (`distributorDriftEwma`). */
  weightDistributorDriftOnEnergyBias: -0.035,
  weightUiOnEnergyBias: 0.08,
  /** Studio lane (`studioEwma` 0..1). */
  weightStudioOnEnergyBias: -0.05,
  /** LLM stress lane (`llmStressEwma` 0..1) — orthogonal to UI. */
  weightLlmOnEnergyBias: 0.045,
  maxPeerEnergyBias01: 0.16,
  /** Runaway guard: max |Δbias| vs previous tick applied bias. */
  maxBiasDeltaPerTick: 0.042,
  /** `distinctLangCount` step thresholds on merged WS activity (metrics ∪ distributor). */
  wsLangGateLow: 0.26,
  wsLangGateHigh: 0.52,
  conflictGateWsMetrics: 0.68,
  conflictGateWsDistributor: 0.58,
  conflictGateUi: 0.82
});

/**
 * @param {Record<string, unknown>} state — `advanceCoherenceFeedbackStateV0` state
 * @param {number|null|undefined} lastAppliedPeerEnergyBias01 — previous tick bias (rate limit)
 * @param {Record<string, unknown>|null|undefined} [governance]
 * @returns {{ peerEnergyBias01: number, distinctLangCount: number, socialConflictFlag: boolean }}
 */
export function deriveGovernedKernelHintsFromStateV0(state, lastAppliedPeerEnergyBias01, governance) {
  const g =
    governance && typeof governance === "object" && governance.schema === COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0
      ? governance
      : DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0;

  const yt = Number(state?.youtubePerfEwma);
  const wsM = Number(state?.wsMetricsEwma);
  const distP = Number(state?.distributorPulseEwma);
  const distDr = Number(state?.distributorDriftEwma);
  const ui = Number(state?.uiImpulseEwma);
  const st = Number(state?.studioEwma);
  const llm = Number(state?.llmStressEwma);

  const ytn = (Number.isFinite(yt) ? yt : 0.5) - 0.5;
  const wsm = (Number.isFinite(wsM) ? wsM : 0) - 0.35;
  const dpn = (Number.isFinite(distP) ? distP : 0) - 0.35;
  const ddr = (Number.isFinite(distDr) ? distDr : 0) - 0.25;
  const uin = (Number.isFinite(ui) ? ui : 0) - 0.2;
  const stn = (Number.isFinite(st) ? st : 0) - 0.2;
  const llmn = (Number.isFinite(llm) ? llm : 0) - 0.28;

  const rawBias =
    Number(g.weightYoutubeOnEnergyBias) * ytn +
    Number(g.weightWsMetricsOnEnergyBias) * wsm +
    Number(g.weightDistributorPulseOnEnergyBias) * dpn +
    Number(g.weightDistributorDriftOnEnergyBias) * ddr +
    Number(g.weightUiOnEnergyBias) * uin +
    Number(g.weightStudioOnEnergyBias) * stn +
    Number(g.weightLlmOnEnergyBias) * llmn;

  const cap = Math.max(0.02, Number(g.maxPeerEnergyBias01) || 0.16);
  let bias = Math.min(cap, Math.max(-cap, rawBias));

  const last = Number(lastAppliedPeerEnergyBias01);
  const maxD = Math.max(0.005, Number(g.maxBiasDeltaPerTick) || 0.042);
  if (Number.isFinite(last)) {
    bias = Math.min(last + maxD, Math.max(last - maxD, bias));
  }

  const wsAct = Math.max(Number.isFinite(wsM) ? wsM : 0, Number.isFinite(distP) ? distP : 0);
  const low = Number(g.wsLangGateLow) || 0.26;
  const high = Number(g.wsLangGateHigh) || 0.52;
  let distinctLang = 1;
  if (wsAct > high) distinctLang = 3;
  else if (wsAct > low) distinctLang = 2;

  const gM = Number(g.conflictGateWsMetrics) || 0.68;
  const gD = Number(g.conflictGateWsDistributor) || 0.58;
  const gU = Number(g.conflictGateUi) || 0.82;
  const socialConflictFlag =
    (Number.isFinite(wsM) && wsM > gM) ||
    (Number.isFinite(distP) && distP > gD) ||
    (Number.isFinite(ui) && ui > gU);

  return {
    peerEnergyBias01: Math.round(bias * 10_000) / 10_000,
    distinctLangCount: distinctLang,
    socialConflictFlag
  };
}

/**
 * @param {Partial<typeof DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0>} patch
 */
export function mergeCoherenceFeedbackGovernanceV0(patch) {
  const p = patch && typeof patch === "object" ? patch : {};
  return { ...DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0, ...p, schema: COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0 };
}
