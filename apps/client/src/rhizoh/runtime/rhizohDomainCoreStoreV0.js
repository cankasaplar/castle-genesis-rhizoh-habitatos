/**
 * Rhizoh domain core store — minimal shared memory across isolated domain runtimes.
 * Domain-private state must NOT live here; cross-domain data only via passDomainStateV0().
 */

import { resolveRhizohLayerModeV0 } from "./rhizohLayerContextV0.js";
import { resolveWorldDomainFromPathV0 } from "./rhizohWorldDomainRoutesV0.js";
import { readRhizohWorldSystemModeV0 } from "./rhizohWorldSystemModeV0.js";
import { traceDomainPassV0 } from "./rhizohTruthTraceLayerV0.js";

export const RHIZOH_DOMAIN_CORE_SCHEMA_V0 = "rhizoh.domain.core.v0";
export const RHIZOH_DOMAIN_CORE_EVENT_V0 = "rhizoh:domain-core-v0";

export const RHIZOH_DOMAIN_ID_V0 = Object.freeze({
  T0: "t0",
  WORLD: "world",
  CASTLE: "castle",
  STUDIO: "studio",
  ROBOTICS: "robotics",
  OBSERVER: "observer"
});

/** @type {{
 *   schema: string,
 *   sessionId: string | null,
 *   userId: string | null,
 *   activeDomain: string,
 *   pathname: string,
 *   worldDomain: "space" | "social" | "modes" | null,
 *   layerMode: string,
 *   adaptersReady: boolean,
 *   explicitPass: { from: string, to: string, payload: unknown, atMs: number } | null
 * }} */
let state = {
  schema: RHIZOH_DOMAIN_CORE_SCHEMA_V0,
  sessionId: null,
  userId: null,
  activeDomain: RHIZOH_DOMAIN_ID_V0.T0,
  pathname: "/",
  worldDomain: null,
  layerMode: "t0_live",
  adaptersReady: false,
  explicitPass: null
};

/** @type {Set<() => void>} */
const listeners = new Set();

function emit() {
  const snap = getRhizohDomainCoreSnapshotV0();
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.__RHIZOH_DOMAIN_CORE__ = snap;
    window.dispatchEvent(new CustomEvent(RHIZOH_DOMAIN_CORE_EVENT_V0, { detail: snap }));
  }
}

/**
 * @returns {typeof state}
 */
export function getRhizohDomainCoreSnapshotV0() {
  return Object.freeze({ ...state });
}

/**
 * @param {() => void} onChange
 * @returns {() => void}
 */
export function subscribeRhizohDomainCoreStoreV0(onChange) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/**
 * @param {Partial<typeof state>} partial
 */
export function syncRhizohDomainCoreStoreV0(partial = {}) {
  const pathname = partial.pathname ?? state.pathname;
  const worldDomain =
    partial.worldDomain !== undefined
      ? partial.worldDomain
      : resolveWorldDomainFromPathV0(pathname);
  const layerMode = resolveRhizohLayerModeV0({
    pathname,
    worldDomain,
    worldSystemMode: readRhizohWorldSystemModeV0()
  });

  state = {
    ...state,
    ...partial,
    pathname,
    worldDomain,
    layerMode
  };
  emit();
  return getRhizohDomainCoreSnapshotV0();
}

/**
 * Explicit cross-domain state handoff — the only sanctioned cross-talk path.
 * @param {string} fromDomain
 * @param {string} toDomain
 * @param {unknown} payload
 */
export function passDomainStateV0(fromDomain, toDomain, payload) {
  state = {
    ...state,
    explicitPass: Object.freeze({
      from: String(fromDomain || ""),
      to: String(toDomain || ""),
      payload,
      atMs: Date.now()
    })
  };
  traceDomainPassV0(fromDomain, toDomain, payload);
  emit();
  return getRhizohDomainCoreSnapshotV0();
}

/** @param {string | null | undefined} userId */
export function setRhizohDomainCoreUserV0(userId) {
  state = { ...state, userId: userId ? String(userId) : null };
  emit();
}

/** @param {boolean} ready */
export function setRhizohDomainAdaptersReadyV0(ready) {
  state = { ...state, adaptersReady: !!ready };
  emit();
}

/** @internal vitest */
export function __resetRhizohDomainCoreStoreForTestV0() {
  state = {
    schema: RHIZOH_DOMAIN_CORE_SCHEMA_V0,
    sessionId: null,
    userId: null,
    activeDomain: RHIZOH_DOMAIN_ID_V0.T0,
    pathname: "/",
    worldDomain: null,
    layerMode: "t0_live",
    adaptersReady: false,
    explicitPass: null
  };
  listeners.clear();
}
