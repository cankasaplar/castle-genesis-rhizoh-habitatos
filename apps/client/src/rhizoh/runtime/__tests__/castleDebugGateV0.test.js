import { describe, expect, it, beforeEach } from "vitest";
import { isCastleDebugGranularFlagEnabled } from "../castleDebugGateV0.js";

describe("castleDebugGateV0", () => {
  beforeEach(() => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_DEBUG = "0";
    import.meta.env.VITE_SOVEREIGN_NODE_ONBOARDING = "0";
    import.meta.env.VITE_EPISTEMIC_SIM_RESEARCH = "0";
  });

  it("allows production membrane flags without VITE_DEBUG umbrella", () => {
    import.meta.env.VITE_SOVEREIGN_NODE_ONBOARDING = "1";
    expect(isCastleDebugGranularFlagEnabled("VITE_SOVEREIGN_NODE_ONBOARDING")).toBe(true);
  });

  it("blocks lab flags in production without VITE_DEBUG umbrella", () => {
    import.meta.env.VITE_EPISTEMIC_SIM_RESEARCH = "1";
    expect(isCastleDebugGranularFlagEnabled("VITE_EPISTEMIC_SIM_RESEARCH")).toBe(false);
  });

  it("allows lab flags when umbrella and granular set in production", () => {
    import.meta.env.VITE_DEBUG = "1";
    import.meta.env.VITE_EPISTEMIC_SIM_RESEARCH = "1";
    expect(isCastleDebugGranularFlagEnabled("VITE_EPISTEMIC_SIM_RESEARCH")).toBe(true);
  });

  it("does not enable membrane flags in dev from VITE_DEBUG umbrella alone", () => {
    import.meta.env.DEV = true;
    import.meta.env.VITE_DEBUG = "1";
    import.meta.env.VITE_SATELLITE_NODE_REGISTRY_V0 = "0";
    expect(isCastleDebugGranularFlagEnabled("VITE_SATELLITE_NODE_REGISTRY_V0")).toBe(false);
  });

  it("enables membrane flags in dev when granular is explicit", () => {
    import.meta.env.DEV = true;
    import.meta.env.VITE_DEBUG = "1";
    import.meta.env.VITE_SATELLITE_NODE_REGISTRY_V0 = "1";
    expect(isCastleDebugGranularFlagEnabled("VITE_SATELLITE_NODE_REGISTRY_V0")).toBe(true);
  });
});
