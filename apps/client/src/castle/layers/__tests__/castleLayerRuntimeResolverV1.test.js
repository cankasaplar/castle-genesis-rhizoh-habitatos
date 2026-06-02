import { describe, expect, it, vi, afterEach } from "vitest";
import { mapCastleVoiceEventTagToLayerV1, CASTLE_LAYER_STACK_ID_V1 } from "../castleLayerBehaviorGraphV1.js";
import {
  resolveCastleLayerVoiceContextV1,
  shouldDropVoiceExecutionForScopeV1
} from "../castleLayerRuntimeResolverV1.js";
import { VOICE_UI_DOMAIN_V0 } from "../../../rhizoh/runtime/rhizohVoiceUiDomainV0.js";

describe("castleLayerRuntimeResolverV1", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps STT tags to L0 perception", () => {
    expect(mapCastleVoiceEventTagToLayerV1("STT_FINAL")).toBe(CASTLE_LAYER_STACK_ID_V1.L0_PERCEPTION);
    expect(mapCastleVoiceEventTagToLayerV1("GATE_ROUTER_SANITY_REJECT")).toBe(
      CASTLE_LAYER_STACK_ID_V1.L1_COGNITIVE
    );
  });

  it("same uiDomain → execution eligible", () => {
    const ctx = resolveCastleLayerVoiceContextV1({
      eventTag: "STT_FINAL",
      uiDomain: VOICE_UI_DOMAIN_V0.T0_SHELL,
      activeUiDomain: VOICE_UI_DOMAIN_V0.T0_SHELL,
      executionAccepted: true
    });
    expect(ctx.executionEligible).toBe(true);
    expect(ctx.shadowOnly).toBe(false);
    expect(ctx.graphVersion).toBe("castle.layers.v1.1");
  });

  it("cross-domain event → shadow only (split-brain guard)", () => {
    const ctx = resolveCastleLayerVoiceContextV1({
      eventTag: "VOICE_LLM_DISPATCH",
      uiDomain: VOICE_UI_DOMAIN_V0.SPATIAL_SHELL,
      activeUiDomain: VOICE_UI_DOMAIN_V0.T0_SHELL
    });
    expect(ctx.scopeMatch).toBe(false);
    expect(ctx.executionEligible).toBe(false);
    expect(shouldDropVoiceExecutionForScopeV1(ctx)).toBe(true);
  });

  it("runtime_only events always scope-match", () => {
    const ctx = resolveCastleLayerVoiceContextV1({
      eventTag: "WITNESS",
      uiDomain: VOICE_UI_DOMAIN_V0.RUNTIME_ONLY,
      activeUiDomain: VOICE_UI_DOMAIN_V0.T0_SHELL
    });
    expect(ctx.scopeMatch).toBe(true);
  });
});
