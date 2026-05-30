import { describe, expect, it, beforeEach } from "vitest";
import { VOICE_ATTENTION_MODE_V0 } from "../voiceAttentionContextV0.js";
import {
  RHIZOH_INTERACTION_INTENT_V0,
  RHIZOH_SHARED_ATTENTION_TYPE_V0,
  clearRhizohSharedAttentionOverrideV0,
  resolveRhizohRelationshipKernelV0,
  resolveSharedAttentionTypeV0,
  setRhizohSharedAttentionOverrideV0
} from "../rhizohRelationshipKernelV0.js";

describe("rhizohRelationshipKernelV0", () => {
  beforeEach(() => clearRhizohSharedAttentionOverrideV0());

  it("defaults to friend intent with coach rejected", () => {
    const k = resolveRhizohRelationshipKernelV0();
    expect(k.interactionIntent).toBe(RHIZOH_INTERACTION_INTENT_V0.FRIEND);
    expect(k.coachModelRejected).toBe(true);
    expect(k.performanceScoring).toBe(false);
    expect(k.awarenessResonance).toBe(true);
    expect(k.policyAuthority).toBe("observation_only");
  });

  it("maps moving_context legacy mode to co_presence shared looking", () => {
    const k = resolveRhizohRelationshipKernelV0({
      explicitMode: VOICE_ATTENTION_MODE_V0.MOVING_CONTEXT
    });
    expect(k.sharedAttentionType).toBe(RHIZOH_SHARED_ATTENTION_TYPE_V0.CO_PRESENCE);
    expect(k.sharedLooking).toBe("reflective_friend");
  });

  it("maps observer legacy mode to silence_aware", () => {
    const k = resolveRhizohRelationshipKernelV0({
      explicitMode: VOICE_ATTENTION_MODE_V0.OBSERVER
    });
    expect(k.sharedAttentionType).toBe(RHIZOH_SHARED_ATTENTION_TYPE_V0.SILENCE_AWARE);
    expect(k.effectiveResponsePressure).toBeLessThanOrEqual(0.1);
  });

  it("question heuristic opens exploratory attention", () => {
    const s = resolveSharedAttentionTypeV0({
      legacyMode: VOICE_ATTENTION_MODE_V0.MOVING_CONTEXT,
      text: "Rhizoh bu ne demek?"
    });
    expect(s.type).toBe(RHIZOH_SHARED_ATTENTION_TYPE_V0.EXPLORATORY);
  });

  it("explicit shared attention override wins", () => {
    setRhizohSharedAttentionOverrideV0(RHIZOH_SHARED_ATTENTION_TYPE_V0.SHARED_FOCUS);
    const k = resolveRhizohRelationshipKernelV0({
      explicitMode: VOICE_ATTENTION_MODE_V0.OBSERVER
    });
    expect(k.sharedAttentionType).toBe(RHIZOH_SHARED_ATTENTION_TYPE_V0.SHARED_FOCUS);
  });
});
