import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { buildRhizohDirectorTimelineV0 } from "../rhizoh/runtime/rhizohDirectorEngineV0.js";
import { compileRhizohSoraPromptPackV0 } from "../rhizoh/runtime/rhizohSoraPromptCompilerV0.js";
import { buildRhizohWorldSportsObservationShortCaptureV0 } from "../rhizoh/runtime/rhizohWorldSportsObservationShortCaptureV0.js";

/**
 * Studio Director Mode v1 — live scene timeline + Sora prompt pack (stub).
 * RESEARCH-ONLY · interpretation only.
 */
export const RhizohStudioDirectorModePanelV0 = memo(function RhizohStudioDirectorModePanelV0({
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  const [timeline, setTimeline] = useState(() =>
    buildRhizohDirectorTimelineV0({ locale: uiLocale })
  );

  useEffect(() => {
    const tick = () => setTimeline(buildRhizohDirectorTimelineV0({ locale: uiLocale }));
    tick();
    const id = window.setInterval(tick, 4000);
    return () => window.clearInterval(id);
  }, [uiLocale]);

  const soraPack = useMemo(
    () => compileRhizohSoraPromptPackV0(timeline, { locale: uiLocale, limit: 6 }),
    [timeline, uiLocale]
  );

  const sportsShort = useMemo(
    () => buildRhizohWorldSportsObservationShortCaptureV0({ locale: uiLocale }),
    [timeline, uiLocale]
  );

  const onPrintSora = useCallback(() => {
    if (typeof window !== "undefined" && typeof window.__rhizoh?.soraPromptPack === "function") {
      const pack = window.__rhizoh.soraPromptPack({ locale: uiLocale });
      console.log(JSON.stringify(pack, null, 2));
      return;
    }
    console.log(JSON.stringify(soraPack, null, 2));
  }, [soraPack, uiLocale]);

  const liveScenes = timeline.scenes.filter((s) => s.kind !== "program_beat").slice(-4);

  return (
    <section
      className="mb-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-950/15 p-3 normal-case"
      data-testid="rhizoh-studio-director-mode-panel-v0"
    >
      <header className="mb-2">
        <p className="text-[8px] font-black uppercase tracking-[0.22em] text-fuchsia-200/90">
          {tr ? "Yönetmen modu" : "Director mode"}
        </p>
        <p className="mt-0.5 text-[10px] text-white/80">
          {tr
            ? `${timeline.liveSceneCount} canlı sahne · ${timeline.programSceneCount} program beat`
            : `${timeline.liveSceneCount} live scenes · ${timeline.programSceneCount} program beats`}
        </p>
        <p className="mt-1 text-[8px] text-white/45">{timeline.renderLayer.honestLabel}</p>
      </header>

      <div className="mb-2 space-y-1">
        <p className="text-[8px] uppercase tracking-wider text-white/40">
          {tr ? "Kesim tetikleyicileri" : "Cut triggers"}
        </p>
        <p className="font-mono text-[8px] text-fuchsia-100/85">
          drift {timeline.cutTriggers.driftCutArmed ? "●" : "○"} · chess{" "}
          {timeline.cutTriggers.chessMovesSeen} · memory{" "}
          {timeline.cutTriggers.memoryAnchored ? "●" : "○"} · sports{" "}
          {timeline.cutTriggers.worldSportsLive ? "●" : "○"}
        </p>
      </div>

      <ul className="mb-2 max-h-24 space-y-1 overflow-y-auto text-[8px]">
        {liveScenes.map((scene, i) => (
          <li
            key={`${scene.kind}-${scene.atMs}-${i}`}
            className="rounded border border-white/8 bg-black/25 px-2 py-1 text-white/70"
          >
            <span className="text-fuchsia-200/90">{scene.kind}</span>
            <span className="text-white/35"> · </span>
            {scene.narratorHint || scene.label}
          </li>
        ))}
        {liveScenes.length === 0 ? (
          <li className="text-white/35">
            {tr ? "Canlı sahne bekleniyor — cluster çalışsın" : "Awaiting live scenes — run cluster"}
          </li>
        ) : null}
      </ul>

      <div className="mb-2 rounded border border-amber-400/20 bg-amber-500/5 px-2 py-1.5">
        <p className="text-[8px] font-semibold text-amber-100/90">WorldSports #001</p>
        <p className="text-[7px] text-white/50">
          {sportsShort.readyToRecord
            ? tr
              ? "· kayda hazır"
              : "· record ready"
            : tr
              ? "· besleme boş — gateway"
              : "· feed empty — gateway"}
        </p>
      </div>

      <button
        type="button"
        onClick={onPrintSora}
        className="w-full rounded border border-fuchsia-400/35 bg-fuchsia-500/15 px-2 py-1.5 text-[8px] font-semibold uppercase tracking-wider text-fuchsia-100 hover:bg-fuchsia-500/25"
      >
        {tr ? "Sora prompt paketi (konsol)" : "Sora prompt pack (console)"}
      </button>
    </section>
  );
});
