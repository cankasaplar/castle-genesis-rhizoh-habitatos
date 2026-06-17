import { describe, expect, it } from "vitest";
import {
  RHIZOH_CHESS_MANAGER_ARCHITECTURE_V0,
  getRhizohChessManagerSnapshotV0,
  publishRhizohChessManagerV0,
  readRhizohChessManagerLiveV0
} from "../rhizohChessManagerV0.js";
import { disposeChessStockfishEngineV0 } from "../chessStockfishEngineV0.js";

describe("rhizohChessManagerV0", () => {
  it("reports single-engine multi-board architecture", () => {
    disposeChessStockfishEngineV0();
    const snap = getRhizohChessManagerSnapshotV0("test");
    expect(snap.architecture).toBe(RHIZOH_CHESS_MANAGER_ARCHITECTURE_V0);
    expect(snap.brain.engineInstances).toBe(1);
    expect(snap.brain.spawnStrategies[0]).toBe("main_thread_wasm_binary");
    expect(snap.arena.slotCount).toBe(8);
  });

  it("publishes to window.__rhizoh.chessManager", () => {
    const snap = publishRhizohChessManagerV0("test");
    expect(window.__rhizoh?.chessManager?.schema).toBe(snap?.schema);
  });

  it("readRhizohChessManagerLiveV0 returns fresh snapshot", () => {
    const live = readRhizohChessManagerLiveV0("test");
    expect(live.architecture).toBe(RHIZOH_CHESS_MANAGER_ARCHITECTURE_V0);
    expect(live.brain.engineInstances).toBe(1);
  });
});
