import React, { useEffect } from "react";
import { useScrCitizenCollectiveFieldV0 } from "../rhizoh/runtime/useScrCitizenCollectiveFieldV0.js";
import { assertScrCollectiveDensityOwnershipV0 } from "../rhizoh/runtime/rhizohScrCitizenVisualProjectionV0.js";
import { RSBL_SURFACE_ID_V0 } from "../rhizoh/runtime/rhizohSurfaceBindingLayerV0.js";

/**
 * “50k collective” — SCR citizen only (T0 projection).
 */
export function SwarmCollectiveAuraV1({
  /** @deprecated B3 — records violation; use SCR only */
  collectiveField,
  className = ""
}) {
  const scrField = useScrCitizenCollectiveFieldV0();

  useEffect(() => {
    if (collectiveField != null) assertScrCollectiveDensityOwnershipV0(collectiveField?.density);
  }, [collectiveField]);

  const density = scrField.density;
  const heat = scrField.heat;
  const threads = scrField.threads;
  const flow = scrField.flowActive ? 1 : 0;
  const breath = scrField.breathMs;

  const a = 0.06 + heat * 0.22;
  const b = 0.04 + density * 0.18;
  const c = 0.03 + threads * 0.12 + flow * 0.06;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
      data-rhizoh-scr-surface={RSBL_SURFACE_ID_V0.SWARM}
      data-rhizoh-coherence-id={scrField.coherence_id || ""}
    >      <div
        className="absolute -left-[20%] top-[18%] h-[55%] w-[70%] rounded-full opacity-40 blur-3xl"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, rgba(251,146,60,${a}) 0%, transparent 55%)`,
          animation: `swarmDrift ${breath}ms ease-in-out infinite alternate`
        }}
      />
      <div
        className="absolute -right-[15%] bottom-[12%] h-[48%] w-[65%] rounded-full opacity-35 blur-3xl"
        style={{
          background: `radial-gradient(ellipse at 70% 50%, rgba(34,211,238,${b}) 0%, transparent 58%)`,
          animation: `swarmDrift ${Math.round(breath * 1.15)}ms ease-in-out infinite alternate-reverse`
        }}
      />
      <div
        className="absolute left-[20%] bottom-[8%] h-[38%] w-[80%] opacity-25 blur-2xl"
        style={{
          background: `linear-gradient(105deg, transparent 0%, rgba(167,139,250,${c}) 45%, transparent 90%)`,
          animation: `swarmFlow ${Math.round(8000 + (1 - density) * 6000)}ms linear infinite`
        }}
      />
      <style>{`
        @keyframes swarmDrift {
          from { transform: translate3d(-1.5%, 0, 0) scale(1); }
          to { transform: translate3d(2%, 1.5%, 0) scale(1.04); }
        }
        @keyframes swarmFlow {
          from { transform: translateX(-6%) skewX(-2deg); opacity: 0.2; }
          50% { opacity: 0.35; }
          to { transform: translateX(6%) skewX(2deg); opacity: 0.22; }
        }
      `}</style>
    </div>
  );
}
