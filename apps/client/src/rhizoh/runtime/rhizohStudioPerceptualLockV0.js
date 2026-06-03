/**
 * Studio Perceptual Lock v0 — studio surfaces must not fork SCR coherence.
 * @see docs/RHIZOH_STUDIO_PERCEPTUAL_LOCK_V0.md
 */

import { readStudioProductionOrganismV0 } from "./rhizohStudioProductionOrganismV0.js";
import { readStudioCastleMappingV0 } from "./rhizohStudioCastleMappingV0.js";
import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { readCitizenProjectionV0 } from "./rhizohSurfaceCitizenshipRuntimeV0.js";
import { SSL_SURFACE_ID_V0 } from "./rhizohSurfaceSingularityLayerV0.js";
import { RSBL_SURFACE_ID_V0 } from "./rhizohSurfaceBindingLayerV0.js";

export const STUDIO_PERCEPTUAL_LOCK_SCHEMA_V0 = "castle.rhizoh.studio_perceptual_lock.v0";

export const RHIZOH_STUDIO_PERCEPTUAL_LOCK_EVENT_V0 = "rhizoh:studio-perceptual-lock-v0";

/** @type {ReturnType<typeof evaluateStudioPerceptualLockV0> | null} */
let lastLockReport = null;

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

/**
 * @param {object} [ctx]
 */
export function evaluateStudioPerceptualLockV0(ctx = {}) {
  const rh = readRhizohV0();
  const frame = ctx.frame ?? rh.presenceFrame ?? readLastT0PresenceFrameV0();
  const organism = ctx.organism ?? readStudioProductionOrganismV0();
  const mapping = ctx.mapping ?? readStudioCastleMappingV0();

  const scrCoherence = frame?.coherenceId || organism?.coherence_id || "none";

  const surfaces = Object.freeze([
    { id: SSL_SURFACE_ID_V0.STUDIO, projection: readCitizenProjectionV0(SSL_SURFACE_ID_V0.STUDIO) },
    { id: SSL_SURFACE_ID_V0.UI_DRAWER, projection: readCitizenProjectionV0(SSL_SURFACE_ID_V0.UI_DRAWER) },
    { id: RSBL_SURFACE_ID_V0.CAP_WHEEL, projection: readCitizenProjectionV0(RSBL_SURFACE_ID_V0.CAP_WHEEL) },
    { id: RSBL_SURFACE_ID_V0.CESIUM, projection: readCitizenProjectionV0(RSBL_SURFACE_ID_V0.CESIUM) }
  ]);

  /** @type {object[]} */
  const mismatches = [];
  for (const s of surfaces) {
    const cid = s.projection?.coherence_id;
    if (cid && scrCoherence && String(cid) !== String(scrCoherence)) {
      mismatches.push(
        Object.freeze({
          surface_id: s.id,
          scr: scrCoherence,
          surface: cid
        })
      );
    }
  }

  const unbound = (mapping?.producer_to_shared || []).filter((x) => x.bound === false);

  const report = Object.freeze({
    schema: STUDIO_PERCEPTUAL_LOCK_SCHEMA_V0,
    atMs: Date.now(),
    scr_coherence_id: scrCoherence,
    surface_count: surfaces.length,
    mismatches: Object.freeze(mismatches),
    unbound_castle_surfaces: Object.freeze(unbound),
    ok: mismatches.length === 0 && unbound.length === 0
  });

  lastLockReport = report;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.studioPerceptualLock = report;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_STUDIO_PERCEPTUAL_LOCK_EVENT_V0, {
          detail: Object.freeze({ report })
        })
      );
    } catch {
      /* noop */
    }
  }
  return report;
}

export function readStudioPerceptualLockReportV0() {
  return (
    lastLockReport ||
    (typeof window !== "undefined" ? window.__rhizoh?.studioPerceptualLock : null) ||
    null
  );
}

export function resetRhizohStudioPerceptualLockForTestV0() {
  lastLockReport = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.studioPerceptualLock;
  }
}
