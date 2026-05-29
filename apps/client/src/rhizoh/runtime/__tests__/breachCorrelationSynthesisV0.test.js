import { describe, expect, it, beforeEach } from "vitest";
import {
  beginBreachCorrelationWindowV0,
  clearBreachCorrelationStateForTestV0,
  endBreachCorrelationWindowV0,
  resolveDominantResponseModeV0,
  synthesizeBreachCoherenceV0
} from "../breachCorrelationSynthesisV0.js";
import {
  BREACH_RESPONSE_MODE_V0,
  clearBreachObservationTraceForTestV0,
  observePostGoLiveIntegrityBreachV0,
  recordBreachObservationV0
} from "../violationObservationLogV0.js";
import { clearBreachCorrelationWindowForTestV0 } from "../breachCorrelationWindowV0.js";
import { evaluatePostGoLiveIntegrityV0 } from "../postGoLiveIntegrityLoopV0.js";

describe("breachCorrelationSynthesisV0", () => {
  beforeEach(() => {
    clearBreachObservationTraceForTestV0();
    clearBreachCorrelationWindowForTestV0();
    clearBreachCorrelationStateForTestV0();
  });

  it("resolveDominantResponseModeV0 applies REVOKE over QUARANTINE", () => {
    expect(
      resolveDominantResponseModeV0([
        BREACH_RESPONSE_MODE_V0.QUARANTINE,
        BREACH_RESPONSE_MODE_V0.REVOKE
      ])
    ).toBe(BREACH_RESPONSE_MODE_V0.REVOKE);
  });

  it("synthesizeBreachCoherence detects compound fault under shared correlationId", () => {
    const cid = beginBreachCorrelationWindowV0({ label: "test_incident" });
    recordBreachObservationV0({
      violationClass: "CAUSAL_INTEGRITY",
      responseMode: BREACH_RESPONSE_MODE_V0.QUARANTINE,
      source: "test_a",
      detail: "ordering",
      correlationId: cid
    });
    recordBreachObservationV0({
      violationClass: "DATA_INTEGRITY",
      responseMode: BREACH_RESPONSE_MODE_V0.QUARANTINE,
      source: "test_b",
      detail: "orphan",
      correlationId: cid
    });
    const synth = synthesizeBreachCoherenceV0({ correlationId: cid });
    endBreachCorrelationWindowV0();

    expect(synth.compoundFault).toBe(true);
    expect(synth.entryCount).toBe(2);
    expect(synth.interpretationOnly).toBe(true);
    expect(synth.centralizedArbitrationBus).toBe(false);
    expect(synth.systemicSummary).toContain("Compound breach");
  });

  it("observePostGoLiveIntegrityBreach splits checks when correlation window open", () => {
    const cid = beginBreachCorrelationWindowV0({ label: "compound_checks" });
    const bad = evaluatePostGoLiveIntegrityV0({
      eventSeqs: [3, 1],
      orphanNarrativeDetected: true
    });
    observePostGoLiveIntegrityBreachV0(bad, { eventSeqs: [3, 1] });
    const synth = synthesizeBreachCoherenceV0({ correlationId: cid });
    expect(synth.entryCount).toBeGreaterThanOrEqual(2);
    expect(synth.compoundFault).toBe(true);
  });
});
