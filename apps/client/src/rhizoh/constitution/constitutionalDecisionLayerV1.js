/**
 * R5 — Constitutional decision layer — R1–R4 gözlemlerini tek policy çıktısına sentezler (karar tamamlayıcı).
 * Saf fonksiyon; yan etki yok. Enforcement çağıran katman (ör. gateway) ayrıdır.
 */

export const RHIZOH_CONSTITUTIONAL_DECISION_LAYER_VERSION = "1.0.0";

/** Varsayılan eşikler; çağıran `opts.thresholds` ile kısmen geçersiz kılabilir. */
export const RHIZOH_CONSTITUTIONAL_DECISION_POLICY_DEFAULTS_V1 = Object.freeze({
  /** ethicalScore bu altında → reject */
  minEthicsScoreReject: 0.22,
  /** ethicalScore bu altında (reject değilse) → modify */
  minEthicsScoreModify: 0.42,
  /** harmGradient bu üstünde → reject */
  maxHarmGradientReject: 0.8,
  /** gateway relative cost üst sınır → throttle */
  maxRelativeCostThrottle: 18,
  /** attractor snap |Δθ| bu üstünde ve ethics zayıfsa → require_recovery */
  minThetaSnapDeltaRecovery: 0.14,
  /** latency headroom (ms) altında → throttle */
  minLatencyHeadroomMsThrottle: 80,
  /** coercion + truth distortion birlikte yüksek → reject */
  minCoercionReject: 0.55,
  minTruthDistortionReject: 0.62
});

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** @typedef {"allow"|"modify"|"reject"|"throttle"|"require_recovery"} RhizohConstitutionalDecisionAction */

/**
 * @param {{
 *   ethics?: Record<string, unknown>,
 *   cost?: Record<string, unknown>,
 *   recovery?: Record<string, unknown>,
 *   latencyAssertion?: Record<string, unknown>,
 *   metrics?: Record<string, unknown>,
 *   envelopeWithinLatencyBudget?: boolean | null
 * }} observations
 * @param {{
 *   policyId?: string,
 *   thresholds?: Partial<typeof RHIZOH_CONSTITUTIONAL_DECISION_POLICY_DEFAULTS_V1>
 * }} [opts]
 */
