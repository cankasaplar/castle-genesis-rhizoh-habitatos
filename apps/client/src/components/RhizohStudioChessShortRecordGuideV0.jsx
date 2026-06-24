import React, { memo, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { runStudioObservationDemoSeedV0 } from "../rhizoh/runtime/rhizohStudioDemoSeedV0.js";

/**
 * Guided 60s record walkthrough for Chess Observation Short #001.
 * RESEARCH-ONLY — teleprompter only; no video capture pipeline.
 */
export const RhizohStudioChessShortRecordGuideV0 = memo(function RhizohStudioChessShortRecordGuideV0({
  capture,
  uiLocale = "en",
  onRefresh
}) {
  const tr = uiLocale === "tr";
  const [open, setOpen] = useState(false);
  const [beatIdx, setBeatIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const shots = capture?.shotList || [];
  const shot = shots[beatIdx] || null;

  useEffect(() => {
    if (!running || !shot) return undefined;
    setSecondsLeft(shot.durationSec);
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, beatIdx, shot?.durationSec]);

  const onStart = useCallback(() => {
    setOpen(true);
    setBeatIdx(0);
    setRunning(true);
  }, []);

  const onNext = useCallback(() => {
    if (beatIdx >= shots.length - 1) {
      setRunning(false);
      return;
    }
    setBeatIdx((i) => i + 1);
    setRunning(true);
  }, [beatIdx, shots.length]);

  const onPrev = useCallback(() => {
    setBeatIdx((i) => Math.max(0, i - 1));
    setRunning(false);
  }, []);

  const onDemoSeed = useCallback(() => {
    if (typeof window !== "undefined" && typeof window.__rhizoh?.studioDemoSeed === "function") {
      window.__rhizoh.studioDemoSeed({ locale: uiLocale });
    } else {
      runStudioObservationDemoSeedV0({ locale: uiLocale });
    }
    onRefresh?.();
  }, [uiLocale, onRefresh]);

  if (!capture?.readyToRecord) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={onStart}
        className="mb-2 w-full rounded-lg border border-fuchsia-400/35 bg-fuchsia-500/15 px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-fuchsia-100 hover:bg-fuchsia-500/25"
        data-testid="rhizoh-chess-short-record-guide-start"
      >
        {tr ? "Kayıt rehberi · Short #001" : "Record guide · Short #001"}
      </button>
    );
  }

  if (!shot) return null;

  const needsDemoSeed =
    shot.id === "memory" && capture.digest.lifeOsStatus === "DORMANT";

  return (
    <section
      className="mb-2 rounded-lg border border-fuchsia-400/30 bg-fuchsia-950/20 p-2"
      data-testid="rhizoh-chess-short-record-guide-v0"
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[8px] font-black uppercase tracking-wider text-fuchsia-200/90">
          {tr ? "Kayıt rehberi" : "Record guide"} · {shot.beat}/{shots.length}
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setRunning(false);
          }}
          className="text-[8px] text-white/40 hover:text-white/70"
        >
          {tr ? "Kapat" : "Close"}
        </button>
      </header>

      <p className="text-[9px] font-semibold text-white/90">{shot.scene}</p>
      <p className="mt-1 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[10px] leading-relaxed text-fuchsia-50/95">
        {shot.narratorLine}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[8px] text-white/50">
        <span className="font-mono text-fuchsia-200/90">
          {running ? `${secondsLeft}s` : `${shot.durationSec}s`}
        </span>
        <Link to={shot.captureUrl} className="text-cyan-300/90 underline">
          {shot.captureUrl}
        </Link>
        <span className="font-mono text-white/35">{shot.consoleHook}</span>
      </div>

      {needsDemoSeed ? (
        <button
          type="button"
          onClick={onDemoSeed}
          className="mt-2 w-full rounded border border-violet-400/35 bg-violet-500/15 px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-violet-100"
        >
          {tr ? "Hafıza beat · demo tohumu" : "Memory beat · demo seed"}
        </button>
      ) : null}

      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={beatIdx === 0}
          className="flex-1 rounded border border-white/15 px-2 py-1 text-[8px] text-white/60 disabled:opacity-30"
        >
          {tr ? "Önceki" : "Prev"}
        </button>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="flex-1 rounded border border-fuchsia-400/35 bg-fuchsia-500/15 px-2 py-1 text-[8px] font-semibold text-fuchsia-100"
        >
          {running ? (tr ? "Duraklat" : "Pause") : tr ? "Süre başlat" : "Start timer"}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded border border-white/15 px-2 py-1 text-[8px] text-white/80"
        >
          {beatIdx >= shots.length - 1 ? (tr ? "Bitti" : "Done") : tr ? "Sonraki" : "Next"}
        </button>
      </div>
    </section>
  );
});
