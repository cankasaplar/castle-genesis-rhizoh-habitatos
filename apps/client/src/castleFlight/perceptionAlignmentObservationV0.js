/**
 * T0 perception alignment observation — visibility gate + strip helpers.
 * @see docs/CAMERA_UNIFICATION_SPEC_V1.md Step 2.2
 */

import { isCastleDebugGranularFlagEnabled } from "../rhizoh/runtime/castleDebugGateV0.js";
import { isRhizohT0FirstMatchIdentityV0 } from "../rhizoh/runtime/rhizohT0FirstMatchIdentityV0.js";

export const PERCEPTION_ALIGNMENT_OBSERVATION_FLAG_V0 = "VITE_RHIZOH_PERCEPTION_ALIGNMENT_DEBUG";

/**
 * Alignment strip is mirror-only — never prod-default.
 * @returns {boolean}
 */
export function shouldShowPerceptionAlignmentObservationStripV0() {
  if (isRhizohT0FirstMatchIdentityV0()) return false;
  return isCastleDebugGranularFlagEnabled(PERCEPTION_ALIGNMENT_OBSERVATION_FLAG_V0);
}
