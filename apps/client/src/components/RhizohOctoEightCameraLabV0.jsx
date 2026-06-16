import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Eye, Users, Video } from "lucide-react";
import {
  OCTO_CAMERA_FACING_V1,
  OCTO_YUVA_EIGHT_CAMERA_LENSES_V1
} from "../rhizoh/runtime/octoYuvaMediaLabBridgeV1.js";
import { resolveWorldSpaceMediaChannelV0 } from "../rhizoh/runtime/worldSpaceMediaChannelsV0.js";
import { createWorldSpaceMediaCaptureV0 } from "../rhizoh/runtime/worldSpaceMediaEngineV0.js";
import { RhizohMediaStageWithOctoV0 } from "./RhizohMediaOctoCompanionOverlayV0.jsx";
import { ActorGlbNestPreviewV0 } from "./ActorGlbNestPreviewV0.jsx";

const FACING_OPTIONS_V1 = Object.freeze([
  OCTO_CAMERA_FACING_V1.OTHER,
  OCTO_CAMERA_FACING_V1.SELF,
  OCTO_CAMERA_FACING_V1.BOTH
]);

function lensChannelV0(lens) {
  if (lens.kind === "youtube_lab") {
    return resolveWorldSpaceMediaChannelV0(String(lens.channelId || "lofi"));
  }
  if (lens.kind === "local_capture") {
    return resolveWorldSpaceMediaChannelV0("local");
  }
  return null;
}

function ActorNestPlaceholderV0({ actor, facing, tr, compact = false }) {
  return (
    <ActorGlbNestPreviewV0 actor={actor} facing={facing} tr={tr} compact={compact} />
  );
}

