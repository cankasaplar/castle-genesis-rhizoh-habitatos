import { describe, expect, it, beforeEach } from "vitest";
import {
  isMatchmakingConsoleMountedV0,
  mountMatchmakingConsoleV0
} from "../matchmakingConsoleV0.js";
import { clearMatchBeaconRegistryForTestV0 } from "../matchmakingBeaconRegistryV0.js";
import { clearMatchSessionForTestV0 } from "../matchSessionLifecycleV0.js";
import { resetMatchmakingRuntimeSurfaceForTestV0 } from "../matchmakingRuntimeSurfaceV0.js";

describe("matchmakingConsoleV0", () => {
  beforeEach(() => {
    clearMatchBeaconRegistryForTestV0();
    clearMatchSessionForTestV0();
    resetMatchmakingRuntimeSurfaceForTestV0();
    window.__rhizoh = {};
  });

  it("mounts emitBeacon tryMatch and session APIs", () => {
    const snap = mountMatchmakingConsoleV0();
    expect(snap.ok).toBe(true);
    expect(isMatchmakingConsoleMountedV0()).toBe(true);
    expect(typeof window.__rhizoh.matchmaking.emitBeacon).toBe("function");
    expect(typeof window.__rhizoh.matchmaking.tryMatch).toBe("function");
    expect(typeof window.__rhizoh.matchmaking.session.get).toBe("function");
  });

  it("survives double mount from core boot and nervous system", () => {
    mountMatchmakingConsoleV0();
    expect(() => mountMatchmakingConsoleV0()).not.toThrow();
    expect(isMatchmakingConsoleMountedV0()).toBe(true);
    expect(Object.isFrozen(window.__rhizoh.matchmaking)).toBe(true);
    expect(window.__rhizoh.runtimeSurface?.matchmaking).toBeTruthy();
    expect(Object.isFrozen(window.__rhizoh.runtimeSurface.matchmaking)).toBe(false);
  });

  it("blocks facade property injection after mount", () => {
    mountMatchmakingConsoleV0();
    expect(() => {
      window.__rhizoh.matchmaking.emitBeacon = () => {};
    }).toThrow();
  });

  it("allows emitBeacon after mount without read-only property errors", () => {
    mountMatchmakingConsoleV0();
    const out = window.__rhizoh.matchmaking.emitBeacon({
      userId: "user_test_a",
      mode: "KINETIC",
      timeControlMs: 180000
    });
    expect(out.ok).toBe(true);
    expect(typeof window.__rhizoh.matchmaking.emitBeacon).toBe("function");
  });
});
