/**
 * Studio export policy — deny-by-default; mock packs require explicit consent.
 */

import { STUDIO_ASSET_MANIFEST_V1 } from "../../studio/assetRegistryV1.js";
import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";
import { evaluateControlPlaneHealthV0 } from "./rhizohControlPlaneV0.js";
import { exportFer1VaultForCloudV0, isFer1VaultSealedV0 } from "./fer1MemoryVaultV0.js";

export const RHIZOH_STUDIO_EXPORT_POLICY_SCHEMA_V0 = "rhizoh.studio_export_policy.v0";

/** Fail-safe: no pack path without gated consent (even mock). */
export const STUDIO_EXPORT_FAIL_SAFE_DENY_BY_DEFAULT_V0 = true;

const PACK_BUILD_GATE_TOKEN_V0 = Symbol("rhizoh.studio_export_pack.gate.v0");

export const STUDIO_EXPORT_MODE_V0 = Object.freeze({
  MANUAL_ONLY: "manual_only",
  BLOCKED_DEGRADED: "blocked_degraded",
  BLOCKED_NO_CONSENT: "blocked_no_consent",
  BLOCKED_POLICY: "blocked_policy",
  BLOCKED_FAIL_SAFE: "blocked_fail_safe",
  BLOCKED_FER1_CONSENT: "blocked_fer1_consent",
  BLOCKED_VAULT_UNSEALED: "blocked_vault_unsealed"
});

/**
 * @param {{ userConsent?: boolean, tensorOk?: boolean }} [opts]
 */
export function evaluateStudioExportAllowedV0(opts = {}) {
  if (STUDIO_EXPORT_FAIL_SAFE_DENY_BY_DEFAULT_V0 && opts.userConsent !== true) {
    return Object.freeze({
      allowed: false,
      mode: STUDIO_EXPORT_MODE_V0.BLOCKED_NO_CONSENT,
      reason: "user_consent_required",
      health: null
    });
  }

  const health = evaluateControlPlaneHealthV0(RHIZOH_DOMAIN_ID_V0.STUDIO, opts);
  const exportDisabled = health?.downgrade?.exportDisabled === true;

  if (exportDisabled) {
    return Object.freeze({
      allowed: false,
      mode: STUDIO_EXPORT_MODE_V0.BLOCKED_DEGRADED,
      reason: "studio_export_disabled",
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
 * Internal-only pack builder — returns null without gate token.
 * @param {{ gatewayOrigin?: string, locale?: string }} [opts]
 * @param {symbol | null | undefined} gateToken
 */
export function buildStudioOutputPackManifestV0(opts = {}, gateToken = null) {
  if (STUDIO_EXPORT_FAIL_SAFE_DENY_BY_DEFAULT_V0 && gateToken !== PACK_BUILD_GATE_TOKEN_V0) {
    return null;
  }

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
 * UI-safe export summary — never includes pack payload.
 */
export function describeStudioExportPolicyV0(opts = {}) {
  const gate = evaluateStudioExportAllowedV0(opts);
  return Object.freeze({
    allowed: gate.allowed,
    mode: gate.mode,
    reason: gate.reason,
    persistence: "memory_only",
    assetCount: STUDIO_ASSET_MANIFEST_V1.length
  });
}

/**
 * FER-1 sealed envelope merge — ciphertext ref only, no plaintext.
 * @param {object | null} pack
 * @param {{ fer1Consent?: boolean }} [opts]
 */
export function mergeFer1VaultIntoStudioExportPackV0(pack, opts = {}) {
  if (!pack) {
    return Object.freeze({ ok: false, reason: "no_pack", pack: null });
  }
  if (STUDIO_EXPORT_FAIL_SAFE_DENY_BY_DEFAULT_V0 && opts.fer1Consent !== true) {
    return Object.freeze({
      ok: false,
      reason: "fer1_consent_required",
      mode: STUDIO_EXPORT_MODE_V0.BLOCKED_FER1_CONSENT,
      pack: null
    });
  }
  if (!isFer1VaultSealedV0()) {
    return Object.freeze({
      ok: false,
      reason: "vault_not_sealed",
      mode: STUDIO_EXPORT_MODE_V0.BLOCKED_VAULT_UNSEALED,
      pack
    });
  }
  const fer1EncryptedRef = exportFer1VaultForCloudV0();
  if (!fer1EncryptedRef) {
    return Object.freeze({ ok: false, reason: "no_sealed_envelope", pack });
  }
  return Object.freeze({
    ok: true,
    pack: Object.freeze({
      ...pack,
      fer1VaultMerge: true,
      fer1EncryptedRef
    })
  });
}

/**
 * Mock export request — deny-by-default; pack only when gate passes.
 * @param {{ userConsent?: boolean, fer1Consent?: boolean, gatewayOrigin?: string, locale?: string, tensorOk?: boolean }} [opts]
 */
export function requestStudioExportPackV0(opts = {}) {
  const gate = evaluateStudioExportAllowedV0(opts);
  if (!gate.allowed) {
    return Object.freeze({
      ok: false,
      mode: gate.mode,
      reason: gate.reason,
      pack: null
    });
  }

  const pack = buildStudioOutputPackManifestV0(opts, PACK_BUILD_GATE_TOKEN_V0);
  if (!pack) {
    return Object.freeze({
      ok: false,
      mode: STUDIO_EXPORT_MODE_V0.BLOCKED_FAIL_SAFE,
      reason: "fail_safe_denied",
      pack: null
    });
  }

  if (opts.fer1Consent === true) {
    const merged = mergeFer1VaultIntoStudioExportPackV0(pack, opts);
    if (!merged.ok) {
      return Object.freeze({
        ok: false,
        mode: merged.mode || STUDIO_EXPORT_MODE_V0.BLOCKED_FER1_CONSENT,
        reason: merged.reason,
        pack: null
      });
    }
    return Object.freeze({
      ok: true,
      mode: gate.mode,
      pack: merged.pack
    });
  }

  return Object.freeze({
    ok: true,
    mode: gate.mode,
    pack
  });
}
