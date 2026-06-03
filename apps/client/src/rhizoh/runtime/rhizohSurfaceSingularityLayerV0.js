/**
 * SSL v0 — Surface Singularity Layer.
 * RSBL = mapping · SSL = enforcement contract (all surfaces = T0 projection only).
 * @see docs/RHIZOH_SURFACE_SINGULARITY_LAYER_V0.md
 */

import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import {
  RSBL_SURFACE_ID_V0,
  RSBL_SURFACE_ROLE_V0,
  readLastSurfaceBindingsV0
} from "./rhizohSurfaceBindingLayerV0.js";

export const SSL_SCHEMA_V0 = "castle.rhizoh.surface_singularity_layer.v0";

export const RHIZOH_SURFACE_SINGULARITY_EVENT_V0 = "rhizoh:surface-singularity-v0";

export const SSL_NOW_SOURCE_V0 = "t0_unified_presence_frame";

/** @type {ReturnType<typeof enforceSurfaceSingularityV0> | null} */
let lastSingularity = null;

/** @type {string[]} */
const violationRing = [];

const VIOLATION_RING_MAX_V0 = 16;

export const SSL_SURFACE_ID_V0 = Object.freeze({
  ...RSBL_SURFACE_ID_V0,
  UI_DRAWER: "ui_drawer",
  STUDIO: "studio",
  PET: "pet"
});

/**
 * @param {ReturnType<typeof readLastT0PresenceFrameV0>} frame
 * @param {ReturnType<typeof readLastSurfaceBindingsV0>} bindings
 */
export function buildSurfaceSingularityV0(frame, bindings) {
  const f = frame || readLastT0PresenceFrameV0();
  const b = bindings || readLastSurfaceBindingsV0();
  const nowMs = Number(f?.masterNowMs) || Number(b?.atMs) || Date.now();
  const coherenceId = b?.coherence_id || f?.coherenceId || "none";

  const baseProjection = b?.projection || Object.freeze({});
  const rsblSurfaces = b?.surfaces || {};

  const drawerProjection = Object.freeze({
    role: RSBL_SURFACE_ROLE_V0.PROJECTION,
    bound: true,
    coherence_id: coherenceId,
    stripOpacity01: Number(baseProjection.stripOpacity01 ?? 1),
    continuity_line: baseProjection.continuity_line || null,
    masterNowMs: nowMs
  });

  const studioProjection = Object.freeze({
    role: RSBL_SURFACE_ROLE_V0.PROJECTION,
    bound: true,
    coherence_id: coherenceId,
    experiential_now_id: b?.experiential_now_id || null,
    masterNowMs: nowMs
  });

  const petProjection = Object.freeze({
    role: RSBL_SURFACE_ROLE_V0.PROJECTION,
    bound: true,
    coherence_id: coherenceId,
    breathe01: Number(baseProjection.breathe01 ?? 0),
    intensity01: Number(baseProjection.intensity01 ?? 0.65),
    masterNowMs: nowMs,
    /** Pet = moving RCAL node — position from world projection, not local clock */
    world_projection: true
  });

  const capWheel = rsblSurfaces[RSBL_SURFACE_ID_V0.CAP_WHEEL] || {};
  const capWheelProjection = Object.freeze({
    ...capWheel,
    role: RSBL_SURFACE_ROLE_V0.TOOL_LENS,
    bound: true,
    breathe01: Number(baseProjection.breathe01 ?? capWheel.breathe01 ?? 0),
    coherence_id: coherenceId,
    masterNowMs: nowMs
  });

  return Object.freeze({
    schema: SSL_SCHEMA_V0,
    atMs: nowMs,
    now_source: SSL_NOW_SOURCE_V0,
    coherence_id: coherenceId,
    isolation_forbidden: true,
    frame: f
      ? Object.freeze({
          coherenceId: f.coherenceId,
          masterNowMs: f.masterNowMs,
          temporalPhase: f.temporalPhase,
          breathe01: f.breathe01
        })
      : null,
    surfaces: Object.freeze({
      ...rsblSurfaces,
      [SSL_SURFACE_ID_V0.UI_DRAWER]: drawerProjection,
      [SSL_SURFACE_ID_V0.STUDIO]: studioProjection,
      [SSL_SURFACE_ID_V0.PET]: petProjection,
      [RSBL_SURFACE_ID_V0.CAP_WHEEL]: capWheelProjection
    }),
    violations: Object.freeze([...violationRing])
  });
}

/**
 * Publish SSL — call after RSBL sync. Does not render.
 * @param {ReturnType<typeof readLastT0PresenceFrameV0>} [frame]
 * @param {ReturnType<typeof readLastSurfaceBindingsV0>} [bindings]
 */
export function enforceSurfaceSingularityV0(frame = null, bindings = null) {
  const f = frame || readLastT0PresenceFrameV0();
  const b = bindings || readLastSurfaceBindingsV0();
  const singularity = buildSurfaceSingularityV0(f, b);
  lastSingularity = singularity;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.surfaceSingularity = singularity;
    window.__rhizoh.t0UnifiedFrame = f || window.__rhizoh.presenceFrame || null;
    window.__rhizoh.surfaceSingularityAuthority = Object.freeze({
      now_source: SSL_NOW_SOURCE_V0,
      isolation_forbidden: true,
      coherence_id: singularity.coherence_id
    });
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_SURFACE_SINGULARITY_EVENT_V0, {
          detail: Object.freeze({ singularity })
        })
      );
    } catch {
      /* noop */
    }
  }
  return singularity;
}

/**
 * Canonical read path for any UI surface — projection only, never local clock.
 * @param {string} surfaceId
 */
export function readSurfaceProjectionV0(surfaceId) {
  const id = String(surfaceId || "");
  const s =
    lastSingularity ||
    (typeof window !== "undefined" ? window.__rhizoh?.surfaceSingularity : null);
  return s?.surfaces?.[id] || null;
}

/**
 * @param {string} surfaceId
 * @param {number} localNowMs
 */
export function recordSurfaceIsolationViolationV0(surfaceId, localNowMs) {
  const f = readLastT0PresenceFrameV0();
  const truthMs = Number(f?.masterNowMs) || Date.now();
  const delta = Math.abs(Number(localNowMs) - truthMs);
  if (delta < 120) return null;

  const entry = Object.freeze({
    surface_id: String(surfaceId || "unknown"),
    local_now_ms: Number(localNowMs),
    truth_now_ms: truthMs,
    delta_ms: delta,
    atMs: Date.now()
  });
  violationRing.push(`${entry.surface_id}:${entry.delta_ms}ms`);
  if (violationRing.length > VIOLATION_RING_MAX_V0) violationRing.shift();
  return entry;
}

export function readLastSurfaceSingularityV0() {
  return lastSingularity;
}

export function resetRhizohSurfaceSingularityForTestV0() {
  lastSingularity = null;
  violationRing.length = 0;
}
