import { describe, expect, it, beforeEach } from "vitest";
import { detectChessOpeningV0, detectChessPhaseV0 } from "../chessOpeningDetectV0.js";
import {
  listRhizohOpeningBookV0,
  recordOpeningFromMatchV0,
  resetRhizohOpeningBookForTestV0
} from "../rhizohOpeningBookV0.js";
import { buildMatchMovesWithFenV0 } from "../chessMatchReplayV0.js";

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

  it("records and lists opening entries", () => {
    recordOpeningFromMatchV0({
      name: "Sicilian Defense",
      eco: "B20",
      moves: ["e4", "c5"],
      won: true,
      lesson: { title: "Move 17 critical error", body: "Alternative: Nf6" }
    });
    const rows = listRhizohOpeningBookV0();
    expect(rows).toHaveLength(1);
    expect(rows[0].playedCount).toBe(1);
    expect(rows[0].winCount).toBe(1);
    expect(rows[0].lessons[0].title).toContain("critical");
  });
});

describe("stockfishMatchAnalysisV0", () => {
  it("replays moves with before FEN", () => {
    const rows = buildMatchMovesWithFenV0(["e4", "c5", "Nf3"]);
    expect(rows).toHaveLength(3);
    expect(rows[0].san).toBe("e4");
    expect(rows[1].san).toBe("c5");
    expect(rows[0].before).toContain("w");
  });
});
