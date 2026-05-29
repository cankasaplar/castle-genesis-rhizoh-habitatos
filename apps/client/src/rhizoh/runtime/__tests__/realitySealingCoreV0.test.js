import { describe, it, expect } from "vitest";
import {
  REALITY_ONTOLOGY_AXIOM_V0,
  REALITY_SEAL_VERDICTS_V0,
  classifyEpochCandidateV0,
  computeSealHashV0,
  createDefaultRealitySealLayerStateV0,
  drainRealitySealQueueV0,
  enqueueRealitySealCandidateV0,
  processRealitySealCandidateV0,
  replaySealAuditTrailV0,
  checkEpochBudgetV0,
  buildRealitySealingCoreSnapshotV0
} from "../realitySealingCoreV0.js";

function sealingCandidate(id, overrides = {}) {
  return {
    candidateId: id,
    source: "studio",
    commitClassId: "sealing_world_geometry",
    roomScope: "room:main",
    payloadHash: `payload-${id}`,
    enqueuedAtMs: 1,
    ...overrides
  };
}

describe("realitySealingCoreV0", () => {
  it("exposes the ontological axiom", () => {
    expect(REALITY_ONTOLOGY_AXIOM_V0).toContain("survives sealing");
  });

  it("routes high-rate substrate to subcounter without epoch bump", () => {
    const seal = createDefaultRealitySealLayerStateV0();
    const r = processRealitySealCandidateV0(
      seal,
      {
        candidateId: "c1",
        source: "coherence",
        commitClassId: "high_rate_substrate",
        payloadHash: "p1",
        enqueuedAtMs: 1
      },
      100
    );
    expect(r.sealed).toBe(false);
    expect(r.verdict).toBe(REALITY_SEAL_VERDICTS_V0.ROUTE_SUBCOUNTER);
    expect(r.seal.realityEpoch).toBe(0);
    expect(r.seal.intentSeq + r.seal.streamSeq).toBeGreaterThan(0);
  });

  it("advances reality_epoch on sealing-class commit", () => {
    const seal = createDefaultRealitySealLayerStateV0();
    const r = processRealitySealCandidateV0(seal, sealingCandidate("s1"), 200);
    expect(r.sealed).toBe(true);
    expect(r.seal.realityEpoch).toBe(1);
    expect(r.seal.sealHashHead).not.toBe("h00000000");
  });

  it("enforces epoch inflation budget then defers", () => {
    let seal = createDefaultRealitySealLayerStateV0(null, { maxSealsPerWindow: 2, windowMs: 10_000 });
    seal = processRealitySealCandidateV0(seal, sealingCandidate("a"), 1000).seal;
    seal = processRealitySealCandidateV0(seal, sealingCandidate("b"), 1001).seal;
    const third = processRealitySealCandidateV0(seal, sealingCandidate("c"), 1002);
    expect(third.sealed).toBe(false);
    expect(third.verdict).toBe(REALITY_SEAL_VERDICTS_V0.DEFER_COALESCE);
    expect(third.seal.realityEpoch).toBe(2);
  });

  it("drains seal queue and replays audit chain", () => {
    const seal = enqueueRealitySealCandidateV0(
      createDefaultRealitySealLayerStateV0(),
      sealingCandidate("q1")
    );
    const drained = drainRealitySealQueueV0(seal, 500);
    expect(drained.processed).toBe(1);
    expect(drained.sealed).toBe(1);
    expect(replaySealAuditTrailV0(drained.seal.auditTrail).ok).toBe(true);
  });

  it("rejects constitution and lease failures", () => {
    const seal = createDefaultRealitySealLayerStateV0();
    const c = processRealitySealCandidateV0(
      seal,
      sealingCandidate("bad", { constitutionOk: false }),
      1
    );
    expect(c.verdict).toBe(REALITY_SEAL_VERDICTS_V0.REJECT);
    const l = processRealitySealCandidateV0(
      seal,
      sealingCandidate("bad2", { leaseOk: false }),
      2
    );
    expect(l.verdict).toBe(REALITY_SEAL_VERDICTS_V0.REJECT);
  });

  it("computes deterministic seal hash", () => {
    const h1 = computeSealHashV0("h00000000", 1, sealingCandidate("x"));
    const h2 = computeSealHashV0("h00000000", 1, sealingCandidate("x"));
    expect(h1).toBe(h2);
  });

  it("builds debug snapshot", () => {
    const snap = buildRealitySealingCoreSnapshotV0(createDefaultRealitySealLayerStateV0());
    expect(snap.schema).toContain("reality_sealing_core");
    expect(snap.realityEpoch).toBe(0);
  });

  it("classifier defaults unknown classes to non-sealing", () => {
    const v = classifyEpochCandidateV0(
      { candidateId: "u", commitClassId: "unknown_xyz", payloadHash: "p", enqueuedAtMs: 0 },
      createDefaultRealitySealLayerStateV0()
    );
    expect(v.verdict).toBe(REALITY_SEAL_VERDICTS_V0.ROUTE_SUBCOUNTER);
  });

  it("resets budget window after elapsed windowMs", () => {
    const seal = createDefaultRealitySealLayerStateV0(null, { windowMs: 100, maxSealsPerWindow: 1 });
    const full = checkEpochBudgetV0(
      { ...seal, budget: { ...seal.budget, sealsInWindow: 1 } },
      seal.budget.windowStartMs + 200
    );
    expect(full.ok).toBe(true);
    expect(full.budget.sealsInWindow).toBe(0);
  });
});
