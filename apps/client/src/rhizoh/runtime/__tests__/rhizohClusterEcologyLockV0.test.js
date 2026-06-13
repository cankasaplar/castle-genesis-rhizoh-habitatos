import { describe, expect, it } from "vitest";
import {
  getClusterEcologyLockSnapshotV0,
  RHIZOH_CLUSTER_DOMINANT_NODE_RULE_V0,
  RHIZOH_CLUSTER_DOMINANT_TIEBREAK_V0,
  RHIZOH_CLUSTER_DRIFT_POLL_MS_V0,
  RHIZOH_INTENT_CLUSTER_EVICTION_POLICY_V0,
  RHIZOH_INTENT_CLUSTER_MAX_SIZE_V0,
  selectDominantClusterNodeV0
} from "../rhizohClusterEcologyLockV0.js";
import { RHIZOH_FEDERATION_NODE_V0 } from "../rhizohDomainGraphV0.js";

describe("rhizohClusterEcologyLockV0", () => {
  it("exposes Phase 1 locked sanity snapshot", () => {
    const snap = getClusterEcologyLockSnapshotV0();
    expect(snap.maxClusterSize).toBe(64);
    expect(snap.driftPollMs).toBe(30_000);
    expect(snap.dominantNodeRule).toBe("frequency_weight");
    expect(snap.dominantTiebreak).toBe("lexicographic_asc_node_id");
    expect(snap.evictionPolicy).toBe(RHIZOH_INTENT_CLUSTER_EVICTION_POLICY_V0);
    expect(RHIZOH_INTENT_CLUSTER_MAX_SIZE_V0).toBe(64);
    expect(RHIZOH_CLUSTER_DRIFT_POLL_MS_V0).toBe(30_000);
    expect(RHIZOH_CLUSTER_DOMINANT_NODE_RULE_V0).toBe("frequency_weight");
    expect(RHIZOH_CLUSTER_DOMINANT_TIEBREAK_V0).toBe("lexicographic_asc_node_id");
  });

  it("selectDominantClusterNodeV0 uses frequency weight with lexicographic tiebreak", () => {
    expect(
      selectDominantClusterNodeV0({
        [RHIZOH_FEDERATION_NODE_V0.STUDIO]: 2,
        [RHIZOH_FEDERATION_NODE_V0.BROADCAST]: 2
      })
    ).toBe(RHIZOH_FEDERATION_NODE_V0.BROADCAST);

    expect(
      selectDominantClusterNodeV0({
        [RHIZOH_FEDERATION_NODE_V0.MEDIA]: 3,
        [RHIZOH_FEDERATION_NODE_V0.STUDIO]: 1
      })
    ).toBe(RHIZOH_FEDERATION_NODE_V0.MEDIA);
  });
});
