import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getRenderCapabilitySnapshotV0,
  RENDER_CAPABILITY_SCHEMA_V0,
  rhizohObserveAlwaysEnabledV0,
  rhizohWriteEnabledV0
} from "../rhizohRenderCapabilityV0.js";

describe("rhizohRenderCapabilityV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("exposes render-only schema and observe/write invariants", () => {
    expect(rhizohObserveAlwaysEnabledV0()).toBe(true);
    expect(rhizohWriteEnabledV0()).toBe(false);
    const s = getRenderCapabilitySnapshotV0();
    expect(s.schema).toBe(RENDER_CAPABILITY_SCHEMA_V0);
    expect(s.observe).toBe(true);
    expect(s.write).toBe(false);
  });

  it("interact respects VITE_RHIZOH_INTERACT_ENABLED when set to 0", () => {
    vi.stubEnv("VITE_RHIZOH_INTERACT_ENABLED", "0");
    expect(getRenderCapabilitySnapshotV0().interact).toBe(false);
  });
});
