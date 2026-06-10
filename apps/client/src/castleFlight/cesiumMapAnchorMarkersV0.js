/**
 * World map marker field — system beacons, MY CASTLE, ghost anchors, co-presence witnesses.
 */

import { getOriginSeedAnchorV0 } from "../rhizoh/runtime/memoryAnchorSystemV0.js";
import {
  readCastleNexusGeoV0,
  readUserCastleAnchorGeoV0
} from "../rhizoh/runtime/worldMapBootstrapGeoV0.js";
import {
  readLocalGhostCastleAnchorsV0,
  LOCAL_GHOST_CASTLE_EVENT_V0
} from "../rhizoh/runtime/localGhostCastleAnchorV0.js";
import {
  readWorldMapMarkerLayerStateV0,
  WORLD_MAP_MARKER_LAYER_EVENT_V0
} from "../rhizoh/runtime/worldMapMarkerLayerStateV0.js";
import { WORLD_MAP_GEO_REQUEST_EVENT_V0 } from "../rhizoh/runtime/worldMapGeoRequestV0.js";
import { CASTLE_WORLD_ANCHOR_EVENT_V0 } from "./castleWorldAnchorV0.js";
import { createCesiumMapPinCanvasV0 } from "./cesiumMapBillboardV0.js";
import { syncCastleEcosystemMarkersV0 } from "./castleEcosystemMarkersV0.js";
import {
  readActiveSpatialMemoryMapPinsV1,
  SPATIAL_MEMORY_ANCHOR_EVENT_V1
} from "../rhizoh/runtime/rhizohSpatialMemoryAnchorV1.js";

export const SERENCEBEY_CASTLE_ENTITY_ID_V0 = "castle-origin-serencebey-v0";
export const SERENCEBEY_BEACON_ENTITY_ID_V0 = "castle-origin-serencebey-beacon-v0";
export const USER_CASTLE_ENTITY_ID_V0 = "castle-user-nexus-v0";
const GHOST_ENTITY_PREFIX_V0 = "castle-ghost-local-";
const WITNESS_ENTITY_PREFIX_V0 = "castle-witness-remote-";
const SPATIAL_MEMORY_ENTITY_PREFIX_V0 = "castle-spatial-memory-";

function readRemoteWitnessesV0() {
  if (typeof window === "undefined") return [];
  const rows = window.__CASTLE_REMOTE_WITNESSES__;
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => Number.isFinite(r?.lat) && Number.isFinite(r?.lon));
}

/**
 * @param {import("cesium").Viewer} viewer
 * @param {typeof import("cesium")} Cesium
 * @returns {() => void}
 */
