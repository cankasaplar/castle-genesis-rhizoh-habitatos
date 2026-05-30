import { describe, it, expect, beforeEach } from "vitest";
import {
  recordReplyFormatDriftSampleV0,
  getReplyFormatDriftRollingV0,
  resetReplyFormatDriftTrackerV0
} from "../replyFormatDriftTrackerV0.js";

describe("replyFormatDriftTrackerV0", () => {
  beforeEach(() => resetReplyFormatDriftTrackerV0());

  it("updates rolling EMA from drift samples", () => {
    recordReplyFormatDriftSampleV0({ replyFormatDriftScore: 0.5, replyParsingConfidence: 0.5 });
    const r1 = getReplyFormatDriftRollingV0();
    expect(r1.replyFormatDriftRolling).toBe(0.5);
    expect(r1.sampleCount).toBe(1);

    recordReplyFormatDriftSampleV0({ replyFormatDriftScore: 0, replyParsingConfidence: 1 });
    const r2 = getReplyFormatDriftRollingV0();
    expect(r2.sampleCount).toBe(2);
    expect(r2.replyFormatDriftRolling).toBeGreaterThan(0);
    expect(r2.replyFormatDriftRolling).toBeLessThan(0.5);
  });

  it("ignores invalid drift", () => {
    recordReplyFormatDriftSampleV0({ replyFormatDriftScore: NaN });
    expect(getReplyFormatDriftRollingV0().sampleCount).toBe(0);
  });
});
