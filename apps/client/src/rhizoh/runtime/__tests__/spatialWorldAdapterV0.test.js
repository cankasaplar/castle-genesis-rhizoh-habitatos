import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  attachSpatialWorldAdapterV0,
  commitSpatialNodeToWorldV0,
  drainSpatialStreamToWorldV0,
  ensureSpatialWorldAdapterForExecutionV0,
  isSpatialWorldAdapterAttachedV0,
  resolveSpatialNodeGeoV0,
  spatialNodeKeyV0,
  validateSpatialSinkV0,
  SPATIAL_SINK_MISSING_CODE_V0,
  __resetSpatialWorldAdapterForTestV0
} from "../spatialWorldAdapterV0.js";
import { registerSpatialNodeV0, SPATIAL_NODE_TIER_V0, __resetSpatialNodeLayerForTestV0 } from "../rhizohSpatialNodeLayerV0.js";
import { __resetCesiumExecutorForTestV0, registerCesiumExecutorApiV0 } from "../../../castleFlight/cesiumCommandExecutorV0.js";
import { __resetSpatialExecutionGovernorForTestV0 } from "../spatialExecutionGovernorV0.js";
import { stopSpatialExecutionTickV0 } from "../spatialExecutionTickV0.js";

function resetAll() {
  stopSpatialExecutionTickV0();
  __resetSpatialWorldAdapterForTestV0();
  __resetSpatialNodeLayerForTestV0();
  __resetCesiumExecutorForTestV0();
  __resetSpatialExecutionGovernorForTestV0();
  window.__rhizoh = {};
  window.__CASTLE_NEXUS_GEO__ = { lat: 41.04, lon: 29.0 };
  delete window.__CASTLE_CESIUM__;
}

describe("spatialWorldAdapterV0", () => {
  beforeEach(resetAll);
  afterEach(() => {
    delete window.__rhizoh;
    delete window.__CASTLE_NEXUS_GEO__;
    delete window.__CASTLE_CESIUM__;
  });

  it("validates SPATIAL_SINK_MISSING when nodes exist without cesium sink", () => {
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "n1", {
      kind: "causal_projection",
      spatial_vector: { x: 0.1, y: 0.2, z: 0.9 }
    });
    const sink = validateSpatialSinkV0();
    expect(sink.ok).toBe(false);
    expect(sink.code).toBe(SPATIAL_SINK_MISSING_CODE_V0);
    expect(sink.sink).toBe("missing");
  });

  it("commits spatial nodes through cesium commit_spatial_node op", () => {
    const commits = [];
    registerCesiumExecutorApiV0({
      ready: true,
      commandReady: true,
      commitSpatialNode(node, meta) {
        commits.push({ node, meta });
        return { ok: true, nodeId: node.id };
      }
    });
    window.__CASTLE_CESIUM__ = { ready: true, commandReady: true };

    const row = registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "causal_n1", {
      kind: "causal_projection",
      spatial_vector: { x: 0.05, y: 0.04, z: 1 }
    });

    const out = commitSpatialNodeToWorldV0(row);
    expect(out.ok).toBe(true);
    expect(commits.length).toBe(1);
    expect(commits[0].node.id).toContain("causal_n1");
  });

  it("attaches stream consumer and drains on execution + emitter active", () => {
    registerCesiumExecutorApiV0({
      ready: true,
      commandReady: true,
      commitSpatialNode: () => ({ ok: true })
    });
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "a", {
      kind: "causal_projection",
      spatial_vector: { x: 0, y: 0, z: 1 }
    });

    attachSpatialWorldAdapterV0();
    expect(isSpatialWorldAdapterAttachedV0()).toBe(true);

    const out = ensureSpatialWorldAdapterForExecutionV0({
      executionRunning: true,
      emitterActivated: true
    });
    expect(out.drained).toBe(true);
    expect(out.drain?.committed).toBe(1);
  });

  it("resolveSpatialNodeGeo uses world anchor + vector offset", () => {
    const geo = resolveSpatialNodeGeoV0({
      payload: { spatial_vector: { x: 0.1, y: 0.2, z: 0.5 } }
    });
    expect(geo.lat).toBeGreaterThan(41.04);
    expect(geo.lon).toBeGreaterThan(29.0);
  });

  it("drainSpatialStreamToWorld is idempotent per node key", () => {
    registerCesiumExecutorApiV0({
      ready: true,
      commandReady: true,
      commitSpatialNode: () => ({ ok: true })
    });
    const row = registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "dup", { kind: "node" });
    expect(spatialNodeKeyV0(row)).toContain("dup");

    const first = drainSpatialStreamToWorldV0();
    const second = drainSpatialStreamToWorldV0();
    expect(first.committed).toBe(1);
    expect(second.skipped).toBe(1);
  });
});
