import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  runSpatialExecutionTickOnceV0,
  startSpatialExecutionTickV0,
  stopSpatialExecutionTickV0,
  getSpatialExecutionTickSnapshotV0
} from "../spatialExecutionTickV0.js";
import {
  __resetCausalGraphSpatialBridgeForTestV0,
  consumeCausalGraphDiffV0
} from "../causalGraphSpatialBridgeV0.js";
import {
  __resetSpatialEventEmitterForTestV0,
  flushSpatialEmitterCommitsV0,
  getSpatialEmitterCommitQueueSnapshotV0
} from "../rhizohSpatialEventEmitterV0.js";
import { __resetSpatialNodeLayerForTestV0, listSpatialNodesV0 } from "../rhizohSpatialNodeLayerV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { __resetSpatialReadyGateForTestV0 } from "../rhizohSpatialReadyGateV0.js";

function resetAll() {
  stopSpatialExecutionTickV0();
  __resetCausalGraphSpatialBridgeForTestV0();
  __resetSpatialEventEmitterForTestV0();
  __resetSpatialNodeLayerForTestV0();
  __resetNervousSystemEventGraphForTestV0();
  __resetSpatialReadyGateForTestV0();
  window.__rhizoh = {};
  window.__CASTLE_NEXUS_GEO__ = { lat: 41.04, lon: 29.0 };
}

describe("spatialExecutionTickV0", () => {
  beforeEach(resetAll);
  afterEach(() => {
    stopSpatialExecutionTickV0();
    delete window.__rhizoh;
    delete window.__CASTLE_NEXUS_GEO__;
  });

  it("consume stages graph diff; tick flush commits to spatial registry", () => {
    window.__rhizoh.causalMap = {
      nodes: [
        { id: "n1", kind: "runtime_substrate", label: "pulse", atMs: 1000 },
        { id: "n2", kind: "domain_transition", label: "t0→world", atMs: 2000 }
      ],
      edges: [{ from: "n1", to: "n2" }]
    };

    const consume = consumeCausalGraphDiffV0();
    expect(consume.staged).toBe(2);
    expect(listSpatialNodesV0().length).toBe(0);
    expect(getSpatialEmitterCommitQueueSnapshotV0().pending).toBe(2);

    const tick = runSpatialExecutionTickOnceV0();
    expect(tick.consume.consumed).toBe(0);
    expect(tick.flush.committed).toBe(2);
    expect(listSpatialNodesV0().length).toBe(2);
    expect(getSpatialEmitterCommitQueueSnapshotV0().pending).toBe(0);
  });

  it("starts idempotent 50ms loop", () => {
    const first = startSpatialExecutionTickV0({ intervalMs: 50 });
    const second = startSpatialExecutionTickV0({ intervalMs: 50 });
    expect(first.started).toBe(true);
    expect(second.already).toBe(true);
    expect(getSpatialExecutionTickSnapshotV0().running).toBe(true);
    stopSpatialExecutionTickV0();
    expect(getSpatialExecutionTickSnapshotV0().running).toBe(false);
  });
});