function LensPreviewPaneV0({
  lens,
  facing,
  localStream,
  previewRef,
  tr,
  youtubeSrc,
  youtubeTitle
}) {
  const showSelf = facing === OCTO_CAMERA_FACING_V1.SELF || facing === OCTO_CAMERA_FACING_V1.BOTH;
  const showOther = facing === OCTO_CAMERA_FACING_V1.OTHER || facing === OCTO_CAMERA_FACING_V1.BOTH;
  const actors = lens.actors || [lens.actor || "octo"];
  const primaryActor = actors[0] || "octo";
  const secondaryActor = actors[1] || "fox";

  if (lens.kind === "youtube_lab" && youtubeSrc) {
    const companionActor = primaryActor === "fox" ? "fox" : "octo";
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        {companionActor === "octo" ? (
          <RhizohMediaStageWithOctoV0 className="flex min-h-0 flex-1 flex-col" mediaStream={localStream}>
            <iframe
              className="min-h-0 h-full w-full flex-1"
              src={youtubeSrc}
              title={youtubeTitle || lens.label}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </RhizohMediaStageWithOctoV0>
        ) : (
          <>
            <iframe
              className="min-h-0 h-full w-full flex-1"
              src={youtubeSrc}
              title={youtubeTitle || lens.label}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <div className="pointer-events-none absolute bottom-3 right-3 z-10 w-36 opacity-95">
              <ActorGlbNestPreviewV0 actor="fox" tr={tr} compact facing={facing} />
            </div>
          </>
        )}
      </div>
    );
  }

  if (lens.kind === "local_capture") {
    return (
      <div
        className={`grid min-h-0 flex-1 gap-2 ${
          facing === OCTO_CAMERA_FACING_V1.BOTH ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {showSelf ? (
          <div className="relative min-h-[8rem] overflow-hidden rounded-xl border border-white/10 bg-black">
            <RhizohMediaStageWithOctoV0 className="h-full" mediaStream={localStream}>
              <video
                ref={previewRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            </RhizohMediaStageWithOctoV0>
            <p className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[8px] uppercase text-white/70">
              {tr ? "Kendi" : "Self"}
            </p>
          </div>
        ) : null}
        {showOther ? (
          <div className="relative min-h-[8rem]">
            <ActorNestPlaceholderV0 actor={primaryActor} facing={facing} tr={tr} />
            <p className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[8px] uppercase text-white/70">
              {tr ? "Karşı" : "Other"}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  if (lens.kind === "octo_fox_dual") {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        {showOther ? (
          <ActorNestPlaceholderV0 actor={primaryActor} facing={facing} tr={tr} compact={facing === OCTO_CAMERA_FACING_V1.BOTH} />
        ) : null}
        {showSelf ? (
          <div className="relative min-h-[8rem] overflow-hidden rounded-xl border border-white/10 bg-black">
            {localStream ? (
              <RhizohMediaStageWithOctoV0 className="h-full" mediaStream={localStream}>
                <video autoPlay muted playsInline className="h-full w-full object-cover" srcObject={localStream} />
              </RhizohMediaStageWithOctoV0>
            ) : (
              <ActorNestPlaceholderV0 actor={secondaryActor} facing={facing} tr={tr} compact />
            )}
            <p className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[8px] uppercase text-white/70">
              {tr ? "Kendi yuva" : "Self nest"}
            </p>
          </div>
        ) : null}
        {showOther && facing !== OCTO_CAMERA_FACING_V1.SELF ? (
          <ActorNestPlaceholderV0 actor={secondaryActor} facing={facing} tr={tr} compact={facing === OCTO_CAMERA_FACING_V1.BOTH} />
        ) : null}
      </div>
    );
  }

  const dimensionCopy = {
    terrain_3d: tr ? "Cesium Ion 3D boyut" : "Cesium Ion 3D dimension",
    map_satellite_2d: tr ? "Leaflet uydu boyutu" : "Leaflet satellite dimension",
    studio_stage: tr ? "Stüdyo sahne boyutu" : "Studio stage dimension"
  };

  return (
    <div className="flex min-h-[10rem] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/50 p-4 text-center">
      <Camera size={28} className="text-cyan-300/70" />
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">{lens.label}</p>
      <p className="text-[10px] text-white/50">
        {dimensionCopy[lens.dimension] || lens.dimension}
      </p>
      <p className="text-[9px] text-white/35">
        {tr ? "Harita katmanı eşzamanlı — media tube önizleme" : "Map layer synced — media tube preview"}
      </p>
      {showOther ? (
        <ActorNestPlaceholderV0 actor={primaryActor} facing={facing} tr={tr} compact />
      ) : null}
    </div>
  );
}

/**
 * Eight-lens Octo/Fox lab — per-dimension cameras, self/other/both facing (default: other).
 */
export const RhizohOctoEightCameraLabV0 = memo(function RhizohOctoEightCameraLabV0({
  lenses = OCTO_YUVA_EIGHT_CAMERA_LENSES_V1,
  uiLocale = "en",
  initialLensId = null
}) {
  const tr = uiLocale === "tr";
  const [activeLensId, setActiveLensId] = useState(
    () => initialLensId || lenses[0]?.id || "lens_castle_genesis"
  );
  const [facing, setFacing] = useState(OCTO_CAMERA_FACING_V1.OTHER);
  const [localStream, setLocalStream] = useState(null);
  const [captureError, setCaptureError] = useState("");
  const previewRef = useRef(null);
  const captureRef = useRef(null);

  const activeLens = useMemo(
    () => lenses.find((l) => l.id === activeLensId) || lenses[0],
    [activeLensId, lenses]
  );

  const channel = useMemo(() => (activeLens ? lensChannelV0(activeLens) : null), [activeLens]);

  const youtubeSrc = useMemo(() => {
    if (!channel || channel.type !== "youtube") return "";
    return String(channel.url || "");
  }, [channel]);

  const armLocalCapture = useCallback(async () => {
    if (!activeLens) return;
    const needsLocal =
      activeLens.kind === "local_capture" ||
      activeLens.kind === "octo_fox_dual" ||
      facing === OCTO_CAMERA_FACING_V1.SELF ||
      facing === OCTO_CAMERA_FACING_V1.BOTH;
    if (!needsLocal) {
      setLocalStream(null);
      return;
    }
    try {
      if (captureRef.current) {
        captureRef.current.abort?.();
        captureRef.current = null;
      }
      const cap = await createWorldSpaceMediaCaptureV0({ audio: false, video: true });
      captureRef.current = cap;
      setLocalStream(cap.stream || null);
      if (previewRef.current && cap.stream) {
        previewRef.current.srcObject = cap.stream;
      }
      setCaptureError("");
    } catch (e) {
      setLocalStream(null);
      setCaptureError(String(e?.message || e || "capture_failed"));
    }
  }, [activeLens, facing]);

  useEffect(() => {
    void armLocalCapture();
    return () => {
      try {
        captureRef.current?.abort?.();
      } catch {
        /* noop */
      }
      captureRef.current = null;
    };
  }, [armLocalCapture]);

  if (!activeLens) return null;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-3"
      data-rhizoh-octo-eight-camera-lab="1"
      data-rhizoh-octo-lens={activeLens.id}
      data-rhizoh-octo-facing={facing}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/80">
          <Video size={12} />
          {tr ? "8 kamera · boyutlar" : "8 cameras · dimensions"}
        </p>
        <div className="ml-auto flex flex-wrap gap-1">
          {FACING_OPTIONS_V1.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFacing(opt)}
              className={`rounded-lg border px-2 py-1 text-[8px] font-semibold uppercase tracking-wide ${
                facing === opt
                  ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
                  : "border-white/10 bg-black/40 text-white/50 hover:text-white"
              }`}
            >
              {opt === OCTO_CAMERA_FACING_V1.OTHER
                ? tr
                  ? "Karşı"
                  : "Other"
                : opt === OCTO_CAMERA_FACING_V1.SELF
                  ? tr
                    ? "Kendi"
                    : "Self"
                  : tr
                    ? "İkisi"
                    : "Both"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {lenses.map((lens) => (
          <button
            key={lens.id}
            type="button"
            onClick={() => setActiveLensId(lens.id)}
            className={`shrink-0 rounded-xl border px-2.5 py-2 text-left transition-all ${
              activeLens.id === lens.id
                ? "border-purple-500/50 bg-purple-500/20 text-purple-100"
                : "border-white/10 bg-black/40 text-white/55 hover:text-white"
            }`}
          >
            <span className="block text-[9px] font-bold">{lens.label}</span>
            <span className="mt-0.5 block text-[7px] uppercase tracking-wider text-white/35">
              {lens.dimension}
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[7px] text-white/40">
              <Users size={9} />
              {(lens.actors || [lens.actor]).join(" · ")}
            </span>
          </button>
        ))}
      </div>

      <div className="relative flex min-h-[12rem] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl sm:min-h-[16rem]">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-black/70 px-2 py-1">
          <Eye size={11} className="text-cyan-300/80" />
          <span className="text-[8px] font-semibold uppercase tracking-wider text-white/70">
            {activeLens.dimension}
          </span>
        </div>
        <LensPreviewPaneV0
          lens={activeLens}
          facing={facing}
          localStream={localStream}
          previewRef={previewRef}
          tr={tr}
          youtubeSrc={youtubeSrc}
          youtubeTitle={channel ? (tr ? channel.titleTr : channel.titleEn) : activeLens.label}
        />
        {captureError ? (
          <p className="border-t border-amber-500/30 bg-amber-950/30 px-3 py-2 text-[9px] text-amber-200/90">
            {captureError}
          </p>
        ) : null}
      </div>
    </div>
  );
});
