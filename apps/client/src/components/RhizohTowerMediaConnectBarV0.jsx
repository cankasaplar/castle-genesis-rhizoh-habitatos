import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  captureTowerVideoFrameV0,
  openTowerMediaStreamV0,
  stopTowerMediaStreamV0
} from "../rhizoh/runtime/rhizohTowerMediaCaptureV0.js";
import { MedusaCompanionOverlayV0 } from "./MedusaCompanionOverlayV0.jsx";

/**
 * Camera + mic connect strip for tower workspaces (vision + voice).
 */
export const RhizohTowerMediaConnectBarV0 = memo(function RhizohTowerMediaConnectBarV0({
  uiLocale = "en",
  onFrameCapture,
  onStreamChange,
  showVisionCapture = true,
  previewSize = "compact",
  showMedusa = true
}) {
  const tr = uiLocale === "tr";
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mediaStream, setMediaStream] = useState(null);

  const stopStream = useCallback(() => {
    stopTowerMediaStreamV0(streamRef.current);
    streamRef.current = null;
    setMediaStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    onStreamChange?.(null);
  }, [onStreamChange]);

  useEffect(() => () => stopStream(), [stopStream]);

  const onConnect = useCallback(async () => {
    if (active) {
      stopStream();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const stream = await openTowerMediaStreamV0({ audio: true, video: true });
      streamRef.current = stream;
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play?.().catch(() => {});
      }
      setActive(true);
      onStreamChange?.(stream);
    } catch {
      setError(tr ? "Kamera veya mikrofon izni gerekli." : "Camera or microphone permission required.");
      stopStream();
    } finally {
      setBusy(false);
    }
  }, [active, onStreamChange, stopStream, tr]);

  const onCapture = useCallback(() => {
    const frame = captureTowerVideoFrameV0(videoRef.current);
    if (!frame) {
      setError(tr ? "Önce kamerayı aç." : "Open the camera first.");
      return;
    }
    setError("");
    onFrameCapture?.(frame);
  }, [onFrameCapture, tr]);

  const previewClass =
    previewSize === "square"
      ? "mt-2 aspect-square h-28 w-28 rounded-xl border border-white/15 bg-black object-cover"
      : previewSize === "large"
        ? "mt-2 aspect-video max-h-[min(38vh,340px)] w-full rounded-xl border border-white/15 bg-black object-cover"
        : "mt-2 aspect-square h-24 w-24 rounded-lg border border-white/10 bg-black object-cover";

  const previewWrapClass =
    previewSize === "square" ? "relative mt-2 inline-block" : "relative mt-2 w-full";

  return (
    <div className="rounded-xl border border-cyan-400/25 bg-cyan-950/20 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onConnect()}
          className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
            active
              ? "border border-emerald-400/45 bg-emerald-500/20 text-emerald-100"
              : "border border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
          }`}
        >
          {busy
            ? tr
              ? "Bağlanıyor…"
              : "Connecting…"
            : active
              ? tr
                ? "Bağlı · Kes"
                : "Connected · Disconnect"
              : tr
                ? "Kamera + ses bağla"
                : "Connect camera + voice"}
        </button>
        {showVisionCapture ? (
          <button
            type="button"
            disabled={!active}
            onClick={onCapture}
            className="rounded-lg border border-fuchsia-400/35 bg-fuchsia-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-100 disabled:opacity-40"
          >
            {tr ? "Kare yakala" : "Capture frame"}
          </button>
        ) : null}
        <span className="text-[9px] text-white/45">
          {active
            ? tr
              ? "Vision ve ses için hazır"
              : "Ready for vision + voice"
            : tr
              ? "Gemini Vision için kamera gerekir"
              : "Camera needed for Gemini Vision"}
        </span>
      </div>
      {error ? <p className="mt-1 text-[9px] text-amber-200/90">{error}</p> : null}
      <div className={previewWrapClass}>
        <video
          ref={videoRef}
          className={`${previewClass} ${active ? "block" : "hidden"}`}
          playsInline
          muted
          aria-hidden={!active}
        />
        {showMedusa && active ? (
          <MedusaCompanionOverlayV0
            active
            mediaStream={mediaStream}
            overlayNode="media"
            className="!bottom-1 !right-1"
          />
        ) : null}
      </div>
    </div>
  );
});
