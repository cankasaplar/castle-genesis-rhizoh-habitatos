/**
 * Matchmaking runtime surface v0 — API ≠ engine contract boundary.
 * Engine lives on window.__rhizoh.runtimeSurface.matchmaking (mutable mount target).
 * window.__rhizoh.matchmaking is a frozen read-only facade delegating to engine.
 * @see docs/RHIZOH_MATCHMAKING_CORE_SPEC_V1.md
 */

export const MATCHMAKING_RUNTIME_SURFACE_SCHEMA_V0 =
  "castle.rhizoh.matchmaking_runtime_surface.v0";

export const MATCHMAKING_API_FACADE_SCHEMA_V0 = "castle.rhizoh.matchmaking_api_facade.v0";

/**
 * Mutable engine bag — sub-modules mount APIs here; never expose for reassignment on window.
 * @returns {Record<string, unknown> | null}
 */
export function ensureMatchmakingEngineSurfaceV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.runtimeSurface = window.__rhizoh.runtimeSurface || {};
  if (!window.__rhizoh.runtimeSurface.matchmaking) {
    window.__rhizoh.runtimeSurface.matchmaking = {
      schema: MATCHMAKING_RUNTIME_SURFACE_SCHEMA_V0,
      shadowRehearsal: true,
      interpretationOnly: true
    };
  }
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
    authority: e.authority ?? null,
    kernel: e.kernel ?? null,
    validator: e.validator ?? null
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
  if (typeof window === "undefined") return;
  if (window.__rhizoh?.runtimeSurface) {
    delete window.__rhizoh.runtimeSurface.matchmaking;
  }
  delete window.__rhizoh?.matchmaking;
  delete window.__rhizoh?.matchmakingConsole;
}
