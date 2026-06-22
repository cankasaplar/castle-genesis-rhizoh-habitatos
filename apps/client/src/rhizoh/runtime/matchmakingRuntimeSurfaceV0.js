/**
 * Matchmaking runtime surface v0 — API ≠ engine contract boundary.
 * runtimeSurface.matchmaking = frozen engine projection (dispatch + snapshot APIs).
 * window.__rhizoh.matchmaking = frozen read-only facade delegating to engine.
 * @see docs/RHIZOH_MATCHMAKING_CORE_SPEC_V1.md
 */

import { getMatchRealityStatusV0 } from "./matchSessionSyncBridgeV0.js";

export const MATCHMAKING_TRUTH_MODEL_V0 = "event_sourced_reducer_v0";

export const MATCHMAKING_RUNTIME_SURFACE_SCHEMA_V0 =
  "castle.rhizoh.matchmaking_runtime_surface.v0";

export const MATCHMAKING_API_FACADE_SCHEMA_V0 = "castle.rhizoh.matchmaking_api_facade.v0";
export const MATCHMAKING_SINGLE_REALITY_SOURCE_V0 = "truth_log_v0";

/** @type {Record<string, unknown> | null} */
let engineMountBagV0 = null;

/**
 * Begin mutable mount bag — sub-modules write here during console mount only.
 */
export function beginMatchmakingEngineMountV0() {
  engineMountBagV0 = {
    schema: MATCHMAKING_RUNTIME_SURFACE_SCHEMA_V0,
    shadowRehearsal: true,
    interpretationOnly: true
  };
  return engineMountBagV0;
}

export function clearMatchmakingEngineMountBagV0() {
  engineMountBagV0 = null;
}

/**
 * Published engine must be frozen with truth reducer armed (single event stream).
 */
export function isMatchmakingEngineSurfaceSealedV0() {
  const engine = getMatchmakingEngineSurfaceV0();
  return (
    engine != null &&
    Object.isFrozen(engine) &&
    engine.truthModel === MATCHMAKING_TRUTH_MODEL_V0 &&
    typeof engine.truthKernel?.dispatch === "function"
  );
}

/**
 * During mount only: mutable bag. After publish: frozen engine on runtimeSurface.
 * @returns {Record<string, unknown> | null}
 */
export function ensureMatchmakingEngineSurfaceV0() {
  if (engineMountBagV0) return engineMountBagV0;
  return getMatchmakingEngineSurfaceV0();
}

/**
 * Freeze engine projection on runtimeSurface after sub-module mount.
 * @param {Record<string, unknown>} engineBag
 * @param {Record<string, unknown>} truthKernel
 */
export function publishMatchmakingEngineSurfaceV0(engineBag, truthKernel) {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.runtimeSurface = window.__rhizoh.runtimeSurface || {};
  window.__rhizoh.runtimeSurface.matchmaking = Object.freeze({
    ...engineBag,
    truthKernel,
    truthModel: MATCHMAKING_TRUTH_MODEL_V0,
    executionModel: MATCHMAKING_TRUTH_MODEL_V0,
    singleRealitySource: MATCHMAKING_SINGLE_REALITY_SOURCE_V0,
    realityModel: "single_event_stream",
    interpretationOnly: true,
    shadowRehearsal: true
  });
  engineMountBagV0 = null;
  return window.__rhizoh.runtimeSurface.matchmaking;
}

/**
 * @returns {Record<string, unknown> | null}
 */
export function getMatchmakingEngineSurfaceV0() {
  if (typeof window === "undefined") return null;
  return window.__rhizoh?.runtimeSurface?.matchmaking ?? null;
}

/**
 * Frozen read-only facade — delegates to engine; safe to publish on window.
 * @param {Record<string, unknown>} engine
 * @param {{ consoleSchema?: string }} [meta]
 */
export function buildMatchmakingApiFacadeV0(engine, meta = {}) {
  const e = engine || {};
  return Object.freeze({
    schema: meta.consoleSchema || MATCHMAKING_API_FACADE_SCHEMA_V0,
    contractBoundary: "api_facade_v0",
    shadowRehearsal: true,
    serverAuthoritative: false,
    authorityMode: "SERVER_PRIMARY",
    interpretationOnly: true,
    mounted: true,
    emitBeacon: (input) => e.emitBeacon?.(input),
    tryMatch: (opts) => e.tryMatch?.(opts),
    scorePair: (a, b) => e.scorePair?.(a, b),
    registry: e.registry ?? null,
    session: e.session ?? null,
    codex: e.codex ?? null,
    kernel: e.kernel ?? null,
    validator: e.validator ?? null,
    truthKernel: e.truthKernel ?? null,
    truthModel: e.truthModel ?? null,
    executionModel: e.executionModel ?? null,
    singleRealitySource: e.singleRealitySource ?? MATCHMAKING_SINGLE_REALITY_SOURCE_V0,
    realityModel: e.realityModel ?? "single_event_stream",
    authority: Object.freeze({
      status: () => e.authority?.status?.() ?? null,
      proposeMove: (move) => e.authority?.proposeMove?.(move),
      commit: (commit) => e.authority?.commit?.(commit),
      reconcile: (opts) => e.authority?.reconcile?.(opts),
      snapshot: () => e.truthKernel?.authority?.() ?? null
    }),
    truthStatus: () => e.truthKernel?.productionStatus?.() ?? null,
    realityStatus: () => getMatchRealityStatusV0(),
    verifyProduction: (opts) => e.truthKernel?.verifyProduction?.(opts) ?? null,
    verifyAuthorityBoundary: (opts) => e.truthKernel?.verifyAuthorityBoundary?.(opts) ?? null,
    verifyDriftInjection: (opts) => e.truthKernel?.verifyDriftInjection?.(opts) ?? null,
    verifyBroadcastE2e: (opts) => e.truthKernel?.verifyBroadcastE2e?.(opts) ?? null
  });
}

/**
 * Publish frozen facade on window.__rhizoh.matchmaking (replaces prior facade safely).
 * @param {Record<string, unknown>} engine
 * @param {{ consoleSchema?: string }} [meta]
 */
export function publishMatchmakingApiFacadeV0(engine, meta = {}) {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchmaking = buildMatchmakingApiFacadeV0(engine, meta);
  return window.__rhizoh.matchmaking;
}

/** @internal vitest */
export function resetMatchmakingRuntimeSurfaceForTestV0() {
  engineMountBagV0 = null;
  if (typeof window === "undefined") return;
  if (window.__rhizoh?.runtimeSurface) {
    delete window.__rhizoh.runtimeSurface.matchmaking;
  }
  delete window.__rhizoh?.matchmaking;
  delete window.__rhizoh?.matchmakingConsole;
}
