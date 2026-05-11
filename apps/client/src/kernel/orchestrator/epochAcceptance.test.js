import { describe, expect, it } from "vitest";
import { createInitialConstitutionalState } from "../constitutional/constitutionalState.js";
import { applyInertiaConstraint } from "./constitutionalInertia.js";
import { injectConstitutionalFeedback } from "./constitutionalFeedbackInjector.js";
import { epochInput } from "./epochFixtures.js";
import {
  computeIdentityDriftVector,
  hashChainedEpoch,
  hashEpochAtomicSnapshot,
  runConstitutionalEpoch
} from "./runConstitutionalEpoch.js";

describe("vNext constitutional epoch + inertia", () => {
  it("inertia caps |Δconfidence| by κ·(1−sealEntropy)", () => {
    const prev = createInitialConstitutionalState(0);
    const next = { ...prev, confidence: 0.95, sealEntropy: 0.8, contradiction: 0.5 };
    const fb = injectConstitutionalFeedback({
      seal: null,
      drift: next.drift,
      policyMutation: { applied: false },
      resonanceDelta: 0.1,
      pressureDelta: [0.1, 0.2, 0, 0.5, 0],
      state: next
    });
    const out = applyInertiaConstraint({
      prevState: prev,
      nextState: next,
      feedback: fb,
      kappa: 0.1,
      pressureVector: [0.2, 0.3, 0.4, 0.7, 0.2]
    });
    const maxD = 0.1 * (1 - 0.8);
    expect(Math.abs(out.adjustedState.confidence - prev.confidence)).toBeLessThanOrEqual(maxD + 1e-9);
  });

  it("high runaway risk dampens observation filter vs raw feedback", () => {
    const prev = createInitialConstitutionalState(0);
    const next = { ...prev, confidence: 0.4, sealEntropy: 0.85, contradiction: 0.88 };
    const fb = injectConstitutionalFeedback({
      seal: null,
      drift: 0.5,
      policyMutation: { applied: true },
      resonanceDelta: 0.4,
      pressureDelta: [0, 0.5, 0, 0.8, 0.3],
      state: next
    });
    const out = applyInertiaConstraint({
      prevState: prev,
      nextState: next,
      feedback: fb,
      kappa: 0.2,
      pressureVector: [0.2, 0.6, 0.3, 0.9, 0.4]
    });
    const rawMag =
      (fb.observationFilterUpdate.coherenceLift ?? 0) + (fb.observationFilterUpdate.salienceBoost ?? 0);
    const scaledMag =
      (out.feedback.observationFilterUpdate.coherenceLift ?? 0) +
      (out.feedback.observationFilterUpdate.salienceBoost ?? 0);
    expect(scaledMag).toBeLessThanOrEqual(rawMag + 1e-9);
  });

  it("runConstitutionalEpoch is deterministic (atomic snapshot hash)", () => {
    const a = runConstitutionalEpoch(epochInput());
    const b = runConstitutionalEpoch(epochInput());
    expect(a.epochHash).toBe(b.epochHash);
    expect(a.atomicSnapshot.storeHash).toBe(b.atomicSnapshot.storeHash);
    expect(hashEpochAtomicSnapshot(a.atomicSnapshot)).toBe(hashEpochAtomicSnapshot(b.atomicSnapshot));
  });

  it("epoch returns nextObservationFilter for chaining", () => {
    const e = runConstitutionalEpoch(epochInput());
    expect(e.nextObservationFilter).toBeDefined();
    expect(e.inertia.maxDeltaConf).toBeGreaterThan(0);
    expect(e.perception).toBeDefined();
    expect(e.constitution.state.confidence).toBe(e.atomicSnapshot.constitution.confidence);
  });

  it("lineage: previousEpochHash + drift vector + mutation hash self-traceable", () => {
    const e = runConstitutionalEpoch(epochInput());
    expect(e.lineage.previousEpochHash).toBe("0xgenesis");
    expect(e.lineage.mutationDeltaHash).toMatch(/^0x[0-9a-f]+$/);
    expect(e.lineage.identityDriftVector.length).toBe(9);
    expect(e.epochHash).toBe(
      hashChainedEpoch({
        previousEpochHash: e.lineage.previousEpochHash,
        lineageBranchId: e.lineage.lineageBranchId,
        mergeAncestry: e.lineage.mergeAncestry,
        atomicHash: e.atomicHash,
        mutationDeltaHash: e.lineage.mutationDeltaHash,
        identityDriftVector: e.lineage.identityDriftVector
      })
    );
  });

  it("chained epochs: child commits to parent epochHash", () => {
    const base = epochInput();
    const e1 = runConstitutionalEpoch(base);
    const s1 = e1.atomicSnapshot.constitution;
    const e2 = runConstitutionalEpoch({
      ...epochInput({
        now: base.closureInput.now + 100,
        simTime: 2
      }),
      prevState: s1,
      prevStore: e1.nextStore,
      prevPressure: e1.nextPressure,
      previousEpochHash: e1.epochHash,
      previousLegitimacyResonance: e1.legitimacyResonance
    });
    expect(e2.lineage.previousEpochHash).toBe(e1.epochHash);
    expect(e1.epochHash).not.toBe(e2.epochHash);
    const legDelta = e2.legitimacyResonance - e1.legitimacyResonance;
    const drift = computeIdentityDriftVector(s1, e2.atomicSnapshot.constitution, {
      legitimacyResonanceDelta: legDelta
    });
    expect(drift).toEqual(e2.lineage.identityDriftVector);
  });
});
