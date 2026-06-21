import { describe, expect, it, beforeEach } from "vitest";
import {
  beginMatchmakingEngineMountV0,
  buildMatchmakingApiFacadeV0,
  getMatchmakingEngineSurfaceV0,
  publishMatchmakingApiFacadeV0,
  publishMatchmakingEngineSurfaceV0,
  resetMatchmakingRuntimeSurfaceForTestV0
} from "../matchmakingRuntimeSurfaceV0.js";

describe("matchmakingRuntimeSurfaceV0", () => {
  beforeEach(() => {
    resetMatchmakingRuntimeSurfaceForTestV0();
    window.__rhizoh = {};
  });

  it("separates frozen window facade from frozen engine projection", () => {
    const engine = beginMatchmakingEngineMountV0();
    engine.emitBeacon = () => Object.freeze({ ok: true, test: true });
    const truthKernel = { dispatch: () => ({ ok: true }) };
    publishMatchmakingEngineSurfaceV0(engine, truthKernel);
    publishMatchmakingApiFacadeV0(getMatchmakingEngineSurfaceV0(), { consoleSchema: "test.schema" });

    expect(Object.isFrozen(window.__rhizoh.matchmaking)).toBe(true);
    expect(Object.isFrozen(window.__rhizoh.runtimeSurface.matchmaking)).toBe(true);
    expect(window.__rhizoh.runtimeSurface.matchmaking.executionModel).toBe("event_sourced_reducer_v0");
    expect(window.__rhizoh.matchmaking.emitBeacon({})).toEqual({ ok: true, test: true });
  });

  it("blocks reassignment on frozen facade", () => {
    const engine = beginMatchmakingEngineMountV0();
    publishMatchmakingEngineSurfaceV0(engine, {});
    publishMatchmakingApiFacadeV0(getMatchmakingEngineSurfaceV0());
    expect(() => {
      window.__rhizoh.matchmaking.emitBeacon = () => {};
    }).toThrow();
  });

  it("rebuilds facade from engine without mutating frozen object", () => {
    const engine = beginMatchmakingEngineMountV0();
    engine.tryMatch = () => Object.freeze({ matched: false });
    publishMatchmakingEngineSurfaceV0(engine, {});
    const first = publishMatchmakingApiFacadeV0(getMatchmakingEngineSurfaceV0());
    const bag = beginMatchmakingEngineMountV0();
    bag.tryMatch = () => Object.freeze({ matched: true });
    publishMatchmakingEngineSurfaceV0(bag, {});
    const second = publishMatchmakingApiFacadeV0(getMatchmakingEngineSurfaceV0());
    expect(first).not.toBe(second);
    expect(window.__rhizoh.matchmaking.tryMatch()).toEqual({ matched: true });
  });

  it("buildMatchmakingApiFacadeV0 delegates nested engine bags", () => {
    const engine = { session: Object.freeze({ get: () => ({ active: true }) }) };
    const facade = buildMatchmakingApiFacadeV0(engine);
    expect(facade.session.get()).toEqual({ active: true });
  });
});
