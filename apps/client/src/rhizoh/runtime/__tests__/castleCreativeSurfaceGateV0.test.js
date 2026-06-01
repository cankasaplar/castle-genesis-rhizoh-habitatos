import { describe, it, expect, vi, afterEach } from "vitest";
import { isRhizohCreativeSurfaceEnabledV0 } from "../castleCreativeSurfaceGateV0.js";
import {
  buildRhizohProductCapabilityEnvelope,
  RHIZOH_CONVERSATION_PHASE
} from "../../product/rhizohConversationOrchestratorV1.js";

describe("castleCreativeSurfaceGateV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("isRhizohCreativeSurfaceEnabledV0 respects env", () => {
    vi.stubEnv("VITE_RHIZOH_SURFACE_CREATIVE", "");
    expect(isRhizohCreativeSurfaceEnabledV0()).toBe(false);
    vi.stubEnv("VITE_RHIZOH_SURFACE_CREATIVE", "1");
    expect(isRhizohCreativeSurfaceEnabledV0()).toBe(true);
  });

  it("buildRhizohProductCapabilityEnvelope unlocks studio surfaces when creative", () => {
    vi.stubEnv("VITE_RHIZOH_SURFACE_CREATIVE", "1");
    const env = buildRhizohProductCapabilityEnvelope(RHIZOH_CONVERSATION_PHASE.NEW_USER);
    expect(env.surfaces.kernelHeavyPanels).toBe(true);
    expect(env.surfaces.constitutionalProductionDrawer).toBe(true);
  });
});
