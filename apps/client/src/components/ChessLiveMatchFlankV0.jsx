import React, { memo, useMemo } from "react";

function formatChessClockV0(ms) {
  const safe = Math.max(0, Number(ms) || 0);
  const totalSec = Math.floor(safe / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Live match flank — each player's moves on their side (white left, black right).
 */
export const ChessLiveMatchFlankV0 = memo(function ChessLiveMatchFlankV0({
  moves = [],
  tr = true,
  rhizohColor = "w",
  whiteName = "White",
  blackName = "Black",
  whiteClockMs = 0,
  blackClockMs = 0,
  whiteActive = false,
  blackActive = false,
  maxMoves = 12,
  children = null
}) {
  const { whiteMoves, blackMoves } = useMemo(() => {
    const white = [];
    const black = [];
    for (const row of moves) {
      if (row?.color === "w") white.push(row.san);
      else if (row?.color === "b") black.push(row.san);
    }
    return {
      whiteMoves: white.slice(-maxMoves),
      blackMoves: black.slice(-maxMoves)
    };
  }, [moves, maxMoves]);

  const whoLabel = (color) => {
    const isRhizoh =
      (color === "w" && rhizohColor === "w") || (color === "b" && rhizohColor === "b");
    return isRhizoh ? "Rhizoh AI" : "Stockfish";
  };

  return (
    <div className="flex w-full max-w-5xl items-stretch justify-center gap-2 sm:gap-3">
      <FlankColumnV0
        side="left"
        name={whiteName}
        who={whoLabel("w")}
        clockMs={whiteClockMs}
        active={whiteActive}
        moves={whiteMoves}
        tr={tr}
      />
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center">{children}</div>
      <FlankColumnV0
        side="right"
        name={blackName}
        who={whoLabel("b")}
        clockMs={blackClockMs}
        active={blackActive}
        moves={blackMoves}
        tr={tr}
      />
    </div>
  );
});

const FlankColumnV0 = memo(function FlankColumnV0({
  side,
  name,
  who,
  clockMs,
  active,
  moves,
  tr
}) {
  const align = side === "right" ? "text-right" : "text-left";
  return (
    <div
      className={`hidden w-[4.5rem] shrink-0 flex-col sm:flex sm:w-[5.5rem] md:w-[6.5rem] ${align}`}
      data-rhizoh-chess-flank={side}
    >
      <div
        className={`mb-2 rounded-lg border px-1.5 py-1 ${
          active ? "border-cyan-300/55 bg-cyan-500/15" : "border-white/10 bg-black/35"
        }`}
      >
        <p className="truncate text-[8px] font-semibold text-white/85">{name}</p>
        <p className={`font-mono text-[11px] font-bold ${active ? "text-cyan-100" : "text-white/70"}`}>
          {formatChessClockV0(clockMs)}
        </p>
        <p className="truncate text-[7px] text-white/45">{who}</p>
        {active ? (
          <p className="text-[7px] uppercase tracking-wider text-cyan-200/70">
            {tr ? "Hamlede" : "On clock"}
          </p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-white/10 bg-black/40 px-1 py-1.5 [scrollbar-width:thin]">
        <p className="mb-1 text-[7px] font-semibold uppercase tracking-wide text-white/35">
          {tr ? "Hamleler" : "Moves"}
        </p>
        {moves.length ? (
          <ul className={`space-y-0.5 font-mono text-[9px] leading-tight ${align}`}>
            {moves.map((san, idx) => (
              <li key={`${side}-${idx}-${san}`} className="text-emerald-100/90">
                {idx + 1}. {san}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[8px] text-white/35">{tr ? "—" : "—"}</p>
        )}
      </div>
    </div>
  );
});
