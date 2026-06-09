import { describe, expect, it } from "vitest";
import {
  CANONICAL_WEATHER_MODE_V1,
  formatWeatherReplyV1
} from "../rhizohCanonicalReflexSnapshotV1.js";
import { collapseEntityPhoneticTokenV1 } from "../rhizohCanonicalPhoneticClusterV1.js";

describe("rhizohCanonicalReflexSnapshotV1", () => {
  it("formatWeatherReplyV1 returns live mode from cached feed", () => {
    const out = formatWeatherReplyV1(
      "tr",
      {
        cloudDensity: 0.2,
        humidity: 0.5,
        rainIntensity: 0,
        wind: 0.2,
        temperature: 19.4,
        timestamp: Date.now(),
        weatherMain: "Clear",
        description: "açık"
      },
      { source: "openweather/current" }
    );
    expect(out.mode).toBe(CANONICAL_WEATHER_MODE_V1.LIVE);
    expect(out.text).toMatch(/19|açık/i);
  });

  it("formatWeatherReplyV1 maps English clear sky description to Turkish açık", () => {
    const out = formatWeatherReplyV1(
      "tr",
      {
        cloudDensity: 0.1,
        humidity: 0.4,
        rainIntensity: 0,
        wind: 0.1,
        temperature: 28,
        timestamp: Date.now(),
        weatherMain: "Clear",
        description: "clear sky"
      },
      { source: "openweather/current" }
    );
    expect(out.text).toMatch(/28/);
    expect(out.text).toMatch(/açık/i);
    expect(out.text).not.toMatch(/clear sky/i);
  });

  it("formatWeatherReplyV1 falls back to stub without live provenance", () => {
    const out = formatWeatherReplyV1("tr", null, { source: "openweather/unconfigured" });
    expect(out.mode).toBe(CANONICAL_WEATHER_MODE_V1.STUB);
  });
});

describe("rhizohCanonicalPhoneticClusterV1", () => {
  it("collapses resol erizo evizo riseoh variants", () => {
    expect(collapseEntityPhoneticTokenV1("resol")).toBe("rhizoh");
    expect(collapseEntityPhoneticTokenV1("erizo")).toBe("rhizoh");
    expect(collapseEntityPhoneticTokenV1("evizo")).toBe("rhizoh");
    expect(collapseEntityPhoneticTokenV1("riseoh")).toBe("rhizoh");
  });
});
