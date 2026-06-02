import { describe, expect, it, afterEach } from "vitest";
import {
  buildCastleLayerDecisionPathV1,
  buildCastleLayerDecisionTraceV1,
  castleLayerDecisionTraceLogDetailV1,
  deriveCastleLayerDecisionOutcomeV1,
  recordCastleLayerDecisionTraceV1,
  resetCastleLayerDecisionTraceForTestV1
} from "../castleLayerDecisionTraceV1.js";
import { CASTLE_LAYER_STACK_ID_V1 } from "../castleLayerBehaviorGraphV1.js";
import { VOICE_UI_DOMAIN_V0 } from "../../../rhizoh/runtime/rhizohVoiceUiDomainV0.js";

describe("castleLayerDecisionTraceV1", () => {
  afterEach(() => {
    resetCastleLayerDecisionTraceForTestV1();
  });

  it("builds decision path with failing sanity step", () => {
    const path = buildCastleLayerDecisionPathV1(
      { hasText: true, sanityAccepted: false, sanityReason: "repeat" },
      { scopeMatch: true, activeUiDomain: VOICE_UI_DOMAIN_V0.T0_SHELL }
    );
    const sanity = path.find((s) => s.rule === "sanity_gate");
    expect(sanity?.passed).toBe(false);
    expect(sanity?.detail).toBe("repeat");
  });

  it("derives reject on cognitive failure, shadow on scope-only mismatch", () => {
    const rejectPath = buildCastleLayerDecisionPathV1({ routerAccepted: false });
    expect(deriveCastleLayerDecisionOutcomeV1(rejectPath)).toBe("reject");

    const scopePath = buildCastleLayerDecisionPathV1(
      { scopeMatch: false },
      { scopeMatch: false, shadowOnly: true }
    );
    expect(deriveCastleLayerDecisionOutcomeV1(scopePath, { shadowOnly: true })).toBe("shadow");
  });

  it("records trace with scope mismatch chain", () => {
    const voiceContext = {
      activeUiDomain: VOICE_UI_DOMAIN_V0.T0_SHELL,
      uiDomain: VOICE_UI_DOMAIN_V0.SPATIAL_SHELL,
      scopeMatch: false,
      shadowOnly: true
    };
    const decisionPath = buildCastleLayerDecisionPathV1({ scopeMatch: false }, voiceContext);
    const trace = buildCastleLayerDecisionTraceV1({
      voiceContext,
      decisionPath,
      outcome: "shadow",
      eventTag: "STT_DISPATCH_SCOPE_REJECT",
      preview: "hello"
    });
    recordCastleLayerDecisionTraceV1(trace);
    expect(trace.primaryRejectLayer).toBe(CASTLE_LAYER_STACK_ID_V1.L2_VOICE_DOMAIN);
    expect(trace.scopeMismatchChain[0].expected).toBe(VOICE_UI_DOMAIN_V0.T0_SHELL);
    const detail = castleLayerDecisionTraceLogDetailV1(trace);
    expect(detail.decisionOutcome).toBe("shadow");
    expect(detail.decisionPath).toContain("scope_match=0");
  });
});
