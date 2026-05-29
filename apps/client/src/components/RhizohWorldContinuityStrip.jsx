import React, { useEffect, useState } from "react";
import {
  getWorldObservationRingV0,
  subscribeWorldObservationV0
} from "../rhizoh/runtime/worldObservationBusV0.js";
import { isPriorityWorldObservationV0 } from "../rhizoh/runtime/worldObservationDensityV0.js";
import {
  cycleRhizohUiTextModeV0,
  getRhizohUiTextModeV0,
  getRhizohUiTextVisibilityV0,
  RHIZOH_UI_TEXT_MODE_V0
} from "../rhizoh/runtime/rhizohUiTextModeV0.js";

function filterRowsForMode(rows, mode) {
  if (mode === RHIZOH_UI_TEXT_MODE_V0.FULL) return rows;
  if (mode === RHIZOH_UI_TEXT_MODE_V0.CLEAN) {
    return rows.filter((row) => isPriorityWorldObservationV0(row.type, row.payload));
  }
  return rows.filter((row) => isPriorityWorldObservationV0(row.type, row.payload)).slice(-3);
}

/** Live world + genesis strip — FULL / CLEAN / ZEN text modes. */
export function RhizohWorldContinuityStrip({ gatewayPhase = "" }) {
  const [textMode, setTextMode] = useState(() => getRhizohUiTextModeV0());
  const visibility = getRhizohUiTextVisibilityV0(textMode);
  const [rows, setRows] = useState(() => getWorldObservationRingV0().slice(-8));
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    return subscribeWorldObservationV0((row) => {
      setRows((cur) => [...cur, row].slice(-expanded ? 24 : 12));
    });
  }, [expanded]);

  const filtered = filterRowsForMode(rows, textMode);

  if (!filtered.length) {
    return (
      <div className="mx-1 mb-2 rounded-xl border border-dashed border-cyan-500/20 bg-black/30 px-3 py-2 text-[9px] text-white/50 normal-case">
        Dünya nabzı bekleniyor… ({textMode})
      </div>
    );
  }

  const visible = expanded ? filtered.slice(-24) : filtered.slice(textMode === RHIZOH_UI_TEXT_MODE_V0.ZEN ? -2 : -5);

  return (
    <div className="mx-1 mb-2 rounded-xl border border-cyan-500/25 bg-black/40 px-3 py-2 normal-case">
      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
        <span className="text-[9px] font-bold tracking-[0.14em] text-cyan-200/90 uppercase">
          {visibility.minimalLabels ? "Nabız" : "Dünya nabzı"}
        </span>
        <span className="text-[8px] text-white/45">
          gateway {gatewayPhase || "—"} · {textMode}
        </span>
        {visibility.eventStream ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[8px] text-cyan-200/80 hover:text-cyan-100"
          >
            {expanded ? "Daralt" : "Genişlet"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setTextMode(cycleRhizohUiTextModeV0())}
          className="text-[8px] text-white/50 hover:text-cyan-100"
          title="UI text mode: zen → clean → full"
        >
          Metin: {textMode}
        </button>
      </div>
      <ul className="space-y-0.5 max-h-28 overflow-y-auto no-scrollbar" aria-live="polite">
        {visible.map((row, i) => (
          <li key={`${row.atMs}-${i}-${row.type}`} className="text-[9px] text-white/75 font-mono leading-snug">
            <span className="text-white/35">{new Date(row.atMs).toLocaleTimeString()}</span>
            {" · "}
            <span className="text-cyan-200/85">{row.type}</span>
            {" · "}
            {row.line}
          </li>
        ))}
      </ul>
    </div>
  );
}
