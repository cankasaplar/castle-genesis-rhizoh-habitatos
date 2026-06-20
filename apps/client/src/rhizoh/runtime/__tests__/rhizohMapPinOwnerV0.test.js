import { describe, expect, it, vi } from "vitest";
import {
  RHIZOH_CESIUM_SESSION_PIN_OWNER_V0,
  filterPinsBySpiralMapLayerV0,
  filterSovereignPinsForSpiralMapViewV0,
  getRhizohMapPinOwnerSnapshotV0,
  installRhizohMapPinOwnerAutoRefreshV0,
  isExplorerOnlyAlwaysVisiblePinV0,
  isPinVisibleForSpiralMapFilterV0,
  readWorldSpaceSessionMapPinRowsV0,
  resolvePinSpiralLayerV0,
  resolveRhizohMapPinSubstrateV0,
  summarizeSessionPinBreakdownV0
} from "../rhizohMapPinOwnerV0.js";
import { PRISM_CUBE_MAP_PIN_EVENT_V0 } from "../cesiumWorldCommitV0.js";
import { ORIGIN_HOME_SERENCEBEY_PIN_ID_V0 } from "../worldMapOriginHomePinV0.js";
import { SPIRAL_MAP_LAYER_V0 } from "../spatialDistributionLayerV0.js";

vi.mock("../rhizohLayerContextV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    resolveRhizohWorldSpaceCesiumActiveV0: vi.fn(() => false)
  };
});

