/**
 * Stability learning trace strip visibility gate v1.9.
 * Tiered exposure — NOT full public replay UI (UX overload + UI freeze safe).
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_9_BRIDGE_V1.md
 */

import { isCastleDebugGranularFlagEnabled } from "../rhizoh/runtime/castleDebugGateV0.js";
import { isRhizohT0FirstMatchIdentityV0 } from "../rhizoh/runtime/rhizohT0FirstMatchIdentityV0.js";

export const STABILITY_LEARNING_TRACE_FLAG_V1_9 = "VITE_RHIZOH_STABILITY_LEARNING_TRACE";
export const STABILITY_TRACE_PROD_DEBUG_FLAG_V1_9 = "VITE_RHIZOH_STABILITY_TRACE_PROD_DEBUG";

export const STABILITY_TRACE_VISIBILITY_TIER_V1_9 = Object.freeze({
  OFF: "off",
  PROD_DEBUG: "prod_debug",
  INTERNAL: "internal"
});

function isInternalTraceTierEnabledV1_9() {
  if (isRhizohT0FirstMatchIdentityV0()) return false;
  return isCastleDebugGranularFlagEnabled(STABILITY_LEARNING_TRACE_FLAG_V1_9);
}

function isProdDebugTraceTierEnabledV1_9() {
  if (isRhizohT0FirstMatchIdentityV0()) return false;
  return isCastleDebugGranularFlagEnabled(STABILITY_TRACE_PROD_DEBUG_FLAG_V1_9);
}

/**
 * Visibility tier — controlled prod exposure, never default-on full replay.
 * @returns {'off' | 'prod_debug' | 'internal'}
 */
export function getStabilityTraceVisibilityTierV1_9() {
  if (isInternalTraceTierEnabledV1_9()) return STABILITY_TRACE_VISIBILITY_TIER_V1_9.INTERNAL;
  if (isProdDebugTraceTierEnabledV1_9()) return STABILITY_TRACE_VISIBILITY_TIER_V1_9.PROD_DEBUG;
  return STABILITY_TRACE_VISIBILITY_TIER_V1_9.OFF;
}

/** Strip visible at all (summary-only or full internal). */
export function shouldShowStabilityLearningTraceStripV1_9() {
  return getStabilityTraceVisibilityTierV1_9() !== STABILITY_TRACE_VISIBILITY_TIER_V1_9.OFF;
}

/** Replay path + timeline scrub — internal/dev only, never prod_debug cohort. */
export function shouldShowStabilityTraceReplayUiV1_9() {
  return getStabilityTraceVisibilityTierV1_9() === STABILITY_TRACE_VISIBILITY_TIER_V1_9.INTERNAL;
}

/** Summary-only mode for controlled prod-debug visibility. */
export function isStabilityTraceSummaryOnlyV1_9() {
  return getStabilityTraceVisibilityTierV1_9() === STABILITY_TRACE_VISIBILITY_TIER_V1_9.PROD_DEBUG;
}

export function readStabilityLearningTraceFromWindowV1_9(ownerId = "user_local") {
  if (typeof window === "undefined") return null;
  const syncUserId =
    typeof window.__rhizoh?.resolvePhysicsSyncUserId === "function"
      ? window.__rhizoh.resolvePhysicsSyncUserId(ownerId)
      : ownerId;
  const fromLoop = window.__rhizoh?.lastOsLoop?.learningTrace;
  if (fromLoop) return fromLoop;
  const reader = window.__rhizoh?.getStabilityLearningTrace;
  return typeof reader === "function" ? reader(syncUserId) : null;
}
