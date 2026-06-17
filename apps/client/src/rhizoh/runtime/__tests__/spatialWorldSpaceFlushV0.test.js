import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { flushSpatialBufferToWorldSpaceV0 } from "../spatialWorldSpaceFlushV0.js";
import {
  enqueuePreReadySpatialEventV0,
  __resetSpatialReadyGateForTestV0,
  getSpatialReadyGateSnapshotV0
} from "../rhizohSpatialReadyGateV0.js";
import { emitSpatialEventImmediateV0, __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";
import { __resetSpatialNodeLayerForTestV0, listSpatialNodesV0 } from "../rhizohSpatialNodeLayerV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { __resetGroundingLayerForTestV1, noteGroundSignalV1, GROUND_SIGNAL_KIND_V1 } from "../rhizohGroundingLayerV1.js";
import { RHIZOH_DOMAIN_ID_V0 } from "../rhizohDomainCoreStoreV0.js";
import { SPATIAL_NODE_TIER_V0 } from "../rhizohSpatialNodeLayerV0.js";

describe("spatialWorldSpaceFlushV0", () => {
  beforeEach(() => {
    __resetSpatialReadyGateForTestV0();
    __resetSpatialEventEmitterForTestV0();
    __resetSpatialNodeLayerForTestV0();
    __resetNervousSystemEventGraphForTestV0();
    __resetGroundingLayerForTestV1();
    window.__rhizoh = {};
  });

  afterEach(() => {
    delete window.__rhizoh;
  });

  it("force-flushes buffered spatial events when world anchored", () => {
    noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.USER_ACTIVITY);
    enqueuePreReadySpatialEventV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.LIVE,
      nodeId: "buf-node",
      kind: "avatar"
    });
    expect(getSpatialReadyGateSnapshotV0().buffered).toBe(1);

    const out = flushSpatialBufferToWorldSpaceV0({ force: true, emitImmediate: emitSpatialEventImmediateV0 });
    expect(out.drained).toBe(1);
    expect(listSpatialNodesV0().length).toBe(1);
    expect(getSpatialReadyGateSnapshotV0().buffered).toBe(0);
  });
});
