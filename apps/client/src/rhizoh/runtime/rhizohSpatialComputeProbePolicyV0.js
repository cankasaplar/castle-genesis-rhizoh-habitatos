/**
 * Spatial compute probe policy — WebGPU/Cesium adapter probes only when Cesium owns the sink.
 * Chrome "No available adapters" on T0 / Leaflet routes is suppressed.
 */

import { resolveSpatialSinkProbeV0 } from "./spatialWorldSinkProbeV0.js";

export const RHIZOH_SPATIAL_COMPUTE_PROBE_POLICY_SCHEMA_V0 =
  "rhizoh.spatial_compute_probe_policy.v0";

/**
 * WebGPU / swarm GPU warm-up runs only when spatial sink is active Cesium.
 * @param {{ sink?: string }} [override]
 * @returns {boolean}
 */
export function shouldRunWebGpuComputeProbeV0(override = {}) {
  if (typeof override.sink === "string") {
    return override.sink === "cesium";
  }
  if (typeof window === "undefined") return false;
  const probe = resolveSpatialSinkProbeV0();
  return String(probe.sink || "") === "cesium";
}
