import { describe, expect, it, vi, afterEach } from "vitest";
import {
  getRuntimeClientCapabilitiesSnapshotV0,
  RUNTIME_CLIENT_CAPABILITIES_SCHEMA
} from "./runtimeClientCapabilitiesV0.js";

describe("getRuntimeClientCapabilitiesSnapshotV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("marks world layer off when VITE_WORLD_LAYER=false", () => {
    vi.stubEnv("VITE_WORLD_LAYER", "false");
    const s = /** @type {Record<string, unknown>} */ (getRuntimeClientCapabilitiesSnapshotV0());
    expect(s.schema).toBe(RUNTIME_CLIENT_CAPABILITIES_SCHEMA);
    expect(s.worldLayerEnabled).toBe(false);
    expect(s.cesiumMountable).toBe(false);
  });

  it("marks world layer on when env unset (legacy default)", () => {
    vi.stubEnv("VITE_WORLD_LAYER", "");
    const s = /** @type {Record<string, unknown>} */ (getRuntimeClientCapabilitiesSnapshotV0());
    expect(s.worldLayerEnabled).toBe(true);
  });
});
