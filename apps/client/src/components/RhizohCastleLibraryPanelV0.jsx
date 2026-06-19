import React, { memo, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CASTLE_ARCHIVE_VAULT_EVENT_V0,
  listCastleArchiveEntitiesV0,
  listCastleArchiveEventsV0,
  openCastleArchiveEntityInMediaV0,
  saveCastleArchiveEntityV0,
  tombstoneCastleArchiveEntityV0
} from "../rhizoh/runtime/castleArchiveVaultV0.js";
import {
  MEDIA_CIVILIZATION_ACTION_V0,
  runMediaCivilizationPipelineV0
} from "../rhizoh/runtime/mediaCivilizationBridgeV0.js";
import { syncCastleCloudVaultV0 } from "../rhizoh/runtime/castleCloudSyncV0.js";
import { readCastleIdentityV0, CASTLE_IDENTITY_EVENT_V0 } from "../rhizoh/runtime/castleIdentityV0.js";
import {
  CASTLE_MEDIA_CONTENT_KIND_V0,
  CASTLE_MEDIA_EVENT_STATE_V0,
  CASTLE_MEDIA_FREQUENCY_BAND_V0,
  labelCastleMediaEventStateV0,
  labelCastleMediaFrequencyBandV0
} from "../rhizoh/runtime/castleArchiveMediaMetaV0.js";
import { RhizohTowerLiveStatusBadgeV0 } from "./RhizohTowerLiveStatusBadgeV0.jsx";

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

function subscribeIdentity(cb) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CASTLE_IDENTITY_EVENT_V0, cb);
  return () => window.removeEventListener(CASTLE_IDENTITY_EVENT_V0, cb);
}

function readIdentitySnapshot() {
  return readCastleIdentityV0()?.updatedAt || "";
}

/**
 * Castle Library + Archive panel — EU AI Act tombstone deletes, immutable events.
 */
