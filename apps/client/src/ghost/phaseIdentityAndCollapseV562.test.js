import { describe, expect, it } from "vitest";
import {
  computePhaseIdentityFingerprint,
  createRealityCollapseEventMonitor,
  derivePhaseDriftPersonality,
  emitRealityShiftWindowEvent,
  hashAgentKey32,
  stepPhaseWithPersonality
} from "./phaseIdentityAndCollapseV562.js";

describe("phaseIdentityAndCollapseV562", () => {
  it("computePhaseIdentityFingerprint is stable per agent", () => {
    const a = computePhaseIdentityFingerprint("user-1", "room-a");
    const b = computePhaseIdentityFingerprint("user-1", "room-a");
    expect(a.fingerprintHex32).toBe(b.fingerprintHex32);
    expect(a.phaseHint01).toBeGreaterThanOrEqual(0);
    expect(a.phaseHint01).toBeLessThanOrEqual(1);
  });

  it("different salt changes fingerprint", () => {
    const a = computePhaseIdentityFingerprint("user-1", "room-a");
    const c = computePhaseIdentityFingerprint("user-1", "room-b");
    expect(a.fingerprintHex32).not.toBe(c.fingerprintHex32);
  });

  it("derivePhaseDriftPersonality stays in bounds", () => {
    const id = computePhaseIdentityFingerprint("g-1");
    const p = derivePhaseDriftPersonality(id);
    expect(p.inertia01).toBeGreaterThanOrEqual(0.2);
    expect(p.inertia01).toBeLessThanOrEqual(1);
    expect(p.wanderBias01).toBeGreaterThanOrEqual(0.1);
    expect(p.couplingBias01).toBeGreaterThanOrEqual(0.15);
  });

  it("stepPhaseWithPersonality moves toward target deterministically", () => {
    const id = computePhaseIdentityFingerprint("x");
    const p = derivePhaseDriftPersonality(id);
    const o = stepPhaseWithPersonality(0.1, 0.6, p, 0.05, 123);
    const q = stepPhaseWithPersonality(0.1, 0.6, p, 0.05, 123);
    expect(o).toBe(q);
    expect(Math.abs(o - 0.1)).toBeGreaterThan(0.001);
  });

  it("createRealityCollapseEventMonitor hysteresis enter then exit", () => {
    const m = createRealityCollapseEventMonitor({ enterThreshold01: 0.7, exitThreshold01: 0.4 });
    const e1 = m.sample(0.5, 1000);
    expect(e1.event).toBe(null);
    const e2 = m.sample(0.85, 2000);
    expect(e2.event?.phase).toBe("enter");
    expect(e2.armed).toBe(true);
    const e3 = m.sample(0.8, 3000);
    expect(e3.event).toBe(null);
    const e4 = m.sample(0.35, 4000);
    expect(e4.event?.phase).toBe("exit");
    expect(e4.armed).toBe(false);
  });

  it("hashAgentKey32 deterministic", () => {
    expect(hashAgentKey32("a")).toBe(hashAgentKey32("a"));
  });

  it("emitRealityShiftWindowEvent no throw without window", () => {
    expect(() => emitRealityShiftWindowEvent({ kind: "reality_shift", phase: "enter", severity01: 1, viralSync01: 1, atMs: 0 })).not.toThrow();
  });
});
