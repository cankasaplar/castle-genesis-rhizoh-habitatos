/**
 * Minimal RealityDirector infra for spatial shell — REAL_MAP only, no Three.js ApexEngine.
 */

import {
  configureRealityDirector,
  notifyRealityEngineReady
} from "../../reality/realityDirector.js";

/** @type {{ realityMode: string, mapSurfaceActive: boolean, gatewayPhase: string } | null} */
let spatialState = null;

/** @type {(() => void) | null} */
let onSyncHook = null;

function createSpatialStubEngine() {
  return {
    internalRealityMode: "REAL_MAP",
    async prepareReality(mode) {
      this.internalRealityMode = mode;
    },
    commitReality(mode) {
      this.internalRealityMode = mode;
    },
    rollbackPartialRealMapPrepare() {}
  };
}

const stubEngine = createSpatialStubEngine();

/**
 * @param {{
 *   gatewayPhase: string,
 *   mapSurfaceActive: boolean,
 *   onSync?: () => void
 * }} input
 */
export function configureSpatialRealityInfraV0(input) {
  spatialState = {
    realityMode: "REAL_MAP",
    mapSurfaceActive: !!input.mapSurfaceActive,
    gatewayPhase: String(input.gatewayPhase || "unknown")
  };
  onSyncHook = typeof input.onSync === "function" ? input.onSync : null;

  configureRealityDirector({
    getEngine: () => stubEngine,
    getCoreWorld: () => ({ targetMode: "REAL_MAP" }),
    getGatewaySnapshot: () => ({ phase: spatialState?.gatewayPhase }),
    getState: () => ({
      realityMode: spatialState?.realityMode ?? "REAL_MAP",
      mapSurfaceActive: spatialState?.mapSurfaceActive ?? false
    }),
    dispatch: (action) => {
      if (!spatialState) return;
      const p = action?.payload;
      if (action?.type === "REALITY_ENGINE_SYNC" || action?.type === "REALITY_CHANGED") {
        if (typeof p?.mapSurfaceActive === "boolean") {
          spatialState.mapSurfaceActive = p.mapSurfaceActive;
        }
        if (p?.to) spatialState.realityMode = p.to;
        if (p?.gatewayPhase) spatialState.gatewayPhase = p.gatewayPhase;
        onSyncHook?.();
      }
    }
  });

  notifyRealityEngineReady();
}

export function clearSpatialRealityInfraV0() {
  spatialState = null;
  onSyncHook = null;
}
