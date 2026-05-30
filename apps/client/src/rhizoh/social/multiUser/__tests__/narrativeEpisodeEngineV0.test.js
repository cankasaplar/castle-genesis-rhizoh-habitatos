import { describe, expect, it } from "vitest";
import {
  createInitialNarrativeEpisodeEngineStateV0,
  resolveNarrativeEpisodeForPublishV0,
  NARRATIVE_EPISODE_IDENTITY_SCHEMA_V0
} from "../narrativeEpisodeEngineV0.js";

describe("resolveNarrativeEpisodeForPublishV0", () => {
  it("assigns monotonic episode serial across arc changes", () => {
    const e0 = createInitialNarrativeEpisodeEngineStateV0();
    const dist1 = {
      youtubePipelineHint: {
        narrativeArcId: "castle.genesis.arc.ignition.v0",
        defaultEpisodeTitle: "Ignition",
        publishRecommendationScore: 0.7
      }
    };
    const r1 = resolveNarrativeEpisodeForPublishV0(e0, dist1, { episodes: [] }, 10_000);
    expect(r1.episode.schema).toBe(NARRATIVE_EPISODE_IDENTITY_SCHEMA_V0);
    expect(r1.episode.episodeSerial).toBe(1);
    expect(String(r1.episode.episodeDisplayTitle)).toContain("#1");

    const dist2 = {
      youtubePipelineHint: {
        narrativeArcId: "castle.genesis.arc.first_collision.v0",
        defaultEpisodeTitle: "Collision",
        publishRecommendationScore: 0.71
      }
    };
    const r2 = resolveNarrativeEpisodeForPublishV0(r1.nextEngine, dist2, { episodes: [] }, 10_001);
    expect(r2.episode.episodeSerial).toBe(2);
  });

  it("reuses serial within bundle window for same arc", () => {
    const e0 = createInitialNarrativeEpisodeEngineStateV0();
    const arc = "castle.genesis.arc.ignition.v0";
    const dist = {
      youtubePipelineHint: {
        narrativeArcId: arc,
        defaultEpisodeTitle: "Ignition",
        publishRecommendationScore: 0.7
      }
    };
    const r1 = resolveNarrativeEpisodeForPublishV0(e0, dist, { episodes: [] }, 100_000);
    const r2 = resolveNarrativeEpisodeForPublishV0(r1.nextEngine, dist, { episodes: [] }, 100_000 + 60_000);
    expect(r2.episode.episodeSerial).toBe(r1.episode.episodeSerial);
  });
});
