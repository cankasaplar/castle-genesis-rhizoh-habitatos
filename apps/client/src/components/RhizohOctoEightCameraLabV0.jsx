import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, ChevronDown, ChevronUp, Eye, Users, Video } from "lucide-react";
import {
  OCTO_CAMERA_FACING_V1,
  OCTO_YUVA_EIGHT_CAMERA_LENSES_V1,
  dismissOctoLabToWorldMapV1
} from "../rhizoh/runtime/octoYuvaMediaLabBridgeV1.js";
import { resolveWorldSpaceMediaChannelV0 } from "../rhizoh/runtime/worldSpaceMediaChannelsV0.js";
import { createWorldSpaceMediaCaptureV0 } from "../rhizoh/runtime/worldSpaceMediaEngineV0.js";
import { RhizohMediaStageWithOctoV0 } from "./RhizohMediaOctoCompanionOverlayV0.jsx";
import { ActorGlbNestPreviewV0 } from "./ActorGlbNestPreviewV0.jsx";

const PRIMARY_LENS_IDS_V0 = Object.freeze([
  "lens_castle_genesis",
  "lens_cesium_ion",
  "lens_leaflet_satellite",
  "lens_octo_fox_nest"
]);

function lensShortLabelV0(lens) {
  const raw = String(lens?.label || "");
  return raw.split("·")[0].trim();
}

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

  const [showAllLenses, setShowAllLenses] = useState(false);

  const visibleLenses = useMemo(() => {
    if (showAllLenses) return lenses;
    const primary = lenses.filter((l) => PRIMARY_LENS_IDS_V0.includes(l.id));
    if (primary.length >= 3) return primary;
    return lenses.slice(0, 4);
  }, [lenses, showAllLenses]);

  const onBackToMap = useCallback(() => {
    dismissOctoLabToWorldMapV1({ source: "octo_lab_ui_back" });
  }, []);

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        onBackToMap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBackToMap]);

  if (!activeLens) return null;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2.5"
      data-rhizoh-octo-eight-camera-lab="1"
      data-rhizoh-octo-lens={activeLens.id}
      data-rhizoh-octo-facing={facing}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onBackToMap}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/20"
        >
          <ArrowLeft size={12} />
          {tr ? "Haritaya dön" : "Back to map"}
        </button>
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
          {lensShortLabelV0(activeLens)}
        </p>
        <div className="ml-auto flex flex-wrap gap-1">
          {FACING_OPTIONS_V1.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFacing(opt)}
              className={`rounded-md border px-2 py-0.5 text-[7px] font-semibold uppercase tracking-wide ${
                facing === opt
                  ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                  : "border-white/8 bg-black/30 text-white/45 hover:text-white/80"
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

      <div className="flex flex-wrap items-center gap-1.5">
        {visibleLenses.map((lens, idx) => (
          <button
            key={lens.id}
            type="button"
            onClick={() => setActiveLensId(lens.id)}
            style={{ animationDelay: `${idx * 45}ms` }}
            className={`rounded-full border px-2.5 py-1 text-[8px] font-medium transition-all duration-300 ${
              activeLens.id === lens.id
                ? "border-purple-400/45 bg-purple-500/20 text-purple-100"
                : "border-white/10 bg-black/35 text-white/50 hover:border-white/20 hover:text-white/80"
            }`}
          >
            {lensShortLabelV0(lens)}
          </button>
        ))}
        {lenses.length > visibleLenses.length || showAllLenses ? (
          <button
            type="button"
            onClick={() => setShowAllLenses((v) => !v)}
            className="flex items-center gap-0.5 rounded-full border border-white/10 px-2 py-1 text-[7px] uppercase text-white/40 hover:text-white/70"
          >
            {showAllLenses ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {showAllLenses
              ? tr
                ? "Daha az"
                : "Less"
              : tr
                ? `+${lenses.length - visibleLenses.length}`
                : `+${lenses.length - visibleLenses.length}`}
          </button>
        ) : null}
      </div>

      <div className="relative flex min-h-[10rem] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-xl sm:min-h-[14rem]">
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
