import { describe, it, expect } from "vitest";
import { normalizeOpenWeatherCurrentJsonV0, buildAtmosphereEpochIdV0 } from "../weatherIngestV0.js";

describe("weatherIngestV0", () => {
  it("normalizeOpenWeatherCurrentJsonV0 maps OpenWeather current payload", () => {
    const fixture = {
      main: { temp: 18.2, humidity: 72 },
      wind: { speed: 4.2 },
      clouds: { all: 88 },
      rain: { "1h": 2.4 },
      weather: [{ main: "Rain", id: 500 }]
    };
    const n = normalizeOpenWeatherCurrentJsonV0(fixture);
    expect(n).not.toBeNull();
    expect(n?.cloudDensity).toBeCloseTo(0.88, 5);
    expect(n?.humidity).toBeCloseTo(0.72, 5);
    expect(n?.rainIntensity).toBeGreaterThan(0.1);
    expect(n?.wind).toBeGreaterThan(0);
    expect(n?.temperature).toBe(18.2);
    expect(typeof n?.timestamp).toBe("number");
  });

  it("normalizeOpenWeatherCurrentJsonV0 returns null for non-object", () => {
    expect(normalizeOpenWeatherCurrentJsonV0(null)).toBeNull();
  });

  it("buildAtmosphereEpochIdV0 is stable for same feed snapshot", () => {
    const feed = {
      cloudDensity: 0.5,
      humidity: 0.6,
      rainIntensity: 0,
      wind: 0.3,
      temperature: 20,
      timestamp: 1_700_000_000_000
    };
    expect(buildAtmosphereEpochIdV0(feed)).toBe(buildAtmosphereEpochIdV0(feed));
    expect(buildAtmosphereEpochIdV0(feed)).toMatch(/^atm_[0-9a-f]+$/);
    expect(buildAtmosphereEpochIdV0(null)).toMatch(/^atm_/);
  });
});
