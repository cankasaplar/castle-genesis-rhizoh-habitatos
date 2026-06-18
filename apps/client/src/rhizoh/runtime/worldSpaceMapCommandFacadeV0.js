/**
 * World-space map command facade — Voice/Event → active substrate → visual feedback.
 * Closes State → Camera → Visual chain for PR 81A.
 */

import { RHIZOH_MAP_COMMAND_EVENT_V0 } from "./rhizohLocalCommandHandlersV0.js";
import { routeCesiumCommandV0 } from "../../castleFlight/cesiumCommandRouterV0.js";
import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { resolveWorldSpaceMapRecenterHomeV0 } from "./worldMapViewportBootstrapV0.js";
import { installWorldMapVisualFeedbackV0 } from "./worldMapVisualFeedbackV0.js";

export const RHIZOH_MAP_CAMERA_FEEDBACK_EVENT_V0 = "rhizoh:map-camera-feedback-v0";

/**
 * Fly active map substrate to geo.
 * @param {{ lat: number, lon: number, zoom?: number, source?: string }} geo
 */
export function dispatchWorldSpaceMapFlyV0(geo) {
  const lat = Number(geo.lat);
  const lon = Number(geo.lon);
  const zoom = Number(geo.zoom) || 14;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;

  const cesiumActive =
    typeof document !== "undefined" &&
    document.documentElement?.getAttribute?.("data-cesium-active") === "1";

  if (cesiumActive) {
    routeCesiumCommandV0({
      op: "fly_to",
      geo: { lat, lon, alt: 1200 },
      source: geo.source || "world_space_facade"
    });
  }

  const leaflet = typeof window !== "undefined" ? window.__rhizoh?.v11LeafletMap : null;
  if (leaflet) {
    try {
      leaflet.flyTo([lat, lon], zoom, { animate: true, duration: 1.8 });
    } catch {
      /* noop */
    }
  }

  emitMapCameraFeedbackV0({
    action: "fly_to",
    lat,
    lon,
    zoom,
    substrate: cesiumActive ? "cesium+leaflet" : "leaflet",
    source: geo.source || "world_space_facade"
  });
  return true;
}

/**
 * Recenter to user castle, bootstrap seed, or neutral world view (not demo Istanbul cluster).
 */
export function recenterWorldSpaceMapV0(source = "map_recenter") {
  const home = resolveWorldSpaceMapRecenterHomeV0();
  return dispatchWorldSpaceMapFlyV0({ ...home, source });
}

/**
 * @param {object} detail
 */
export function emitMapCameraFeedbackV0(detail = {}) {
  const payload = Object.freeze({
    schema: "rhizoh.map_camera_feedback.v0",
    atMs: Date.now(),
    ...detail
  });
  logCastleLifecycleV0("map_camera_feedback", payload);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(RHIZOH_MAP_CAMERA_FEEDBACK_EVENT_V0, { detail: payload }));
    } catch {
      /* noop */
    }
  }
  return payload;
}

let installedV0 = false;

/**
 * Install unified map-command listener with feedback telemetry.
 */
export function installWorldSpaceMapCommandFacadeV0() {
  if (typeof window === "undefined" || installedV0) return;
  installedV0 = true;
  installWorldMapVisualFeedbackV0();

  window.addEventListener(RHIZOH_MAP_COMMAND_EVENT_V0, (ev) => {
    const action = String(ev?.detail?.action || "");
    const canonical = String(ev?.detail?.canonical || "");
    const map = window.__rhizoh?.v11LeafletMap;
    let zoom = map?.getZoom?.() ?? null;

    if (action === "zoom_in" && map) {
      map.zoomIn();
      zoom = map.getZoom?.() ?? zoom;
    } else if (action === "zoom_out" && map) {
      map.zoomOut();
      zoom = map.getZoom?.() ?? zoom;
    } else if (action === "center" || canonical === "map_center") {
      recenterWorldSpaceMapV0(canonical || "map_center");
      zoom = map?.getZoom?.() ?? zoom;
    }

    const cesiumActive = document.documentElement?.getAttribute?.("data-cesium-active") === "1";
    if (cesiumActive && (action === "zoom_in" || action === "zoom_out")) {
      routeCesiumCommandV0({
        op: action === "zoom_in" ? "zoom_in" : "zoom_out",
        source: "world_space_facade",
        canonical
      });
    }

    emitMapCameraFeedbackV0({
      action,
      canonical,
      zoom,
      center: map?.getCenter?.()
        ? { lat: map.getCenter().lat, lon: map.getCenter().lng }
        : null,
      substrate: cesiumActive ? "cesium+leaflet" : "leaflet"
    });
  });
}
