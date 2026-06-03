import { describe, expect, it, beforeEach } from "vitest";
import {
  buildT0UnifiedPresenceFrameV0,
  resetT0UnifiedPresenceFrameForTestV0,
  sampleT0PresenceFrameV0,
  T0_TEMPORAL_PHASE_V0
} from "../rhizohT0UnifiedPresenceFrameV0.js";
import { resolveReslPresentationV0 } from "../rhizohReslPresentationPolicyV0.js";
import {
  deriveRhizohPresenceStateV0,
  noteFelFailureExpressionV0,
  resetFelFailureExpressionForTestV0
} from "../rhizohPresenceStateEngineV0.js";

describe("rhizohT0UnifiedPresenceFrameV0", () => {
  beforeEach(() => {
    resetT0UnifiedPresenceFrameForTestV0();
    resetFelFailureExpressionForTestV0();
  });

  it("strip orb field share breathe01 on sample", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 10_000, lastUserActivityMs: 9900 });
    const resl = resolveReslPresentationV0(p, { nowMs: 10_000 });
    buildT0UnifiedPresenceFrameV0(p, resl, null, 10_000);
    const sampled = sampleT0PresenceFrameV0(10_500);
    expect(sampled.surfaces.strip.opacity01).toBeGreaterThan(0);
    expect(sampled.surfaces.orb.breathe01).toBe(sampled.surfaces.field.breathe01);
    expect(sampled.surfaces.field.breathe01).toBe(sampled.breathe01);
  });

  it("state change resets transition epoch", () => {
    const p1 = deriveRhizohPresenceStateV0({ nowMs: 0, voiceListening: false });
    const r1 = resolveReslPresentationV0(p1, { nowMs: 0 });
    const f1 = buildT0UnifiedPresenceFrameV0(p1, r1, null, 0);
    const p2 = deriveRhizohPresenceStateV0({ nowMs: 100, voiceListening: true });
    const r2 = resolveReslPresentationV0(p2, { nowMs: 100 });
    const f2 = buildT0UnifiedPresenceFrameV0(p2, r2, null, 100);
    expect(f2.transitionEpochMs).toBe(100);
    expect(f2.coherenceId).not.toBe(f1.coherenceId);
  });

  it("failure narration enters FEL_DECAY phase", () => {
    noteFelFailureExpressionV0({ reason: "x", atMs: 1000 });
    const p = deriveRhizohPresenceStateV0({ nowMs: 2000 });
    const resl = resolveReslPresentationV0(p, { nowMs: 2000 });
    const f = buildT0UnifiedPresenceFrameV0(p, resl, null, 2500);
    expect([T0_TEMPORAL_PHASE_V0.FEL_DECAY, T0_TEMPORAL_PHASE_V0.TRANSITION]).toContain(
      f.temporalPhase
    );
  });
});
