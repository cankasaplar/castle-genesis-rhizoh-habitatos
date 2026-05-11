import { describe, expect, it } from "vitest";
import { orchestrateMemory } from "./memoryOrchestrator.js";
import { injectConstitutionalFeedback } from "./constitutionalFeedbackInjector.js";
import { createInitialConstitutionalState } from "../constitutional/constitutionalState.js";
import { closeConstitution } from "../constitutional/constitutionalClosure.js";
import { CapabilityToken } from "../sovereignChronos.js";
import { POLICY_ACTION_MUTATE } from "../constitutional/constitutionalPolicies.js";

function artifacts({
  reason = "r1",
  legality = 0.8,
  confidence = 0.8,
  resonance = 0.7,
  consequence = false
} = {}) {
  return {
    nodes: [
      { id: "constitution.default", type: "ConstitutionNode" },
      { id: `reason_${reason}`, type: "ReasonNode", payload: { reason } },
      { id: "memory_1", type: "MemoryNode" }
    ],
    edges: [
      {
        id: `edge_just_${reason}`,
        kind: "justification",
        nodes: [`reason_${reason}`, "constitution.default"],
        weight: 0.7,
        confidence,
        legality,
        resonance,
        decay: 0.1,
        provenance: 0.9
      },
      {
        id: `edge_mem_${reason}`,
        kind: "memory_resonance",
        nodes: ["memory_1", "constitution.default"],
        weight: 0.75,
        confidence: 0.78,
        legality: 0.88,
        resonance,
        decay: 0.08,
        provenance: 0.92
      },
      ...(consequence
        ? [
            {
              id: `edge_conseq_${reason}`,
              kind: "consequence",
              nodes: ["memory_1", "constitution.default"],
              weight: 0.9,
              confidence,
              legality,
              resonance: 0.35,
              decay: 0.12,
              provenance: 0.6
            }
          ]
        : [])
    ],
    resonanceDelta: 0.03
  };
}

