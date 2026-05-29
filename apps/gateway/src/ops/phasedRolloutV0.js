/**
 * Phased rollout facade — delegates to cluster truth (phasedRolloutClusterV0).
 * @deprecated Direct process-local counter removed; use cluster module.
 */
export {
  PHASED_ROLLOUT_CLUSTER_SCHEMA_V0,
  PHASED_ROLLOUT_TIER_LIMITS_V0,
  PHASED_ROLLOUT_LEDGER_MODE_V0,
  readPhasedRolloutClusterConfigV0,
  readPhasedRolloutTierV0,
  getPhasedRolloutLimitV0,
  resolvePhasedRolloutHealthV0,
  beginPhasedRolloutTurnV0,
  endPhasedRolloutTurnV0,
  reconcilePhasedRolloutInflightV0,
  readPhasedRolloutLeaseTtlMsV0,
  getPhasedRolloutStatsV0,
  resetPhasedRolloutClusterV0 as resetPhasedRolloutV0,
  beginPhasedRolloutTurnSyncV0,
  endPhasedRolloutTurnSyncV0,
  phasedRolloutErrorV0
} from "./phasedRolloutClusterV0.js";
