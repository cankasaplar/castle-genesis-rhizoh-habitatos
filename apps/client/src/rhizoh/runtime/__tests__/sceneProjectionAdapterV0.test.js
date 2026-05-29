import { describe, it, expect } from "vitest";
import { deriveProjectionHintsV0, applyProjectionHintsToHostV0, clearProjectionHintsFromHostV0 } from "../sceneProjectionAdapterV0.js";
import { buildWorldPresenceStateV0 } from "../worldPresenceRuntimeV0.js";

describe("sceneProjectionAdapterV0", () => {
  it("deriveProjectionHintsV0 is pure and does not throw on null", () => {
    const h = deriveProjectionHintsV0(null);
    expect(h.fogDensity).toBeGreaterThanOrEqual(0);
    expect(h.castleAuraIntensity).toBeGreaterThanOrEqual(0);
    expect(h.castleMetabolicPulse).toBeGreaterThanOrEqual(0);
    expect(h.ambientTint).toMatchObject({ r: expect.any(Number), g: expect.any(Number), b: expect.any(Number) });
  });

  it("deriveProjectionHintsV0 increases fog when atmosphere is heavy", () => {
    const state = buildWorldPresenceStateV0({
      weatherFeed: {
        cloudDensity: 0.95,
        humidity: 0.92,
        rainIntensity: 0.5,
        wind: 0.6,
        temperature: 11,
        timestamp: Date.now()
      }
    });
    const heavy = deriveProjectionHintsV0(state);
    const light = deriveProjectionHintsV0(
      buildWorldPresenceStateV0({
        weatherFeed: {
          cloudDensity: 0.1,
          humidity: 0.25,
          rainIntensity: 0,
          wind: 0.1,
          temperature: 24,
          timestamp: Date.now()
        }
      })
    );
    expect(heavy.fogDensity).toBeGreaterThanOrEqual(light.fogDensity);
  });

  it("applyProjectionHintsToHostV0 sets CSS custom properties", () => {
    const el = document.createElement("div");
    const hints = deriveProjectionHintsV0(buildWorldPresenceStateV0());
    applyProjectionHintsToHostV0(el, hints);
    expect(el.style.getPropertyValue("--rhizoh-proj-fog-density").length).toBeGreaterThan(0);
    expect(el.style.getPropertyValue("--rhizoh-proj-metabolic").length).toBeGreaterThan(0);
    clearProjectionHintsFromHostV0(el);
    expect(el.style.getPropertyValue("--rhizoh-proj-fog-density")).toBe("");
    expect(el.style.getPropertyValue("--rhizoh-proj-metabolic")).toBe("");
  });
});
