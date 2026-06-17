import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  isRhizohLegalPendingHoldV0,
  maybeDispatchLegalPendingChessArenaV0,
  resetRhizohLegalPendingWaitLoopForTestsV0,
  startRhizohLegalPendingWaitLoopV0
} from "../rhizohLegalPendingWaitLoopV0.js";
import { RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0 } from "../chessGameClusterV0.js";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "../symbyoMapIntentBridgeV0.js";

vi.mock("../../ingress/ingress_router.js", () => ({
  hasLegalAccessAckV0: () => false,
  resolveIngressRouteV0: () =>
    Object.freeze({
      route: "legal_preamble",
      required: true,
      acked: false
    })
}));

describe("rhizohLegalPendingWaitLoopV0", () => {
  beforeEach(() => {
    resetRhizohLegalPendingWaitLoopForTestsV0();
    if (typeof window !== "undefined") {
      window.__rhizoh = {};
    }
  });

  it("detects legal preamble hold", () => {
    expect(isRhizohLegalPendingHoldV0()).toBe(true);
  });

  it("dispatches chess arena once while hold active", () => {
    const arenaEvents = [];
    const clusterEvents = [];
    window.addEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, (ev) => arenaEvents.push(ev.detail));
    window.addEventListener(RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0, (ev) =>
      clusterEvents.push(ev.detail)
    );

    expect(maybeDispatchLegalPendingChessArenaV0()).toBe(true);
    expect(maybeDispatchLegalPendingChessArenaV0()).toBe(false);
    expect(arenaEvents).toHaveLength(1);
    expect(clusterEvents).toHaveLength(1);
    expect(arenaEvents[0].initialMode).toBe("rhizoh_stockfish");
    expect(arenaEvents[0].autoPlay).toBe(true);
  });

  it("boots interval loop without throwing", () => {
    vi.useFakeTimers();
    const stop = startRhizohLegalPendingWaitLoopV0({ bootDelayMs: 10, pollMs: 100 });
    vi.advanceTimersByTime(20);
    stop();
    vi.useRealTimers();
    expect(true).toBe(true);
  });
});
