/**
 * R6 — Constitutional feedback learning loop — karar telemetrisinden policy tuning ipuçları (saf fonksiyon).
 * Canlı eşik yazmaz; öneri üretir. Onay / rollout R7 katmanına bırakılır.
 */

export const RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION = "1.0.0";

/**
 * @typedef {{
 *   at: number,
 *   traceId?: string | null,
 *   action: string,
 *   severityRank?: number,
 *   dominantRuleId?: string | null,
 *   ethicalScore?: number,
 *   harmGradient?: number,
 *   totalRelativeCost?: number,
 *   latencyOk?: boolean,
 *   envelopeWithinBudget?: boolean | null,
 *   outcomeLabel?: string | null
 * }} RhizohConstitutionalFeedbackEvent
 */

/**
 * Kazanan policyTrace kuralını kabaca işaretler (matched + severityRank ile ilk eşleşme).
 * @param {{ policyTrace?: ReadonlyArray<{ ruleId?: string, matched?: boolean, severity?: number }>, severityRank?: number }} decision
 */
export function inferRhizohConstitutionalDominantRuleId(decision) {
  const rank = Number(decision?.severityRank ?? 0);
  const tr = decision?.policyTrace || [];
  const hit = tr.find((r) => r?.matched === true && Number(r?.severity ?? 0) === rank);
  return hit?.ruleId ? String(hit.ruleId) : null;
}

/**
 * @param {{
 *   traceId?: string | null,
 *   decision: Record<string, unknown>,
 *   ethics?: Record<string, unknown>,
 *   cost?: Record<string, unknown>,
 *   latencyAssertion?: Record<string, unknown>,
 *   envelopeWithinLatencyBudget?: boolean | null,
 *   outcomeLabel?: string | null,
 *   at?: number
 * }} snap
 * @returns {RhizohConstitutionalFeedbackEvent}
 */
export function normalizeRhizohConstitutionalFeedbackEvent(snap) {
  const decision = snap.decision && typeof snap.decision === "object" ? snap.decision : {};
  const ethics = snap.ethics && typeof snap.ethics === "object" ? snap.ethics : {};
  const cost = snap.cost && typeof snap.cost === "object" ? snap.cost : {};
  const latencyAssertion =
    snap.latencyAssertion && typeof snap.latencyAssertion === "object" ? snap.latencyAssertion : {};

  const action = String(decision.action ?? "unknown");
  const dominantRuleId =
    inferRhizohConstitutionalDominantRuleId(
      /** @type {{ policyTrace?: unknown[], severityRank?: number }} */ (decision)
    );

  return {
    at: snap.at ?? Date.now(),
    traceId: snap.traceId ?? null,
    action,
    severityRank: decision.severityRank != null ? Number(decision.severityRank) : undefined,
    dominantRuleId,
    ethicalScore: ethics.ethicalScore != null ? Number(ethics.ethicalScore) : undefined,
    harmGradient: ethics.harmGradient != null ? Number(ethics.harmGradient) : undefined,
    totalRelativeCost: cost.totalRelativeCost != null ? Number(cost.totalRelativeCost) : undefined,
    latencyOk: latencyAssertion.ok !== false,
    envelopeWithinBudget:
      snap.envelopeWithinLatencyBudget === true || snap.envelopeWithinLatencyBudget === false
        ? snap.envelopeWithinLatencyBudget
        : null,
    outcomeLabel: snap.outcomeLabel != null ? String(snap.outcomeLabel) : null
  };
}

/**
 * Ring buffer — deterministik sıra korunur (gateway tek süreç varsayımı).
 * @template T
 * @param {T[]} buffer mutable
 * @param {T} event
 * @param {number} [maxSize]
 */
export function appendRhizohConstitutionalFeedbackRing(buffer, event, maxSize = 2000) {
  buffer.push(event);
  while (buffer.length > maxSize) buffer.shift();
  return buffer.length;
}

/**
 * @param {ReadonlyArray<RhizohConstitutionalFeedbackEvent>} events
 */
