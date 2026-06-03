/**
 * SCR v0 — Surface Citizenship Runtime.
 * SSL = enforcement contract · SCR = execution substrate (reverse ownership).
 * UI does not produce temporal state; UI consumes T0 projection only.
 * @see docs/RHIZOH_SURFACE_CITIZENSHIP_RUNTIME_V0.md
 */

import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import {
  readLastSurfaceSingularityV0,
  readSurfaceProjectionV0,
  SSL_SURFACE_ID_V0,
  SSL_NOW_SOURCE_V0
} from "./rhizohSurfaceSingularityLayerV0.js";
import { RSBL_SURFACE_ID_V0 } from "./rhizohSurfaceBindingLayerV0.js";

export const SCR_SCHEMA_V0 = "castle.rhizoh.surface_citizenship_runtime.v0";

export const RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0 = "rhizoh:surface-citizenship-v0";

export const SCR_OWNERSHIP_RULE_V0 = Object.freeze({
  reverse: true,
  now_source: SSL_NOW_SOURCE_V0,
  projection_only: true,
  ui_may_not_own_clock: true,
  ui_may_not_own_world_tick: true,
  ui_may_not_own_session_timeline: true
});

export const SCR_VIOLATION_CODE_V0 = Object.freeze({
  LOCAL_CLOCK: "local_clock",
  EXTERNAL_PULSE: "external_pulse_override",
  LOCAL_WORLD_TICK: "local_world_tick",
  SESSION_TIMELINE: "session_timeline",
  UNREGISTERED_SURFACE: "unregistered_surface"
});

/** Surfaces that must consume citizenship projection each tick. */
export const SCR_CITIZEN_SURFACE_IDS_V0 = Object.freeze([
  RSBL_SURFACE_ID_V0.T0_STRIP,
  RSBL_SURFACE_ID_V0.UI_2D,
  RSBL_SURFACE_ID_V0.CESIUM,
  RSBL_SURFACE_ID_V0.GLOBE_THREE,
  RSBL_SURFACE_ID_V0.CAP_WHEEL,
  RSBL_SURFACE_ID_V0.PRESENCE_FIELD,
  RSBL_SURFACE_ID_V0.SWARM,
  RSBL_SURFACE_ID_V0.STUDIO_PANEL,
  SSL_SURFACE_ID_V0.UI_DRAWER,
  SSL_SURFACE_ID_V0.STUDIO,
  SSL_SURFACE_ID_V0.PET
]);

/** @type {ReturnType<typeof publishSurfaceCitizenshipV0> | null} */
let lastCitizenship = null;

/** @type {ReturnType<typeof recordCitizenshipViolationV0>[]} */
const violationLog = [];

const VIOLATION_LOG_MAX_V0 = 24;

/**
 * @param {ReturnType<typeof readLastSurfaceSingularityV0>} singularity
 */
export function buildSurfaceCitizenshipV0(singularity) {
  const ssl = singularity || readLastSurfaceSingularityV0();
  const frame = readLastT0PresenceFrameV0();
  const coherenceId = ssl?.coherence_id || frame?.coherenceId || "none";
  const masterNowMs = Number(ssl?.atMs) || Number(frame?.masterNowMs) || Date.now();

  /** @type {Record<string, object>} */
  const citizens = {};

  for (const surfaceId of SCR_CITIZEN_SURFACE_IDS_V0) {
    const projection = readSurfaceProjectionV0(surfaceId) || ssl?.surfaces?.[surfaceId] || null;
    citizens[surfaceId] = Object.freeze({
      surface_id: surfaceId,
      status: projection?.bound ? "citizen" : "unbound",
      owns_clock: false,
      owns_world_tick: false,
      owns_session_timeline: false,
      projection,
      chrome_allowed: Object.freeze(["open", "hover", "focus", "navigate"])
    });
  }

  return Object.freeze({
    schema: SCR_SCHEMA_V0,
    atMs: masterNowMs,
    coherence_id: coherenceId,
    ownership: SCR_OWNERSHIP_RULE_V0,
    citizens: Object.freeze(citizens),
    violations: Object.freeze(violationLog.slice(-VIOLATION_LOG_MAX_V0))
  });
}

