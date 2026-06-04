import React, { memo, useEffect, useState } from "react";
import {
  disableRhizohControlCenterV0,
  isRhizohControlCenterEnabledV0,
  snapshotRhizohControlCenterV0,
  subscribeRhizohControlCenterV0
} from "./rhizohControlCenterV0.js";

/** useSyncExternalStore requires referentially stable getSnapshot — avoid #185 infinite loop. */
function useControlCenterSnapshotV0() {
  const [snap, setSnap] = useState(() => snapshotRhizohControlCenterV0());

  useEffect(() => {
    setSnap(snapshotRhizohControlCenterV0());
    return subscribeRhizohControlCenterV0(() => {
      setSnap(snapshotRhizohControlCenterV0());
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setSnap(snapshotRhizohControlCenterV0()), 3000);
    return () => window.clearInterval(id);
  }, []);

  return snap;
}

/**
 * CASTLE_DEBUG_LAYER_V1 — live surface · drawer · binding · monitor (opt-in).
 */
export const RhizohControlCenterPanelV0 = memo(function RhizohControlCenterPanelV0() {
  const [collapsed, setCollapsed] = useState(false);
  const [enabled, setEnabled] = useState(() => isRhizohControlCenterEnabledV0());
  const snap = useControlCenterSnapshotV0();

  if (!enabled) {
    return (
      <button
        type="button"
        className="pointer-events-auto fixed left-2 bottom-[4.5rem] z-[300] rounded-lg border border-amber-400/40 bg-black/80 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-amber-200/90"
        onClick={() => {
          try {
            localStorage.setItem("castle.debug.layer.v1", "1");
          } catch {
            /* noop */
          }
          setEnabled(true);
          window.location.reload();
        }}
      >
        Debug+
      </button>
    );
  }

  if (collapsed) {
    return (
      <button
        type="button"
        className="pointer-events-auto fixed left-2 bottom-[4.5rem] z-[300] rounded-lg border border-amber-400/40 bg-black/85 px-2 py-1 text-[8px] font-bold text-amber-100"
        onClick={() => setCollapsed(false)}
      >
        RCC
      </button>
    );
  }

  return (
    <div
      className="pointer-events-auto fixed left-2 bottom-[4.5rem] z-[300] w-[min(100vw-1rem,22rem)] max-h-[40vh] overflow-hidden rounded-xl border border-amber-400/35 bg-[#050a12]/95 shadow-xl backdrop-blur-md"
      data-rhizoh-control-center="1"
    >
      <div className="flex items-center justify-between border-b border-amber-400/25 px-2 py-1.5">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-200">
          Rhizoh Control Center
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            className="text-[8px] text-white/50 hover:text-white"
            onClick={() => {
              const s = snapshotRhizohControlCenterV0();
              console.log("[CASTLE_DEBUG_LAYER_V1]", s);
            }}
          >
            Log
          </button>
          <button
            type="button"
            className="text-[8px] text-white/50 hover:text-white"
            onClick={() => setCollapsed(true)}
          >
            −
          </button>
          <button
            type="button"
            className="text-[8px] text-white/50 hover:text-rose-300"
            onClick={() => {
              disableRhizohControlCenterV0();
              setEnabled(false);
            }}
          >
            ×
          </button>
        </div>
      </div>
      <div className="max-h-[36vh] overflow-y-auto px-2 py-2 text-[9px] normal-case text-white/80 space-y-2 no-scrollbar">
        <Row label="path" value={snap.pathname} />
        <Row
          label="surfaces"
          value={
            Object.entries(snap.uiChrome.panels || {})
              .filter(([, on]) => on)
              .map(([id]) => id)
              .join(", ") || "—"
          }
        />
        <Row label="drawer" value={snap.uiChrome.openDrawerId || "—"} />
        <Row label="DOM drawer" value={snap.dom.drawer || "—"} />
        <Row label="DOM reality" value={snap.dom.reality || "—"} />
        <Row label="detail panel" value={snap.dom.detailDrawer ? "open" : "closed"} />
        <Row label="binding #" value={String(snap.productBinding.count)} />
        <Row label="rhythm" value={snap.liveMonitor?.rhythmOk == null ? "—" : snap.liveMonitor.rhythmOk ? "ok" : "no"} />
        <Row label="SCR tick" value={String(snap.liveMonitor?.tickSeq ?? "—")} />
        <Row label="WAL" value={String(snap.walCount ?? "—")} />
        <Row label="replay" value={snap.replayMode ? "yes" : "no"} />
        <div>
          <div className="text-[8px] text-amber-200/80 mb-0.5">Binding feed</div>
          <ul className="space-y-0.5 max-h-20 overflow-y-auto">
            {snap.productBinding.tail.length ? (
              snap.productBinding.tail
                .slice()
                .reverse()
                .map((e) => (
                  <li key={`${e.atMs}-${e.action}`} className="text-[8px] text-white/60 truncate">
                    {e.source} · {e.mode} → {e.action}
                  </li>
                ))
            ) : (
              <li className="text-[8px] text-white/40">—</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
});

/** @param {{ label: string, value: string }} props */
function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/45 shrink-0">{label}</span>
      <span className="text-white/90 truncate text-right font-mono">{value}</span>
    </div>
  );
}
