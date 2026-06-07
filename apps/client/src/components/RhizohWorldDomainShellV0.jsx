import React, { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RhizohWorldMapToolStripV0 } from "../rhizoh/runtime/RhizohWorldMapToolStripV0.jsx";
import { RhizohWorldSocialPanelV0 } from "./RhizohWorldSocialPanelV0.jsx";
import { RhizohWorldModesPanelV0 } from "./RhizohWorldModesPanelV0.jsx";
import { RhizohCapabilityHaloV1 } from "./RhizohCapabilityHaloV1.jsx";
import {
  RHIZOH_WORLD_DRAWER_DOMAIN_V0,
  writeRhizohWorldDrawerDomainV0
} from "../rhizoh/runtime/rhizohWorldDrawerDomainV0.js";
import { resolveRhizohContextWheelPackV0 } from "../rhizoh/runtime/rhizohContextWheelRegistryV0.js";
import {
  resolveWorldDomainPathV0,
  RHIZOH_T0_LIVE_PATH_V0
} from "../rhizoh/runtime/rhizohWorldDomainRoutesV0.js";
import { getCastleWorldDataStateV2 } from "../castleFlight/castleWorldDataProviderV2.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

const DOMAIN_TABS_V0 = Object.freeze([
  { id: RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE, labelTr: "Mekân", labelEn: "Space" },
  { id: RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL, labelTr: "Social", labelEn: "Social" },
  { id: RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES, labelTr: "Modlar", labelEn: "Modes" }
]);

/**
 * Full-page World domain — Space / Social / Modes. No overlay on T0 live.
 */
export const RhizohWorldDomainShellV0 = memo(function RhizohWorldDomainShellV0({
  domain,
  layerMode,
  uiLocale,
  activeMapTool,
  onSelectMapTool,
  spatialEngineActive,
  onOpenGreenroom,
  onOpenBroadcast,
  onShareInvite,
  onCapNodeIntent,
  onSeedIntent,
  onFocusLayer,
  onModeSelect
}) {
  const navigate = useNavigate();
  const locale = uiLocale || readUiLocaleV0();
  const tr = locale === "tr";
  const worldData = getCastleWorldDataStateV2();
  const isSpace = domain === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE;

  const wheelPack = useMemo(
    () => resolveRhizohContextWheelPackV0(layerMode, locale),
    [layerMode, locale]
  );

  const goTab = useCallback(
    (tabId) => {
      writeRhizohWorldDrawerDomainV0(tabId);
      navigate(resolveWorldDomainPathV0(tabId));
    },
    [navigate]
  );

  const goLive = useCallback(() => {
    navigate(RHIZOH_T0_LIVE_PATH_V0);
  }, [navigate]);

  return (
    <div
      className={`fixed inset-0 z-[20] flex min-h-[100dvh] flex-col text-white ${
        isSpace ? "pointer-events-none bg-transparent" : "bg-[#010103]"
      }`}
      data-rhizoh-world-domain-shell="1"
      data-rhizoh-world-domain={domain}
    >
      <header className="pointer-events-auto shrink-0 border-b border-white/10 bg-[#030711]/95 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-5xl items-start gap-2">
          <button
            type="button"
            onClick={goLive}
            className="mt-1 shrink-0 rounded-lg border border-white/15 px-2 py-1 text-[9px] uppercase tracking-wide text-white/60 hover:border-cyan-400/35 hover:text-cyan-100"
          >
            {tr ? "← Canlı" : "← Live"}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/90">
              {tr ? "Dünya" : "World"}
            </p>
            <div className="mt-1 flex gap-1" role="tablist">
              {DOMAIN_TABS_V0.map((tab) => {
                const active = domain === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => goTab(tab.id)}
                    className={`rounded-lg px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide transition ${
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
          </div>

          {wheelPack.nodes.length ? (
            <div
              className="relative mt-0.5 w-[min(148px,28vw)] shrink-0 overflow-hidden"
              data-rhizoh-context-wheel-embedded="1"
            >
              <RhizohCapabilityHaloV1
                anchor="corner"
                suppressWhisper
                className="pointer-events-auto w-full scale-[0.42] origin-top-right"
                uiLocale={locale}
                nodes={wheelPack.nodes}
                headline={wheelPack.headline}
                intro={wheelPack.intro}
                hideLibrary={wheelPack.hideLibrary}
                onCapNodeIntent={onCapNodeIntent}
                onSeedIntent={onSeedIntent}
                onFocusLayer={onFocusLayer}
              />
            </div>
          ) : null}
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden pointer-events-none">
        {isSpace ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#010103]/25 via-transparent to-[#010103]/70" />
            <div className="pointer-events-auto absolute inset-x-0 bottom-[4.5rem] z-[2] flex justify-center px-3">
              <div className="w-full max-w-3xl space-y-2 rounded-2xl border border-cyan-400/20 bg-[#030711]/90 p-3 backdrop-blur-xl">
                <RhizohWorldMapToolStripV0
                  activeTool={activeMapTool}
                  uiLocale={locale}
                  onSelect={onSelectMapTool}
                  className="w-full justify-start"
                />
                {worldData.feed !== "unavailable" ? (
                  <p className="text-[8px] font-mono text-white/40">
                    {tr ? "Veri" : "Data"}: {worldData.feed} · POI {worldData.poiCount} · bina{" "}
                    {worldData.buildingCount}
                  </p>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        {domain === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL ? (
          <div className="pointer-events-auto mx-auto h-full max-w-2xl overflow-y-auto px-4 py-6">
            <RhizohWorldSocialPanelV0
              uiLocale={locale}
              onOpenGreenroom={onOpenGreenroom}
              onOpenBroadcast={onOpenBroadcast}
              onShareInvite={onShareInvite}
            />
          </div>
        ) : null}

        {domain === RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES ? (
          <div className="pointer-events-auto mx-auto h-full max-w-2xl overflow-y-auto px-4 py-6">
            <RhizohWorldModesPanelV0 uiLocale={locale} onModeSelect={onModeSelect} />
          </div>
        ) : null}
      </main>
    </div>
  );
});
