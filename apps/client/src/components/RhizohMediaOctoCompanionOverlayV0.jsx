import React, { memo, useEffect, useRef } from "react";
import { mountOctoMediaCompanionV0 } from "../rhizoh/runtime/octoMediaCompanionServiceV0.js";
import { isMedusaCompanionStreamActiveV0 } from "../rhizoh/runtime/medusaCompanionStreamGateV0.js";

/**
 * Full-viewport Octo — neon glass backdrop, serbest hareket, ses-duyarlı (karşı kamera).
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
      className={`pointer-events-none absolute inset-0 z-[18] overflow-hidden ${className}`}
      data-rhizoh-octo-media-companion="1"
      data-rhizoh-octo-audio-live={streamLive ? "1" : "0"}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(10,10,30,0.12) 45%, rgba(0,180,255,0.04) 100%)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxShadow: "inset 0 0 80px rgba(0,229,255,0.08), inset 0 0 2px rgba(0,229,255,0.25)"
        }}
      />
      <div ref={hostRef} className="absolute inset-0" />
    </div>
  );
});
