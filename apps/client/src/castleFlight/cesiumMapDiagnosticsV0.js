/**
 * Prod-safe map visibility snapshot — DevTools: window.__RHIZOH_MAP_DIAG__()
 */

/**
 * @returns {object}
 */
export function snapshotRhizohMapDiagnosticsV0() {
  const cesium = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
  const exec =
    typeof window !== "undefined" ? window.__CASTLE_CESIUM_EXECUTOR__?.last : null;
  const host = typeof document !== "undefined"
    ? document.querySelector("[data-castle-cesium-host]")
    : null;
  const canvas = host?.querySelector("canvas") ?? null;

  const ui =
    typeof window !== "undefined" && window.__RHIZOH_UI_SNAP__
      ? window.__RHIZOH_UI_SNAP__
      : null;

  const hostRect = host?.getBoundingClientRect?.();
  const canvasRect = canvas?.getBoundingClientRect?.();

  return Object.freeze({
    schema: "castle.rhizoh.map_diagnostics.v0",
    atMs: Date.now(),
    ui: ui
      ? Object.freeze({
          realityMode: ui.realityMode ?? null,
          mapSurfaceActive: ui.mapSurfaceActive ?? null,
          productSurface: ui.productSurface ?? null,
          worldMapTool: ui.worldMapTool ?? null,
          showGlobeHomeOverlay: ui.showGlobeHomeOverlay ?? null
        })
      : null,
    cesium: Object.freeze({
      ready: cesium?.ready === true,
      commandReady: cesium?.commandReady === true,
      isFlying: cesium?.isFlying === true,
      vanillaRealMap: cesium?.vanillaRealMap === true,
      renderDegraded: cesium?.renderDegraded === true
    }),
    dom: Object.freeze({
      hostPresent: Boolean(host),
      hostDisplay: host ? getComputedStyle(host).display : null,
      hostOpacity: host ? getComputedStyle(host).opacity : null,
      hostZIndex: host ? getComputedStyle(host).zIndex : null,
      hostClientW: host?.clientWidth ?? 0,
      hostClientH: host?.clientHeight ?? 0,
      hostVisible: Boolean(hostRect && hostRect.width > 48 && hostRect.height > 48),
      canvasPresent: Boolean(canvas),
      canvasClientW: canvas?.clientWidth ?? 0,
      canvasClientH: canvas?.clientHeight ?? 0,
      canvasVisible: Boolean(canvasRect && canvasRect.width > 48 && canvasRect.height > 48)
    }),
    executorLast: exec
      ? Object.freeze({
          ok: exec.ok === true,
          op: exec.op ?? null,
          deferred: exec.deferred === true,
          skipped: exec.skipped === true,
          skipReason: exec.skipReason ?? null
        })
      : null
  });
}

export function installRhizohMapDiagnosticsV0() {
  if (typeof window === "undefined") return;
  window.__RHIZOH_MAP_DIAG__ = () => {
    const snap = snapshotRhizohMapDiagnosticsV0();
    console.info("[rhizoh:map-diag]", snap);
    return snap;
  };
}
