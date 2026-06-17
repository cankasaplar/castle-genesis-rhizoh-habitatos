import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  attachSpatialWorldAdapterV0,
  commitSpatialNodeToWorldV0,
  drainSpatialStreamToWorldV0,
  ensureSpatialWorldAdapterForExecutionV0,
  isSpatialWorldAdapterAttachedV0,
  resolveSpatialNodeGeoV0,
  retryDeferredSpatialCommitsV0,
  spatialNodeKeyV0,
  validateSpatialSinkV0,
  SPATIAL_SINK_MISSING_CODE_V0,
  __resetSpatialWorldAdapterForTestV0
} from "../spatialWorldAdapterV0.js";
import { resolveSpatialSinkProbeV0 } from "../spatialWorldSinkProbeV0.js";
import {
  markCastleAppEngineReadyV0,
  publishIngressRouteV0,
  SPATIAL_SINK_ROUTE_NO_WORLD_CODE_V0
} from "../spatialSinkRoutePolicyV0.js";
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
  delete window.__rhizoh_ingress_phase;
  delete window.__rhizoh_ingress_route;
  window.history.replaceState({}, "", "/");
}

describe("spatialWorldAdapterV0", () => {
  beforeEach(resetAll);
  afterEach(() => {
    delete window.__rhizoh;
    delete window.__CASTLE_NEXUS_GEO__;
    delete window.__CASTLE_CESIUM__;
  });

  it("validates SPATIAL_SINK_MISSING when nodes exist without cesium sink on world space", () => {
    publishIngressRouteV0("app");
    window.history.replaceState({}, "", "/world/space");
    markCastleAppEngineReadyV0("test");
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "n1", {
      kind: "causal_projection",
      spatial_vector: { x: 0.1, y: 0.2, z: 0.9 }
    });
    const sink = validateSpatialSinkV0();
    expect(sink.ok).toBe(false);
    expect(sink.code).toBe(SPATIAL_SINK_MISSING_CODE_V0);
    expect(sink.worldCommittedCount).toBe(0);
    expect(sink.hasCommitSurface).toBe(false);
  });

  it("does not flag sink missing on T0 live route without commit surface", () => {
    publishIngressRouteV0("app");
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "t0-node", {
      kind: "causal_projection"
    });
    const sink = validateSpatialSinkV0();
    expect(sink.ok).toBe(true);
    expect(sink.code).toBe(SPATIAL_SINK_ROUTE_NO_WORLD_CODE_V0);
  });

  it("does not drain on ingress legal_preamble route", () => {
    publishIngressRouteV0("legal_preamble");
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "ingress-node", {
      kind: "causal_projection"
    });
    const out = ensureSpatialWorldAdapterForExecutionV0({
      executionRunning: true,
      emitterActivated: true
    });
    expect(out.drained).toBe(false);
    expect(out.reason).toBe("ingress_no_drain");
  });

  it("does not count deferred executor commits as worldCommitted", () => {
    window.__CASTLE_CESIUM__ = {};
    const row = registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "deferred-node", {
      kind: "causal_projection",
      spatial_vector: { x: 0.1, y: 0.1, z: 1 }
    });

    const out = commitSpatialNodeToWorldV0(row);
    expect(out.deferred).toBe(true);
    expect(out.worldCommitted).toBe(false);

    const sink = validateSpatialSinkV0();
    expect(sink.worldCommittedCount).toBe(0);
    expect(sink.deferredCount).toBe(1);
    expect(sink.committedCount).toBe(0);
    expect(sink.backlog).toBe(1);
  });

  it("retries deferred commits when cesium commit surface registers", () => {
    window.__CASTLE_CESIUM__ = {};
    const row = registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "retry-node", {
      kind: "causal_projection"
    });
    commitSpatialNodeToWorldV0(row);
    expect(validateSpatialSinkV0().deferredCount).toBe(1);

    registerCesiumExecutorApiV0({
      ready: true,
      commandReady: true,
      commitSpatialNode: () => ({ ok: true })
    });

    const retry = retryDeferredSpatialCommitsV0();
    expect(retry.worldCommitted).toBe(1);
    expect(validateSpatialSinkV0().worldCommittedCount).toBe(1);
    expect(validateSpatialSinkV0().deferredCount).toBe(0);
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
    expect(out.worldCommitted).toBe(true);
    expect(commits.length).toBe(1);
  });

  it("publishes worldLayer and sink probe registries", () => {
    validateSpatialSinkV0();
    expect(window.__rhizoh.worldLayer).toBeDefined();
    expect(window.__rhizoh.spatialSinkProbe).toBeDefined();
    const probe = resolveSpatialSinkProbeV0();
    expect(probe.layerMode).toBeDefined();
  });

  it("drainSpatialStreamToWorld is idempotent per world-committed key", () => {
    registerCesiumExecutorApiV0({
      ready: true,
      commandReady: true,
      commitSpatialNode: () => ({ ok: true })
    });
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "dup", { kind: "node" });

    const first = drainSpatialStreamToWorldV0();
    const second = drainSpatialStreamToWorldV0();
    expect(first.worldCommitted).toBe(1);
    expect(second.skipped).toBe(1);
  });

  it("resolveSpatialNodeGeo uses world anchor + vector offset", () => {
    const geo = resolveSpatialNodeGeoV0({
      payload: { spatial_vector: { x: 0.1, y: 0.2, z: 0.5 } }
    });
    expect(geo.lat).toBeGreaterThan(41.04);
    expect(geo.lon).toBeGreaterThan(29.0);
  });
});
