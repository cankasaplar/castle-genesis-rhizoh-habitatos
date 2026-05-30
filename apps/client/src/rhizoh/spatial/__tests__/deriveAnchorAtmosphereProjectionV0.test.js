import { describe, it, expect } from "vitest";
import { buildWorldPresenceStateV0 } from "../../runtime/worldPresenceRuntimeV0.js";
import { getGeographicSemanticAnchorByIdV0 } from "../geographicAnchorsV0.js";
import { deriveAnchorAtmosphereProjectionV0 } from "../deriveAnchorAtmosphereProjectionV0.js";

describe("deriveAnchorAtmosphereProjectionV0", () => {
  it("returns clamped hints for null anchor", () => {
    const s = buildWorldPresenceStateV0();
    const h = deriveAnchorAtmosphereProjectionV0(/** @type {any} */ (null), s);
    expect(h.localFog).toBeGreaterThanOrEqual(0);
    expect(h.localFog).toBeLessThanOrEqual(1);
    expect(h.localAura).toBeGreaterThanOrEqual(0);
    expect(h.localAura).toBeLessThanOrEqual(1);
  });

  it("Kadıköy yields higher localAura than Sarıyer when city-wide fog is low (divergence coupling)", () => {
    const feed = {
      cloudDensity: 0.12,
      humidity: 0.35,
      rainIntensity: 0,
      wind: 0.15,
      temperature: 22,
      timestamp: Date.now()
    };
    const state = buildWorldPresenceStateV0({ weatherFeed: feed });
    const kadikoy = getGeographicSemanticAnchorByIdV0("anchor_kadikoy_divergence");
    const sariyer = getGeographicSemanticAnchorByIdV0("anchor_sariyer_stability");
    expect(kadikoy && sariyer).toBeTruthy();
    const hk = deriveAnchorAtmosphereProjectionV0(kadikoy, state);
    const hs = deriveAnchorAtmosphereProjectionV0(sariyer, state);
    expect(hk.localAura).toBeGreaterThan(hs.localAura);
  });
});
