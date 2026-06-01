import React, { useEffect, useMemo, useState } from "react";
import {
  readHonestCognitionAmbientEnabledV0,
  readThoughtFieldExpandedV0,
  writeHonestCognitionAmbientEnabledV0,
  writeThoughtFieldExpandedV0
} from "./rhizohHonestCognitionSurfaceV0.js";
import {
  resolveThinkingExposureV0,
  thinkingPhaseLabelV0
} from "./rhizohThinkingModelV0.js";

/**
 * Honest Baseline controls — ambient + optional 3D thought field.
 */
export function RhizohCognitionExposureBarV0({
  rhizohFieldState = "IDLE",
  localeTr = true,
  showThinkingPhaseChip = true
}) {
  const [ambientOn, setAmbientOn] = useState(() => readHonestCognitionAmbientEnabledV0());
  const [thoughtFieldOn, setThoughtFieldOn] = useState(() => readThoughtFieldExpandedV0());

  const exposure = useMemo(
    () => resolveThinkingExposureV0(rhizohFieldState),
    [rhizohFieldState]
  );

  const phaseLabel = thinkingPhaseLabelV0(exposure.phase, localeTr);
  const busy = exposure.phase !== "rest";

  useEffect(() => {
    const sync = () => {
      setAmbientOn(readHonestCognitionAmbientEnabledV0());
      setThoughtFieldOn(readThoughtFieldExpandedV0());
    };
    window.addEventListener("rhizoh:honest-cognition-toggle", sync);
    return () => window.removeEventListener("rhizoh:honest-cognition-toggle", sync);
  }, []);

  return (
    <div
      className="pointer-events-auto fixed bottom-[6.35rem] right-3 z-[61] flex max-w-[14rem] flex-col items-end gap-1.5 sm:right-4"
      data-rhizoh-cognition-exposure-bar="1"
    >
      {busy && showThinkingPhaseChip ? (
        <span className="rounded-full border border-white/15 bg-black/50 px-2.5 py-0.5 text-[8px] font-medium tracking-wide text-cyan-100/90 backdrop-blur-md normal-case">
          {phaseLabel}
        </span>
      ) : null}
      <div className="flex flex-wrap justify-end gap-1 rounded-2xl border border-white/12 bg-black/55 p-1.5 backdrop-blur-md">
        <button
          type="button"
          className={`rounded-xl px-2 py-1 text-[8px] font-semibold normal-case transition-colors ${
            ambientOn ? "bg-cyan-500/20 text-cyan-100" : "text-white/50 hover:text-white/80"
          }`}
          onClick={() => {
            const next = !ambientOn;
            writeHonestCognitionAmbientEnabledV0(next);
            setAmbientOn(next);
          }}
          title={localeTr ? "Işık geçişleri" : "Ambient transitions"}
        >
          {localeTr ? "Işık" : "Light"}
        </button>
        <button
          type="button"
          className={`rounded-xl px-2 py-1 text-[8px] font-semibold normal-case transition-colors ${
            thoughtFieldOn ? "bg-fuchsia-500/25 text-fuchsia-100" : "text-white/50 hover:text-white/80"
          }`}
          onClick={() => {
            const next = !thoughtFieldOn;
            writeThoughtFieldExpandedV0(next);
            setThoughtFieldOn(next);
          }}
          title={localeTr ? "3D düşünce alanı" : "3D thought field"}
        >
          {localeTr ? "Düşünce alanı" : "Thought field"}
        </button>
      </div>
    </div>
  );
}
