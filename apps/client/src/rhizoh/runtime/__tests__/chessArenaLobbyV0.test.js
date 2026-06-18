import { describe, expect, it } from "vitest";
import {
  CHESS_ARENA_QUICK_MATCH_V0,
  getChessArenaLearningFeedV0,
  getChessArenaLobbySnapshotV0
} from "../chessArenaLobbyV0.js";
import {
  __resetChessLearningMonitorForTestV0,
  recordChessLearningMonitorMoveV0,
  recordChessLearningMonitorPolicyDiffV0
} from "../chessLearningMonitorV0.js";

describe("chessArenaLobbyV0", () => {
  it("exposes quick match presets and lobby snapshot", () => {
    expect(CHESS_ARENA_QUICK_MATCH_V0.length).toBeGreaterThanOrEqual(4);
    const snap = getChessArenaLobbySnapshotV0();
    expect(snap.schema).toContain("chess_arena_lobby");
    expect(snap.fixtures.length).toBeGreaterThanOrEqual(3);
  });

  it("learning feed includes measurement counters", () => {
    __resetChessLearningMonitorForTestV0();
    recordChessLearningMonitorMoveV0({
      move: { slotId: 0, san: "e4", engine: "stockfish_wasm", atMs: 1 },
      observation: {}
    });
    recordChessLearningMonitorPolicyDiffV0({ slotId: 0, summary: "test", drifted: false });
    const feed = getChessArenaLearningFeedV0();
    expect(feed.movesMeasured).toBe(1);
    expect(feed.stockfishMovesMeasured).toBe(1);
    expect(feed.policyDiffsMeasured).toBe(1);
    expect(feed.alignmentRate).toBe(1);
    expect(feed).toHaveProperty("sessionGamesEnded");
    expect(feed).toHaveProperty("lastGameEndLabel");
    __resetChessLearningMonitorForTestV0();
  });
});
