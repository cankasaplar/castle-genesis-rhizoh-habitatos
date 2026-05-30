import { describe, expect, it } from "vitest";
import {
  ROS_LIVE_REALITY_GOVERNANCE_NETWORK_SCHEMA_V1,
  ROS_GOVERNANCE_NETWORK_PILLARS_V1,
  buildRosLiveRealityGovernanceNetworkSnapshotV1
} from "../realityOperatingSystemGovernanceNetworkV1.js";

describe("realityOperatingSystemGovernanceNetworkV1", () => {
  it("defines four governance pillars", () => {
    expect(ROS_GOVERNANCE_NETWORK_PILLARS_V1).toHaveLength(4);
    expect(ROS_GOVERNANCE_NETWORK_PILLARS_V1.map((p) => p.id)).toEqual([
      "global_arbitration_clock",
      "cross_castle_causal_consistency",
      "authority_leasing_system",
      "temporal_conflict_resolution_algebra"
    ]);
  });

  it("snapshot bundles graph and governance path", () => {
    const s = buildRosLiveRealityGovernanceNetworkSnapshotV1();
    expect(s.schema).toBe(ROS_LIVE_REALITY_GOVERNANCE_NETWORK_SCHEMA_V1);
    expect(s.dependencyGraph.edges.length).toBeGreaterThan(5);
    expect(s.governancePath.phases.length).toBe(4);
  });
});
