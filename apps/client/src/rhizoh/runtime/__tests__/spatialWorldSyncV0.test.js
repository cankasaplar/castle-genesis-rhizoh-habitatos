import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isWorldSyncActiveV0,
  isSpatialAdapterAliveV0,
  isSpatialWorldSyncReadyV0,
  getSpatialWorldSyncSnapshotV0
} from "../spatialWorldSyncV0.js";
import {
  __resetGroundingLayerForTestV1,
  noteGroundSignalV1,
  evaluateGroundingV1,
  GROUND_SIGNAL_KIND_V1
} from "../rhizohGroundingLayerV1.js";
import { registerCesiumExecutorApiV0, __resetCesiumExecutorForTestV0 } from "../../../castleFlight/cesiumCommandExecutorV0.js";

describe("spatialWorldSyncV0", () => {
  beforeEach(() => {
    __resetGroundingLayerForTestV1();
    __resetCesiumExecutorForTestV0();
    window.__rhizoh = {};
    window.__CASTLE_NEXUS_GEO__ = { lat: 41.04, lon: 29.0 };
    delete window.__CASTLE_CESIUM__;
  });

  afterEach(() => {
    delete window.__rhizoh;
    delete window.__CASTLE_NEXUS_GEO__;
    delete window.__CASTLE_CESIUM__;
  });

  it("ready = worldSyncActive ∧ adapterAlive (not buffer empty)", () => {
    delete window.__CASTLE_NEXUS_GEO__;
    expect(isWorldSyncActiveV0()).toBe(false);
    expect(isSpatialAdapterAliveV0()).toBe(false);
    expect(isSpatialWorldSyncReadyV0()).toBe(false);

    window.__CASTLE_NEXUS_GEO__ = { lat: 41.04, lon: 29.0 };
    noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.USER_ACTIVITY);
    evaluateGroundingV1({ semanticMass: 0.2, eventLog: { recent: [] } });
    window.__rhizoh.worldSpaceBridge = { ok: true, hydrated: true };

    expect(isWorldSyncActiveV0()).toBe(true);
    expect(isSpatialAdapterAliveV0()).toBe(false);

    registerCesiumExecutorApiV0({ ready: true, commandReady: true });
    window.__CASTLE_CESIUM__ = { ready: true, commandReady: true };

    expect(isSpatialAdapterAliveV0()).toBe(true);
    expect(isSpatialWorldSyncReadyV0()).toBe(true);

    const snap = getSpatialWorldSyncSnapshotV0();
    expect(snap.ready).toBe(true);
    expect(snap.worldSyncActive).toBe(true);
    expect(snap.adapterAlive).toBe(true);
  });
});
