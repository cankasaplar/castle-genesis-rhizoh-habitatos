/**
 * World domain calm mode — legal hold + 6:44 spiral visual austerity.
 */

import { isRhizohLegalPendingHoldV0 } from "./rhizohLegalPendingWaitLoopV0.js";
import { isRhizohWorldDomainUiActiveV0 } from "./rhizohWorldNamespaceGateV0.js";
import {
  isRhizohNeonCountdownCompleteV0,
  readRhizohNeonCountdownDeadlineMsV0,
  resolveRhizohNeonCountdownRemainingMsV0
} from "./rhizohNeonCountdownV0.js";

export const WORLD_DOMAIN_CALM_SCHEMA_V0 = "rhizoh.world_domain_calm.v0";

/**
 * Legal approval pending on world domain routes only — does not gate core subsystems.
 */
export function isWorldLegalCalmModeV0() {
  if (!isRhizohWorldDomainUiActiveV0()) return false;
  return isRhizohLegalPendingHoldV0();
}

/**
 * Active 6:44 countdown — birds + boxes only (hide bottles, codex noise).
 * @param {number} [nowMs]
 */
export function isSpiralCountdownCalmVisualV0(nowMs = Date.now()) {
  const remaining = resolveRhizohNeonCountdownRemainingMsV0(
    readRhizohNeonCountdownDeadlineMsV0(nowMs),
    nowMs
  );
  return !isRhizohNeonCountdownCompleteV0(remaining);
}

/**
 * Combined calm — legal hold OR active spiral countdown.
 */
export function isWorldDomainCalmModeV0(nowMs = Date.now()) {
  return isWorldLegalCalmModeV0() || isSpiralCountdownCalmVisualV0(nowMs);
}

/**
 * Hide sports strip, tools halo, heavy domain panels.
 */
export function shouldSuppressWorldDomainChromeV0(nowMs = Date.now()) {
  return isWorldDomainCalmModeV0(nowMs);
}

/**
 * Default map tool on first world entry during legal hold.
 */
export function resolveWorldEntryMapToolV0(savedTool, hasNexusGeo) {
  const id = String(savedTool || "");
  if (id === "satellite" || id === "streets") return id;
  if (isWorldLegalCalmModeV0()) return "streets";
  if (!hasNexusGeo || id === "globe") return "city_map";
  return id || "city_map";
}
