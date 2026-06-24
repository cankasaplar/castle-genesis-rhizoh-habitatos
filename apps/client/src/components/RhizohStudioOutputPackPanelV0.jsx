import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { buildRhizohOutputPackV0 } from "../rhizoh/runtime/rhizohOutputEngineV0.js";

/**
 * Studio Output Pack panel — upload checklist + export.
 * RESEARCH-ONLY · no video render · no YouTube API.
 */
export const RhizohStudioOutputPackPanelV0 = memo(function RhizohStudioOutputPackPanelV0({
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  const [pack, setPack] = useState(() => buildRhizohOutputPackV0({ locale: uiLocale }));

  useEffect(() => {
    const tick = () => setPack(buildRhizohOutputPackV0({ locale: uiLocale }));
    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [uiLocale]);

  const onCopy = useCallback(async () => {
    const { copyRhizohOutputPackV0 } = await import("../rhizoh/runtime/rhizohOutputEngineWireV0.js");
    const result = await copyRhizohOutputPackV0({ locale: uiLocale });
    if (result.hint && typeof console !== "undefined") console.info(result.hint);
  }, [uiLocale]);

  const onExportJson = useCallback(async () => {
    const { exportRhizohOutputPackJsonV0 } = await import(
      "../rhizoh/runtime/rhizohOutputEngineWireV0.js"
    );
    await exportRhizohOutputPackJsonV0({ locale: uiLocale });
  }, [uiLocale]);

  const readyLabel = useMemo(() => {
    return tr
      ? `${pack.readyProgramCount}/2 program hazır · ~${pack.totalDurationSecTarget}s`
      : `${pack.readyProgramCount}/2 programs ready · ~${pack.totalDurationSecTarget}s`;
  }, [pack, tr]);

  return (
    <section
      className="mb-2 rounded-xl border border-sky-400/25 bg-sky-950/15 p-3 normal-case"
      data-testid="rhizoh-studio-output-pack-panel-v0"
    >
      <header className="mb-2">
        <p className="text-[8px] font-black uppercase tracking-[0.22em] text-sky-200/90">
          {tr ? "Çıktı motoru" : "Output engine"}
        </p>
        <p className="mt-0.5 text-[10px] text-white/85">v1 · {readyLabel}</p>
        <p className="mt-1 text-[8px] text-white/45">
          {tr
            ? "Ekran kaydı + manuel YouTube — render API yok"
            : "Screen record + manual YouTube — no render API"}
        </p>
      </header>

      <ul className="mb-2 space-y-1 text-[8px] text-white/65">
        {pack.uploadChecklist.map((row) => (
          <li
            key={row.id}
            className={`rounded border px-2 py-1 ${
              row.blocked ? "border-white/10 opacity-50" : "border-white/15"
            }`}
          >
            <span>{row.label}</span>
            {row.hint ? <span className="text-white/35"> · {row.hint}</span> : null}
          </li>
        ))}
      </ul>

      <div className="mb-2 space-y-1">
        {pack.programs.map((program) => (
          <div
            key={program.id}
            className="rounded border border-white/10 bg-black/25 px-2 py-1 text-[8px]"
          >
            <span className="text-sky-100/90">{program.title}</span>
            <span className="text-white/40">
              {" "}
              · {program.readyToRecord ? "✔" : "○"} · {program.shotCount}{" "}
              {tr ? "beat" : "beats"} · {program.durationSecTarget}s
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={onCopy}
          className="flex-1 rounded border border-sky-400/35 bg-sky-500/15 px-2 py-1.5 text-[8px] font-semibold uppercase tracking-wider text-sky-100 hover:bg-sky-500/25"
        >
          {tr ? "Paketi kopyala" : "Copy pack"}
        </button>
        <button
          type="button"
          onClick={onExportJson}
          className="flex-1 rounded border border-white/15 px-2 py-1.5 text-[8px] font-semibold uppercase tracking-wider text-white/70 hover:bg-white/5"
        >
          JSON
        </button>
      </div>
    </section>
  );
});
