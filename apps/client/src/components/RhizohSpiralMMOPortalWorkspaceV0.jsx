import React, { memo } from "react";

/**
 * SpiralMMO pin preview — no on-map countdown (timer runs in overlay data only).
 */
export const RhizohSpiralMMOPortalWorkspaceV0 = memo(function RhizohSpiralMMOPortalWorkspaceV0({
  uiLocale = "en",
  node = null,
  onClose
}) {
  const tr = uiLocale === "tr";
  const continent = String(node?.continent || "").replace(/_/g, " ");
  const description = tr
    ? node?.descriptionTr || node?.description || "Uydu katmanı · SpiralMMO uyanış pini"
    : node?.description || "Satellite layer · SpiralMMO awakening pin";

  return (
    <div
      className="pointer-events-auto w-full max-w-sm rounded-xl border border-cyan-500/35 bg-black/90 px-3 py-2 text-white shadow-2xl backdrop-blur-md"
      data-rhizoh-spiral-mmo-portal="1"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-200/80">
            {tr ? "SpiralMMO · uydu" : "SpiralMMO · satellite"}
          </p>
          {continent ? (
            <p className="mt-1 text-[11px] font-semibold text-amber-100/90">{continent}</p>
          ) : null}
          <p className="mt-1 text-[10px] leading-relaxed text-white/65 normal-case">{description}</p>
          <p className="mt-2 text-[9px] text-white/40">
            {tr ? "Dokun → uyanış · geri sayım sonunda V11 haritaya dönüş" : "Tap → awakening · countdown returns to V11 map"}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-white/20 px-2 py-0.5 text-[10px] text-white/60 hover:text-white"
            aria-label={tr ? "Kapat" : "Close"}
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
});
