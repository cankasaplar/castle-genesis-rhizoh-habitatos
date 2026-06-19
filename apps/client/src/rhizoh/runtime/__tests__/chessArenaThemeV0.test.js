import { describe, expect, it, vi } from "vitest";
import {
  CHESS_ARENA_THEME_EVENT_V0,
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

  it("dispatches theme change event", () => {
    const handler = vi.fn();
    window.addEventListener(CHESS_ARENA_THEME_EVENT_V0, handler);
    const next = saveChessArenaThemeV0({ boardThemeId: "slate" });
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0].detail.boardThemeId).toBe("slate");
    window.removeEventListener(CHESS_ARENA_THEME_EVENT_V0, handler);
    saveChessArenaThemeV0({ boardThemeId: "classic", pieceStyleId: "unicode" });
    expect(next.boardThemeId).toBe("slate");
  });
});
