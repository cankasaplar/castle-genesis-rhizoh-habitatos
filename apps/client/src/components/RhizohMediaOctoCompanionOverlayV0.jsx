import React, { memo, useEffect, useRef } from "react";
import { mountOctoMediaCompanionV0 } from "../rhizoh/runtime/octoMediaCompanionServiceV0.js";
import { isMedusaCompanionStreamActiveV0 } from "../rhizoh/runtime/medusaCompanionStreamGateV0.js";

const OCTO_GLASS_STYLE_V0 = {
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.025) 0%, rgba(0,229,255,0.02) 45%, rgba(255,255,255,0.012) 100%)",
  backdropFilter: "blur(2px) saturate(1.04)",
  WebkitBackdropFilter: "blur(2px) saturate(1.04)",
  boxShadow: "inset 0 0 0 1px rgba(0,229,255,0.08)"
};

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
 * Gerçek Octo GLB + tül + harmony — cam arkasında, kontroller serbest.
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
      serviceRef.current?.dispose?.();
      serviceRef.current = null;
      return undefined;
    }

    const service = mountOctoMediaCompanionV0(hostRef.current, { mediaStream });
    serviceRef.current = service;
    return () => {
      service.dispose();
      if (serviceRef.current === service) serviceRef.current = null;
      hostRef.current?.replaceChildren?.();
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
      data-rhizoh-octo-renderer="glb+tulle"
      data-rhizoh-octo-audio-live={streamLive ? "1" : "0"}
      aria-hidden
    >
      <div ref={hostRef} className="pointer-events-none absolute inset-0" data-rhizoh-octo-glb-host="1" />
      <div className="pointer-events-none absolute inset-0 z-[2]" style={OCTO_GLASS_STYLE_V0} />
    </div>
  );
});
