import { describe, expect, it } from "vitest";
import {
  CHESS_ARENA_QUICK_MATCH_V0,
  getChessArenaLobbySnapshotV0
} from "../chessArenaLobbyV0.js";

describe("chessArenaLobbyV0", () => {
  it("exposes quick match presets and lobby snapshot", () => {
    expect(CHESS_ARENA_QUICK_MATCH_V0.length).toBeGreaterThanOrEqual(4);
    const snap = getChessArenaLobbySnapshotV0();
    expect(snap.schema).toContain("chess_arena_lobby");
    expect(snap.fixtures.length).toBeGreaterThanOrEqual(3);
  });
});
