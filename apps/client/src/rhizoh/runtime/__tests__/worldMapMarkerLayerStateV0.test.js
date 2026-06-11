import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isWorldMapMarkerLayerAllowedV0,
  listVisibleWorldMapMarkerLayerRowsV0,
  readWorldMapMarkerLayerStateV0,
  writeWorldMapMarkerLayerStateV0
} from "../worldMapMarkerLayerStateV0.js";

function installMemoryStorageV0() {
  const store = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    }
  });
}

describe("worldMapMarkerLayerStateV0", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    installMemoryStorageV0();
  });

  it("defaults to root, active castle, and memory only", () => {
    const state = readWorldMapMarkerLayerStateV0();
    expect(state.systemAnchors).toBe(true);
    expect(state.userCastle).toBe(true);
    expect(state.memoryBeacons).toBe(true);
    expect(state.ghostCastles).toBe(false);
    expect(state.coPresence).toBe(false);
    expect(state.ecosystemNodes).toBe(false);
    expect(state.epistemicPoi).toBe(false);
  });

  it("does not allow placeholder or witness layers through stored state", () => {
    localStorage.setItem(
      "rhizoh.world.map_marker_layers.v0",
      JSON.stringify({
        ghostCastles: true,
        coPresence: true,
        ecosystemNodes: true,
        epistemicPoi: true
      })
    );

    const state = readWorldMapMarkerLayerStateV0();
    expect(state.ghostCastles).toBe(false);
    expect(state.coPresence).toBe(false);
    expect(state.ecosystemNodes).toBe(false);
    expect(state.epistemicPoi).toBe(false);
  });

  it("exposes only state-driven visible rows to the UI filter", () => {
    expect(isWorldMapMarkerLayerAllowedV0("coPresence")).toBe(false);
    expect(isWorldMapMarkerLayerAllowedV0("userCastle")).toBe(true);
    expect(listVisibleWorldMapMarkerLayerRowsV0().map((row) => row.key)).toEqual([
      "systemAnchors",
      "memoryBeacons",
      "userCastle"
    ]);
  });

  it("ignores writes that try to enable disallowed layers", () => {
    const state = writeWorldMapMarkerLayerStateV0({
      coPresence: true,
      ghostCastles: true,
      userCastle: false
    });

    expect(state.coPresence).toBe(false);
    expect(state.ghostCastles).toBe(false);
    expect(state.userCastle).toBe(false);
  });
});
