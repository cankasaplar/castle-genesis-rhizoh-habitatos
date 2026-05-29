/**
 * Narrative validation v0 — anti-overtrust guard.
 * (1) Confidence decomposition + source agreement
 * (2) Uncertainty injection (projection bias, etc.)
 * (3) Narrative vs raw metrics divergence monitor
 * @see docs/ops/NARRATIVE_VALIDATION_V1.0.md
 */

import { FAILURE_MODE_ID_V0 } from "./failureModeClassificationV0.js";
import {
  SYSTEM_HEALTH_V0,
  SYSTEM_PRESSURE_V0,
  SYSTEM_RISK_V0
} from "./unifiedStateNarrativeV0.js";

export const NARRATIVE_VALIDATION_SCHEMA_V0 = "rhizoh.narrative_validation.v0";

export const UNCERTAINTY_TAG_V0 = Object.freeze({
  PROJECTION_BIAS: "projection_bias",
  SIM_COORDINATION: "sim_coordination_uncertainty",
  STALE_LOAD_TEST: "stale_load_test_projection",
  SINGLE_SOURCE_DOMINANCE: "single_source_dominance",
  OVER_COMPRESSION: "over_compression_risk",
  LOW_SOURCE_AGREEMENT: "low_source_agreement"
});

export const DIVERGENCE_FLAG_V0 = Object.freeze({
  NARRATIVE_METRICS_MISMATCH: "narrative_metrics_mismatch",
  STORY_HEALTH_VS_RAW: "story_health_vs_raw_mismatch",
  STORY_RISK_VS_RAW: "story_risk_vs_raw_mismatch",
  CONFIDENCE_OVERTRUST: "confidence_overtrust_vs_agreement"
});

/**
 * Infer per-source health/risk vote from raw signals.
 * @param {object} signals
 */
function inferSourceVotesV0(signals) {
  const rollout = signals.rollout || {};
  const gclHealth = signals.gcl?.health || {};
  const lifecycle = signals.lifecycle || {};
  const lt = signals.loadTest?.analysis || null;

  const limit = Number(rollout.limit) || 0;
  const active = Number(rollout.activeTurns) || 0;
  const util = limit > 0 ? active / limit : 0;

  /** @type {{ health: string, pressure: string, risk: string, confidence: number, raw: Record<string, unknown> }} */
  const gclVote = {
    health: gclHealth.ok === false ? SYSTEM_HEALTH_V0.DEGRADED : SYSTEM_HEALTH_V0.STABLE,
    pressure: SYSTEM_PRESSURE_V0.LOW,
    risk: SYSTEM_RISK_V0.NONE,
    confidence: gclHealth.ok === false ? 0.9 : 0.85,
    raw: { gclOk: gclHealth.ok !== false, mode: gclHealth.mode }
  };

  let rolloutHealth = SYSTEM_HEALTH_V0.STABLE;
  let rolloutPressure = SYSTEM_PRESSURE_V0.LOW;
  let rolloutRisk = SYSTEM_RISK_V0.NONE;
  if (rollout.health?.ok === false) rolloutHealth = SYSTEM_HEALTH_V0.DEGRADED;
  else if (util >= 0.5) rolloutHealth = SYSTEM_HEALTH_V0.DEGRADED;
  else if (util >= 0.25 || rollout.zsetPressure === "watch") rolloutHealth = SYSTEM_HEALTH_V0.STRESSED;
  if (util >= 0.7 || rollout.zsetPressure === "elevated") rolloutPressure = SYSTEM_PRESSURE_V0.HIGH;
  else if (util >= 0.35) rolloutPressure = SYSTEM_PRESSURE_V0.MEDIUM;
  if (util >= 0.2 || Number(rollout.leaseSkew) > 2) rolloutRisk = SYSTEM_RISK_V0.LEAK;
  if (Number(lifecycle.purged) > 0 && active <= 2) rolloutRisk = SYSTEM_RISK_V0.LEAK;

  const rolloutVote = {
    health: rolloutHealth,
    pressure: rolloutPressure,
    risk: rolloutRisk,
    confidence: signals.coordination?.sim ? 0.55 : 0.8,
    raw: { activeTurns: active, limit, utilization: util, zsetPressure: rollout.zsetPressure }
  };

  const lifecycleVote = {
    health:
      Number(lifecycle.purged) > 0 && active > limit * 0.15
        ? SYSTEM_HEALTH_V0.STRESSED
        : SYSTEM_HEALTH_V0.STABLE,
    pressure: Number(lifecycle.purged) > 5 ? SYSTEM_PRESSURE_V0.MEDIUM : SYSTEM_PRESSURE_V0.LOW,
    risk: Number(lifecycle.purged) > 0 ? SYSTEM_RISK_V0.LEAK : SYSTEM_RISK_V0.NONE,
    confidence: 0.75,
    raw: { purged: lifecycle.purged, activeTurns: active }
  };

  const dominant = lt?.dominantFailureMode || FAILURE_MODE_ID_V0.HEALTHY;
  let ltHealth = SYSTEM_HEALTH_V0.STABLE;
  let ltPressure = SYSTEM_PRESSURE_V0.LOW;
  let ltRisk = SYSTEM_RISK_V0.NONE;
  if (dominant === FAILURE_MODE_ID_V0.SOFT_SATURATION) {
    ltHealth = SYSTEM_HEALTH_V0.STRESSED;
    ltPressure = SYSTEM_PRESSURE_V0.HIGH;
    ltRisk = SYSTEM_RISK_V0.SATURATION;
  } else if (dominant === FAILURE_MODE_ID_V0.ROLLOUT_HYSTERESIS) {
    ltHealth = SYSTEM_HEALTH_V0.STRESSED;
    ltRisk = SYSTEM_RISK_V0.LEAK;
  } else if (dominant === FAILURE_MODE_ID_V0.GCL_DRIFT) {
    ltHealth = SYSTEM_HEALTH_V0.DEGRADED;
    ltRisk = SYSTEM_RISK_V0.DRIFT;
  } else if (dominant !== FAILURE_MODE_ID_V0.HEALTHY) {
    ltHealth = SYSTEM_HEALTH_V0.STRESSED;
  }

  const loadTestVote = lt
    ? {
        health: ltHealth,
        pressure: ltPressure,
        risk: ltRisk,
        confidence: lt.executionMode === "coordination_sim" ? 0.6 : 0.82,
        raw: { dominant, executionMode: lt.executionMode, sliceCount: lt.sliceCount }
      }
    : null;

  return Object.freeze({
    gcl: gclVote,
    rollout: rolloutVote,
    lifecycle: lifecycleVote,
    loadTest: loadTestVote
  });
}

