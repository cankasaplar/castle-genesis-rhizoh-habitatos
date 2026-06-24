import React, { memo } from "react";
import { CHESS_PIECE_STYLE_V0 } from "../rhizoh/runtime/chessArenaThemeV0.js";
import {
  resolveChessFidePieceSrcV0,
  resolveChessLastMoveSquaresV0,
  resolveChessSquareGlowStyleV0
} from "../rhizoh/runtime/chessArenaBoardDisplayV0.js";

/**
 * Shared chess board — FIDE cburnett pieces, Kanagawa neon last-move glow.
 */
export const RhizohChessBoardV0 = memo(function RhizohChessBoardV0({
  rows,
  boardColors,
  pieceStyleId = CHESS_PIECE_STYLE_V0.fide,
  pieceBold = false,
  lastMove = null,
  selectedSquare = null,
  onSquareClick,
  sizeClass = "w-[min(100%,min(88vw,46vh))]",
  borderClass = "border-2 border-cyan-500/40 shadow-[0_0_24px_rgba(0,204,255,0.12)]",
  showCoords = true,
  interactive = true,
  orientation = "white",
  compact = false
}) {
  const lastMoveSquares = resolveChessLastMoveSquaresV0(lastMove);
  const useFide = pieceStyleId === CHESS_PIECE_STYLE_V0.fide;
  const flip = orientation === "black";
  const rankLabels = flip ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const fileLabels = flip ? "hgfedcba".split("") : "abcdefgh".split("");
  const displayRows = flip
    ? rows.map((row) => [...row].reverse()).reverse()
    : rows;

  const rootClass = compact
    ? `flex min-h-0 ${sizeClass} flex-col items-center justify-center gap-0`
    : `my-2 flex ${sizeClass} shrink-0 flex-col items-center gap-1`;

  return (
    <div className={rootClass}>
      <div className="flex w-full items-stretch gap-1">
        {showCoords ? (
          <div className="grid shrink-0 grid-rows-8 text-[8px] font-semibold text-white/50 sm:text-[9px]">
            {rankLabels.map((rank) => (
              <span key={rank} className="flex items-center justify-center pr-0.5">
                {rank}
              </span>
            ))}
          </div>
        ) : null}
        <div className="aspect-square min-w-0 flex-1">
          <div
            className={`grid h-full w-full grid-cols-8 grid-rows-8 overflow-visible rounded-lg ${borderClass}`}
          >
            {displayRows.map((row, ri) =>
              row.map((cell, ci) => {
                const dark = (ri + ci) % 2 === 1;
                const rank = flip ? ri + 1 : 8 - ri;
                const file = flip ? String.fromCharCode(104 - ci) : String.fromCharCode(97 + ci);
                const sq = cell?.square || `${file}${rank}`;
                const selected = selectedSquare === sq;
                const glowStyle = resolveChessSquareGlowStyleV0(sq, lastMoveSquares);
                const Tag = interactive && onSquareClick ? "button" : "div";
                return (
                  <Tag
                    key={`${ri}-${ci}`}
                    type={interactive && onSquareClick ? "button" : undefined}
                    onClick={interactive && onSquareClick ? () => onSquareClick(sq) : undefined}
                    style={{
                      background: dark ? boardColors.dark : boardColors.light,
                      ...glowStyle
                    }}
                    className={`relative flex items-center justify-center ${
                      selected ? "z-10 ring-2 ring-cyan-300 ring-inset" : ""
                    }`}
                  >
                    {cell ? (
                      useFide ? (
                        <img
                          src={resolveChessFidePieceSrcV0(cell.color, cell.type)}
                          alt=""
                          className="h-[82%] w-[82%] select-none object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                          draggable={false}
                        />
                      ) : (
                        <span
                          className={`select-none text-[clamp(1rem,4.2vmin,1.75rem)] leading-none sm:text-2xl ${
                            pieceBold ? "font-black" : ""
                          } ${
                            cell.color === "w"
                              ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                              : "text-neutral-950 drop-shadow-[0_0_2px_rgba(255,255,255,0.75)]"
                          }`}
                        >
                          {cell.glyph}
                        </span>
                      )
                    ) : null}
                  </Tag>
                );
              })
            )}
          </div>
        </div>
      </div>
      {showCoords ? (
        <div className="grid w-full grid-cols-8 gap-0 pl-4 text-center text-[8px] font-semibold text-white/45 sm:pl-5 sm:text-[9px]">
          {fileLabels.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
});
