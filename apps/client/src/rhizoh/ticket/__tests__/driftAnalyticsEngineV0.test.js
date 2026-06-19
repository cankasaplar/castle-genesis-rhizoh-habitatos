import { describe, expect, it, beforeEach } from "vitest";
import { TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";
import { emitMutationRecordV0, clearMutationRecordsForTestV0 } from "../mutationRecordEmitterV0.js";
import { buildTicketTransitionIntentV1, TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV1.js";
import {
  assertDriftSuggestionDr01V0,
  buildTemporalDriftCurvesV0,
  forecastCausalInvariantRiskV0,
  generateDriftSuggestionsV0,
  INVARIANT_RISK_ID_V0,
  resetDriftSuggestionSequenceForTestV0,
  runDriftAnalyticsV0
} from "../driftAnalyticsEngineV0.js";
import {
  clearTraceGraphIndexForTestV0,
  extractDriftSignalsV0
} from "../traceGraphIndexOptimizerV0.js";

function emitRejected(reasonSlug, epoch) {
  const intent = buildTicketTransitionIntentV1({
    transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
    ticketId: `tkt_${reasonSlug}_${epoch}`,
    traceGraphLink: `edge_${reasonSlug}`
  });
  return emitMutationRecordV0({
    decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
    validation: { valid: false, reasons: [reasonSlug], executionClass: "mutate_l1" },
    intent,
    actor: { actorId: "castle:u1" },
    epochId: epoch
  });
}

describe("driftAnalyticsEngineV0", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
    clearTraceGraphIndexForTestV0();
    resetDriftSuggestionSequenceForTestV0();
  });

  it("builds temporal drift curves per epoch", () => {
    const records = [
      emitRejected("ticket_packet_direct_execution", "rec_epoch_a"),
      emitRejected("quota_exceeded", "rec_epoch_b")
    ];
    const curves = buildTemporalDriftCurvesV0(records);
    expect(curves.curves.length).toBe(2);
    expect(curves.curves[0].sampleCount).toBe(1);
  });

  it("forecasts invariant risk from drift signals", () => {
    const records = [];
    for (let i = 0; i < 8; i++) {
      records.push(emitRejected("ticket_packet_direct_execution", "rec_epoch_a"));
    }
    const drift = extractDriftSignalsV0({ records, windowSize: 10 });
    const curves = buildTemporalDriftCurvesV0(records);
    const forecast = forecastCausalInvariantRiskV0(curves, drift);
    expect(forecast.risks.length).toBeGreaterThan(0);
    expect(forecast.risks[0].executionClass).toBe("suggest");
  });

  it("generates suggest-only suggestions (DR-01)", () => {
    const forecast = {
      risks: [
        {
          invariantId: INVARIANT_RISK_ID_V0.QUOTA_TOPOLOGY,
          urgency01: 0.78,
          basis: "resource_stress"
        }
      ]
    };
    const out = generateDriftSuggestionsV0(forecast);
    expect(out.suggestions.length).toBe(1);
    expect(out.suggestions[0].executionClass).toBe("suggest");
    expect(out.suggestions[0].confidence).toBeCloseTo(0.78, 2);
    expect(assertDriftSuggestionDr01V0(out.suggestions[0]).ok).toBe(true);
  });

  it("rejects non-suggest execution class (DR-01 guard)", () => {
    const guard = assertDriftSuggestionDr01V0({ executionClass: "mutate_l1" });
    expect(guard.ok).toBe(false);
    expect(guard.code).toBe(INVARIANT_RISK_ID_V0.DR_01_LOOP);
  });

  it("runDriftAnalyticsV0 integrates curves forecast and suggestions", () => {
    const records = [];
    for (let i = 0; i < 4; i++) {
      records.push(emitRejected("quota_exceeded", "rec_epoch_q"));
    }
    const drift = extractDriftSignalsV0({ records, windowSize: 10 });
    const analytics = runDriftAnalyticsV0({ records, drift });
    expect(analytics.curves.curves.length).toBe(1);
    expect(analytics.suggestions.suggestions.length).toBeGreaterThan(0);
    expect(analytics.suggestions.dr01Enforced).toBe(true);
  });
});
