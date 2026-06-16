import { describe, expect, it } from "vitest";
import {
  CODEX_EVENT_TYPE_V0,
  createInitialCodexStateV0,
  foldCodexEventsV0,
  normalizeCodexEventTypeV0,
  reduceCodexEventV0
} from "../codexReducerV0.js";
import {
  createInitialSimulationWorldV0,
  foldSimulationWorldEventsV0
} from "../replayWorldReducerV0.js";
import { foldSpawnEventsIntoPatternsV0 } from "../semanticEventFoldV0.js";
import { reconstructFromEventsV0 } from "../ReplayEngineV0.js";

describe("codexReducerV0 aliases", () => {
  it("normalizes GHOST_SPAWN to GHOST_DISPATCH", () => {
    expect(normalizeCodexEventTypeV0("GHOST_SPAWN")).toBe(CODEX_EVENT_TYPE_V0.GHOST_DISPATCH);
    expect(normalizeCodexEventTypeV0("GHOST_DEATH")).toBe(CODEX_EVENT_TYPE_V0.GHOST_ARCHIVED);
  });

  it("DIMENSIONAL_COLLAPSE sets layer and seed", () => {
    const next = reduceCodexEventV0(createInitialCodexStateV0(), {
      type: CODEX_EVENT_TYPE_V0.DIMENSIONAL_COLLAPSE,
      payload: { layer: 3, seed: 99821 }
    });
    expect(next.cycleLayer).toBe(3);
    expect(next.seed).toBe(99821);
    expect(next.stats.collapseCount).toBe(1);
    expect(next.totalGhosts).toBe(0);
  });
});

describe("replayWorldReducerV0", () => {
  it("rebuilds active ghosts from spawn/death events", () => {
    const events = [
      {
        type: "GHOST_SPAWN",
        seq: 1,
        payload: { id: "g1", origin: "europe", destination: "japan" }
      },
      {
        type: "GHOST_SPAWN",
        seq: 2,
        payload: { id: "g2", origin: "africa", destination: "europe" }
      },
      { type: "GHOST_DEATH", seq: 3, payload: { id: "g1" } }
    ];
    const world = foldSimulationWorldEventsV0(events, createInitialSimulationWorldV0());
    expect(world.activeGhosts.length).toBe(1);
    expect(world.activeGhosts[0].id).toBe("g2");
    expect(world.ghostLineage.length).toBeGreaterThan(0);
  });

  it("DIMENSIONAL_COLLAPSE clears active ghosts and sets seed", () => {
    const world = foldSimulationWorldEventsV0(
      [
        { type: "GHOST_DISPATCH", seq: 1, payload: { id: "g1", origin: "a", destination: "b" } },
        { type: "DIMENSIONAL_COLLAPSE", seq: 2, payload: { layer: 4, seed: 123 } }
      ],
      createInitialSimulationWorldV0()
    );
    expect(world.cycleLayer).toBe(4);
    expect(world.seed).toBe(123);
    expect(world.activeGhosts.length).toBe(0);
  });
});

describe("semanticEventFoldV0", () => {
  it("compresses spawns into route patterns", () => {
    const events = Array.from({ length: 5 }, (_, i) => ({
      type: "GHOST_SPAWN",
      seq: i + 1,
      payload: { origin: "europe", destination: "japan", kind: "order" }
    }));
    const folded = foldSpawnEventsIntoPatternsV0(events);
    expect(folded.patternCount).toBe(1);
    expect(folded.patterns[0].spawnCount).toBe(5);
    expect(folded.patterns[0].routeKey).toBe("europe→japan");
  });
});

describe("ReplayEngineV0 reconstructFromEventsV0", () => {
  it("same event stream yields identical world + codex", () => {
    const events = [
      { type: "AWAKEN", seq: 1, payload: { pin: "europe", cycleSeed: 42 } },
      { type: "GHOST_SPAWN", seq: 2, payload: { id: "g1", origin: "europe", destination: "japan" } },
      { type: "DIMENSIONAL_COLLAPSE", seq: 3, payload: { layer: 2, seed: 99 } }
    ];
    const a = reconstructFromEventsV0(events);
    const b = reconstructFromEventsV0(events);
    expect(a.codexState.cycleLayer).toBe(b.codexState.cycleLayer);
    expect(a.world.seed).toBe(b.world.seed);
    expect(a.codexState.behaviorPatterns.length).toBe(b.codexState.behaviorPatterns.length);
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
