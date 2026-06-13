/**
 * Cluster ecology lock v0 — Phase 1 sanity snapshot (Sprint 39 → 40 freeze).
 * RESEARCH-ONLY constants; changing these requires explicit Phase 1 unlock.
 *
 * @see docs/RHIZOH_CLUSTER_ECOLOGY_SANITY_SNAPSHOT_V0.md
 */

export const RHIZOH_CLUSTER_ECOLOGY_LOCK_SCHEMA_V0 = "rhizoh.cluster_ecology_lock.v0";

/** LOCKED Phase 1 — rolling intent history cap (not entropy-based). */
export const RHIZOH_INTENT_CLUSTER_MAX_SIZE_V0 = 64;

/**
 * LOCKED Phase 1 — newest intent wins dedupe; overflow drops oldest rows.
 * @type {"newest_first_dedupe_by_intentId_then_drop_oldest"}
 */
export const RHIZOH_INTENT_CLUSTER_EVICTION_POLICY_V0 = "newest_first_dedupe_by_intentId_then_drop_oldest";

/** LOCKED Phase 1 — fixed deterministic poll interval (ms). Not adaptive / not entropy. */
export const RHIZOH_CLUSTER_DRIFT_POLL_MS_V0 = 30_000;

/**
 * LOCKED Phase 1 — dominant node = frequency weight (count), NOT entropy sampling.
 * @type {"frequency_weight"}
 */
export const RHIZOH_CLUSTER_DOMINANT_NODE_RULE_V0 = "frequency_weight";

/**
 * LOCKED Phase 1 — equal-weight tiebreak: lexicographic ascending node id.
 * @type {"lexicographic_asc_node_id"}
 */
export const RHIZOH_CLUSTER_DOMINANT_TIEBREAK_V0 = "lexicographic_asc_node_id";

/**
 * Deterministic dominant node from frequency weights.
 * @param {Record<string, number>} nodeWeights
 * @returns {string | null}
 */
export function selectDominantClusterNodeV0(nodeWeights) {
  let dominantNode = null;
  let max = 0;

  for (const node of Object.keys(nodeWeights).sort()) {
    const count = nodeWeights[node] || 0;
    if (count > max) {
      max = count;
      dominantNode = node;
    }
  }

  return dominantNode;
}

export function getClusterEcologyLockSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_CLUSTER_ECOLOGY_LOCK_SCHEMA_V0,
    maxClusterSize: RHIZOH_INTENT_CLUSTER_MAX_SIZE_V0,
    evictionPolicy: RHIZOH_INTENT_CLUSTER_EVICTION_POLICY_V0,
    driftPollMs: RHIZOH_CLUSTER_DRIFT_POLL_MS_V0,
    dominantNodeRule: RHIZOH_CLUSTER_DOMINANT_NODE_RULE_V0,
    dominantTiebreak: RHIZOH_CLUSTER_DOMINANT_TIEBREAK_V0
  });
}
