/**
 * RSBL → SSL → SCR publish orchestrator (breaks import cycles).
 */

import { syncRhizohSurfaceBindingsV0 } from "./rhizohSurfaceBindingLayerV0.js";
import { enforceSurfaceSingularityV0 } from "./rhizohSurfaceSingularityLayerV0.js";
import { publishSurfaceCitizenshipV0 } from "./rhizohSurfaceCitizenshipRuntimeV0.js";

/**
 * @param {ReturnType<import("./rhizohT0UnifiedPresenceFrameV0.js").readLastT0PresenceFrameV0>} [frame]
 * @param {object | null} [resl]
 * @param {ReturnType<import("./rhizohExperienceContinuityCompilerV0.js").compileExperienceContinuityV0> | null} [ecc]
 */
export function publishRhizohSurfaceStackV0(frame = null, resl = null, ecc = null) {
  const bindings = syncRhizohSurfaceBindingsV0(frame, resl, ecc);
  const singularity = enforceSurfaceSingularityV0(frame, bindings);
  const citizenship = publishSurfaceCitizenshipV0(singularity);
  return Object.freeze({ bindings, singularity, citizenship });
}