describe("vNext-533 memory orchestrator acceptance", () => {
  it("P — memory pressure changes priority", () => {
    const out = orchestrateMemory({
      memoryArtifacts: artifacts({ legality: 0.3, confidence: 0.35, consequence: true }),
      basePriority: "NORMAL",
      contradiction: 0.7
    });
    expect(out.priorityShift.nextPriority).not.toBe("NORMAL");
  });

  it("Q — contradiction cluster leads urgent wake", () => {
    const out = orchestrateMemory({
      memoryArtifacts: artifacts({ legality: 0.12, confidence: 0.2, consequence: true }),
      basePriority: "NORMAL",
      contradiction: 0.92
    });
    expect(["URGENT", "SOVEREIGN"]).toContain(out.priorityShift.nextPriority);
    expect(out.priorityShift.wakeMultiplier).toBeLessThan(1);
  });

  it("R — legitimacy cluster leads low wake", () => {
    const out = orchestrateMemory({
      memoryArtifacts: artifacts({ legality: 0.95, confidence: 0.96, resonance: 0.92, consequence: false }),
      basePriority: "NORMAL",
      contradiction: 0.08
    });
    expect(out.priorityShift.nextPriority).toBe("LOW");
    expect(out.priorityShift.wakeMultiplier).toBeGreaterThan(1);
  });

  it("S — same memory field gives deterministic topology", () => {
    const input = {
      memoryArtifacts: artifacts({ reason: "same_cluster", consequence: true }),
      basePriority: "NORMAL",
      contradiction: 0.4
    };
    const a = orchestrateMemory(input);
    const b = orchestrateMemory(input);
    expect(a.wakeTopologyDelta).toEqual(b.wakeTopologyDelta);
  });

  it("T — replay yields identical orchestration hash", () => {
    const a1 = orchestrateMemory({
      memoryArtifacts: artifacts({ reason: "rA", consequence: true }),
      basePriority: "NORMAL"
    });
    const a2 = orchestrateMemory({
      memoryArtifacts: artifacts({ reason: "rB", consequence: false }),
      prevStore: a1.store,
      prevPressure: a1.pressureVector,
      basePriority: a1.priorityShift.nextPriority
    });

    const b1 = orchestrateMemory({
      memoryArtifacts: artifacts({ reason: "rA", consequence: true }),
      basePriority: "NORMAL"
    });
    const b2 = orchestrateMemory({
      memoryArtifacts: artifacts({ reason: "rB", consequence: false }),
      prevStore: b1.store,
      prevPressure: b1.pressureVector,
      basePriority: b1.priorityShift.nextPriority
    });

    expect(a2.orchestrationHash).toBe(b2.orchestrationHash);
  });

  it("U — stable constitution lowers contradiction pressure vs fragile", () => {
    const art = artifacts({ reason: "stable_test", legality: 0.85, confidence: 0.88 });
    const base = orchestrateMemory({ memoryArtifacts: art, basePriority: "NORMAL", contradiction: 0.35 });
    const stable = orchestrateMemory({
      memoryArtifacts: art,
      basePriority: "NORMAL",
      contradiction: 0.35,
      constitutionSnapshot: { confidence: 0.92, contradiction: 0.08, drift: 0.05, sealEntropy: 0.2, resonance: 0.8 }
    });
    const fragile = orchestrateMemory({
      memoryArtifacts: art,
      basePriority: "NORMAL",
      contradiction: 0.35,
      constitutionSnapshot: { confidence: 0.35, contradiction: 0.72, drift: 0.55, sealEntropy: 0.78, resonance: 0.3 }
    });
    expect(stable.pressureVector[1]).toBeLessThan(fragile.pressureVector[1]);
    expect(stable.pressureVector[1]).toBeLessThanOrEqual(base.pressureVector[1] + 1e-6);
  });

  it("V — feedback rebalance shifts orchestrated pressure", () => {
    const art = artifacts({ reason: "fb", consequence: true });
    const without = orchestrateMemory({ memoryArtifacts: art, basePriority: "NORMAL" });
    const withReb = orchestrateMemory({
      memoryArtifacts: art,
      basePriority: "NORMAL",
      feedbackPressureRebalance: [0.05, 0.08, 0, 0.04, -0.02]
    });
    expect(withReb.pressureVector[1]).toBeGreaterThan(without.pressureVector[1]);
  });

  it("W — close → inject → next close observation filter is deterministic", () => {
    const s0 = createInitialConstitutionalState(0);
    const ok = new CapabilityToken({ scope: "t", expiresAtSim: 999, actions: [POLICY_ACTION_MUTATE] });
    const inp = {
      worldState: { coherence: 0.8, novelty: 0.2 },
      memoryState: { depth: 0.6, stability: 0.65, echo: 0.5, salience: 0.5 },
      interactionState: { uncertainty: 0.25 },
      agentState: { conflict: 0.15 },
      verifyOptions: { tier: 0, chronosBudgetMs: 100, provenanceHint: 0.85 },
      discomfortSignals: {
        expectedVsObserved: 0.2,
        policyVsAction: 0.18,
        memoryVsReality: 0.15,
        proofVsUncertainty: 0.22
      },
      simTime: 1,
      now: 6000,
      capability: ok,
      mutationReason: "feedback_loop",
      prevSchedule: { version: 0, wakeCycle: 1, verificationCadence: 1, memoryCompaction: 2, sovereignReview: 5 }
    };
    const orch = orchestrateMemory({
      memoryArtifacts: artifacts({ reason: "pre", legality: 0.8 }),
      basePriority: "NORMAL",
      constitutionSnapshot: {
        confidence: s0.confidence,
        contradiction: s0.contradiction,
        drift: s0.drift,
        sealEntropy: s0.sealEntropy,
        resonance: s0.resonance
      }
    });
    const c1 = closeConstitution(s0, inp);
    const fb = injectConstitutionalFeedback({
      seal: c1.seal,
      drift: c1.state.drift,
      policyMutation: c1.policyMutation,
      resonanceDelta: c1.memoryArtifacts.resonanceDelta ?? 0,
      pressureDelta: orch.pressureDelta,
      state: c1.state
    });
    const c2a = closeConstitution(s0, { ...inp, now: 6100, observationFilter: fb.observationFilterUpdate });
    const c2b = closeConstitution(s0, { ...inp, now: 6100, observationFilter: fb.observationFilterUpdate });
    expect(c2a.observation.coherence).toBe(c2b.observation.coherence);
    expect(fb.pressureRebalance.length).toBe(5);
    expect(typeof fb.topologyReinjection.wakeScale).toBe("number");
  });
});
