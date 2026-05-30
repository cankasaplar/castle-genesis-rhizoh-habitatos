import { describe, expect, it } from "vitest";
import {
  REALITY_OPERATING_SYSTEM_SCHEMA_V0,
  REALITY_OS_CORE_SUBSYSTEMS_V0,
  buildRealityOperatingSystemSnapshotV0
} from "../realityOperatingSystemLayerV0.js";

describe("realityOperatingSystemLayerV0", () => {
  it("defines four ROS-like core subsystems", () => {
    expect(REALITY_OS_CORE_SUBSYSTEMS_V0).toHaveLength(4);
    expect(REALITY_OS_CORE_SUBSYSTEMS_V0.map((s) => s.id)).toEqual([
      "authority_beyond_stream",
      "active_arbitration_network",
      "cross_castle_reality_negotiation_bus",
      "temporal_world_versioning"
    ]);
  });

  it("snapshot bundles graph and roadmap", () => {
    const s = buildRealityOperatingSystemSnapshotV0();
    expect(s.schema).toBe(REALITY_OPERATING_SYSTEM_SCHEMA_V0);
    expect(s.dependencyGraph.edges.length).toBeGreaterThan(5);
    expect(s.roadmap.phases.length).toBe(4);
    expect(s.roadmap.stageMap.stage3).toContain("future");
  });
});
