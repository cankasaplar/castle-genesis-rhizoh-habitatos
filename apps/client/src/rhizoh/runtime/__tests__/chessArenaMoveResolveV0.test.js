import { describe, expect, it } from "vitest";
import { createChessArenaGameV0 } from "../chessArenaEngineV0.js";
import {
  isRhizohClusterTurnV0,
  resolveChessLegalMoveUciV0
} from "../chessArenaMoveResolveV0.js";

describe("chessArenaMoveResolveV0", () => {
  it("resolves SAN and UCI to legal moves", () => {
    const game = createChessArenaGameV0();
    expect(resolveChessLegalMoveUciV0(game, "e4")).toBe("e2e4");
    expect(resolveChessLegalMoveUciV0(game, "e2e4")).toBe("e2e4");
    expect(resolveChessLegalMoveUciV0(game, "Qa9")).toBeNull();
  });

  it("detects Rhizoh cluster turn by rhizohColor", () => {
    expect(isRhizohClusterTurnV0({ rhizohColor: "w" }, "w")).toBe(true);
    expect(isRhizohClusterTurnV0({ rhizohColor: "b" }, "w")).toBe(false);
    expect(isRhizohClusterTurnV0({ rhizohColor: "b" }, "b")).toBe(true);
  });
});
