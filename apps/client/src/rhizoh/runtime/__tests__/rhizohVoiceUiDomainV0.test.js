import { describe, expect, it, vi, afterEach } from "vitest";
import {
  isVoiceUiDomainScopeMatchV0,
  resolveRhizohVoiceUiDomainV0,
  VOICE_UI_DOMAIN_V0
} from "../rhizohVoiceUiDomainV0.js";

describe("rhizohVoiceUiDomainV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete global.window.__rhizoh_boot_context;
    delete global.window.__rhizoh_ingress_route;
  });

  it("defaults to t0_shell on rhizoh product", () => {
    vi.stubEnv("VITE_RHIZOH_SPATIAL_SHELL", "");
    expect(resolveRhizohVoiceUiDomainV0()).toBe(VOICE_UI_DOMAIN_V0.T0_SHELL);
  });

  it("spatial shell env selects spatial_shell", () => {
    vi.stubEnv("VITE_RHIZOH_SPATIAL_SHELL", "1");
    expect(resolveRhizohVoiceUiDomainV0()).toBe(VOICE_UI_DOMAIN_V0.SPATIAL_SHELL);
  });

  it("ingress route selects ingress domain", () => {
    global.window.__rhizoh_boot_context = { route: "legal_preamble" };
    expect(resolveRhizohVoiceUiDomainV0()).toBe(VOICE_UI_DOMAIN_V0.INGRESS);
  });

  it("scope match rejects cross-shell dispatch", () => {
    expect(
      isVoiceUiDomainScopeMatchV0(VOICE_UI_DOMAIN_V0.SPATIAL_SHELL, VOICE_UI_DOMAIN_V0.T0_SHELL)
    ).toBe(false);
    expect(
      isVoiceUiDomainScopeMatchV0(VOICE_UI_DOMAIN_V0.T0_SHELL, VOICE_UI_DOMAIN_V0.T0_SHELL)
    ).toBe(true);
  });
});
