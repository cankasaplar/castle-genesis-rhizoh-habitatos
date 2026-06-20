import React, { memo, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Inbox, X } from "lucide-react";
import {
  getShadowCastleInboxSnapshotV0,
  ignoreAllShadowCastleInboxItemsV0,
  ignoreShadowCastleInboxItemV0,
  markShadowCastleInboxReadV0,
  subscribeShadowCastleInboxV0
} from "../rhizoh/runtime/shadowCastleInboxV0.js";
import {
  resolveShadowInboxItemActionV0,
  runShadowInboxItemActionV0,
  SHADOW_INBOX_ACTION_V0
} from "../rhizoh/runtime/shadowCastleInboxActionsV0.js";

/**
 * Castle shadow inbox — C2C meaning-transfer feed (not chat / not WAL).
 */
export const RhizohCastleShadowInboxV0 = memo(function RhizohCastleShadowInboxV0({
  uiLocale = "en",
  compact = false,
  panelPlacement = "dropdown",
  anchor = "inline",
  onItemAction,
  onCloseMediaTube,
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
  const usePortal = panelPlacement === "portal" || anchor === "top-right";

  const onSelectItem = (item) => {
    runShadowInboxItemActionV0(item, {
      uiLocale,
      closeMediaTube: onCloseMediaTube
    });
    onItemAction?.(item);
    setOpen(false);
  };

  const panel = open ? (
    <InboxPanelV0
      tr={tr}
      items={snap.items}
      onClose={() => setOpen(false)}
      onSelectItem={onSelectItem}
      onIgnoreItem={(id) => ignoreShadowCastleInboxItemV0(id)}
      onIgnoreAll={() => ignoreAllShadowCastleInboxItemsV0()}
      placement={usePortal ? "portal" : panelPlacement}
      anchor={anchor}
    />
  ) : null;

  const inboxButton = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className={
        anchor === "top-right"
          ? "pointer-events-auto relative inline-flex min-h-[2.75rem] touch-manipulation items-center gap-2 rounded-xl border border-sky-400/45 bg-black/88 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-sky-50 shadow-lg backdrop-blur-md hover:bg-sky-950/50"
          : "pointer-events-auto relative inline-flex min-h-[2rem] min-w-[2rem] touch-manipulation items-center gap-1.5 rounded-lg border border-sky-400/35 bg-black/75 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sky-100 backdrop-blur-md hover:bg-sky-950/60"
      }
      aria-label={tr ? "Kale gelen kutusu" : "Castle inbox"}
      aria-expanded={open}
    >
      <Inbox size={anchor === "top-right" ? 18 : 14} />
      <span>{tr ? "Inbox" : "Inbox"}</span>
      {unread > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-black text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </button>
  );

  if (compact && anchor === "top-right") {
    return (
      <div className={`pointer-events-none fixed right-4 top-16 z-[32] sm:right-5 sm:top-[4.25rem] ${className}`}>
        {inboxButton}
        {usePortal && typeof document !== "undefined" ? createPortal(panel, document.body) : panel}
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`relative shrink-0 ${className}`}>
        {inboxButton}
        {usePortal && typeof document !== "undefined" ? createPortal(panel, document.body) : panel}
      </div>
    );
  }

  return (
    <div className={`pointer-events-none fixed bottom-28 left-4 z-[30] ${className}`}>
      {inboxButton}
      {panel}
    </div>
  );
});

function InboxPanelV0({ tr, items, onClose, onSelectItem, onIgnoreItem, onIgnoreAll, placement = "dropdown", anchor = "inline" }) {
  const panelClass =
    placement === "portal" && anchor === "top-right"
      ? "pointer-events-auto fixed right-4 top-[7.25rem] z-[420] w-[min(100vw-2rem,22rem)] rounded-2xl border border-sky-400/35 bg-black/95 p-3 shadow-2xl backdrop-blur-md sm:right-5 sm:top-[7.5rem]"
      : placement === "portal"
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
        <div className="flex items-center gap-1">
          {items?.length ? (
            <button
              type="button"
              onClick={onIgnoreAll}
              className="touch-manipulation rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/40 hover:text-amber-200"
            >
              {tr ? "Tümünü yoksay" : "Ignore all"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation rounded p-1 text-white/50 hover:text-white"
            aria-label={tr ? "Kapat" : "Close"}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto overscroll-contain">
        {!items?.length ? (
          <p className="text-[11px] text-white/45">
            {tr
              ? "Henüz sinyal yok. Peer pin tıkla veya satranç hamlesi yap."
              : "No signals yet. Click a peer pin or play a chess move."}
          </p>
        ) : (
          items.map((item) => {
            const isChess = resolveShadowInboxItemActionV0(item) === SHADOW_INBOX_ACTION_V0.OPEN_CHESS_ARENA;
            const isTower = String(item.nodeType || "").includes("tower") || String(item.pinId || "").includes("_tower");
            return (
              <div
                key={item.id}
                className="flex items-stretch gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
              >
                <button
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className="pointer-events-auto min-w-0 flex-1 touch-manipulation px-2.5 py-2 text-left"
                >
                  <p className="text-[10px] font-bold text-white/90">{tr ? item.titleTr : item.titleEn}</p>
                  <p className="text-[10px] text-white/60">{tr ? item.bodyTr : item.bodyEn}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {isChess ? (
                      <p className="text-[8px] font-semibold uppercase tracking-wider text-cyan-300/90">
                        {tr ? "Arena'da oyna →" : "Play in arena →"}
                      </p>
                    ) : isTower ? (
                      <p className="text-[8px] font-semibold uppercase tracking-wider text-violet-300/90">
                        {tr ? "Kule pin → uç" : "Tower pin → fly"}
                      </p>
                    ) : (
                      <p className="text-[8px] font-semibold uppercase tracking-wider text-sky-300/80">
                        {tr ? "Pin'e uç →" : "Fly to pin →"}
                      </p>
                    )}
                    {item.isRealPeer ? (
                      <p className="text-[8px] uppercase tracking-wider text-emerald-400/80">
                        {tr ? "Gerçek peer" : "Real peer"}
                      </p>
                    ) : (
                      <p className="text-[8px] uppercase tracking-wider text-amber-400/70">
                        {tr ? "Sim hedef" : "Sim target"}
                      </p>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onIgnoreItem(item.id);
                  }}
                  className="pointer-events-auto shrink-0 touch-manipulation border-l border-white/10 px-2 text-[8px] font-semibold uppercase tracking-wider text-white/35 hover:bg-white/10 hover:text-amber-200"
                  aria-label={tr ? "Yoksay" : "Ignore"}
                >
                  {tr ? "Yoksay" : "Ignore"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
