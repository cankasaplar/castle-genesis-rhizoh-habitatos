import { describe, expect, it } from "vitest";
import {
  WORLD_AUTHORITY_LAYER_SCHEMA_V0,
  WORLD_AUTHORITY_SURFACE_STACK_V0,
  buildWorldAuthorityLayerSnapshotV0
} from "../worldAuthorityLayerV0.js";

describe("worldAuthorityLayerV0", () => {
  it("orders scene graph before obstacle stream", () => {
    expect(WORLD_AUTHORITY_SURFACE_STACK_V0[0].id).toBe("scene_graph_ingestion");
    expect(WORLD_AUTHORITY_SURFACE_STACK_V0[1].id).toBe("obstacle_streaming");
  });

  it("snapshot bundles graph and path", () => {
    const s = buildWorldAuthorityLayerSnapshotV0();
    expect(s.schema).toBe(WORLD_AUTHORITY_LAYER_SCHEMA_V0);
    expect(s.dependencyGraph.edges.length).toBeGreaterThan(5);
    expect(s.minimumPath.phases.length).toBe(4);
  });
});
