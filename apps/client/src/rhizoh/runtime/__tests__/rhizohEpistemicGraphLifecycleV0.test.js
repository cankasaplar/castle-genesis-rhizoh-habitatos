import { describe, expect, it, beforeEach } from "vitest";
import {
  buildEpistemicGraphLifecyclePlanV0,
  computeEdgeDecayWeightV0,
  isNodeExpiredForLifecycleV0,
  __resetEpistemicGraphLifecycleForTestV0
} from "../rhizohEpistemicGraphLifecycleV0.js";

describe("rhizohEpistemicGraphLifecycleV0", () => {
  beforeEach(() => {
    __resetEpistemicGraphLifecycleForTestV0();
  });

  it("expires stress lens nodes faster than hubs", () => {
    const now = Date.now();
    const lens = { nodeId: "n_lens", kind: "stress_lens", atMs: now - 20 * 60_000 };
    const hub = { nodeId: "n_hub", kind: "stress_run_hub", atMs: now - 20 * 60_000 };
    expect(isNodeExpiredForLifecycleV0(lens, now)).toBe(true);
    expect(isNodeExpiredForLifecycleV0(hub, now)).toBe(false);
  });

  it("decays edge weight toward prune floor", () => {
    const now = Date.now();
    const fresh = computeEdgeDecayWeightV0({ linkKind: "conflict_graph", atMs: now }, now);
    const stale = computeEdgeDecayWeightV0(
      { linkKind: "conflict_graph", atMs: now - 25 * 60_000 },
      now
    );
    expect(fresh).toBeGreaterThan(stale);
    expect(stale).toBe(0);
  });

  it("builds lifecycle prune plan", () => {
    const now = Date.now();
    const plan = buildEpistemicGraphLifecyclePlanV0(
      {
        nodes: [
          { nodeId: "n1", kind: "stress_lens", atMs: now - 30 * 60_000 },
          { nodeId: "n2", kind: "stress_run_hub", atMs: now }
        ],
        edges: [
          {
            edgeId: "e1",
            fromNodeId: "n1",
            toNodeId: "n2",
            linkKind: "conflict_graph",
            atMs: now - 30 * 60_000
          }
        ]
      },
      now
    );
    expect(plan.expiredNodeCount).toBe(1);
    expect(plan.prunedEdgeCount).toBeGreaterThanOrEqual(1);
  });
});
