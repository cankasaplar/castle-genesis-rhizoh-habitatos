import React, { memo, useEffect, useState, useSyncExternalStore } from "react";
import { Inbox, X } from "lucide-react";
import {
  getShadowCastleInboxSnapshotV0,
  markShadowCastleInboxReadV0,
  subscribeShadowCastleInboxV0
} from "../rhizoh/runtime/shadowCastleInboxV0.js";
import { flyToShadowReactionTargetV0 } from "../rhizoh/runtime/shadowDataPlaneLoopV0.js";

/**
 * Castle shadow inbox — C2C meaning-transfer feed (not chat / not WAL).
 */
export const RhizohCastleShadowInboxV0 = memo(function RhizohCastleShadowInboxV0({
  uiLocale = "en",
  compact = false,
  panelPlacement = "fixed",
  className = ""
}) {
  const tr = uiLocale === "tr";
  const [open, setOpen] = useState(false);
  const snap = useSyncExternalStore(
    subscribeShadowCastleInboxV0,
    getShadowCastleInboxSnapshotV0,
    () => getShadowCastleInboxSnapshotV0()
  );

  useEffect(() => {
    if (open) markShadowCastleInboxReadV0();
  }, [open]);

  const unread = snap.unreadCount || 0;

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pointer-events-auto relative inline-flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-black/75 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sky-100 backdrop-blur-md hover:bg-sky-950/60"
          aria-label={tr ? "Kale gelen kutusu" : "Castle inbox"}
        >
          <Inbox size={14} />
          {tr ? "Inbox" : "Inbox"}
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-black text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
        {open ? (
          <InboxPanelV0
            tr={tr}
            items={snap.items}
            onClose={() => setOpen(false)}
            placement={panelPlacement}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={`pointer-events-none fixed bottom-28 left-4 z-[27] ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto relative flex items-center gap-2 rounded-xl border border-sky-400/40 bg-black/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sky-100 shadow-lg backdrop-blur-md"
      >
        <Inbox size={16} />
        {tr ? "Kale Inbox" : "Castle Inbox"}
        {unread > 0 ? (
          <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? <InboxPanelV0 tr={tr} items={snap.items} onClose={() => setOpen(false)} /> : null}
    </div>
  );
});

function InboxPanelV0({ tr, items, onClose, placement = "fixed" }) {
  const panelClass =
    placement === "dropdown"
      ? "pointer-events-auto absolute right-0 top-full z-[50] mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-sky-400/30 bg-black/92 p-3 shadow-2xl backdrop-blur-md"
      : "pointer-events-auto fixed bottom-40 left-4 z-[28] w-[min(100vw-2rem,20rem)] rounded-2xl border border-sky-400/30 bg-black/92 p-3 shadow-2xl backdrop-blur-md";
  return (
    <div className={panelClass}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-300/80">
          {tr ? "Kale · anlam aktarımı" : "Castle · meaning transfer"}
        </p>
        <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto">
        {!items?.length ? (
          <p className="text-[11px] text-white/45">
            {tr
              ? "Henüz sinyal yok. Peer pin tıkla veya satranç hamlesi yap."
              : "No signals yet. Click a peer pin or play a chess move."}
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => flyToShadowReactionTargetV0(13)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-left hover:bg-white/10"
            >
              <p className="text-[10px] font-bold text-white/90">{tr ? item.titleTr : item.titleEn}</p>
              <p className="text-[10px] text-white/60">{tr ? item.bodyTr : item.bodyEn}</p>
              {item.isRealPeer ? (
                <p className="mt-1 text-[8px] uppercase tracking-wider text-emerald-400/80">
                  {tr ? "Gerçek peer" : "Real peer"}
                </p>
              ) : (
                <p className="mt-1 text-[8px] uppercase tracking-wider text-amber-400/70">
                  {tr ? "Sim hedef" : "Sim target"}
                </p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
