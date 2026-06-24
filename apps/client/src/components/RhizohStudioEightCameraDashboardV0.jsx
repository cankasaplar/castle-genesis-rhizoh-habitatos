import React, { memo, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildRhizohStudioVisibilitySnapshotV0 } from "../rhizoh/runtime/rhizohStudioVisibilitySnapshotV0.js";
import { buildStudioEightCameraDashboardTilesV0 } from "../rhizoh/runtime/rhizohStudioEightCameraDashboardMetaV0.js";

function readStudioVisibilitySnapshotV0() {
  if (typeof window !== "undefined" && typeof window.__rhizoh?.studioVisibility === "function") {
    return window.__rhizoh.studioVisibility();
  }
  try {
    return buildRhizohStudioVisibilitySnapshotV0();
  } catch {
    return null;
  }
}

/**
 * Studio V1 — 8-camera observation dashboard (2×4 grid).
 * Surfaces `studioVisibility()` data for investors, players, and first users.
 * RESEARCH-ONLY · interpretation only · no execution authority.
 */
export const RhizohStudioEightCameraDashboardV0 = memo(function RhizohStudioEightCameraDashboardV0({
  uiLocale = "en",
  compact = false
}) {
  const tr = uiLocale === "tr";
  const [snap, setSnap] = useState(() => readStudioVisibilitySnapshotV0());

  useEffect(() => {
    const tick = () => setSnap(readStudioVisibilitySnapshotV0());
    tick();
    const id = window.setInterval(tick, 3000);
    return () => window.clearInterval(id);
  }, []);

  const tiles = useMemo(
    () => (snap ? buildStudioEightCameraDashboardTilesV0(snap, uiLocale) : []),
    [snap, uiLocale]
  );

  const liveCount = useMemo(() => tiles.filter((t) => t.live || t.armed).length, [tiles]);

  if (!snap) return null;

  return (
    <section
      className={`rounded-xl border border-cyan-400/30 bg-[#060b14]/95 normal-case shadow-inner ${
        compact ? "p-2" : "p-3"
      }`}
      data-testid="rhizoh-studio-eight-camera-dashboard-v0"
    >
      <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-cyan-200/90">
            {tr ? "Stüdyo gösterge paneli" : "Studio dashboard"}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-white/90">
            {tr ? "8 kamera · gözlem katmanı" : "8 cameras · observation layer"}
          </p>
          <p className="mt-1 text-[9px] leading-relaxed text-white/50">
            {tr
              ? `${liveCount}/8 kamera sinyal taşıyor · yürütme yok`
              : `${liveCount}/8 cameras carrying signal · no execution`}
          </p>
        </div>
        <span className="rounded-md border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-wider text-white/40">
          v1
        </span>
      </header>

      <div
        className="grid grid-cols-2 gap-2"
        role="list"
        aria-label={tr ? "Sekiz kamera paneli" : "Eight camera panels"}
      >
        {tiles.map((tile) => (
          <CameraTile key={tile.id} tile={tile} tr={tr} />
        ))}
      </div>
    </section>
  );
});

/** @param {{ tile: ReturnType<typeof buildStudioEightCameraDashboardTilesV0>[number], tr: boolean }} props */
function CameraTile({ tile, tr }) {
  const armedClass = tile.live
    ? "border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
    : tile.armed
      ? "border-violet-400/40 bg-violet-500/10"
      : tile.held
        ? "border-amber-400/25 bg-amber-500/5"
        : "border-white/10 bg-black/25";

  const statusClass = tile.live
    ? "text-emerald-200"
    : tile.armed
      ? "text-violet-200"
      : tile.held
        ? "text-amber-200/80"
        : "text-white/35";

  const body = (
    <>
      <div className="flex items-start justify-between gap-1">
        <p className="text-[8px] font-bold uppercase tracking-wider text-white/90">{tile.title}</p>
        <span className={`text-[7px] font-mono uppercase ${statusClass}`}>
          {tile.live ? "● live" : tile.armed ? "●" : tile.held ? "hold" : "○"}
        </span>
      </div>
      <p className="mt-1 font-mono text-[10px] font-semibold text-cyan-100/95">{tile.primary}</p>
      <p className="mt-0.5 truncate text-[8px] text-white/45">{tile.secondary}</p>
      <p className={`mt-1 text-[7px] uppercase tracking-wide ${statusClass}`}>{tile.status}</p>
    </>
  );

  if (tile.href && !tile.held) {
    return (
      <Link
        to={tile.href}
        role="listitem"
        className={`block rounded-lg border p-2 transition hover:brightness-110 ${armedClass}`}
        data-camera-id={tile.id}
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      role="listitem"
      className={`rounded-lg border p-2 ${armedClass} ${tile.held ? "opacity-70" : ""}`}
      data-camera-id={tile.id}
    >
      {body}
    </div>
  );
}
