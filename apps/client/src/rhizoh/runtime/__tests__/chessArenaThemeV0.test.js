import { describe, expect, it } from "vitest";
import {
  readChessArenaThemeV0,
  resolveChessBoardColorsV0,
  saveChessArenaThemeV0
} from "../chessArenaThemeV0.js";

describe("chessArenaThemeV0", () => {
  it("defaults to classic board", () => {
    const theme = readChessArenaThemeV0();
    expect(theme.boardThemeId).toBe("classic");
    expect(resolveChessBoardColorsV0(theme.boardThemeId).light).toBe("#eeeed2");
  });

  it("persists theme selection", () => {
    const next = saveChessArenaThemeV0({ boardThemeId: "wood", pieceStyleId: "bold" });
    expect(next.boardThemeId).toBe("wood");
    expect(readChessArenaThemeV0().pieceStyleId).toBe("bold");
    saveChessArenaThemeV0({ boardThemeId: "classic", pieceStyleId: "unicode" });
  });
});
