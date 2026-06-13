import React, { memo, useEffect, useMemo, useRef } from "react";
import { mountMedusaCompanionV0 } from "../rhizoh/runtime/medusaCompanionServiceV0.js";
import { MEDUSA_COMPANION_DEFAULT_SIZE_V0 } from "../rhizoh/runtime/medusaCompanionSceneV0.js";
import { isMedusaCompanionStreamActiveV0 } from "../rhizoh/runtime/medusaCompanionStreamGateV0.js";
import { resolveMedusaDomainMotionProfileV0 } from "../rhizoh/runtime/medusaCompanionDomainSensitivityV0.js";
import { resolveOverlayNodeFromContextIntentV0 } from "../rhizoh/runtime/rhizohContextIntentSnapshotV0.js";
import { RHIZOH_FEDERATION_NODE_V0 } from "../rhizoh/runtime/rhizohDomainGraphV0.js";

/**
 * Bottom-left Medusa companion — domain-sensitive motion; live camera only.
 */
export const MedusaCompanionOverlayV0 = memo(function MedusaCompanionOverlayV0({
  active = false,
  mediaStream = null,
  overlayNode = null,
  className = ""
}) {
  const hostRef = useRef(null);
  const serviceRef = useRef(null);
  const streamLive = active && isMedusaCompanionStreamActiveV0(mediaStream);
  const federationNode =
    overlayNode ||
    resolveOverlayNodeFromContextIntentV0(RHIZOH_FEDERATION_NODE_V0.MEDIA) ||
    RHIZOH_FEDERATION_NODE_V0.MEDIA;
  const motionProfile = useMemo(
    () => resolveMedusaDomainMotionProfileV0(federationNode),
    [federationNode]
  );

  useEffect(() => {
    if (!streamLive || !hostRef.current) {
      if (serviceRef.current) {
        serviceRef.current.dispose();
        serviceRef.current = null;
      }
      return undefined;
    }

    const host = hostRef.current;
    const service = mountMedusaCompanionV0(host, { mediaStream, motionProfile });
    serviceRef.current = service;

    return () => {
      service.dispose();
      if (serviceRef.current === service) {
        serviceRef.current = null;
      }
      host.replaceChildren();
    };
  }, [streamLive, mediaStream, motionProfile]);

  useEffect(() => {
    if (!streamLive || !serviceRef.current || serviceRef.current.isDisposed()) return;
    serviceRef.current.setMotionStream(mediaStream);
  }, [streamLive, mediaStream]);

  if (!streamLive) return null;

  return (
    <div
      ref={hostRef}
      className={`pointer-events-none absolute bottom-3 left-3 z-20 overflow-hidden rounded-2xl border border-violet-400/35 bg-violet-950/30 shadow-[0_0_24px_rgba(139,92,246,0.25)] backdrop-blur-sm ${className}`}
      style={{ width: MEDUSA_COMPANION_DEFAULT_SIZE_V0, height: MEDUSA_COMPANION_DEFAULT_SIZE_V0 }}
      data-rhizoh-medusa-companion="1"
      data-rhizoh-medusa-live="1"
      data-rhizoh-medusa-overlay-node={federationNode}
      aria-hidden
    />
  );
});
