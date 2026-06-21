import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isRhizohWorldSpacePathV0,
  isV11LeafletMapReadyV0,
  isWorldSpaceMapBootingV0,
  publishV11LeafletReadyV0,
  RHIZOH_V11_LEAFLET_READY_EVENT_V0,
  runAfterV11LeafletReadyV0
} from "../worldSpaceMapBootGateV0.js";

describe("worldSpaceMapBootGateV0", () => {
  beforeEach(() => {
    window.__rhizoh = {};
    history.pushState({}, "", "/world/space");
  });

  afterEach(() => {
    delete window.__rhizoh;
    history.pushState({}, "", "/");
  });

  it("detects world space path", () => {
    expect(isRhizohWorldSpacePathV0()).toBe(true);
    history.pushState({}, "", "/");
    expect(isRhizohWorldSpacePathV0()).toBe(false);
  });

  it("isWorldSpaceMapBootingV0 until leaflet map exists", () => {
    expect(isWorldSpaceMapBootingV0()).toBe(true);
    window.__rhizoh.v11LeafletMap = { setView: () => {} };
    expect(isV11LeafletMapReadyV0()).toBe(true);
    expect(isWorldSpaceMapBootingV0()).toBe(false);
  });

  it("runAfterV11LeafletReadyV0 fires on publish event", () => {
    const fn = vi.fn();
    runAfterV11LeafletReadyV0(fn, { timeoutMs: 50 });
    expect(fn).not.toHaveBeenCalled();
    publishV11LeafletReadyV0({ test: true });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(window.__rhizoh.v11LeafletReady.test).toBe(true);
  });

  it("runAfterV11LeafletReadyV0 runs immediately when map already ready", () => {
    window.__rhizoh.v11LeafletMap = {};
    const fn = vi.fn();
    runAfterV11LeafletReadyV0(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("publishV11LeafletReadyV0 dispatches custom event", () => {
    const handler = vi.fn();
    window.addEventListener(RHIZOH_V11_LEAFLET_READY_EVENT_V0, handler);
    publishV11LeafletReadyV0();
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(RHIZOH_V11_LEAFLET_READY_EVENT_V0, handler);
  });
});
