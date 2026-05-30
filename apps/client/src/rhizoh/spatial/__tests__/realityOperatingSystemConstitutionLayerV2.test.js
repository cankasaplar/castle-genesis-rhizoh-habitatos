import { describe, expect, it } from "vitest";
import {
  ROS_REALITY_CONSTITUTION_LAYER_SCHEMA_V2,
  ROS_CONSTITUTION_LAYER_PILLARS_V2,
  buildRosRealityConstitutionLayerSnapshotV2
} from "../realityOperatingSystemConstitutionLayerV2.js";

describe("realityOperatingSystemConstitutionLayerV2", () => {
  it("defines four constitution pillars", () => {
    expect(ROS_CONSTITUTION_LAYER_PILLARS_V2).toHaveLength(4);
    expect(ROS_CONSTITUTION_LAYER_PILLARS_V2.map((p) => p.id)).toEqual([
      "policy_versioning_semantic_rules",
      "cross_world_law_inheritance",
      "authority_democracy_delegation_graphs",
      "causal_constitution_enforcement"
    ]);
  });

  it("snapshot bundles graph and constitution path", () => {
    const s = buildRosRealityConstitutionLayerSnapshotV2();
    expect(s.schema).toBe(ROS_REALITY_CONSTITUTION_LAYER_SCHEMA_V2);
    expect(s.dependencyGraph.edges.length).toBeGreaterThan(5);
    expect(s.constitutionPath.phases.length).toBe(4);
  });
});
