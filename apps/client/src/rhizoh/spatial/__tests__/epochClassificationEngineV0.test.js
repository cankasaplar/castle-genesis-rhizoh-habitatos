import { describe, expect, it } from "vitest";
import {
  EPOCH_CLASSIFICATION_ENGINE_SCHEMA_V0,
  EPOCH_COMMIT_CLASS_TAXONOMY_V0,
  EPOCH_CLASSIFIER_VERDICTS_V0,
  buildEpochClassificationEngineSnapshotV0
} from "../epochClassificationEngineV0.js";

describe("epochClassificationEngineV0", () => {
  it("defines taxonomy and verdict sets", () => {
    expect(EPOCH_COMMIT_CLASS_TAXONOMY_V0.length).toBeGreaterThanOrEqual(4);
    expect(EPOCH_CLASSIFIER_VERDICTS_V0.map((v) => v.id)).toContain("allow_epoch_bump");
    expect(EPOCH_CLASSIFIER_VERDICTS_V0.map((v) => v.id)).toContain("route_subcounter_only");
  });

  it("snapshot includes five-stage pipeline", () => {
    const s = buildEpochClassificationEngineSnapshotV0();
    expect(s.schema).toBe(EPOCH_CLASSIFICATION_ENGINE_SCHEMA_V0);
    expect(s.pipeline.stages.length).toBe(5);
    expect(s.dependencyGraph.edges.length).toBeGreaterThan(5);
  });
});
