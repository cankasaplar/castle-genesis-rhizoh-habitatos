/**
 * Cesium WGS84 pick bridge for sovereign onboarding (observation-only).
 */

import * as Cesium from "cesium";
import { enrichGeographicAnchorFromWgs84V0 } from "./dynamicSatelliteNodeSlugV0.js";
import { SOVEREIGN_NODE_STATE_V0 } from "./sovereignNodeOnboardingContractV0.js";

/** @typedef {(ev: { lat: number, lon: number, label: string, placeSlug: string }) => void} GeographicPickListenerV0 */

let activeViewer = null;
let handler = null;
let pickEnabled = false;
/** @type {Set<GeographicPickListenerV0>} */
const listenersV0 = new Set();

/**
 * @param {import('cesium').Viewer} viewer
 */
export function installCesiumSovereignGeographicPickV0(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return () => {};

  activeViewer = viewer;
  handler?.destroy?.();
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  handler.setInputAction((click) => {
    if (!pickEnabled) return;
    const ray = viewer.camera.getPickRay(click.position);
    if (!ray) return;
    const cartesian =
      viewer.scene.globe.pick(ray, viewer.scene) ||
      viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
    if (!cartesian) return;

    const carto = Cesium.Cartographic.fromCartesian(cartesian);
    const lat = Cesium.Math.toDegrees(carto.latitude);
    const lon = Cesium.Math.toDegrees(carto.longitude);
    const enriched = enrichGeographicAnchorFromWgs84V0({ lat, lon });

    const ev = {
      lat: enriched.lat,
      lon: enriched.lon,
      label: enriched.label,
      placeSlug: enriched.placeSlug
    };

    for (const fn of listenersV0) {
      try {
        fn(ev);
      } catch {
        /* listener isolation */
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  const facade = createSovereignCesiumPickFacadeV0();
  if (typeof window !== "undefined") {
    window.__rhizoh_sovereign_cesium_pick = facade;
  }

  return () => {
    listenersV0.clear();
    pickEnabled = false;
    handler?.destroy?.();
    handler = null;
    activeViewer = null;
    if (typeof window !== "undefined") {
      try {
        delete window.__rhizoh_sovereign_cesium_pick;
      } catch {
        /* noop */
      }
    }
  };
}

function createSovereignCesiumPickFacadeV0() {
  return Object.freeze({
    setInteractionMode(mode) {
      pickEnabled =
        mode === SOVEREIGN_NODE_STATE_V0.OBSERVATION_ONLY ||
        mode === SOVEREIGN_NODE_STATE_V0.EVENT_PLANE_READONLY;
    },
    /**
     * @param {string} event
     * @param {GeographicPickListenerV0} fn
     */
    on(event, fn) {
      if (event !== "click" || typeof fn !== "function") return () => {};
      listenersV0.add(fn);
      return () => listenersV0.delete(fn);
    },
    getViewer: () => activeViewer
  });
}

export function getSovereignCesiumPickFacadeV0() {
  if (typeof window !== "undefined" && window.__rhizoh_sovereign_cesium_pick) {
    return window.__rhizoh_sovereign_cesium_pick;
  }
  return null;
}
