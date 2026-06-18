/**
 * Spatial compute probe policy — gated by rhizohSpatialModeV0 SSOT (single active world engine).
 */

import {
  readRhizohSpatialModeV0,
  resolveRhizohComputeGateV0,
  resolveRhizohSpatialModeActiveFromSinkV0
} from "./rhizohSpatialModeV0.js";
import { resolveSpatialSinkProbeV0 } from "./spatialWorldSinkProbeV0.js";

export const RHIZOH_SPATIAL_COMPUTE_PROBE_POLICY_SCHEMA_V0 =
  "rhizoh.spatial_compute_probe_policy.v0";

export { resolveRhizohComputeGateV0 } from "./rhizohSpatialModeV0.js";

/**
 * WebGPU / swarm GPU warm-up runs only when spatialMode.active === "cesium".
 * @param {{ sink?: string, spatialMode?: { active?: string } }} [override]
 * @returns {boolean}
 */
export function shouldRunWebGpuComputeProbeV0(override = {}) {
  if (typeof override.sink === "string") {
    const active = resolveRhizohSpatialModeActiveFromSinkV0(override.sink);
    return !resolveRhizohComputeGateV0({
      spatialMode: { active }
    }).skip;
  }
  if (override.spatialMode) {
    return !resolveRhizohComputeGateV0(override).skip;
  }
  if (typeof window === "undefined") return false;
  readRhizohSpatialModeV0();
  return !resolveRhizohComputeGateV0().skip;
}
