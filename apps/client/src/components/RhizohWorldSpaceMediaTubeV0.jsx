import React, { memo, useCallback, useMemo, useState } from "react";
import { Lock, Radio, Tv, X } from "lucide-react";

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
  const castleBroadcast = useMemo(() => isCastleMediaSourceV0(detail?.source), [detail?.source]);

  const title =
    String(detail?.title || "").trim() ||
    (tr ? activeChannel.titleTr : activeChannel.titleEn);

  const onSelectChannel = useCallback((channel) => {
    setActiveChannel(channel);
  }, []);

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
                onClick={() => onSelectChannel(ch)}
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
