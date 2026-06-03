import React, { memo } from "react";
import { resolveT0ZeroFramePresenceV0 } from "./rhizohDeployReadyPresenceV0.js";

/**
 * RESL v1 — presence strip (state-driven, not FEL chat).
 * @see docs/RHIZOH_RESL_V1_UI_SURFACE_SPEC.md
 */
export const RhizohPresenceSurfaceStripV0 = memo(function RhizohPresenceSurfaceStripV0({
  continuityLine,
  presenceBadge,
  transition = "fade_in",
  transitionFeel = null,
  microTransition = null,
  narrativeVelocity = null,
  stripOpacity01 = 1,
  intensity01 = 0.65,
  className = "",
  localeTr = true
}) {
  const zeroFrame = resolveT0ZeroFramePresenceV0({
    continuityLine,
    presenceBadge,
    localeTr
  });
  const line = zeroFrame.continuityLine;
  const badge = zeroFrame.presenceBadge;

  if (typeof window !== "undefined" && zeroFrame.zero_frame_applied) {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh._lastZeroFrameFallback = true;
  }

  const opacity = Math.max(0, Math.min(1, Number(stripOpacity01) || 1));
  const reentryPulse =
    transitionFeel?.presenceReentryHint === true
      ? Math.max(300, Math.min(600, Number(transitionFeel.presencePulseMs) || 420))
      : 0;
  const undertoneW = Math.max(0, Math.min(1, Number(microTransition?.undertone_weight01) || 0));
  const opacityWithUndertone = Math.min(1, opacity * (1 - undertoneW * 0.06) + undertoneW * 0.02);

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      data-rhizoh-presence-surface="1"
      data-rhizoh-presence-transition={transition}
      data-rhizoh-presence-intensity={String(intensity01)}
      data-rhizoh-presence-frame-opacity={String(opacityWithUndertone)}
      data-rhizoh-micro-transition={microTransition?.kind || "hold"}
      data-rhizoh-narrative-velocity={
        narrativeVelocity != null ? String(narrativeVelocity) : undefined
      }
      data-rhizoh-zero-frame-policy={zeroFrame.zero_frame_applied ? "fallback" : "live"}
      data-rhizoh-presence-reentry-ms={reentryPulse > 0 ? String(reentryPulse) : undefined}
      style={{ opacity: opacityWithUndertone, transform: "translateY(0)" }}
    >
      {badge?.label ? (
        <span
          className="rounded-md border border-teal-400/25 bg-teal-950/40 px-1.5 py-0.5 text-[8px] font-semibold text-teal-100/90 normal-case"
          data-rhizoh-presence-badge={badge.tone || "teal-soft"}
        >
          {badge.label}
        </span>
      ) : null}
      {line ? (
        <p className="text-[8px] font-medium text-teal-100/70 normal-case tracking-wide">
          {line}
        </p>
      ) : null}
    </div>
  );
});
