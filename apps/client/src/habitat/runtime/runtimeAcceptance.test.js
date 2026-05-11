import { describe, expect, it } from "vitest";
import { nextNetworkSampleDelayMs, nextNarrationCadenceDelayMs } from "./cadenceScheduler.js";
import { createLowPowerMode } from "./lowPowerMode.js";
import { scoreWakeMoment, shouldWakeImmediately } from "./wakeMoments.js";
import { createCastleFieldBridge } from "../../bridge/CastleFieldBridge.js";
import { buildIstanbulBridgeInputV540 } from "../../scene/istanbulBiomePresetV540.js";

describe("vNext-543 ambient runtime", () => {
  it("network cadence stays within 30–90s (default)", () => {
    for (let i = 0; i < 20; i++) {
      const d = nextNetworkSampleDelayMs();
      expect(d).toBeGreaterThanOrEqual(30_000);
      expect(d).toBeLessThanOrEqual(90_000);
    }
  });

  it("narration cadence stays within 2–8 min (default)", () => {
    const d = nextNarrationCadenceDelayMs();
    expect(d).toBeGreaterThanOrEqual(120_000);
    expect(d).toBeLessThanOrEqual(480_000);
  });

  it("low power mode lowers fps cap", () => {
    const lp = createLowPowerMode({ enabled: false });
    expect(lp.targetFpsCap()).toBe(20);
    lp.setEnabled(true);
    expect(lp.targetFpsCap()).toBe(12);
  });

  it("wake moment scores seismic jump", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const base = buildIstanbulBridgeInputV540({ feeds: { microseism: 0.05 }, epochHash: "0xw0" });
    const a = bridge.submitFrame({
      ...base,
      weatherSummary: { ...base.weatherSummary, seismicMicro: 0.05 }
    });
    const b = bridge.submitFrame({
      ...base,
      weatherSummary: { ...base.weatherSummary, seismicMicro: 0.55 },
      epochHash: "0xw1"
    });
    const score = scoreWakeMoment(a, b);
    expect(score).toBeGreaterThan(0.45);
    expect(shouldWakeImmediately(score)).toBe(true);
  });
});
