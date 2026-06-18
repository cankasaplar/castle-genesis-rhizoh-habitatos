/**
 * Spatial mode SSOT — single active world engine (leaflet vs cesium).
 * Drives compute gate, WebGPU probe suppression, and engine boot alignment.
 * RESEARCH-ONLY — no execution authority.
 */

import { resolveSpatialSinkProbeV0 } from "./spatialWorldSinkProbeV0.js";

export const RHIZOH_SPATIAL_MODE_SCHEMA_V0 = "rhizoh.spatial_mode.v0";

export const RHIZOH_SPATIAL_MODE_ALLOWED_V0 = Object.freeze(["leaflet", "cesium"]);

/** @typedef {"leaflet" | "cesium"} RhizohSpatialModeActiveV0 */

/**
 * @param {string} [sink]
 * @returns {RhizohSpatialModeActiveV0}
 */
export function resolveRhizohSpatialModeActiveFromSinkV0(sink) {
  return String(sink || "") === "cesium" ? "cesium" : "leaflet";
}

/**
 * @param {{ sink?: string }} [override]
 */
export function resolveRhizohSpatialModeV0(override = {}) {
  const sink =
    override.sink ??
    (typeof window !== "undefined" ? resolveSpatialSinkProbeV0().sink : "missing");
  const active = resolveRhizohSpatialModeActiveFromSinkV0(sink);
  return Object.freeze({
    schema: RHIZOH_SPATIAL_MODE_SCHEMA_V0,
    active,
    allowed: RHIZOH_SPATIAL_MODE_ALLOWED_V0,
    sink: String(sink || ""),
    atMs: Date.now()
  });
}

/**
 * @returns {ReturnType<typeof resolveRhizohSpatialModeV0>}
 */
export function readRhizohSpatialModeV0() {
  if (typeof window !== "undefined" && window.__rhizoh?.spatialMode?.active) {
    return window.__rhizoh.spatialMode;
  }
  return resolveRhizohSpatialModeV0();
}

/**
 * Publish spatial mode from current sink probe (or override).
 * @param {{ sink?: string }} [override]
 */
export function publishRhizohSpatialModeV0(override = {}) {
  if (typeof window === "undefined") return resolveRhizohSpatialModeV0(override);
  const mode = resolveRhizohSpatialModeV0(override);
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.spatialMode = mode;
  if (mode.active !== "cesium") {
    disableCesiumComputeV0();
  } else {
    enableCesiumComputeV0();
  }
  return mode;
}

/** Prod (VITE_DEBUG≠1) = silent skip; debug exposes leaflet_mode_active. */
export function isRhizohSpatialComputeDebugVerboseV0() {
  const raw = String(import.meta?.env?.VITE_DEBUG ?? "").trim();
  return raw === "1" || raw === "true";
}

let cesiumComputeEnabledV0 = true;

export function isCesiumComputeEnabledV0() {
  return cesiumComputeEnabledV0;
}

export function disableCesiumComputeV0() {
  cesiumComputeEnabledV0 = false;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.cesiumComputeEnabled = false;
  }
}

export function enableCesiumComputeV0() {
  cesiumComputeEnabledV0 = true;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.cesiumComputeEnabled = true;
  }
}

/**
 * Compute gate — WebGPU / Cesium compute only when cesium owns the active spatial mode.
 * @param {{ spatialMode?: { active?: string }, sink?: string }} [override]
 * @returns {{ skip: boolean, reason?: string }}
 */
export function resolveRhizohComputeGateV0(override = {}) {
  const spatialMode = override.spatialMode ?? readRhizohSpatialModeV0();
  if (String(spatialMode?.active || "") !== "cesium") {
    return Object.freeze({ skip: true, reason: "leaflet_mode" });
  }
  if (!isCesiumComputeEnabledV0()) {
    return Object.freeze({ skip: true, reason: "leaflet_mode" });
  }
  return Object.freeze({ skip: false });
}

/**
 * @param {{ reason?: string }} gate
 */
export function buildRhizohComputeSkipSnapshotV0(gate = {}) {
  const verbose = isRhizohSpatialComputeDebugVerboseV0();
  const base = Object.freeze({
    schema: "rhizoh.compute_skip.v0",
    evaluatedAtMs: Date.now(),
    skipped: true,
    layer: "compute_rendering",
    voicePipelineImpact: false,
    voicePipelineAware: false
  });
  if (!verbose) return base;
  return Object.freeze({
    ...base,
    skipReason: "leaflet_mode_active",
    debugReason: String(gate.reason || "leaflet_mode")
  });
}

/** @internal vitest */
export function __resetRhizohSpatialModeForTestV0() {
  cesiumComputeEnabledV0 = true;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.spatialMode;
    delete window.__rhizoh.cesiumComputeEnabled;
  }
}
