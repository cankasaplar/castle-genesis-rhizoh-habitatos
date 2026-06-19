import { beforeEach, describe, expect, it } from "vitest";
import {
  resolveAdaptiveClusterEngineOptsV0,
  shouldPreferClusterHeuristicUnderContentionV0
} from "../chessEngineAdaptiveSliceV0.js";
import {
  CHESS_ENGINE_TASK_KIND_V0,
  CHESS_ENGINE_TASK_PRIORITY_V0,
  __resetChessEngineTaskQueueForTestV0,
  enqueueChessEngineTaskV0
} from "../chessEngineTaskQueueV0.js";

describe("chessEngineAdaptiveSliceV0", () => {
  beforeEach(() => {
    __resetChessEngineTaskQueueForTestV0();
    window.__rhizoh = {};
  });

  it("caps cluster depth between 8 and 16 under idle load", () => {
    const idle = resolveAdaptiveClusterEngineOptsV0({ depth: 22, movetimeMs: 900 });
    expect(idle.depth).toBeGreaterThanOrEqual(8);
    expect(idle.depth).toBeLessThanOrEqual(16);
    expect(idle.adaptiveNote).toContain("8–16");
  });

  it("reduces depth and movetime when queue is contended", () => {
    const idle = resolveAdaptiveClusterEngineOptsV0({ depth: 14, movetimeMs: 900 });

    for (let i = 0; i < 4; i += 1) {
      enqueueChessEngineTaskV0({
        priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
        kind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE,
        label: `pending_${i}`,
        run: () => new Promise(() => {})
      });
    }
    window.__rhizoh.chessGameCluster = { running: true };
    window.__rhizoh.chessScheduler = { chessLock: true };

    const loaded = resolveAdaptiveClusterEngineOptsV0({ depth: 14, movetimeMs: 900 });
    expect(loaded.depth).toBeLessThanOrEqual(idle.depth);
    expect(loaded.movetimeMs).toBeLessThanOrEqual(idle.movetimeMs);
    expect(loaded.adaptiveLoad).toBeGreaterThan(0.5);
  });

  it("prefers heuristic for non-featured slots when contended", () => {
    expect(shouldPreferClusterHeuristicUnderContentionV0({ slotId: 0 })).toBe(false);
    window.__rhizoh.chessGameCluster = { running: true };
    window.__rhizoh.chessScheduler = { chessLock: true };
    expect(shouldPreferClusterHeuristicUnderContentionV0({ slotId: 3 })).toBe(true);
  });
});
