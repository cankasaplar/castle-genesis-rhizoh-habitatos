import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  formatWorldMapLocalClockV0,
  formatWorldMapTrafficLineV0,
  formatWorldMapWeatherLineV0,
  resolveWorldMapTimeZoneV0,
  startWorldMapLiveContextPollingV0
} from "../worldMapLiveContextV0.js";

describe("worldMapLiveContextV0", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.__CASTLE_NEXUS_GEO__ = undefined;
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    if (typeof window !== "undefined") {
      window.__CASTLE_NEXUS_GEO__ = undefined;
    }
  });

  it("uses Istanbul timezone for Turkey bbox", () => {
    expect(resolveWorldMapTimeZoneV0({ lat: 41.04, lon: 29.01 })).toBe("Europe/Istanbul");
  });

  it("formats local clock", () => {
    const label = formatWorldMapLocalClockV0({ lat: 41.04, lon: 29.01 }, "tr");
    expect(label).toMatch(/^\d{2}:\d{2}$/);
  });

  it("formats weather line", () => {
    const line = formatWorldMapWeatherLineV0(
      {
        temperature: 18.4,
        description: "parçalı bulutlu",
        cloudDensity: 0.4,
        humidity: 0.5,
        rainIntensity: 0,
        wind: 0.2,
        timestamp: Date.now()
      },
      "tr"
    );
    expect(line).toContain("18°C");
    expect(line).toContain("parçalı bulutlu");
  });

  it("formats traffic line in Turkish", () => {
    expect(
      formatWorldMapTrafficLineV0(
        {
          level: "medium",
          intensity: 0.4,
          currentSpeedKmh: 35,
          freeFlowSpeedKmh: 55,
          currentTravelTimeSec: 120,
          freeFlowTravelTimeSec: 90,
          timestamp: Date.now(),
          confidence: 0.7,
          roadClosure: false
        },
        "tr"
      )
    ).toBe("trafik: orta");
  });

  it("keeps local clock heartbeat alive when world execution is off", () => {
    vi.useFakeTimers();
    vi.stubEnv("VITE_WORLD_LAYER", "false");
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "off");
    const updates = [];
    const stop = startWorldMapLiveContextPollingV0({
      locale: "tr",
      onUpdate: (snap) => updates.push(snap)
    });

    expect(updates.length).toBe(1);
    vi.advanceTimersByTime(30_000);
    expect(updates.length).toBe(2);
    expect(updates[1].timeLabel).toMatch(/^\d{2}:\d{2}$/);
    stop();
  });
});
