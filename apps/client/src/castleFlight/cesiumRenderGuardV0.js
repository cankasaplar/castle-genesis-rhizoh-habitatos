/**
 * Cesium render stability guards — invalid camera / canvas and OSM 3D tile PVS blow-ups.
 * @see cesiumSceneBudget.js
 */

/** @param {import("cesium").Cartesian3 | undefined | null} c */
export function isFiniteCartesian3V0(c) {
  if (!c) return false;
  return Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.z);
}

/**
 * @param {import("cesium").Viewer | null | undefined} viewer
 * @param {{ minW?: number, minH?: number }} [opts]
 */
export function isCesiumCanvasRenderableV0(viewer, opts = {}) {
  const minW = opts.minW ?? 8;
  const minH = opts.minH ?? 8;
  try {
    const canvas = viewer?.canvas;
    if (!canvas) return false;
    const w = canvas.clientWidth || canvas.width || 0;
    const h = canvas.clientHeight || canvas.height || 0;
    return w >= minW && h >= minH;
  } catch {
    return false;
  }
}

/**
 * Bozuk kamera (NaN / sıfır vektör) PVS içinde Invalid array length üretebilir.
 *
 * @param {import("cesium").Viewer} viewer
 * @param {typeof import("cesium")} Cesium
 * @param {{ lon: number, lat: number, height?: number, headingDeg?: number, pitchDeg?: number }} anchor
 * @returns {boolean} true if camera was reset
 */
export function sanitizeCesiumCameraV0(viewer, Cesium, anchor) {
  if (!viewer?.camera) return false;
  let bad = false;
  try {
    const pos = viewer.camera.positionWC;
    if (!isFiniteCartesian3V0(pos)) bad = true;
    const dir = viewer.camera.directionWC;
    const up = viewer.camera.upWC;
    if (!isFiniteCartesian3V0(dir) || !isFiniteCartesian3V0(up)) bad = true;
    if (!bad && Cesium.Cartesian3.magnitude(dir) < 1e-6) bad = true;
  } catch {
    bad = true;
  }
  if (!bad) return false;

  const lon = Number(anchor?.lon);
  const lat = Number(anchor?.lat);
  const height = Number.isFinite(Number(anchor?.height)) ? Number(anchor.height) : 5200;
  try {
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        Number.isFinite(lon) ? lon : 28.9784,
        Number.isFinite(lat) ? lat : 41.0082,
        Math.max(200, Math.min(50_000_000, height))
      ),
      orientation: {
        heading: Cesium.Math.toRadians(Number(anchor?.headingDeg) || 18),
        pitch: Cesium.Math.toRadians(Number(anchor?.pitchDeg) ?? -35),
        roll: 0
      }
    });
  } catch {
    return false;
  }
  return true;
}

/**
 * Ion OSM Buildings — düşük detay / bellek tavanı (createPotentiallyVisibleSet taşmasını azaltır).
 *
 * @param {import("cesium").Cesium3DTileset | null | undefined} tileset
 */
export function configureOsmBuildingsTilesetV0(tileset) {
  if (!tileset) return;
  try {
    tileset.maximumScreenSpaceError = Math.max(tileset.maximumScreenSpaceError ?? 16, 28);
  } catch {
    /* noop */
  }
  try {
    tileset.dynamicScreenSpaceError = true;
  } catch {
    /* noop */
  }
  try {
    tileset.cullRequestsWhileMoving = true;
  } catch {
    /* noop */
  }
  try {
    tileset.cullWithChildrenBounds = true;
  } catch {
    /* noop */
  }
  try {
    if (typeof tileset.maximumMemoryUsage === "number" || tileset.maximumMemoryUsage == null) {
      tileset.maximumMemoryUsage = 384;
    }
  } catch {
    /* noop */
  }
  try {
    tileset.preloadWhenHidden = false;
  } catch {
    /* noop */
  }
  try {
    tileset.preloadFlightDestinations = false;
  } catch {
    /* noop */
  }
}

/**
 * @param {import("cesium").Viewer} viewer
 * @param {import("cesium").Cesium3DTileset | null} tilesetRef
 */
/**
 * Cesium PVS / createPotentiallyVisibleSet — Invalid array length.
 * @param {unknown} error
 */
export function isCesiumPvsRangeErrorV0(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  return msg.includes("invalid array length") || msg.includes("potentiallyvisible");
}

/**
 * Güvenli mod: globe dışı tüm primitives kaldırılır (tileset / custom primitive yükü).
 *
 * @param {import("cesium").Viewer | null | undefined} viewer
 * @returns {number} removed count
 */
export function pruneCesiumScenePrimitivesForSafeRenderV0(viewer) {
  if (!viewer?.scene?.primitives) return 0;
  let removed = 0;
  const prims = viewer.scene.primitives;
  try {
    for (let i = prims.length - 1; i >= 0; i--) {
      const p = prims.get(i);
      const name = p?.constructor?.name || "";
      if (name === "Globe" || name === "SkyBox" || name === "Sun" || name === "Moon") continue;
      try {
        prims.remove(p);
        removed += 1;
        if (typeof p?.isDestroyed === "function" && !p.isDestroyed()) {
          p.destroy();
        }
      } catch {
        /* noop */
      }
    }
  } catch {
    /* noop */
  }
  return removed;
}

/**
 * @param {import("cesium").Viewer | null | undefined} viewer
 */
export function stopCesiumDefaultRenderLoopV0(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return;
  try {
    viewer.useDefaultRenderLoop = false;
  } catch {
    /* noop */
  }
}

/**
 * @param {import("cesium").Viewer | null | undefined} viewer
 */
export function startCesiumDefaultRenderLoopV0(viewer) {
  if (!viewer || viewer.isDestroyed?.()) return;
  try {
    viewer.useDefaultRenderLoop = true;
    viewer.scene?.requestRender?.();
  } catch {
    /* noop */
  }
}

export function removeOsmBuildingsTilesetV0(viewer, tilesetRef) {
  const tileset = tilesetRef;
  if (!tileset) return;
  try {
    if (viewer?.scene?.primitives?.contains?.(tileset)) {
      viewer.scene.primitives.remove(tileset);
    }
  } catch {
    /* noop */
  }
  try {
    if (typeof tileset.isDestroyed === "function" && !tileset.isDestroyed()) {
      tileset.destroy();
    }
  } catch {
    /* noop */
  }
}
