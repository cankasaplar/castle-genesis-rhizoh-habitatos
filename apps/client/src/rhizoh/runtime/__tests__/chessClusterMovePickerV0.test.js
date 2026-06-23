import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChessArenaGameV0 } from "../chessArenaEngineV0.js";
import { pickChessClusterMoveV0 } from "../chessClusterMovePickerV0.js";
import { pickRhizohChessMoveV0 } from "../rhizohChessPlayerV0.js";
import { publishChessClusterBroadcastActiveV0 } from "../chessEngineContentionGateV0.js";
import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "../chessLearningMonitorV0.js";

vi.mock("../chessStockfishEngineV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    awaitChessStockfishEngineReadyV0: vi.fn(async () => {}),
    getChessStockfishEngineStatusV0: vi.fn(() => "stockfish_wasm"),
    pickChessArenaEngineMoveV0: vi.fn(async () =>
      Object.freeze({ move: "e7e5", engine: "stockfish_wasm" })
    )
  };
});

vi.mock("../rhizohChessPlayerV0.js", () => ({
  pickRhizohChessMoveV0: vi.fn(async () =>
    Object.freeze({ move: "e4", engine: "rhizoh_ai" })
  )
}));

function armContendedClusterV0() {
  window.__rhizoh = {
    chessGameCluster: { running: true },
    chessScheduler: { chessLock: true },
    chessEngineQueue: { pendingCount: 3 }
  };
}

describe("chessClusterMovePickerV0", () => {
  beforeEach(() => {
    window.__rhizoh = {};
    publishChessClusterBroadcastActiveV0(false);
    vi.clearAllMocks();
  });

  it("never downgrades featured slot #0 to contention fast heuristic", async () => {
    armContendedClusterV0();
    publishChessClusterBroadcastActiveV0(true);

    const game = createChessArenaGameV0();
    game.tryMove("e4");

    const slot = Object.freeze({
      slotId: CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
      ply: 1,
      matchId: "cluster_0_test"
    });

    const out = await pickChessClusterMoveV0(slot, game);
    expect(out.engine).not.toBe("cluster_fast_heuristic_contention");
    expect(out.engine).not.toBe("broadcast_grid_heuristic");
    expect(out.engine).toBe("stockfish_wasm");
  });

  it("uses clusterPlay queue for rhizoh_vs_stockfish featured turns", async () => {
    const game = createChessArenaGameV0();
    const slot = Object.freeze({
      slotId: CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
      ply: 0,
      matchId: "cluster_0_rhizoh",
      rhizohColor: "w"
    });

    await pickChessClusterMoveV0(slot, game);
    expect(pickRhizohChessMoveV0).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ clusterPlay: true })
    );
  });

  it("may use contention fast heuristic for non-featured slots during broadcast", async () => {
    armContendedClusterV0();
    publishChessClusterBroadcastActiveV0(true);

    const game = createChessArenaGameV0();
    const slot = Object.freeze({ slotId: 3, ply: 0, matchId: "cluster_3_test" });

    const out = await pickChessClusterMoveV0(slot, game);
    expect(out.engine).toBe("cluster_fast_heuristic_contention");
  });
});
