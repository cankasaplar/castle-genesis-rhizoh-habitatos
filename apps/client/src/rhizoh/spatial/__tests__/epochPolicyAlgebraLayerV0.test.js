import { describe, expect, it } from "vitest";
import {
  EPOCH_POLICY_ALGEBRA_LAYER_SCHEMA_V0,
  VERDICT_COMPOSITION_RULES_V0,
  buildEpochPolicyAlgebraLayerSnapshotV0
} from "../epochPolicyAlgebraLayerV0.js";

describe("epochPolicyAlgebraLayerV0", () => {
  it("defines verdict composition rules", () => {
    expect(VERDICT_COMPOSITION_RULES_V0.map((r) => r.id)).toContain("meet_strictest_wins");
    expect(VERDICT_COMPOSITION_RULES_V0.length).toBeGreaterThanOrEqual(4);
  });

  it("snapshot includes algebra, feedback, and graph", () => {
    const s = buildEpochPolicyAlgebraLayerSnapshotV0();
    expect(s.schema).toBe(EPOCH_POLICY_ALGEBRA_LAYER_SCHEMA_V0);
    expect(s.feedback.classifierToRos).toBeDefined();
    expect(s.dependencyGraph.edges.length).toBeGreaterThan(5);
  });
});
