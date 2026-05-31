import React, { memo, useCallback, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const STORAGE_KEY_V0 = "rhizoh.trust_update_strip.v1";

/** @returns {'open'|'collapsed'} */
function readTrustStripModeV0() {
  if (typeof localStorage === "undefined") return "collapsed";
  try {
    const v = String(localStorage.getItem(STORAGE_KEY_V0) || "").trim();
    return v === "open" ? "open" : "collapsed";
  } catch {
    return "collapsed";
  }
}

/** @param {'open'|'collapsed'} mode */
function writeTrustStripModeV0(mode) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_V0, mode === "open" ? "open" : "collapsed");
  } catch {
    /* noop */
  }
}

/**
 * Compact trust / continuity readout (replaces app blurb + quick-start blocks).
 * @param {{
 *   phaseLabel: string,
 *   goals: { headline?: string, progress01?: number, bondScore?: number, turnsLogged?: number, nextStopLabel?: string },
 *   gatewayHeadline?: string,
 *   className?: string
 * }} props
 */
export const RhizohTrustUpdateStrip = memo(function RhizohTrustUpdateStrip({
  phaseLabel,
  goals,
  gatewayHeadline = "",
  className = ""
}) {
  const [mode, setMode] = useState(() => readTrustStripModeV0());
  const open = mode === "open";
  const pct = Math.round(Math.max(0, Math.min(1, Number(goals?.progress01) || 0)) * 100);
  const bond =
    goals?.bondScore != null && Number.isFinite(Number(goals.bondScore))
      ? Number(goals.bondScore).toFixed(2)
      : "—";
  const turns = goals?.turnsLogged != null ? String(goals.turnsLogged) : "—";

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === "open" ? "collapsed" : "open";
      writeTrustStripModeV0(next);
      return next;
    });
  }, []);

  return (
    <section
      role="region"
      aria-label="Trust güncellemesi"
      className={`rounded-2xl border border-violet-400/25 bg-violet-950/20 px-3 py-2 normal-case ${className}`}
      data-rhizoh-trust-strip="1"
      data-trust-strip-mode={mode}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-violet-400/35 bg-violet-950/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-100">
          {phaseLabel || "—"}
        </span>
        <span className="text-[9px] text-white/60">
          güven {bond} · tur {turns} · %{pct}
        </span>
        {gatewayHeadline ? (
          <span className="text-[8px] text-emerald-200/75 truncate max-w-[12rem]">{gatewayHeadline}</span>
        ) : null}
        <button
          type="button"
          onClick={toggle}
          className="ml-auto inline-flex items-center gap-1 text-[9px] font-semibold text-cyan-200/80 hover:text-cyan-100"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {open ? "Gizle" : "Trust detayı"}
        </button>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500/70 to-emerald-400/70 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {open ? (
        <p className="mt-2 text-[10px] leading-relaxed text-white/80">
          {goals?.headline || "Rhizoh ilişki sinyalleri güncelleniyor."}
          {goals?.nextStopLabel ? (
            <span className="block mt-1 text-[9px] text-emerald-200/85">Sonraki: {goals.nextStopLabel}</span>
          ) : null}
        </p>
      ) : null}
    </section>
  );
});

RhizohTrustUpdateStrip.displayName = "RhizohTrustUpdateStrip";
