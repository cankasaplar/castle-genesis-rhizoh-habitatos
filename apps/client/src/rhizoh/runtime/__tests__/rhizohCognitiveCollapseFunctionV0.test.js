import { describe, expect, it, beforeEach } from "vitest";
import {
  CCF_COLLAPSE_MODE_V0,
  collapseCognitiveExperienceV0,
  enrichInertiaWithCcfV0,
  resetCognitiveCollapseForTestV0
} from "../rhizohCognitiveCollapseFunctionV0.js";
import {
  applyAttentionInertiaV0,
  resetAttentionInertiaForTestV0
} from "../rhizohAttentionInertiaFieldV0.js";
import {
  blendMultiCausalIntentV0,
  enrichInertiaWithMcibV0
} from "../rhizohMultiCausalIntentBlendingV0.js";
import {
  deriveCognitiveAttentionV0,
  resetCognitiveAttentionForTestV0,
  syncCognitiveAttentionAfterPresenceV0
} from "../rhizohCognitiveAttentionLayerV0.js";
import { deriveRhizohPresenceStateV0, resetFelFailureExpressionForTestV0 } from "../rhizohPresenceStateEngineV0.js";
import { T0_INTENT_EXPLORE_V0 } from "../t0ContextStripV0.js";

describe("rhizohCognitiveCollapseFunctionV0", () => {
  beforeEach(() => {
    resetCognitiveCollapseForTestV0();
    resetAttentionInertiaForTestV0();
    resetCognitiveAttentionForTestV0();
    resetFelFailureExpressionForTestV0();
  });

  it("collapses blended MCIB into single narrative now", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 0, voiceListening: true });
    const a = deriveCognitiveAttentionV0({
      presence: p,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "world",
      nowMs: 0
    });
    const inertia = applyAttentionInertiaV0(a, 0);
    const mcib = blendMultiCausalIntentV0(a, inertia.propagation);
    expect(mcib.narrative_blended_tr).toContain("·");

    const ccf = collapseCognitiveExperienceV0(mcib, inertia.propagation, null, a);
    expect(ccf.narrative_now_tr).not.toContain("·");
    expect(ccf.collapse_coherence01).toBeGreaterThan(0.3);
    expect(ccf.tension_fade.resolved_tension01).toBeLessThan(mcib.internal_tension01);
    expect(ccf.compression_kind).toBe("selective");
    expect(ccf.plurality_trace01).toBeGreaterThan(0.1);
    expect(ccf.latent_echo.cause_codes.length).toBeGreaterThan(0);
  });

  it("enrichInertiaWithCcf updates projection for RESL path", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 100, voiceListening: true });
    const a = deriveCognitiveAttentionV0({ presence: p, nowMs: 100 });
    const base = applyAttentionInertiaV0(a, 100);
    const withMcib = enrichInertiaWithMcibV0(base, a, null);
    const withCcf = enrichInertiaWithCcfV0(withMcib, a, null);
    expect(withCcf.ccf).toBeTruthy();
    expect(withCcf.projection.narrativeHint).toBe(withCcf.ccf.narrative_now_tr);
    expect(withCcf.projection.internalTension01).toBe(
      withCcf.ccf.tension_fade.resolved_tension01
    );
  });

  it("publish chain attaches ccf on cognitive attention", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 200, voiceListening: true });
    const cog = syncCognitiveAttentionAfterPresenceV0({
      presence: p,
      t0Intent: T0_INTENT_EXPLORE_V0,
      nowMs: 200
    });
    expect(cog.attention_inertia?.ccf).toBeTruthy();
    expect(cog.attention_inertia?.mcib?.causes?.length).toBeGreaterThan(1);
    expect(
      [CCF_COLLAPSE_MODE_V0.SINGULAR, CCF_COLLAPSE_MODE_V0.SOFT_BLEND, CCF_COLLAPSE_MODE_V0.TENSION_HOLD]
    ).toContain(cog.attention_inertia.ccf.collapse_mode);
  });
});
