import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  RHIZOH_MAP_CAMERA_FEEDBACK_EVENT_V0,
  dispatchWorldSpaceMapFlyV0,
  emitMapCameraFeedbackV0,
  installWorldSpaceMapCommandFacadeV0,
  recenterWorldSpaceMapV0
} from "../worldSpaceMapCommandFacadeV0.js";
import { RHIZOH_WORLD_SPACE_NEUTRAL_VIEW_V0 } from "../worldMapViewportBootstrapV0.js";
import { RHIZOH_MAP_COMMAND_EVENT_V0 } from "../rhizohLocalCommandHandlersV0.js";

describe("worldSpaceMapCommandFacadeV0", () => {
  beforeEach(() => {
    window.__rhizoh = {
      v11LeafletMap: {
        flyTo: vi.fn(),
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        getZoom: vi.fn(() => 12),
        getCenter: vi.fn(() => ({ lat: 41.01, lng: 28.97 }))
      }
    };
    document.documentElement.removeAttribute("data-cesium-active");
  });

  it("dispatches flyTo and emits camera feedback", () => {
    const events = [];
    window.addEventListener(RHIZOH_MAP_CAMERA_FEEDBACK_EVENT_V0, (ev) => events.push(ev.detail));

    expect(
      dispatchWorldSpaceMapFlyV0({ lat: 41.01, lon: 28.97, zoom: 14, source: "test" })
    ).toBe(true);
    expect(window.__rhizoh.v11LeafletMap.flyTo).toHaveBeenCalled();
    expect(events[0]).toEqual(
      expect.objectContaining({
        action: "fly_to",
        lat: 41.01,
        lon: 28.97,
        substrate: "leaflet"
      })
    );
  });

  it("routes map zoom commands through facade with feedback", () => {
    installWorldSpaceMapCommandFacadeV0();
    const events = [];
    window.addEventListener(RHIZOH_MAP_CAMERA_FEEDBACK_EVENT_V0, (ev) => events.push(ev.detail));

    window.dispatchEvent(
      new CustomEvent(RHIZOH_MAP_COMMAND_EVENT_V0, {
        detail: { action: "zoom_out", canonical: "map_zoom_out" }
      })
    );

    expect(window.__rhizoh.v11LeafletMap.zoomOut).toHaveBeenCalled();
    expect(events.at(-1)).toEqual(
      expect.objectContaining({ action: "zoom_out", canonical: "map_zoom_out" })
    );
  });

  it("emitMapCameraFeedbackV0 returns frozen payload", () => {
    const payload = emitMapCameraFeedbackV0({ action: "test" });
    expect(payload.schema).toBe("rhizoh.map_camera_feedback.v0");
    expect(() => {
      payload.action = "mutate";
    }).toThrow();
  });

  it("recenters to neutral world view without user castle (no Istanbul cluster)", () => {
    recenterWorldSpaceMapV0("map_center");
    expect(window.__rhizoh.v11LeafletMap.flyTo).toHaveBeenCalledWith(
      [RHIZOH_WORLD_SPACE_NEUTRAL_VIEW_V0.lat, RHIZOH_WORLD_SPACE_NEUTRAL_VIEW_V0.lon],
      RHIZOH_WORLD_SPACE_NEUTRAL_VIEW_V0.zoom,
      expect.any(Object)
    );
  });
});