export function installWorldMapAnchorMarkersV0(viewer, Cesium) {
  if (!viewer || viewer.isDestroyed?.()) return () => {};

  const seed = getOriginSeedAnchorV0();
  const lat = Number(seed?.location?.lat ?? 41.0422);
  const lon = Number(seed?.location?.lon ?? 29.0089);
  const label = String(seed?.label || "Serencebey Castle");
  const castleImage = createCesiumMapPinCanvasV0({ pinType: "core_beacon", size: 58 });
  const layer = () => readWorldMapMarkerLayerStateV0();

  const removeByPrefix = (prefix) => {
    const toRemove = viewer.entities.values.filter((e) => String(e.id || "").startsWith(prefix));
    for (const ent of toRemove) {
      try {
        viewer.entities.remove(ent);
      } catch {
        /* noop */
      }
    }
  };

  const syncSystemBeaconV0 = () => {
    try {
      const existingPin = viewer.entities.getById(SERENCEBEY_CASTLE_ENTITY_ID_V0);
      if (existingPin) viewer.entities.remove(existingPin);
      const existingBeam = viewer.entities.getById(SERENCEBEY_BEACON_ENTITY_ID_V0);
      if (existingBeam) viewer.entities.remove(existingBeam);
    } catch {
      /* noop */
    }
    if (!layer().systemAnchors) return;

    viewer.entities.add({
      id: SERENCEBEY_BEACON_ENTITY_ID_V0,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      cylinder: {
        length: 120_000,
        topRadius: 0,
        bottomRadius: 1800,
        material: Cesium.Color.CYAN.withAlpha(0.22),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      },
      ellipse: {
        semiMinorAxis: 420,
        semiMajorAxis: 620,
        height: 8,
        material: Cesium.Color.CYAN.withAlpha(0.28),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });

    viewer.entities.add({
      id: SERENCEBEY_CASTLE_ENTITY_ID_V0,
      name: label,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      billboard: {
        image: castleImage,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: 1.05,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: "CORE BEACON",
        font: "bold 11px monospace",
        fillColor: Cesium.Color.fromCssColorString("#06b6d4"),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -60),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  };

  const syncUserCastleV0 = () => {
    try {
      const existing = viewer.entities.getById(USER_CASTLE_ENTITY_ID_V0);
      if (existing) viewer.entities.remove(existing);
    } catch {
      /* noop */
    }
    if (!layer().userCastle) return;

    const nexus = readCastleNexusGeoV0();
    const fallback = readUserCastleAnchorGeoV0();
    const user = nexus || fallback;
    if (!user) return;

    const color = nexus ? "#a855f7" : "#22d3ee";
    const tag = nexus ? "MY CASTLE" : String(user.label || "Kale").toUpperCase();
    const userImage = createCesiumMapPinCanvasV0({
      pinType: nexus ? "my_castle" : "user_anchor",
      color: nexus ? undefined : color,
      size: 54
    });
    viewer.entities.add({
      id: USER_CASTLE_ENTITY_ID_V0,
      name: tag,
      position: Cesium.Cartesian3.fromDegrees(user.lon, user.lat, 0),
      billboard: {
        image: userImage,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: 1.1,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: tag,
        font: "bold 11px monospace",
        fillColor: Cesium.Color.fromCssColorString(color),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -58),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  };

  const syncGhostCastlesV0 = () => {
    removeByPrefix(GHOST_ENTITY_PREFIX_V0);
    if (!layer().ghostCastles) return;
    const ghostImage = createCesiumMapPinCanvasV0({ pinType: "ghost", size: 50 });
    for (const row of readLocalGhostCastleAnchorsV0()) {
      viewer.entities.add({
        id: `${GHOST_ENTITY_PREFIX_V0}${row.id}`,
        name: row.label,
        position: Cesium.Cartesian3.fromDegrees(row.lon, row.lat, 0),
        billboard: {
          image: ghostImage,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.95,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: "GHOST CASTLE",
          font: "bold 9px monospace",
          fillColor: Cesium.Color.fromCssColorString("#94a3b8"),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cesium.Cartesian2(0, -48),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    }
  };

  const syncCoPresenceV0 = () => {
    removeByPrefix(WITNESS_ENTITY_PREFIX_V0);
    if (!layer().coPresence) return;
    const witnessImage = createCesiumMapPinCanvasV0({ pinType: "witness", size: 48 });
    for (const row of readRemoteWitnessesV0()) {
      viewer.entities.add({
        id: `${WITNESS_ENTITY_PREFIX_V0}${row.id}`,
        name: row.displayName || "Witness",
        position: Cesium.Cartesian3.fromDegrees(row.lon, row.lat, 0),
        billboard: {
          image: witnessImage,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.9,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: String(row.displayName || "WITNESS").toUpperCase().slice(0, 18),
          font: "bold 9px monospace",
          fillColor: Cesium.Color.fromCssColorString("#34d399"),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cesium.Cartesian2(0, -46),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    }
  };

  const syncSpatialMemoryBeaconsV0 = () => {
    removeByPrefix(SPATIAL_MEMORY_ENTITY_PREFIX_V0);
    if (!layer().systemAnchors) return;
    const beaconImage = createCesiumMapPinCanvasV0({ pinType: "memory_beacon", size: 44 });
    for (const row of readActiveSpatialMemoryMapPinsV1()) {
      if (!Number.isFinite(row?.lat) || !Number.isFinite(row?.lon)) continue;
      const opacity = Number(row.mapRenderToken?.opacity ?? 0.65);
      viewer.entities.add({
        id: String(row.id),
        name: row.label,
        position: Cesium.Cartesian3.fromDegrees(row.lon, row.lat, 0),
        billboard: {
          image: beaconImage,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.72 + opacity * 0.2,
          color: Cesium.Color.WHITE.withAlpha(Math.max(0.15, opacity)),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: String(row.label || "FUTURE NODE").toUpperCase().slice(0, 22),
          font: "bold 8px monospace",
          fillColor: Cesium.Color.fromCssColorString("#c4b5fd").withAlpha(opacity),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cesium.Cartesian2(0, -42),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    }
  };

  const syncEcosystemNodesV0 = () => {
    publishCastleEcosystemRegistryMirrorV0();
    syncCastleEcosystemMarkersV0(viewer, Cesium);
  };

  const syncAllV0 = () => {
    if (!viewer || viewer.isDestroyed?.()) return;
    syncSystemBeaconV0();
    syncEcosystemNodesV0();
    syncUserCastleV0();
    syncGhostCastlesV0();
    syncCoPresenceV0();
    syncSpatialMemoryBeaconsV0();
    try {
      viewer.scene.requestRender();
    } catch {
      /* noop */
    }
  };

  syncAllV0();

  const onRefresh = () => syncAllV0();
  const events = [
    LOCAL_GHOST_CASTLE_EVENT_V0,
    WORLD_MAP_MARKER_LAYER_EVENT_V0,
    WORLD_MAP_GEO_REQUEST_EVENT_V0,
    CASTLE_WORLD_ANCHOR_EVENT_V0,
    SPATIAL_MEMORY_ANCHOR_EVENT_V1,
    "castle:remote-witnesses-v0"
  ];
  for (const ev of events) {
    window.addEventListener(ev, onRefresh);
  }

  return () => {
    for (const ev of events) {
      window.removeEventListener(ev, onRefresh);
    }
    if (!viewer || viewer.isDestroyed?.()) return;
    try {
      const ids = [
        SERENCEBEY_CASTLE_ENTITY_ID_V0,
        SERENCEBEY_BEACON_ENTITY_ID_V0,
        USER_CASTLE_ENTITY_ID_V0
      ];
      for (const id of ids) {
        const ent = viewer.entities.getById(id);
        if (ent) viewer.entities.remove(ent);
      }
      removeByPrefix(GHOST_ENTITY_PREFIX_V0);
      removeByPrefix(WITNESS_ENTITY_PREFIX_V0);
    } catch {
      /* noop */
    }
  };
}
