import { describe, expect, it, afterEach, vi } from "vitest";
import {
  attachEpistemicTelemetryChannelV1,
  getEpistemicTelemetryShadowCountV1,
  isEpistemicTelemetryChannelAttachedV1,
  pushEpistemicTelemetryShadowV1,
  resetEpistemicTelemetryBarrierForTestV1
} from "../epistemicTelemetryBarrierV1.js";

describe("epistemicTelemetryBarrierV1", () => {
  afterEach(() => {
    resetEpistemicTelemetryBarrierForTestV1();
    vi.unstubAllEnvs();
  });

  it("starts attach_pending until gateway attach", () => {
    expect(isEpistemicTelemetryChannelAttachedV1()).toBe(false);
    pushEpistemicTelemetryShadowV1({ entry: { traceId: "t1" }, idToken: "" });
    expect(getEpistemicTelemetryShadowCountV1()).toBe(1);
  });

  it("attach opens channel and exposes snapshot", () => {
    attachEpistemicTelemetryChannelV1("gateway_connected");
    expect(isEpistemicTelemetryChannelAttachedV1()).toBe(true);
    expect(window.__CASTLE_EPISTEMIC_TELEMETRY_BARRIER__?.channelAttached).toBe(true);
  });
});
