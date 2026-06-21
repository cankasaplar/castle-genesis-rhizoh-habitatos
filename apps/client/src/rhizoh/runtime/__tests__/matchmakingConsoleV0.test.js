import { describe, expect, it, beforeEach } from "vitest";
import {
  isMatchmakingConsoleMountedV0,
  mountMatchmakingConsoleV0
} from "../matchmakingConsoleV0.js";
import { clearMatchBeaconRegistryForTestV0 } from "../matchmakingBeaconRegistryV0.js";
import { clearMatchSessionForTestV0 } from "../matchSessionLifecycleV0.js";

describe("matchmakingConsoleV0", () => {
  beforeEach(() => {
    clearMatchBeaconRegistryForTestV0();
    clearMatchSessionForTestV0();
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
});
