import React, { memo, useCallback, useSyncExternalStore } from "react";
import { RhizohWorldMapToolStripV0 } from "../rhizoh/runtime/RhizohWorldMapToolStripV0.jsx";
import { RhizohWorldSocialPanelV0 } from "./RhizohWorldSocialPanelV0.jsx";
import { RhizohWorldModesPanelV0 } from "./RhizohWorldModesPanelV0.jsx";
import {
  RHIZOH_WORLD_DRAWER_DOMAIN_V0,
  readRhizohWorldDrawerDomainV0,
  subscribeRhizohWorldDrawerDomainV0,
  writeRhizohWorldDrawerDomainV0
} from "../rhizoh/runtime/rhizohWorldDrawerDomainV0.js";
import { getCastleWorldDataStateV2 } from "../castleFlight/castleWorldDataProviderV2.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

const DOMAIN_TABS_V0 = Object.freeze([
  { id: RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE, labelTr: "Mekân", labelEn: "Space" },
  { id: RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL, labelTr: "Social", labelEn: "Social" },
  { id: RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES, labelTr: "Modlar", labelEn: "Modes" }
]);

/**
 * World drawer — Space · Social · Modes at the same level.
 * Wheel lives fixed top-right (RhizohContextWheelShellV0), not inside drawer.
 */
export const RhizohWorldDrawerV0 = memo(function RhizohWorldDrawerV0({
  open,
  onClose,
  activeMapTool = "globe",
  onSelectMapTool,
  uiLocale,
  onOpenGreenroom,
  onOpenBroadcast,
  onShareInvite
}) {
  const locale = uiLocale || readUiLocaleV0();
  const tr = locale === "tr";

  const domain = useSyncExternalStore(
    subscribeRhizohWorldDrawerDomainV0,
    readRhizohWorldDrawerDomainV0,
    readRhizohWorldDrawerDomainV0
  );

  const setDomain = useCallback((id) => {
    writeRhizohWorldDrawerDomainV0(id);
  }, []);

  if (!open) return null;

  const worldData = getCastleWorldDataStateV2();

  return (
    <div
      className="pointer-events-auto fixed inset-x-0 bottom-[3.25rem] z-[58] mx-auto flex max-h-[min(52vh,28rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-cyan-400/25 bg-[#030711]/96 shadow-[0_-8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      role="dialog"
      aria-label={tr ? "Dünya çekmecesi" : "World drawer"}
      data-rhizoh-world-drawer="1"
      data-rhizoh-world-drawer-domain={domain}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/90">
            {tr ? "Dünya" : "World"}
          </p>
          <p className="text-[9px] text-white/45 normal-case">
            {tr ? "Mekân · insanlar · davranış" : "Space · people · behavior"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/15 px-2 py-1 text-[9px] uppercase tracking-wide text-white/60 hover:text-white"
        >
          {tr ? "Kapat" : "Close"}
        </button>
      </div>

      <div
        className="flex gap-1 border-b border-white/10 px-3 py-2"
        role="tablist"
        aria-label={tr ? "Dünya katmanı" : "World layer"}
      >
        {DOMAIN_TABS_V0.map((tab) => {
          const active = domain === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDomain(tab.id)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide transition ${
                active
                  ? "border border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                  : "border border-transparent text-white/45 hover:text-white/75"
              }`}
            >
              {tr ? tab.labelTr : tab.labelEn}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
        {domain === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE ? (
          <div className="space-y-3" data-rhizoh-world-drawer-space="1">
            <RhizohWorldMapToolStripV0
              activeTool={activeMapTool}
              uiLocale={locale}
              onSelect={onSelectMapTool}
              className="w-full justify-start"
            />
            <p className="text-[9px] text-white/45 normal-case">
              {tr
                ? "Harita araçları — wheel sağ üstte. Canlı T0 sahnesinden ayrı."
                : "Map tools — wheel is top-right. Separate from live T0."}
            </p>
            {worldData.feed !== "unavailable" ? (
              <p className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[8px] font-mono text-white/40">
                {tr ? "Veri" : "Data"}: {worldData.feed} · POI {worldData.poiCount} · bina{" "}
                {worldData.buildingCount}
              </p>
            ) : null}
          </div>
        ) : null}

        {domain === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL ? (
          <RhizohWorldSocialPanelV0
            uiLocale={locale}
            onOpenGreenroom={onOpenGreenroom}
            onOpenBroadcast={onOpenBroadcast}
            onShareInvite={onShareInvite}
          />
        ) : null}

        {domain === RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES ? (
          <RhizohWorldModesPanelV0 uiLocale={locale} />
        ) : null}
      </div>
    </div>
  );
});
