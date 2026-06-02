import { describe, expect, it, vi, afterEach } from "vitest";
import {
  computeMapSurfaceActive,
  isRhizohProductMapExecutionEnabledV0
} from "../realityEngineSurface.js";

describe("realityEngineSurface", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows REAL_MAP when product world execution is active", () => {
    vi.stubEnv("VITE_WORLD_LAYER", "1");
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "active");
    expect(isRhizohProductMapExecutionEnabledV0()).toBe(true);
    expect(computeMapSurfaceActive("REAL_MAP", "unconfigured")).toBe(true);
  });

  it("blocks REAL_MAP without gateway when product map off", () => {
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "passive");
    expect(computeMapSurfaceActive("REAL_MAP", "unconfigured")).toBe(false);
  });
});
