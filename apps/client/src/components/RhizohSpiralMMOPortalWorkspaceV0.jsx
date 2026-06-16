import React, { memo } from "react";

/**
 * SpiralMMO pin preview — no on-map countdown (timer runs in overlay data only).
 */
export const RhizohSpiralMMOPortalWorkspaceV0 = memo(function RhizohSpiralMMOPortalWorkspaceV0({
  uiLocale = "en",
  onClose
}) {
  const tr = uiLocale === "tr";

  return (
    <div
      className="pointer-events-auto rounded-xl border border-cyan-500/35 bg-black/85 px-3 py-2 text-white shadow-2xl backdrop-blur-md"
      data-rhizoh-spiral-mmo-portal="1"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-200/80">
          {tr ? "SpiralMMO · uydu harita" : "SpiralMMO · satellite map"}
        </p>
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
