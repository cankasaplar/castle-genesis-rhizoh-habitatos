import { describe, expect, it } from "vitest";
import {
  buildWorldMapNewsFeedQueryStringV0,
  resolveNewsCountryFromGeoV0,
  resolveWorldMapNewsFeedQueryV0
} from "../worldMapNewsLocaleV0.js";

describe("worldMapNewsLocaleV0", () => {
  it("maps Istanbul geo to Turkey", () => {
    expect(resolveNewsCountryFromGeoV0(41.04, 29.01)).toBe("tr");
  });

  it("maps Helsinki geo to Finland", () => {
    expect(resolveNewsCountryFromGeoV0(60.17, 24.94)).toBe("fi");
  });

  it("uses locale country when user has no real GPS or castle anchor", () => {
    const q = resolveWorldMapNewsFeedQueryV0({ locale: "en" });
    expect(q.country).toBe("us");
    expect(q.language).toBe("en");
    expect(q.source).toBe("ui_locale");
  });

  it("uses real GPS region with UI language for tourists", () => {
    const prev = globalThis.window?.__CASTLE_NEXUS_GEO__;
    globalThis.window = globalThis.window || {};
    globalThis.window.__CASTLE_NEXUS_GEO__ = Object.freeze({
      lat: 41.04,
      lon: 29.01,
      source: "world_map_geo_request"
    });
    try {
      const q = resolveWorldMapNewsFeedQueryV0({ locale: "en" });
      expect(q.country).toBe("tr");
      expect(q.language).toBe("en");
      expect(q.source).toBe("user_geo");
    } finally {
      if (prev === undefined) delete globalThis.window.__CASTLE_NEXUS_GEO__;
      else globalThis.window.__CASTLE_NEXUS_GEO__ = prev;
    }
  });

  it("uses tr locale default for Turkish UI without GPS", () => {
    const q = resolveWorldMapNewsFeedQueryV0({ locale: "tr" });
    expect(q.country).toBe("tr");
    expect(q.language).toBe("tr");
    expect(q.source).toBe("ui_locale");
  });

  it("builds query string for gateway fetch", () => {
    expect(buildWorldMapNewsFeedQueryStringV0({ country: "tr", language: "tr" })).toBe(
      "?country=tr&language=tr"
    );
  });
});
