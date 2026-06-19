import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetUglLearnBufferForTestV0,
  drainUglLearnBufferV0,
  enqueueUglLearnBufferObservationV0,
  getUglLearnBufferSnapshotV0,
  registerUglLearnBufferEnrichHandlerV0
} from "../rhizohUglLearnBufferSinkV0.js";
import {
  __resetUglTrainingRecordsForTestV0,
  readUglTrainingRecordsV0
} from "../rhizohUglTrainingRecordV0.js";
import { __resetUglLeagueHarnessForTestV0 } from "../rhizohUglLeagueHarnessV0.js";
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

  it("skips enrich drain while play pipeline is busy", async () => {
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
    expect(enrich).not.toHaveBeenCalled();
    expect(getUglLearnBufferSnapshotV0().buffered).toBe(1);
    expect(getUglLearnBufferSnapshotV0().walWrites).toBe(1);
  });
});
