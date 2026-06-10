import { describe, expect, it, beforeEach } from "vitest";
import {
  ARBITRATION_DISPOSITION_V1,
  SOURCE_PRIORITY_V1,
  __resetRealtimeArbitrationForTestV1,
  arbitrateRealtimeV1,
  deriveActiveStreamsV1,
  flushDeferredQueueV1,
  resolveEffectivePriorityV1
} from "../castleRealtimeArbitrationV1.js";
import { SPIKE_TYPE_V1 } from "../castleSpikeEngineV1.js";
import {
  __resetExecutionStateForTestV1,
  beginExecutionV1,
  getExecutionStateV1
} from "../castleExecutionStateV1.js";
import { __resetTemporalCoherenceForTestV1 } from "../castleTemporalCoherenceV1.js";

describe("castleRealtimeArbitrationV1", () => {
  beforeEach(() => {
    __resetRealtimeArbitrationForTestV1();
    __resetExecutionStateForTestV1();
    __resetTemporalCoherenceForTestV1();
  });

  it("emergency preempts running speak execution", () => {
    beginExecutionV1(
      { speak: true, priority: 70, tickId: 1, mode: "co_presence" },
      1000
    );
    const arbitration = arbitrateRealtimeV1({
      actionPlan: { speak: true, priority: 100, mode: "emergency", tickId: 2 },
      spike: { type: SPIKE_TYPE_V1.EMERGENCY, preview: "yardım" },
      atMs: 1100
    });
    expect(arbitration.disposition).toBe(ARBITRATION_DISPOSITION_V1.PREEMPT);
    expect(arbitration.preempted?.suspendedPlan.priority).toBe(70);
    expect(getExecutionStateV1().state).toBe("suspended");
  });

  it("direct address (Rhizoh) gets priority 90", () => {
    const p = resolveEffectivePriorityV1(
      { speak: true, priority: 70 },
      { type: SPIKE_TYPE_V1.SOCIAL_CALL, preview: "Rhizoh dinle" }
    );
    expect(p).toBe(SOURCE_PRIORITY_V1.DIRECT_ADDRESS);
  });

  it("lower priority speak deferred while running", () => {
    beginExecutionV1({ speak: true, priority: 70, tickId: 1 }, 1000);
    const arbitration = arbitrateRealtimeV1({
      actionPlan: { speak: true, priority: 45, tickId: 2, shadowWrite: false },
      spike: { type: SPIKE_TYPE_V1.REFERENCE, preview: "background" },
      atMs: 1050
    });
    expect(arbitration.disposition).toBe(ARBITRATION_DISPOSITION_V1.DEFER);
    expect(arbitration.plan.speak).toBe(false);
  });

  it("starvation flush promotes deferred plan when idle", () => {
    beginExecutionV1({ speak: true, priority: 70, tickId: 1 }, 1000);
    arbitrateRealtimeV1({
      actionPlan: { speak: true, priority: 45, tickId: 2 },
      spike: { type: SPIKE_TYPE_V1.REFERENCE },
      atMs: 1050
    });
    __resetExecutionStateForTestV1();
    const flushed = flushDeferredQueueV1(1000 + 6000);
    expect(flushed?.disposition).toBe(ARBITRATION_DISPOSITION_V1.EXECUTE);
    expect(flushed?.plan.priority).toBeGreaterThan(45);
  });

  it("media timelock defers low-priority speak during co-watch", () => {
    const streams = deriveActiveStreamsV1({
      sourceMass: { youtube: 0.4, mic: 0.1 }
    });
    expect(streams.coWatchActive).toBe(true);
    const arbitration = arbitrateRealtimeV1({
      actionPlan: { speak: true, priority: 45, tickId: 1 },
      spike: { type: SPIKE_TYPE_V1.REFERENCE },
      activeStreams: streams,
      atMs: 1000
    });
    expect(arbitration.disposition).toBe(ARBITRATION_DISPOSITION_V1.DEFER);
  });
});
