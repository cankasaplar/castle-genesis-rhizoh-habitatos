/**
 * Matchmaking console mount — single entry for shadow rehearsal DevTools.
 * Mounted from core subsystem boot (chess spine) so legal ingress routes have API access.
 * Contract: window.__rhizoh.matchmaking = frozen facade · runtimeSurface.matchmaking = engine.
 * interpretationOnly: true — shadow rehearsal; no server authority until data-plane READY.
 * @see docs/RHIZOH_MATCHMAKING_CORE_SPEC_V1.md
 */

import { mountMatchmakingBeaconRegistryConsoleV0 } from "./matchmakingBeaconRegistryV0.js";
import { mountMatchmakingEngineConsoleV0 } from "./matchmakingEngineV0.js";
import { mountMatchSessionLifecycleConsoleV0 } from "./matchSessionLifecycleV0.js";
import { mountMatchmakingCodexBridgeConsoleV0 } from "./matchmakingCodexBridgeV0.js";
import { mountMatchAuthorityConsoleV0 } from "./matchAuthorityLayerV0.js";
import { mountMatchAuthorityKernelConsoleV0 } from "./matchAuthorityKernelV0.js";
import { mountMatchStockfishValidatorConsoleV0 } from "./matchStockfishValidatorBridgeV0.js";
import {
  beginMatchmakingEngineMountV0,
  publishMatchmakingApiFacadeV0,
  publishMatchmakingEngineSurfaceV0,
  getMatchmakingEngineSurfaceV0
} from "./matchmakingRuntimeSurfaceV0.js";
import { mountMatchmakingTruthKernelConsoleV0 } from "./matchmakingTruthKernelV0.js";

export const MATCHMAKING_CONSOLE_SCHEMA_V0 = "castle.rhizoh.matchmaking_console.v0";

let mountedV0 = false;

export function isMatchmakingConsoleMountedV0() {
  if (typeof window === "undefined") return false;
  return typeof window.__rhizoh?.matchmaking?.emitBeacon === "function";
}

function buildMatchmakingConsoleSnapV0() {
  return Object.freeze({
    schema: MATCHMAKING_CONSOLE_SCHEMA_V0,
    ok: true,
    mounted: true,
    shadowRehearsal: true,
    hasEmitBeacon: typeof window.__rhizoh.matchmaking.emitBeacon === "function",
    hasTryMatch: typeof window.__rhizoh.matchmaking.tryMatch === "function",
    hasSession: typeof window.__rhizoh.matchmaking.session?.get === "function",
    hasAuthority: typeof window.__rhizoh.matchmaking.authority?.status === "function",
    hasKernel: typeof window.__rhizoh.matchmaking.kernel?.proposeMove === "function",
    hasTruthKernel: typeof window.__rhizoh.matchmaking.truthKernel?.dispatch === "function",
    truthModel: window.__rhizoh.matchmaking.truthModel ?? null
  });
}

/**
 * Idempotent — safe to call from core boot and nervous system.
 * Engine mounts to runtimeSurface; window API is a frozen facade rebuilt each pass.
 */
export function mountMatchmakingConsoleV0() {
  if (typeof window === "undefined") {
    return Object.freeze({ ok: false, reason: "no_window" });
  }

  window.__rhizoh = window.__rhizoh || {};
  const engineBag = beginMatchmakingEngineMountV0();

  if (
    isMatchmakingConsoleMountedV0() &&
    window.__rhizoh.matchmaking.schema === MATCHMAKING_CONSOLE_SCHEMA_V0 &&
    window.__rhizoh.matchmaking.mounted === true
  ) {
    const existing = getMatchmakingEngineSurfaceV0();
    if (existing) {
      publishMatchmakingApiFacadeV0(existing, { consoleSchema: MATCHMAKING_CONSOLE_SCHEMA_V0 });
    }
    const snap = buildMatchmakingConsoleSnapV0();
    window.__rhizoh.matchmakingConsole = snap;
    return snap;
  }

  mountMatchmakingBeaconRegistryConsoleV0();
  mountMatchmakingEngineConsoleV0();
  mountMatchSessionLifecycleConsoleV0();
  mountMatchmakingCodexBridgeConsoleV0();
  mountMatchAuthorityConsoleV0();
  mountMatchAuthorityKernelConsoleV0();
  mountMatchStockfishValidatorConsoleV0();

  const truthKernel = mountMatchmakingTruthKernelConsoleV0();
  const engine = publishMatchmakingEngineSurfaceV0(engineBag, truthKernel);
  publishMatchmakingApiFacadeV0(engine, { consoleSchema: MATCHMAKING_CONSOLE_SCHEMA_V0 });

  const snap = buildMatchmakingConsoleSnapV0();

  if (!mountedV0) {
    mountedV0 = true;
    window.__CASTLE_BOOT_LOG__?.ok?.("boot.matchmaking_console", "shadow rehearsal armed");
  }

  window.__rhizoh.matchmakingConsole = snap;
  return snap;
}
