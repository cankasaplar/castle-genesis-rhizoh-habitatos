/**
 * Pet → Cesium spatial binding v0.
 * Pet makes world spatially inhabited — SCR/RSBL projection drives entity (non-authoring).
 * @see docs/RHIZOH_PET_SPATIAL_BINDING_V0.md
 */

import * as Cesium from "cesium";
import { readPetCitizenV0, RHIZOH_PET_CITIZEN_EVENT_V0 } from "../runtime/rhizohPetCitizenRuntimeV0.js";
import { readCesiumCitizenProjectionV0 } from "../runtime/rhizohSurfaceCitizenshipRuntimeV0.js";
import { RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0 } from "../runtime/rhizohSurfaceCitizenshipRuntimeV0.js";
import {
  buildPetSpatialBindingSnapshotV0,
  rcalXYToCartographicV0
} from "./rhizohPetSpatialGeoV0.js";
import {
  CASTLE_PWE_EVENT_V0,
  readCastlePweCartographicV0,
  readCastlePweV0
} from "../../castleFlight/castlePersistentWorldEntityV0.js";
import {
  COMPANION_OBS_PRESENCE_EVENT_V0,
  isCompanionObservableV0
} from "../../castleFlight/castleCompanionObservationPresenceV0.js";

export const PET_CESIUM_ENTITY_ID_V0 = "rhizoh-pet-citizen-v0";

export const RHIZOH_PET_SPATIAL_BINDING_EVENT_V0 = "rhizoh:pet-spatial-binding-v0";

/** @type {import("cesium").Viewer | null} */
let boundViewer = null;

/** @type {import("cesium").Entity | null} */
let petEntity = null;

/** @type {(() => void) | null} */
let onPetHandler = null;

/** @type {(() => void) | null} */
let onScrHandler = null;

function readPetForSpatialV0() {
  return readPetCitizenV0();
}

function readPetCartographicForCesiumV0(citizen) {
  const pweCarto = readCastlePweCartographicV0();
  if (pweCarto) return pweCarto;
  if (!citizen?.inhabited || !citizen.position) return null;
  return rcalXYToCartographicV0(citizen.position.x, citizen.position.y, citizen);
}

function shouldBindPetToCesiumV0(citizen) {
  const pwe = readCastlePweV0();
  if (pwe?.mounted && pwe.lifecycle === "always_mounted") {
    if (isCompanionObservableV0() && readCastlePweCartographicV0()) return true;
    if (!pwe.presence && readCastlePweCartographicV0()) return true;
  }
  return Boolean(citizen?.inhabited);
}

function publishPetSpatialBindingV0(snap) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.petSpatialBinding = snap;
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_PET_SPATIAL_BINDING_EVENT_V0, {
        detail: Object.freeze({ binding: snap })
      })
    );
  } catch {
    /* noop */
  }
}

function removePetEntityV0(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return;
  try {
    const existing = viewer.entities.getById(PET_CESIUM_ENTITY_ID_V0);
    if (existing) viewer.entities.remove(existing);
  } catch {
    /* noop */
  }
  petEntity = null;
}

function ensurePetEntityV0(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return null;
  const existing = viewer.entities.getById(PET_CESIUM_ENTITY_ID_V0);
  if (existing) {
    petEntity = existing;
    return petEntity;
  }

  petEntity = viewer.entities.add({
    id: PET_CESIUM_ENTITY_ID_V0,
    position: new Cesium.CallbackProperty((time, result) => {
      void time;
      const citizen = readPetForSpatialV0();
      const carto = readPetCartographicForCesiumV0(citizen);
      if (!carto) return undefined;
      return Cesium.Cartesian3.fromDegrees(carto.lon, carto.lat, carto.heightM, undefined, result);
    }, false),
    point: {
      pixelSize: new Cesium.CallbackProperty(() => {
        const citizen = readPetForSpatialV0();
        const proj = readCesiumCitizenProjectionV0();
        const intensity = citizen?.intensity01 ?? proj?.intensity01 ?? 0.65;
        const breathe = citizen?.breathe01 ?? proj?.breathe01 ?? 0;
        return 9 + intensity * 7 + breathe * 4;
      }, false),
      color: new Cesium.CallbackProperty(() => {
        const proj = readCesiumCitizenProjectionV0();
        const a = 0.55 + (proj?.intensity01 ?? 0.65) * 0.35;
        return Cesium.Color.CYAN.withAlpha(a);
      }, false),
      outlineColor: Cesium.Color.WHITE.withAlpha(0.85),
      outlineWidth: 1
    },
    label: {
      text: "Rhizoh",
      font: "10px sans-serif",
      fillColor: Cesium.Color.CYAN.withAlpha(0.85),
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      pixelOffset: new Cesium.Cartesian2(0, -18),
      show: true
    }
  });
  return petEntity;
}

