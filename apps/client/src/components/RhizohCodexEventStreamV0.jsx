import React, { memo, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  RHIZOH_CODEX_BUS_EVENT_V0,
  onCodexBusV0
} from "../core/CodexBusV0.js";
import { CODEX_EVENT_TYPE_V0 } from "../core/codexReducerV0.js";
import {
  RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0,
  RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0
} from "../rhizoh/runtime/spiralMMOAwakeningCycleV0.js";
import { resolveRhizohWorldSpaceMapOverlayBottomCssV0 } from "../rhizoh/runtime/rhizohWorldSurfacePolicyV0.js";

const STREAM_TYPES_V0 = new Set([
  CODEX_EVENT_TYPE_V0.GHOST_DISPATCH,
  CODEX_EVENT_TYPE_V0.GHOST_ARCHIVED,
  CODEX_EVENT_TYPE_V0.GHOST_SPAWN,
  CODEX_EVENT_TYPE_V0.GHOST_DEATH,
  CODEX_EVENT_TYPE_V0.DIMENSIONAL_COLLAPSE,
  CODEX_EVENT_TYPE_V0.AWAKEN,
  "SYS_LOG"
]);

const MAX_ENTRIES_V0 = 50;

function formatStreamEntryV0(type, payload, ts) {
  const timeStr = new Date(ts).toISOString().split("T")[1].slice(0, 12);
  if (type === "SYS_LOG") {
    return { className: payload?.class || "", text: `[${timeStr}] ${payload?.msg || ""}` };
  }
  if (type === CODEX_EVENT_TYPE_V0.GHOST_SPAWN || type === CODEX_EVENT_TYPE_V0.GHOST_DISPATCH) {
    const id = String(payload?.ghostId || payload?.id || "").split("-")[0];
    const src = payload?.src || payload?.origin || "";
    const dst = payload?.dst || payload?.destination || "";
    return { className: "spawn", text: `[${timeStr}] SPAWN: ${id} | ${src} → ${dst}` };
  }
  if (type === CODEX_EVENT_TYPE_V0.GHOST_DEATH || type === CODEX_EVENT_TYPE_V0.GHOST_ARCHIVED) {
    const id = String(payload?.ghostId || payload?.id || "").split("-")[0];
    return { className: "death", text: `[${timeStr}] ARCHIVED: ${id}` };
  }
  if (type === CODEX_EVENT_TYPE_V0.DIMENSIONAL_COLLAPSE) {
    return {
      className: "collapse",
      text: `[${timeStr}] CYCLE L-${payload?.layer} COLLAPSED. SEED: ${payload?.seed}`
    };
  }
  if (type === CODEX_EVENT_TYPE_V0.AWAKEN) {
    return { className: "spawn", text: `[${timeStr}] AWAKEN: ${payload?.pin || payload?.continent || ""}` };
  }
  return { className: "", text: `[${timeStr}] ${type}` };
}

/**
 * Live codex event stream — IndexedDB audit trail (interpretation only).
 */
export const RhizohCodexEventStreamV0 = memo(function RhizohCodexEventStreamV0() {
  const [entries, setEntries] = useState(() => [
    { id: "ready", className: "collapse", text: "SYSTEM_READY: awaiting events…" }
  ]);
  const [spiralImmersion, setSpiralImmersion] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const overlayBottomCssV0 = resolveRhizohWorldSpaceMapOverlayBottomCssV0();

  useEffect(() => {
    const onEnter = () => setSpiralImmersion(true);
    const onExit = () => setSpiralImmersion(false);
    window.addEventListener(RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0, onEnter);
    window.addEventListener(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0, onExit);
    return () => {
      window.removeEventListener(RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0, onEnter);
      window.removeEventListener(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0, onExit);
    };
  }, []);

  useEffect(() => {
    const push = (type, payload, meta) => {
      if (!STREAM_TYPES_V0.has(type)) return;
      const row = formatStreamEntryV0(type, payload, meta?.atMs || Date.now());
      setEntries((prev) => {
        const next = [...prev.filter((e) => e.id !== "ready"), { id: `${type}_${Date.now()}`, ...row }];
        return next.length > MAX_ENTRIES_V0 ? next.slice(-MAX_ENTRIES_V0) : next;
      });
    };

    const unsubs = [
      onCodexBusV0(CODEX_EVENT_TYPE_V0.GHOST_DISPATCH, (p, m) => push(CODEX_EVENT_TYPE_V0.GHOST_DISPATCH, p, m)),
      onCodexBusV0(CODEX_EVENT_TYPE_V0.GHOST_ARCHIVED, (p, m) => push(CODEX_EVENT_TYPE_V0.GHOST_ARCHIVED, p, m)),
      onCodexBusV0(CODEX_EVENT_TYPE_V0.GHOST_SPAWN, (p, m) => push(CODEX_EVENT_TYPE_V0.GHOST_SPAWN, p, m)),
      onCodexBusV0(CODEX_EVENT_TYPE_V0.GHOST_DEATH, (p, m) => push(CODEX_EVENT_TYPE_V0.GHOST_DEATH, p, m)),
      onCodexBusV0(CODEX_EVENT_TYPE_V0.DIMENSIONAL_COLLAPSE, (p, m) =>
        push(CODEX_EVENT_TYPE_V0.DIMENSIONAL_COLLAPSE, p, m)
      ),
      onCodexBusV0(CODEX_EVENT_TYPE_V0.AWAKEN, (p, m) => push(CODEX_EVENT_TYPE_V0.AWAKEN, p, m)),
      onCodexBusV0("SYS_LOG", (p, m) => push("SYS_LOG", p, m))
    ];

    const onDom = (ev) => {
      const d = ev?.detail;
      if (!d?.type || !STREAM_TYPES_V0.has(d.type)) return;
      push(d.type, d.payload, { atMs: d.atMs });
    };
    window.addEventListener(RHIZOH_CODEX_BUS_EVENT_V0, onDom);

    return () => {
      unsubs.forEach((fn) => fn());
      window.removeEventListener(RHIZOH_CODEX_BUS_EVENT_V0, onDom);
    };
  }, []);

  if (spiralImmersion) return null;

  return (
    <aside
      className="pointer-events-auto absolute left-3 z-[90] flex w-[min(16rem,44vw)] flex-col rounded-lg border border-white/10 bg-[rgba(20,20,19,0.92)] p-2 shadow-xl sm:w-64"
      style={{ bottom: overlayBottomCssV0 }}
      data-rhizoh-codex-event-stream="1"
      aria-label="Rhizoh event stream"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="font-mono text-[9px] font-bold tracking-wider text-[#788c5d]">
          EVENT STREAM
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="rounded border border-white/10 p-0.5 text-white/50 hover:text-white"
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
      {!collapsed ? (
        <div className="max-h-32 overflow-y-auto font-mono text-[9px] leading-relaxed text-[#e8e6dc]">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="mb-1 border-l-2 pl-1.5"
              style={{
                borderColor:
                  entry.className === "spawn"
                    ? "#6a9bcc"
                    : entry.className === "death"
                      ? "#d97757"
                      : entry.className === "collapse"
                        ? "#788c5d"
                        : "#b0aea5",
                color: entry.className === "death" ? "#b0aea5" : entry.className === "collapse" ? "#788c5d" : undefined,
                fontWeight: entry.className === "collapse" ? 600 : undefined
              }}
            >
              {entry.text}
            </div>
          ))}
        </div>
      ) : (
        <p className="font-mono text-[8px] text-white/40">
          {entries[entries.length - 1]?.text?.slice(0, 72) || "…"}
        </p>
      )}
    </aside>
  );
});
