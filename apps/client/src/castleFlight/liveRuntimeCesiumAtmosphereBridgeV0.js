import * as Cesium from "cesium";

/**
 * Live runtime → Cesium atmosphere bridge (v0).
 *
 * Mutates the viewer **only** from the live-orchestrator tick path; register **one** consumer per
 * viewer lifecycle and unregister on teardown to avoid double-apply / races.
 *
 * Applies hints only when `__CASTLE_WORLD_PROJECTION__.governance` is **NORMAL**
 * (`cesiumWorldProjectionBind.js` — FROZEN / RECOVERY / DEGRADED own atmosphere).
 *
 * @see liveRuntimeTemporalLockV0.js — drift / missed-frame / lag metrics (next expansion boundary).
 *
 * @param {import("cesium").Viewer | null | undefined} viewer
 * @param {import("../rhizoh/runtime/sceneProjectionAdapterV0.js").ProjectionHintsV0 | null | undefined} hints
 */
export function applyLiveRuntimeProjectionHintsToCesiumSceneV0(viewer, hints) {
  if (!viewer) return;
  if (typeof viewer.isDestroyed === "function" && viewer.isDestroyed()) return;
  if (!hints) return;
  const pack = typeof window !== "undefined" ? window.__CASTLE_WORLD_PROJECTION__ : null;
  const gv = String(pack?.governance || "NORMAL").toUpperCase();
  if (gv !== "NORMAL") return;

  const scene = viewer.scene;
  const globe = scene.globe;
  if (!scene || !globe) return;

  const fogD = Math.min(1, Math.max(0, Number(hints.fogDensity) || 0));
  const tint = hints.ambientTint && typeof hints.ambientTint === "object" ? hints.ambientTint : { r: 0.52, g: 0.58, b: 0.68 };
  const r = Math.min(1, Math.max(0, Number(tint.r) || 0.5));
  const g = Math.min(1, Math.max(0, Number(tint.g) || 0.55));
  const b = Math.min(1, Math.max(0, Number(tint.b) || 0.65));

  try {
    scene.fog.enabled = true;
    scene.fog.density = 2.0e-5 + fogD * 1.05e-4;
    scene.fog.color = new Cesium.Color(r, g, b, 1);
    globe.atmosphereLightIntensity = Math.min(1, 0.48 + (1 - fogD) * 0.42);
  } catch {
    /* noop */
  }
}
