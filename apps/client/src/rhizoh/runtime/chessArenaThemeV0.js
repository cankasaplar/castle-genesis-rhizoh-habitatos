/** Chess Arena board + piece theme (localStorage). */

const STORAGE_KEY_V0 = "rhizoh_chess_arena_theme_v0";
export const CHESS_ARENA_THEME_EVENT_V0 = "rhizoh:chess-arena-theme-v0";

function publishChessArenaThemeV0(theme) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(CHESS_ARENA_THEME_EVENT_V0, { detail: theme }));
  } catch {
    /* noop */
  }
}

export const CHESS_BOARD_THEME_V0 = Object.freeze({
  classic: Object.freeze({ light: "#eeeed2", dark: "#6d8f4f", label: "Classic" }),
  wood: Object.freeze({ light: "#f0d9b5", dark: "#b58863", label: "Wood" }),
  slate: Object.freeze({ light: "#e8edf2", dark: "#4a5568", label: "Slate" }),
  neon: Object.freeze({ light: "#1e293b", dark: "#0f766e", label: "Neon" }),
  kanagawa: Object.freeze({
    light: "#1a4a6e",
    dark: "#0c3d42",
    label: "Kanagawa",
    accentFrom: "#00ccff",
    accentTo: "#00ff66"
  })
});

export const CHESS_PIECE_STYLE_V0 = Object.freeze({
  unicode: "unicode",
  bold: "bold",
  fide: "fide"
});

const DEFAULT_V0 = Object.freeze({
  boardThemeId: "kanagawa",
  pieceStyleId: CHESS_PIECE_STYLE_V0.fide
});

export function readChessArenaThemeV0() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    if (!raw) return { ...DEFAULT_V0 };
    const parsed = JSON.parse(raw);
    const boardThemeId = CHESS_BOARD_THEME_V0[parsed.boardThemeId]
      ? parsed.boardThemeId
      : DEFAULT_V0.boardThemeId;
    const pieceStyleId =
      parsed.pieceStyleId === CHESS_PIECE_STYLE_V0.bold
        ? CHESS_PIECE_STYLE_V0.bold
        : parsed.pieceStyleId === CHESS_PIECE_STYLE_V0.fide
          ? CHESS_PIECE_STYLE_V0.fide
          : CHESS_PIECE_STYLE_V0.unicode;
    return Object.freeze({ boardThemeId, pieceStyleId });
  } catch {
    return { ...DEFAULT_V0 };
  }
}

export function saveChessArenaThemeV0(patch) {
  const next = Object.freeze({
    ...readChessArenaThemeV0(),
    ...patch
  });
  try {
    localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(next));
  } catch {
    /* noop */
  }
  publishChessArenaThemeV0(next);
  return next;
}

export function resolveChessBoardColorsV0(themeId) {
  return CHESS_BOARD_THEME_V0[themeId] || CHESS_BOARD_THEME_V0.classic;
}
