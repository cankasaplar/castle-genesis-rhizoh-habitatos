import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  runSpatialExecutionGovernorTickV0,
  evaluateGraphShrinkGuardV0,
  evaluateInternalExternalBalanceV0,
  forceExternalProjectionV0,
  runSpatialEmitterTickV0,
  __resetSpatialExecutionGovernorForTestV0
} from "../spatialExecutionGovernorV0.js";
import {
  __resetCausalGraphSpatialBridgeForTestV0,
  isCausalGraphSpatialBridgeActiveV0
} from "../causalGraphSpatialBridgeV0.js";
import { __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";
import { __resetSpatialTruthValidatorForTestV0 } from "../spatialTruthValidatorV0.js";
import { __resetSpatialNodeLayerForTestV0, listSpatialNodesV0 } from "../rhizohSpatialNodeLayerV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import {
  __resetCausalGraphPruningForTestV0,
  compressCausalGraphV0,
  isCausalGraphPruningDisabledV0
} from "../rhizohCausalGraphCompressionV0.js";
import {
  __resetGroundingLayerForTestV1,
  evaluateGroundingV1
} from "../rhizohGroundingLayerV1.js";

function resetAll() {
  __resetSpatialExecutionGovernorForTestV0();
  __resetCausalGraphSpatialBridgeForTestV0();
  __resetSpatialEventEmitterForTestV0();
  __resetSpatialTruthValidatorForTestV0();
  __resetSpatialNodeLayerForTestV0();
  __resetNervousSystemEventGraphForTestV0();
  __resetCausalGraphPruningForTestV0();
  __resetGroundingLayerForTestV1();
  window.__rhizoh = {};
  window.__CASTLE_NEXUS_GEO__ = { lat: 41.04, lon: 29.0 };
}

describe("spatialExecutionGovernorV0", () => {
  beforeEach(resetAll);
  afterEach(() => {
    delete window.__rhizoh;
    delete window.__CASTLE_NEXUS_GEO__;
  });

  it("activates spatial emitter when bridge active and graph diff exists", () => {
    window.__rhizoh.causalMap = {
      nodeCount: 2,
      nodes: [
        { id: "n1", kind: "runtime_substrate", label: "pulse", atMs: 1000 },
        { id: "n2", kind: "domain_transition", label: "t0→world", atMs: 2000 }
      ],
      edges: []
    };
    expect(isCausalGraphSpatialBridgeActiveV0()).toBe(true);

    const first = runSpatialExecutionGovernorTickV0();
    expect(first.emitterActivated).toBe(true);
    expect(first.emitterTick?.consume?.staged).toBe(2);
    expect(listSpatialNodesV0().length).toBe(2);

    const idle = runSpatialExecutionGovernorTickV0();
    expect(idle.emitterActivated).toBe(false);
    expect(idle.emitterTick?.reason).toBe("empty_graph_diff");
  });

  it("disables pruning when node count shrinks below 90%", () => {
    evaluateGraphShrinkGuardV0(100);
    expect(isCausalGraphPruningDisabledV0()).toBe(false);

    const guard = evaluateGraphShrinkGuardV0(80);
    expect(guard.shrinkDetected).toBe(true);
    expect(isCausalGraphPruningDisabledV0()).toBe(true);

    const raw = {
      nodes: Array.from({ length: 80 }, (_, i) => ({
        id: `n_${i}`,
        kind: "temporal_trail",
        atMs: i
      })),
      edges: []
    };
    const out = compressCausalGraphV0(raw, { maxNodes: 16 });
    expect(out.stats.pruningDisabled).toBe(true);
    expect(out.stats.outputNodes).toBe(80);
  });

  it("forces external projection when internal mass high and spatial empty", () => {
    window.__rhizoh.causalMap = {
      nodeCount: 3,
      nodes: [
        { id: "a", kind: "tensor", label: "t1", atMs: 1 },
        { id: "b", kind: "domain", label: "d1", atMs: 2 },
        { id: "c", kind: "tensor", label: "t2", atMs: 3 }
      ],
      edges: []
    };

    evaluateGroundingV1({ semanticMass: 1.5, eventLog: { recent: [] } });
    const balance = evaluateInternalExternalBalanceV0();
    expect(balance.imbalance).toBe(true);
    expect(balance.forced).toBe(true);
    expect(listSpatialNodesV0().length).toBeGreaterThan(0);
  });

  it("runSpatialEmitterTick stages then flush commits", () => {
    window.__rhizoh.causalMap = {
      nodeCount: 1,
      nodes: [{ id: "solo", kind: "runtime_substrate", label: "pulse", atMs: 500 }],
      edges: []
    };
    const tick = runSpatialEmitterTickV0();
    expect(tick.consume?.staged).toBe(1);
    expect(listSpatialNodesV0().length).toBe(1);
  });

  it("forceExternalProjection projects all causal nodes", () => {
    window.__rhizoh.causalMap = {
      nodeCount: 2,
      nodes: [
        { id: "x", kind: "tensor", label: "t1", atMs: 10 },
        { id: "y", kind: "tensor", label: "t2", atMs: 20 }
      ],
      edges: []
    };
    const out = forceExternalProjectionV0();
    expect(out.forced).toBe(true);
    expect(listSpatialNodesV0().length).toBe(2);
  });
});
