import { describe, expect, it } from "vitest";
import {
  buildYoutubePublishRequestEnvelopeV0,
  shouldEmitYoutubePublishRequestV0,
  YOUTUBE_PUBLISH_REQUEST_SCHEMA_V0
} from "../youtubePublishRequestEmitterV0.js";

describe("shouldEmitYoutubePublishRequestV0", () => {
  it("respects min interval", () => {
    const dist = {
      youtubePipelineHint: { publishRecommendationScore: 0.99 },
      networkDiff: { dirty: true }
    };
    expect(shouldEmitYoutubePublishRequestV0(dist, 100_000, 0, { minIntervalMs: 120_000 })).toBe(false);
    expect(shouldEmitYoutubePublishRequestV0(dist, 200_000, 0, { minIntervalMs: 120_000 })).toBe(true);
  });
});

describe("buildYoutubePublishRequestEnvelopeV0", () => {
  it("includes schema and hint", () => {
    const out = {
      kernel: { frame: 3 },
      globalMerge: { sources: [{ castleId: "a" }] }
    };
    const dist = {
      youtubePipelineHint: { publishRecommendationScore: 0.7 },
      lineage: { kernelSchema: "k" }
    };
    const env = buildYoutubePublishRequestEnvelopeV0(out, dist);
    expect(env.schema).toBe(YOUTUBE_PUBLISH_REQUEST_SCHEMA_V0);
    expect(env.kernelFrame).toBe(3);
    expect(env.globalSourcesCount).toBe(1);
    expect(env.youtubePipelineHint?.publishRecommendationScore).toBe(0.7);
  });

  it("embeds narrativeEpisode when provided", () => {
    const env = buildYoutubePublishRequestEnvelopeV0(
      { kernel: { frame: 1 }, globalMerge: { sources: [] } },
      { youtubePipelineHint: {} },
      { schema: "castle.rhizoh.narrative_episode_identity.v0", episodeSerial: 7, episodeDisplayTitle: "E7" }
    );
    expect(env.narrativeEpisode?.episodeSerial).toBe(7);
  });
});
