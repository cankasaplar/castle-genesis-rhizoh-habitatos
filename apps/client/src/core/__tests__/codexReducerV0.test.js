import { describe, expect, it } from "vitest";
import {
  CODEX_EVENT_TYPE_V0,
  createInitialCodexStateV0,
  foldCodexEventsV0,
  reduceCodexEventV0
} from "../codexReducerV0.js";

describe("codexReducerV0", () => {
  it("AWAKEN increments cycleLayer", () => {
    const next = reduceCodexEventV0(createInitialCodexStateV0(), {
      type: CODEX_EVENT_TYPE_V0.AWAKEN,
      payload: { pin: "europe" }
    });
    expect(next.cycleLayer).toBe(1);
    expect(next.stats.awakenCount).toBe(1);
  });

  it("GHOST_DISPATCH adds ghost and increments totalGhosts", () => {
    const s0 = reduceCodexEventV0(createInitialCodexStateV0(), {
      type: CODEX_EVENT_TYPE_V0.AWAKEN,
      payload: { pin: "europe" }
    });
    const s1 = reduceCodexEventV0(s0, {
      type: CODEX_EVENT_TYPE_V0.GHOST_DISPATCH,
      payload: {
        id: "g1",
        origin: "europe",
        destination: "japan",
        type: "mirror"
      }
    });
    expect(s1.totalGhosts).toBe(1);
    expect(s1.ghosts[0].destination).toBe("japan");
  });

  it("GHOST_ARCHIVED moves ghost to archive", () => {
    const s1 = foldCodexEventsV0([
      {
        type: CODEX_EVENT_TYPE_V0.GHOST_DISPATCH,
        payload: { id: "g1", origin: "a", destination: "b" }
      }
    ]);
    const s2 = reduceCodexEventV0(s1, {
      type: CODEX_EVENT_TYPE_V0.GHOST_ARCHIVED,
      payload: { id: "g1" }
    });
    expect(s2.totalGhosts).toBe(0);
    expect(s2.ghostArchive.length).toBe(1);
  });

  it("foldCodexEventsV0 replays event chain deterministically", () => {
    const state = foldCodexEventsV0([
      { type: CODEX_EVENT_TYPE_V0.AWAKEN, payload: { pin: "europe" } },
      { type: CODEX_EVENT_TYPE_V0.AWAKEN, payload: { pin: "japan" } }
    ]);
    expect(state.cycleLayer).toBe(2);
    expect(state.stats.awakenCount).toBe(2);
  });
});
