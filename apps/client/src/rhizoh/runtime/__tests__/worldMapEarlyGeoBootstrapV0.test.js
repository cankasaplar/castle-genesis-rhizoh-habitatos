import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  requestEarlyWorldMapGeoBootstrapV0,
  shouldAttemptEarlyWorldMapGeoV0
} from "../worldMapEarlyGeoBootstrapV0.js";
import { readCastleNexusGeoV0 } from "../worldMapBootstrapGeoV0.js";
import { WORLD_MAP_GEO_REQUEST_EVENT_V0 } from "../worldMapGeoRequestV0.js";

describe("worldMapEarlyGeoBootstrapV0", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.__CASTLE_NEXUS_GEO__ = undefined;
    window.__CASTLE_CLIENT_CASTLE_STATE__ = undefined;
    window.localStorage.clear();
  });

  it("shouldAttemptEarlyWorldMapGeoV0 is true until first attempt", async () => {
    expect(shouldAttemptEarlyWorldMapGeoV0()).toBe(true);
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (ok) => ok({ coords: { latitude: 40.7, longitude: -74.0 } })
      }
    });
    const out = await requestEarlyWorldMapGeoBootstrapV0({ source: "test" });
    expect(out.ok).toBe(true);
    expect(shouldAttemptEarlyWorldMapGeoV0()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("sets nexus geo without castle anchor or ACTIVE client state", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (ok) => ok({ coords: { latitude: 40.7128, longitude: -74.006 } })
      }
    });

    let eventDetail = null;
    const onGeo = (e) => {
      eventDetail = e.detail;
    };
    window.addEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);

    const out = await requestEarlyWorldMapGeoBootstrapV0({ source: "test_early" });

    window.removeEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);

    expect(out.ok).toBe(true);
    expect(readCastleNexusGeoV0()?.lat).toBeCloseTo(40.7128, 3);
    expect(readCastleNexusGeoV0()?.source).toBe("test_early");
    expect(window.__CASTLE_CLIENT_CASTLE_STATE__).toBeUndefined();
    expect(window.localStorage.getItem("rhizoh.continuity.v1")).toBeNull();
    expect(eventDetail?.ok).toBe(true);
    vi.unstubAllGlobals();
  });

  it("marks attempt on deny without writing nexus geo", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (_ok, fail) => fail({ code: 1, message: "denied" })
      }
    });

    const out = await requestEarlyWorldMapGeoBootstrapV0({ source: "test_deny" });
    expect(out.ok).toBe(false);
    expect(out.code).toBe("geo_denied");
    expect(readCastleNexusGeoV0()).toBeNull();
    expect(shouldAttemptEarlyWorldMapGeoV0()).toBe(false);
    vi.unstubAllGlobals();
  });
});