describe("rhizohMapPinOwnerV0", () => {
  it("declares cesiumMapAnchorMarkersV0 as session pin owner", () => {
    const snap = getRhizohMapPinOwnerSnapshotV0({ pathname: "/world/space" });
    expect(snap.cesiumSessionOwner).toBe(RHIZOH_CESIUM_SESSION_PIN_OWNER_V0);
    expect(snap.leafletRenderer).toBe("v11LeafletMarkers");
  });

  it("defaults substrate to leaflet when cesium gate is off", () => {
    expect(
      resolveRhizohMapPinSubstrateV0({
        pathname: "/world/space",
        worldDomain: "space",
        mapTool: "city_map"
      })
    ).toBe("leaflet");
  });

  it("returns sovereign + live match pin rows", () => {
    const rows = readWorldSpaceSessionMapPinRowsV0({
      liveMatchPins: [{ id: "live_1", lat: 1, lon: 2 }],
      spiralLayerFilter: {
        explorer: true,
        castle: true,
        economy: true,
        seasonal: true,
        includeDormant: false
      }
    });
    expect(rows.some((r) => r.id === "live_1")).toBe(true);
    expect(rows.length).toBeGreaterThan(1);
  });

  it("filterPinsBySpiralMapLayerV0 hides non-explorer prism pins by default", () => {
    const pins = [
      { id: "sovereign", lat: 1, lon: 2, type: "hub" },
      { id: "p1", lat: 1, lon: 2, spiralLayer: SPIRAL_MAP_LAYER_V0.EXPLORER },
      { id: "p2", lat: 1, lon: 2, spiralLayer: SPIRAL_MAP_LAYER_V0.CASTLE }
    ];
    const filtered = filterPinsBySpiralMapLayerV0(pins, {
      explorer: true,
      castle: false,
      economy: false,
      seasonal: false,
      includeDormant: false
    });
    expect(filtered.some((p) => p.id === "sovereign")).toBe(false);
    expect(filtered.some((p) => p.id === "p1")).toBe(true);
    expect(filtered.some((p) => p.id === "p2")).toBe(false);
  });

  it("filterSovereignPinsForSpiralMapViewV0 keeps my_castle and origin_home in explorer-only mode", () => {
    const sovereign = [
      { id: "ghost", type: "ghost", lat: 41, lon: 29 },
      { id: "my_castle", type: "castle", lat: 41.01, lon: 29.01 },
      { id: ORIGIN_HOME_SERENCEBEY_PIN_ID_V0, type: "origin_home", lat: 41.0422, lon: 29.0089 }
    ];
    const filtered = filterSovereignPinsForSpiralMapViewV0(sovereign, {
      explorer: true,
      castle: false,
      economy: false,
      seasonal: false,
      includeDormant: false
    });
    expect(filtered).toHaveLength(2);
    expect(filtered.some((p) => p.id === "my_castle")).toBe(true);
    expect(filtered.some((p) => p.id === ORIGIN_HOME_SERENCEBEY_PIN_ID_V0)).toBe(true);
  });

  it("filterPinsBySpiralMapLayerV0 keeps live match pins in explorer-only mode", () => {
    const pins = [
      { id: "live_match:1", type: "broadcast", lat: 41.1, lon: 29.0 },
      { id: "ghost", type: "ghost", lat: 41, lon: 29 },
      { id: "p1", lat: 41.05, lon: 29.01, spiralLayer: SPIRAL_MAP_LAYER_V0.EXPLORER }
    ];
    const filtered = filterPinsBySpiralMapLayerV0(pins, {
      explorer: true,
      castle: false,
      economy: false,
      seasonal: false,
      includeDormant: false
    });
    expect(filtered.some((p) => p.id === "live_match:1")).toBe(true);
    expect(filtered.some((p) => p.id === "ghost")).toBe(false);
    expect(filtered.some((p) => p.id === "p1")).toBe(true);
  });

  it("readWorldSpaceSessionMapPinRowsV0 always includes origin_home Serencebey pin", () => {
    const rows = readWorldSpaceSessionMapPinRowsV0({
      spiralLayerFilter: {
        explorer: true,
        castle: false,
        economy: false,
        seasonal: false,
        includeDormant: false
      }
    });
    expect(rows.some((r) => r.id === ORIGIN_HOME_SERENCEBEY_PIN_ID_V0)).toBe(true);
  });

  it("isExplorerOnlyAlwaysVisiblePinV0 covers castle, origin home, and live match", () => {
    expect(isExplorerOnlyAlwaysVisiblePinV0({ id: "my_castle" })).toBe(true);
    expect(
      isExplorerOnlyAlwaysVisiblePinV0({ id: ORIGIN_HOME_SERENCEBEY_PIN_ID_V0, type: "origin_home" })
    ).toBe(true);
    expect(isExplorerOnlyAlwaysVisiblePinV0({ id: "live_match:x", type: "broadcast" })).toBe(true);
    expect(isExplorerOnlyAlwaysVisiblePinV0({ id: "ghost", type: "ghost" })).toBe(false);
  });

  it("resolvePinSpiralLayerV0 derives layer from towerClass", () => {
    expect(resolvePinSpiralLayerV0({ towerClass: "CHESS" })).toBe(SPIRAL_MAP_LAYER_V0.EXPLORER);
    expect(resolvePinSpiralLayerV0({ towerClass: "MEDIA" })).toBe(SPIRAL_MAP_LAYER_V0.ECONOMY);
  });

  it("filterSovereignPinsForSpiralMapViewV0 keeps castle pair only in castle reality mode", () => {
    const sovereign = [
      { id: "ghost", type: "ghost", lat: 41, lon: 29 },
      { id: "my_castle", type: "castle", lat: 41.01, lon: 29.01 },
      { id: ORIGIN_HOME_SERENCEBEY_PIN_ID_V0, type: "origin_home", lat: 41.0422, lon: 29.0089 },
      { id: "rhizoh_portal", type: "portal", lat: 41.02, lon: 29.02 }
    ];
    const filtered = filterSovereignPinsForSpiralMapViewV0(sovereign, {
      explorer: false,
      castle: true,
      economy: false,
      seasonal: false,
      includeDormant: true,
      realityMode: "castle"
    });
    expect(filtered.some((p) => p.id === "ghost")).toBe(false);
    expect(filtered.some((p) => p.id === "my_castle")).toBe(true);
    expect(filtered.some((p) => p.id === ORIGIN_HOME_SERENCEBEY_PIN_ID_V0)).toBe(true);
    expect(filtered.some((p) => p.id === "rhizoh_portal")).toBe(true);
  });

  it("filterSovereignPinsForSpiralMapViewV0 returns full sovereign mesh in full world mode", () => {
    const sovereign = [
      { id: "ghost", type: "ghost", lat: 41, lon: 29 },
      { id: "my_castle", type: "castle", lat: 41.01, lon: 29.01 }
    ];
    const filtered = filterSovereignPinsForSpiralMapViewV0(sovereign, {
      explorer: true,
      castle: true,
      economy: true,
      seasonal: false,
      includeDormant: true,
      fullWorldMesh: true,
      realityMode: "full_world"
    });
    expect(filtered).toHaveLength(2);
  });

  it("installRhizohMapPinOwnerAutoRefreshV0 republishes on prism pin event", () => {
    const stop = installRhizohMapPinOwnerAutoRefreshV0({ pathname: "/world/space" });
    const before = getRhizohMapPinOwnerSnapshotV0({ pathname: "/world/space" }).sessionPinCount;
    window.dispatchEvent(new CustomEvent(PRISM_CUBE_MAP_PIN_EVENT_V0, { detail: {} }));
    const after = window.__rhizoh?.mapPinOwner?.sessionPinCount;
    expect(typeof after).toBe("number");
    expect(after).toBeGreaterThanOrEqual(before);
    stop();
  });

  it("installRhizohMapPinOwnerAutoRefreshV0 publishes reality mode DevTools with apply", () => {
    installRhizohMapPinOwnerAutoRefreshV0({ pathname: "/world/space" });
    expect(typeof window.__rhizoh?.applySpiralMapRealityModeV0).toBe("function");
    const out = window.__rhizoh.applySpiralMapRealityModeV0("castle");
    expect(out.ok).toBe(true);
    expect(out.mode).toBe("castle");
    expect(out.readBack.castle).toBe(true);
  });

  it("summarizeSessionPinBreakdownV0 splits sovereign vs explorer seeds", () => {
    const rows = [
      { id: "origin_home_serencebey", type: "origin_home" },
      { id: "my_castle", type: "castle" },
      { id: "seed1", spiralLayer: SPIRAL_MAP_LAYER_V0.EXPLORER, populationStatus: "active" },
      { id: "seed2", spiralLayer: SPIRAL_MAP_LAYER_V0.CASTLE, populationStatus: "dormant" }
    ];
    const breakdown = summarizeSessionPinBreakdownV0(rows);
    expect(breakdown.sovereign).toBe(2);
    expect(breakdown.explorer).toBe(1);
    expect(breakdown.castle).toBe(1);
  });

  it("isPinVisibleForSpiralMapFilterV0 hides castle-layer pins in explorer reality", () => {
    const authority = {
      id: "prism_cube:cube-a",
      spiralLayer: SPIRAL_MAP_LAYER_V0.CASTLE,
      towerClass: "AUTHORITY_EPISTEMIC",
      populationStatus: "active"
    };
    const filter = {
      explorer: true,
      castle: false,
      economy: false,
      seasonal: false,
      includeDormant: false,
      realityMode: "explorer"
    };
    expect(isPinVisibleForSpiralMapFilterV0(authority, filter)).toBe(false);
    expect(
      isPinVisibleForSpiralMapFilterV0(authority, {
        ...filter,
        explorer: false,
        castle: true,
        includeDormant: true,
        realityMode: "castle"
      })
    ).toBe(true);
  });
});
