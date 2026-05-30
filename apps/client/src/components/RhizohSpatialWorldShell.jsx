import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Volume2, VolumeX, PanelLeft, Radio, MapPin, Orbit, Eye } from "lucide-react";
import CesiumRealMapLayer from "../castleFlight/CesiumRealMapLayer.jsx";
import CastleFlightHud from "../castleFlight/CastleFlightHud.jsx";
import "../castleFlight/registerGlobals.js";
import { RhizohLivingWorldEntryShell } from "./RhizohLivingWorldEntryShell.jsx";
import { RhizohGatewayBanner } from "./RhizohGatewayBanner.jsx";
import { RhizohCapabilityHaloV1 } from "./RhizohCapabilityHaloV1.jsx";
import { RhizohProductSurfaceDrawerV0 } from "./RhizohProductSurfaceDrawerV0.jsx";
import { UnifiedProductShellBar } from "../studio/ui/UnifiedProductShellBar.jsx";
import { RhizohConversationDockV0 } from "./RhizohConversationDockV0.jsx";
import { useRhizohGatewayMonitor, getRhizohApiBase } from "../rhizoh/useRhizohGatewayMonitor.js";
import { useCastleAuth } from "../firebase/useCastleAuth.js";
import { installRhizohPresenceAcoustics } from "../rhizoh/presence/presenceAcoustics.js";
import { isWorldLayerEnabled } from "../rhizoh/runtime/castleWorldLayerGateV0.js";
import { getWorldExecutionModeV0 } from "../rhizoh/runtime/worldExecutionGateV0.js";
import { deriveShellHighlightId } from "../rhizoh/runtime/castleRuntimeShellModelV0.js";
import { CASTLE_RHIZOH_KERNEL_DRAWER_HREF } from "../kernel/visual/rhizohCapabilityHaloConfigV1.js";
import { ensureGreenRoomMainHallBound } from "../studio/lib/greenRoomRouteBinding";
import { startGreenRoomPresenceMesh } from "../studio/runtime/greenRoomPresenceMesh";
import { ensureCastleWorldTopology } from "../studio/lib/bootstrapWorldTopology";
import { startRhizohAgentRuntime } from "../studio/runtime/agentRuntimeLoop";
import {
  readRhizohSpatialUiPrefsV0,
  writeRhizohSpatialUiPrefsV0,
  mergeRhizohSpatialUiPrefsV0,
  resolveSpatialMapSurfaceActiveV0,
  spatialSectionsToCopyVisibilityV0
} from "../rhizoh/spatial/rhizohSpatialUiPreferencesV0.js";
import {
  readProductSurfaceV0,
  writeProductSurfaceV0,
  resolveProductShellSelectionV0,
  shouldStartGreenRoomPresenceMeshV0,
  productSurfaceOpensDrawerV0
} from "../rhizoh/spatial/rhizohProductShellBridgeV0.js";
import { reconcileMapSurfaceFromGateway } from "../reality/realityDirector.js";
import { configureSpatialRealityInfraV0, clearSpatialRealityInfraV0 } from "../rhizoh/spatial/spatialRealityInfraV0.js";

const SECTION_LABELS = Object.freeze({
  hero: "Karşılama",
  ftue: "İlk adımlar",
  actionClosure: "Son eylem",
  continuity: "Süreklilik",
  worldState: "Dünya metni",
  actions: "Eylem açıklamaları",
  technicalMeta: "Teknik meta"
});

/**
 * Spatial-first Rhizoh shell — Cesium + product shell bar + capability halo + live gateway/mesh.
 *
 * @param {{
 *   entryModel: object,
 *   onObserve?: () => void,
 *   onEnterCastle?: () => void
 * }} props
 */
