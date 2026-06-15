import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, ExternalLink, Mic, Radio, Square, Tv, Video, Volume2, X } from "lucide-react";
import {
  createWorldSpaceMediaCaptureV0,
  listMediaArchiveEntriesV0,
  stopCaptureAndArchiveV0,
  WORLD_SPACE_MEDIA_ARCHIVE_EVENT_V0
} from "../rhizoh/runtime/worldSpaceMediaEngineV0.js";
import {
  MEDIA_CIVILIZATION_ACTION_V0,
  runMediaCivilizationPipelineV0
} from "../rhizoh/runtime/mediaCivilizationBridgeV0.js";
import {
  listWorldSpaceMediaChannelsV0,
  resolveInitialWorldSpaceMediaChannelIdV0,
  resolveWorldSpaceMediaChannelForMapNodeV0,
  resolveWorldSpaceMediaChannelV0
} from "../rhizoh/runtime/worldSpaceMediaChannelsV0.js";
import { WorldSpaceMediaDataTickerV0 } from "./WorldSpaceMediaDataTickerV0.jsx";
import { RhizohMediaStageWithOctoV0 } from "./RhizohMediaOctoCompanionOverlayV0.jsx";

function isCastleMediaSourceV0(source) {
  return String(source || "").startsWith("castle_init");
}

function channelLabelV0(channel, tr) {
  return tr ? channel.titleTr : channel.titleEn;
}

function channelBadgeV0(channel, tr) {
  return tr ? channel.badgeTr : channel.badgeEn;
}

/**
 * Archive EVENT_TUBE — Symbio media shell for broadcast / event / post-castle-init.
 */
