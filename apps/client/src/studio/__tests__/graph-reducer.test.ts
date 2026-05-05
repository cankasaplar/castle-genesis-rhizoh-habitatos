import { describe, expect, it } from "vitest";
import { defaultCausalGraphRegistry } from "../runtime/causalGraph";
import { appendCausalNode } from "../runtime/graphReducer";
import { buildMindTickCausalNode } from "../runtime/mindCausalFactory";
import { defaultMindRuntimeState } from "../runtime/mindRuntime";
import type { CausalNode } from "../types/rskOntology";

describe("graphReducer causal laws", () => {
  it("rejects a cause in the future (tickIndex)", () => {
    const g0 = defaultCausalGraphRegistry();
    const prev = defaultMindRuntimeState();
    const next = { ...prev, internal: { ...prev.internal, entropy: prev.internal.entropy + 0.1 } };
    const good = buildMindTickCausalNode({
      branchId: "branch:main",
      mindInstanceId: "m1",
      tickIndex: 0,
      timestamp: 1,
      actorId: "a",
      causeIds: ["cn:kernel:genesis"],
      prev,
      next,
      inputContext: null
    });
    const g1 = appendCausalNode(g0, good, "m1");
    expect(g1.ok).toBe(true);

    const bad: CausalNode = {
      ...good,
      id: "cn:manual:bad",
      tickIndex: 0,
      causeIds: [good.id]
    };
    const g2 = appendCausalNode(g1.ok ? g1.graph : g0, bad, "m1");
    expect(g2.ok).toBe(false);
    expect(g2.ok ? "" : g2.error).toContain("monotonic");
  });
});