export const RhizohSpatialWorldShell = memo(function RhizohSpatialWorldShell({
  entryModel,
  onObserve,
  onEnterCastle
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const castleAuth = useCastleAuth();
  const gateway = useRhizohGatewayMonitor();
  const [prefs, setPrefs] = useState(() => readRhizohSpatialUiPrefsV0());
  const [productSurface, setProductSurface] = useState(() => readProductSurfaceV0());
  const [drawerOpen, setDrawerOpen] = useState(() => productSurfaceOpensDrawerV0(readProductSurfaceV0()));
  const [soundUnlocked, setSoundUnlocked] = useState(false);

  const persistPrefs = useCallback((patch) => {
    setPrefs((prev) => {
      const next = mergeRhizohSpatialUiPrefsV0({ ...prev, ...patch });
      writeRhizohSpatialUiPrefsV0(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const fromPath = deriveShellHighlightId(pathname, { productSurface: "world" });
    if (fromPath && fromPath !== productSurface) {
      setProductSurface(fromPath);
      writeProductSurfaceV0(fromPath);
      setDrawerOpen(productSurfaceOpensDrawerV0(fromPath));
    }
  }, [pathname, productSurface]);

  useEffect(() => {
    ensureCastleWorldTopology();
    return startRhizohAgentRuntime({ heartbeatMs: 4200 });
  }, []);

  useEffect(() => {
    if (!liveMeshEligible) return undefined;
    ensureGreenRoomMainHallBound();
    return startGreenRoomPresenceMesh();
  }, [liveMeshEligible, gateway.healthPollSerial]);

  const toggleSection = useCallback(
    (key) => {
      persistPrefs({
        sections: {
          ...prefs.sections,
          [key]: !prefs.sections[key]
        }
      });
    },
    [persistPrefs, prefs.sections]
  );

  const mapSurfaceActive = useMemo(
    () =>
      isWorldLayerEnabled() &&
      resolveSpatialMapSurfaceActiveV0(gateway.phase, { worldLayerEnabled: true }),
    [gateway.phase]
  );

  const liveMeshEligible = useMemo(() => {
    const ph = String(gateway.phase || "");
    return (
      gateway.remoteContinuityAvailable &&
      shouldStartGreenRoomPresenceMeshV0(productSurface) &&
      ph !== "initializing" &&
      ph !== "connecting" &&
      ph !== "reconnecting"
    );
  }, [gateway.phase, gateway.remoteContinuityAvailable, productSurface]);

  useEffect(() => {
    configureSpatialRealityInfraV0({
      gatewayPhase: gateway.phase,
      mapSurfaceActive,
      onSync: () => {}
    });
    reconcileMapSurfaceFromGateway();
    return () => clearSpatialRealityInfraV0();
  }, [gateway.phase, mapSurfaceActive]);

  useEffect(() => {
    if (!prefs.soundEnabled || !soundUnlocked) return undefined;
    return installRhizohPresenceAcoustics({
      isSoundEnabled: () => prefs.soundEnabled && soundUnlocked
    });
  }, [prefs.soundEnabled, soundUnlocked]);

  const copyVisibility = useMemo(() => spatialSectionsToCopyVisibilityV0(prefs.sections), [prefs.sections]);
  const worldExecutionMode = getWorldExecutionModeV0();
  const hasHttpOrigin = Boolean(getRhizohApiBase());
  const gatewayOrigin = getRhizohApiBase();

  const handleSoundToggle = useCallback(() => {
    if (!prefs.soundEnabled) {
      setSoundUnlocked(true);
      persistPrefs({ soundEnabled: true });
      return;
    }
    persistPrefs({ soundEnabled: false });
  }, [persistPrefs, prefs.soundEnabled]);

  const onProductShellSelect = useCallback(
    (id) => {
      const decision = resolveProductShellSelectionV0(id, productSurface);
      setProductSurface(decision.surface);
      writeProductSurfaceV0(decision.surface);
      if (decision.closeDrawer) {
        setDrawerOpen(false);
        return;
      }
      if (decision.toggleDrawer) {
        setDrawerOpen((v) => !v);
        return;
      }
      setDrawerOpen(productSurfaceOpensDrawerV0(decision.surface));
    },
    [productSurface]
  );

  const onHaloOpenHref = useCallback(
    (href) => {
      const h = String(href || "");
      if (h === CASTLE_RHIZOH_KERNEL_DRAWER_HREF) {
        onProductShellSelect("studio");
        return;
      }
      if (h.startsWith("/")) {
        navigate(h);
        return;
      }
      if (h.startsWith("http")) {
        window.open(h, "_blank", "noopener,noreferrer");
      }
    },
    [navigate, onProductShellSelect]
  );

  const onHaloOpenRealMap = useCallback(() => {
    onProductShellSelect("world");
    try {
      window.__CASTLE_CESIUM__?.flyToIstanbul?.();
    } catch {
      /* noop */
    }
  }, [onProductShellSelect]);

  const collectivePulse = entryModel?.worldState?.castlePresence?.pulse01 ?? 0.45;

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black text-white"
      data-rhizoh-spatial-shell="1"
      data-map-surface-active={mapSurfaceActive ? "1" : "0"}
      data-gateway-phase={gateway.phase}
      data-product-surface={productSurface}
    >
      <CesiumRealMapLayer active={mapSurfaceActive} />

      {gateway.phase === "connecting" || gateway.phase === "reconnecting" || gateway.phase === "initializing" ? (
        <div className="pointer-events-none absolute left-3 top-16 z-[38] rounded-xl border border-cyan-400/30 bg-black/70 px-3 py-2 text-[10px] text-cyan-100/90 backdrop-blur-md">
          {gateway.headline}
        </div>
      ) : null}

      {gateway.phase === "offline" || gateway.phase === "offline_dns" || gateway.phase === "unconfigured" ? (
        <div className="pointer-events-auto absolute left-3 top-16 z-[38] max-w-sm rounded-xl border border-amber-400/35 bg-black/75 px-3 py-2 text-[10px] text-amber-100/90 backdrop-blur-md">
          <p>{gateway.headline}</p>
          <p className="mt-1 text-[9px] text-white/55">{gateway.hint}</p>
          <button
            type="button"
            onClick={() => gateway.retry()}
            className="mt-2 rounded border border-white/20 px-2 py-0.5 text-[9px] uppercase tracking-wide"
          >
            Yeniden dene
          </button>
        </div>
      ) : null}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-[40] flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md">
            <MapPin className="h-4 w-4 shrink-0 text-violet-300/90" aria-hidden />
            <span className="text-[11px] font-semibold tracking-wide text-white/90">Rhizoh · {productSurface}</span>
            <span
              className={`ml-1 h-2 w-2 shrink-0 rounded-full ${
                gateway.phase === "connected"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : gateway.phase === "connecting" || gateway.phase === "reconnecting"
                    ? "bg-cyan-400 animate-pulse"
                    : "bg-amber-400"
              }`}
              title={gateway.headline}
              aria-hidden
            />
          </div>
          {worldExecutionMode !== "ACTIVE" ? (
            <p className="rounded-lg border border-amber-500/25 bg-amber-950/40 px-2 py-1 text-[9px] text-amber-100/80">
              Atmosfer + mesh için <code className="text-amber-200">VITE_WORLD_EXECUTION_MODE=active</code>
            </p>
          ) : null}
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
          <ChromeToggle
            active={prefs.haloOpen}
            label="Halka"
            onClick={() => persistPrefs({ haloOpen: !prefs.haloOpen })}
            icon={Orbit}
          />
          <ChromeToggle
            active={prefs.soundEnabled}
            label={prefs.soundEnabled ? "Ses" : "Ses"}
            onClick={handleSoundToggle}
            icon={prefs.soundEnabled ? Volume2 : VolumeX}
          />
          <ChromeToggle
            active={prefs.copyPanelOpen}
            label="Metin"
            onClick={() => persistPrefs({ copyPanelOpen: !prefs.copyPanelOpen })}
            icon={PanelLeft}
          />
          <ChromeToggle
            active={prefs.flightHudOpen}
            label="HUD"
            onClick={() => persistPrefs({ flightHudOpen: !prefs.flightHudOpen })}
            icon={Radio}
          />
          <ChromeToggle
            active={prefs.gatewayDetailOpen}
            label="Bağlantı"
            onClick={() => persistPrefs({ gatewayDetailOpen: !prefs.gatewayDetailOpen })}
            icon={Eye}
          />
        </div>
      </header>

      {prefs.gatewayDetailOpen ? (
        <div className="pointer-events-auto absolute left-3 right-3 top-[4.5rem] z-[38] max-w-md">
          <RhizohGatewayBanner
            model={gateway}
            onRetry={gateway.retry}
            hasHttpOrigin={hasHttpOrigin}
            className="backdrop-blur-md"
          />
        </div>
      ) : null}

      {prefs.flightHudOpen && mapSurfaceActive ? (
        <div className="pointer-events-auto absolute bottom-[5.5rem] left-3 z-[38] w-[min(100%,22rem)] max-h-[34vh] overflow-y-auto">
          <CastleFlightHud />
        </div>
      ) : null}

      {prefs.copyPanelOpen ? (
        <aside
          className="pointer-events-auto absolute bottom-[3.5rem] right-0 top-16 z-[36] w-[min(100%,24rem)] overflow-y-auto border-l border-white/10 bg-[#0a0612]/92 px-3 py-4 backdrop-blur-lg"
          aria-label="Açıklayıcı metin paneli"
        >
          <div className="mb-3 space-y-2">
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/45">Metin katmanları</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(SECTION_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSection(key)}
                  className={`rounded-full border px-2 py-0.5 text-[8px] uppercase tracking-wide transition ${
                    prefs.sections[key]
                      ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                      : "border-white/15 text-white/40 hover:border-white/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <RhizohLivingWorldEntryShell
            model={entryModel}
            onObserve={onObserve}
            onEnterCastle={onEnterCastle}
            copyVisibility={copyVisibility}
            overlayMode
          />
        </aside>
      ) : null}

      {prefs.haloOpen ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[3.5rem] z-[57] flex justify-center px-2">
          <RhizohCapabilityHaloV1
            className="pointer-events-auto max-w-[min(100%,420px)] scale-[0.88] sm:scale-100"
            collectivePulse={collectivePulse}
            onOpenHref={onHaloOpenHref}
            onOpenRealMap={onHaloOpenRealMap}
            onFocusLayer={() => {}}
            onSeedIntent={(intent) => {
              if (typeof window !== "undefined") {
                window.__rhizoh = window.__rhizoh || {};
                window.__rhizoh.haloSeedIntent = String(intent || "");
              }
            }}
          />
        </div>
      ) : null}

      <RhizohProductSurfaceDrawerV0
        surface={productSurface}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        auth={castleAuth}
        gatewayOrigin={gatewayOrigin}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-[3.5rem] z-[56] flex justify-center px-3">
        <RhizohConversationDockV0
          firebaseUser={castleAuth?.user}
          className="pointer-events-auto w-full max-w-lg"
        />
      </div>

      <UnifiedProductShellBar active={productSurface} onSelect={onProductShellSelect} />
    </div>
  );
});

/** @param {{ active: boolean, label: string, onClick: () => void, icon: React.ComponentType<{ className?: string }> }} props */
function ChromeToggle({ active, label, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[9px] font-medium uppercase tracking-wide backdrop-blur-md transition ${
        active
          ? "border-cyan-400/45 bg-cyan-950/50 text-cyan-100"
          : "border-white/15 bg-black/55 text-white/55 hover:border-white/30 hover:text-white/80"
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