export const RhizohCastleLibraryPanelV0 = memo(function RhizohCastleLibraryPanelV0({
  open,
  onClose,
  uiLocale = "en",
  node = null,
  onOpenLivingMemory
}) {
  const tr = uiLocale === "tr";
  const vaultTick = useSyncExternalStore(subscribeVault, readVaultSnapshot, () => 0);
  useSyncExternalStore(subscribeIdentity, readIdentitySnapshot, () => "");
  const identity = readCastleIdentityV0();
  const entities = useMemo(() => listCastleArchiveEntitiesV0(), [vaultTick]);
  const events = useMemo(() => listCastleArchiveEventsV0().slice(-12).reverse(), [vaultTick]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [format, setFormat] = useState("text/plain");
  const [syncStatus, setSyncStatus] = useState("");
  const [annotationStatus, setAnnotationStatus] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [noteText, setNoteText] = useState("");
  const [tagText, setTagText] = useState("");
  const [frequencyBand, setFrequencyBand] = useState(CASTLE_MEDIA_FREQUENCY_BAND_V0.AMBIENT);
  const [eventState, setEventState] = useState(CASTLE_MEDIA_EVENT_STATE_V0.HOLD);
  const [contentKind, setContentKind] = useState(CASTLE_MEDIA_CONTENT_KIND_V0.BROADCAST);
  const [youtubeChannelId, setYoutubeChannelId] = useState("");
  const [communityId, setCommunityId] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(tr ? "Yeni belge" : "New document");
    setContent("");
    setFormat("text/plain");
    setFrequencyBand(CASTLE_MEDIA_FREQUENCY_BAND_V0.AMBIENT);
    setEventState(CASTLE_MEDIA_EVENT_STATE_V0.HOLD);
    setContentKind(CASTLE_MEDIA_CONTENT_KIND_V0.BROADCAST);
    setYoutubeChannelId("");
    setCommunityId("");
  }, [open, tr]);

  const onSave = useCallback(() => {
    const entity = saveCastleArchiveEntityV0({
      title: title.trim() || (tr ? "Belgesiz" : "Untitled"),
      format,
      content,
      source: node?.id ? `map:${node.id}` : "library_panel",
      tags: ["library"],
      frequencyBand,
      eventState,
      contentKind,
      youtubeChannelId: youtubeChannelId.trim() || undefined,
      communityId: communityId.trim() || undefined
    });
    openCastleArchiveEntityInMediaV0(entity.id);
    runMediaCivilizationPipelineV0({
      action: MEDIA_CIVILIZATION_ACTION_V0.INDEX,
      entityId: entity.id,
      locale: uiLocale
    });
  }, [title, format, content, node?.id, tr, uiLocale, frequencyBand, eventState, contentKind, youtubeChannelId, communityId]);

  const onAnnotate = useCallback(
    (action) => {
      if (!selectedEntityId) return;
      const out =
        action === MEDIA_CIVILIZATION_ACTION_V0.NOTE
          ? runMediaCivilizationPipelineV0({
              action,
              entityId: selectedEntityId,
              noteText,
              locale: uiLocale
            })
          : runMediaCivilizationPipelineV0({
              action: MEDIA_CIVILIZATION_ACTION_V0.TAG,
              entityId: selectedEntityId,
              tag: tagText,
              locale: uiLocale
            });
      if (out?.ok === false) {
        setAnnotationStatus(String(out.reason || "failed"));
        return;
      }
      setAnnotationStatus(tr ? "Hafızaya yazıldı." : "Written to memory.");
      if (action === MEDIA_CIVILIZATION_ACTION_V0.NOTE) setNoteText("");
      if (action === MEDIA_CIVILIZATION_ACTION_V0.TAG) setTagText("");
    },
    [noteText, selectedEntityId, tagText, tr, uiLocale]
  );

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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RhizohTowerLiveStatusBadgeV0 towerId="library" uiLocale={uiLocale} compact />
              {identity ? (
                <span className="text-[9px] text-cyan-200/70">
                  {identity.visitors} {tr ? "ziyaretçi" : "visitors"} · {identity.matchesPlayed}{" "}
                  {tr ? "maç" : "matches"}
                </span>
              ) : null}
              {onOpenLivingMemory ? (
                <button
                  type="button"
                  onClick={onOpenLivingMemory}
                  className="rounded border border-cyan-400/35 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-200 hover:bg-cyan-500/10"
                >
                  {tr ? "Hafıza" : "Memory"}
                </button>
              ) : null}
            </div>
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
                    className={`rounded-lg border px-2 py-2 text-[11px] text-white/85 ${
                      selectedEntityId === ent.id ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEntityId(ent.id)}
                        className="min-w-0 text-left"
                      >
                        <p className="truncate font-semibold text-amber-100">{ent.title}</p>
                        <p className="text-[9px] text-white/45">
                          {ent.format} · {(ent.tags || []).slice(0, 3).join(", ") || "—"}
                        </p>
                        {ent.frequencyBand || ent.eventState ? (
                          <p className="text-[9px] text-violet-200/75">
                            {labelCastleMediaFrequencyBandV0(ent.frequencyBand, tr)} ·{" "}
                            {labelCastleMediaEventStateV0(ent.eventState, tr)}
                          </p>
                        ) : null}
                        {(ent.userNotes || []).length ? (
                          <p className="mt-1 text-[9px] italic text-cyan-200/70">
                            {(ent.userNotes[0]?.text || "").slice(0, 80)}
                          </p>
                        ) : null}
                      </button>
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
            {selectedEntityId ? (
              <div className="mt-2 space-y-2 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-2">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-cyan-200/80">
                  {tr ? "Not · Etiket" : "Note · Tag"}
                </p>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  placeholder={tr ? "Kullanıcı notu (LLM yok)" : "User note (no LLM)"}
                  className="w-full resize-none rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white"
                />
                <div className="flex gap-2">
                  <input
                    value={tagText}
                    onChange={(e) => setTagText(e.target.value)}
                    placeholder={tr ? "etiket" : "tag"}
                    className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white"
                  />
                  <button
                    type="button"
                    onClick={() => onAnnotate(MEDIA_CIVILIZATION_ACTION_V0.TAG)}
                    className="rounded border border-amber-400/40 px-2 py-1 text-[9px] text-amber-100"
                  >
                    #
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onAnnotate(MEDIA_CIVILIZATION_ACTION_V0.NOTE)}
                  className="w-full rounded border border-cyan-400/40 px-2 py-1 text-[9px] text-cyan-100"
                >
                  {tr ? "Notu hafızaya yaz" : "Save note to memory"}
                </button>
                {annotationStatus ? <p className="text-[9px] text-white/45">{annotationStatus}</p> : null}
              </div>
            ) : null}
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
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[9px] text-white/55">
                {tr ? "Frekans bandı" : "Frequency band"}
                <select
                  value={frequencyBand}
                  onChange={(e) => setFrequencyBand(e.target.value)}
                  className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
                >
                  {Object.values(CASTLE_MEDIA_FREQUENCY_BAND_V0).map((band) => (
                    <option key={band} value={band}>
                      {labelCastleMediaFrequencyBandV0(band, tr)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[9px] text-white/55">
                {tr ? "Olay durumu" : "Event state"}
                <select
                  value={eventState}
                  onChange={(e) => setEventState(e.target.value)}
                  className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
                >
                  {Object.values(CASTLE_MEDIA_EVENT_STATE_V0).map((state) => (
                    <option key={state} value={state}>
                      {labelCastleMediaEventStateV0(state, tr)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[9px] text-white/55">
                {tr ? "İçerik türü" : "Content kind"}
                <select
                  value={contentKind}
                  onChange={(e) => setContentKind(e.target.value)}
                  className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
                >
                  {Object.values(CASTLE_MEDIA_CONTENT_KIND_V0).map((kind) => (
                    <option key={kind} value={kind}>
                      {kind.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[9px] text-white/55">
                YouTube {tr ? "kanal ID" : "channel ID"}
                <input
                  value={youtubeChannelId}
                  onChange={(e) => setYoutubeChannelId(e.target.value)}
                  placeholder="UC…"
                  className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
                />
              </label>
            </div>
            <input
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              placeholder={tr ? "Topluluk / oylama ID (opsiyonel)" : "Community / vote ID (optional)"}
              className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-0 flex-1 resize-none rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] leading-relaxed text-white"
              placeholder={tr ? "İçerik — kaydedince mediaplayer'a taşınır." : "Content — saved to media player."}
            />
            <button
              type="button"
              onClick={() => {
                void syncCastleCloudVaultV0().then((out) => {
                  setSyncStatus(
                    out.ok
                      ? tr
                        ? "Bulut senkron tamam."
                        : "Cloud sync complete."
                      : String(out.error || "sync_failed")
                  );
                });
              }}
              className="rounded-lg border border-sky-400/45 bg-sky-500/10 px-2 py-1.5 text-[10px] text-sky-100"
            >
              {tr ? "Buluta senkron" : "Sync to cloud"}
            </button>
            {syncStatus ? <p className="text-[9px] text-white/45">{syncStatus}</p> : null}
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
