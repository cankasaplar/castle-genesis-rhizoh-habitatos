import { describe, expect, it, vi, afterEach } from "vitest";
import { ingestIstanbulRealtimeFeedsV541 } from "./ingestIstanbulRealtimeFeedsV541.js";

describe("vNext-541 ingestIstanbulRealtimeFeedsV541", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("merges Open-Meteo + USGS into five-district regionalMap (mocked fetch)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        const u = String(url);
        if (u.includes("open-meteo.com")) {
          return {
            ok: true,
            json: async () => ({
              current: {
                temperature_2m: 18,
                relative_humidity_2m: 65,
                precipitation: 0,
                weather_code: 1,
                wind_speed_10m: 12
              }
            })
          };
        }
        if (u.includes("earthquake.usgs.gov")) {
          return {
            ok: true,
            json: async () => ({
              features: [{ properties: { mag: 2.1 } }, { properties: { mag: 1.8 } }]
            })
          };
        }
        return { ok: false };
      })
    );

    const ing = await ingestIstanbulRealtimeFeedsV541({ now: 1.71e12 });
    expect(ing.regionalMap.size).toBe(5);
    expect(ing.feedScalars.weather).toBeGreaterThan(0);
    expect(ing.feedScalars.microseism).toBeGreaterThan(0);
    expect(typeof ing.feedScalars.gridHealth).toBe("number");
    expect(ing.weatherSummary.gridLatentStress).toBeGreaterThanOrEqual(0);
    expect(ing.snapshots.length).toBe(5);
  });
});
