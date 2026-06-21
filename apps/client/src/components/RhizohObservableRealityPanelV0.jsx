import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  listProductBindingEventsV0,
  RHIZOH_PRODUCT_BINDING_EVENT_V0
} from "../rhizoh/runtime/rhizohProductBindingV0.js";
import {
  listWorldActionLogEntriesV0,
  RHIZOH_WORLD_ACTION_LOG_EVENT_V0
} from "../rhizoh/runtime/rhizohWorldActionLogV0.js";
import {
  clearWorldReplayModeV0,
  replayWorldActionLogEntryV0,
  RHIZOH_WORLD_REPLAY_EVENT_V0
} from "../rhizoh/runtime/rhizohWorldReplayV0.js";
import { readProductionLiveMonitorV0 } from "../rhizoh/runtime/rhizohProductionDeploymentRunbookV0.js";
import { emitProductBindingActionV0 } from "../rhizoh/runtime/rhizohProductBindingV0.js";
import { RhizohIdentityManifestPanelV0 } from "./RhizohIdentityManifestPanelV0.jsx";

/**
 * @param {{ section: "reality" | "bindings" | "timeline" }} props
 */
export const RhizohObservableRealityPanelV0 = memo(function RhizohObservableRealityPanelV0({
  section
}) {
  const [tick, setTick] = useState(0);
  const [selectedWalId, setSelectedWalId] = useState(null);

  const bump = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const events = [
      RHIZOH_PRODUCT_BINDING_EVENT_V0,
      RHIZOH_WORLD_ACTION_LOG_EVENT_V0,
      RHIZOH_WORLD_REPLAY_EVENT_V0
    ];
    for (const name of events) {
      window.addEventListener(name, bump);
    }
    const id = window.setInterval(bump, 5000);
    return () => {
      for (const name of events) {
        window.removeEventListener(name, bump);
      }
      window.clearInterval(id);
    };
  }, [bump]);

  const replayActive = typeof window !== "undefined" && window.__rhizoh?.replayMode === true;
  const showReplayBanner = replayActive && (section === "timeline" || section === "reality");

  return (
    <div className="space-y-3" data-rhizoh-observable-reality={section}>
      {showReplayBanner ? <ReplayBanner onExit={bump} /> : null}
      {section === "reality" ? (
        <>
          <LiveMonitorBlock tick={tick} />
          <RhizohIdentityManifestPanelV0 tick={tick} />
        </>
      ) : null}
      {section === "bindings" ? <BindingFeedBlock tick={tick} /> : null}
      {section === "timeline" ? (
        <TimelineBlock
          tick={tick}
          selectedWalId={selectedWalId}
          onSelectWal={setSelectedWalId}
          onReplay={bump}
        />
      ) : null}
    </div>
  );
});

function ReplayBanner({ onExit }) {
  const replay = window.__rhizoh?.replayedWorldState?.replay;
  const entryId = replay?.entry_id || window.__rhizoh?.worldEpisode?.wal_entry_id || "—";

  return (
    <div
      className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-2"
      data-rhizoh-replay-banner="1"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200/95">
            REPLAY_PREVIEW
          </p>
          <p className="text-[10px] text-amber-100/80 normal-case mt-0.5">
            Read-only restore · {entryId}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md border border-amber-300/35 px-2 py-1 text-[9px] uppercase tracking-wide text-amber-100 hover:bg-amber-900/40"
          onClick={() => {
            clearWorldReplayModeV0();
            emitProductBindingActionV0({
              source: "drawer",
              mode: "READ",
              action: "replay_exit"
            });
            onExit();
          }}
        >
          Exit
        </button>
      </div>
    </div>
  );
}

