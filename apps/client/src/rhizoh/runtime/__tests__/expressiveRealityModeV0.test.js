import { describe, it, expect, vi, afterEach } from "vitest";
import {
  EXPRESSIVE_REALITY_MODE_CREATIVE_V0,
  EXPRESSIVE_REALITY_MODE_OBSERVER_V0,
  readExpressiveRealityModePresentationV0,
  resolveExpressiveRealityModeV0
} from "../expressiveRealityModeV0.js";

describe("expressiveRealityModeV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to E2-C observer", () => {
    vi.stubEnv("VITE_RHIZOH_SURFACE_CREATIVE", "");
    expect(resolveExpressiveRealityModeV0()).toBe(EXPRESSIVE_REALITY_MODE_OBSERVER_V0);
    const p = readExpressiveRealityModePresentationV0();
    expect(p.transitionGap).toBe(true);
  });

  it("E2-X when creative surface flag on", () => {
    vi.stubEnv("VITE_RHIZOH_SURFACE_CREATIVE", "1");
    expect(resolveExpressiveRealityModeV0()).toBe(EXPRESSIVE_REALITY_MODE_CREATIVE_V0);
    const p = readExpressiveRealityModePresentationV0();
    expect(p.headline).toMatch(/Dünya/);
    expect(p.transitionGap).toBe(false);
  });
});
