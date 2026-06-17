import { describe, expect, it, beforeEach } from "vitest";
import { CODEX_EVENT_TYPE_V0 } from "../../../core/codexReducerV0.js";
import { bridgeCodexGhostToTruthTraceV0 } from "../codexGhostTruthTraceBridgeV0.js";
import {
  __forceTruthTraceEnabledForTestV0,
  __resetTruthTraceForTestV0,
  getTruthTraceByKindV0,
  TRUTH_TRACE_KIND_V0
} from "../rhizohTruthTraceLayerV0.js";
import { buildCausalMapLayerRawV0 } from "../rhizohCausalMapLayerV0.js";
import { __resetExplanationLayerForTestV0 } from "../rhizohExplanationLayerV0.js";

describe("codexGhostTruthTraceBridgeV0", () => {
  beforeEach(() => {
    __resetTruthTraceForTestV0();
    __forceTruthTraceEnabledForTestV0(true);
    __resetExplanationLayerForTestV0();
  });

  it("records spawn and death traces for codex ghost events", () => {
    bridgeCodexGhostToTruthTraceV0(CODEX_EVENT_TYPE_V0.GHOST_SPAWN, {
      id: "g1",
      origin: "europe",
      destination: "japan"
    });
    bridgeCodexGhostToTruthTraceV0(CODEX_EVENT_TYPE_V0.GHOST_DEATH, {
      ghostId: "g1",
      loc: "japan"
    });

    const rows = getTruthTraceByKindV0(TRUTH_TRACE_KIND_V0.CODEX_GHOST);
    expect(rows).toHaveLength(2);
    expect(rows[0].phase).toBe("spawn");
    expect(rows[0].ghostId).toBe("g1");
    expect(rows[1].phase).toBe("death");
    expect(rows.every((r) => r.influencesExecution === false)).toBe(true);
  });

  it("ignores non-ghost codex events", () => {
    const out = bridgeCodexGhostToTruthTraceV0(CODEX_EVENT_TYPE_V0.AWAKEN, { pin: "europe" });
    expect(out).toBeNull();
    expect(getTruthTraceByKindV0(TRUTH_TRACE_KIND_V0.CODEX_GHOST)).toHaveLength(0);
  });

  it("feeds causal map with spawn→death edge", () => {
    bridgeCodexGhostToTruthTraceV0(CODEX_EVENT_TYPE_V0.GHOST_SPAWN, { id: "cube-7" });
    bridgeCodexGhostToTruthTraceV0(CODEX_EVENT_TYPE_V0.GHOST_DEATH, { ghostId: "cube-7" });

    const map = buildCausalMapLayerRawV0();
    const ghostEdges = (map.edges || []).filter((e) => e.note === "ghost_lifecycle_spawn_to_death");
    expect(ghostEdges).toHaveLength(1);
    expect(map.selfNarrative).toContain("codex ghosts: 2");
  });
});
