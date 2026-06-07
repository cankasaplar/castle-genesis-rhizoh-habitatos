/**
 * Domain downgrade policy — fail → isolate + downgrade mode (not silent-only).
 */

import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";

export const RHIZOH_DOWNGRADE_MODE_V0 = Object.freeze({
  NORMAL: "normal",
  DEGRADED: "degraded",
  ISOLATED: "isolated"
});

/** Per-domain capability flags when degraded. */
export const DOMAIN_DOWNGRADE_POLICY_V0 = Object.freeze({
  [RHIZOH_DOMAIN_ID_V0.CASTLE]: Object.freeze({
    voiceEnabled: false,
    chatSafeMode: true,
    presenceReadOnly: true,
    sessionWrite: false
  }),
  [RHIZOH_DOMAIN_ID_V0.WORLD]: Object.freeze({
    cesiumFreeze: true,
    mapCachedOnly: true,
    liveApi: false,
    spatialCommands: false
  }),
  [RHIZOH_DOMAIN_ID_V0.STUDIO]: Object.freeze({
    editorReadOnly: true,
    exportDisabled: true,
    aiGeneration: false
  }),
  [RHIZOH_DOMAIN_ID_V0.OBSERVER]: Object.freeze({
    readOnly: true,
    mutateBlocked: true
  }),
  [RHIZOH_DOMAIN_ID_V0.T0]: Object.freeze({
    voiceOptional: true,
    chatSafeMode: false
  })
});

/** Normal-mode defaults (all capabilities on where applicable). */
export const DOMAIN_NORMAL_POLICY_V0 = Object.freeze({
  [RHIZOH_DOMAIN_ID_V0.CASTLE]: Object.freeze({
    voiceEnabled: true,
    chatSafeMode: false,
    presenceReadOnly: false,
    sessionWrite: true
  }),
  [RHIZOH_DOMAIN_ID_V0.WORLD]: Object.freeze({
    cesiumFreeze: false,
    mapCachedOnly: false,
    liveApi: true,
    spatialCommands: true
  }),
  [RHIZOH_DOMAIN_ID_V0.STUDIO]: Object.freeze({
    editorReadOnly: false,
    exportDisabled: false,
    aiGeneration: true
  }),
  [RHIZOH_DOMAIN_ID_V0.OBSERVER]: Object.freeze({
    readOnly: true,
    mutateBlocked: true
  }),
  [RHIZOH_DOMAIN_ID_V0.T0]: Object.freeze({
    voiceOptional: true,
    chatSafeMode: false
  })
});

/**
 * @param {string} domain
 * @param {boolean} degraded
 * @returns {object}
 */
export function resolveDomainDowngradePolicyV0(domain, degraded = false) {
  const d = String(domain || RHIZOH_DOMAIN_ID_V0.T0).trim();
  const base = degraded
    ? DOMAIN_DOWNGRADE_POLICY_V0[d] || {}
    : DOMAIN_NORMAL_POLICY_V0[d] || {};
  return Object.freeze({ ...base, mode: degraded ? RHIZOH_DOWNGRADE_MODE_V0.DEGRADED : RHIZOH_DOWNGRADE_MODE_V0.NORMAL });
}