export function aggregateRhizohConstitutionalFeedbackWindow(events = []) {
  const n = events.length;
  if (n === 0) {
    return {
      loopVersion: RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION,
      sampleCount: 0,
      actionRates: {},
      ruleHitRates: {},
      rejectRate: 0,
      throttleRate: 0,
      modifyRate: 0,
      recoveryRate: 0,
      allowRate: 0,
      latencyOkRate: null,
      avgEthicalScore: null,
      avgHarmGradient: null,
      avgRelativeCost: null,
      negativeOutcomeRate: null
    };
  }

  /** @type {Record<string, number>} */
  const actionCounts = {};
  /** @type {Record<string, number>} */
  const ruleCounts = {};
  let latencyOkCount = 0;
  let latencyDenom = 0;
  let ethSum = 0;
  let ethN = 0;
  let harmSum = 0;
  let harmN = 0;
  let costSum = 0;
  let costN = 0;
  let negOutcome = 0;
  let outcomeN = 0;

  for (const e of events) {
    const a = String(e.action || "unknown");
    actionCounts[a] = (actionCounts[a] || 0) + 1;
    const rid = e.dominantRuleId || "_unknown_rule";
    ruleCounts[rid] = (ruleCounts[rid] || 0) + 1;
    if (e.latencyOk !== undefined) {
      latencyDenom += 1;
      if (e.latencyOk) latencyOkCount += 1;
    }
    if (e.ethicalScore != null && Number.isFinite(e.ethicalScore)) {
      ethSum += e.ethicalScore;
      ethN += 1;
    }
    if (e.harmGradient != null && Number.isFinite(e.harmGradient)) {
      harmSum += e.harmGradient;
      harmN += 1;
    }
    if (e.totalRelativeCost != null && Number.isFinite(e.totalRelativeCost)) {
      costSum += e.totalRelativeCost;
      costN += 1;
    }
    if (e.outcomeLabel) {
      outcomeN += 1;
      if (e.outcomeLabel === "negative") negOutcome += 1;
    }
  }

  const rate = (k) => (actionCounts[k] || 0) / n;
  const ruleRate = Object.fromEntries(
    Object.entries(ruleCounts).map(([k, c]) => [k, Math.round((c / n) * 10000) / 10000])
  );

  return {
    loopVersion: RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION,
    sampleCount: n,
    actionRates: Object.fromEntries(
      Object.entries(actionCounts).map(([k, c]) => [k, Math.round((c / n) * 10000) / 10000])
    ),
    ruleHitRates: ruleRate,
    rejectRate: Math.round(rate("reject") * 10000) / 10000,
    throttleRate: Math.round(rate("throttle") * 10000) / 10000,
    modifyRate: Math.round(rate("modify") * 10000) / 10000,
    recoveryRate: Math.round(rate("require_recovery") * 10000) / 10000,
    allowRate: Math.round(rate("allow") * 10000) / 10000,
    latencyOkRate:
      latencyDenom > 0 ? Math.round((latencyOkCount / latencyDenom) * 10000) / 10000 : null,
    avgEthicalScore: ethN > 0 ? Math.round((ethSum / ethN) * 1000) / 1000 : null,
    avgHarmGradient: harmN > 0 ? Math.round((harmSum / harmN) * 1000) / 1000 : null,
    avgRelativeCost: costN > 0 ? Math.round((costSum / costN) * 1000) / 1000 : null,
    negativeOutcomeRate:
      outcomeN > 0 ? Math.round((negOutcome / outcomeN) * 10000) / 10000 : null
  };
}

/**
 * Agregattan konservatif tuning önerileri — R7 onayı olmadan uygulanmamalı.
 * @param {ReturnType<typeof aggregateRhizohConstitutionalFeedbackWindow>} aggregate
 */
export function proposeRhizohConstitutionalPolicyTuningFromAggregate(aggregate) {
  /** @type {{ proposalId: string, kind: string, field?: string, suggestedValue?: number, rationale: string }[]} */
  const proposals = [];
  const n = aggregate.sampleCount;
  if (n < 80) {
    proposals.push({
      proposalId: "R6-P00_insufficient_sample",
      kind: "noop",
      rationale: `Örnek ${n}<80; öneri güveni düşük — daha fazla olay toplanana kadar rollout yapmayın.`
    });
    return proposals;
  }

  if (aggregate.rejectRate > 0.07 && aggregate.avgEthicalScore != null && aggregate.avgEthicalScore > 0.48) {
    proposals.push({
      proposalId: "R6-P01_reject_vs_mid_ethics",
      kind: "threshold_delta",
      field: "minEthicsScoreReject",
      suggestedValue: 0.2,
      rationale: `rejectRate=${aggregate.rejectRate} yüksek ama avgEthicalScore=${aggregate.avgEthicalScore}; minEthicsScoreReject gevşetilmesi değerlendirilebilir (R7 onayı).`
    });
  }

  if (aggregate.rejectRate > 0.06 && aggregate.avgHarmGradient != null && aggregate.avgHarmGradient < 0.55) {
    proposals.push({
      proposalId: "R6-P02_harm_false_positive",
      kind: "threshold_delta",
      field: "maxHarmGradientReject",
      suggestedValue: 0.85,
      rationale: `rejectRate=${aggregate.rejectRate} iken avgHarmGradient=${aggregate.avgHarmGradient} düşük; maxHarmGradientReject artırımı değerlendirilebilir.`
    });
  }

  if (aggregate.throttleRate > 0.22 && aggregate.latencyOkRate != null && aggregate.latencyOkRate > 0.92) {
    proposals.push({
      proposalId: "R6-P03_cost_throttle_noise",
      kind: "threshold_delta",
      field: "maxRelativeCostThrottle",
      suggestedValue: 22,
      rationale: `throttleRate=${aggregate.throttleRate} ama latencyOkRate=${aggregate.latencyOkRate}; maliyet eşiği (gateway relative cost) yükseltilebilir.`
    });
  }

  if (aggregate.recoveryRate > 0.12 && aggregate.avgEthicalScore != null && aggregate.avgEthicalScore > 0.5) {
    proposals.push({
      proposalId: "R6-P04_recovery_overfire",
      kind: "threshold_delta",
      field: "minThetaSnapDeltaRecovery",
      suggestedValue: 0.18,
      rationale: `recoveryRate=${aggregate.recoveryRate} yüksek ve avgEthicalScore=${aggregate.avgEthicalScore}; snap eşiği gevşetilebilir.`
    });
  }

  if (aggregate.negativeOutcomeRate != null && aggregate.negativeOutcomeRate > 0.25 && aggregate.modifyRate > 0.35) {
    proposals.push({
      proposalId: "R6-P05_user_negative_modify_wave",
      kind: "policy_review",
      rationale: `negativeOutcomeRate=${aggregate.negativeOutcomeRate}, modifyRate=${aggregate.modifyRate}; M01 eşikleri veya içerik filtresi insan gözden geçirmesi (R7).`
    });
  }

  if (proposals.length === 0) {
    proposals.push({
      proposalId: "R6-P99_no_signal",
      kind: "noop",
      rationale: "Mevcut agregatta güvenli otomatik tuning sinyali yok."
    });
  }

  return proposals;
}
