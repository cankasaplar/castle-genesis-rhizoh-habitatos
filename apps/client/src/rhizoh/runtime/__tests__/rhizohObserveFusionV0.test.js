import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  evaluateObserveFusionV0,
  reconcileObserveFusionV0
} from "../rhizohObserveFusionV0.js";
import { WORLD_FIRST_OBS_STORAGE_V0, WORLD_FIRST_OBS_SCHEMA_V0 } from "../../../castleFlight/worldFirstObservationV0.js";

describe("rhizohObserveFusionV0", () => {
  beforeEach(() => {
    const store = {
      [WORLD_FIRST_OBS_STORAGE_V0]: JSON.stringify({
        schema: WORLD_FIRST_OBS_SCHEMA_V0,
        phase: "complete",
        mode: "abstract"
      })
    };
    const localStorage = {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => {
        store[k] = v;
      },
      removeItem: (k) => {
        delete store[k];
      }
    };
    vi.stubGlobal("window", {
      location: { search: "" },
      __CASTLE_CESIUM__: undefined,
      __RHIZOH_WORLD_OBS__: undefined,
      __RHIZOH_OBSERVATION_FEED__: undefined,
      __CASTLE_PWE__: undefined,
      dispatchEvent: () => true,
      localStorage,
      sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    });
    vi.stubGlobal("localStorage", localStorage);
  });

  it("does not mark companion eligible without map field", () => {
    const snap = evaluateObserveFusionV0({ mapSurfaceActive: true });
    expect(snap.worldReady).toBe(true);
    expect(snap.mapField).toBe(false);
    expect(snap.companionEligible).toBe(false);
  });

  it("spawns companion only when world and map field are open", () => {
    window.__CASTLE_CESIUM__ = {
      ready: true,
      getCameraGeo: () => ({ lat: 41, lon: 29, height: 500 })
    };
    reconcileObserveFusionV0({ mapSurfaceActive: true });
    expect(window.__CASTLE_PWE__?.type).toBe("castle_companion");
    expect(window.__RHIZOH_OBSERVE_FUSION__?.companionEligible).toBe(true);
  });
});
