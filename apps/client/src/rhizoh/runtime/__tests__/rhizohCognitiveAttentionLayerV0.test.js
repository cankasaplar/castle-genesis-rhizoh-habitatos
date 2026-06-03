import { describe, expect, it, beforeEach } from "vitest";
import {
  deriveCognitiveAttentionV0,
  RCAL_ATTENTION_TARGET_V0,
  RCAL_DRIFT_GOVERNOR_V0,
  resetCognitiveAttentionForTestV0
} from "../rhizohCognitiveAttentionLayerV0.js";
import {
  deriveRhizohPresenceStateV0,
  RHIZOH_ATTENTION_V0
} from "../rhizohPresenceStateEngineV0.js";
import { T0_INTENT_EXPLORE_V0 } from "../t0ContextStripV0.js";

describe("rhizohCognitiveAttentionLayerV0", () => {
  beforeEach(() => {
    resetCognitiveAttentionForTestV0();
  });

  it("listening maps to voice_channel focus", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 1000, voiceListening: true });
    const a = deriveCognitiveAttentionV0({ presence: p, nowMs: 1000 });
    expect(a.selective_focus.primary).toBe(RCAL_ATTENTION_TARGET_V0.VOICE_CHANNEL);
    expect(a.attention_vector.magnitude).toBeGreaterThan(0);
  });

  it("explore intent maps to world_mesh", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 2000, lastUserActivityMs: 1990 });
    const a = deriveCognitiveAttentionV0({
      presence: p,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "world",
      nowMs: 2000
    });
    expect(a.selective_focus.primary).toBe(RCAL_ATTENTION_TARGET_V0.WORLD_MESH);
    expect(a.directionLabel).toMatch(/room_scan|dialogue_focus/);
  });

  it("active_idle maps to continuity focus", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 3000 });
    const a = deriveCognitiveAttentionV0({ presence: p, nowMs: 3000 });
    expect(a.selective_focus.primary).toBe(RCAL_ATTENTION_TARGET_V0.CONTINUITY);
    expect(a.intent_drift_control.drift01).toBeLessThan(0.55);
  });

  it("high drift triggers dampen governor", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 0, voiceListening: true });
    deriveCognitiveAttentionV0({ presence: p, activeSurface: "world", nowMs: 0 });
    const p2 = deriveRhizohPresenceStateV0({
      nowMs: 20_000,
      fieldState: "EXECUTING",
      lastUserActivityMs: 19_990
    });
    const a2 = deriveCognitiveAttentionV0({
      presence: p2,
      t0Intent: T0_INTENT_EXPLORE_V0,
      activeSurface: "studio",
      routerIntent: "DEPLOY",
      nowMs: 20_000
    });
    expect(p2.rhizoh_attention).toBe(RHIZOH_ATTENTION_V0.FOCUSED);
    expect([RCAL_DRIFT_GOVERNOR_V0.DAMPEN, RCAL_DRIFT_GOVERNOR_V0.ALLOW_SHIFT]).toContain(
      a2.intent_drift_control.governor
    );
  });
});