export function synthesizeRhizohConstitutionalProductionDecision(observations = {}, opts = {}) {
  const thr = { ...RHIZOH_CONSTITUTIONAL_DECISION_POLICY_DEFAULTS_V1, ...(opts.thresholds || {}) };
  const policyId = opts.policyId ?? "rhizoh.constitutional.decision.gateway_default_v1";

  const ethics = observations.ethics && typeof observations.ethics === "object" ? observations.ethics : {};
  const cost = observations.cost && typeof observations.cost === "object" ? observations.cost : {};
  const recovery =
    observations.recovery && typeof observations.recovery === "object" ? observations.recovery : {};
  const attractorSnap =
    recovery.attractorSnap && typeof recovery.attractorSnap === "object"
      ? recovery.attractorSnap
      : {};
  const latencyAssertion =
    observations.latencyAssertion && typeof observations.latencyAssertion === "object"
      ? observations.latencyAssertion
      : {};

  const ethicalScore = clamp01(Number(ethics.ethicalScore ?? 0.5));
  const harmGradient = clamp01(Number(ethics.harmGradient ?? 0));
  const coercionPenalty = clamp01(Number(ethics.coercionPenalty ?? 0));
  const truthDistortionPenalty = clamp01(Number(ethics.truthDistortionPenalty ?? 0));
  const autonomyPreservation = clamp01(Number(ethics.autonomyPreservation ?? 1));
  const recommendProceed = ethics.recommendProceed !== false;

  const totalCost = Number(cost.totalRelativeCost ?? 0);
  const latencyOk = latencyAssertion.ok !== false;
  const headroomMs =
    latencyAssertion.headroomMs != null ? Number(latencyAssertion.headroomMs) : Infinity;

  const thetaBefore = clamp01(Number(attractorSnap.thetaBefore ?? 0));
  const thetaAfter = clamp01(Number(attractorSnap.thetaAfter ?? thetaBefore));
  const snapDelta = Math.abs(thetaAfter - thetaBefore);

  const collapseRisk = observations.metrics?.collapseRisk;
  const collapsePressure =
    collapseRisk != null && Number.isFinite(Number(collapseRisk)) ? clamp01(Number(collapseRisk)) : 0;

  /** @type {{ ruleId: string, severity: number, matched: boolean, detail?: string }[]} */
  const policyTrace = [];

  const pushRule = (ruleId, severity, matched, detail) => {
    policyTrace.push({ ruleId, severity, matched, ...(detail ? { detail } : {}) });
    return matched ? severity : 0;
  };

  let chosen = /** @type {RhizohConstitutionalDecisionAction} */ ("allow");
  let chosenSeverity = 0;

  const consider = (action, severity, matched, ruleId, detail) => {
    const s = pushRule(ruleId, severity, matched, detail);
    if (matched && s >= chosenSeverity) {
      chosen = action;
      chosenSeverity = s;
    }
  };

  consider(
    "reject",
    5,
    ethicalScore < thr.minEthicsScoreReject ||
      harmGradient >= thr.maxHarmGradientReject ||
      (coercionPenalty >= thr.minCoercionReject && truthDistortionPenalty >= thr.minTruthDistortionReject),
    "R5-E01_ethics_catastrophic",
    `ethicalScore=${ethicalScore.toFixed(3)},harm=${harmGradient.toFixed(3)}`
  );

  consider(
    "require_recovery",
    4,
    (snapDelta >= thr.minThetaSnapDeltaRecovery && (!recommendProceed || ethicalScore < thr.minEthicsScoreModify)) ||
      collapsePressure >= 0.78,
    "R5-X01_instability_or_collapse",
    `snapDelta=${snapDelta.toFixed(4)},collapse=${collapsePressure.toFixed(3)}`
  );

  consider(
    "throttle",
    3,
    !latencyOk ||
      headroomMs < thr.minLatencyHeadroomMsThrottle ||
      (Number.isFinite(totalCost) && totalCost > thr.maxRelativeCostThrottle) ||
      observations.envelopeWithinLatencyBudget === false,
    "R5-T01_latency_or_cost_pressure",
    `latencyOk=${latencyOk},headroom=${headroomMs},cost=${totalCost}`
  );

  consider(
    "modify",
    2,
    !recommendProceed ||
      ethicalScore < thr.minEthicsScoreModify ||
      coercionPenalty >= 0.38 ||
      autonomyPreservation < 0.42 ||
      truthDistortionPenalty >= 0.48,
    "R5-M01_ethics_soft_fail",
    `recommendProceed=${recommendProceed},score=${ethicalScore.toFixed(3)}`
  );

  if (chosenSeverity === 0) {
    chosen = "allow";
    policyTrace.push({
      ruleId: "R5-A01_default_allow",
      severity: 1,
      matched: true,
      detail: "no_higher_severity_rule"
    });
    chosenSeverity = 1;
  }

  const costPressure = clamp01(
    Number.isFinite(totalCost) ? Math.min(1, totalCost / Math.max(1, thr.maxRelativeCostThrottle)) : 0
  );
  let latencyPressure = latencyOk ? 0 : 1;
  if (latencyOk && Number.isFinite(headroomMs) && headroomMs < 400) {
    latencyPressure = clamp01((400 - Math.max(0, headroomMs)) / 400);
  }
  const ethicsSignal = ethicalScore;
  const recoveryInstability = clamp01(snapDelta / Math.max(1e-6, thr.minThetaSnapDeltaRecovery * 2));

  const combinedRisk = clamp01(
    (1 - ethicsSignal) * 0.38 +
      harmGradient * 0.22 +
      costPressure * 0.14 +
      latencyPressure * 0.14 +
      recoveryInstability * 0.12
  );

  const confidence = clamp01(1 - combinedRisk * (chosenSeverity / 5));

  return {
    decisionLayerVersion: RHIZOH_CONSTITUTIONAL_DECISION_LAYER_VERSION,
    policyId,
    action: chosen,
    confidence: Math.round(confidence * 1000) / 1000,
    reasoningVector: {
      ethicsSignal: Math.round(ethicsSignal * 1000) / 1000,
      costPressure: Math.round(costPressure * 1000) / 1000,
      latencyPressure: Math.round(latencyPressure * 1000) / 1000,
      recoveryInstability: Math.round(recoveryInstability * 1000) / 1000,
      combinedRisk: Math.round(combinedRisk * 1000) / 1000
    },
    policyTrace,
    severityRank: chosenSeverity
  };
}

/**
 * Kısa policy kapısı — allow dışındaki eylemlerde üst katman throttle/reject uygulayabilir.
 * @param {ReturnType<typeof synthesizeRhizohConstitutionalProductionDecision>} decision
 */
export function shouldProceedRhizohConstitutionalProduction(decision) {
  return decision?.action === "allow";
}
