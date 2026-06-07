import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  OBSERVATION_FEED_STATE_V0,
  publishRhizohObservationFeedV0
} from "../rhizohObservationFeedV0.js";

describe("rhizohObservationFeedV0", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { dispatchEvent: () => true });
    delete window.__RHIZOH_OBSERVATION_FEED__;
  });

  it("publishes layer-2 feed state separate from companion", () => {
    const snap = publishRhizohObservationFeedV0({
      state: OBSERVATION_FEED_STATE_V0.ACTIVE,
      boxStreamActive: true,
      source: "test"
    });
    expect(snap.layer).toBe("observation_feed");
    expect(snap.schema).toBe("castle.rhizoh_observation_feed.v0");
    expect(snap.state).toBe("active");
    expect(window.__RHIZOH_OBSERVATION_FEED__.boxStreamActive).toBe(true);
  });
});
