/**
 * Phase 9.4.1 — Apply epistemic simulation snapshot to Cesium scene (visual only).
 * Research wire: tension → fog/atmosphere; NOT terrain provider replacement.
 */

import * as Cesium from "cesium";

/**
 * @param {import("cesium").Viewer | null | undefined} viewer
 * @param {import('../runtime/epistemicSimResearchStoreV0.js').EpistemicSimResearchSnapshotV0 | null | undefined} snap
 */
export function applyEpistemicSimToCesiumSceneV0(viewer, snap) {
  if (!viewer || !snap) return;
  if (typeof viewer.isDestroyed === "function" && viewer.isDestroyed()) return;

  const pack = typeof window !== "undefined" ? window.__CASTLE_WORLD_PROJECTION__ : null;
  const gv = String(pack?.governance || "NORMAL").toUpperCase();
  if (gv !== "NORMAL") return;

  const scene = viewer.scene;
  const globe = scene?.globe;
  if (!scene || !globe) return;

  const tension = Math.min(1, Math.max(0, Number(snap.epistemicSplitBrainScore) || 0));
  const coherence = Math.min(1, Math.max(0, Number(snap.coherenceGradient) || 1));
  const fogD = tension * 0.55 + (1 - coherence) * 0.25;
  const r = 0.45 + tension * 0.2;
  const g = 0.5 + coherence * 0.15;
  const b = 0.62 + (1 - tension) * 0.12;

  try {
    scene.fog.enabled = true;
    scene.fog.density = 1.8e-5 + fogD * 1.2e-4;
    scene.fog.color = new Cesium.Color(r, g, b, 1);
    globe.atmosphereLightIntensity = Math.min(1, 0.42 + coherence * 0.45);
    const liftM = Math.min(12, Number(snap.terrainMaxOffsetMeters) || 0) * 0.15;
    if (liftM > 0 && viewer.camera?.positionCartographic) {
      const carto = viewer.camera.positionCartographic;
      const targetH = carto.height + liftM * 0.02;
      if (Number.isFinite(targetH)) {
        carto.height = targetH;
      }
    }
  } catch {
    /* noop */
  }
}
