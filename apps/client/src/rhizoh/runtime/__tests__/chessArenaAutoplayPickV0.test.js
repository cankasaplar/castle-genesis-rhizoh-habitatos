import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHESS_GAME_MODE_V0, createChessArenaGameV0 } from "../chessArenaEngineV0.js";
import {
  ARENA_AUTOPLAY_MAX_WAIT_MS_V0,
  ARENA_AUTOPLAY_MOVE_PICK_CAP_MS_V0,
  pickArenaAutoplayMoveV0
} from "../chessArenaAutoplayPickV0.js";
import { shouldDeferArenaEngineWorkV0, isChessArenaWorkspaceOpenV0 } from "../chessEngineContentionGateV0.js";
import {
  getChessTeacherStatusV0,
  pickChessArenaMoveViaTeacherV0
} from "../chessTeacherInterfaceV0.js";

vi.mock("../chessEngineContentionGateV0.js", () => ({
  shouldDeferArenaEngineWorkV0: vi.fn(() => false),
  isChessArenaWorkspaceOpenV0: vi.fn(() => false),
  prioritizeArenaEngineForMoveV0: vi.fn(() => false)
}));

vi.mock("../chessTeacherInterfaceV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getChessTeacherStatusV0: vi.fn(() => "stockfish_wasm"),
    pickChessArenaMoveViaTeacherV0: vi.fn(async () => ({
      move: "e4",
      engine: "stockfish_wasm"
    }))
  };
});

describe("chessArenaAutoplayPickV0", () => {
  beforeEach(() => {
    vi.mocked(shouldDeferArenaEngineWorkV0).mockReturnValue(false);
    vi.mocked(isChessArenaWorkspaceOpenV0).mockReturnValue(false);
    vi.mocked(getChessTeacherStatusV0).mockReturnValue("stockfish_wasm");
    vi.mocked(pickChessArenaMoveViaTeacherV0).mockResolvedValue({
      move: "e4",
      engine: "stockfish_wasm"
    });
  });

  it("returns Stockfish pick when teacher is online", async () => {
    const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.AI_AI });
    const pick = await pickArenaAutoplayMoveV0({
      game,
      rhizohTurnNow: false,
      teacherOnline: true,
      activeMode: CHESS_GAME_MODE_V0.AI_AI
    });
    expect(pick.move).toBe("e4");
    expect(pick.engine).toBe("stockfish_wasm");
    expect(pick.fallbackMode).toBe(false);
  });

  it("marks heuristic engine picks as fallbackMode", async () => {
    vi.mocked(pickChessArenaMoveViaTeacherV0).mockResolvedValue({
      move: "d4",
      engine: "heuristic_fallback"
    });
    const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.AI_AI });
    const pick = await pickArenaAutoplayMoveV0({
      game,
      rhizohTurnNow: false,
      teacherOnline: false,
      activeMode: CHESS_GAME_MODE_V0.AI_AI
    });
    expect(pick.move).toBe("d4");
    expect(pick.fallbackMode).toBe(true);
  });

  it("falls back to opening-aware heuristic after retry budget", async () => {
    vi.useFakeTimers();
    vi.mocked(pickChessArenaMoveViaTeacherV0).mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.AI_AI });
    const pickPromise = pickArenaAutoplayMoveV0({
      game,
      rhizohTurnNow: false,
      teacherOnline: true,
      activeMode: CHESS_GAME_MODE_V0.AI_AI
    });

    await vi.advanceTimersByTimeAsync(ARENA_AUTOPLAY_MAX_WAIT_MS_V0 + ARENA_AUTOPLAY_MOVE_PICK_CAP_MS_V0);
    const pick = await pickPromise;

    expect(pick.engine).toBe("heuristic_autoplay_cap");
    expect(pick.fallbackMode).toBe(true);
    expect(pick.move).not.toBe("Na3");

    vi.useRealTimers();
  });

  it("waits while cluster defer is active", async () => {
    vi.useFakeTimers();
    vi.mocked(shouldDeferArenaEngineWorkV0)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValue(false);

    const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.AI_AI });
    const pickPromise = pickArenaAutoplayMoveV0({
      game,
      rhizohTurnNow: false,
      teacherOnline: true,
      activeMode: CHESS_GAME_MODE_V0.AI_AI
    });

    await vi.advanceTimersByTimeAsync(ARENA_AUTOPLAY_MOVE_PICK_CAP_MS_V0);
    const pick = await pickPromise;

    expect(pick.move).toBe("e4");
    expect(shouldDeferArenaEngineWorkV0).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("skips cluster defer wait while arena workspace is open", async () => {
    vi.useFakeTimers();
    vi.mocked(isChessArenaWorkspaceOpenV0).mockReturnValue(true);
    vi.mocked(shouldDeferArenaEngineWorkV0).mockReturnValue(true);
    vi.mocked(shouldDeferArenaEngineWorkV0).mockClear();

    const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.AI_AI });
    const pickPromise = pickArenaAutoplayMoveV0({
      game,
      rhizohTurnNow: false,
      teacherOnline: true,
      activeMode: CHESS_GAME_MODE_V0.AI_AI
    });

    await vi.advanceTimersByTimeAsync(ARENA_AUTOPLAY_MOVE_PICK_CAP_MS_V0);
    const pick = await pickPromise;

    expect(pick.move).toBe("e4");
    expect(shouldDeferArenaEngineWorkV0).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
