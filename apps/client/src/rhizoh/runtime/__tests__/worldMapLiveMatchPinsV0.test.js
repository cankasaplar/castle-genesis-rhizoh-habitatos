import { describe, expect, it } from "vitest";
import {
  buildLiveMatchMapPinsV0,
  resolveSportVenueAnchorV0,
  tryShowLiveMatchPinsFromTextV0
} from "../worldMapLiveMatchPinsV0.js";

describe("worldMapLiveMatchPinsV0", () => {
  it("resolves known venue anchors", () => {
    const anchor = resolveSportVenueAnchorV0("Los Angeles Lakers");
    expect(anchor?.city).toBe("Los Angeles");
  });

  it("builds pins for live matches with anchors", () => {
    const pins = buildLiveMatchMapPinsV0({
      sports: {
        live: [
          {
            id: "basketball:1",
            sport: "basketball",
            phase: "live",
            homeName: "Boston Celtics",
            awayName: "Miami Heat",
            homeScore: 88,
            awayScore: 82,
            league: "NBA"
          }
        ]
      }
    });
    expect(pins.length).toBe(1);
    expect(pins[0].type).toBe("broadcast");
  });

  it("builds pins for international football live matches", () => {
    const pins = buildLiveMatchMapPinsV0({
      sports: {
        live: [
          {
            id: "football:wc1",
            sport: "football",
            phase: "live",
            homeName: "Morocco",
            awayName: "Haiti",
            homeScore: 0,
            awayScore: 1,
            league: "WC"
          },
          {
            id: "football:wc2",
            sport: "football",
            phase: "live",
            homeName: "Scotland",
            awayName: "Brazil",
            homeScore: 0,
            awayScore: 2,
            league: "WC"
          }
        ]
      }
    });
    expect(pins.length).toBe(2);
    expect(pins[0].owner).toBeTruthy();
  });

  it("voice command triggers live pin publish", () => {
    const out = tryShowLiveMatchPinsFromTextV0("rhizoh canlı maç pinlerini göster", { locale: "tr" });
    expect(out?.kind).toBe("LIVE_MATCH_PINS");
  });
});
