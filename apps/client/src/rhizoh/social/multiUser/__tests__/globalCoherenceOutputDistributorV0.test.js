import { describe, expect, it } from "vitest";
import {
  GLOBAL_COHERENCE_OUTPUT_DISTRIBUTOR_SCHEMA_V0,
  YOUTUBE_GLOBAL_COHERENCE_HINT_SCHEMA_V0,
  distributeGlobalCoherenceKernelOutputV0
} from "../globalCoherenceOutputDistributorV0.js";

const mockBridge = (patch = {}) => ({
  schema: "castle.rhizoh.global_coherence_kernel_bridge.v0",
  globalMerge: {
    schema: "castle.rhizoh.global_castle_diff_reducer.v0",
    sources: ["a", "b"],
    driftGuard: { fullSnapshotRecommended: false, reason: "within_delta_budget" }
  },
  kernel: {
    schema: "castle.rhizoh.social_coherence_kernel.v0",
    frame: 7,
    snapshotForUi: { role: "GUIDE", peerCount: 2, frame: 7 },
    snapshotForLlm: { frame: 7, wsRoomKey: "global:coherence" },
    snapshotForNetwork: {
      frame: 7,
      socialPulse: {
        coherenceFrame: 7,
        energyHint01: 0.5,
        modeHint: "IDLE",
        rhizohRuntimeRole: "GUIDE",
        focusUserId: null,
        wsRoomSeq: 9
      }
    }
  },
  ...patch
});

describe("distributeGlobalCoherenceKernelOutputV0", () => {
  it("maps bridge output into ui / llm / network / studio (+ diff)", () => {
    const prev = {
      frame: 6,
      socialPulse: { coherenceFrame: 6, energyHint01: 0.4, modeHint: "IDLE", rhizohRuntimeRole: "GUIDE", focusUserId: null, wsRoomSeq: 8 }
    };
    const d = distributeGlobalCoherenceKernelOutputV0(mockBridge(), prev, null);
    expect(d.schema).toBe(GLOBAL_COHERENCE_OUTPUT_DISTRIBUTOR_SCHEMA_V0);
    expect(d.uiSnapshot?.role).toBe("GUIDE");
    expect(d.llmSnapshot?.wsRoomKey).toBe("global:coherence");
    expect(d.networkPulse?.socialPulse?.energyHint01).toBe(0.5);
    expect(d.networkDiff?.dirty).toBe(true);
    expect(d.studioEvent?.sources).toEqual(["a", "b"]);
    expect(d.studioEvent?.frame).toBe(7);
    expect(d.lineage?.kernelSchema).toBeTruthy();
  });

  it("adds youtube hint when requested", () => {
    const d = distributeGlobalCoherenceKernelOutputV0(mockBridge(), null, { includeYoutubeHint: true });
    expect(d.youtubePipelineHint?.schema).toBe(YOUTUBE_GLOBAL_COHERENCE_HINT_SCHEMA_V0);
    expect(String(d.youtubePipelineHint?.titleSeed || "")).toContain("GUIDE");
    expect(d.youtubePipelineHint?.narrativeArcId).toBeTruthy();
    expect(typeof d.youtubePipelineHint?.publishRecommendationScore).toBe("number");
    expect(typeof d.youtubePipelineHint?.emotionalDensity01).toBe("number");
    expect(d.youtubePipelineHint?.sensorMode).toBe("observation_and_feedback");
  });

  it("tolerates empty bridge", () => {
    const d = distributeGlobalCoherenceKernelOutputV0(null, null, null);
    expect(d.uiSnapshot).toBeNull();
    expect(d.studioEvent?.frame).toBeNull();
  });
});
