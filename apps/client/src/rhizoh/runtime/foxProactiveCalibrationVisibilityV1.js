/**
 * FOX_PROACTIVE_CALIBRATION_VISIBILITY_V1 — debug/perception strip gate.
 */

import { isCastleDebugGranularFlagEnabled } from "./castleDebugGateV0.js";

export function shouldShowFoxProactiveCalibrationChipV1() {
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
  return isCastleDebugGranularFlagEnabled("VITE_RHIZOH_PERCEPTION_DEBUG");
}
