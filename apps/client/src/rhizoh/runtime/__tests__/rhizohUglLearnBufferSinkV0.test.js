import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetUglLearnBufferForTestV0,
  CHESS_LEARNING_ENRICH_RETRY_V0,
  CHESS_LEARNING_ENRICH_TIMEOUT_MS_V0,
  drainUglLearnBufferV0,
  recoverStuckUglLearnDrainV0,
  resolveLearnDrainBurstLimitV0,
  resolveLearnDrainIntervalMsV0,
  enqueueUglLearnBufferObservationV0,
  getUglLearnBufferSnapshotV0,
  registerUglLearnBufferEnrichHandlerV0
} from "../rhizohUglLearnBufferSinkV0.js";
import {
  __resetUglTrainingRecordsForTestV0,
  readUglTrainingRecordsV0
} from "../rhizohUglTrainingRecordV0.js";
import { __resetUglLeagueHarnessForTestV0 } from "../rhizohUglLeagueHarnessV0.js";
import { publishChessArenaWorkspaceOpenV0 } from "../chessEngineContentionGateV0.js";
import {
  CHESS_ENGINE_TASK_KIND_V0,
  CHESS_ENGINE_TASK_PRIORITY_V0,
  __resetChessEngineTaskQueueForTestV0,
  enqueueChessEngineTaskV0
} from "../chessEngineTaskQueueV0.js";

const FEN =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";

