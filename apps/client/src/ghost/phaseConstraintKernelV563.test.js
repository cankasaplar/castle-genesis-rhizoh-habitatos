import { describe, expect, it } from "vitest";
import {
  PHASE_CONSTRAINT_CODE,
  constrainProposedPhase01,
  createConstrainedRealityCollapseMonitor,
  createPhaseConstraintKernel,
  envelopeCouplingPull01,
  shortestSignedPhaseDelta01
} from "./phaseConstraintKernelV563.js";
import { createRealityCollapseEventMonitor } from "./phaseIdentityAndCollapseV562.js";

describe("phaseConstraintKernelV563", () => {
  it("shortestSignedPhaseDelta01 wraps across 0", () => {
    expect(shortestSignedPhaseDelta01(0.95, 0.05)).toBeCloseTo(0.1, 5);
    expect(shortestSignedPhaseDelta01(0.05, 0.95)).toBeCloseTo(-0.1, 5);
  });

  it("constrainProposedPhase01 caps large jumps", () => {
    const r = constrainProposedPhase01(0.1, 0.9, 0.15, undefined);
    expect(r.allowed).toBe(false);
    expect(r.code).toBe(PHASE_CONSTRAINT_CODE.PHASE_STEP_CAP);
    expect(Math.abs(r.appliedDelta01)).toBeCloseTo(0.15, 5);
  });

  it("envelopeCouplingPull01 softens at high viral", () => {
    const low = envelopeCouplingPull01(0.8, 0.1);
    const high = envelopeCouplingPull01(0.8, 0.95);
    expect(high.pull01).toBeLessThan(low.pull01);
  });

  it("evaluateCollapseEnter blocks stress and dispersion", () => {
    const k = createPhaseConstraintKernel();
    const ok = k.evaluateCollapseEnter({
      viralSync01: 0.9,
      dispersion01: 0.2,
      stress01: 0.1,
      atMs: 1
    });
    expect(ok.allowed).toBe(true);

    const badStress = k.evaluateCollapseEnter({
      viralSync01: 0.9,
      dispersion01: 0.2,
      stress01: 0.99,
      atMs: 2
    });
    expect(badStress.allowed).toBe(false);
    expect(badStress.code).toBe(PHASE_CONSTRAINT_CODE.COLLAPSE_STRESS_LOCK);

    const badDisp = k.evaluateCollapseEnter({
      viralSync01: 0.9,
      dispersion01: 0.95,
      stress01: 0.1,
      atMs: 3
    });
    expect(badDisp.allowed).toBe(false);
    expect(badDisp.code).toBe(PHASE_CONSTRAINT_CODE.COLLAPSE_DISPERSION_GATE);
  });

  it("collapse rate limit after repeated commits", () => {
    const k = createPhaseConstraintKernel({ collapseMaxEntersPerWindow: 2, collapseRateWindowMs: 60_000 });
    expect(k.evaluateCollapseEnter({ viralSync01: 0.9, dispersion01: 0.1, stress01: 0, atMs: 0 }).allowed).toBe(
      true
    );
    k.commitCollapseEnter(1000);
    k.commitCollapseEnter(2000);
    expect(k.evaluateCollapseEnter({ viralSync01: 0.9, dispersion01: 0.1, stress01: 0, atMs: 3000 }).allowed).toBe(
      false
    );
  });

  it("createConstrainedRealityCollapseMonitor vetoes enter when kernel denies", () => {
    const k = createPhaseConstraintKernel({ collapseStressLock01: 0.1 });
    const m = createConstrainedRealityCollapseMonitor(k, { enterThreshold01: 0.5, exitThreshold01: 0.2 });
    const r = m.sample(0.9, 100, { dispersion01: 0.1, stress01: 0.99 });
    expect(r.event).toBe(null);
    expect(r.armed).toBe(false);
    expect(r.vetoed?.phase).toBe("enter");
  });

  it("createRealityCollapseEventMonitor without gate still arms on enter", () => {
    const m = createRealityCollapseEventMonitor({ enterThreshold01: 0.5, exitThreshold01: 0.2 });
    const r = m.sample(0.9, 100, { stress01: 0.99 });
    expect(r.event?.phase).toBe("enter");
    expect(r.armed).toBe(true);
  });

  it("applyPolicyMerge updates evaluateCollapseEnter behavior", () => {
    const k = createPhaseConstraintKernel({ collapseStressLock01: 0.5 });
    const blocked = k.evaluateCollapseEnter({
      viralSync01: 0.9,
      dispersion01: 0.1,
      stress01: 0.6,
      atMs: 1
    });
    expect(blocked.allowed).toBe(false);
    k.applyPolicyMerge({ collapseStressLock01: 0.95 });
    const ok = k.evaluateCollapseEnter({
      viralSync01: 0.9,
      dispersion01: 0.1,
      stress01: 0.6,
      atMs: 2
    });
    expect(ok.allowed).toBe(true);
  });
});
