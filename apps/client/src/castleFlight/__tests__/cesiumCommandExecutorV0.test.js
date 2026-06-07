import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CESIUM_ZOOM_IN_FACTOR_V0,
  CESIUM_ZOOM_OUT_FACTOR_V0,
  __resetCesiumExecutorForTestV0,
  ensureCastleCesiumApiV0,
  executeCesiumCommandV0,
  isCesiumExecutorCommandReadyV0,
  registerCesiumExecutorApiV0
} from "../cesiumCommandExecutorV0.js";

describe("cesiumCommandExecutorV0", () => {
  afterEach(() => {
    __resetCesiumExecutorForTestV0();
  });

  it("defers zoom when cesium api is not ready", () => {
    const result = executeCesiumCommandV0({ op: "zoom_in", source: "registry" });
    expect(result.deferred).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.skipReason).toBe("cesium_not_ready");
  });

  it("zoom_in mutates camera via zoomByFactor without flyTo", () => {
    const flyToCustom = vi.fn();
    const flyToIstanbul = vi.fn();
    const zoomByFactor = vi.fn((factor) => ({
      ok: true,
      height: 640,
      factor,
      via: "zoomByFactor"
    }));

    registerCesiumExecutorApiV0({
      ready: true,
      flyToCustom,
      flyToIstanbul,
      zoomByFactor
    });

    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const result = executeCesiumCommandV0({
      op: "zoom_in",
      source: "registry",
      canonical: "map_zoom_in"
    });

    expect(result.ok).toBe(true);
    expect(result.op).toBe("zoom_in");
    expect(zoomByFactor).toHaveBeenCalledWith(CESIUM_ZOOM_IN_FACTOR_V0);
    expect(flyToCustom).not.toHaveBeenCalled();
    expect(flyToIstanbul).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      "[castle:cesium-executor] camera mutated via executor",
      expect.objectContaining({ op: "zoom_in", factor: CESIUM_ZOOM_IN_FACTOR_V0 })
    );

    logSpy.mockRestore();
  });

  it("zoom_out uses outbound factor", () => {
    const zoomByFactor = vi.fn(() => ({ ok: true, height: 1200, factor: CESIUM_ZOOM_OUT_FACTOR_V0 }));
    registerCesiumExecutorApiV0({ ready: true, zoomByFactor });

    const result = executeCesiumCommandV0({ op: "zoom_out", source: "registry" });

    expect(result.ok).toBe(true);
    expect(zoomByFactor).toHaveBeenCalledWith(CESIUM_ZOOM_OUT_FACTOR_V0);
  });

  it("drains pending request when api registers ready", () => {
    executeCesiumCommandV0({ op: "zoom_in", source: "registry" });
    const zoomByFactor = vi.fn(() => ({ ok: true, height: 500 }));
    registerCesiumExecutorApiV0({ ready: true, commandReady: true, zoomByFactor });
    expect(zoomByFactor).toHaveBeenCalledOnce();
  });

  it("does not defer when commandReady is true even if ready flips false on same object", () => {
    const api = { ready: true, commandReady: true, zoomByFactor: vi.fn(() => ({ ok: true, height: 400 })) };
    registerCesiumExecutorApiV0(api);
    api.ready = false;
    expect(isCesiumExecutorCommandReadyV0(api)).toBe(true);
    const result = executeCesiumCommandV0({ op: "zoom_in", source: "registry" });
    expect(result.deferred).not.toBe(true);
    expect(result.ok).toBe(true);
  });

  it("defers when commandReady is explicitly false", () => {
    registerCesiumExecutorApiV0({ ready: true, commandReady: false, zoomByFactor: vi.fn() });
    const result = executeCesiumCommandV0({ op: "zoom_in", source: "registry" });
    expect(result.deferred).toBe(true);
    expect(result.skipReason).toBe("cesium_not_ready");
  });

  it("skips unsupported ops", () => {
    registerCesiumExecutorApiV0({ ready: true, zoomByFactor: vi.fn() });
    const result = executeCesiumCommandV0({ op: "center", source: "registry" });
    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe("unsupported_op");
  });

  it("ensure_ready reports commandReady state", () => {
    registerCesiumExecutorApiV0({ ready: true, commandReady: true, zoomByFactor: vi.fn() });
    const ok = executeCesiumCommandV0({ op: "ensure_ready", source: "domain:world" });
    expect(ok.ok).toBe(true);
    expect(ok.skipped).toBe(false);

    registerCesiumExecutorApiV0({ ready: true, commandReady: false, zoomByFactor: vi.fn() });
    const pending = executeCesiumCommandV0({ op: "ensure_ready", source: "domain:world" });
    expect(pending.ok).toBe(false);
    expect(pending.skipReason).toBe("cesium_not_ready");
  });

  it("fly_to uses layer api flyToCustom only inside executor", () => {
    const flyToCustom = vi.fn();
    registerCesiumExecutorApiV0({ ready: true, flyToCustom });

    const result = executeCesiumCommandV0({
      op: "fly_to",
      source: "world_map_tool",
      geo: { lat: 41.01, lon: 28.97, alt: 1180 }
    });

    expect(result.ok).toBe(true);
    expect(flyToCustom).toHaveBeenCalledWith(41.01, 28.97, 1180);
  });

  it("focus_castle routes through executor", () => {
    const focusCastle = vi.fn();
    registerCesiumExecutorApiV0({ ready: true, focusCastle });

    const result = executeCesiumCommandV0({
      op: "focus_castle",
      source: "broadcast_presence"
    });

    expect(result.ok).toBe(true);
    expect(focusCastle).toHaveBeenCalledOnce();
  });

  it("ensureCastleCesiumApiV0 attaches API to window", () => {
    delete window.__CASTLE_CESIUM__;
    Object.assign(ensureCastleCesiumApiV0(), { ready: true, commandReady: true, zoomByFactor: vi.fn(() => ({ ok: true })) });
    registerCesiumExecutorApiV0(undefined);
    expect(window.__CASTLE_CESIUM__?.ready).toBe(true);
    expect(isCesiumExecutorCommandReadyV0()).toBe(true);
    const result = executeCesiumCommandV0({ op: "zoom_in", source: "test" });
    expect(result.deferred).not.toBe(true);
  });
});
