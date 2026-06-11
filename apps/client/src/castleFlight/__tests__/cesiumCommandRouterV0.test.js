import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetRhizohWorldDrawerDomainForTestV0,
  RHIZOH_WORLD_DRAWER_DOMAIN_V0,
  writeRhizohWorldDrawerDomainV0
} from "../../rhizoh/runtime/rhizohWorldDrawerDomainV0.js";
import {
  __flushCesiumFlyCoalesceForTestV0,
  __resetCesiumFlyCoalesceForTestV0,
  __uninstallCesiumCommandBridgeForTestV0,
  installCesiumCommandBridgeV0,
  routeCesiumCommandV0
} from "../../castleFlight/cesiumCommandRouterV0.js";
import {
  __resetCesiumExecutorForTestV0,
  registerCesiumExecutorApiV0
} from "../../castleFlight/cesiumCommandExecutorV0.js";
import { RHIZOH_MAP_COMMAND_EVENT_V0 } from "../../rhizoh/runtime/rhizohLocalCommandHandlersV0.js";
import { dispatchLocalCommandHandlerV0 } from "../../rhizoh/runtime/rhizohLocalCommandHandlersV0.js";

function setTestPathnameV0(pathname) {
  Object.defineProperty(window, "location", {
    value: { pathname, search: "", href: `http://localhost${pathname}` },
    writable: true,
    configurable: true
  });
}

function openWorldDomainSpaceForTestV0() {
  setTestPathnameV0("/world/space");
  writeRhizohWorldDrawerDomainV0(RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE);
}

describe("cesiumCommandRouterV0", () => {
  beforeEach(() => {
    openWorldDomainSpaceForTestV0();
  });

  afterEach(() => {
    __uninstallCesiumCommandBridgeForTestV0();
    __resetCesiumExecutorForTestV0();
    __resetCesiumFlyCoalesceForTestV0();
    __resetRhizohWorldDrawerDomainForTestV0();
  });

  it("routes zoom_in registry payload to executor without flyTo", () => {
    const flyToCustom = vi.fn();
    const zoomByFactor = vi.fn(() => ({ ok: true, height: 800 }));
    registerCesiumExecutorApiV0({ ready: true, flyToCustom, zoomByFactor });

    const result = routeCesiumCommandV0({
      op: "zoom_in",
      source: "registry",
      canonical: "map_zoom_in"
    });

    expect(result.ok).toBe(true);
    expect(zoomByFactor).toHaveBeenCalledOnce();
    expect(flyToCustom).not.toHaveBeenCalled();
  });

  it("bridge handles rhizoh:map-command end-to-end", () => {
    const flyToIstanbul = vi.fn();
    const zoomByFactor = vi.fn(() => ({ ok: true, height: 420 }));
    registerCesiumExecutorApiV0({ ready: true, flyToIstanbul, zoomByFactor });
    installCesiumCommandBridgeV0();

    const routerSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    window.dispatchEvent(
      new CustomEvent(RHIZOH_MAP_COMMAND_EVENT_V0, {
        detail: Object.freeze({
          canonical: "map_zoom_out",
          action: "zoom_out",
          layer: "map",
          handler: "mapSpatialCommandHandlerV0",
          atMs: Date.now()
        })
      })
    );

    expect(zoomByFactor).toHaveBeenCalledOnce();
    expect(flyToIstanbul).not.toHaveBeenCalled();
    expect(routerSpy).toHaveBeenCalledWith(
      "[castle:cesium-router] routed to cesium_executor",
      expect.objectContaining({ op: "zoom_out", canonical: "map_zoom_out" })
    );
    expect(routerSpy).toHaveBeenCalledWith(
      "[rhizoh:map-command]",
      expect.objectContaining({ canonical: "map_zoom_out", action: "zoom_out" })
    );

    routerSpy.mockRestore();
  });

  it("dispatchLocalCommandHandlerV0 map_zoom_in reaches executor when bridge installed", () => {
    const zoomByFactor = vi.fn(() => ({ ok: true, height: 300 }));
    registerCesiumExecutorApiV0({ ready: true, zoomByFactor });
    installCesiumCommandBridgeV0();

    dispatchLocalCommandHandlerV0("map_zoom_in", { traceId: "TRC-TEST" });

    expect(zoomByFactor).toHaveBeenCalledOnce();
  });

  it("maps map_open to bootstrap viewport", () => {
    const zoomByFactor = vi.fn(() => ({ ok: true, height: 300 }));
    const flyToBootstrapViewport = vi.fn();
    registerCesiumExecutorApiV0({ ready: true, zoomByFactor, flyToBootstrapViewport });
    installCesiumCommandBridgeV0();

    window.dispatchEvent(
      new CustomEvent(RHIZOH_MAP_COMMAND_EVENT_V0, {
        detail: Object.freeze({
          canonical: "map_open",
          action: "open",
          layer: "map",
          handler: "mapSpatialCommandHandlerV0",
          atMs: Date.now()
        })
      })
    );

    expect(zoomByFactor).not.toHaveBeenCalled();
    expect(flyToBootstrapViewport).toHaveBeenCalledOnce();
  });

  it("maps center, castle, and room commands to executor ops", () => {
    const flyToIstanbul = vi.fn();
    const focusCastle = vi.fn();
    const focusPOI = vi.fn();
    registerCesiumExecutorApiV0({ ready: true, commandReady: true, flyToIstanbul, focusCastle, focusPOI });
    installCesiumCommandBridgeV0();

    window.dispatchEvent(
      new CustomEvent(RHIZOH_MAP_COMMAND_EVENT_V0, {
        detail: Object.freeze({ canonical: "map_center", action: "center", layer: "map" })
      })
    );
    window.dispatchEvent(
      new CustomEvent(RHIZOH_MAP_COMMAND_EVENT_V0, {
        detail: Object.freeze({ canonical: "castle_enter", action: "enter_castle", layer: "world" })
      })
    );
    window.dispatchEvent(
      new CustomEvent(RHIZOH_MAP_COMMAND_EVENT_V0, {
        detail: Object.freeze({ canonical: "room_library", action: "room_library", layer: "world" })
      })
    );

    __flushCesiumFlyCoalesceForTestV0();
    expect(flyToIstanbul).toHaveBeenCalledOnce();
    expect(focusCastle).toHaveBeenCalledOnce();
    expect(focusPOI).toHaveBeenCalledWith("FATIH");
  });

  it("coalesces rapid calibration_root into one executor call (latest wins)", () => {
    vi.useFakeTimers();
    const flyToIstanbul = vi.fn();
    registerCesiumExecutorApiV0({ ready: true, commandReady: true, flyToIstanbul });

    routeCesiumCommandV0({ op: "calibration_root", source: "a" });
    routeCesiumCommandV0({ op: "calibration_root", source: "b" });
    routeCesiumCommandV0({ op: "calibration_root", source: "c" });

    expect(flyToIstanbul).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(flyToIstanbul).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("blocks spatial ops on T0 live path", () => {
    setTestPathnameV0("/");
    const result = routeCesiumCommandV0({ op: "fly_to", source: "test" });
    expect(result.skipReason).toBe("t0_live_no_map_commands");
  });
});
