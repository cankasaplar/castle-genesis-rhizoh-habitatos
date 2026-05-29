import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  refreshWeatherAtmosphereFeedIfStaleV0,
  resetWorldPresenceWeatherCacheForTestsV0,
  getCachedWeatherAtmosphereFeedV0,
  getWeatherAtmosphereProvenanceV0
} from "../worldPresenceStoreV0.js";

describe("worldPresenceStoreV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "active");
    vi.stubEnv("VITE_WORLD_LAYER", "1");
    resetWorldPresenceWeatherCacheForTestsV0();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refresh without API key returns null and respects cooldown", async () => {
    const a = await refreshWeatherAtmosphereFeedIfStaleV0({ ttlMs: 60_000 });
    expect(a).toBeNull();
    expect(getCachedWeatherAtmosphereFeedV0()).toBeNull();
    const b = await refreshWeatherAtmosphereFeedIfStaleV0({ ttlMs: 60_000 });
    expect(b).toBeNull();
  });

  it("records atmosphere provenance after refresh", async () => {
    await refreshWeatherAtmosphereFeedIfStaleV0({ ttlMs: 60_000 });
    const p = getWeatherAtmosphereProvenanceV0();
    expect(p.source).toBe("openweather/unconfigured");
    expect(p.fetchedAt).toBeGreaterThan(0);
    expect(p.epoch).toMatch(/^atm_[0-9a-f]+$/);
  });

  it("OFF execution mode skips refresh side effects", async () => {
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "off");
    resetWorldPresenceWeatherCacheForTestsV0();
    await refreshWeatherAtmosphereFeedIfStaleV0({ ttlMs: 60_000 });
    const p = getWeatherAtmosphereProvenanceV0();
    expect(p.source).toBe("none");
    expect(p.fetchedAt).toBe(0);
  });
});
