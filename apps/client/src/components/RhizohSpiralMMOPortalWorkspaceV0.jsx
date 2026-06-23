import React, { memo, useEffect, useState } from "react";
import { RHIZOH_MAP_OVERLAY_PANEL_CLASS_V0 } from "../rhizoh/runtime/rhizohWorldMapPanelSurfaceV0.js";
import {
  resolveSpiralMMOPinCitizenshipV0,
  SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0
} from "../rhizoh/runtime/spiralMMOPinCitizenshipV0.js";

const TIER_LABEL_V0 = Object.freeze({
  [SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.HOUR]: { en: "Hour gate", tr: "Saat kapısı" },
  [SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.DAY]: { en: "Day gate", tr: "Gün kapısı" },
  [SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.MONTH]: { en: "Month gate", tr: "Ay kapısı" },
  [SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.YEAR]: { en: "Year gate", tr: "Yıl kapısı" }
});

/**
 * SpiralMMO pin preview — per-pin 6+44 tier citizenship countdown on hover.
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

  const [citizenship, setCitizenship] = useState(() =>
    node ? resolveSpiralMMOPinCitizenshipV0(node) : null
  );

  useEffect(() => {
    if (!node) return undefined;
    const tick = () => setCitizenship(resolveSpiralMMOPinCitizenshipV0(node));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [node]);

  const activeTierLabel =
    citizenship?.activeTierId && TIER_LABEL_V0[citizenship.activeTierId]
      ? TIER_LABEL_V0[citizenship.activeTierId][tr ? "tr" : "en"]
      : null;

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm border-cyan-500/40 px-3 py-2 ${RHIZOH_MAP_OVERLAY_PANEL_CLASS_V0}`}
      data-rhizoh-spiral-mmo-portal="1"
      data-rhizoh-spiral-citizenship-tier={citizenship?.activeTierId || ""}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-200/80">
            {tr ? "SpiralMMO · uydu" : "SpiralMMO · satellite"}
          </p>
          {continent ? (
            <p className="mt-1 text-[11px] font-semibold text-amber-100/90">{continent}</p>
          ) : null}
          <p className="mt-1 text-[10px] leading-relaxed text-white/65 normal-case">{description}</p>

          {citizenship ? (
            <div
              className="mt-2 rounded border border-cyan-400/25 bg-cyan-950/30 px-2 py-1.5"
              data-rhizoh-spiral-citizenship-hud="1"
            >
              <p className="font-mono text-[9px] uppercase tracking-wider text-cyan-200/70">
                {tr ? "Vatandaşlık · 6+44" : "Citizenship · 6+44"}
              </p>
              {citizenship.fullyCitizen ? (
                <p className="mt-1 font-mono text-[11px] text-emerald-300/90">
                  {tr ? "Tam vatandaş" : "Fully citizen"}
                </p>
              ) : (
                <>
                  {activeTierLabel ? (
                    <p className="mt-1 text-[10px] text-amber-100/85">{activeTierLabel}</p>
                  ) : null}
                  <p
                    className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums text-cyan-100"
                    data-rhizoh-spiral-citizenship-countdown="1"
                  >
                    {citizenship.activeRemainingLabel}
                  </p>
                </>
              )}
              <ul className="mt-1.5 space-y-0.5">
                {citizenship.tiers.map((tier) => (
                  <li
                    key={tier.tierId}
                    className={`flex items-center justify-between gap-2 font-mono text-[9px] ${
                      tier.tierId === citizenship.activeTierId && !tier.complete
                        ? "text-cyan-100/90"
                        : "text-white/40"
                    }`}
                  >
                    <span>
                      {tier.complete ? "✓ " : "○ "}
                      {TIER_LABEL_V0[tier.tierId]?.[tr ? "tr" : "en"] || tier.tierId}
                    </span>
                    <span className="tabular-nums">{tier.complete ? "—" : tier.remainingLabel}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-2 text-[9px] text-white/40">
            {tr
              ? "Dokun → uyanış · üzerine gel → vatandaşlık geri sayımı"
              : "Tap → awakening · hover → citizenship countdown"}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded border border-white/20 px-2 py-0.5 text-[10px] text-white/60 hover:text-white"
            aria-label={tr ? "Kapat" : "Close"}
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
});
