import { describe, expect, it } from "vitest";
import { ingestYouTubeAnalyticsForCoherenceFeedbackV0 } from "../ingestYouTubeAnalyticsForCoherenceFeedbackV0.js";

describe("ingestYouTubeAnalyticsForCoherenceFeedbackV0", () => {
  it("maps analytics to YOUTUBE_METRICS payload", () => {
    const e = ingestYouTubeAnalyticsForCoherenceFeedbackV0({
      viewVelocity01: 0.8,
      averageViewDurationFrac: 0.4,
      commentSentiment01: 0.9
    });
    expect(e.kind).toBe("YOUTUBE_METRICS");
    expect(e.payload.engagement01).toBeGreaterThan(0.5);
    expect(e.payload.viewVelocity01).toBe(0.8);
  });
});
