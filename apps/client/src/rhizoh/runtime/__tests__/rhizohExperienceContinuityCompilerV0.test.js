import { describe, expect, it, beforeEach } from "vitest";
import {
  compileExperienceContinuityV0,
  ECC_MICRO_TRANSITION_V0,
  resetExperienceContinuityForTestV0,
  syncExperienceContinuityV0
} from "../rhizohExperienceContinuityCompilerV0.js";
import {
  deriveRhizohPresenceStateV0,
  resetFelFailureExpressionForTestV0
} from "../rhizohPresenceStateEngineV0.js";
import { resolveReslPresentationV0 } from "../rhizohReslPresentationPolicyV0.js";
import {
  resetCognitiveAttentionForTestV0,
  syncCognitiveAttentionAfterPresenceV0
} from "../rhizohCognitiveAttentionLayerV0.js";
import {
  buildT0UnifiedPresenceFrameV0,
  readLastT0PresenceFrameV0,
  resetT0UnifiedPresenceFrameForTestV0
} from "../rhizohT0UnifiedPresenceFrameV0.js";

describe("rhizohExperienceContinuityCompilerV0", () => {
  beforeEach(() => {
    resetExperienceContinuityForTestV0();
    resetFelFailureExpressionForTestV0();
    resetCognitiveAttentionForTestV0();
    resetT0UnifiedPresenceFrameForTestV0();
  });

  it("compiles eventless narrative stream from RPSE + RESL", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 1000, lastUserActivityMs: 990 });
    const resl = resolveReslPresentationV0(p, { nowMs: 1000 });
    const ecc = compileExperienceContinuityV0({ presence: p, resl, nowMs: 1000 });
    expect(ecc.continuity_line).toBe(resl.continuityLine);
    expect(ecc.fade_semantics.eventless).toBe(true);
    expect(ecc.micro_transition.eventless).toBe(true);
    expect(ecc.narrative_velocity).toBeGreaterThan(0);
  });

  it("full stack sync attaches narrativeStream to T0 frame", async () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 2000, voiceListening: true });
    const resl = resolveReslPresentationV0(p, { nowMs: 2000 });
    syncCognitiveAttentionAfterPresenceV0({ presence: p, nowMs: 2000 });
    await syncExperienceContinuityV0({
      presence: p,
      resl,
      cognitive: null,
      trf: null,
      nowMs: 2000
    });
    const frame = readLastT0PresenceFrameV0();
    expect(frame?.narrativeStream?.continuity_line).toBeTruthy();
    expect(frame?.narrativeStream?.micro_transition?.kind).toBeTruthy();
  });

  it("cognitive + voice yields shift or drift micro transition", () => {
    const p = deriveRhizohPresenceStateV0({ nowMs: 0, voiceListening: true });
    const resl = resolveReslPresentationV0(p, { nowMs: 0 });
    const cog = syncCognitiveAttentionAfterPresenceV0({ presence: p, nowMs: 0 });
    const ecc = compileExperienceContinuityV0({
      presence: p,
      resl,
      cognitive: cog,
      trf: null,
      nowMs: 0
    });
    expect(
      [
        ECC_MICRO_TRANSITION_V0.SHIFT,
        ECC_MICRO_TRANSITION_V0.DRIFT,
        ECC_MICRO_TRANSITION_V0.BREATHE,
        ECC_MICRO_TRANSITION_V0.SETTLE,
        ECC_MICRO_TRANSITION_V0.HOLD
      ]
    ).toContain(ecc.micro_transition.kind);
    const frame = buildT0UnifiedPresenceFrameV0(p, resl, ecc, 0);
    expect(frame.narrativeStream.stream_coherence_id).toBe(ecc.stream_coherence_id);
  });
});
