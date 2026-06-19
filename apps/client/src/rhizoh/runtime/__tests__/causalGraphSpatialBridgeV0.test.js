import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetCausalGraphSpatialBridgeForTestV0,
  bootstrapInternalSemanticMassV0,
  computeCausalMapEntropyV0,
  computeCausalGraphDiffV0,
  consumeCausalGraphDiffV0,
  detectOrphanCausalGraphV0,
  projectCausalNodesToSpatialV0
} from "../causalGraphSpatialBridgeV0.js";
import { __resetSpatialNodeLayerForTestV0, listSpatialNodesV0 } from "../rhizohSpatialNodeLayerV0.js";
import {
  __resetSpatialEventEmitterForTestV0,
  flushSpatialEmitterCommitsV0
} from "../rhizohSpatialEventEmitterV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";

describe("causalGraphSpatialBridgeV0", () => {
  beforeEach(() => {
    __resetCausalGraphSpatialBridgeForTestV0();
    __resetSpatialNodeLayerForTestV0();
    __resetSpatialEventEmitterForTestV0();
    __resetNervousSystemEventGraphForTestV0();
    window.__rhizoh = {};
    window.__CASTLE_NEXUS_GEO__ = { lat: 41.04, lon: 29.0 };
  });

  afterEach(() => {
    delete window.__rhizoh;
    delete window.__CASTLE_NEXUS_GEO__;
  });

  it("computes causal map entropy", () => {
    const e = computeCausalMapEntropyV0({
      nodes: [
        { id: "a", kind: "tensor" },
        { id: "b", kind: "domain" },
        { id: "c", kind: "tensor" }
      ],
      edges: [{ from: "a", to: "b" }]
    });
    expect(e).toBeGreaterThan(0);
  });

  it("consume stages without committing until emitter flush", () => {
    const map = {
      nodes: [{ id: "n1", kind: "runtime_substrate", label: "pulse", atMs: 1000 }],
      edges: []
    };
    const consume = consumeCausalGraphDiffV0({ causalMap: map, force: true });
    expect(consume.staged).toBe(1);
    expect(listSpatialNodesV0().length).toBe(0);

    const flush = flushSpatialEmitterCommitsV0();
    expect(flush.committed).toBe(1);
    expect(listSpatialNodesV0().length).toBe(1);
  });

  it("computeCausalGraphDiffV0 returns only new/changed nodes", () => {
    const map = {
      nodes: [
        { id: "n1", kind: "a", atMs: 100 },
        { id: "n2", kind: "b", atMs: 200 }
      ],
      edges: []
    };
    const first = computeCausalGraphDiffV0(map);
    expect(first.diffCount).toBe(2);
    consumeCausalGraphDiffV0({ causalMap: map });

    const second = computeCausalGraphDiffV0(map);
    expect(second.diffCount).toBe(0);

    map.nodes[0].atMs = 150;
    const third = computeCausalGraphDiffV0(map);
    expect(third.diffCount).toBe(1);
    expect(third.changed.length).toBe(1);
  });

  it("projects causal nodes to spatial registry", () => {
    const map = {
      nodes: [
        { id: "n1", kind: "runtime_substrate", label: "pulse", atMs: 1000 },
        { id: "n2", kind: "domain_transition", label: "t0→world", atMs: 2000 }
      ],
      edges: [{ from: "n1", to: "n2" }]
    };
    const out = projectCausalNodesToSpatialV0(map, { force: true });
    expect(out.projected).toBe(2);
    expect(listSpatialNodesV0().length).toBe(2);
  });

  it("detects orphan causal graph when spatial empty", () => {
    window.__rhizoh.causalMap = { nodeCount: 7, edgeCount: 3 };
    const orphan = detectOrphanCausalGraphV0();
    expect(orphan.orphan).toBe(true);
    expect(orphan.issue).toBe("logically_consistent_physically_unbound");
  });

  it("bootstraps internal semantic mass from causal entropy", () => {
    const mass = bootstrapInternalSemanticMassV0({
      causalMap: {
        nodes: Array.from({ length: 7 }, (_, i) => ({ id: `n${i}`, kind: i % 2 ? "a" : "b" })),
        edges: [{ from: "n0", to: "n1" }, { from: "n1", to: "n2" }]
      },
      currentMass: 0
    });
    expect(mass.bootstrapped).toBe(true);
    expect(mass.mass).toBeGreaterThan(0);
  });
});
