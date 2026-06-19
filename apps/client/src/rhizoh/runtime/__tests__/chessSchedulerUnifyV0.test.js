import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHESS_SCHEDULER_MIN_GAP_MS_V0,
  __resetChessSchedulerUnifyForTestV0,
  endChessSchedulerCallV0,
  getChessSchedulerUnifySnapshotV0,
  runWithChessSchedulerLockV0,
  tryBeginChessSchedulerCallV0
} from "../chessSchedulerUnifyV0.js";

describe("chessSchedulerUnifyV0", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetChessSchedulerUnifyForTestV0();
    window.__rhizoh = {};
  });

  afterEach(() => {
    __resetChessSchedulerUnifyForTestV0();
    vi.useRealTimers();
  });

  it("sets global chessLock and lastChessCall on begin", () => {
    expect(tryBeginChessSchedulerCallV0({ testFast: true, minGapMs: 50 })).toBe(true);
    expect(window.__rhizoh.chessLock).toBe(true);
    expect(window.__rhizoh.lastChessCall).toBeGreaterThan(0);
    expect(getChessSchedulerUnifySnapshotV0().chessLock).toBe(true);
  });

  it("rejects overlapping calls inside throttle window", () => {
    expect(tryBeginChessSchedulerCallV0({ testFast: true, minGapMs: 50 })).toBe(true);
    endChessSchedulerCallV0({ testFast: true, releaseMs: 50 });
    expect(tryBeginChessSchedulerCallV0({ testFast: true, minGapMs: 50 })).toBe(false);
    vi.advanceTimersByTime(50);
    expect(window.__rhizoh.chessLock).toBe(false);
  });

  it("runWithChessSchedulerLockV0 releases after cooldown", async () => {
    const run = runWithChessSchedulerLockV0(async () => "ok", {
      testFast: true,
      minGapMs: 50,
      releaseMs: 50
    });
    await expect(run).resolves.toBe("ok");
    expect(window.__rhizoh.chessLock).toBe(true);
    vi.advanceTimersByTime(50);
    expect(window.__rhizoh.chessLock).toBe(false);
  });

  it("defaults min gap to 900ms in prod mode", () => {
    expect(CHESS_SCHEDULER_MIN_GAP_MS_V0).toBe(900);
    expect(tryBeginChessSchedulerCallV0()).toBe(true);
    expect(tryBeginChessSchedulerCallV0()).toBe(false);
  });
});
