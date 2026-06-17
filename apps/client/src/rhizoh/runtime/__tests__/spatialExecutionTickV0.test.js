import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  runSpatialExecutionTickOnceV0,
  startSpatialExecutionTickV0,
  stopSpatialExecutionTickV0,
  getSpatialExecutionTickSnapshotV0
} from "../spatialExecutionTickV0.js";
import { __resetCausalGraphSpatialBridgeForTestV0 } from "../causalGraphSpatialBridgeV0.js";
import { __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";
import { __resetSpatialTruthValidatorForTestV0 } from "../spatialTruthValidatorV0.js";
import { __resetSpatialNodeLayerForTestV0, listSpatialNodesV0 } from "../rhizohSpatialNodeLayerV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { __resetSpatialReadyGateForTestV0 } from "../rhizohSpatialReadyGateV0.js";
import { __resetSpatialExecutionGovernorForTestV0 } from "../spatialExecutionGovernorV0.js";

function resetAll() {
  stopSpatialExecutionTickV0();
  __resetSpatialExecutionGovernorForTestV0();
  __resetCausalGraphSpatialBridgeForTestV0();
  __resetSpatialEventEmitterForTestV0();
  __resetSpatialTruthValidatorForTestV0();
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

  it("governor tick consumes graph diff and commits spatial registry", () => {
    window.__rhizoh.causalMap = {
      nodeCount: 2,
      nodes: [
        { id: "n1", kind: "runtime_substrate", label: "pulse", atMs: 1000 },
        { id: "n2", kind: "domain_transition", label: "t0→world", atMs: 2000 }
      ],
      edges: [{ from: "n1", to: "n2" }]
    };

    const tick = runSpatialExecutionTickOnceV0();
    expect(tick.governor?.emitterActivated).toBe(true);
    expect(tick.governor?.emitterTick?.consume?.staged).toBe(2);
    expect(listSpatialNodesV0().length).toBe(2);

    const idle = runSpatialExecutionTickOnceV0();
    expect(idle.governor?.emitterActivated).toBe(false);
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
