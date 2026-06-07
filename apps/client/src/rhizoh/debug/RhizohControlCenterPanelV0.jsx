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

const RCC_DRAWER_COLLAPSED_KEY_V0 = "castle.debug.rcc.drawer.collapsed.v0";

/**
 * CASTLE_DEBUG_LAYER_V1 — live surface · drawer · binding · monitor (opt-in).
 * @param {{ variant?: "floating" | "drawer" }} props
 */
export const RhizohControlCenterPanelV0 = memo(function RhizohControlCenterPanelV0({
  variant = "floating"
}) {
  const inDrawer = variant === "drawer";
  const [collapsed, setCollapsed] = useState(() => {
    if (!inDrawer) return false;
    try {
      return localStorage.getItem(RCC_DRAWER_COLLAPSED_KEY_V0) === "1";
    } catch {
      return false;
    }
  });
  const [enabled, setEnabled] = useState(() => isRhizohControlCenterEnabledV0());
  const snap = useControlCenterSnapshotV0();

  const setDrawerCollapsed = (next) => {
    setCollapsed(next);
    if (!inDrawer) return;
    try {
      localStorage.setItem(RCC_DRAWER_COLLAPSED_KEY_V0, next ? "1" : "0");
    } catch {
      /* noop */
    }
  };

  if (!enabled && !inDrawer) {
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

  if (!enabled && inDrawer) {
    return (
      <div className="mb-2 flex items-center gap-2" data-rhizoh-control-center="drawer-off">
        <button
          type="button"
          className="rounded-lg border border-amber-400/35 bg-black/50 px-2 py-1 text-[8px] font-bold uppercase text-amber-200/90"
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
          RCC aç
        </button>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div
        className={inDrawer ? "mb-2 flex items-start" : ""}
        data-rhizoh-control-center={inDrawer ? "drawer-collapsed" : "collapsed"}
      >
        <button
          type="button"
          className={
            inDrawer
              ? "rounded-lg border border-amber-400/40 bg-black/70 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-amber-100"
              : "pointer-events-auto fixed left-2 bottom-[4.5rem] z-[300] rounded-lg border border-amber-400/40 bg-black/85 px-2 py-1 text-[8px] font-bold text-amber-100"
          }
          onClick={() => setDrawerCollapsed(false)}
          aria-expanded={false}
        >
          RCC
        </button>
      </div>
    );
  }

  const shellClass = inDrawer
    ? "w-full max-w-[14rem] max-h-[28vh] overflow-hidden rounded-xl border border-amber-400/35 bg-[#050a12]/95 shadow-lg"
    : "pointer-events-auto fixed left-2 bottom-[4.5rem] z-[300] w-[min(100vw-1rem,22rem)] max-h-[40vh] overflow-hidden rounded-xl border border-amber-400/35 bg-[#050a12]/95 shadow-xl backdrop-blur-md";

  return (
    <div className={inDrawer ? "mb-3" : ""} data-rhizoh-control-center-slot={inDrawer ? "hall-drawer" : "floating"}>
      {inDrawer ? (
        <div className="mb-1 flex items-center justify-start">
          <button
            type="button"
            className="rounded-md border border-amber-400/30 bg-black/60 px-2 py-0.5 text-[8px] font-bold uppercase text-amber-100/90"
            onClick={() => setDrawerCollapsed(true)}
            aria-expanded
            title="Control Center gizle"
          >
            RCC −
          </button>
        </div>
      ) : null}
      <div className={shellClass} data-rhizoh-control-center="1">
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
          {!inDrawer ? (
            <button
              type="button"
              className="text-[8px] text-white/50 hover:text-white"
              onClick={() => setDrawerCollapsed(true)}
            >
              −
            </button>
          ) : null}
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
        <Row label="world feed" value={snap.worldData?.feed || "—"} />
        <Row label="represent" value={snap.worldData?.representation || "—"} />
        <Row label="POI / bld" value={`${snap.worldData?.poiCount ?? "—"} / ${snap.worldData?.buildingCount ?? "—"}`} />
        <Row
          label="data err"
          value={snap.worldData?.lastError ? snap.worldData.lastError.slice(0, 32) : "—"}
        />
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
