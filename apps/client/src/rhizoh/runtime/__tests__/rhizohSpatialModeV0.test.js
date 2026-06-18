import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetRhizohSpatialModeForTestV0,
  buildRhizohComputeSkipSnapshotV0,
  disableCesiumComputeV0,
  isCesiumComputeEnabledV0,
  publishRhizohSpatialModeV0,
  resolveRhizohComputeGateV0,
  resolveRhizohSpatialModeActiveFromSinkV0,
  resolveRhizohSpatialModeV0,
  RHIZOH_SPATIAL_MODE_ALLOWED_V0
} from "../rhizohSpatialModeV0.js";
import { publishIngressRouteV0 } from "../spatialSinkRoutePolicyV0.js";
import { markCastleAppEngineReadyV0 } from "../spatialSinkRoutePolicyV0.js";

describe("rhizohSpatialModeV0", () => {
  beforeEach(() => {
    __resetRhizohSpatialModeForTestV0();
    window.__rhizoh = {};
    publishIngressRouteV0("app");
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    __resetRhizohSpatialModeForTestV0();
    delete window.__rhizoh;
  });

  it("exposes allowed modes and resolves active from sink", () => {
    expect(RHIZOH_SPATIAL_MODE_ALLOWED_V0).toEqual(["leaflet", "cesium"]);
    expect(resolveRhizohSpatialModeActiveFromSinkV0("cesium")).toBe("cesium");
    expect(resolveRhizohSpatialModeActiveFromSinkV0("leaflet")).toBe("leaflet");
    expect(resolveRhizohSpatialModeActiveFromSinkV0("route_no_world_sink")).toBe("leaflet");
  });

  it("compute gate skips when active is leaflet", () => {
    const gate = resolveRhizohComputeGateV0({ spatialMode: { active: "leaflet" } });
    expect(gate.skip).toBe(true);
    expect(gate.reason).toBe("leaflet_mode");
    expect(resolveRhizohComputeGateV0({ spatialMode: { active: "cesium" } }).skip).toBe(false);
  });

  it("publishes spatialMode on window and disables cesium compute for leaflet", () => {
    publishRhizohSpatialModeV0({ sink: "leaflet" });
    expect(window.__rhizoh.spatialMode.active).toBe("leaflet");
    expect(window.__rhizoh.spatialMode.allowed).toEqual(["leaflet", "cesium"]);
    expect(isCesiumComputeEnabledV0()).toBe(false);
    expect(window.__rhizoh.cesiumComputeEnabled).toBe(false);
  });

  it("enables cesium compute when sink is cesium", () => {
    disableCesiumComputeV0();
    publishRhizohSpatialModeV0({ sink: "cesium" });
    expect(window.__rhizoh.spatialMode.active).toBe("cesium");
    expect(isCesiumComputeEnabledV0()).toBe(true);
  });

  it("production skip snapshot is silent", () => {
    vi.stubEnv("VITE_DEBUG", "0");
    const snap = buildRhizohComputeSkipSnapshotV0({ reason: "leaflet_mode" });
    expect(snap.skipped).toBe(true);
    expect(snap.skipReason).toBeUndefined();
    vi.unstubAllEnvs();
  });

  it("debug skip snapshot exposes leaflet_mode_active", () => {
    vi.stubEnv("VITE_DEBUG", "1");
    const snap = buildRhizohComputeSkipSnapshotV0({ reason: "leaflet_mode" });
    expect(snap.skipReason).toBe("leaflet_mode_active");
    expect(snap.debugReason).toBe("leaflet_mode");
    vi.unstubAllEnvs();
  });

  it("engine ready publishes spatial mode from route", () => {
    const mode = resolveRhizohSpatialModeV0({ sink: "route_no_world_sink" });
    expect(mode.active).toBe("leaflet");
    markCastleAppEngineReadyV0("test");
    expect(window.__rhizoh.spatialMode?.active).toBe("leaflet");
  });
});
