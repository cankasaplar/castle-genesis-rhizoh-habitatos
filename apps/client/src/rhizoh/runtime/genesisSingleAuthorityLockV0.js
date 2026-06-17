/**
 * Single Genesis Authority Lock v0 — one truth source for genesis ingress/runtime/SSE.
 * Prevents epistemic split-brain between rhizoh.com proxy and direct Render fallback.
 *
 * Default: PRIMARY only (same-origin gatewayProxy on product hosts).
 * Opt-in dual path: VITE_GENESIS_ALLOW_DIRECT_FALLBACK=1 (legacy / emergency only).
 */

import {
  resolveGenesisGatewayHttpBaseV0,
  resolveGenesisDirectGatewayOriginV0
} from "../../castleFlight/castleFlightConfig.js";

export const GENESIS_SINGLE_AUTHORITY_LOCK_SCHEMA_V0 = "castle.genesis.single_authority_lock.v0";

/** @returns {boolean} */
export function isGenesisDirectFallbackAllowedV0() {
  try {
    return String(import.meta.env?.VITE_GENESIS_ALLOW_DIRECT_FALLBACK || "").trim() === "1";
  } catch {
    return false;
  }
}

/**
 * Canonical genesis HTTP origin — proxy on rhizoh.com, env-configured elsewhere.
 * @returns {string}
 */
export function resolveGenesisSingleAuthorityOriginV0() {
  return String(resolveGenesisGatewayHttpBaseV0() || "")
    .trim()
    .replace(/\/+$/, "");
}

/**
 * Ordered genesis origins for fetch/SSE. Single authority by default.
 * @returns {string[]}
 */
export function listGenesisAuthorityOriginsV0() {
  const primary = resolveGenesisSingleAuthorityOriginV0();
  if (!primary) return [];

  const out = [primary];
  if (!isGenesisDirectFallbackAllowedV0()) return out;

  const direct = String(resolveGenesisDirectGatewayOriginV0() || "")
    .trim()
    .replace(/\/+$/, "");
  if (direct && direct !== primary) out.push(direct);
  return out;
}

/**
 * SSE stream base — locked to single authority unless direct fallback explicitly allowed.
 * @returns {string}
 */
export function resolveGenesisSseAuthorityBaseV0() {
  return resolveGenesisSingleAuthorityOriginV0();
}

/**
 * @returns {object}
 */
export function getGenesisSingleAuthorityLockSnapshotV0() {
  const primary = resolveGenesisSingleAuthorityOriginV0();
  const origins = listGenesisAuthorityOriginsV0();
  const snap = Object.freeze({
    schema: GENESIS_SINGLE_AUTHORITY_LOCK_SCHEMA_V0,
    atMs: Date.now(),
    influencesExecution: false,
    lockActive: !isGenesisDirectFallbackAllowedV0(),
    primaryOrigin: primary || null,
    originCount: origins.length,
    directFallbackAllowed: isGenesisDirectFallbackAllowedV0(),
    origins: Object.freeze(origins.slice())
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.genesisAuthorityLock = snap;
  }
  return snap;
}
