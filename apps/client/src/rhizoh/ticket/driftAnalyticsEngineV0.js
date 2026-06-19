/**
 * Drift Analytics Engine V0 — Temporal Curves · Causal Forecast · Suggestion Generator.
 *
 * DR-01: drift never mutates · DR-02: category/delta suggestions only
 * @see docs/RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md
 */

import { MUTATION_REASON_CATEGORY_V1, MUTATION_REASON_CODE_V1 } from "./mutationReasonCodeOntologyV1.js";
import { DRIFT_SIGNAL_KIND_V0 } from "./traceGraphIndexOptimizerV0.js";
import {
  assertDriftOutputGuardsV0,
  INVARIANT_DR_01_LOOP_V0
} from "./driftSuggestionGuardsV0.js";

export const DRIFT_ANALYTICS_SCHEMA_V0 = "castle.rhizoh.drift_analytics.v0";
export const DRIFT_SUGGESTION_SCHEMA_V0 = "castle.rhizoh.drift_suggestion.v0";

export const INVARIANT_RISK_ID_V0 = Object.freeze({
  SC_01: "SC_01_FROZEN_CORE",
  SC_02: "SC_02_INVALID_MUTATION_SOURCE",
  SC_03: "SC_03_TICKET_EXECUTION_DIRECT",
  SC_04: "SC_04_SELF_PRIVILEGE_ESCALATION",
  QUOTA_TOPOLOGY: "QUOTA_TOPOLOGY",
  REC_CONTINUITY: "REC_CONTINUITY",
  SIG_TRUST: "SIG_TRUST",
  DR_01_LOOP: INVARIANT_DR_01_LOOP_V0
});

let suggestionSeqV0 = 0;

/**
 * @param {object[]} records — MutationRecord v2
 */
