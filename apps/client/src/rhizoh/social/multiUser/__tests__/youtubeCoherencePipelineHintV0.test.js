import { describe, expect, it } from "vitest";
import {
  CASTLE_YOUTUBE_NARRATIVE_ARC_V0,
  buildYoutubeCoherencePipelineHintV0,
  suggestNarrativeArcIdForGenesisV0
} from "../youtubeCoherencePipelineHintV0.js";

describe("suggestNarrativeArcIdForGenesisV0", () => {
  it("defaults to genesis ignition", () => {
    expect(suggestNarrativeArcIdForGenesisV0({ frame: 0, sourcesCount: 0 })).toBe(
      CASTLE_YOUTUBE_NARRATIVE_ARC_V0.GENESIS_IGNITION
    );
  });

  it("selects first collision when conflict and frame threshold", () => {
    expect(suggestNarrativeArcIdForGenesisV0({ frame: 3, sourcesCount: 1, socialConflict: true })).toBe(
      CASTLE_YOUTUBE_NARRATIVE_ARC_V0.FIRST_SOCIAL_COLLISION
    );
  });

  it("selects multi-castle emergence with sources + multi", () => {
    expect(
      suggestNarrativeArcIdForGenesisV0({ frame: 5, sourcesCount: 2, multiUserPeers: true })
    ).toBe(CASTLE_YOUTUBE_NARRATIVE_ARC_V0.MULTI_CASTLE_EMERGENCE);
  });
});

describe("buildYoutubeCoherencePipelineHintV0", () => {
  it("emits sensor-shaped hint for studio / director", () => {
    const h = buildYoutubeCoherencePipelineHintV0({
      kernel: {
        layers: { csil: { socialConflictFlag: false } }
      },
      globalMerge: { sources: ["c1", "c2"], driftGuard: { fullSnapshotRecommended: false } },
      networkPulse: {
        socialPulse: {
          coherenceFrame: 2,
          modeHint: "IDLE",
          rhizohRuntimeRole: "GUIDE",
          focusUserId: null,
          energyHint01: 0.55
        }
      },
      networkDiff: { dirty: true },
      uiSnapshot: { peerCount: 2, role: "GUIDE" }
    });
    expect(h.narrativeArcId).toBeTruthy();
    expect(h.roleSignature).toContain("GUIDE");
    expect(typeof h.emotionalDensity01).toBe("number");
    expect(typeof h.publishRecommendationScore).toBe("number");
    expect(h.publishRecommendationScore).toBeGreaterThan(0.2);
    expect(h.sensorMode).toBe("observation_and_feedback");
    expect(h.defaultEpisodeTitle).toContain("Castle Genesis");
  });
});