function voteAgreesWithNarrative(vote, systemState, field) {
  if (!vote) return { agrees: false, weight: 0 };
  const agrees = vote[field] === systemState[field];
  return { agrees, weight: vote.confidence };
}

/**
 * (1) Confidence decomposition + source agreement breakdown.
 */
export function decomposeNarrativeConfidenceV0(signals, systemState) {
  const votes = inferSourceVotesV0(signals);
  /** @type {Record<string, { score: number, agreesWithNarrative: boolean, health: string, risk: string, pressure: string, raw: object }>} */
  const sources = {};
  /** @type {string[]} */
  const dissenting = [];
  let aligned = 0;
  let total = 0;

  for (const [key, vote] of Object.entries(votes)) {
    if (!vote) continue;
    total += 1;
    const healthOk = voteAgreesWithNarrative(vote, systemState, "health");
    const riskOk = voteAgreesWithNarrative(vote, systemState, "risk");
    const pressureOk = voteAgreesWithNarrative(vote, systemState, "pressure");
    const agreesCount = [healthOk.agrees, riskOk.agrees, pressureOk.agrees].filter(Boolean).length;
    const agreesWithNarrative = agreesCount >= 2;
    if (agreesWithNarrative) aligned += 1;
    else dissenting.push(key);

    const score =
      vote.confidence * (agreesCount / 3) * (agreesWithNarrative ? 1 : 0.55);

    sources[key] = Object.freeze({
      score: Math.round(score * 1000) / 1000,
      agreesWithNarrative,
      health: vote.health,
      risk: vote.risk,
      pressure: vote.pressure,
      agreementDimensions: Object.freeze({
        health: healthOk.agrees,
        risk: riskOk.agrees,
        pressure: pressureOk.agrees
      }),
      raw: vote.raw
    });
  }

  const agreementRatio = total > 0 ? Math.round((aligned / total) * 1000) / 1000 : 0;
  const scores = Object.values(sources).map((s) => s.score);
  const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5;
  const minScore = scores.length ? Math.min(...scores) : 0.5;
  const trustworthy = Math.round(Math.min(mean, minScore + 0.15) * 1000) / 1000;
  const headline = systemState.confidence;
  const overtrustGap = Math.max(0, Math.round((headline - trustworthy) * 1000) / 1000);
  const overtrustRisk =
    overtrustGap >= 0.2 || agreementRatio < 0.5
      ? "high"
      : overtrustGap >= 0.1 || agreementRatio < 0.75
        ? "medium"
        : "low";

  return Object.freeze({
    composite: Object.freeze({
      headlineConfidence: headline,
      trustworthy,
      overtrustGap,
      overtrustRisk,
      recommendation: overtrustRisk !== "low" ? "prefer_trustworthy_over_headline" : "headline_ok"
    }),
    sources,
    agreement: Object.freeze({
      alignedSources: aligned,
      totalSources: total,
      agreementRatio,
      dissenting
    })
  });
}

