import { describe, expect, it, vi, afterEach } from "vitest";
import {
  isRhizohSpatialProductShellEnabled,
  isRhizohFastSpeechModeEnabled,
  isWorldLayerEnabled
} from "../castleWorldLayerGateV0.js";

describe("castleWorldLayerGateV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("spatial product shell is off unless explicitly enabled", () => {
    vi.stubEnv("VITE_RHIZOH_SPATIAL_SHELL", "");
    expect(isRhizohSpatialProductShellEnabled()).toBe(false);
    vi.stubEnv("VITE_RHIZOH_SPATIAL_SHELL", "1");
    expect(isRhizohSpatialProductShellEnabled()).toBe(true);
  });

  it("fast speech dock follows VITE_RHIZOH_FAST_SPEECH_MODE", () => {
    vi.stubEnv("VITE_RHIZOH_FAST_SPEECH_MODE", "1");
    expect(isRhizohFastSpeechModeEnabled()).toBe(true);
  });

  it("world layer legacy default stays on when unset", () => {
    vi.stubEnv("VITE_WORLD_LAYER", "");
    expect(isWorldLayerEnabled()).toBe(true);
  });
});
