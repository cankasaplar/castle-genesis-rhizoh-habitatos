import { describe, expect, it, beforeEach } from "vitest";
import {
  applyTemporalDriftGuardV0,
  TDG_DRIFT_CLASS_V0,
  resetTemporalDriftGuardForTestV0
} from "../rhizohTemporalDriftGuardV0.js";
import {
  compileExperienceContinuityV0,
  ECC_MICRO_TRANSITION_V0,
  resetExperienceContinuityForTestV0
} from "../rhizohExperienceContinuityCompilerV0.js";
import { collapseCognitiveExperienceV0 } from "../rhizohCognitiveCollapseFunctionV0.js";
import {
  applyAttentionInertiaV0,
  resetAttentionInertiaForTestV0
} from "../rhizohAttentionInertiaFieldV0.js";
import {
  blendMultiCausalIntentV0,
  enrichInertiaWithMcibV0
} from "../rhizohMultiCausalIntentBlendingV0.js";
import { enrichInertiaWithCcfV0 } from "../rhizohCognitiveCollapseFunctionV0.js";
import {
  deriveCognitiveAttentionV0,
  resetCognitiveAttentionForTestV0
} from "../rhizohCognitiveAttentionLayerV0.js";
import { deriveRhizohPresenceStateV0, resetFelFailureExpressionForTestV0 } from "../rhizohPresenceStateEngineV0.js";
import { resolveReslPresentationV0 } from "../rhizohReslPresentationPolicyV0.js";
import { T0_INTENT_EXPLORE_V0 } from "../t0ContextStripV0.js";

describe("rhizohTemporalDriftGuardV0", () => {
  beforeEach(() => {
    resetTemporalDriftGuardForTestV0();
    resetExperienceContinuityForTestV0();
    resetAttentionInertiaForTestV0();
    resetCognitiveAttentionForTestV0();
    resetFelFailureExpressionForTestV0();
  });

  function buildStack(nowMs, voice = false) {
    const p = deriveRhizohPresenceStateV0({
      nowMs,
      voiceListening: voice,
      lastUserActivityMs: voice ? nowMs - 10 : nowMs - 100
    });
    const resl = resolveReslPresentationV0(p, { nowMs });
    const a = deriveCognitiveAttentionV0({
      presence: p,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "world",
      nowMs
    });
    const inertia = applyAttentionInertiaV0(a, nowMs);
    const mcib = blendMultiCausalIntentV0(a, inertia.propagation);
    const withMcib = enrichInertiaWithMcibV0(inertia, a, null);
    const withCcf = enrichInertiaWithCcfV0(withMcib, a, null);
    const cog = { ...a, attention_inertia: withCcf };
    const ecc = compileExperienceContinuityV0({
      presence: p,
      resl,
      cognitive: cog,
      trf: null,
      nowMs
    });
    return { ecc, ccf: withCcf.ccf, cog, p, resl };
  }

  it("first tick is phase coherent without corrections", () => {
    const { ecc, ccf } = buildStack(0, true);
    const guarded = applyTemporalDriftGuardV0(ecc, ccf, 0);
    expect(guarded.temporal_guard.phase_coherence_ok).toBe(true);
    expect(guarded.temporal_guard.corrections_applied).toBe(false);
    expect(guarded.temporal_guard.insurance_only).toBe(true);
  });

  it("detects frame-motion slip and soft-corrects ECC only", () => {
    const s0 = buildStack(0, false);
    applyTemporalDriftGuardV0(s0.ecc, s0.ccf, 0);

    const s1 = buildStack(500, true);
    const slipped = Object.freeze({
      ...s1.ecc,
      micro_transition: Object.freeze({
        ...s1.ecc.micro_transition,
        kind: ECC_MICRO_TRANSITION_V0.HOLD
      }),
      narrative_velocity: 0.85
    });
    const guarded = applyTemporalDriftGuardV0(slipped, s1.ccf, 500);

    expect(guarded.temporal_guard.phase_coherence_ok).toBe(false);
    expect(guarded.temporal_guard.corrections_applied).toBe(true);
    expect(
      [TDG_DRIFT_CLASS_V0.FRAME_MOTION_SLIP, TDG_DRIFT_CLASS_V0.COMPOUND, TDG_DRIFT_CLASS_V0.VELOCITY_JUMP]
    ).toContain(guarded.temporal_guard.drift_class);
    expect(guarded.narrative_velocity).toBeLessThan(0.85);
    expect(guarded.fade_semantics.durationMs).toBeGreaterThanOrEqual(slipped.fade_semantics.durationMs);
  });
});
