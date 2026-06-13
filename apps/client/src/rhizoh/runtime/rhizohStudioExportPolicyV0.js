/**
 * Studio export policy — manual-only output packs; no silent export.
 * Mock pack builder until FER-1 vault merge (Sprint 38).
 */

import { STUDIO_ASSET_MANIFEST_V1 } from "../../studio/assetRegistryV1.js";
import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";
import { evaluateControlPlaneHealthV0 } from "./rhizohControlPlaneV0.js";

export const RHIZOH_STUDIO_EXPORT_POLICY_SCHEMA_V0 = "rhizoh.studio_export_policy.v0";

export const STUDIO_EXPORT_MODE_V0 = Object.freeze({
  MANUAL_ONLY: "manual_only",
  BLOCKED_DEGRADED: "blocked_degraded",
  BLOCKED_NO_CONSENT: "blocked_no_consent",
  BLOCKED_POLICY: "blocked_policy"
});

/**
 * @param {{ userConsent?: boolean, tensorOk?: boolean }} [opts]
 */
export function evaluateStudioExportAllowedV0(opts = {}) {
  const health = evaluateControlPlaneHealthV0(RHIZOH_DOMAIN_ID_V0.STUDIO, opts);
  const exportDisabled = health?.downgrade?.exportDisabled === true;
  const userConsent = opts.userConsent === true;

  if (exportDisabled) {
    return Object.freeze({
      allowed: false,
      mode: STUDIO_EXPORT_MODE_V0.BLOCKED_DEGRADED,
      reason: "studio_export_disabled",
      health
    });
  }

  if (!userConsent) {
    return Object.freeze({
      allowed: false,
      mode: STUDIO_EXPORT_MODE_V0.BLOCKED_NO_CONSENT,
      reason: "user_consent_required",
      health
    });
  }

  return Object.freeze({
    allowed: true,
    mode: STUDIO_EXPORT_MODE_V0.MANUAL_ONLY,
    reason: null,
    health
  });
}

/**
 * @param {{ gatewayOrigin?: string, locale?: string }} [opts]
 */
export function buildStudioOutputPackManifestV0(opts = {}) {
  const gatewayOrigin = String(opts.gatewayOrigin || "").trim();
  return Object.freeze({
    schema: "rhizoh.studio_output_pack.v0",
    createdAtMs: Date.now(),
    persistence: "memory_only",
    exportMode: STUDIO_EXPORT_MODE_V0.MANUAL_ONLY,
    assets: Object.freeze(STUDIO_ASSET_MANIFEST_V1.map((row) => Object.freeze({ ...row }))),
    licenseTags: Object.freeze([]),
    gatewayOrigin: gatewayOrigin || null,
    locale: opts.locale || "en",
    fer1VaultMerge: false
  });
}

/**
 * Mock export request — returns in-memory manifest only (no network).
 * @param {{ userConsent?: boolean, gatewayOrigin?: string, locale?: string }} [opts]
 */
export function requestStudioExportPackV0(opts = {}) {
  const gate = evaluateStudioExportAllowedV0(opts);
  if (!gate.allowed) {
    return Object.freeze({
      ok: false,
      mode: gate.mode,
      reason: gate.reason
    });
  }
  return Object.freeze({
    ok: true,
    mode: gate.mode,
    pack: buildStudioOutputPackManifestV0(opts)
  });
}
