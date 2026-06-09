import { describe, expect, it } from "vitest";
import { normalizeTomTomFlowSegmentJsonV0 } from "../trafficIngestV0.js";

describe("trafficIngestV0", () => {
  it("normalizes TomTom flow segment to congestion level", () => {
    const feed = normalizeTomTomFlowSegmentJsonV0({
      flowSegmentData: {
        currentSpeed: 22,
        freeFlowSpeed: 70,
        currentTravelTime: 180,
        freeFlowTravelTime: 90,
        confidence: 0.8,
        roadClosure: false
      }
    });
    expect(feed?.level).toBe("high");
    expect(feed?.intensity).toBeGreaterThan(0.5);
    expect(feed?.currentSpeedKmh).toBe(22);
  });

  it("marks road closure", () => {
    const feed = normalizeTomTomFlowSegmentJsonV0({
      flowSegmentData: {
        currentSpeed: 0,
        freeFlowSpeed: 50,
        currentTravelTime: 0,
        freeFlowTravelTime: 60,
        confidence: 1,
        roadClosure: true
      }
    });
    expect(feed?.level).toBe("closed");
  });
});
