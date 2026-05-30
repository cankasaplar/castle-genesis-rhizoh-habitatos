import { describe, expect, it } from "vitest";
import {
  buildRealEngineGapMapSnapshotV0,
  REAL_ENGINE_GAP_MAP_SCHEMA_V0,
  REAL_ENGINE_STUB_PRIORITY_STACK_V0
} from "../realEngineGapMapV0.js";

describe("realEngineGapMapV0", () => {
  it("ranks nav feed first", () => {
    expect(REAL_ENGINE_STUB_PRIORITY_STACK_V0[0].id).toBe("nav_collision_feed");
    expect(REAL_ENGINE_STUB_PRIORITY_STACK_V0[0].blockedBy.length).toBeGreaterThan(0);
  });

  it("snapshot bundles stack, graph, and minimum path", () => {
    const s = buildRealEngineGapMapSnapshotV0();
    expect(s.schema).toBe(REAL_ENGINE_GAP_MAP_SCHEMA_V0);
    expect(s.priorityStack.length).toBe(REAL_ENGINE_STUB_PRIORITY_STACK_V0.length);
    expect(s.dependencyGraph.edges.length).toBeGreaterThan(4);
    expect(s.minimumPath.phases.length).toBe(4);
  });
});
