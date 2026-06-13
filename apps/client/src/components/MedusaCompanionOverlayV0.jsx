import React, { memo, useEffect, useRef } from "react";
import { mountMedusaCompanionV0 } from "../rhizoh/runtime/medusaCompanionServiceV0.js";
import { MEDUSA_COMPANION_DEFAULT_SIZE_V0 } from "../rhizoh/runtime/medusaCompanionSceneV0.js";

/**
 * Bottom-left Medusa companion — thin React host over medusaCompanionServiceV0.
 */
export const MedusaCompanionOverlayV0 = memo(function MedusaCompanionOverlayV0({
  active = false,
  mediaStream = null,
  className = ""
}) {
  const hostRef = useRef(null);
  const serviceRef = useRef(null);

  useEffect(() => {
    if (!active || !hostRef.current) return undefined;
    const service = mountMedusaCompanionV0(hostRef.current, { mediaStream });
    serviceRef.current = service;
    return () => {
      service.dispose();
      serviceRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    serviceRef.current?.setMotionStream(mediaStream);
  }, [mediaStream]);

  if (!active) return null;

  return (
    <div
      ref={hostRef}
      className={`pointer-events-none absolute bottom-3 left-3 z-20 overflow-hidden rounded-2xl border border-violet-400/35 bg-violet-950/30 shadow-[0_0_24px_rgba(139,92,246,0.25)] backdrop-blur-sm ${className}`}
      style={{ width: MEDUSA_COMPANION_DEFAULT_SIZE_V0, height: MEDUSA_COMPANION_DEFAULT_SIZE_V0 }}
      data-rhizoh-medusa-companion="1"
      aria-hidden
    />
  );
});
