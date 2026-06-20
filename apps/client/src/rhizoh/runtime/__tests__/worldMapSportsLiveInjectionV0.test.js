import { describe, expect, it, vi } from "vitest";
import {
  ingestSportsLiveFeedV0,
  isIstanbulSportsTeamV0,
  WORLD_MAP_SPORTS_LIVE_PULSE_EVENT_V0
} from "../worldMapSportsLiveInjectionV0.js";
import { resolveSportVenueAnchorV0 } from "../worldMapLiveMatchPinsV0.js";

describe("worldMapSportsLiveInjectionV0", () => {
  it("isIstanbulSportsTeamV0 matches GS/FB/BJK names", () => {
    expect(isIstanbulSportsTeamV0("Galatasaray")).toBe(true);
    expect(isIstanbulSportsTeamV0("Fenerbahçe")).toBe(true);
    expect(isIstanbulSportsTeamV0("Besiktas")).toBe(true);
    expect(isIstanbulSportsTeamV0("Lakers")).toBe(false);
  });

  it("resolveSportVenueAnchorV0 maps Istanbul clubs to stadium coords", () => {
    const gs = resolveSportVenueAnchorV0("Galatasaray");
    const fb = resolveSportVenueAnchorV0("Fenerbahçe");
    const bjk = resolveSportVenueAnchorV0("Beşiktaş");
    expect(gs?.city).toBe("Istanbul");
    expect(fb?.city).toBe("Istanbul");
    expect(bjk?.city).toBe("Istanbul");
  });

  it("ingestSportsLiveFeedV0 publishes pulse for Istanbul live feed", async () => {
    const pulseHandler = vi.fn();
    window.addEventListener(WORLD_MAP_SPORTS_LIVE_PULSE_EVENT_V0, pulseHandler);
    const feed = Object.freeze({
      sports: Object.freeze({
        live: Object.freeze([
          Object.freeze({
            id: "m1",
            homeName: "Galatasaray",
            awayName: "Fenerbahçe",
            sport: "football"
          })
        ])
      })
    });
    const out = await ingestSportsLiveFeedV0({ feed, locale: "tr", force: true });
    window.removeEventListener(WORLD_MAP_SPORTS_LIVE_PULSE_EVENT_V0, pulseHandler);
    expect(out.ok).toBe(true);
    expect(out.liveMatchPins?.length).toBeGreaterThan(0);
    expect(pulseHandler).toHaveBeenCalled();
    expect(pulseHandler.mock.calls[0][0].detail.istanbulPulse).toBe(true);
  });
});
