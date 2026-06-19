import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  commitRuntimeEventToGraphV0,
  flushCausalMapCommitV0,
  rebuildRhizohCausalGraphV0,
  RUNTIME_SUBSTRATE_SOURCE_V0,
  __resetRuntimeEventGraphBridgeForTestV0
} from "../runtimeEventGraphBridgeV0.js";
import {
  __forceTruthTraceEnabledForTestV0,
  __resetTruthTraceForTestV0,
  getTruthTraceByKindV0,
  TRUTH_TRACE_KIND_V0
} from "../rhizohTruthTraceLayerV0.js";
import { buildCausalMapLayerRawV0 } from "../rhizohCausalMapLayerV0.js";
import { __resetExplanationLayerForTestV0 } from "../rhizohExplanationLayerV0.js";

describe("runtimeEventGraphBridgeV0", () => {
  beforeEach(() => {
    __resetTruthTraceForTestV0();
    __forceTruthTraceEnabledForTestV0(true);
    __resetExplanationLayerForTestV0();
    __resetRuntimeEventGraphBridgeForTestV0();
    vi.useFakeTimers();
  });

  it("commits identity and pulse substrate events with causal edges", () => {
    commitRuntimeEventToGraphV0(RUNTIME_SUBSTRATE_SOURCE_V0.IDENTITY, {
      eventType: "turn_bind",
      intent: "navigate"
    });
    commitRuntimeEventToGraphV0(RUNTIME_SUBSTRATE_SOURCE_V0.PULSE, { seq: 15, emitted: true });
    flushCausalMapCommitV0();

    const traces = getTruthTraceByKindV0(TRUTH_TRACE_KIND_V0.RUNTIME_SUBSTRATE);
    expect(traces.length).toBe(2);

    const map = buildCausalMapLayerRawV0();
    const seqEdges = (map.edges || []).filter((e) => e.note === "runtime_substrate_sequence");
    expect(seqEdges.length).toBe(1);
    expect(map.selfNarrative).toContain("runtime substrate: 2");
  });

  it("rebuildRhizohCausalGraphV0 exposes DevTools rebuild API", () => {
    commitRuntimeEventToGraphV0(RUNTIME_SUBSTRATE_SOURCE_V0.PULSE, { seq: 1 });
    const result = rebuildRhizohCausalGraphV0();
    expect(result.ok).toBe(true);
    expect(result.nodeCount).toBeGreaterThanOrEqual(0);
    expect(typeof window.__rhizoh.rebuildCausalGraph).toBe("function");
  });
});
