import { describe, expect, it } from "vitest";
import {
  evaluateSpatialBootGateV0,
  RHIZOH_SPATIAL_RENDER_MODE_V0
} from "../spatialBootGateV0.js";

describe("spatialBootGateV0", () => {
  it("keeps Cesium off when the spatial feature flag is disabled", () => {
    const gate = evaluateSpatialBootGateV0({
      spatialEnabled: false,
      worldStateReady: true,
      identityReady: true,
      nodes: [{ id: "castle" }]
    });

    expect(gate.allowed).toBe(false);
    expect(gate.renderMode).toBe(RHIZOH_SPATIAL_RENDER_MODE_V0.FALLBACK_V11);
  });

  it("uses an empty canvas before world snapshot exists", () => {
    const gate = evaluateSpatialBootGateV0({
      spatialEnabled: true,
      worldStateReady: false,
      identityReady: true,
      nodes: [{ id: "castle" }]
    });

    expect(gate.allowed).toBe(false);
    expect(gate.renderMode).toBe(RHIZOH_SPATIAL_RENDER_MODE_V0.EMPTY_CANVAS);
  });

  it("does not mount Cesium without identity anchor", () => {
    const gate = evaluateSpatialBootGateV0({
      spatialEnabled: true,
      worldStateReady: true,
      identityReady: false,
      nodes: [{ id: "remote" }]
    });

    expect(gate.allowed).toBe(false);
    expect(gate.renderMode).toBe(RHIZOH_SPATIAL_RENDER_MODE_V0.FALLBACK_V11);
  });

  it("uses safe shell when identity exists but nodes are empty", () => {
    const gate = evaluateSpatialBootGateV0({
      spatialEnabled: true,
      worldStateReady: true,
      identityReady: true,
      nodes: []
    });

    expect(gate.allowed).toBe(false);
    expect(gate.renderMode).toBe(RHIZOH_SPATIAL_RENDER_MODE_V0.SAFE_WORLD_SHELL);
  });

  it("allows Cesium only after all boot guards pass", () => {
    const gate = evaluateSpatialBootGateV0({
      spatialEnabled: true,
      worldStateReady: true,
      identityReady: true,
      nodes: [{ id: "castle" }]
    });

    expect(gate.allowed).toBe(true);
    expect(gate.renderMode).toBe(RHIZOH_SPATIAL_RENDER_MODE_V0.CESIUM_READY);
  });
});