export function buildTemporalDriftCurvesV0(records) {
  /** @type {Map<string, { total: number, categories: Record<string, number> }>} */
  const buckets = new Map();

  for (const r of records || []) {
    const epoch = String(r?.epoch || "rec_soft");
    if (!buckets.has(epoch)) {
      buckets.set(epoch, { total: 0, categories: {} });
    }
    const b = buckets.get(epoch);
    b.total += 1;
    const cat = r?.reason?.category || "NONE";
    b.categories[cat] = (b.categories[cat] || 0) + 1;
  }

  const curves = [...buckets.entries()].map(([epoch, data]) => {
    const shares = {};
    for (const [cat, count] of Object.entries(data.categories)) {
      shares[cat] = data.total > 0 ? count / data.total : 0;
    }
    return Object.freeze({
      epoch,
      sampleCount: data.total,
      categoryShares: Object.freeze(shares)
    });
  });

  return Object.freeze({
    schema: DRIFT_ANALYTICS_SCHEMA_V0,
    curves: Object.freeze(curves),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {ReturnType<typeof buildTemporalDriftCurvesV0>} curves
 * @param {{ signals?: object[] }} driftOutput
 */
export function forecastCausalInvariantRiskV0(curves, driftOutput = {}) {
  const signals = driftOutput.signals || [];
  /** @type {object[]} */
  const risks = [];

  const lastCurve = curves.curves[curves.curves.length - 1];
  const prevCurve = curves.curves.length > 1 ? curves.curves[curves.curves.length - 2] : null;

  const scSlope = slopeForCategoryV0(lastCurve, prevCurve, MUTATION_REASON_CATEGORY_V1.SC);
  const quotaSlope = slopeForCategoryV0(lastCurve, prevCurve, MUTATION_REASON_CATEGORY_V1.QUOTA);
  const recSlope = slopeForCategoryV0(lastCurve, prevCurve, MUTATION_REASON_CATEGORY_V1.REC);

  for (const sig of signals) {
    if (sig.kind === DRIFT_SIGNAL_KIND_V0.PERMISSION_DRIFT) {
      const target =
        sig.topReasonCode === MUTATION_REASON_CODE_V1.SC_03_TICKET_EXECUTION_DIRECT
          ? INVARIANT_RISK_ID_V0.SC_03
          : sig.topReasonCode === MUTATION_REASON_CODE_V1.SC_02_INVALID_MUTATION_SOURCE
            ? INVARIANT_RISK_ID_V0.SC_02
            : INVARIANT_RISK_ID_V0.SC_04;
      risks.push(
        buildRiskV0({
          invariantId: target,
          probability01: sig.share01,
          slope: scSlope,
          basis: sig.kind
        })
      );
    }
    if (sig.kind === DRIFT_SIGNAL_KIND_V0.RESOURCE_STRESS) {
      risks.push(
        buildRiskV0({
          invariantId: INVARIANT_RISK_ID_V0.QUOTA_TOPOLOGY,
          probability01: sig.share01,
          slope: quotaSlope,
          basis: sig.kind
        })
      );
    }
    if (sig.kind === DRIFT_SIGNAL_KIND_V0.TEMPORAL_DRIFT) {
      risks.push(
        buildRiskV0({
          invariantId: INVARIANT_RISK_ID_V0.REC_CONTINUITY,
          probability01: sig.share01,
          slope: recSlope,
          basis: sig.kind
        })
      );
    }
    if (sig.kind === DRIFT_SIGNAL_KIND_V0.IDENTITY_DRIFT) {
      risks.push(
        buildRiskV0({
          invariantId: INVARIANT_RISK_ID_V0.SIG_TRUST,
          probability01: sig.share01,
          slope: 0,
          basis: sig.kind
        })
      );
    }
  }

  return Object.freeze({
    schema: DRIFT_ANALYTICS_SCHEMA_V0,
    risks: Object.freeze(risks),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} last
 * @param {object | null} prev
 * @param {string} category
 */
function slopeForCategoryV0(last, prev, category) {
  const lastShare = last?.categoryShares?.[category] ?? 0;
  const prevShare = prev?.categoryShares?.[category] ?? lastShare;
  return lastShare - prevShare;
}

/**
 * @param {{
 *   invariantId: string,
 *   probability01: number,
 *   slope: number,
 *   basis: string
 * }} input
 */
function buildRiskV0(input) {
  const urgency01 = Math.max(0, Math.min(1, input.probability01 + Math.max(0, input.slope)));
  return Object.freeze({
    invariantId: input.invariantId,
    breachProbability01: Math.max(0, Math.min(1, input.probability01)),
    trendSlope: input.slope,
    urgency01,
    basis: input.basis,
    executionClass: "suggest"
  });
}

/**
 * @param {ReturnType<typeof forecastCausalInvariantRiskV0>} forecast
 */
export function generateDriftSuggestionsV0(forecast) {
  /** @type {object[]} */
  const suggestions = [];

  for (const risk of forecast.risks || []) {
    const tpl = suggestionTemplateForRiskV0(risk);
    if (!tpl) continue;
    suggestions.push(
      Object.freeze({
        schema: DRIFT_SUGGESTION_SCHEMA_V0,
        suggestionId: `sug_${++suggestionSeqV0}`,
        suggestion: tpl.text,
        confidence: Math.max(0, Math.min(1, risk.urgency01)),
        executionClass: "suggest",
        invariantAtRisk: risk.invariantId,
        basedOn: risk.basis,
        interpretationOnly: true,
        nonExecutive: true
      })
    );
  }

  return Object.freeze({
    schema: DRIFT_ANALYTICS_SCHEMA_V0,
    suggestions: Object.freeze(suggestions),
    dr01Enforced: true,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} risk
 */
function suggestionTemplateForRiskV0(risk) {
  switch (risk.invariantId) {
    case INVARIANT_RISK_ID_V0.SC_03:
      return { text: "sc_03_execution_bypass_drift_detected" };
    case INVARIANT_RISK_ID_V0.SC_02:
      return { text: "sc_02_mutation_source_drift_detected" };
    case INVARIANT_RISK_ID_V0.SC_04:
      return { text: "sc_04_permission_escalation_drift_detected" };
    case INVARIANT_RISK_ID_V0.QUOTA_TOPOLOGY:
      return { text: "quota_stress_detected" };
    case INVARIANT_RISK_ID_V0.REC_CONTINUITY:
      return { text: "rec_continuity_drift_detected" };
    case INVARIANT_RISK_ID_V0.SIG_TRUST:
      return { text: "sig_trust_drift_detected" };
    default:
      return { text: "invariant_drift_detected" };
  }
}

export { assertDriftSuggestionDr01V0 } from "./driftSuggestionGuardsV0.js";

/**
 * @param {{
 *   records: object[],
 *   drift: { signals?: object[], categoryCounts?: Record<string, number> }
 * }} input
 */
export function runDriftAnalyticsV0(input) {
  const curves = buildTemporalDriftCurvesV0(input.records);
  const forecast = forecastCausalInvariantRiskV0(curves, input.drift);
  const suggestions = generateDriftSuggestionsV0(forecast);

  for (const s of suggestions.suggestions) {
    assertDriftOutputGuardsV0(s);
  }

  return Object.freeze({
    schema: DRIFT_ANALYTICS_SCHEMA_V0,
    curves,
    forecast,
    suggestions: Object.freeze({
      ...suggestions,
      dr01Enforced: true,
      dr02Enforced: true
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/** Test only. */
export function resetDriftSuggestionSequenceForTestV0() {
  suggestionSeqV0 = 0;
}
