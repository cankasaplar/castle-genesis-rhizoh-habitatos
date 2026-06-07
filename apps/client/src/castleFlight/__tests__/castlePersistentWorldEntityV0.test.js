import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  CASTLE_INIT_EVENT_V0,
  CASTLE_INIT_SCHEMA_V0
} from "../castleInitiationProtocolV0.js";
import {
  CASTLE_PWE_SCHEMA_V0,
  installCastlePweLifecycleV0,
  patchCastlePweStateV0,
  readCastlePweV0,
  spawnCastlePweFromCreateV0
} from "../castlePersistentWorldEntityV0.js";

describe("castlePersistentWorldEntityV0", () => {
  /** @type {Record<string, string>} */
  let store;

  beforeEach(() => {
    store = {};
    global.window = /** @type {any} */ ({
      localStorage: {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => {
          store[k] = v;
        }
      },
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {}
    });
  });

  afterEach(() => {
    // @ts-expect-error cleanup
    delete global.window;
  });

  const continuity = () => ({
    readClientContinuity: () => {
      try {
        const raw = store["rhizoh.continuity.v1"];
        return raw ? JSON.parse(raw) : { turns: [], persona: {}, meta: {} };
      } catch {
        return { turns: [], persona: {}, meta: {} };
      }
    },
    writeClientContinuity: (disk) => {
      store["rhizoh.continuity.v1"] = JSON.stringify(disk);
    }
  });

  it("spawns always_mounted pet on CASTLE_CREATE geo", () => {
    const deps = continuity();
    installCastlePweLifecycleV0(deps);
    const pwe = spawnCastlePweFromCreateV0(
      {
        source: "gps",
        owner: "user-1",
        castleType: "SANCTUARY",
        anchor: { lat: 41.01, lon: 28.97, source: "gps" }
      },
      deps
    );
    expect(pwe.schema).toBe(CASTLE_PWE_SCHEMA_V0);
    expect(pwe.lifecycle).toBe("always_mounted");
    expect(pwe.destroyed).toBe(false);
    expect(pwe.anchor.mode).toBe("geo");
    expect(readCastlePweV0()?.id).toBe("castle-pwe-user-1");
    const disk = deps.readClientContinuity();
    expect(disk.meta.castlePwe?.mounted).toBe(true);
  });

  it("patches mood without destroying entity", () => {
    const deps = continuity();
    spawnCastlePweFromCreateV0(
      {
        source: "map",
        owner: "guest",
        anchor: { lat: 40, lon: 29, source: "map" }
      },
      deps
    );
    const id = readCastlePweV0()?.id;
    patchCastlePweStateV0({ mood: "sleep", energy: 0.2 }, deps);
    const next = readCastlePweV0();
    expect(next?.id).toBe(id);
    expect(next?.state.mood).toBe("sleep");
    expect(next?.state.energy).toBeCloseTo(0.2);
    expect(next?.destroyed).toBe(false);
  });

  it("abstract spawn has no geo lat/lon", () => {
    const deps = continuity();
    const pwe = spawnCastlePweFromCreateV0(
      {
        source: "abstract",
        owner: "abstract-only",
        anchor: {
          mode: "abstract_world_node",
          calibrationRoot: { lat: 41, lon: 29, id: "cal" }
        }
      },
      deps
    );
    expect(pwe.anchor.mode).toBe("abstract");
    expect(pwe.anchor.lat).toBeNull();
  });

  it("listens to castle create event", () => {
    const deps = continuity();
    const listeners = [];
    window.addEventListener = (name, fn) => {
      if (name === CASTLE_INIT_EVENT_V0) listeners.push(fn);
    };
    installCastlePweLifecycleV0(deps);
    const handler = listeners[0];
    expect(handler).toBeTypeOf("function");
    handler({
      detail: {
        schema: CASTLE_INIT_SCHEMA_V0,
        type: "CASTLE_CREATE",
        source: "abstract",
        owner: "evt-owner",
        anchor: { mode: "abstract_world_node", calibrationRoot: { lat: 41, lon: 29 } }
      }
    });
    expect(readCastlePweV0()?.owner).toBe("evt-owner");
  });
});
