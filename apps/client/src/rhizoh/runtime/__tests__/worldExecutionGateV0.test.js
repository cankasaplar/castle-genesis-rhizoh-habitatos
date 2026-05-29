import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getWorldExecutionModeV0, WORLD_EXECUTION_PASSIVE_SEMANTIC, WORLD_EXECUTION_ACTIVE_SEMANTIC } from "../worldExecutionGateV0.js";

describe("worldExecutionGateV0", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("respects VITE_WORLD_EXECUTION_MODE=off over world layer", () => {
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "off");
    vi.stubEnv("VITE_WORLD_LAYER", "1");
    expect(getWorldExecutionModeV0()).toBe("OFF");
  });

  it("respects passive and active literals", () => {
    expect(WORLD_EXECUTION_PASSIVE_SEMANTIC).toBe("OBSERVER");
    expect(WORLD_EXECUTION_ACTIVE_SEMANTIC).toBe("EFFECTOR");
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "passive");
    expect(getWorldExecutionModeV0()).toBe("PASSIVE");
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "active");
    expect(getWorldExecutionModeV0()).toBe("ACTIVE");
  });
});
