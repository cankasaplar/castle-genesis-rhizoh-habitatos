import { describe, it, expect } from "vitest";
import {
  composeSpatialProjectionFrameV0,
  composeSpatialProjectionV0,
  SPATIAL_ORCHESTRATOR_SCHEMA_V0
} from "../spatialOrchestratorV0.js";

describe("spatialOrchestratorV0", () => {
  it("composeSpatialProjectionV0 is an alias of composeSpatialProjectionFrameV0 (SER seal name)", () => {
    expect(composeSpatialProjectionV0).toBe(composeSpatialProjectionFrameV0);
  });

  it("composeSpatialProjectionFrameV0 returns hints and optional anchor field", () => {
    const state = {
      schema: "worldPresence.v0",
      atmosphere: { fogDiffusion: 0.4, driftBloom: 0.2, visibilityBudget: 0.7, auraIntensity: 0.5 },
      ambient: { luminosity: 0.5 }
    };
    const frame = composeSpatialProjectionFrameV0({
      worldPresenceState: state,
      cameraLat: 41.0422,
      cameraLon: 29.0075
    });
    expect(frame.schema).toBe(SPATIAL_ORCHESTRATOR_SCHEMA_V0);
    expect(typeof frame.hints.fogDensity).toBe("number");
    expect(frame.anchorFieldDistortion01).not.toBeNull();
    expect(frame.anchorFieldDistortion01).toBeGreaterThanOrEqual(0);
  });

  it("omits anchor field when camera not passed", () => {
    const state = {
      schema: "worldPresence.v0",
      atmosphere: { fogDiffusion: 0.4, driftBloom: 0.2, visibilityBudget: 0.7, auraIntensity: 0.5 },
      ambient: { luminosity: 0.5 }
    };
    const frame = composeSpatialProjectionFrameV0({ worldPresenceState: state });
    expect(frame.anchorFieldDistortion01).toBeNull();
  });
});
