/**
 * Castle ecosystem nodes — GPU-safe Cesium point + label markers with distance scaling.
 */

import { listCastleEcosystemNodesV0 } from "./castleEcosystemRegistryV0.js";
import { readWorldMapMarkerLayerStateV0 } from "../rhizoh/runtime/worldMapMarkerLayerStateV0.js";
import { createCesiumMapPinCanvasV0 } from "./cesiumMapBillboardV0.js";
import { resolvePinTypeForEcosystemCategoryV0 } from "./cesiumMapPinCatalogV0.js";

export const CASTLE_ECOSYSTEM_ENTITY_PREFIX_V0 = "castle-ecosystem-";

/**
 * @param {import("cesium").Viewer} viewer
 * @param {typeof import("cesium")} Cesium
 */
export function syncCastleEcosystemMarkersV0(viewer, Cesium) {
  if (!viewer || viewer.isDestroyed?.()) return;

  const toRemove = viewer.entities.values.filter((e) =>
    String(e.id || "").startsWith(CASTLE_ECOSYSTEM_ENTITY_PREFIX_V0)
  );
  for (const ent of toRemove) {
    try {
      viewer.entities.remove(ent);
    } catch {
      /* noop */
    }
  }

  if (!readWorldMapMarkerLayerStateV0().ecosystemNodes) return;

  for (const node of listCastleEcosystemNodesV0()) {
    const pinType = resolvePinTypeForEcosystemCategoryV0(node.category);
    const color = String(node.color || "#06b6d4");
    const pinImage = createCesiumMapPinCanvasV0({
      pinType,
      color,
      size: 46
    });
    viewer.entities.add({
      id: `${CASTLE_ECOSYSTEM_ENTITY_PREFIX_V0}${node.id}`,
      name: node.name,
      position: Cesium.Cartesian3.fromDegrees(
        node.coordinates.longitude,
        node.coordinates.latitude,
        node.coordinates.height
      ),
      billboard: {
        image: pinImage,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: 0.92,
        scaleByDistance: new Cesium.NearFarScalar(600, 1.2, 2_000_000, 0.38),
        translucencyByDistance: new Cesium.NearFarScalar(800, 1.0, 18_500_000, 0.5),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: `// ${String(node.name).toUpperCase()}`,
        font: "bold 10px monospace",
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.fromCssColorString(color),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -52),
        translucencyByDistance: new Cesium.NearFarScalar(900, 1.0, 12_000, 0.0),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      description: node.description
    });
  }
}

/**
 * @param {import("cesium").Viewer} viewer
 * @param {typeof import("cesium")} Cesium
 * @returns {() => void}
 */
export function installCastleEcosystemMarkersV0(viewer, Cesium) {
  syncCastleEcosystemMarkersV0(viewer, Cesium);
  return () => {
    if (!viewer || viewer.isDestroyed?.()) return;
    const toRemove = viewer.entities.values.filter((e) =>
      String(e.id || "").startsWith(CASTLE_ECOSYSTEM_ENTITY_PREFIX_V0)
    );
    for (const ent of toRemove) {
      try {
        viewer.entities.remove(ent);
      } catch {
        /* noop */
      }
    }
  };
}
