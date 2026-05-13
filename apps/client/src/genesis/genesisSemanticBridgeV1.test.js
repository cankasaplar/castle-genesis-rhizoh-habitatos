import { describe, expect, it } from "vitest";
import {
  GENESIS_SEMANTIC_BRIDGE_SCHEMA,
  academyHashHref,
  explainContinuityEventType,
  explainHubDiagnosticKind,
  SEMANTIC_ANCHOR
} from "./genesisSemanticBridgeV1.js";

describe("genesisSemanticBridgeV1", () => {
  it("academyHashHref builds stable hash link", () => {
    expect(academyHashHref("tick-advanced")).toBe("/genesis/academy#tick-advanced");
    expect(academyHashHref("#seq")).toBe("/genesis/academy#seq");
  });

  it("explainContinuityEventType maps known SSE kinds", () => {
    const x = explainContinuityEventType("TickAdvanced");
    expect(x.schema).toBe(GENESIS_SEMANTIC_BRIDGE_SCHEMA);
    expect(x.meaning).toBe("temporal_progression");
    expect(x.anchorId).toBe(SEMANTIC_ANCHOR.tickAdvanced);
    expect(x.explanationRef).toContain("tick-advanced");
  });

  it("explainContinuityEventType falls back for unknown type", () => {
    const x = explainContinuityEventType("TotallyUnknown");
    expect(x.anchorId).toBe(SEMANTIC_ANCHOR.continuityUnknown);
  });

  it("explainHubDiagnosticKind maps hub issue classes", () => {
    expect(explainHubDiagnosticKind("health").anchorId).toBe(SEMANTIC_ANCHOR.healthLive);
    expect(explainHubDiagnosticKind("sse").anchorId).toBe(SEMANTIC_ANCHOR.sseErrors);
    expect(explainHubDiagnosticKind("unknown").anchorId).toBe(SEMANTIC_ANCHOR.diagnostics);
  });
});