/**
 * Publish SCR — call after SSL enforce. Execution substrate for all UI surfaces.
 * @param {ReturnType<typeof readLastSurfaceSingularityV0>} [singularity]
 */
export function publishSurfaceCitizenshipV0(singularity = null) {
  const citizenship = buildSurfaceCitizenshipV0(singularity);
  lastCitizenship = citizenship;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.surfaceCitizenship = citizenship;
    window.__rhizoh.surfaceCitizenshipAuthority = Object.freeze({
      ...SCR_OWNERSHIP_RULE_V0,
      coherence_id: citizenship.coherence_id
    });
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0, {
          detail: Object.freeze({ citizenship })
        })
      );
    } catch {
      /* noop */
    }
  }
  return citizenship;
}

/**
 * Canonical UI read path — projection only (reverse ownership).
 * @param {string} surfaceId
 */
export function readCitizenProjectionV0(surfaceId) {
  const id = String(surfaceId || "");
  const citizen =
    lastCitizenship?.citizens?.[id] ||
    (typeof window !== "undefined" ? window.__rhizoh?.surfaceCitizenship?.citizens?.[id] : null);
  if (citizen?.projection) return citizen.projection;

  const fallback = readSurfaceProjectionV0(id);
  if (fallback) return fallback;
  recordCitizenshipViolationV0(id, SCR_VIOLATION_CODE_V0.UNREGISTERED_SURFACE, { read: true });
  return null;
}

/**
 * @param {string} surfaceId
 * @param {string} code
 * @param {object} [detail]
 */
export function recordCitizenshipViolationV0(surfaceId, code, detail = {}) {
  const entry = Object.freeze({
    surface_id: String(surfaceId || "unknown"),
    code: String(code || SCR_VIOLATION_CODE_V0.LOCAL_CLOCK),
    detail: Object.freeze(detail || {}),
    atMs: Date.now()
  });
  violationLog.push(entry);
  if (violationLog.length > VIOLATION_LOG_MAX_V0) violationLog.shift();
  return entry;
}

/**
 * Reverse ownership guard — reject external temporal overrides.
 * @param {string} surfaceId
 * @param {{ localNowMs?: number, externalPulse?: number | null, localWorldTick?: boolean }} opts
 */
export function assertReverseOwnershipV0(surfaceId, opts = {}) {
  const frame = readLastT0PresenceFrameV0();
  const truthMs = Number(frame?.masterNowMs) || Date.now();

  if (opts.externalPulse != null && Number.isFinite(Number(opts.externalPulse))) {
    return recordCitizenshipViolationV0(surfaceId, SCR_VIOLATION_CODE_V0.EXTERNAL_PULSE, {
      externalPulse: Number(opts.externalPulse)
    });
  }

  const localNowMs = Number(opts.localNowMs);
  if (Number.isFinite(localNowMs) && Math.abs(localNowMs - truthMs) > 120) {
    return recordCitizenshipViolationV0(surfaceId, SCR_VIOLATION_CODE_V0.LOCAL_CLOCK, {
      localNowMs,
      truthMs,
      delta_ms: Math.abs(localNowMs - truthMs)
    });
  }

  if (opts.localWorldTick === true) {
    return recordCitizenshipViolationV0(surfaceId, SCR_VIOLATION_CODE_V0.LOCAL_WORLD_TICK, {});
  }

  return null;
}

/**
 * Cesium / globe — citizen projection slice.
 */
export function readCesiumCitizenProjectionV0() {
  return (
    readCitizenProjectionV0(RSBL_SURFACE_ID_V0.CESIUM) ||
    readCitizenProjectionV0(RSBL_SURFACE_ID_V0.GLOBE_THREE)
  );
}

/**
 * Cap wheel breathe pulse from citizenship (never external).
 */
export function readCapWheelCitizenPulseV0() {
  const p = readCitizenProjectionV0(RSBL_SURFACE_ID_V0.CAP_WHEEL);
  const breathe01 = Number(p?.breathe01);
  if (Number.isFinite(breathe01)) return breathe01;
  const frame = readLastT0PresenceFrameV0();
  return Number(frame?.breathe01) || 0;
}

export function readLastSurfaceCitizenshipV0() {
  return lastCitizenship;
}

export function resetRhizohSurfaceCitizenshipForTestV0() {
  lastCitizenship = null;
  violationLog.length = 0;
}
