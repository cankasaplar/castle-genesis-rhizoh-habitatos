import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetChessLifetimeStatsForTestV0,
  backfillChessLifetimeStatsFromStoresV0,
  readChessLifetimeStatsV0,
  recordChessLifetimeMoveV0
} from "../rhizohChessLifetimeStatsV0.js";
import { CHESS_CIVILIZATION_LS_KEY_V0 } from "../chessCivilizationV0.js";

describe("rhizohChessLifetimeStatsV0", () => {
  beforeEach(() => {
    __resetChessLifetimeStatsForTestV0();
    localStorage.clear();
  });

  it("backfills games from civilization store", () => {
    localStorage.setItem(
      CHESS_CIVILIZATION_LS_KEY_V0,
      JSON.stringify({
        schema: "rhizoh.chess_civilization.v0",
        castleId: "local_castle",
        elo: 1250,
        openings: [],
        rivals: [],
        matches: [
          { gameId: "g1", at: "2025-01-01T00:00:00.000Z" },
          { gameId: "g2", at: "2025-06-01T00:00:00.000Z" }
        ],
        updatedAt: "2025-06-01T00:00:00.000Z"
      })
    );

    const stats = backfillChessLifetimeStatsFromStoresV0();
    expect(stats.gamesCompleted).toBeGreaterThanOrEqual(2);
    expect(stats.gamesObserved).toBeGreaterThanOrEqual(2);
    expect(stats.firstSeenAt).toBeTruthy();
    expect(stats.lastSeenAt).toBeTruthy();
  });

  it("recordChessLifetimeMoveV0 increments moves and match hints", () => {
    recordChessLifetimeMoveV0({
      matchId: "cluster_0_abc",
      fenBefore: "fen_a",
      fenAfter: "fen_b"
    });
    recordChessLifetimeMoveV0({
      matchId: "cluster_0_abc",
      fenBefore: "fen_b",
      fenAfter: "fen_c"
    });

    const stats = readChessLifetimeStatsV0();
    expect(stats.movesSeen).toBe(2);
    expect(stats.matchIdHints).toContain("cluster_0_abc");
    expect(stats.uniqueFenHints.length).toBeGreaterThanOrEqual(3);
  });
});
