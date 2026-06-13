/**
 * Rhizoh OS Stabil Release Layer v0 — Sprint 40.
 * Not a freeze halt: bounded mutation boundary + production invisible kernel trace.
 * RESEARCH-ONLY.
 *
 * @see docs/RHIZOH_OS_STABIL_RELEASE_LAYER_V1.0.md
 * @see docs/RHIZOH_LIVING_FREEZE_MODEL_V1.0.md
 */

import { bootClusterCivilizationV0 } from "./rhizohClusterCivilizationV0.js";
import { getClusterEcologyLockSnapshotV0 } from "./rhizohClusterEcologyLockV0.js";
import {
  isRhizohKernelTraceExposedV0,
  publishRhizohKernelTraceGlobalV0,
  scrubRhizohKernelTraceGlobalsV0
} from "./rhizohKernelTraceMembraneV0.js";

export const RHIZOH_OS_STABIL_RELEASE_SCHEMA_V0 = "rhizoh.os_stabil_release.v0";

/** Surface flags that must stay off in stabil / production profile. */
export const RHIZOH_STABIL_BLOCKED_SURFACE_FLAGS_V0 = Object.freeze([
  "VITE_DEBUG",
  "VITE_RHIZOH_KERNEL_TRACE_DEBUG",
  "VITE_RHIZOH_PERCEPTION_DEBUG",
  "VITE_RHIZOH_LAB_OVERLAY_DEBUG"
]);

/**
 * Boot stabil release layer — cluster ecology + invisible kernel trace.
 * @returns {() => void} dispose
 */
export function bootRhizohOsStabilReleaseLayerV0() {
  const disposeCluster = bootClusterCivilizationV0();
  scrubRhizohKernelTraceGlobalsV0();

  const lock = getClusterEcologyLockSnapshotV0();
  publishRhizohKernelTraceGlobalV0(
    "__RHIZOH_OS_STABIL_RELEASE__",
    Object.freeze({
      schema: RHIZOH_OS_STABIL_RELEASE_SCHEMA_V0,
      ecologyLock: lock,
      kernelTraceExposed: isRhizohKernelTraceExposedV0(),
      atMs: Date.now()
    })
  );

  return () => {
    disposeCluster();
    scrubRhizohKernelTraceGlobalsV0();
  };
}
