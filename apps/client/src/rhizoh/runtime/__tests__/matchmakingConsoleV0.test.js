import { describe, expect, it, beforeEach } from "vitest";
import {
  isMatchmakingConsoleMountedV0,
  mountMatchmakingConsoleV0
} from "../matchmakingConsoleV0.js";
import { clearMatchBeaconRegistryForTestV0 } from "../matchmakingBeaconRegistryV0.js";
import { clearMatchSessionForTestV0 } from "../matchSessionLifecycleV0.js";
import { resetMatchmakingRuntimeSurfaceForTestV0 } from "../matchmakingRuntimeSurfaceV0.js";
import { MATCH_TRUTH_EVENT_V0, getMatchmakingTruthSnapshotV0 } from "../matchmakingTruthKernelV0.js";

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
    expect(typeof window.__rhizoh.traceGraphIndex?.snapshot).toBe("function");
  });

  it("survives double mount from core boot and nervous system", () => {
    mountMatchmakingConsoleV0();
    expect(() => mountMatchmakingConsoleV0()).not.toThrow();
    expect(isMatchmakingConsoleMountedV0()).toBe(true);
    expect(Object.isFrozen(window.__rhizoh.matchmaking)).toBe(true);
    expect(Object.isFrozen(window.__rhizoh.runtimeSurface.matchmaking)).toBe(true);
    expect(window.__rhizoh.matchmaking.truthModel).toBe("event_sourced_reducer_v0");
    expect(typeof window.__rhizoh.matchmaking.truthKernel?.dispatch).toBe("function");
  });

  it("blocks facade property injection after mount", () => {
    mountMatchmakingConsoleV0();
    expect(() => {
      window.__rhizoh.matchmaking.emitBeacon = () => {};
    }).toThrow();
  });

  it("routes beacon emit through truth log", () => {
    mountMatchmakingConsoleV0();
    const out = window.__rhizoh.matchmaking.emitBeacon({
      userId: "user_truth_beacon",
      mode: "KINETIC"
    });
    expect(out.ok).toBe(true);
    const log = window.__rhizoh.matchmaking.truthKernel.log();
    expect(log.entries.some((e) => e.type === MATCH_TRUTH_EVENT_V0.BEACON_EMIT)).toBe(true);
    expect(getMatchmakingTruthSnapshotV0().beaconRegistry?.count).toBeGreaterThan(0);
  });
});
