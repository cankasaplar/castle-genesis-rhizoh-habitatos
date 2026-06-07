/**
 * Domain-aware gate — router + permission + context initializer.
 * Gate selects domain; wheel controls within that domain only.
 */

import {
  RHIZOH_DOMAIN_ID_V0,
  syncRhizohDomainCoreStoreV0,
  getRhizohDomainCoreSnapshotV0,
  passDomainStateV0
} from "./rhizohDomainCoreStoreV0.js";
import { bootstrapDomainAdaptersV0 } from "./domainAdapterRegistryV0.js";
import { runTensorBridgeInitV0 } from "./rhizohTensorBridgeV0.js";
import { runControlPlaneForDomainV0 } from "./rhizohControlPlaneV0.js";
import { resolveWorldDomainFromPathV0, isRhizohWorldDomainPathV0 } from "./rhizohWorldDomainRoutesV0.js";
import { traceDomainTransitionV0 } from "./rhizohTruthTraceLayerV0.js";
import { recordDomainTransitionTemporalV0 } from "./rhizohSpatialTemporalTrailV0.js";

export { RHIZOH_DOMAIN_ID_V0 };

/** Exact observer routes (profile / settings surfaces on AppRhizoh528). */
const OBSERVER_EXACT_PATHS_V0 = Object.freeze(["/settings", "/observer/settings", "/academy"]);

/** Longest-prefix-first — avoids `/academy` swallowing `/academy/research`. */
const OBSERVER_PATH_PREFIXES_V0 = [
  "/academy/research",
  "/academy/observe",
  "/genesis/observe",
  "/genesis/hub",
  "/observer/settings",
  "/continuity"
];

/**
 * Resolve domain id from pathname.
 * @param {string} [pathname]
 * @returns {string}
 */
export function resolveDomainIdFromPathV0(pathname = "") {
  const p = String(pathname || "").trim();

  if (OBSERVER_EXACT_PATHS_V0.includes(p)) {
    return RHIZOH_DOMAIN_ID_V0.OBSERVER;
  }

  if (OBSERVER_PATH_PREFIXES_V0.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) {
    return RHIZOH_DOMAIN_ID_V0.OBSERVER;
  }

  if (isRhizohWorldDomainPathV0(p) || p === "/map") {
    return RHIZOH_DOMAIN_ID_V0.WORLD;
  }

  if (p.startsWith("/studio") || p === "/spiral" || p.startsWith("/studio-live")) {
    return RHIZOH_DOMAIN_ID_V0.STUDIO;
  }

  if (
    p.startsWith("/hall") ||
    p.startsWith("/greenroom") ||
    p.startsWith("/broadcast")
  ) {
    return RHIZOH_DOMAIN_ID_V0.CASTLE;
  }

  if (p.startsWith("/robotics")) {
    return RHIZOH_DOMAIN_ID_V0.ROBOTICS;
  }

  return RHIZOH_DOMAIN_ID_V0.T0;
}

/**
 * Bootstrap isolated runtime for a domain — only this domain's adapters load.
 * @param {string} domainId
 * @param {{ pathname?: string, worldDomain?: string | null, userId?: string | null, fromDomain?: string, passPayload?: unknown }} [ctx]
 */
export function bootstrapRhizohDomainGateV0(domainId, ctx = {}) {
  const domain = String(domainId || RHIZOH_DOMAIN_ID_V0.T0).trim();
  const pathname = ctx.pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const prev = getRhizohDomainCoreSnapshotV0();

  if (ctx.fromDomain && ctx.passPayload !== undefined) {
    passDomainStateV0(ctx.fromDomain, domain, ctx.passPayload);
  }

  syncRhizohDomainCoreStoreV0({
    activeDomain: domain,
    pathname,
    worldDomain: ctx.worldDomain ?? resolveWorldDomainFromPathV0(pathname),
    userId: ctx.userId ?? prev.userId
  });

  bootstrapDomainAdaptersV0(domain);
  const tensor = runTensorBridgeInitV0(domain);
  const controlPlane = runControlPlaneForDomainV0(domain, { tensorResult: tensor });

  traceDomainTransitionV0({
    domain,
    prevDomain: prev.activeDomain,
    pathname,
    reason: ctx.fromDomain ? "explicit_pass" : "gate_bootstrap"
  });

  if (prev.activeDomain !== domain) {
    recordDomainTransitionTemporalV0({
      domain,
      prevDomain: prev.activeDomain,
      pathname,
      reason: ctx.fromDomain ? "explicit_pass" : "gate_bootstrap"
    });
  }

  return Object.freeze({
    domain,
    prevDomain: prev.activeDomain,
    layerMode: getRhizohDomainCoreSnapshotV0().layerMode,
    adaptersReady: getRhizohDomainCoreSnapshotV0().adaptersReady,
    tensor,
    health: controlPlane.health,
    controlPlane,
    safeUiMode: controlPlane.safeUiMode
  });
}

/**
 * @returns {{ domain: string, layerMode: string, adaptersReady: boolean }}
 */
export function getRhizohDomainGateSnapshotV0() {
  const core = getRhizohDomainCoreSnapshotV0();
  return Object.freeze({
    domain: core.activeDomain,
    layerMode: core.layerMode,
    adaptersReady: core.adaptersReady
  });
}
