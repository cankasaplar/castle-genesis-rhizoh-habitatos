import { describe, it, expect } from "vitest";
import {
  LIVE_RUNTIME_STREAMING_CORE_SCHEMA_V0,
  deriveProjectionHintsV0,
  buildWorldPresenceStateV0,
  clampLiveRuntimeOrchestratorIntervalMsV0
} from "../liveRuntimeStreamingCoreV0.js";

describe("liveRuntimeStreamingCoreV0", () => {
  it("exports stable schema id", () => {
    expect(LIVE_RUNTIME_STREAMING_CORE_SCHEMA_V0).toBe("liveRuntimeStreamingCore.v0");
  });

  it("barrel wires runtime → adapter", () => {
    const s = buildWorldPresenceStateV0();
    const h = deriveProjectionHintsV0(s);
    expect(h.fogDensity).toBeGreaterThanOrEqual(0);
    expect(h.fogDensity).toBeLessThanOrEqual(1);
  });

  it("barrel re-exports temporal clamp", () => {
    expect(clampLiveRuntimeOrchestratorIntervalMsV0(4000)).toBe(4000);
  });
});
