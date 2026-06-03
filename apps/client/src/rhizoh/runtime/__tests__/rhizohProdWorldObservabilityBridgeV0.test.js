import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  startProdWorldObservabilityBridgeV0,
  resetProdWorldObservabilityBridgeForTestV0,
  primeProdWorldObservabilityBridgeV0,
  publishProdWorldObservabilitySnapshotV0
} from "../rhizohProdWorldObservabilityBridgeV0.js";

describe("rhizohProdWorldObservabilityBridgeV0", () => {
  beforeEach(() => {
    resetProdWorldObservabilityBridgeForTestV0();
    window.__rhizoh = {};
  });

  afterEach(() => {
    resetProdWorldObservabilityBridgeForTestV0();
  });

  it("publishes presenceState and liveMonitor after bridge prime", async () => {
    await primeProdWorldObservabilityBridgeV0();
    expect(window.__rhizoh.presenceState?.rhizoh_is_present).toBe(true);
    expect(window.__rhizoh.continuityFirstPaint?.ok).toBe(true);
    expect(window.__rhizoh.liveMonitor?.schema).toContain("live_monitor");
    expect(window.__rhizoh.deployStatus).toBeDefined();
  });

  it("start publishes sync snapshot before async bootstrap", () => {
    expect(startProdWorldObservabilityBridgeV0().started).toBe(true);
    expect(window.__rhizoh.presenceState?.rhizoh_is_present).toBe(true);
    expect(window.__rhizoh.liveMonitor?.schema).toContain("live_monitor");
    expect(startProdWorldObservabilityBridgeV0().started).toBe(false);
  });

  it("publishProdWorldObservabilitySnapshotV0 sets reslPresentation", () => {
    publishProdWorldObservabilitySnapshotV0();
    expect(window.__rhizoh.reslPresentation?.continuityLine).toBeTruthy();
  });
});
