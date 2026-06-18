import { useEffect, useMemo, useState } from "react";
import {
  CHESS_ARENA_SESSION_EVENT_V0,
  readChessArenaSessionV0,
  resolveChessTimeControlV0
} from "../rhizoh/runtime/chessArenaSessionV0.js";
import {
  CHESS_ARENA_THEME_EVENT_V0,
  CHESS_PIECE_STYLE_V0,
  readChessArenaThemeV0,
  resolveChessBoardColorsV0
} from "../rhizoh/runtime/chessArenaThemeV0.js";

/**
 * Shared board skin + session — settings panel, lobby, cluster cameras stay in sync.
 */
export function useChessArenaDisplaySettingsV0() {
  const [theme, setTheme] = useState(() => readChessArenaThemeV0());
  const [session, setSession] = useState(() => readChessArenaSessionV0());

  useEffect(() => {
    const onTheme = (ev) => setTheme(ev?.detail || readChessArenaThemeV0());
    const onSession = (ev) => setSession(ev?.detail || readChessArenaSessionV0());
    const onStorage = () => {
      setTheme(readChessArenaThemeV0());
      setSession(readChessArenaSessionV0());
    };
    window.addEventListener(CHESS_ARENA_THEME_EVENT_V0, onTheme);
    window.addEventListener(CHESS_ARENA_SESSION_EVENT_V0, onSession);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHESS_ARENA_THEME_EVENT_V0, onTheme);
      window.removeEventListener(CHESS_ARENA_SESSION_EVENT_V0, onSession);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const boardColors = useMemo(
    () => resolveChessBoardColorsV0(theme.boardThemeId),
    [theme.boardThemeId]
  );
  const pieceBold = theme.pieceStyleId === CHESS_PIECE_STYLE_V0.bold;
  const pieceFide = theme.pieceStyleId === CHESS_PIECE_STYLE_V0.fide;
  const timeControl = useMemo(
    () => resolveChessTimeControlV0(session.timeControlId),
    [session.timeControlId]
  );

  return Object.freeze({
    theme,
    session,
    boardColors,
    pieceBold,
    pieceFide,
    pieceStyleId: theme.pieceStyleId,
    timeControl
  });
}
