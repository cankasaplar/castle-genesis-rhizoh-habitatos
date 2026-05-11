import { describe, expect, it } from "vitest";
import { CapabilityToken } from "../sovereignChronos.js";
import {
  closeConstitution,
  fingerprintConstitutionalState
} from "./constitutionalClosure.js";
import { POLICY_ACTION_MUTATE } from "./constitutionalPolicies.js";
import { createInitialConstitutionalState } from "./constitutionalState.js";
import {
  appendLedgerEntry,
  createEmptyLedger,
  hashLedger,
  replayConstitutionFromLedger
} from "./constitutionalLedger.js";
import { hashMutationHistory } from "./constitutionalMutationSeal.js";
import { appendHypergraph, createHyperEdgeStore, hashHyperEdgeStore } from "../memory/hyperEdgeStore.js";

function baseInput(over = {}) {
  return {
    worldState: { coherence: 0.82, novelty: 0.18 },
    memoryState: { depth: 0.62, stability: 0.7, echo: 0.55, salience: 0.6 },
    interactionState: { uncertainty: 0.22 },
    agentState: { conflict: 0.12 },
    verifyOptions: { tier: 0, chronosBudgetMs: 100, provenanceHint: 0.88 },
    discomfortSignals: {
      expectedVsObserved: 0.18,
      policyVsAction: 0.16,
      memoryVsReality: 0.14,
      proofVsUncertainty: 0.2
    },
    simTime: 1,
    now: 1000,
    prevSchedule: null,
    ...over
  };
}

