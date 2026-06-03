import { describe, expect, it, beforeEach } from "vitest";
import {
  blendMultiCausalIntentV0,
  enrichInertiaWithMcibV0
} from "../rhizohMultiCausalIntentBlendingV0.js";
import {
  applyAttentionInertiaV0,
  resetAttentionInertiaForTestV0
} from "../rhizohAttentionInertiaFieldV0.js";
import {
  deriveCognitiveAttentionV0,
  resetCognitiveAttentionForTestV0
} from "../rhizohCognitiveAttentionLayerV0.js";
import { deriveRhizohPresenceStateV0, resetFelFailureExpressionForTestV0 } from "../rhizohPresenceStateEngineV0.js";
import { T0_INTENT_EXPLORE_V0 } from "../t0ContextStripV0.js";

describe("rhizohMultiCausalIntentBlendingV0", () => {
  beforeEach(() => {
    resetAttentionInertiaForTestV0();
    resetCognitiveAttentionForTestV0();
    resetFelFailureExpressionForTestV0();
  });

  it("produces multiple weighted causes", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 0, voiceListening: true });
    const a = deriveCognitiveAttentionV0({ presence: p, nowMs: 0 });
    const inertia = applyAttentionInertiaV0(a, 0);
    const mcib = blendMultiCausalIntentV0(a, inertia.propagation);
    expect(mcib.causes.length).toBeGreaterThanOrEqual(2);
    const sum = mcib.causes.reduce((s, c) => s + c.weight01, 0);
    expect(sum).toBeGreaterThan(0.9);
    expect(sum).toBeLessThanOrEqual(1.05);
    expect(mcib.dominant.weight01).toBeGreaterThan(0);
  });

  it("blend narrative differs from single linear why", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 1000, lastUserActivityMs: 990 });
    const a = deriveCognitiveAttentionV0({
      presence: p,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "world",
      nowMs: 1000
    });
    const inertia = applyAttentionInertiaV0(a, 1000);
    const enriched = enrichInertiaWithMcibV0(inertia, a, null);
    expect(enriched.mcib.causes.length).toBeGreaterThan(1);
    expect(enriched.mcib.narrative_blended_tr).toContain("·");
    expect(enriched.projection.narrativeHint).toBe(inertia.projection.narrativeHint);
  });

  it("forks when competing causes are close", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 0, voiceListening: true });
    const a = deriveCognitiveAttentionV0({
      presence: p,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "world",
      nowMs: 0
    });
    const inertia = applyAttentionInertiaV0(a, 0);
    const mcib = blendMultiCausalIntentV0(a, inertia.propagation);
    if (mcib.causes.length >= 2 && mcib.causes[0].weight01 - mcib.causes[1].weight01 < 0.18) {
      expect(mcib.forks.length).toBeGreaterThan(0);
      expect(mcib.internal_tension01).toBeGreaterThan(0.2);
    }
  });
});
