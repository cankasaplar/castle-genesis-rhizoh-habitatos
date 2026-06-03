/**
 * SCR citizen visual projection — swarm / collective field from T0 only (B3).
 * Replaces visualCognitionState for temporal visuals.
 */

import { readCitizenProjectionV0, assertReverseOwnershipV0 } from "./rhizohSurfaceCitizenshipRuntimeV0.js";
import { RSBL_SURFACE_ID_V0 } from "./rhizohSurfaceBindingLayerV0.js";
import { SSL_SURFACE_ID_V0 } from "./rhizohSurfaceSingularityLayerV0.js";

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * @param {ReturnType<typeof readCitizenProjectionV0>} [projection]
 */
export function deriveScrCollectiveFieldV0(projection = null) {
  const p = projection || readCitizenProjectionV0(RSBL_SURFACE_ID_V0.SWARM);
  const breathe01 = clamp01(p?.breathe01);
  const intensity01 = clamp01(p?.intensity01 ?? 0.65);
  const pulse01 = clamp01(p?.pulse01);
  const density = clamp01(
    p?.collective_density ?? breathe01 * 0.45 + intensity01 * 0.45 + pulse01 * 0.1
  );

  return Object.freeze({
    density,
    heat: clamp01(intensity01 * 0.88 + pulse01 * 0.2),
    threads: clamp01(0.22 + density * 0.58),
    flowActive: pulse01 > 0.05 || density > 0.42,
    breathMs: Math.round(2600 + (1 - density) * 2600),
    masterNowMs: p?.masterNowMs ?? null,
    coherence_id: p?.coherence_id ?? null
  });
}

/**
 * @param {ReturnType<typeof readCitizenProjectionV0>} [projection]
 */
export function deriveScrSwarmFieldV0(projection = null) {
  const collective = deriveScrCollectiveFieldV0(projection);
  const intensity = collective.density;
  const level = intensity > 0.66 ? "high" : intensity > 0.33 ? "medium" : "low";
  const palette = level === "high" ? "orange-red" : level === "medium" ? "neon-cyan" : "cool-blue";
  return Object.freeze({
    intensity,
    level,
    palette,
    pulseWave: "sin",
    directionalFlow: collective.flowActive
  });
}

export function readScrCitizenCollectiveDensityV0() {
  return deriveScrCollectiveFieldV0().density;
}

/**
 * @param {number | null | undefined} externalDensity
 */
export function assertScrCollectiveDensityOwnershipV0(externalDensity) {
  if (externalDensity != null && Number.isFinite(Number(externalDensity))) {
    return assertReverseOwnershipV0(RSBL_SURFACE_ID_V0.SWARM, {
      externalPulse: Number(externalDensity)
    });
  }
  return null;
}

export function readStudioCitizenProjectionV0() {
  return (
    readCitizenProjectionV0(RSBL_SURFACE_ID_V0.STUDIO_PANEL) ||
    readCitizenProjectionV0(SSL_SURFACE_ID_V0.STUDIO)
  );
}
