import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetCommandExecutionGraphForTestV0,
  beginCommandExecutionTraceV0,
  buildCommandExecutionGraphCatalogV0,
  finishCommandExecutionTraceV0,
  readCommandExecutionGraphV0,
  recordExecutionGraphNodeV0
} from "../rhizohCommandExecutionGraphV0.js";

describe("rhizohCommandExecutionGraphV0", () => {
  beforeEach(() => {
    __resetCommandExecutionGraphForTestV0();
  });

  it("records nodes and edges on trace", () => {
    const traceId = "TRC-GRAPH-1";
    beginCommandExecutionTraceV0(traceId, { input: "mute voice" });
    recordExecutionGraphNodeV0(traceId, {
      id: "stt_normalize",
      phase: "stt",
      trigger: "mute voice",
      localAction: true,
      llmFallback: false,
      sideEffects: Object.freeze(["stt"]),
      edgeFrom: "ingress",
      edgeLabel: "stt"
    });
    recordExecutionGraphNodeV0(traceId, {
      id: "local:mute_voice",
      phase: "local_exec",
      trigger: "mute_voice",
      localAction: true,
      llmFallback: false,
      sideEffects: Object.freeze(["state:mute_voice"]),
      edgeFrom: "stt_normalize",
      edgeLabel: "local"
    });
    finishCommandExecutionTraceV0(traceId, { ok: true, execution: "local" });
    const graph = readCommandExecutionGraphV0(traceId);
    expect(graph?.nodes.length).toBe(2);
    expect(graph?.edges.length).toBe(2);
    expect(graph?.nodes[1].localAction).toBe(true);
    expect(graph?.nodes[1].llmFallback).toBe(false);
  });

  it("catalog covers registry commands", () => {
    const catalog = buildCommandExecutionGraphCatalogV0();
    expect(catalog.length).toBeGreaterThanOrEqual(50);
    expect(catalog[0].localAction).toBe(true);
    expect(catalog[0].llmFallback).toBe(false);
  });
});
