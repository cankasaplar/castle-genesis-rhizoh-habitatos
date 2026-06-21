import { describe, expect, it, beforeEach } from "vitest";
import {
  buildMatchmakingApiFacadeV0,
  ensureMatchmakingEngineSurfaceV0,
  getMatchmakingEngineSurfaceV0,
  publishMatchmakingApiFacadeV0,
  resetMatchmakingRuntimeSurfaceForTestV0
} from "../matchmakingRuntimeSurfaceV0.js";

describe("matchmakingRuntimeSurfaceV0", () => {
  beforeEach(() => {
    resetMatchmakingRuntimeSurfaceForTestV0();
    window.__rhizoh = {};
  });

  it("separates frozen window facade from mutable engine surface", () => {
    const engine = ensureMatchmakingEngineSurfaceV0();
    engine.emitBeacon = () => Object.freeze({ ok: true, test: true });
    publishMatchmakingApiFacadeV0(engine, { consoleSchema: "test.schema" });

    expect(Object.isFrozen(window.__rhizoh.matchmaking)).toBe(true);
    expect(window.__rhizoh.matchmaking.contractBoundary).toBe("api_facade_v0");
    expect(Object.isFrozen(getMatchmakingEngineSurfaceV0())).toBe(false);
    expect(window.__rhizoh.matchmaking.emitBeacon({})).toEqual({ ok: true, test: true });
  });

  it("blocks reassignment on frozen facade", () => {
    const engine = ensureMatchmakingEngineSurfaceV0();
    publishMatchmakingApiFacadeV0(engine);
    expect(() => {
      window.__rhizoh.matchmaking.emitBeacon = () => {};
    }).toThrow();
  });

  it("rebuilds facade from engine without mutating frozen object", () => {
    const engine = ensureMatchmakingEngineSurfaceV0();
    engine.tryMatch = () => Object.freeze({ matched: false });
    const first = publishMatchmakingApiFacadeV0(engine);
    engine.tryMatch = () => Object.freeze({ matched: true });
    const second = publishMatchmakingApiFacadeV0(engine);
    expect(first).not.toBe(second);
    expect(window.__rhizoh.matchmaking.tryMatch()).toEqual({ matched: true });
  });

  it("buildMatchmakingApiFacadeV0 delegates nested engine bags", () => {
    const engine = { session: Object.freeze({ get: () => ({ active: true }) }) };
    const facade = buildMatchmakingApiFacadeV0(engine);
    expect(facade.session.get()).toEqual({ active: true });
  });
});
