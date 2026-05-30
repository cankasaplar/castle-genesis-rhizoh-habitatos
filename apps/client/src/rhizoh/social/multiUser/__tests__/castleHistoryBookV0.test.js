import { describe, expect, it } from "vitest";
import {
  appendCastleHistoryBookEpisodeV0,
  buildCastleHistoryEpisodeFromDistributorV0,
  CASTLE_HISTORY_BOOK_SCHEMA_V0,
  createInitialCastleHistoryBookV0,
  shouldAppendCastleHistoryEpisodeV0
} from "../castleHistoryBookV0.js";

const mockDist = (patch = {}) => ({
  schema: "castle.rhizoh.global_coherence_output_distributor.v0",
  networkDiff: { dirty: false },
  studioEvent: { fullSnapshotRecommended: false },
  uiSnapshot: { frame: 3, role: "GUIDE", peerCount: 2 },
  youtubePipelineHint: {
    narrativeArcId: "castle.genesis.arc.ignition.v0",
    defaultEpisodeTitle: "Castle Genesis Live — System Initialization",
    publishRecommendationScore: 0.4,
    emotionalDensity01: 0.5
  },
  lineage: { kernelSchema: "k" },
  ...patch
});

describe("shouldAppendCastleHistoryEpisodeV0", () => {
  it("true on dirty network diff", () => {
    expect(shouldAppendCastleHistoryEpisodeV0(mockDist({ networkDiff: { dirty: true } }))).toBe(true);
  });

  it("true when publish score crosses threshold", () => {
    expect(shouldAppendCastleHistoryEpisodeV0(mockDist())).toBe(true);
  });

  it("false on quiet tick", () => {
    expect(
      shouldAppendCastleHistoryEpisodeV0(
        mockDist({
          networkDiff: { dirty: false },
          youtubePipelineHint: { publishRecommendationScore: 0.1, emotionalDensity01: 0.2 }
        })
      )
    ).toBe(false);
  });
});

describe("appendCastleHistoryBookEpisodeV0", () => {
  it("appends episode with bookSeq", () => {
    let book = createInitialCastleHistoryBookV0();
    const ep = buildCastleHistoryEpisodeFromDistributorV0(mockDist());
    expect(ep?.schema).toBeTruthy();
    book = appendCastleHistoryBookEpisodeV0(book, ep);
    expect(book.schema).toBe(CASTLE_HISTORY_BOOK_SCHEMA_V0);
    expect(book.episodes).toHaveLength(1);
    expect(book.episodes[0].bookSeq).toBe(0);
  });
});
