import { describe, expect, it, beforeEach } from "vitest";
import {
  BREACH_OBSERVATION_SCHEMA_V0,
  BREACH_RESPONSE_MODE_V0,
  buildWalDivergenceSnapshotV0,
  clearBreachObservationTraceForTestV0,
  getBreachObservationTraceV0,
  getLastBreachObservationV0,
  observePostGoLiveIntegrityBreachV0,
  recordBreachObservationV0
} from "../violationObservationLogV0.js";
import {
  evaluatePostGoLiveIntegrityV0,
  SYSTEM_STATE_V0
} from "../postGoLiveIntegrityLoopV0.js";

describe("violationObservationLogV0 (read-only truth trace)", () => {
  beforeEach(() => {
    clearBreachObservationTraceForTestV0();
  });

  it("appends immutable factual entries with monotonic seq", () => {
    const a = recordBreachObservationV0({
      violationClass: "DATA_INTEGRITY",
      responseMode: BREACH_RESPONSE_MODE_V0.QUARANTINE,
      source: "test",
      detail: "first"
    });
    const b = recordBreachObservationV0({
      violationClass: "PERCEPTION_INTEGRITY",
      responseMode: BREACH_RESPONSE_MODE_V0.REVOKE,
      source: "test",
      detail: "second"
    });
    expect(a.seq).toBe(1);
    expect(b.seq).toBe(2);
    expect(a.schema).toBe(BREACH_OBSERVATION_SCHEMA_V0);
    expect(() => {
      /** @type {any} */ (a).detail = "mutated";
    }).toThrow();
    const trace = getBreachObservationTraceV0();
    expect(trace.total).toBe(2);
    expect(trace.centralizedArbitrationBus).toBe(false);
  });

  it("buildWalDivergenceSnapshot captures ordering regression", () => {
    const snap = buildWalDivergenceSnapshotV0({
      eventSeqs: [1, 3, 2],
      shadowWalTick: 0,
      system_state: SYSTEM_STATE_V0.DEGRADED
    });
    expect(snap.orderingMonotonic).toBe(false);
    expect(snap.eventSeqTail).toEqual([1, 3, 2]);
  });

  it("observePostGoLiveIntegrityBreach records only non-LIVE_OK", () => {
    const ok = evaluatePostGoLiveIntegrityV0({ eventSeqs: [1, 2, 3] });
    expect(observePostGoLiveIntegrityBreachV0(ok)).toBeNull();

    const bad = evaluatePostGoLiveIntegrityV0({
      eventSeqs: [3, 1],
      orphanNarrativeDetected: true
    });
    const obs = observePostGoLiveIntegrityBreachV0(bad, { eventSeqs: [3, 1] });
    expect(obs).not.toBeNull();
    expect(obs?.source).toBe("postGoLiveIntegrityLoopV0");
    expect(getLastBreachObservationV0()?.detail).toContain("QUARANTINE");
  });

  it("does not perform enforcement (trace length only grows via record)", () => {
    recordBreachObservationV0({
      violationClass: "CAUSAL_INTEGRITY",
      responseMode: BREACH_RESPONSE_MODE_V0.CORRECTION_CHAIN,
      source: "test",
      detail: "observe-only"
    });
    expect(getBreachObservationTraceV0().total).toBe(1);
  });
});