/**
 * (2) Systemic uncertainty injection — not user blame, model humility.
 */
export function injectNarrativeUncertaintyV0(signals, systemState, confidenceDecomposition) {
  /** @type {{ id: string, labelTr: string, labelEn: string, systemic: true, reason: string }[]} */
  const tags = [];
  const rollout = signals.rollout || {};
  const util = Number(systemState.drivers?.rolloutUtilization) || 0;
  const lt = signals.loadTest;
  const dominant = lt?.dominantFailureMode || lt?.analysis?.dominantFailureMode;

  if (signals.coordination?.sim) {
    tags.push({
      id: UNCERTAINTY_TAG_V0.SIM_COORDINATION,
      labelTr: "Coordination katmanı simüle — hikaye kısmen projeksiyon önyargısı taşıyabilir.",
      labelEn: "Coordination is simulated; narrative may carry projection bias.",
      systemic: true,
      reason: "CASTLE_COORDINATION_SIM=1"
    });
  }

  if (
    lt?.available &&
    dominant === FAILURE_MODE_ID_V0.SOFT_SATURATION &&
    util < 0.15 &&
    (rollout.activeTurns || 0) < 5
  ) {
    tags.push({
      id: UNCERTAINTY_TAG_V0.PROJECTION_BIAS,
      labelTr:
        "Bu hikaye load-test projeksiyonuna dayanıyor olabilir; canlı rollout şu an sakin görünüyor.",
      labelEn: "Story may be projection bias: load test shows saturation while live rollout is calm.",
      systemic: true,
      reason: "load_test_dominant_vs_live_idle"
    });
  }

  if (lt?.available && !signals.source?.includes?.("live")) {
    /* live always present in gatherOperationalSignals */
  }

  if (confidenceDecomposition.agreement.totalSources === 1) {
    tags.push({
      id: UNCERTAINTY_TAG_V0.SINGLE_SOURCE_DOMINANCE,
      labelTr: "Tek kaynak hikayeyi domine ediyor — çoklu doğrulama eksik.",
      labelEn: "Single source dominates narrative; multi-source validation missing.",
      systemic: true,
      reason: "only_one_source_available"
    });
  }

  if (confidenceDecomposition.agreement.agreementRatio < 0.5) {
    tags.push({
      id: UNCERTAINTY_TAG_V0.LOW_SOURCE_AGREEMENT,
      labelTr: "Kaynaklar narrative ile tam uyuşmuyor — düşük anlaşma oranı.",
      labelEn: "Sources disagree with compressed narrative; low agreement ratio.",
      systemic: true,
      reason: `agreement_ratio=${confidenceDecomposition.agreement.agreementRatio}`
    });
  }

  if (
    confidenceDecomposition.composite.overtrustRisk === "high" &&
    systemState.confidence >= 0.85
  ) {
    tags.push({
      id: UNCERTAINTY_TAG_V0.OVER_COMPRESSION,
      labelTr: "Sıkıştırılmış güven skoru ham metriklerden yüksek — over-compression riski.",
      labelEn: "Compressed confidence exceeds raw agreement; over-compression risk.",
      systemic: true,
      reason: "headline_confidence_above_trustworthy"
    });
  }

  if (lt?.available && dominant && !lt.analysis?.analyzedAt) {
    tags.push({
      id: UNCERTAINTY_TAG_V0.STALE_LOAD_TEST,
      labelTr: "Load-test analizi zaman damgası belirsiz — hikaye bayat olabilir.",
      labelEn: "Load-test analysis timestamp unclear; narrative may be stale.",
      systemic: true,
      reason: "missing_analyzed_at"
    });
  }

  return Object.freeze({ tags, count: tags.length });
}

/**
 * (3) Narrative vs raw divergence monitor — "story wrong, metrics right".
 */