describe("Rhizoh vNext-530 constitutional acceptance", () => {
  it("A — contradiction increases drift pressure; confidence tends down vs calm proof", () => {
    const s0 = createInitialConstitutionalState(0);
    const calm = closeConstitution(s0, baseInput({ agentState: { conflict: 0.05 } }));
    const stressed = closeConstitution(s0, baseInput({ agentState: { conflict: 0.82 } }));

    expect(stressed.proof.contradiction).toBeGreaterThan(calm.proof.contradiction);
    expect(stressed.state.contradiction).toBeGreaterThan(calm.state.contradiction);
    expect(stressed.state.confidence).toBeLessThan(calm.state.confidence);
  });

  it("B — repeated stable truth stabilizes constitution (entropy↓ resonance↑ drift↓ trend)", () => {
    const s0 = createInitialConstitutionalState(0);
    const inp = baseInput({
      worldState: { coherence: 0.92, novelty: 0.08 },
      interactionState: { uncertainty: 0.1 },
      agentState: { conflict: 0.05 },
      verifyOptions: { tier: 0, chronosBudgetMs: 120, provenanceHint: 0.95 }
    });

    let s = s0;
    let last = closeConstitution(s, { ...inp, now: 1000, simTime: 1 });
    const firstSeal = last.state.sealEntropy;
    const firstRes = last.state.resonance;
    const firstDrift = last.state.drift;
    s = last.state;

    for (let i = 1; i < 10; i++) {
      last = closeConstitution(s, { ...inp, now: 1000 + i * 50, simTime: 1 + i * 0.1 });
      s = last.state;
    }

    expect(last.state.sealEntropy).toBeLessThanOrEqual(firstSeal + 0.02);
    expect(last.state.resonance).toBeGreaterThanOrEqual(firstRes - 0.01);
    expect(last.state.drift).toBeLessThan(firstDrift + 0.05);
  });

  it("C — illegal mutation blocked without CapabilityToken allowance", () => {
    const s0 = createInitialConstitutionalState(0);
    const bad = new CapabilityToken({ scope: "test", expiresAtSim: 99, actions: ["other.action"] });
    const out = closeConstitution(s0, {
      ...baseInput({ simTime: 2, now: 2000 }),
      capability: bad
    });
    expect(out.policyMutation.applied).toBe(false);
    expect(out.policyMutation.rejectedReason).toBe("capability_denied");
    expect(Array.from(out.state.policyWeights)).toEqual(Array.from(s0.policyWeights));
  });

  it("D — Chronos reschedules after applied mutation", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({
      scope: "test",
      expiresAtSim: 999,
      actions: [POLICY_ACTION_MUTATE]
    });
    const out = closeConstitution(s0, {
      ...baseInput({ simTime: 3, now: 3000 }),
      capability: ok
    });
    expect(out.policyMutation.applied).toBe(true);
    expect(out.chronosSchedule.version).toBeGreaterThanOrEqual(1);
    expect(["LOW", "NORMAL", "URGENT", "SOVEREIGN"]).toContain(out.chronosSchedule.priorityClass);
    expect(typeof out.chronosSchedule.nextWakeAt).toBe("number");
    expect(out.chronosSchedule.nextWakeAt).toBeGreaterThan(3000);
    expect(typeof out.orbSignals.innerShimmer).toBe("number");
  });

  it("E — deterministic replay: same ledger → same constitution fingerprint", () => {
    const s0 = createInitialConstitutionalState(0);
    const inp = baseInput({ now: 5000, simTime: 5 });
    const direct = closeConstitution(s0, inp);

    let ledger = createEmptyLedger();
    ledger = appendLedgerEntry(ledger, { input: inp });
    expect(hashLedger(ledger)).toMatch(/^0x[0-9a-f]+$/);

    const { finalState } = replayConstitutionFromLedger(s0, ledger, (prev, input) =>
      closeConstitution(prev, input)
    );

    expect(fingerprintConstitutionalState(direct.state)).toBe(
      fingerprintConstitutionalState(finalState)
    );
  });

  it("F — unauthorized intent is rejected", () => {
    const s0 = createInitialConstitutionalState(0);
    const bad = new CapabilityToken({ scope: "test", expiresAtSim: 99, actions: [] });
    const out = closeConstitution(s0, {
      ...baseInput({ simTime: 7, now: 7000, capability: bad, mutationReason: "need_adjustment" })
    });
    expect(out.mutationIntent).toBeNull();
    expect(out.policyMutation.applied).toBe(false);
    expect(out.policyMutation.rejectedReason).toBe("capability_denied");
  });

  it("G — constitutional review fail rejects mutation", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({
      scope: "test",
      expiresAtSim: 999,
      actions: [POLICY_ACTION_MUTATE]
    });
    const out = closeConstitution(s0, {
      ...baseInput({ simTime: 8, now: 8000, capability: ok, mutationReason: "overshoot_check" }),
      mutationEpsilon: 0.0001
    });
    expect(out.mutationIntent).not.toBeNull();
    expect(out.mutationReview?.pass).toBe(false);
    expect(out.policyMutation.applied).toBe(false);
    expect(out.policyMutation.rejectedReason).toBe("constitutional_review_failed");
  });

  it("H — verified but unsealed mutation cannot be applied", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({
      scope: "test",
      expiresAtSim: 999,
      actions: [POLICY_ACTION_MUTATE]
    });
    const out = closeConstitution(s0, {
      ...baseInput({ simTime: 9, now: 9000, capability: ok, mutationReason: "intent_without_seal" }),
      forceUnsealedMutation: true
    });
    expect(out.mutationProof?.pass).toBe(true);
    expect(out.mutationSeal).toBeNull();
    expect(out.policyMutation.applied).toBe(false);
    expect(out.policyMutation.rejectedReason).toBe("mutation_unsealed");
  });

  it("I — sealed mutation applies deterministically", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({
      scope: "test",
      expiresAtSim: 999,
      actions: [POLICY_ACTION_MUTATE]
    });
    const input = {
      ...baseInput({ simTime: 10, now: 10000, capability: ok, mutationReason: "deterministic_apply" })
    };
    const a = closeConstitution(s0, input);
    const b = closeConstitution(s0, input);
    expect(a.policyMutation.applied).toBe(true);
    expect(b.policyMutation.applied).toBe(true);
    expect(a.mutationSeal?.sealId).toBe(b.mutationSeal?.sealId);
    expect(Array.from(a.state.policyWeights)).toEqual(Array.from(b.state.policyWeights));
  });

  it("J — same ledger yields same mutation history hash", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({
      scope: "test",
      expiresAtSim: 999,
      actions: [POLICY_ACTION_MUTATE]
    });
    const i1 = baseInput({ simTime: 11, now: 11000, capability: ok, mutationReason: "chain1" });
    const i2 = baseInput({ simTime: 12, now: 12000, capability: ok, mutationReason: "chain2" });

    let ledger = createEmptyLedger();
    ledger = appendLedgerEntry(ledger, { input: i1 });
    ledger = appendLedgerEntry(ledger, { input: i2 });

    const r1 = replayConstitutionFromLedger(s0, ledger, (prev, input) => closeConstitution(prev, input));
    const r2 = replayConstitutionFromLedger(s0, ledger, (prev, input) => closeConstitution(prev, input));

    expect(hashMutationHistory(r1.trace)).toBe(hashMutationHistory(r2.trace));
  });

  it("K — same reason repeated increases memory resonance trend", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({ scope: "test", expiresAtSim: 999, actions: [POLICY_ACTION_MUTATE] });
    let s = s0;
    let prevRes = 0;
    for (let i = 0; i < 4; i++) {
      const out = closeConstitution(s, {
        ...baseInput({ simTime: 20 + i, now: 20000 + i * 10, capability: ok, mutationReason: "same_reason" })
      });
      s = out.state;
      if (i === 0) prevRes = out.resonanceVector.memoryResonance;
      if (i === 3) expect(out.resonanceVector.memoryResonance).toBeGreaterThanOrEqual(prevRes - 0.02);
    }
  });

  it("L — contradictory memory pushes contradiction resonance up", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({ scope: "test", expiresAtSim: 999, actions: [POLICY_ACTION_MUTATE] });
    const store = appendHypergraph(createHyperEdgeStore(), {
      nodes: [{ id: "n1", type: "MemoryNode" }],
      edges: [
        {
          id: "e_contradict",
          kind: "consequence",
          nodes: ["n1"],
          weight: 0.9,
          confidence: 0.2,
          legality: 0.15,
          resonance: 0.3,
          decay: 0.1,
          provenance: 0.5
        }
      ]
    });
    const out = closeConstitution(s0, {
      ...baseInput({ simTime: 30, now: 30000, capability: ok, mutationReason: "contradictory_memory" }),
      hyperEdgeStore: store
    });
    expect(out.resonanceVector.contradictionResonance).toBeGreaterThan(0.2);
  });

  it("M — sealed mutation creates legitimacy edge", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({ scope: "test", expiresAtSim: 999, actions: [POLICY_ACTION_MUTATE] });
    const out = closeConstitution(s0, {
      ...baseInput({ simTime: 40, now: 40000, capability: ok, mutationReason: "legit_edge" })
    });
    const hasLegit = out.memoryArtifacts.edges.some((e) => e.kind === "legitimacy");
    expect(out.mutationSeal).not.toBeNull();
    expect(hasLegit).toBe(true);
  });

  it("N — unsealed mutation creates no legitimacy edge", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({ scope: "test", expiresAtSim: 999, actions: [POLICY_ACTION_MUTATE] });
    const out = closeConstitution(s0, {
      ...baseInput({ simTime: 41, now: 41000, capability: ok, mutationReason: "no_legit_edge" }),
      forceUnsealedMutation: true
    });
    const hasLegit = out.memoryArtifacts.edges.some((e) => e.kind === "legitimacy");
    expect(out.mutationSeal).toBeNull();
    expect(hasLegit).toBe(false);
  });

  it("O — replay ledger yields identical hypergraph hash", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({ scope: "test", expiresAtSim: 999, actions: [POLICY_ACTION_MUTATE] });
    const i1 = baseInput({ simTime: 50, now: 50000, capability: ok, mutationReason: "graph_hash_1" });
    const i2 = baseInput({ simTime: 51, now: 50050, capability: ok, mutationReason: "graph_hash_2" });
    let ledger = createEmptyLedger();
    ledger = appendLedgerEntry(ledger, { input: i1 });
    ledger = appendLedgerEntry(ledger, { input: i2 });
    const r1 = replayConstitutionFromLedger(s0, ledger, (prev, input) => closeConstitution(prev, input));
    const r2 = replayConstitutionFromLedger(s0, ledger, (prev, input) => closeConstitution(prev, input));
    let g1 = createHyperEdgeStore();
    let g2 = createHyperEdgeStore();
    for (const t of r1.trace) g1 = appendHypergraph(g1, t.memoryArtifacts);
    for (const t of r2.trace) g2 = appendHypergraph(g2, t.memoryArtifacts);
    expect(hashHyperEdgeStore(g1)).toBe(hashHyperEdgeStore(g2));
  });
});
