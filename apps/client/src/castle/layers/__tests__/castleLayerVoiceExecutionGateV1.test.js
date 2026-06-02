import { describe, expect, it, afterEach } from "vitest";
import { evaluateCastleLayerVoiceExecutionV1 } from "../castleLayerVoiceExecutionGateV1.js";
import { resetCastleLayerDecisionTraceForTestV1 } from "../castleLayerDecisionTraceV1.js";
import { VOICE_UI_DOMAIN_V0 } from "../../../rhizoh/runtime/rhizohVoiceUiDomainV0.js";

describe("castleLayerVoiceExecutionGateV1", () => {
  afterEach(() => {
    resetCastleLayerDecisionTraceForTestV1();
  });

  it("allows execution when all eligibility checks pass", () => {
    const result = evaluateCastleLayerVoiceExecutionV1({
      eventTag: "STT_DISPATCH",
      preview: "merhaba",
      uiDomain: VOICE_UI_DOMAIN_V0.T0_SHELL,
      eligibility: {
        hasText: true,
        sanityAccepted: true,
        routerAccepted: true,
        commitmentAllowed: true,
        dedupOk: true
      }
    });
    expect(result.allowExecution).toBe(true);
    expect(result.outcome).toBe("execute");
    expect(result.trace.eligibilityBreakdown.dedupOk).toBe(true);
  });

  it("drops execution on scope mismatch (split-brain guard)", () => {
    const result = evaluateCastleLayerVoiceExecutionV1({
      eventTag: "STT_DISPATCH",
      preview: "test",
      uiDomain: VOICE_UI_DOMAIN_V0.SPATIAL_SHELL,
      eligibility: {
        sanityAccepted: true,
        routerAccepted: true,
        commitmentAllowed: true,
        dedupOk: true
      }
    });
    expect(result.scopeDrop).toBe(true);
    expect(result.allowExecution).toBe(false);
    expect(result.trace.scopeMismatchChain.length).toBeGreaterThan(0);
  });

  it("rejects on router failure before execution gate", () => {
    const result = evaluateCastleLayerVoiceExecutionV1({
      eventTag: "STT_DISPATCH_BLOCKED",
      eligibility: {
        sanityAccepted: true,
        routerAccepted: false,
        routerReason: "low_confidence"
      }
    });
    expect(result.allowExecution).toBe(false);
    expect(result.trace.primaryRejectRule).toBe("confidence_router");
  });
});
