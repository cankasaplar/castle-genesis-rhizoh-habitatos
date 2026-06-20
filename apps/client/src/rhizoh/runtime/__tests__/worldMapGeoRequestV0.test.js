import { describe, expect, it, beforeEach } from "vitest";
import {
  persistWorldMapPickOriginV0,
  WORLD_MAP_GEO_REQUEST_EVENT_V0
} from "../worldMapGeoRequestV0.js";
import { readCastleNexusGeoV0 } from "../worldMapBootstrapGeoV0.js";

describe("worldMapGeoRequestV0", () => {
  beforeEach(() => {
    window.__CASTLE_NEXUS_GEO__ = undefined;
    window.__CASTLE_CLIENT_CASTLE_STATE__ = undefined;
    window.localStorage.clear();
  });

  it("persistWorldMapPickOriginV0 writes nexus geo and dispatches geo request event", () => {
    let eventDetail = null;
    const onGeo = (e) => {
      eventDetail = e.detail;
    };
    window.addEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);

    const out = persistWorldMapPickOriginV0(41.042, 29.008, { source: "test_map_pick" });

    window.removeEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);

    expect(out.ok).toBe(true);
    expect(out.lat).toBe(41.042);
    expect(out.lon).toBe(29.008);
    expect(readCastleNexusGeoV0()?.lat).toBe(41.042);
    expect(readCastleNexusGeoV0()?.source).toBe("test_map_pick");
    expect(window.__CASTLE_CLIENT_CASTLE_STATE__).toBe("ACTIVE");
    expect(eventDetail?.ok).toBe(true);
    expect(eventDetail?.source).toBe("test_map_pick");
  });

  it("persistWorldMapPickOriginV0 rejects invalid coordinates", () => {
    const out = persistWorldMapPickOriginV0(NaN, 29);
    expect(out.ok).toBe(false);
    expect(readCastleNexusGeoV0()).toBeNull();
  });
});