/** @param {{ tick: number }} props */
function LiveMonitorBlock({ tick }) {
  void tick;
  const monitor = useMemo(() => {
    try {
      return readProductionLiveMonitorV0();
    } catch {
      return window.__rhizoh?.liveMonitor || null;
    }
  }, [tick]);

  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  const presence = rh.presenceFrame;
  const continuity = rh.continuityFirstPaint;
  const coPresence = rh.coPresence;
  const anomalies = Array.isArray(monitor?.anomalies) ? monitor.anomalies : [];

  const fmt = (v) => (v === true ? "yes" : v === false ? "no" : v == null ? "—" : String(v));

  return (
    <div className="space-y-2 rounded-xl border border-emerald-400/25 bg-emerald-950/15 p-3">
      <p className="text-[9px] font-black tracking-[0.22em] text-emerald-200/95">LIVE MONITOR</p>
      <div className="grid grid-cols-2 gap-1.5 text-[9px] normal-case">
        <Metric label="Rhythm OK" value={fmt(monitor?.rhythm?.ok)} />
        <Metric label="SCR tick" value={fmt(monitor?.scr?.tick_seq ?? presence?.tickSeq)} />
        <Metric label="Max jitter ms" value={fmt(monitor?.rhythm?.max_jitter_ms)} />
        <Metric label="Drift class" value={fmt(monitor?.identity?.drift_class)} />
        <Metric label="Same world" value={fmt(monitor?.identity?.same_world)} />
        <Metric label="Castle lock" value={fmt(monitor?.castle?.projection_locked)} />
        <Metric label="Pet inhabited" value={fmt(monitor?.pet?.inhabited)} />
        <Metric label="Coherence" value={fmt(presence?.coherenceId ?? monitor?.scr?.coherence_id)} />
      </div>
      <Group title="System health">
        <Metric label="WAL chain" value={fmt(monitor?.identity?.chain_ok)} />
        <Metric label="SCR rate OK" value={fmt(monitor?.scr?.tick_rate_ok)} />
        <Metric label="Emergency" value={fmt(monitor?.emergency_mode)} />
      </Group>
      <Group title="Presence">
        <Metric label="Continuity FP" value={fmt(continuity?.ok)} />
        <Metric label="Co-presence" value={fmt(coPresence?.ok)} />
      </Group>
      {anomalies.length ? (
        <div className="flex flex-wrap gap-1 pt-1">
          {anomalies.slice(0, 8).map((a, i) => (
            <span
              key={`${a?.code || "a"}-${i}`}
              className="rounded-full border border-rose-400/30 bg-rose-950/25 px-2 py-0.5 text-[8px] text-rose-100/90"
            >
              {a?.code || a?.kind || "anomaly"}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[8px] text-white/40 normal-case">No anomalies in liveMonitor.</p>
      )}
    </div>
  );
}

/** @param {{ tick: number }} props */
function BindingFeedBlock({ tick }) {
  void tick;
  const events = useMemo(() => listProductBindingEventsV0(32).slice().reverse(), [tick]);
  const freq = useMemo(() => {
    const m = new Map();
    for (const e of events) {
      const key = `${e.source}:${e.action}`;
      m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  }, [events]);

  if (!events.length) {
    return (
      <p className="text-[10px] text-white/50 normal-case rounded-lg border border-white/10 px-3 py-4">
        No binding events yet — use Cap Wheel or shell bar.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black tracking-[0.22em] text-violet-200/95">BINDING FEED</p>
      <ul className="max-h-48 space-y-1 overflow-y-auto no-scrollbar">
        {events.map((e) => (
          <li
            key={`${e.atMs}-${e.action}-${e.source}`}
            className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[9px] normal-case"
          >
            <span className="text-violet-200/90 font-semibold">{e.mode}</span>
            <span className="text-white/40"> · </span>
            <span className="text-white/75">{e.source}</span>
            <span className="text-white/40"> → </span>
            <span className="text-cyan-100/85">{e.action}</span>
            <span className="block text-[8px] text-white/35 mt-0.5">
              {new Date(e.atMs).toLocaleTimeString()} · ×{freq.get(`${e.source}:${e.action}`) || 1}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * @param {{
 *   tick: number,
 *   selectedWalId: string | null,
 *   onSelectWal: (id: string | null) => void,
 *   onReplay: () => void
 * }} props
 */
function TimelineBlock({ tick, selectedWalId, onSelectWal, onReplay }) {
  void tick;
  const entries = useMemo(() => {
    const fromWindow = window.__rhizoh?.worldActionLog?.entries;
    const list = Array.isArray(fromWindow) ? fromWindow : listWorldActionLogEntriesV0(48);
    return list.slice().reverse();
  }, [tick]);

  const selected = useMemo(
    () => entries.find((e) => e.entry_id === selectedWalId) || null,
    [entries, selectedWalId]
  );

  const deriveSource = (entry) => {
    if (!entry) return "—";
    const ch = entry.lineage?.channel || entry.lineage?.source;
    if (ch) return String(ch);
    if (entry.artifact_ref?.kind) return String(entry.artifact_ref.kind);
    return "scr";
  };

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black tracking-[0.22em] text-cyan-200/95">WAL TIMELINE</p>
      {!entries.length ? (
        <p className="text-[10px] text-white/50 normal-case">No WAL entries in ring yet.</p>
      ) : (
        <ul className="max-h-36 space-y-1 overflow-y-auto no-scrollbar">
          {entries.map((e) => (
            <li key={e.entry_id}>
              <button
                type="button"
                onClick={() => onSelectWal(e.entry_id)}
                className={`w-full rounded-md border px-2 py-1.5 text-left text-[9px] normal-case transition ${
                  selectedWalId === e.entry_id
                    ? "border-cyan-400/50 bg-cyan-950/30 text-cyan-50"
                    : "border-white/10 bg-black/25 text-white/75 hover:border-cyan-400/25"
                }`}
              >
                <span className="font-mono text-[8px] text-white/45">{e.entry_id}</span>
                <span className="block text-white/80">
                  ep {e.episode_seq} · {deriveSource(e)} · {new Date(e.atMs).toLocaleTimeString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected ? (
        <div className="rounded-lg border border-white/12 bg-black/35 p-2 text-[9px] normal-case space-y-1">
          <p className="text-white/50 font-mono text-[8px] break-all">{selected.entry_id}</p>
          <Metric label="Episode" value={String(selected.episode_seq)} />
          <Metric
            label="Coherence"
            value={selected.stream_coherence_id || selected.t0_frame?.coherenceId || "—"}
          />
          <pre className="max-h-24 overflow-auto rounded bg-black/50 p-2 text-[8px] text-white/60 whitespace-pre-wrap break-all">
            {JSON.stringify(
              {
                t0_frame: selected.t0_frame,
                lineage: selected.lineage,
                artifact_ref: selected.artifact_ref
              },
              null,
              0
            )}
          </pre>
          <button
            type="button"
            className="w-full rounded-md border border-cyan-400/35 bg-cyan-950/25 py-1.5 text-[9px] uppercase tracking-wide text-cyan-100 hover:bg-cyan-900/35"
            onClick={() => {
              replayWorldActionLogEntryV0(selected.entry_id);
              emitProductBindingActionV0({
                source: "drawer",
                mode: "REPLAY",
                action: "preview",
                walEntryId: selected.entry_id
              });
              onReplay();
            }}
          >
            Preview replay (read-only)
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** @param {{ label: string, value: string }} props */
function Metric({ label, value }) {
  return (
    <div className="flex justify-between gap-2 rounded-md border border-white/8 bg-black/20 px-2 py-1">
      <span className="text-white/50">{label}</span>
      <span className="text-white/85 font-medium">{value}</span>
    </div>
  );
}

/** @param {{ title: string, children: React.ReactNode }} props */
function Group({ title, children }) {
  return (
    <div className="space-y-1 pt-1 border-t border-white/8">
      <p className="text-[8px] uppercase tracking-wider text-white/40">{title}</p>
      {children}
    </div>
  );
}