describe("rhizohUglLearnBufferSinkV0", () => {
  beforeEach(() => {
    __resetUglLearnBufferForTestV0();
    __resetUglTrainingRecordsForTestV0();
    __resetUglLeagueHarnessForTestV0();
    __resetChessEngineTaskQueueForTestV0();
    window.__rhizoh = {};
  });

  it("writes WAL immediately on cluster move without engine", () => {
    const record = enqueueUglLearnBufferObservationV0({
      slot: { slotId: 2, matchId: "cluster_2_x" },
      moveRow: { uci: "e7e5", san: "e5" },
      fenBefore: FEN
    });
    expect(record?.source).toBe("learn_buffer_move");
    expect(readUglTrainingRecordsV0(4)).toHaveLength(1);
    const snap = getUglLearnBufferSnapshotV0();
    expect(snap.walWrites).toBe(1);
    expect(snap.buffered).toBe(1);
  });

  it("drains enrich handler when engine idle", async () => {
    const enrich = vi.fn(async () => ({ ok: true }));
    registerUglLearnBufferEnrichHandlerV0(enrich);

    enqueueUglLearnBufferObservationV0({
      slot: { slotId: 1, matchId: "cluster_1_x" },
      moveRow: { uci: "c7c5" },
      fenBefore: FEN
    });

    await drainUglLearnBufferV0();
    expect(enrich).toHaveBeenCalledTimes(1);
    const snap = getUglLearnBufferSnapshotV0();
    expect(snap.enrichSuccess).toBe(1);
    expect(snap.buffered).toBe(0);
  });

  it("skips enrich drain while map arena workspace is open", async () => {
    const enrich = vi.fn(async () => ({ ok: true }));
    registerUglLearnBufferEnrichHandlerV0(enrich);
    publishChessArenaWorkspaceOpenV0(true);

    enqueueUglLearnBufferObservationV0({
      slot: { slotId: 2, matchId: "cluster_2_x" },
      moveRow: { uci: "e7e5" },
      fenBefore: FEN
    });

    await drainUglLearnBufferV0();
    expect(enrich).not.toHaveBeenCalled();
    expect(getUglLearnBufferSnapshotV0().buffered).toBe(1);
    expect(getUglLearnBufferSnapshotV0().engineIdle).toBe(false);
  });

  it("drains enrich while cluster play is queued (learn interleaves)", async () => {
    const enrich = vi.fn(async () => ({ ok: true }));
    registerUglLearnBufferEnrichHandlerV0(enrich);

    enqueueChessEngineTaskV0({
      priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
      kind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE,
      label: "busy_cluster_move",
      run: () => new Promise(() => {})
    });

    enqueueUglLearnBufferObservationV0({
      slot: { slotId: 4, matchId: "cluster_4_x" },
      moveRow: { uci: "g8f6" },
      fenBefore: FEN
    });

    await drainUglLearnBufferV0();
    expect(enrich).toHaveBeenCalledTimes(1);
    expect(getUglLearnBufferSnapshotV0().buffered).toBe(0);
  });

  it("re-queues row when enrich handler returns throttle retry", async () => {
    const enrich = vi
      .fn()
      .mockResolvedValueOnce(CHESS_LEARNING_ENRICH_RETRY_V0)
      .mockResolvedValueOnce({ ok: true });
    registerUglLearnBufferEnrichHandlerV0(enrich);

    enqueueUglLearnBufferObservationV0({
      slot: { slotId: 2, matchId: "cluster_2_x" },
      moveRow: { uci: "e7e5" },
      fenBefore: FEN
    });

    await drainUglLearnBufferV0();
    expect(getUglLearnBufferSnapshotV0().buffered).toBe(1);
    expect(getUglLearnBufferSnapshotV0().enrichThrottleSkips).toBe(1);
    expect(getUglLearnBufferSnapshotV0().enrichSuccess).toBe(0);

    await drainUglLearnBufferV0();
    expect(enrich).toHaveBeenCalledTimes(2);
    expect(getUglLearnBufferSnapshotV0().buffered).toBe(0);
    expect(getUglLearnBufferSnapshotV0().enrichSuccess).toBe(1);
  });

  it("resolves adaptive drain tuning from backlog depth", () => {
    expect(resolveLearnDrainBurstLimitV0(10)).toBe(1);
    expect(resolveLearnDrainBurstLimitV0(70)).toBe(3);
    expect(resolveLearnDrainIntervalMsV0(10)).toBe(1000);
    expect(resolveLearnDrainIntervalMsV0(70)).toBe(600);
  });

  it("uses adaptive burst when backlog is high", async () => {
    const enrich = vi.fn(async () => ({ ok: true }));
    registerUglLearnBufferEnrichHandlerV0(enrich);

    for (let i = 0; i < 35; i++) {
      enqueueUglLearnBufferObservationV0({
        slot: { slotId: 1, matchId: `cluster_1_${i}` },
        moveRow: { uci: "e7e5" },
        fenBefore: FEN
      });
    }
    expect(getUglLearnBufferSnapshotV0().buffered).toBeGreaterThanOrEqual(33);

    const before = getUglLearnBufferSnapshotV0().buffered;
    await drainUglLearnBufferV0();
    await drainUglLearnBufferV0();
    expect(enrich.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(getUglLearnBufferSnapshotV0().buffered).toBeLessThanOrEqual(before - 1);
  });

  it("times out hung enrich and re-queues row", async () => {
    vi.useFakeTimers();
    const enrich = vi.fn(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );
    registerUglLearnBufferEnrichHandlerV0(enrich);

    enqueueUglLearnBufferObservationV0({
      slot: { slotId: 3, matchId: "cluster_3_x" },
      moveRow: { uci: "d7d5" },
      fenBefore: FEN
    });

    const drainPromise = drainUglLearnBufferV0();
    await vi.advanceTimersByTimeAsync(CHESS_LEARNING_ENRICH_TIMEOUT_MS_V0 + 50);
    await drainPromise;

    const snap = getUglLearnBufferSnapshotV0();
    expect(snap.enrichAttempts).toBe(1);
    expect(snap.enrichTimeoutSkips).toBe(1);
    expect(snap.buffered).toBe(1);
    expect(snap.draining).toBe(false);
    vi.useRealTimers();
  });

  it("recovers stuck drain lock after watchdog budget", async () => {
    vi.useFakeTimers();
    const enrich = vi.fn(
      () =>
        new Promise(() => {
          /* hang until timeout */
        })
    );
    registerUglLearnBufferEnrichHandlerV0(enrich);

    enqueueUglLearnBufferObservationV0({
      slot: { slotId: 1, matchId: "cluster_1_hang" },
      moveRow: { uci: "e7e5" },
      fenBefore: FEN
    });

    const drainPromise = drainUglLearnBufferV0();
    await vi.advanceTimersByTimeAsync(CHESS_LEARNING_ENRICH_TIMEOUT_MS_V0 + 50);
    await drainPromise;

    const snap = getUglLearnBufferSnapshotV0();
    expect(snap.draining).toBe(false);
    expect(snap.enrichTimeoutSkips).toBe(1);
    expect(snap.buffered).toBe(1);

    const manual = recoverStuckUglLearnDrainV0();
    expect(manual.nudged === true || manual.recovered === true).toBe(true);
    vi.useRealTimers();
  });
});
