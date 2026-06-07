import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  WORLD_FIRST_OBS_SCHEMA_V0,
  WORLD_FIRST_OBS_STORAGE_V0,
  executeWorldObservationSkipV0,
  isWorldFirstObservationCompleteV0,
  shouldShowWorldObservationGateV0
} from "../worldFirstObservationV0.js";

describe("worldFirstObservationV0", () => {
  /** @type {Record<string, string>} */
  let store;

  beforeEach(() => {
    store = {};
    vi.stubGlobal("localStorage", {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => {
        store[k] = v;
      },
      removeItem: (k) => {
        delete store[k];
      }
    });
    window.__CASTLE_NEXUS_GEO__ = undefined;
    window.__RHIZOH_WORLD_OBS__ = undefined;
    window.__CASTLE_CLIENT_CASTLE_STATE__ = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows gate until complete", () => {
    expect(shouldShowWorldObservationGateV0()).toBe(true);
    expect(isWorldFirstObservationCompleteV0()).toBe(false);
  });

  it("abstract skip completes without castle state", async () => {
    const setRealityMode = vi.fn().mockResolvedValue(undefined);
    const out = await executeWorldObservationSkipV0({ setRealityMode });
    expect(out.ok).toBe(true);
    expect(isWorldFirstObservationCompleteV0()).toBe(true);
    expect(window.__CASTLE_NEXUS_GEO__?.mode).toBe("abstract_world_node");
    expect(window.__CASTLE_CLIENT_CASTLE_STATE__).toBeUndefined();
    const saved = JSON.parse(store[WORLD_FIRST_OBS_STORAGE_V0]);
    expect(saved.schema).toBe(WORLD_FIRST_OBS_SCHEMA_V0);
    expect(saved.mode).toBe("abstract");
    expect(setRealityMode).toHaveBeenCalledWith("GLOBE", expect.objectContaining({ source: "WORLD_FIRST_OBS_ABSTRACT" }));
    expect(window.__RHIZOH_WORLD_OBS__?.phase).toBe("complete");
    expect(window.__CASTLE_PWE__).toBeUndefined();
  });
});
