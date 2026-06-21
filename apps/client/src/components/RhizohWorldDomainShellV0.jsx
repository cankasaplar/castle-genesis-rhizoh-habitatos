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
import { RhizohWorldClaimAnchorChipV0 } from "./RhizohWorldClaimAnchorChipV0.jsx";
import { RhizohWorldMarkerLayerFilterV0 } from "./RhizohWorldMarkerLayerFilterV0.jsx";
import { RhizohSpiralMapLayerFilterV0 } from "./RhizohSpiralMapLayerFilterV0.jsx";
import { RhizohWorldRealityModeSwitcherV0 } from "./RhizohWorldRealityModeSwitcherV0.jsx";
import { RhizohWorldAtmosphereChipV0 } from "./RhizohWorldAtmosphereChipV0.jsx";
import { RhizohWorldSportsNewsStripV0 } from "./RhizohWorldSportsNewsStripV0.jsx";
import { resolveRhizohWorldSpaceMapStripBottomCssV0 } from "../rhizoh/runtime/rhizohWorldSurfacePolicyV0.js";
import {
  readCastleNexusGeoV0,
  readUserCastleAnchorGeoV0
} from "../rhizoh/runtime/worldMapBootstrapGeoV0.js";
import { readActiveSpatialMemoryMapPinsV1 } from "../rhizoh/runtime/rhizohSpatialMemoryAnchorV1.js";
import { shouldSuppressWorldDomainChromeV0 } from "../rhizoh/runtime/worldDomainCalmModeV0.js";
import {
  buildRhizohMapBrainActionsV1,
  executeRhizohMapBrainActionV1,
  formatRhizohMapBrainActionLabelV1,
  recordRhizohMapBrainFeedbackV1
} from "../rhizoh/runtime/rhizohMapBrainV1.js";
import {
  armWorldMapLocationPickV0,
  readWorldMapClaimModeV0,
  WORLD_MAP_CLAIM_MODE_EVENT_V0
} from "../rhizoh/runtime/worldMapClaimModeV0.js";

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
  onModeSelect,
  onRequestGeo,
  mapStripBottomCss
}) {
  const navigate = useNavigate();
  const locale = uiLocale || readUiLocaleV0();
  const tr = locale === "tr";
  const domainCalmV0 = shouldSuppressWorldDomainChromeV0();
  const worldData = getCastleWorldDataStateV2();
  const isSpace = domain === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE;
  const [wheelOpen, setWheelOpen] = useState(false);
  const [mapLayersOpen, setMapLayersOpen] = useState(false);
  const mapStripBottomCssV0 =
    mapStripBottomCss || resolveRhizohWorldSpaceMapStripBottomCssV0();

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
      className={`fixed inset-0 z-[20] text-white ${
        isSpace
          ? "pointer-events-none bg-transparent"
          : "pointer-events-auto flex min-h-[100dvh] flex-col bg-[#010103]"
      }`}
      data-rhizoh-world-domain-shell="1"
      data-rhizoh-world-domain={domain}
    >
      <header
        className="pointer-events-auto relative z-[1] shrink-0 border-b border-white/10 bg-[#030711]/95 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
        data-rhizoh-world-domain-interactive="1"
      >
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

      <main
        className={
          isSpace
            ? "pointer-events-none absolute inset-0 overflow-visible"
            : "relative z-[1] min-h-0 flex-1 overflow-hidden"
        }
      >
        {isSpace ? (
          <>
            <div
              className="pointer-events-none absolute left-3 top-2 z-[3] flex max-h-[min(40vh,22rem)] w-[min(260px,52vw)] flex-col gap-1.5 overflow-y-auto sm:left-4 sm:top-3"
            >
              <RhizohWorldClaimAnchorChipV0
                active={isSpace}
                uiLocale={locale}
                className="pointer-events-auto self-start"
              />
              <WorldStartCardV0
                activeTool={activeMapTool}
                active={isSpace}
                cesiumReady={mapToolCesiumReady && spatialEngineActive}
                uiLocale={locale}
                worldData={worldData}
                onSelect={onSelectMapTool}
                onRequestGeo={onRequestGeo}
              />
              <RhizohWorldSportsNewsStripV0
                active={spatialEngineActive && !domainCalmV0}
                uiLocale={locale}
                className="pointer-events-auto"
              />
            </div>
            <div
              className="pointer-events-auto absolute right-3 top-3 z-[3] flex max-w-[min(220px,44vw)] flex-col items-end gap-2 sm:right-4 sm:top-4"
              data-rhizoh-world-domain-interactive="1"
            >
              <RhizohWorldMapControlsV0 active={spatialEngineActive} uiLocale={locale} />
              <RhizohWorldAtmosphereChipV0 active={isSpace} uiLocale={locale} />
              {wheelPack.nodes.length && !domainCalmV0 ? (
                <div className="flex w-full flex-col items-end" data-rhizoh-context-wheel-floating="1">
                  <button
                    type="button"
                    onClick={() => setWheelOpen((v) => !v)}
                    className="rounded-xl border border-white/15 bg-[#030711]/90 px-2.5 py-1.5 text-[9px] uppercase tracking-wide text-white/70 hover:border-cyan-400/35 hover:text-cyan-100"
                    aria-expanded={wheelOpen}
                  >
                    {tr ? (wheelOpen ? "Araçları kapat" : "Araçlar") : wheelOpen ? "Hide tools" : "Tools"}
                  </button>
                  {wheelOpen ? (
                    <div className="mt-2 w-full">
                      <RhizohCapabilityHaloV1
                        anchor="corner"
                        suppressWhisper
                        className="pointer-events-auto w-full scale-[0.55] origin-top-right"
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
            </div>
            <div
              className="pointer-events-auto absolute inset-x-0 z-[2] flex justify-center px-3"
              style={{ bottom: mapStripBottomCssV0 }}
              data-rhizoh-world-domain-interactive="1"
            >
              <div className="w-full max-w-3xl rounded-2xl border border-cyan-400/20 bg-[#030711]/90 px-2.5 py-2 backdrop-blur-xl">
                <RhizohWorldRealityModeSwitcherV0 uiLocale={locale} className="mb-2 w-full" />
                <RhizohWorldMapToolStripV0
                  activeTool={activeMapTool}
                  uiLocale={locale}
                  onSelect={onSelectMapTool}
                  cesiumReady={mapToolCesiumReady && spatialEngineActive}
                  className="w-full justify-center border-0 bg-transparent p-0"
                />
                <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-white/8 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setMapLayersOpen((v) => !v)}
                    className="text-[8px] font-semibold uppercase tracking-wider text-white/50 hover:text-cyan-200"
                    aria-expanded={mapLayersOpen}
                  >
                    {tr
                      ? mapLayersOpen
                        ? "Katmanları gizle"
                        : "Katmanlar · filtre"
                      : mapLayersOpen
                        ? "Hide layers"
                        : "Layers · filter"}
                  </button>
                  {worldData.feed !== "unavailable" ? (
                    <p className="truncate text-[8px] font-mono text-white/35">
                      {worldData.feed} · POI {worldData.poiCount}
                    </p>
                  ) : null}
                </div>
                {mapLayersOpen ? (
                  <div className="mt-1.5 space-y-2 border-t border-white/8 pt-1.5">
                    <div>
                      <p className="mb-1 text-[8px] font-semibold uppercase tracking-wider text-cyan-200/70">
                        {tr ? "SpiralMMO katmanları" : "SpiralMMO layers"}
                      </p>
                      {String(activeMapTool || "") === "satellite" ? (
                        <p className="mb-1.5 text-[8px] normal-case leading-snug text-cyan-100/65">
                          {tr
                            ? "Uydu katmanında kıta SpiralMMO pinleri her zaman görünür."
                            : "Satellite layer always shows continent SpiralMMO pins."}
                        </p>
                      ) : null}
                      <RhizohSpiralMapLayerFilterV0 uiLocale={locale} />
                    </div>
                    <div>
                      <p className="mb-1 text-[8px] font-semibold uppercase tracking-wider text-white/40">
                        {tr ? "Marker filtreleri" : "Marker filters"}
                      </p>
                      <RhizohWorldMarkerLayerFilterV0 uiLocale={locale} />
                    </div>
                  </div>
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

function WorldStartCardV0({ activeTool, active, cesiumReady, uiLocale, worldData, onSelect, onRequestGeo }) {
  const tr = (uiLocale || readUiLocaleV0()) === "tr";
  const [expanded, setExpanded] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [claimArmed, setClaimArmed] = useState(() => readWorldMapClaimModeV0());
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

  useEffect(() => {
    const onClaimMode = (e) => {
      const armed = !!e.detail?.enabled;
      setClaimArmed(armed);
      if (armed) setExpanded(false);
    };
    window.addEventListener(WORLD_MAP_CLAIM_MODE_EVENT_V0, onClaimMode);
    return () => window.removeEventListener(WORLD_MAP_CLAIM_MODE_EVENT_V0, onClaimMode);
  }, []);

  const executeBrainAction = (action) => {
    if (!action) return;
    void executeRhizohMapBrainActionV1(action, {
      onSelectMapTool: onSelect,
      onRequestGeo
    });
  };

  const onUseGeoV0 = async () => {
    if (!onRequestGeo || geoBusy) return;
    setGeoBusy(true);
    try {
      await onRequestGeo();
    } finally {
      setGeoBusy(false);
    }
  };

  const onPickFromMapV0 = () => {
    armWorldMapLocationPickV0();
    onSelect?.("city_map");
  };

  return (
    <section
      className="pointer-events-none w-fit max-w-[min(260px,52vw)] rounded-2xl border border-cyan-400/20 bg-[#030711]/90 p-2.5 text-white shadow-lg backdrop-blur-md normal-case"
      data-rhizoh-world-start-card="1"
    >
      <div className="pointer-events-auto flex items-start justify-between gap-2">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-200/80">
          {tr ? "Dünya başlangıcı" : "World start"}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-[8px] uppercase tracking-wide text-white/45 hover:text-cyan-200"
        >
          {expanded ? (tr ? "Daralt" : "Collapse") : tr ? "Aç" : "Open"}
        </button>
      </div>
      <p className="mt-1 text-[11px] font-semibold text-white/92">{tr ? "Neredeyim?" : "Where am I?"}</p>
      {claimArmed ? (
        <p className="pointer-events-none mt-1 text-[9px] font-semibold text-purple-200/90">
          {tr ? "Haritaya tıkla — seçim modu açık" : "Tap the map — pick mode on"}
        </p>
      ) : null}
      {!activeCastle ? (
        <div className="pointer-events-auto mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={geoBusy || !onRequestGeo}
            onClick={() => void onUseGeoV0()}
            className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-2 py-1 text-[9px] font-semibold text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-50"
          >
            {geoBusy
              ? tr
                ? "Konum isteniyor…"
                : "Requesting…"
              : tr
                ? "Konumumu kullan"
                : "Use my location"}
          </button>
          <button
            type="button"
            onClick={onPickFromMapV0}
            className="rounded-lg border border-purple-400/45 bg-purple-500/15 px-2 py-1 text-[9px] font-semibold text-purple-100 hover:bg-purple-500/25"
          >
            {tr ? "Haritadan seç" : "Pick on map"}
          </button>
        </div>
      ) : null}
      {!expanded ? (
        <p className="mt-1 text-[9px] leading-relaxed text-white/50">
          {activeCastle
            ? tr
              ? "Konum bağlı — HOME CASTLE Serencebey'de kalıcı; Explorer senin noktandan."
              : "Location linked — HOME CASTLE stays at Serencebey; Explorer starts at you."
            : tr
              ? "GPS veya harita tıklaması ile başla. HOME CASTLE her zaman Serencebey'de."
              : "Start with GPS or map tap. HOME CASTLE is always at Serencebey."}
        </p>
      ) : (
        <>
          <p className="mt-1 text-[10px] leading-relaxed text-white/58">
            {tr
              ? active
                ? "V11 haritası açık. Sokak, uydu veya bağlantı görünümünü alttaki şeritten seç."
                : "Harita hazırlanıyor."
              : active
                ? "V11 map is open. Pick street, satellite, or anchor from the bottom strip."
                : "The map is preparing."}
          </p>
          <div className="pointer-events-auto mt-2 grid gap-1.5">
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
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[8px] text-white/42">
            {feedReady
              ? tr
                ? `POI ${worldData.poiCount} · bina ${worldData.buildingCount}`
                : `POI ${worldData.poiCount} · buildings ${worldData.buildingCount}`
              : tr
                ? "Harita ve bağlantı seçimi"
                : "Map and anchor selection"}
          </p>
        </>
      )}
    </section>
  );
}
