import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
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
import { RhizohWorldMapControlsV0 } from "./RhizohWorldMapControlsV0.jsx";
import { RhizohWorldLayerQuickChipV0 } from "./RhizohWorldLayerQuickChipV0.jsx";
import { RhizohWorldClaimAnchorChipV0 } from "./RhizohWorldClaimAnchorChipV0.jsx";
import { RhizohWorldMarkerLayerFilterV0 } from "./RhizohWorldMarkerLayerFilterV0.jsx";
import { RhizohWorldAtmosphereChipV0 } from "./RhizohWorldAtmosphereChipV0.jsx";
import { RhizohWorldSportsNewsStripV0 } from "./RhizohWorldSportsNewsStripV0.jsx";
import { resolveRhizohWorldSpaceMapStripBottomCssV0 } from "../rhizoh/runtime/rhizohWorldSurfacePolicyV0.js";
import { routeCesiumCommandV0 } from "../castleFlight/cesiumCommandRouterV0.js";
import {
  readCastleNexusGeoV0,
  readUserCastleAnchorGeoV0
} from "../rhizoh/runtime/worldMapBootstrapGeoV0.js";
import { readActiveSpatialMemoryMapPinsV1 } from "../rhizoh/runtime/rhizohSpatialMemoryAnchorV1.js";
import {
  buildRhizohMapBrainActionsV1,
  formatRhizohMapBrainActionLabelV1,
  recordRhizohMapBrainFeedbackV1
} from "../rhizoh/runtime/rhizohMapBrainV1.js";
import { RhizohNeonCountdownStripV0 } from "./RhizohNeonCountdownStripV0.jsx";

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
  mapToolCesiumReady = false,
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
  const [wheelOpen, setWheelOpen] = useState(false);
  const mapStripBottomCssV0 = resolveRhizohWorldSpaceMapStripBottomCssV0();

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
      <header className="pointer-events-auto relative z-[1] shrink-0 border-b border-white/10 bg-[#030711]/95 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
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

          {isSpace ? (
            <RhizohNeonCountdownStripV0 uiLocale={locale} className="mt-0.5" />
          ) : null}

          {!isSpace && wheelPack.nodes.length ? (
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

      <main className="relative z-[1] min-h-0 flex-1 overflow-hidden pointer-events-none">
        {isSpace ? (
          <>
            <div className="absolute left-3 top-2 z-[3] flex max-h-[min(52vh,28rem)] w-[min(280px,58vw)] flex-col gap-1.5 overflow-y-auto sm:left-4 sm:top-3">
              <RhizohWorldLayerQuickChipV0
                activeTool={activeMapTool}
                uiLocale={locale}
                onSelect={onSelectMapTool}
              />
              <RhizohWorldClaimAnchorChipV0 active={isSpace} uiLocale={locale} />
              <RhizohWorldSportsNewsStripV0 active={spatialEngineActive} uiLocale={locale} />
              <WorldStartCardV0
                activeTool={activeMapTool}
                active={isSpace}
                cesiumReady={mapToolCesiumReady && spatialEngineActive}
                uiLocale={locale}
                worldData={worldData}
                onSelect={onSelectMapTool}
              />
            </div>
            <div className="pointer-events-auto absolute right-3 top-3 z-[3] flex flex-col items-end gap-2 sm:right-4 sm:top-4">
              <RhizohWorldMapControlsV0 active={spatialEngineActive} uiLocale={locale} />
              <RhizohWorldAtmosphereChipV0 active={isSpace} uiLocale={locale} />
            </div>
            {wheelPack.nodes.length ? (
              <div className="pointer-events-auto absolute left-3 z-[3] sm:left-4" style={{ bottom: mapStripBottomCssV0 }}>
                <button
                  type="button"
                  onClick={() => setWheelOpen((v) => !v)}
                  className="mb-2 rounded-xl border border-white/15 bg-[#030711]/90 px-2.5 py-1.5 text-[9px] uppercase tracking-wide text-white/70 hover:border-cyan-400/35 hover:text-cyan-100"
                  aria-expanded={wheelOpen}
                >
                  {tr ? (wheelOpen ? "Araçları kapat" : "Araçlar") : wheelOpen ? "Hide tools" : "Tools"}
                </button>
                {wheelOpen ? (
                  <div className="w-[min(220px,52vw)]" data-rhizoh-context-wheel-floating="1">
                    <RhizohCapabilityHaloV1
                      anchor="corner"
                      suppressWhisper
                      className="pointer-events-auto w-full scale-[0.55] origin-bottom-left"
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
            ) : null}
            <div
              className="pointer-events-auto absolute inset-x-0 z-[2] flex justify-center px-3"
              style={{ bottom: mapStripBottomCssV0 }}
            >
              <div className="w-full max-w-3xl space-y-2 rounded-2xl border border-cyan-400/20 bg-[#030711]/90 p-3 backdrop-blur-xl">
                <RhizohWorldMapToolStripV0
                  activeTool={activeMapTool}
                  uiLocale={locale}
                  onSelect={onSelectMapTool}
                  cesiumReady={mapToolCesiumReady && spatialEngineActive}
                  className="w-full justify-start"
                />
                <RhizohWorldMarkerLayerFilterV0 uiLocale={locale} />
                {worldData.feed !== "unavailable" ? (
                  <p className="text-[8px] font-mono text-white/40">
                    {tr ? "Veri" : "Data"}: {worldData.feed} · POI {worldData.poiCount} · bina{" "}
                    {worldData.buildingCount}
                    <span className="text-white/30">
                      {" "}
                      · {tr ? "canlı: hava + trafik" : "live: weather + traffic"}
                    </span>
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

function WorldStartCardV0({ activeTool, active, cesiumReady, uiLocale, worldData, onSelect }) {
  const tr = (uiLocale || readUiLocaleV0()) === "tr";
  const feedReady = worldData?.feed && worldData.feed !== "unavailable";
  const activeCastle = readCastleNexusGeoV0() || readUserCastleAnchorGeoV0();
  const memoryPins = readActiveSpatialMemoryMapPinsV1();
  const mapBrain = buildRhizohMapBrainActionsV1({
    conversationState: {
      lastIntent: activeTool,
      activeThreads: memoryPins.length ? ["memory_nodes"] : [],
      unresolvedTasks: active ? [] : ["map_boot"]
    },
    mapState: {
      active,
      cesiumReady: cesiumReady === true,
      activeMapTool: activeTool,
      hasActiveCastle: Boolean(activeCastle),
      memoryNodeCount: memoryPins.length,
      hasUserLocation: Boolean(activeCastle),
      worldDataReady: Boolean(feedReady)
    },
    limit: 3
  });
  const mapBrainActionSignature = mapBrain.actions.map((action) => action.id).join("|");

  useEffect(() => {
    for (const action of mapBrain.actions) {
      recordRhizohMapBrainFeedbackV1({ actionId: action.id, kind: "impression" });
    }
  }, [mapBrainActionSignature]);

  const executeBrainAction = (action) => {
    if (!action) return;
    recordRhizohMapBrainFeedbackV1({ actionId: action.id, kind: "selected" });
    if (action.command === "set_map_tool" && action.mapTool) {
      onSelect?.(action.mapTool);
      recordRhizohMapBrainFeedbackV1({ actionId: action.id, kind: "result", ok: true });
      return;
    }
    if (action.command === "cesium_op" && action.op) {
      const result = routeCesiumCommandV0({
        op: action.op,
        source: "rhizoh_map_brain_v1",
        canonical: `map_brain:${action.id}`,
        meta: Object.freeze({ ingress: "RhizohWorldDomainShellV0", reason: action.reason })
      });
      recordRhizohMapBrainFeedbackV1({
        actionId: action.id,
        kind: "result",
        ok: result?.ok !== false
      });
    }
  };

  return (
    <section
      className="pointer-events-auto rounded-2xl border border-cyan-400/20 bg-[#030711]/90 p-3 text-white shadow-lg backdrop-blur-md normal-case"
      data-rhizoh-world-start-card="1"
    >
      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-200/80">
        {tr ? "Dünya başlangıcı" : "World start"}
      </p>
      <p className="mt-1 text-[12px] font-semibold text-white/92">
        {tr ? "Neredeyim?" : "Where am I?"}
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-white/58">
        {tr
          ? active
            ? "V11 haritası açık. Sokak, uydu veya bağlantı görünümünü seçebilirsin."
            : "Harita hazırlanıyor. Açıldığında ilk eylemler burada kalacak."
          : active
            ? "V11 map is open. Choose street, satellite, or anchor view."
            : "The map is preparing. First actions stay here when it opens."}
      </p>
      <div className="mt-2 grid gap-1.5">
        {mapBrain.actions.map((action) => {
          const selected = action.mapTool && activeTool === action.mapTool;
          return (
            <button
              key={action.id}
              type="button"
              disabled={!onSelect}
              onClick={() => executeBrainAction(action)}
              className={`rounded-lg border px-2 py-1.5 text-left text-[9px] font-semibold transition ${
                selected
                  ? "border-cyan-400/55 bg-cyan-500/20 text-cyan-50"
                  : "border-white/12 bg-black/35 text-white/72 hover:border-cyan-400/35 hover:text-cyan-100"
              }`}
            >
              <span>{formatRhizohMapBrainActionLabelV1(action, tr ? "tr" : "en")}</span>
              <span className="ml-1 text-[8px] text-white/35">
                {Math.round(action.confidence * 100)}% · {action.contextSource}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[8px] text-white/42">
        {feedReady
          ? tr
            ? `Burada: POI ${worldData.poiCount} · bina ${worldData.buildingCount}`
            : `Here: POI ${worldData.poiCount} · buildings ${worldData.buildingCount}`
          : tr
            ? "Burada: harita ve bağlantı seçimi"
            : "Here: map and anchor selection"}
      </p>
    </section>
  );
}
