import { describe, expect, it, beforeEach } from "vitest";
import { detectChessOpeningV0, detectChessPhaseV0 } from "../chessOpeningDetectV0.js";
import {
  listRhizohOpeningBookV0,
  recordOpeningFromMatchV0,
  resetRhizohOpeningBookForTestV0
} from "../rhizohOpeningBookV0.js";
import { buildMatchMovesWithFenV0 } from "../chessMatchReplayV0.js";
import { teachChessLessonV0 } from "../rhizohChessTeacherV0.js";
import {
  readChessCivilizationV0,
  recordChessCivilizationMatchV0,
  resetChessCivilizationForTestV0
} from "../chessCivilizationV0.js";

describe("chessOpeningDetectV0", () => {
  it("detects Sicilian Defense", () => {
    const opening = detectChessOpeningV0(["e4", "c5", "Nf3"]);
    expect(opening.name).toBe("Sicilian Defense");
    expect(opening.eco).toBe("B20");
  });

  it("detects endgame phase from FEN", () => {
    expect(detectChessPhaseV0("4k3/8/8/8/8/8/4K3 w - - 0 1")).toBe("endgame");
  });
});

describe("rhizohOpeningBookV0", () => {
  beforeEach(() => {
    resetRhizohOpeningBookForTestV0();
  });

  it("records games, wins, losses", () => {
    recordOpeningFromMatchV0({
      name: "Sicilian Defense",
      eco: "B20",
      moves: ["e4", "c5"],
      won: true,
      lost: false
    });
    recordOpeningFromMatchV0({
      name: "Sicilian Defense",
      eco: "B20",
      won: false,
      lost: true
    });
    const rows = listRhizohOpeningBookV0();
    expect(rows).toHaveLength(1);
    expect(rows[0].games).toBe(2);
    expect(rows[0].wins).toBe(1);
    expect(rows[0].losses).toBe(1);
  });
});

describe("rhizohChessTeacherV0", () => {
  it("produces human-readable lesson from observation", () => {
    const lesson = teachChessLessonV0(
      {
        openingName: "Sicilian Defense",
        eco: "B20",
        phase: "middlegame",
        winner: "opponent",
        mistakes: [
          {
            moveNumber: 17,
            san: "Qh5",
            alternative: "Nf6",
            swingCp: -180
          }
        ]
      },
      { locale: "tr" }
    );
    expect(lesson.title).toContain("17");
    expect(lesson.body).toContain("Nf6");
    expect(lesson.body).not.toMatch(/\+1\.23/);
  });
});

describe("chessCivilizationV0", () => {
  beforeEach(() => {
    resetChessCivilizationForTestV0();
  });

  it("tracks elo, rivals, and matches", () => {
    recordChessCivilizationMatchV0(
      {
        gameId: "g1",
        eco: "B20",
        openingName: "Sicilian Defense",
        winner: "local",
        opponentCastleId: "castle_alpha",
        observedAt: "2026-06-13T12:00:00.000Z"
      },
      { lesson: { title: "Opening study" } }
    );
    const profile = readChessCivilizationV0();
    expect(profile.elo).toBeGreaterThan(1200);
    expect(profile.rivals).toHaveLength(1);
    expect(profile.rivals[0].castleId).toBe("castle_alpha");
    expect(profile.matches[0].gameId).toBe("g1");
  });
});

describe("chessMatchReplayV0", () => {
  it("replays moves with before FEN", () => {
    const rows = buildMatchMovesWithFenV0(["e4", "c5", "Nf3"]);
    expect(rows).toHaveLength(3);
    expect(rows[0].san).toBe("e4");
    expect(rows[1].san).toBe("c5");
    expect(rows[0].before).toContain("w");
  });
});
