import React, { memo, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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
  panelPlacement = "dropdown",
  onItemAction,
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

  const onSelectItem = (item) => {
    flyToShadowReactionTargetV0(13, { pinId: item?.pinId || null });
    onItemAction?.(item);
    setOpen(false);
  };

  const panel = open ? (
    <InboxPanelV0
      tr={tr}
      items={snap.items}
      onClose={() => setOpen(false)}
      onSelectItem={onSelectItem}
      placement={panelPlacement}
    />
  ) : null;

  if (compact) {
    return (
      <div className={`relative shrink-0 ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pointer-events-auto relative inline-flex min-h-[2rem] min-w-[2rem] touch-manipulation items-center gap-1.5 rounded-lg border border-sky-400/35 bg-black/75 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sky-100 backdrop-blur-md hover:bg-sky-950/60"
          aria-label={tr ? "Kale gelen kutusu" : "Castle inbox"}
          aria-expanded={open}
        >
          <Inbox size={14} />
          <span className="hidden sm:inline">{tr ? "Inbox" : "Inbox"}</span>
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-black text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
        {panelPlacement === "portal" && typeof document !== "undefined"
          ? createPortal(panel, document.body)
          : panel}
      </div>
    );
  }

  return (
    <div className={`pointer-events-none fixed bottom-28 left-4 z-[30] ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto relative flex min-h-[2.5rem] touch-manipulation items-center gap-2 rounded-xl border border-sky-400/40 bg-black/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-sky-100 shadow-lg backdrop-blur-md"
        aria-expanded={open}
      >
        <Inbox size={16} />
        {tr ? "Kale Inbox" : "Castle Inbox"}
        {unread > 0 ? (
          <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {panel}
    </div>
  );
});

function InboxPanelV0({ tr, items, onClose, onSelectItem, placement = "dropdown" }) {
  const panelClass =
    placement === "portal"
      ? "pointer-events-auto fixed right-4 top-20 z-[420] w-[min(100vw-2rem,20rem)] rounded-2xl border border-sky-400/30 bg-black/95 p-3 shadow-2xl backdrop-blur-md"
      : placement === "dropdown"
        ? "pointer-events-auto absolute right-0 top-full z-[420] mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-sky-400/30 bg-black/95 p-3 shadow-2xl backdrop-blur-md"
        : "pointer-events-auto fixed bottom-40 left-4 z-[420] w-[min(100vw-2rem,20rem)] rounded-2xl border border-sky-400/30 bg-black/95 p-3 shadow-2xl backdrop-blur-md";

  return (
    <div className={panelClass} role="dialog" aria-label={tr ? "Kale gelen kutusu" : "Castle inbox"}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-300/80">
          {tr ? "Kale · anlam aktarımı" : "Castle · meaning transfer"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="touch-manipulation rounded p-1 text-white/50 hover:text-white"
          aria-label={tr ? "Kapat" : "Close"}
        >
          <X size={14} />
        </button>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto overscroll-contain">
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
              onClick={() => onSelectItem(item)}
              className="pointer-events-auto w-full touch-manipulation rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-left hover:bg-white/10 active:bg-white/15"
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
