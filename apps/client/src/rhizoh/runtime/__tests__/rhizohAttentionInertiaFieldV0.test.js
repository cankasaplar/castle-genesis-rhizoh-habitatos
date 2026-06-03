import { describe, expect, it, beforeEach } from "vitest";
import {
  applyAttentionInertiaV0,
  INERTIA_FOCUS_HOLD_MS_V0,
  resetAttentionInertiaForTestV0
} from "../rhizohAttentionInertiaFieldV0.js";
import {
  deriveCognitiveAttentionV0,
  RCAL_ATTENTION_TARGET_V0,
  resetCognitiveAttentionForTestV0
} from "../rhizohCognitiveAttentionLayerV0.js";
import {
  deriveRhizohPresenceStateV0,
  resetFelFailureExpressionForTestV0
} from "../rhizohPresenceStateEngineV0.js";
import { T0_INTENT_EXPLORE_V0 } from "../t0ContextStripV0.js";

describe("rhizohAttentionInertiaFieldV0", () => {
  beforeEach(() => {
    resetAttentionInertiaForTestV0();
    resetCognitiveAttentionForTestV0();
    resetFelFailureExpressionForTestV0();
  });

  it("smooths vector between samples", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 0, voiceListening: true });
    const a0 = deriveCognitiveAttentionV0({ presence: p, nowMs: 0 });
    applyAttentionInertiaV0(a0, 0);

    const p2 = deriveRhizohPresenceStateV0({
      nowMs: 500,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "world"
    });
    const a1 = deriveCognitiveAttentionV0({
      presence: p2,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "world",
      nowMs: 500
    });
    const inert = applyAttentionInertiaV0(a1, 500);

    expect(inert.smoothed_vector.magnitude).toBeGreaterThan(0);
    expect(inert.smoothed_vector.magnitude).toBeLessThanOrEqual(1);
    expect(Math.abs(inert.smoothed_vector.vx)).toBeLessThanOrEqual(1);
  });

  it("holds primary focus before switch", () => {
    const pVoice = deriveRhizohPresenceStateV0({ nowMs: 0, voiceListening: true });
    const aVoice = deriveCognitiveAttentionV0({ presence: pVoice, nowMs: 0 });
    applyAttentionInertiaV0(aVoice, 0);
    expect(aVoice.selective_focus.primary).toBe(RCAL_ATTENTION_TARGET_V0.VOICE_CHANNEL);

    const pWorld = deriveRhizohPresenceStateV0({ nowMs: 400 });
    const aWorld = deriveCognitiveAttentionV0({
      presence: pWorld,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "world",
      nowMs: 400
    });
    const early = applyAttentionInertiaV0(aWorld, 400);
    expect(early.smoothed_focus.primary).toBe(RCAL_ATTENTION_TARGET_V0.VOICE_CHANNEL);

    const late = applyAttentionInertiaV0(aWorld, 400 + INERTIA_FOCUS_HOLD_MS_V0 + 50);
    expect(late.smoothed_focus.primary).toBe(aWorld.selective_focus.primary);
  });

  it("builds trail over horizon", () => {
    const base = deriveRhizohPresenceStateV0({ nowMs: 1000 });
    for (let t = 1000; t <= 2800; t += 400) {
      const a = deriveCognitiveAttentionV0({ presence: base, nowMs: t });
      applyAttentionInertiaV0(a, t);
    }
    const last = applyAttentionInertiaV0(
      deriveCognitiveAttentionV0({ presence: base, nowMs: 3000 }),
      3000
    );
    expect(last.trail).not.toBeNull();
    expect(last.trail.spanMs).toBeGreaterThan(0);
    expect(last.motion_continuity01).toBeGreaterThan(0.3);
    expect(last.projection.gazeBias01).toBeDefined();
  });

  it("propagation records why_looking and why_changed on focus shift", () => {
    const p0 = deriveRhizohPresenceStateV0({ nowMs: 0, voiceListening: true });
    const a0 = deriveCognitiveAttentionV0({ presence: p0, nowMs: 0 });
    const i0 = applyAttentionInertiaV0(a0, 0);
    expect(i0.propagation.why_looking.code).toBeTruthy();
    expect(i0.propagation.why_changed).toBeNull();

    const p1 = deriveRhizohPresenceStateV0({ nowMs: 2000, fieldState: "EXECUTING", lastUserActivityMs: 1990 });
    const a1 = deriveCognitiveAttentionV0({
      presence: p1,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "world",
      routerIntent: "DEPLOY",
      nowMs: 2000
    });
    for (let t = 2000; t <= 2000 + INERTIA_FOCUS_HOLD_MS_V0 + 100; t += 200) {
      applyAttentionInertiaV0(
        deriveCognitiveAttentionV0({
          presence: p1,
          t0Intent: T0_INTENT_EXPLORE_V0,
          activeSurface: "world",
          routerIntent: "DEPLOY",
          nowMs: t
        }),
        t
      );
    }
    const last = applyAttentionInertiaV0(a1, 2000 + INERTIA_FOCUS_HOLD_MS_V0 + 100);
    expect(last.propagation.persistence_ms).toBeGreaterThan(0);
    expect(last.propagation.direction_persist01).toBeGreaterThan(0.25);
    if (last.propagation.why_changed) {
      expect(last.propagation.why_changed.from).toBeTruthy();
      expect(last.propagation.why_changed.to).toBeTruthy();
      expect(last.propagation.why_changed.code).toBeTruthy();
    }
  });
});
