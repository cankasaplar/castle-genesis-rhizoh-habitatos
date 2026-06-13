import React, { memo, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CASTLE_ARCHIVE_VAULT_EVENT_V0,
  importCastleArchiveDocumentV0,
  listCastleArchiveEntitiesV0,
  listCastleArchiveEventsV0,
  openCastleArchiveEntityInMediaV0,
  tombstoneCastleArchiveEntityV0
} from "../rhizoh/runtime/castleArchiveVaultV0.js";

const PIECE_UNICODE_V0 = Object.freeze({
  wK: "♔",
  wQ: "♕",
  wR: "♖",
  wB: "♗",
  wN: "♘",
  wP: "♙",
  bK: "♚",
  bQ: "♛",
  bR: "♜",
  bB: "♝",
  bN: "♞",
  bP: "♟"
});

function subscribeVault(cb) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CASTLE_ARCHIVE_VAULT_EVENT_V0, cb);
  return () => window.removeEventListener(CASTLE_ARCHIVE_VAULT_EVENT_V0, cb);
}

function readVaultSnapshot() {
  return listCastleArchiveEntitiesV0().length;
}

/**
 * Castle Library + Archive panel — EU AI Act tombstone deletes, immutable events.
 */
export const RhizohCastleLibraryPanelV0 = memo(function RhizohCastleLibraryPanelV0({
  open,
  onClose,
  uiLocale = "en",
  node = null
}) {
  const tr = uiLocale === "tr";
  const vaultTick = useSyncExternalStore(subscribeVault, readVaultSnapshot, () => 0);
  const entities = useMemo(() => listCastleArchiveEntitiesV0(), [vaultTick]);
  const events = useMemo(() => listCastleArchiveEventsV0().slice(-12).reverse(), [vaultTick]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [format, setFormat] = useState("text/plain");

  useEffect(() => {
    if (!open) return;
    setTitle(tr ? "Yeni belge" : "New document");
    setContent("");
    setFormat("text/plain");
  }, [open, tr]);

  const onSave = useCallback(() => {
    importCastleArchiveDocumentV0({
      title: title.trim() || (tr ? "Belgesiz" : "Untitled"),
      format,
      content,
      source: node?.id ? `map:${node.id}` : "library_panel",
      openInMedia: true
    });
  }, [title, format, content, node?.id, tr]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[330] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
      <div className="flex h-[min(92vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-amber-400/35 bg-[#0a0a0f] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-300/70">
              {tr ? "Kale Kütüphanesi · Arşiv" : "Castle Library · Archive"}
            </p>
            <h2 className="mt-1 text-sm font-black text-amber-100">
              {node?.label || (tr ? "Codex Vault" : "Codex Vault")}
            </h2>
            <p className="mt-1 text-[10px] text-white/50">
              {tr
                ? "EU AI Act: kayıtlar silinebilir; olay günlüğü korunur."
                : "EU AI Act: records deletable; event log preserved."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/60 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 md:grid-cols-2">
          <section className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              {tr ? "Belgeler" : "Documents"} ({entities.length})
            </p>
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {entities.length === 0 ? (
                <li className="text-[11px] text-white/45">{tr ? "Henüz belge yok." : "No documents yet."}</li>
              ) : (
                entities.map((ent) => (
                  <li
                    key={ent.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-white/85"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-amber-100">{ent.title}</p>
                        <p className="text-[9px] text-white/45">
                          {ent.format} · {ent.id.slice(0, 18)}…
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openCastleArchiveEntityInMediaV0(ent.id)}
                          className="rounded border border-cyan-400/40 px-1.5 py-0.5 text-[9px] text-cyan-200"
                        >
                          {tr ? "Oynat" : "Play"}
                        </button>
                        <button
                          type="button"
                          onClick={() => tombstoneCastleArchiveEntityV0(ent.id)}
                          className="rounded border border-rose-400/40 px-1.5 py-0.5 text-[9px] text-rose-200"
                        >
                          {tr ? "Sil" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              {tr ? "Yeni belge / mediaplayer'a gönder" : "New document / send to media player"}
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
              placeholder={tr ? "Başlık" : "Title"}
            />
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
            >
              <option value="text/plain">text/plain</option>
              <option value="text/markdown">text/markdown</option>
              <option value="application/json">application/json</option>
              <option value="text/html">text/html</option>
            </select>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-0 flex-1 resize-none rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] leading-relaxed text-white"
              placeholder={tr ? "İçerik — kaydedince mediaplayer'a taşınır." : "Content — saved to media player."}
            />
            <button
              type="button"
              onClick={onSave}
              className="rounded-lg border border-amber-400/50 bg-amber-500/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-amber-100"
            >
              {tr ? "Kaydet ve oynat" : "Save & play"}
            </button>
            <div className="mt-1 min-h-0 overflow-y-auto rounded-lg border border-white/5 bg-black/30 p-2">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
                {tr ? "Olay günlüğü (silinmez)" : "Event log (immutable)"}
              </p>
              <ul className="mt-1 space-y-1">
                {events.map((ev) => (
                  <li key={ev.id} className="text-[9px] text-white/45">
                    {ev.ts.slice(11, 19)} · {ev.type}
                    {ev.entityId ? ` · ${ev.entityId.slice(0, 12)}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});

export { PIECE_UNICODE_V0 };
