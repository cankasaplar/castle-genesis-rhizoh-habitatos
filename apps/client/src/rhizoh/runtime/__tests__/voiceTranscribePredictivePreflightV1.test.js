import { describe, expect, it, beforeEach } from "vitest";
import {
  predictTranscribeRouteV1,
  scoreGatewayWarmReadinessV1,
  noteTranscribeLatencySampleV1,
  resetPredictivePreflightForTestV1
} from "../voiceTranscribePredictivePreflightV1.js";
import { noteGatewaySessionHealthOkV1 } from "../gatewaySessionKeeperV1.js";
import {
  noteTranscribeGatewayConnectV1,
  resetTranscribeCoordinatorForTestV1
} from "../voiceTranscribeSessionCoordinatorV1.js";

describe("voiceTranscribePredictivePreflightV1", () => {
  beforeEach(() => {
    resetPredictivePreflightForTestV1();
    resetTranscribeCoordinatorForTestV1();
    noteGatewaySessionHealthOkV1({ atMs: Date.now() - 15_000 });
    noteTranscribeGatewayConnectV1(Date.now() - 15_000);
  });

  it("scores warm gateway highly after stable connect", () => {
    const warm = scoreGatewayWarmReadinessV1();
    expect(warm.warmScore).toBeGreaterThan(0.6);
    expect(warm.stable).toBe(true);
  });

  it("coerces cold gateway to direct fast before upload", () => {
    noteTranscribeGatewayConnectV1(Date.now());
    const pred = predictTranscribeRouteV1({
      bytes: 123_000,
      recordedMs: 9_500,
      chunkCount: 6,
      warmProbe: { avgWarmScore: 0.25, minWarmScore: 0.2 }
    });
    expect(pred.plan.mode).toBe("direct");
    expect(pred.plan.path).toBe("fast");
    expect(pred.predictiveAction).toBe("coerce_direct_fast");
  });

  it("coerces high latency trend to direct fast", () => {
    for (let i = 0; i < 4; i += 1) {
      noteTranscribeLatencySampleV1({ latencyMs: 14_000, ok: false });
    }
    const pred = predictTranscribeRouteV1({
      bytes: 123_000,
      recordedMs: 9_500,
      chunkCount: 6,
      warmProbe: { avgWarmScore: 0.8, minWarmScore: 0.75 }
    });
    expect(pred.plan.path).toBe("fast");
    expect(pred.latencyRisk).toBe("high");
  });
});
