import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, Lock, Mic, Radio, Square, Tv, Video, X } from "lucide-react";
import {
  createWorldSpaceMediaCaptureV0,
  listMediaArchiveEntriesV0,
  stopCaptureAndArchiveV0,
  WORLD_SPACE_MEDIA_ARCHIVE_EVENT_V0
} from "../rhizoh/runtime/worldSpaceMediaEngineV0.js";

const DEFAULT_CHANNELS_V0 = Object.freeze([
  Object.freeze({
    id: "lofi",
    titleTr: "Global Kuantum Akışı (Lofi Radio)",
    titleEn: "Global Quantum Stream (Lofi Radio)",
    type: "youtube",
    url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&controls=0"
  }),
  Object.freeze({
    id: "nasa",
    titleTr: "NASA Canlı Dünya Yayını",
    titleEn: "NASA ISS Live",
    type: "youtube",
    url: "https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&mute=1&controls=0"
  }),
  Object.freeze({
    id: "local",
    titleTr: "Yerel Kamera / Mikrofon",
    titleEn: "Local Camera / Microphone",
    type: "local"
  })
]);

function isCastleMediaSourceV0(source) {
  return String(source || "").startsWith("castle_init");
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
  const [activeChannel, setActiveChannel] = useState(() => DEFAULT_CHANNELS_V0[0]);
  const [archiveRows, setArchiveRows] = useState(() => listMediaArchiveEntriesV0());
  const [passphrase, setPassphrase] = useState("");
  const [recording, setRecording] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [archiveStatus, setArchiveStatus] = useState("");
  const captureRef = useRef(null);
  const previewRef = useRef(null);
  const castleBroadcast = useMemo(() => isCastleMediaSourceV0(detail?.source), [detail?.source]);

  const title =
    String(detail?.title || "").trim() ||
    (tr ? activeChannel.titleTr : activeChannel.titleEn);

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
    setActiveChannel(channel);
    if (channel.type !== "local") return;
    try {
      const cap = await createWorldSpaceMediaCaptureV0({ audio: true, video: true });
      captureRef.current = cap;
      if (previewRef.current) {
        previewRef.current.srcObject = cap.stream;
      }
    } catch (e) {
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
      if (out.ok) {
        setArchiveStatus(tr ? "Arşive eklendi (AES-GCM)." : "Added to archive (AES-GCM).");
        setArchiveRows(listMediaArchiveEntriesV0());
        const cap = await createWorldSpaceMediaCaptureV0({ audio: true, video: true });
        captureRef.current = cap;
        if (previewRef.current) cap.stream && (previewRef.current.srcObject = cap.stream);
      } else {
        setArchiveStatus(tr ? "Boş kayıt." : "Empty recording.");
      }
    } catch (e) {
      setArchiveStatus(String(e?.message || e || "archive_failed"));
    }
  }, [recording, passphrase, tr, detail?.source]);

  if (!detail) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[315] flex flex-col bg-[#050505]/96 p-4 backdrop-blur-3xl sm:p-6"
      data-rhizoh-world-space-media-tube="1"
      data-media-source={detail.source || "unknown"}
    >
      <div className="mb-4 flex items-center justify-between border-b border-purple-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-purple-500/50 bg-purple-500/20 p-2">
            <Tv size={22} className="animate-pulse text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-widest text-white">{title}</h1>
            <p className="text-[9px] font-bold uppercase text-purple-400">Symbio Media Engine V4</p>
            {castleBroadcast ? (
              <p className="mt-1 text-[9px] font-semibold normal-case text-cyan-300/80">
                {tr
                  ? "Castle kurulumu tamam — bu yüzey kale yayın merkezin."
                  : "Castle setup complete — this is your castle broadcast hub."}
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
        <div className="flex w-full flex-col rounded-2xl border border-white/10 bg-white/5 p-3 sm:w-56">
          <p className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/45">
            <Radio size={12} /> {tr ? "Kanallar" : "Channels"}
          </p>
          <div className="space-y-2 overflow-y-auto">
            {DEFAULT_CHANNELS_V0.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => void onSelectChannel(ch)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-[10px] font-bold transition-all ${
                  activeChannel.id === ch.id
                    ? "border-purple-500/50 bg-purple-500/20 text-purple-300"
                    : "border-white/10 bg-black/40 text-white/55 hover:text-white"
                }`}
              >
                {tr ? ch.titleTr : ch.titleEn}
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
                <ul className="max-h-24 space-y-1 overflow-y-auto text-[9px] text-white/45">
                  {archiveRows.slice(0, 5).map((row) => (
                    <li key={row.id} className="truncate">
                      {row.title} · {(row.byteLength / 1024).toFixed(1)} KB
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[9px] text-white/30">{tr ? "Henüz kayıt yok" : "No recordings yet"}</p>
              )}
            </div>
            <div className="pt-3">
              <p className="mb-2 text-[8px] font-black uppercase tracking-[0.24em] text-white/30">
                {tr ? "Gerçek dünya verisi" : "Real-world feed"}
              </p>
              <div
                className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left text-[10px] text-white/35"
                title={
                  tr
                    ? "Spor / haber API entegrasyonu sonraki sprint — burada görünecek."
                    : "Sports / news API integration is a later sprint — will appear here."
                }
              >
                <span className="flex items-center gap-2 font-bold">
                  <Lock size={11} />
                  {tr ? "Spor · Haber · Canlı veri" : "Sports · News · Live data"}
                </span>
                <span className="mt-1 block text-[9px] font-normal normal-case opacity-80">
                  {tr ? "API bağlantısı henüz yok" : "No API wired yet"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
          {activeChannel.type === "youtube" ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={activeChannel.url}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : activeChannel.type === "local" ? (
            <div className="flex h-full flex-col">
              <video
                ref={previewRef}
                autoPlay
                muted
                playsInline
                className="min-h-0 flex-1 bg-black object-cover"
              />
              <div className="flex items-center gap-2 border-t border-white/10 bg-black/80 p-3">
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
  );
});