export const RhizohWorldSpaceMediaTubeV0 = memo(function RhizohWorldSpaceMediaTubeV0({
  detail,
  onClose,
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  const channels = useMemo(() => listWorldSpaceMediaChannelsV0(), []);
  const initialChannelId = useMemo(
    () =>
      detail?.initialChannelId ||
      resolveWorldSpaceMediaChannelForMapNodeV0(detail?.node) ||
      resolveInitialWorldSpaceMediaChannelIdV0(detail?.source),
    [detail?.initialChannelId, detail?.node, detail?.source]
  );
  const [activeChannel, setActiveChannel] = useState(() =>
    resolveWorldSpaceMediaChannelV0(initialChannelId)
  );
  const [youtubeMuted, setYoutubeMuted] = useState(true);
  const [nasaFallback, setNasaFallback] = useState(false);
  const [archiveRows, setArchiveRows] = useState(() => listMediaArchiveEntriesV0());
  const [passphrase, setPassphrase] = useState("");
  const [recording, setRecording] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [archiveStatus, setArchiveStatus] = useState("");
  const [mediaNote, setMediaNote] = useState("");
  const [mediaTag, setMediaTag] = useState("");
  const [bookmarkLabel, setBookmarkLabel] = useState("");
  const [bookmarkSec, setBookmarkSec] = useState("");
  const [civilizationStatus, setCivilizationStatus] = useState("");
  const [localPreviewStream, setLocalPreviewStream] = useState(null);
  const captureRef = useRef(null);
  const previewRef = useRef(null);
  const castleBroadcast = useMemo(() => isCastleMediaSourceV0(detail?.source), [detail?.source]);
  const isQuantumRadioEntry = useMemo(() => {
    const nid = String(detail?.node?.id || "").trim().toLowerCase();
    const src = String(detail?.source || "").trim().toLowerCase();
    return nid === "radio" || src.includes("radio") || src.includes("map:node:radio");
  }, [detail?.node?.id, detail?.source]);

  const title =
    String(detail?.title || "").trim() || channelLabelV0(activeChannel, tr);

  const youtubeSrc = useMemo(() => {
    if (activeChannel.type !== "youtube") return "";
    if (activeChannel.id === "nasa" && nasaFallback && activeChannel.fallbackUrl) {
      return activeChannel.fallbackUrl;
    }
    const base = String(activeChannel.url || "");
    if (!base) return "";
    if (!youtubeMuted) return base.replace("mute=1", "mute=0");
    return base;
  }, [activeChannel, nasaFallback, youtubeMuted]);

  useEffect(() => {
    setActiveChannel(resolveWorldSpaceMediaChannelV0(initialChannelId));
    setNasaFallback(false);
    setYoutubeMuted(true);
  }, [initialChannelId]);

  useEffect(() => {
    const refresh = () => setArchiveRows(listMediaArchiveEntriesV0());
    window.addEventListener(WORLD_SPACE_MEDIA_ARCHIVE_EVENT_V0, refresh);
    return () => window.removeEventListener(WORLD_SPACE_MEDIA_ARCHIVE_EVENT_V0, refresh);
  }, []);

  useEffect(() => {
    return () => {
      try {
        captureRef.current?.abort?.();
      } catch {
        /* noop */
      }
      captureRef.current = null;
    };
  }, []);

  const onSelectChannel = useCallback(async (channel) => {
    if (captureRef.current) {
      try {
        captureRef.current.abort();
      } catch {
        /* noop */
      }
      captureRef.current = null;
    }
    setCaptureError("");
    setNasaFallback(false);
    setYoutubeMuted(true);
    setActiveChannel(channel);
    if (channel.type !== "local") {
      setLocalPreviewStream(null);
      return;
    }
    try {
      const cap = await createWorldSpaceMediaCaptureV0({ audio: true, video: true });
      captureRef.current = cap;
      setLocalPreviewStream(cap.stream || null);
      if (previewRef.current) {
        previewRef.current.srcObject = cap.stream;
      }
    } catch (e) {
      setLocalPreviewStream(null);
      setCaptureError(String(e?.message || e || "capture_failed"));
    }
  }, []);

  const onToggleRecord = useCallback(async () => {
    if (!captureRef.current) return;
    if (!recording) {
      captureRef.current.start();
      setRecording(true);
      setArchiveStatus(tr ? "Kayıt başladı…" : "Recording…");
      return;
    }
    if (!passphrase.trim()) {
      setArchiveStatus(tr ? "Arşiv için parola gir." : "Enter passphrase for archive.");
      return;
    }
    setRecording(false);
    setArchiveStatus(tr ? "Şifreleniyor…" : "Encrypting…");
    try {
      const out = await stopCaptureAndArchiveV0(captureRef.current, {
        passphrase: passphrase.trim(),
        title: tr ? "World Space Kaydı" : "World Space Recording",
        source: detail?.source || "world_space_media_tube"
      });
      captureRef.current = null;
      setLocalPreviewStream(null);
      if (out.ok) {
        setArchiveStatus(tr ? "Arşive eklendi (AES-GCM)." : "Added to archive (AES-GCM).");
        setArchiveRows(listMediaArchiveEntriesV0());
        const cap = await createWorldSpaceMediaCaptureV0({ audio: true, video: true });
        captureRef.current = cap;
        setLocalPreviewStream(cap.stream || null);
        if (previewRef.current && cap.stream) previewRef.current.srcObject = cap.stream;
      } else {
        setArchiveStatus(tr ? "Boş kayıt." : "Empty recording.");
      }
    } catch (e) {
      setArchiveStatus(String(e?.message || e || "archive_failed"));
    }
  }, [recording, passphrase, tr, detail?.source]);

  const archiveEntity = detail?.archiveEntity || null;
  const archiveDocumentMode = Boolean(archiveEntity);

  if (!detail) return null;

  if (archiveDocumentMode) {
    const ent = archiveEntity;
    const isMarkdown = String(ent.format || "").includes("markdown");
    const isHtml = String(ent.format || "").includes("html");
    const onMediaAnnotate = (action) => {
      const out =
        action === MEDIA_CIVILIZATION_ACTION_V0.NOTE
          ? runMediaCivilizationPipelineV0({
              action,
              entityId: ent.id,
              noteText: mediaNote,
              locale: uiLocale
            })
          : action === MEDIA_CIVILIZATION_ACTION_V0.TAG
            ? runMediaCivilizationPipelineV0({
                action,
                entityId: ent.id,
                tag: mediaTag,
                locale: uiLocale
              })
            : runMediaCivilizationPipelineV0({
                action: MEDIA_CIVILIZATION_ACTION_V0.BOOKMARK,
                entityId: ent.id,
                bookmark: {
                  label: bookmarkLabel || (tr ? "Yer imi" : "Bookmark"),
                  positionSec: bookmarkSec ? Number(bookmarkSec) : null
                },
                locale: uiLocale
              });
      if (out?.ok === false) {
        setCivilizationStatus(String(out.reason || "failed"));
        return;
      }
      setCivilizationStatus(tr ? "Arşiv → Hafıza → Bilgi → Kronik" : "Archive → Memory → Knowledge → Chronicle");
      if (action === MEDIA_CIVILIZATION_ACTION_V0.NOTE) setMediaNote("");
      if (action === MEDIA_CIVILIZATION_ACTION_V0.TAG) setMediaTag("");
    };
    return (
      <div
        className="pointer-events-auto fixed inset-0 z-[315] flex flex-col bg-[#050505]/96 backdrop-blur-3xl"
        data-rhizoh-world-space-media-tube="1"
        data-media-source={detail.source || "archive"}
      >
        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-amber-500/30 pb-4">
            <div>
              <h1 className="text-lg font-black uppercase tracking-widest text-amber-100">{ent.title}</h1>
              <p className="text-[9px] font-bold uppercase text-amber-400/80">{ent.format}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 px-3 py-2 text-[10px] text-white/70 hover:text-white"
            >
              <X size={14} className="inline" /> {tr ? "Kapat" : "Close"}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:p-6">
          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/60 p-4">
            {ent.mediaUrl ? (
              <iframe title={ent.title} src={ent.mediaUrl} className="h-full min-h-[320px] w-full rounded-lg" />
            ) : isHtml ? (
              <div
                className="prose prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: String(ent.content || "") }}
              />
            ) : (
              <pre
                className={`whitespace-pre-wrap text-sm leading-relaxed text-white/85 ${isMarkdown ? "font-sans" : "font-mono"}`}
              >
                {String(ent.content || "")}
              </pre>
            )}
          </div>
          <aside className="flex w-full shrink-0 flex-col gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3 sm:w-56">
            <p className="text-[9px] font-black uppercase tracking-wider text-cyan-200/80">
              {tr ? "Medya Medeniyeti" : "Media Civilization"}
            </p>
            <p className="text-[9px] text-white/45">
              {tr ? "Not · Etiket · Yer imi — LLM özeti yok." : "Notes · Tags · Bookmarks — no auto-summary."}
            </p>
            {(ent.tags || []).length ? (
              <p className="text-[9px] text-amber-200/80">#{(ent.tags || []).join(" #")}</p>
            ) : null}
            <textarea
              value={mediaNote}
              onChange={(e) => setMediaNote(e.target.value)}
              rows={3}
              placeholder={tr ? "Kullanıcı notu" : "User note"}
              className="resize-none rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white"
            />
            <button
              type="button"
              onClick={() => onMediaAnnotate(MEDIA_CIVILIZATION_ACTION_V0.NOTE)}
              className="rounded border border-cyan-400/40 px-2 py-1 text-[9px] text-cyan-100"
            >
              {tr ? "Notu kaydet" : "Save note"}
            </button>
            <div className="flex gap-2">
              <input
                value={mediaTag}
                onChange={(e) => setMediaTag(e.target.value)}
                placeholder={tr ? "etiket" : "tag"}
                className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white"
              />
              <button
                type="button"
                onClick={() => onMediaAnnotate(MEDIA_CIVILIZATION_ACTION_V0.TAG)}
                className="rounded border border-amber-400/40 px-2 py-1 text-[9px] text-amber-100"
              >
                #
              </button>
            </div>
            <input
              value={bookmarkLabel}
              onChange={(e) => setBookmarkLabel(e.target.value)}
              placeholder={tr ? "Yer imi etiketi" : "Bookmark label"}
              className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white"
            />
            <input
              value={bookmarkSec}
              onChange={(e) => setBookmarkSec(e.target.value)}
              placeholder={tr ? "Saniye (opsiyonel)" : "Seconds (optional)"}
              className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white"
            />
            <button
              type="button"
              onClick={() => onMediaAnnotate(MEDIA_CIVILIZATION_ACTION_V0.BOOKMARK)}
              className="rounded border border-emerald-400/40 px-2 py-1 text-[9px] text-emerald-100"
            >
              {tr ? "Yer imi" : "Bookmark"}
            </button>
            {(ent.bookmarks || []).slice(0, 3).map((bm) => (
              <p key={bm.id} className="text-[9px] text-white/50">
                {bm.label}
                {bm.positionSec != null ? ` · ${bm.positionSec}s` : ""}
              </p>
            ))}
            {civilizationStatus ? <p className="text-[9px] text-emerald-300/85">{civilizationStatus}</p> : null}
          </aside>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[315] flex flex-col bg-[#050505]/96 backdrop-blur-3xl"
      data-rhizoh-world-space-media-tube="1"
      data-media-source={detail.source || "unknown"}
      data-active-channel={activeChannel.id}
    >
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-purple-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-purple-500/50 bg-purple-500/20 p-2">
              <Tv size={22} className="animate-pulse text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-widest text-white">{title}</h1>
              <p className="text-[9px] font-bold uppercase text-purple-400">
                Symbio Media Engine V4 · {channelLabelV0(activeChannel, tr)}
              </p>
              {castleBroadcast ? (
                <p className="mt-1 text-[9px] font-semibold normal-case text-cyan-300/80">
                  {tr
                    ? "Castle kurulumu tamam — Castle Genesis kanalı varsayılan."
                    : "Castle setup complete — Castle Genesis channel is default."}
                </p>
              ) : null}
              {isQuantumRadioEntry ? (
                <p className="mt-1 max-w-md text-[10px] font-normal normal-case leading-relaxed text-violet-200/85">
                  {tr
                    ? "Kuantum Radyo — dünya akışı + ambient frekans penceresi. Haritadan açıldığında varsayılan Global Kuantum Akışı (Lofi) çalar; sol menüden NASA TV, Castle Genesis veya yerel kamera/mikrofon kanallarına geçebilirsin."
                    : "Quantum Radio — world stream + ambient frequency window. Opens on Global Quantum Stream (Lofi) from the map; switch channels for NASA TV, Castle Genesis, or local camera/mic."}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-3 py-2 text-[10px] text-white/70 hover:text-white"
          >
            <X size={14} className="inline" /> {tr ? "Kapat" : "Close"}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden sm:flex-row">
          <div className="flex w-full flex-col rounded-2xl border border-white/10 bg-white/5 p-3 sm:w-60">
            <p className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/45">
              <Radio size={12} /> {tr ? "Kanallar" : "Channels"}
            </p>
            <div className="space-y-2 overflow-y-auto">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => void onSelectChannel(ch)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                    activeChannel.id === ch.id
                      ? "border-purple-500/50 bg-purple-500/20 text-purple-200"
                      : "border-white/10 bg-black/40 text-white/55 hover:text-white"
                  }`}
                >
                  <span className="block text-[10px] font-bold">{channelLabelV0(ch, tr)}</span>
                  {ch.badgeTr ? (
                    <span className="mt-0.5 block text-[8px] font-normal uppercase tracking-wider text-white/35">
                      {channelBadgeV0(ch, tr)}
                    </span>
                  ) : null}
                </button>
              ))}

              <div className="pt-3">
                <p className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.24em] text-white/30">
                  <Archive size={11} /> {tr ? "Şifreli arşiv" : "Encrypted archive"}
                </p>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(ev) => setPassphrase(ev.target.value)}
                  placeholder={tr ? "Arşiv parolası" : "Archive passphrase"}
                  className="mb-2 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] text-white/80"
                />
                {archiveRows.length ? (
                  <ul className="max-h-20 space-y-1 overflow-y-auto text-[9px] text-white/45">
                    {archiveRows.slice(0, 5).map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-1 truncate">
                        <span className="truncate">
                          {row.title} · {(row.byteLength / 1024).toFixed(1)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const out = runMediaCivilizationPipelineV0({
                              action: MEDIA_CIVILIZATION_ACTION_V0.PROMOTE_RECORDING,
                              mediaArchiveId: row.id,
                              title: row.title,
                              channelId: activeChannel.id,
                              source: "media_tube",
                              locale: uiLocale
                            });
                            setCivilizationStatus(
                              out?.ok === false
                                ? String(out.reason || "promote_failed")
                                : tr
                                  ? "Kale arşivine taşındı"
                                  : "Promoted to castle archive"
                            );
                          }}
                          className="shrink-0 rounded border border-amber-400/35 px-1 text-[8px] text-amber-100"
                        >
                          {tr ? "Arşiv" : "Vault"}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[9px] text-white/30">{tr ? "Henüz kayıt yok" : "No recordings yet"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="relative flex min-h-[240px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            {activeChannel.type === "youtube" ? (
              <>
                <RhizohMediaStageWithOctoV0
                  className="flex min-h-0 flex-1 flex-col"
                  mediaStream={activeChannel.type === "local" ? localPreviewStream : null}
                >
                  <iframe
                    key={`${activeChannel.id}-${nasaFallback ? "fb" : "main"}-${youtubeMuted ? "m" : "u"}`}
                    className="min-h-0 h-full w-full flex-1"
                    src={youtubeSrc}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </RhizohMediaStageWithOctoV0>
                <div className="relative z-20 flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/85 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setYoutubeMuted(false)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2 py-1 text-[9px] text-white/70 hover:text-white"
                  >
                    <Volume2 size={12} /> {tr ? "Sesi aç" : "Unmute"}
                  </button>
                  {activeChannel.id === "nasa" && activeChannel.fallbackUrl ? (
                    <button
                      type="button"
                      onClick={() => setNasaFallback((v) => !v)}
                      className="rounded-lg border border-cyan-500/30 px-2 py-1 text-[9px] text-cyan-200/85"
                    >
                      {nasaFallback
                        ? tr
                          ? "NASA TV ana akış"
                          : "NASA TV main feed"
                        : tr
                          ? "ISS Dünya kamerası"
                          : "ISS Earth camera"}
                    </button>
                  ) : null}
                </div>
              </>
            ) : activeChannel.type === "castle_genesis_live" ? (
              <RhizohMediaStageWithOctoV0 className="flex min-h-0 flex-1 flex-col">
                <div className="relative flex min-h-0 flex-1 flex-col">
                  <img
                    src={activeChannel.holdingSlide}
                    alt="Castle Genesis"
                    className="min-h-0 h-full w-full flex-1 object-cover opacity-90"
                  />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 p-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-300">
                      Castle Genesis
                    </p>
                    <p className="max-w-md text-[10px] leading-relaxed text-white/75 normal-case">
                      {tr
                        ? "Canlı yayın embed için kanal ID gerekir (VITE_CASTLE_GENESIS_YOUTUBE_CHANNEL_ID). Şimdilik YouTube'da aç veya Studio/OBS ile yayınla."
                        : "Live embed needs channel ID (VITE_CASTLE_GENESIS_YOUTUBE_CHANNEL_ID). Open on YouTube or stream via Studio/OBS."}
                    </p>
                  </div>
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-4 pt-28">
                    <a
                      href={activeChannel.livePageUrl || activeChannel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2 text-[10px] font-bold uppercase text-red-100 hover:bg-red-500/25"
                    >
                      <ExternalLink size={14} />
                      {tr ? "YouTube'da izle" : "Watch on YouTube"}
                    </a>
                  </div>
                </div>
              </RhizohMediaStageWithOctoV0>
            ) : activeChannel.type === "local" ? (
              <div className="relative flex min-h-0 flex-1 flex-col">
                <RhizohMediaStageWithOctoV0 className="flex min-h-0 flex-1 flex-col" mediaStream={localPreviewStream}>
                  <video
                    ref={previewRef}
                    autoPlay
                    muted
                    playsInline
                    className="min-h-0 h-full w-full flex-1 bg-black object-cover"
                  />
                </RhizohMediaStageWithOctoV0>
                <div className="relative z-20 flex items-center gap-2 border-t border-white/10 bg-black/80 p-3">
                  <button
                    type="button"
                    onClick={() => void onToggleRecord()}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase ${
                      recording
                        ? "border-red-500/50 bg-red-500/20 text-red-200"
                        : "border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
                    }`}
                  >
                    {recording ? <Square size={12} /> : <Mic size={12} />}
                    {recording ? (tr ? "Durdur & arşivle" : "Stop & archive") : tr ? "Kayda al" : "Record"}
                  </button>
                  <Video size={14} className="text-white/35" />
                  {captureError ? (
                    <span className="text-[9px] text-amber-300/85 normal-case">{captureError}</span>
                  ) : archiveStatus ? (
                    <span className="text-[9px] text-emerald-300/85 normal-case">{archiveStatus}</span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-white/35">
                <Tv size={48} />
                <p className="mt-3 text-[10px] uppercase tracking-[0.35em]">{tr ? "Sinyal yok" : "No signal"}</p>
              </div>
            )}
          </div>
        </div>

        {detail.node?.description ? (
          <p className="mt-3 text-center text-[10px] text-white/45">{detail.node.description}</p>
        ) : null}
      </div>

      <WorldSpaceMediaDataTickerV0 active uiLocale={uiLocale} />
    </div>
  );
});
