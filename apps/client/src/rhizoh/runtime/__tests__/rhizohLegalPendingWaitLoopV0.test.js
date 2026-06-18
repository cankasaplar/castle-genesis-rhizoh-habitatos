import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  dispatchLegalHoldChessArenaManualV0,
  isLegalHoldAutoChessEnabledV0,
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

  it("does not auto-dispatch chess arena by default (C2 manual gate)", () => {
    expect(isLegalHoldAutoChessEnabledV0()).toBe(false);
    expect(maybeDispatchLegalPendingChessArenaV0()).toBe(false);
  });

  it("dispatches chess arena on manual open", () => {
    const arenaEvents = [];
    const clusterEvents = [];
    window.addEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, (ev) => arenaEvents.push(ev.detail));
    window.addEventListener(RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0, (ev) =>
      clusterEvents.push(ev.detail)
    );

    expect(dispatchLegalHoldChessArenaManualV0()).toBe(true);
    expect(dispatchLegalHoldChessArenaManualV0()).toBe(false);
    expect(arenaEvents).toHaveLength(1);
    expect(clusterEvents).toHaveLength(1);
    expect(arenaEvents[0].source).toBe("legal_hold_manual");
  });

  it("boots interval loop without auto chess dispatch", () => {
    vi.useFakeTimers();
    const clusterEvents = [];
    window.addEventListener(RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0, (ev) =>
      clusterEvents.push(ev.detail)
    );
    const stop = startRhizohLegalPendingWaitLoopV0({ bootDelayMs: 10, pollMs: 100 });
    vi.advanceTimersByTime(200);
    stop();
    vi.useRealTimers();
    expect(clusterEvents).toHaveLength(0);
  });
});
