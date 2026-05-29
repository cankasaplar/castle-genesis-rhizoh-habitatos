import { describe, it, expect, beforeEach } from "vitest";
import {
  runOperationalContinuityProbeV1,
  detectTailReordered,
  buildContinuityConfidenceV1
} from "./operationalContinuityProbeV1.js";
import {
  ingestRcilEvent,
  drainRcilQueueOnce,
  getRcilContinuityFingerprint,
  getRcilOperationalOnlyTraceTail,
  __resetRcilLiveWiringForTests
} from "./rcilLiveWiringV1.js";
import { __resetRrhpMinimalProjectionForTests } from "./rcilRrhpMinimalBridgeV1.js";

describe("operationalContinuityProbeV1", () => {
  beforeEach(() => {
    __resetRcilLiveWiringForTests();
    __resetRrhpMinimalProjectionForTests();
  });

  it("missing slice → unknown + high stale risk", () => {
    const r = runOperationalContinuityProbeV1({});
    expect(r.continuity).toBe("unknown");
    expect(r.staleRisk).toBe("high");
    expect(r.note).toBe("missing_restored_slice");
    expect(r.driftClasses).toContain("non_comparable");
    expect(r.primaryDriftClass).toBe("non_comparable");
    expect(r.confidence.band).toBe("unknown");
    expect(r.confidence.aggregate).toBeNull();
    expect(r.confidence.uncertaintyNotes.some((n) => /non_comparable_only|withheld/i.test(n))).toBe(true);
  });

  it("fingerprintComparable → stable when restore fp matches live", () => {
    const fp = getRcilContinuityFingerprint({ semantics: "operational_only" });
    const r = runOperationalContinuityProbeV1({
      restoredSlice: { operationalReconcileTotal: 0, appliedMetaTail: [] },
      fingerprintAtRestoreOperationalOnly: fp
    });
    expect(r.fingerprintComparable).toBe(true);
    expect(r.fingerprintMatch).toBe(true);
    expect(r.continuity).toBe("stable");
    expect(r.staleRisk).toBe("low");
    expect(r.driftClasses.length).toBe(0);
    expect(r.primaryDriftClass).toBeNull();
    expect(r.confidence.band).toBe("high");
    expect(r.confidence.aggregate).not.toBeNull();
    expect(r.confidence.aggregate).toBeGreaterThanOrEqual(0.95);
    expect(r.confidence.contributions.some((c) => c.key === "fingerprint_operational" && c.used)).toBe(true);
  });

  it("fingerprint mismatch → drift", () => {
    ingestRcilEvent({ type: "x", source: "client" });
    drainRcilQueueOnce();
    const live = getRcilContinuityFingerprint({ semantics: "operational_only" });
    const r = runOperationalContinuityProbeV1({
      restoredSlice: { operationalReconcileTotal: 0, appliedMetaTail: [] },
      fingerprintAtRestoreOperationalOnly: live + "_stale"
    });
    expect(r.continuity).toBe("drift");
    expect(r.fingerprintMatch).toBe(false);
    expect(r.driftClasses).toContain("fingerprint_divergence");
    expect(r.primaryDriftClass).toBe("fingerprint_divergence");
    expect(r.confidence.multipliers.fingerprint_divergence).toBeCloseTo(0.72, 2);
    expect(r.confidence.aggregate).not.toBeNull();
    expect(r.confidence.aggregate).toBeLessThan(0.85);
  });

  it("tail overlap without fingerprint — meta aligns with live operational tail", () => {
    ingestRcilEvent({ type: "boot", source: "client" });
    drainRcilQueueOnce();
    const r = runOperationalContinuityProbeV1({
      restoredSlice: {
        operationalReconcileTotal: 1,
        appliedMetaTail: [{ seq: 1, type: "boot", at: 1 }]
      }
    });
    expect(r.operationalTailOverlap).toBeGreaterThanOrEqual(1);
    expect(r.continuity).toBe("stable");
    expect(r.staleRisk).toBe("low");
    expect(r.driftClasses.length).toBe(0);
    expect(r.confidence.band).toBe("high");
    expect(r.confidence.contributions.filter((c) => c.used).length).toBeGreaterThanOrEqual(3);
  });

  it("projection_regressed when live RRHP total below restored slice", () => {
    ingestRcilEvent({ type: "one", source: "client" });
    drainRcilQueueOnce();
    const r = runOperationalContinuityProbeV1({
      restoredSlice: {
        operationalReconcileTotal: 5,
        appliedMetaTail: [{ seq: 1, type: "one", at: 1 }]
      }
    });
    expect(r.driftClasses).toContain("projection_regressed");
    expect(r.primaryDriftClass).toBe("projection_regressed");
    expect(r.confidence.regressionPenaltyApplied).toBe(true);
    expect(r.confidence.multipliers.projection_regressed).toBeCloseTo(0.22, 2);
    expect(r.confidence.aggregate).not.toBeNull();
    expect(r.confidence.aggregate).toBeLessThan(0.35);
  });

  it("operational_gap when slice total ahead of live", () => {
    const r = runOperationalContinuityProbeV1({
      restoredSlice: {
        operationalReconcileTotal: 3,
        appliedMetaTail: [{ seq: 99, type: "ghost", at: 1 }]
      }
    });
    expect(r.driftClasses).toContain("operational_gap");
  });

  it("tail_partial_only when overlap weak without fingerprint", () => {
    ingestRcilEvent({ type: "a", source: "client" });
    drainRcilQueueOnce();
    const dup = [0, 1, 2, 3].map((i) => ({ seq: 1, type: "a", at: i }));
    const noise = Array.from({ length: 6 }, (_, i) => ({ seq: i + 2, type: `n${i}`, at: i }));
    const r = runOperationalContinuityProbeV1({
      restoredSlice: {
        operationalReconcileTotal: 1,
        appliedMetaTail: [...dup, ...noise]
      }
    });
    expect(r.operationalTailOverlap).toBe(4);
    expect(r.driftClasses).toContain("tail_partial_only");
  });

  it("detectTailReordered flags inverted meta order vs live tail", () => {
    ingestRcilEvent({ type: "first", source: "client" });
    drainRcilQueueOnce();
    ingestRcilEvent({ type: "second", source: "client" });
    drainRcilQueueOnce();
    const tail = getRcilOperationalOnlyTraceTail(64);
    const reordered = detectTailReordered(
      [
        { seq: 2, type: "second", at: 2 },
        { seq: 1, type: "first", at: 1 }
      ],
      tail
    );
    expect(reordered).toBe(true);
  });

  it("non_comparable only (no fp, no meta) withholds aggregate — not a zero penalty score", () => {
    const r = runOperationalContinuityProbeV1({
      restoredSlice: { operationalReconcileTotal: 0, appliedMetaTail: [] }
    });
    expect(r.driftClasses).toEqual(["non_comparable"]);
    expect(r.confidence.aggregate).toBeNull();
    expect(r.confidence.band).toBe("unknown");
  });

  it("buildContinuityConfidenceV1 exposes contribution rows", () => {
    const c = buildContinuityConfidenceV1({
      continuity: "stable",
      fingerprintMatch: true,
      fingerprintComparable: true,
      operationalTailOverlap: 1,
      staleRisk: "low",
      note: "test",
      driftClasses: [],
      primaryDriftClass: null,
      restoreMetaLength: 1,
      overlapRatio: 1
    });
    expect(c.contributions.length).toBe(4);
    expect(c.uncertaintyNotes.length).toBe(0);
  });
});
