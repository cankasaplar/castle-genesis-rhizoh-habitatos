import { describe, expect, it } from "vitest";
import { ingestYouTubeAnalyticsForCoherenceFeedbackV0 } from "../ingestYouTubeAnalyticsForCoherenceFeedbackV0.js";
import { advanceCoherenceFeedbackStateV0, createInitialCoherenceFeedbackStateV0 } from "../coherenceFeedbackLoopV0.js";
import { DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0 } from "../coherenceFeedbackGovernanceV0.js";
import {
  bridgeAnalyticsSnapshotToCoherenceIngestV0,
  pullYoutubePublisherAnalyticsIntoCoherenceFeedbackV0
} from "../youtubePublisherAnalyticsCoherenceHookV0.js";

describe("bridgeAnalyticsSnapshotToCoherenceIngestV0", () => {
  it("maps bridge keys to ingest shape", () => {
    const raw = bridgeAnalyticsSnapshotToCoherenceIngestV0({
      viewVelocity01: 0.8,
      averageViewDurationFrac: 0.55,
      commentSentiment01: 0.6
    });
    expect(raw?.viewVelocity01).toBe(0.8);
    expect(raw?.averageViewDurationFrac).toBe(0.55);
  });
});

describe("pullYoutubePublisherAnalyticsIntoCoherenceFeedbackV0", () => {
  it("applies snapshot through ingest + advance", async () => {
    let state = createInitialCoherenceFeedbackStateV0();
    let hints = null;
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          viewVelocity01: 0.9,
          averageViewDurationFrac: 0.7,
          commentSentiment01: 0.62
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    const res = await pullYoutubePublisherAnalyticsIntoCoherenceFeedbackV0({
      baseUrl: "http://test.local:9",
      fetchImpl,
      ingestYouTubeAnalyticsForCoherenceFeedbackV0,
      advanceCoherenceFeedbackStateV0,
      getFeedbackState: () => state,
      setFeedbackState: (s) => {
        state = /** @type {typeof state} */ (s);
      },
      setFeedbackKernelHints: (h) => {
        hints = h;
      },
      getGovernance: () => DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0
    });
    expect(res?.applied).toBe(true);
    expect(hints).not.toBeNull();
    expect(state.schema).toBeTruthy();
  });
});
