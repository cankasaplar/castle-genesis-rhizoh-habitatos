/**
 * OSM 3D buildings — T0 cyber glass styling.
 */

/**
 * @param {import("cesium").Cesium3DTileset | null | undefined} tileset
 * @param {typeof import("cesium")} Cesium
 * @param {{ neon?: boolean }} [opts]
 */
export function applyOsmBuildingsVisualStyleV0(tileset, Cesium, opts = {}) {
  if (!tileset || tileset.isDestroyed?.()) return;
  const neon = opts.neon !== false;
  try {
    tileset.style = new Cesium.Cesium3DTileStyle({
      color: neon ? "color('rgba(0, 150, 255, 0.42)')" : "color('white', 0.88)",
      show: true
    });
  } catch {
    /* noop */
  }
}
