import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CASTLE_APP_ENGINE_READY_EVENT_V0,
  markCastleAppEngineReadyV0,
  publishIngressRouteV0,
  resolveSpatialSinkRoutePolicyV0,
  SPATIAL_SINK_ENGINE_DEFERRED_CODE_V0,
  SPATIAL_SINK_ROUTE_NO_WORLD_CODE_V0
} from "../spatialSinkRoutePolicyV0.js";

describe("spatialSinkRoutePolicyV0", () => {
  beforeEach(() => {
    window.__rhizoh = {};
    delete window.__rhizoh_ingress_phase;
    delete window.__rhizoh_ingress_route;
    delete window.__rhizoh_boot_context;
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    delete window.__rhizoh;
    delete window.__rhizoh_ingress_phase;
    delete window.__rhizoh_ingress_route;
    delete window.__rhizoh_boot_context;
  });

  it("marks ingress legal_preamble as sink not expected", () => {
    publishIngressRouteV0("legal_preamble");
    const policy = resolveSpatialSinkRoutePolicyV0();
    expect(policy.sinkExpected).toBe(false);
    expect(policy.drainAllowed).toBe(false);
    expect(policy.warnOnMissing).toBe(false);
    expect(policy.deferCode).toBe(SPATIAL_SINK_ROUTE_NO_WORLD_CODE_V0);
  });

  it("marks T0 live route as deferred world sink", () => {
    publishIngressRouteV0("app");
    const policy = resolveSpatialSinkRoutePolicyV0();
    expect(policy.t0Live).toBe(true);
    expect(policy.sinkExpected).toBe(false);
    expect(policy.drainAllowed).toBe(true);
    expect(policy.deferCode).toBe(SPATIAL_SINK_ROUTE_NO_WORLD_CODE_V0);
  });

  it("expects sink on world space route after engine ready", () => {
    publishIngressRouteV0("app");
    window.history.replaceState({}, "", "/world/space");
    markCastleAppEngineReadyV0("test");
    const policy = resolveSpatialSinkRoutePolicyV0();
    expect(policy.sinkExpected).toBe(true);
    expect(policy.engineReady).toBe(true);
    expect(policy.warnOnMissing).toBe(true);
    expect(policy.deferCode).toBeNull();
  });

  it("defers sink warning until engine ready on world space route", () => {
    publishIngressRouteV0("app");
    window.history.replaceState({}, "", "/world/space");
    const policy = resolveSpatialSinkRoutePolicyV0();
    expect(policy.sinkExpected).toBe(true);
    expect(policy.engineReady).toBe(false);
    expect(policy.warnOnMissing).toBe(false);
    expect(policy.deferCode).toBe(SPATIAL_SINK_ENGINE_DEFERRED_CODE_V0);
  });

  it("dispatches app engine ready event once", () => {
    const seen = [];
    window.addEventListener(CASTLE_APP_ENGINE_READY_EVENT_V0, (ev) => seen.push(ev.detail));
    markCastleAppEngineReadyV0("first");
    markCastleAppEngineReadyV0("second");
    expect(seen.length).toBe(1);
    expect(seen[0].source).toBe("first");
  });
});