export function monitorNarrativeRawDivergenceV0(signals, systemState, interpretation) {
  const votes = inferSourceVotesV0(signals);
  const rollout = signals.rollout || {};
  const util = Number(systemState.drivers?.rolloutUtilization) || 0;
  const active = Number(rollout.activeTurns) || 0;
  const limit = Number(rollout.limit) || 0;
  const dominant = signals.loadTest?.dominantFailureMode || signals.loadTest?.analysis?.dominantFailureMode;

  /** @type {{ id: string, severity: string, detail: string, narrativeClaim: string, rawEvidence: Record<string, unknown> }[]} */
  const flags = [];

  if (
    systemState.risk === SYSTEM_RISK_V0.SATURATION &&
    util < 0.2 &&
    active < Math.max(5, limit * 0.05) &&
    dominant === FAILURE_MODE_ID_V0.SOFT_SATURATION
  ) {
    flags.push({
      id: DIVERGENCE_FLAG_V0.NARRATIVE_METRICS_MISMATCH,
      severity: "high",
      detail: "Narrative saturation risk driven by load-test; live rollout metrics are calm.",
      narrativeClaim: `risk=${systemState.risk}, health=${systemState.health}`,
      rawEvidence: { utilization: util, activeTurns: active, loadTestDominant: dominant }
    });
  }

  if (
    systemState.health === SYSTEM_HEALTH_V0.STABLE &&
    (util >= 0.45 || active > limit * 0.4)
  ) {
    flags.push({
      id: DIVERGENCE_FLAG_V0.STORY_HEALTH_VS_RAW,
      severity: "high",
      detail: "Narrative says stable but live rollout utilization is high.",
      narrativeClaim: `health=${systemState.health}`,
      rawEvidence: { utilization: util, activeTurns: active, limit }
    });
  }

  if (systemState.risk === SYSTEM_RISK_V0.NONE && votes.rollout?.risk === SYSTEM_RISK_V0.LEAK) {
    flags.push({
      id: DIVERGENCE_FLAG_V0.STORY_RISK_VS_RAW,
      severity: "medium",
      detail: "Narrative risk=none but rollout/lifecycle raw vote indicates leak.",
      narrativeClaim: `risk=${systemState.risk}`,
      rawEvidence: { rolloutVote: votes.rollout.risk, lifecyclePurged: signals.lifecycle?.purged }
    });
  }

  if (systemState.risk === SYSTEM_RISK_V0.LEAK && active <= 1 && Number(signals.lifecycle?.purged) === 0) {
    flags.push({
      id: DIVERGENCE_FLAG_V0.NARRATIVE_METRICS_MISMATCH,
      severity: "medium",
      detail: "Narrative leak/hysteresis but live in-flight is near zero with no reconcile purge.",
      narrativeClaim: `risk=${systemState.risk}`,
      rawEvidence: { activeTurns: active, purged: signals.lifecycle?.purged, loadTestDominant: dominant }
    });
  }

  const decomp = decomposeNarrativeConfidenceV0(signals, systemState);
  if (
    decomp.composite.overtrustGap >= 0.15 &&
    flags.length === 0
  ) {
    flags.push({
      id: DIVERGENCE_FLAG_V0.CONFIDENCE_OVERTRUST,
      severity: "medium",
      detail: "Headline confidence exceeds trustworthy composite without explicit metric conflict.",
      narrativeClaim: `confidence=${systemState.confidence}`,
      rawEvidence: {
        trustworthy: decomp.composite.trustworthy,
        agreementRatio: decomp.agreement.agreementRatio
      }
    });
  }

  const divergenceScore =
    flags.length === 0
      ? 0
      : Math.min(
          1,
          Math.round(
            (flags.filter((f) => f.severity === "high").length * 0.4 +
              flags.length * 0.15) *
              1000
          ) / 1000
        );

  const validated = flags.length === 0 && decomp.agreement.agreementRatio >= 0.75;

  return Object.freeze({
    divergenceScore,
    validated,
    flagCount: flags.length,
    flags,
    antiOvertrust: Object.freeze({
      metricsRightStoryWrong: flags.some((f) => f.id === DIVERGENCE_FLAG_V0.NARRATIVE_METRICS_MISMATCH),
      guidance: validated
        ? "Narrative aligned with raw signals"
        : "Treat narrative as hypothesis; verify raw metrics before action"
    }),
    rawVotes: votes
  });
}

/**
 * Full validation pass (non-executable).
 */
export function validateNarrativeV0(signals, systemState, interpretation) {
  const confidenceDecomposition = decomposeNarrativeConfidenceV0(signals, systemState);
  const uncertainty = injectNarrativeUncertaintyV0(signals, systemState, confidenceDecomposition);
  const divergence = monitorNarrativeRawDivergenceV0(signals, systemState, interpretation);

  const adjustedConfidence = Math.min(
    systemState.confidence,
    confidenceDecomposition.composite.trustworthy,
    divergence.validated ? 1 : 1 - divergence.divergenceScore * 0.25
  );

  return Object.freeze({
    schema: NARRATIVE_VALIDATION_SCHEMA_V0,
    validatedAt: new Date().toISOString(),
    confidenceDecomposition,
    uncertainty,
    divergence,
    adjustedConfidence: Math.round(adjustedConfidence * 1000) / 1000,
    trustPosture:
      divergence.validated && confidenceDecomposition.composite.overtrustRisk === "low"
        ? "narrative_trusted_with_caveats"
        : "narrative_hypothesis_only",
    executionContract: "validation_only_no_execution_v0"
  });
}
