import { describe, expect, it, beforeEach } from "vitest";
import { VOICE_ATTENTION_MODE_V0 } from "../voiceAttentionContextV0.js";
import {
  RHIZOH_SHARED_ATTENTION_TYPE_V0,
  clearRhizohSharedAttentionOverrideV0,
  resolveRhizohRelationshipKernelV0
} from "../rhizohRelationshipKernelV0.js";

describe("rhizohRelationshipKernelV0", () => {
  beforeEach(() => clearRhizohSharedAttentionOverrideV0());

  it("yürüyüş defaults to co_presence friend posture", () => {
    const k = resolveRhizohRelationshipKernelV0({
      explicitMode: VOICE_ATTENTION_MODE_V0.MOVING_CONTEXT
    });
    expect(k.sharedAttentionType).toBe(RHIZOH_SHARED_ATTENTION_TYPE_V0.CO_PRESENCE);
    expect(k.coachModelRejected).toBe(true);
  });
});
