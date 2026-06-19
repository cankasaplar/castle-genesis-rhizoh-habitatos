import React, { memo, useMemo } from "react";

/**
 * Split move list — white from bottom, black from top (standard scoresheet feel).
 */
export const ChessSplitMoveListV0 = memo(function ChessSplitMoveListV0({
  moves = [],
  tr = true,
  rhizohColor = "w",
  maxPairs = 10,
  compact = false
}) {
  const pairs = useMemo(() => {
    const rows = [];
    for (let i = 0; i < moves.length; i += 2) {
      rows.push({
        num: Math.floor(i / 2) + 1,
        white: moves[i] || null,
        black: moves[i + 1] || null
      });
    }
    return rows.slice(-maxPairs);
  }, [moves, maxPairs]);

  const labelFor = (row, color) => {
    if (!row) return "—";
    const isRhizoh =
      (color === "w" && rhizohColor === "w") || (color === "b" && rhizohColor === "b");
    const who = isRhizoh ? "Rhizoh" : "Stockfish";
    return `${row.san} · ${who}`;
  };

  return (
    <div
      className={`flex min-h-0 flex-col rounded-lg border border-white/10 bg-black/40 ${
        compact ? "p-2 text-[9px]" : "p-3 text-[10px]"
      }`}
    >
      <p className="mb-2 font-semibold uppercase tracking-wide text-violet-200/80">
        {tr ? "Hamleler" : "Moves"}
      </p>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-2">
        <div className="space-y-0.5 text-white/55">
          <p className="text-[8px] uppercase tracking-wider text-white/35">
            {tr ? "Siyah ↑" : "Black ↑"}
          </p>
          {pairs.length ? (
            pairs
              .slice()
              .reverse()
              .map((pair) => (
                <p key={`b-${pair.num}`} className="font-mono text-cyan-100/75">
                  {pair.num}. … {labelFor(pair.black, "b")}
                </p>
              ))
          ) : (
            <p className="text-white/35">{tr ? "—" : "—"}</p>
          )}
        </div>
        <div className="space-y-0.5 border-t border-white/10 pt-2 text-white/80">
          <p className="text-[8px] uppercase tracking-wider text-white/35">
            {tr ? "Beyaz ↓" : "White ↓"}
          </p>
          {pairs.length ? (
            pairs
              .slice()
              .reverse()
              .map((pair) => (
                <p key={`w-${pair.num}`} className="font-mono text-emerald-100/90">
                  {pair.num}. {labelFor(pair.white, "w")}
                </p>
              ))
          ) : (
            <p className="text-white/35">{tr ? "hamle bekleniyor" : "awaiting moves"}</p>
          )}
        </div>
      </div>
    </div>
  );
});
