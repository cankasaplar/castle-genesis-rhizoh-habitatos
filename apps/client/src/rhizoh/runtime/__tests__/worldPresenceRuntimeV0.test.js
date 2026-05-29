import { describe, it, expect } from "vitest";
import {
  buildWorldPresenceStateV0,
  deriveEpistemicAtmosphereV0,
  buildNeutralAmbientAtmosphereV0,
  buildAmbientAtmosphereFromFeedV0
} from "../worldPresenceRuntimeV0.js";

describe("worldPresenceRuntimeV0", () => {
  it("buildWorldPresenceStateV0 returns v0 shape with ambient + atmosphere", () => {
    const s = buildWorldPresenceStateV0();
    expect(s.schema).toBe("worldPresence.v0");
    expect(typeof s.at).toBe("number");
    expect(s.ambient).toMatchObject({
      weatherType: "unknown",
      cloudDensity: expect.any(Number),
      humidity: expect.any(Number),
      localTime: expect.any(Object),
      luminosity: expect.any(Number)
    });
    expect(s.atmosphere).toMatchObject({
      visibilityBudget: expect.any(Number),
      auraIntensity: expect.any(Number),
      driftBloom: expect.any(Number),
      nightResonance: expect.any(Number),
      fogDiffusion: expect.any(Number)
    });
    expect(s.memoryEcho).toBeNull();
    expect(s.collectivePulse).toBeNull();
  });

  it("deriveEpistemicAtmosphereV0 respects higher cloud → lower visibility budget trend", () => {
    const low = deriveEpistemicAtmosphereV0({
      ambient: { ...buildNeutralAmbientAtmosphereV0(), cloudDensity: 0.95, humidity: 0.9, luminosity: 0.3 }
    });
    const high = deriveEpistemicAtmosphereV0({
      ambient: { ...buildNeutralAmbientAtmosphereV0(), cloudDensity: 0.1, humidity: 0.2, luminosity: 0.95 }
    });
    expect(low.visibilityBudget).toBeLessThan(high.visibilityBudget);
  });

  it("buildWorldPresenceStateV0 merges weather feed into ambient", () => {
    const feed = {
      cloudDensity: 0.9,
      humidity: 0.85,
      rainIntensity: 0.4,
      wind: 0.5,
      temperature: 12,
      timestamp: Date.now()
    };
    const s = buildWorldPresenceStateV0({ weatherFeed: feed });
    expect(s.ambient.cloudDensity).toBe(0.9);
    expect(s.ambient.rainIntensity).toBe(0.4);
    expect(s.ambient.weatherType).toMatch(/rain|clouds|mixed/);
    expect(s.atmosphere.driftBloom).toBeGreaterThan(0.3);
  });

  it("buildAmbientAtmosphereFromFeedV0 dims luminosity under heavy cloud", () => {
    const t = Date.now();
    const clear = buildAmbientAtmosphereFromFeedV0(t, {
      cloudDensity: 0.05,
      humidity: 0.3,
      rainIntensity: 0,
      wind: 0.1,
      temperature: 22,
      timestamp: t
    });
    const heavy = buildAmbientAtmosphereFromFeedV0(t, {
      cloudDensity: 0.95,
      humidity: 0.9,
      rainIntensity: 0.2,
      wind: 0.6,
      temperature: 14,
      timestamp: t
    });
    expect(heavy.luminosity).toBeLessThan(clear.luminosity);
  });
});
