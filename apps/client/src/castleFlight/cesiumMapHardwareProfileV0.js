/**
 * Cesium hardware profile — mobile / no-Ion → 2D light mode; desktop → tuned 3D.
 */

/**
 * @returns {boolean}
 */
export function detectCesiumLowHardwareV0() {
  if (typeof navigator === "undefined") return true;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const noIon = !String(import.meta.env.VITE_CESIUM_ION_TOKEN || "").trim();
  return mobile || noIon;
}

/**
 * @param {import("cesium").Viewer} viewer
 * @param {typeof import("cesium")} Cesium
 * @param {{ lowHardware?: boolean, force3d?: boolean }} [opts]
 * @returns {{ lowHardware: boolean, mode: "2d" | "3d" }}
 */
export function applyCesiumHardwareProfileV0(viewer, Cesium, opts = {}) {
  const lowHardware = opts.force3d ? false : (opts.lowHardware ?? detectCesiumLowHardwareV0());
  if (!viewer?.scene) return { lowHardware, mode: lowHardware ? "2d" : "3d" };

  const scene = viewer.scene;
  try {
    if (lowHardware) {
      scene.mode = Cesium.SceneMode.SCENE2D;
      scene.globe.maximumScreenSpaceError = 24;
      scene.screenSpaceCameraController.enableTilt = false;
    } else {
      scene.globe.maximumScreenSpaceError = 8;
      if ("tileCacheSize" in scene.globe) {
        scene.globe.tileCacheSize = 100;
      }
    }
  } catch {
    /* noop */
  }

  return { lowHardware, mode: lowHardware ? "2d" : "3d" };
}
