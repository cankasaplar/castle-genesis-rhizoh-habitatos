import { describe, expect, it } from "vitest";
import {
  applyChessClusterClockIncrementV0,
  createChessClusterClockStateV0,
  formatChessClusterClockV0,
  summarizeChessClusterClockV0,
  tickChessClusterSlotClockV0
} from "../chessClusterClockV0.js";
import { createChessArenaGameV0 } from "../chessArenaEngineV0.js";

describe("chessClusterClockV0", () => {
  it("creates clock from bullet time control", () => {
    const clock = createChessClusterClockStateV0("bullet_1_0");
    expect(clock.timeControlId).toBe("bullet_1_0");
    expect(clock.whiteClockMs).toBe(60_000);
    expect(clock.incrementMs).toBe(0);
  });

  it("ticks white clock and flags black win", () => {
    const game = createChessArenaGameV0();
    const slot = {
      status: "active",
      game,
      ply: 3,
      whiteClockMs: 500,
      blackClockMs: 60_000,
      incrementMs: 0
    };
    const outcome = tickChessClusterSlotClockV0(slot, 1000);
    expect(outcome).toBe("black_wins");
    expect(slot.whiteClockMs).toBe(0);
  });

  it("does not tick clock before first move", () => {
    const game = createChessArenaGameV0();
    const slot = {
      status: "active",
      game,
      ply: 0,
      whiteClockMs: 60_000,
      blackClockMs: 60_000,
      incrementMs: 0
    };
    expect(tickChessClusterSlotClockV0(slot, 1000)).toBeNull();
    expect(slot.whiteClockMs).toBe(60_000);
  });

  it("applies increment after move", () => {
    const slot = { whiteClockMs: 10_000, blackClockMs: 10_000, incrementMs: 2000 };
    applyChessClusterClockIncrementV0(slot, "w");
    expect(slot.whiteClockMs).toBe(12_000);
  });

  it("formats and summarizes clocks", () => {
    expect(formatChessClusterClockV0(125_000)).toBe("2:05");
    const summary = summarizeChessClusterClockV0({
      timeControlId: "blitz_3_2",
      whiteClockMs: 180_000,
      blackClockMs: 175_000,
      incrementMs: 2000
    });
    expect(summary.whiteClock).toBe("3:00");
    expect(summary.blackClock).toBe("2:55");
  });
});
