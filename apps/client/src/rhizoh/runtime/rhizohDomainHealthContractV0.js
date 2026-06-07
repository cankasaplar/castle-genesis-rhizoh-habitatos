/**
 * Domain Health Contract — base gate · adapter · render checks (no tensor loop).
 * Extended health (propagation/isolation/fallback) lives in rhizohControlPlaneV0.js.
 */

import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";
import {
  DOMAIN_READ_ONLY_ZONES_V0,
  DOMAIN_RENDER_ISOLATION_ZONES_V0,
  DOMAIN_ZONE_REQUIRED_CAPABILITIES_V0
} from "./rhizohDomainCapabilitySpecV0.js";
import { resolveDomainAdapterV0 } from "./domainAdapterRegistryV0.js";

export const RHIZOH_DOMAIN_HEALTH_SCHEMA_V0 = "rhizoh.domain.health.v0";

/** @type {Map<string, ReturnType<typeof evaluateBaseDomainHealthV0>>} */
const baseHealthCache = new Map();

/**
 * Base health — no tensor bridge call (avoids circular dependency + cascade in probe).
 * @param {string} domain
 */
export function evaluateBaseDomainHealthV0(domain) {
  const d = String(domain || RHIZOH_DOMAIN_ID_V0.T0).trim();
  const reasons = [];

  const gate = Boolean(d);
  if (!gate) reasons.push("gate_missing_domain");

  const required = DOMAIN_ZONE_REQUIRED_CAPABILITIES_V0[d] || [];
  let adapterOk = true;
  for (const cap of required) {
    const row = resolveDomainAdapterV0(d, cap);
    if (row.id === "null") {
      adapterOk = false;
      reasons.push(`adapter_missing:${cap}`);
    }
  }

  const isolation = DOMAIN_RENDER_ISOLATION_ZONES_V0[d];
  let render = true;
  if (isolation?.readOnly && !DOMAIN_READ_ONLY_ZONES_V0.has(d)) {
    render = false;
    reasons.push("render_isolation_mismatch");
  }
  if (d === RHIZOH_DOMAIN_ID_V0.CASTLE || d === RHIZOH_DOMAIN_ID_V0.STUDIO || d === RHIZOH_DOMAIN_ID_V0.OBSERVER) {
    if (isolation && (isolation.mayTouchWorldRender || isolation.mayOverrideT0)) {
      render = false;
      reasons.push("render_isolation_violation");
    }
  }

  const result = Object.freeze({
    schema: RHIZOH_DOMAIN_HEALTH_SCHEMA_V0,
    domain: d,
    gate,
    adapter: adapterOk,
    tensor: true,
    render,
    reasons: Object.freeze([...reasons]),
    atMs: Date.now()
  });

  baseHealthCache.set(d, result);
  return result;
}

/**
 * @deprecated use evaluateControlPlaneHealthV0 from rhizohControlPlaneV0.js
 * @param {string} domain
 */
export function evaluateDomainHealthV0(domain) {
  return evaluateBaseDomainHealthV0(domain);
}

/**
 * @param {string} [domain]
 */
export function getDomainHealthSnapshotV0(domain) {
  if (!domain) {
    const last = [...baseHealthCache.values()].pop();
    return last ?? null;
  }
  return baseHealthCache.get(String(domain)) ?? null;
}

/** @internal vitest */
export function __resetDomainHealthForTestV0() {
  baseHealthCache.clear();
}