/**
 * Sync spatial binding from current pet citizen (SCR-driven).
 * @param {import("cesium").Viewer | null | undefined} [viewer]
 */
export function syncPetSpatialBindingToCesiumV0(viewer = boundViewer) {
  const v = viewer || boundViewer;
  const citizen = readPetForSpatialV0();
  const pweCarto = readCastlePweCartographicV0();
  const snap = pweCarto
    ? Object.freeze({
        ...buildPetSpatialBindingSnapshotV0(citizen),
        bound: true,
        cartographic: Object.freeze({
          schema: "castle.rhizoh.pet_spatial_geo.v0",
          lat: pweCarto.lat,
          lon: pweCarto.lon,
          heightM: pweCarto.heightM,
          world_projection: false,
          pwe_source: pweCarto.source
        })
      })
    : buildPetSpatialBindingSnapshotV0(citizen);

  if (!v || v.isDestroyed?.() || !shouldBindPetToCesiumV0(citizen)) {
    if (v && !v.isDestroyed?.()) removePetEntityV0(v);
    publishPetSpatialBindingV0(
      Object.freeze({ ...snap, cesium_bound: false, entity_id: PET_CESIUM_ENTITY_ID_V0 })
    );
    return snap;
  }

  ensurePetEntityV0(v);
  const carto = snap.cartographic;
  publishPetSpatialBindingV0(
    Object.freeze({
      ...snap,
      cesium_bound: true,
      entity_id: PET_CESIUM_ENTITY_ID_V0,
      cartographic: carto
    })
  );
  try {
    v.scene.requestRender();
  } catch {
    /* noop */
  }
  return snap;
}

/**
 * @param {import("cesium").Viewer} viewer
 * @returns {() => void}
 */
export function installRhizohPetCesiumSpatialBindingV0(viewer) {
  if (!viewer) return () => {};

  boundViewer = viewer;
  removePetEntityV0(viewer);
  syncPetSpatialBindingToCesiumV0(viewer);

  onPetHandler = () => syncPetSpatialBindingToCesiumV0(viewer);
  onScrHandler = () => syncPetSpatialBindingToCesiumV0(viewer);

  const onPweHandler = () => syncPetSpatialBindingToCesiumV0(viewer);

  if (typeof window !== "undefined") {
    window.addEventListener(RHIZOH_PET_CITIZEN_EVENT_V0, onPetHandler);
    window.addEventListener(RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0, onScrHandler);
    window.addEventListener(CASTLE_PWE_EVENT_V0, onPweHandler);
    window.addEventListener(COMPANION_OBS_PRESENCE_EVENT_V0, onPweHandler);
  }

  return () => {
    if (typeof window !== "undefined") {
      if (onPetHandler) window.removeEventListener(RHIZOH_PET_CITIZEN_EVENT_V0, onPetHandler);
      if (onScrHandler) window.removeEventListener(RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0, onScrHandler);
      window.removeEventListener(CASTLE_PWE_EVENT_V0, onPweHandler);
      window.removeEventListener(COMPANION_OBS_PRESENCE_EVENT_V0, onPweHandler);
    }
    onPetHandler = null;
    onScrHandler = null;
    removePetEntityV0(viewer);
    boundViewer = null;
    publishPetSpatialBindingV0(
      Object.freeze({
        schema: "castle.rhizoh.pet_spatial_geo.v0",
        bound: false,
        cesium_bound: false,
        cartographic: null
      })
    );
  };
}

export function maybeInstallRhizohPetCesiumSpatialBindingV0(viewer) {
  try {
    return installRhizohPetCesiumSpatialBindingV0(viewer);
  } catch {
    return () => {};
  }
}

export function resetRhizohPetCesiumSpatialBindingForTestV0() {
  boundViewer = null;
  petEntity = null;
  onPetHandler = null;
  onScrHandler = null;
}
