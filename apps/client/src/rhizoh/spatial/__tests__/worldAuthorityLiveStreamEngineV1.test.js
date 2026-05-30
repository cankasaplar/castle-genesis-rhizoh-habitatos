import { describe, expect, it } from "vitest";
import {
  WORLD_AUTHORITY_LIVE_STREAM_ENGINE_SCHEMA_V1,
  WAL_LIVE_STREAM_ENGINE_PILLARS_V1,
  buildWorldAuthorityLiveStreamEngineSnapshotV1
} from "../worldAuthorityLiveStreamEngineV1.js";

describe("worldAuthorityLiveStreamEngineV1", () => {
  it("defines four live stream pillars", () => {
    expect(WAL_LIVE_STREAM_ENGINE_PILLARS_V1).toHaveLength(4);
    expect(WAL_LIVE_STREAM_ENGINE_PILLARS_V1.map((p) => p.id)).toEqual([
      "continuous_scene_streaming",
      "real_obstacle_delta_diffing",
      "multi_world_conflict_arbitration",
      "deterministic_world_snapshots"
    ]);
  });

  it("snapshot bundles graph and stream path", () => {
    const s = buildWorldAuthorityLiveStreamEngineSnapshotV1();
    expect(s.schema).toBe(WORLD_AUTHORITY_LIVE_STREAM_ENGINE_SCHEMA_V1);
    expect(s.dependencyGraph.edges.length).toBeGreaterThan(6);
    expect(s.streamPath.phases.length).toBe(4);
  });
});
