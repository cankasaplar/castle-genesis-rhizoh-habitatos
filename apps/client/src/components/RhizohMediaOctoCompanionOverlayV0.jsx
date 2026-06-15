import React, { memo, useEffect, useRef } from "react";
import { mountOctoMediaCompanionV0 } from "../rhizoh/runtime/octoMediaCompanionServiceV0.js";
import { isMedusaCompanionStreamActiveV0 } from "../rhizoh/runtime/medusaCompanionStreamGateV0.js";

const OCTO_GLASS_STYLE_V0 = {
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(0,229,255,0.03) 42%, rgba(255,255,255,0.02) 100%)",
  backdropFilter: "blur(3px) saturate(1.08)",
  WebkitBackdropFilter: "blur(3px) saturate(1.08)",
  boxShadow: "inset 0 0 0 1px rgba(0,229,255,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
};

/**
 * Media viewport shell — video/iframe altında, Octo + cam üstünde, kontroller dışarıda.
 */
export const RhizohMediaStageWithOctoV0 = memo(function RhizohMediaStageWithOctoV0({
  children,
  mediaStream = null,
  active = true,
  className = ""
}) {
  return (
    <div className={`relative min-h-0 ${className}`}>
      <div className="relative z-0 h-full min-h-0 w-full">{children}</div>
      <RhizohMediaOctoCompanionOverlayV0 active={active} mediaStream={mediaStream} />
    </div>
  );
});

/**
 * Octo cam arkasında — düşük opaklık; pointer-events tamamen kapalı.
 */
export const RhizohMediaOctoCompanionOverlayV0 = memo(function RhizohMediaOctoCompanionOverlayV0({
  active = true,
  mediaStream = null,
  className = ""
}) {
  const hostRef = useRef(null);
  const serviceRef = useRef(null);
  const streamLive = active && isMedusaCompanionStreamActiveV0(mediaStream);

  useEffect(() => {
    if (!active || !hostRef.current) {
      if (serviceRef.current) {
        serviceRef.current.dispose();
        serviceRef.current = null;
      }
      return undefined;
    }

    const host = hostRef.current;
    const service = mountOctoMediaCompanionV0(host, { mediaStream });
    serviceRef.current = service;

    return () => {
      service.dispose();
      if (serviceRef.current === service) serviceRef.current = null;
      host.replaceChildren();
    };
  }, [active]);

  useEffect(() => {
    if (!active || !serviceRef.current || serviceRef.current.isDisposed()) return;
    serviceRef.current.setMotionStream(mediaStream);
  }, [active, mediaStream, streamLive]);

  if (!active) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[6] overflow-hidden ${className}`}
      data-rhizoh-octo-media-companion="1"
      data-rhizoh-octo-audio-live={streamLive ? "1" : "0"}
      aria-hidden
    >
      <div
        ref={hostRef}
        className="pointer-events-none absolute inset-0 opacity-[0.48]"
        style={{ mixBlendMode: "plus-lighter" }}
      />
      <div className="pointer-events-none absolute inset-0 z-[2]" style={OCTO_GLASS_STYLE_V0} />
    </div>
  );
});
