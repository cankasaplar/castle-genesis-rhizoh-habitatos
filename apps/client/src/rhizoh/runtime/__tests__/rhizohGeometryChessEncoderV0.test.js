import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { encodeChessTopologyEventV0, measureEnemyKingMobilityV0 } from "../rhizohGeometryChessEncoderV0.js";
import { RHIZOH_GEOMETRY_PATTERN_FAMILY_V0 } from "../rhizohGeometryPatternFamilyV0.js";

describe("rhizohGeometryChessEncoderV0", () => {
  it("classifies knight move as jump family", () => {
    const chess = new Chess();
    chess.move("e4");
    chess.move("e5");
    const before = chess.fen();
    const event = encodeChessTopologyEventV0(before, "Nf3");
    expect(event).not.toBeNull();
    expect(event?.patternFamily).toBe(RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.JUMP);
    expect(event?.sourceSpace).toBe("chess");
  });

  it("classifies checking move as enclosure family", () => {
    const before = "4k2K/8/4Q3/8/8/8/8/8 w - - 0 1";
    const event = encodeChessTopologyEventV0(before, "Qe7+");
    expect(event?.patternFamily).toBe(RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.ENCLOSURE);
    expect(event?.metrics.enclosureDelta).toBeGreaterThanOrEqual(0);
  });

  it("returns null for illegal SAN", () => {
    const chess = new Chess();
    expect(encodeChessTopologyEventV0(chess.fen(), "Qh5#")).toBeNull();
  });

  it("does not throw when encoding en passant (enemy-turn mobility probe clears ep square)", () => {
    const before = "rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2";
    expect(() => encodeChessTopologyEventV0(before, "exd6")).not.toThrow();
    const event = encodeChessTopologyEventV0(before, "exd6");
    expect(event).not.toBeNull();
    expect(event?.sourceSpace).toBe("chess");
  });

  it("measureEnemyKingMobilityV0 returns null for invalid FEN instead of throwing", () => {
    const before = "rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2";
    const parts = before.split(" ");
    parts[1] = "b";
    const illegalEnemyTurn = parts.join(" ");
    expect(measureEnemyKingMobilityV0(illegalEnemyTurn, "b")).toBeNull();
  });
});
