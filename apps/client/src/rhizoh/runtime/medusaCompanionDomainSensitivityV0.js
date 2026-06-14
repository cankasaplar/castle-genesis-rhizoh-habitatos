/**
 * Medusa domain sensitivity v0 — motion profile per federation overlay node.
 */

import { RHIZOH_FEDERATION_NODE_V0 } from "./rhizohDomainGraphV0.js";

export const MEDUSA_DOMAIN_SENSITIVITY_SCHEMA_V0 = "rhizoh.medusa_domain_sensitivity.v0";

/** @type {Record<string, { swayScale: number, idleAmp: number, audioGain: number }>} */
export const MEDUSA_DOMAIN_MOTION_PROFILE_V0 = Object.freeze({
  [RHIZOH_FEDERATION_NODE_V0.WORLD]: Object.freeze({ swayScale: 0.35, idleAmp: 0.05, audioGain: 1 }),
  [RHIZOH_FEDERATION_NODE_V0.MEDIA]: Object.freeze({ swayScale: 0.92, idleAmp: 0.11, audioGain: 1.55 }),
  [RHIZOH_FEDERATION_NODE_V0.STUDIO]: Object.freeze({ swayScale: 0.4, idleAmp: 0.04, audioGain: 0.9 }),
  [RHIZOH_FEDERATION_NODE_V0.BROADCAST]: Object.freeze({ swayScale: 0.5, idleAmp: 0.05, audioGain: 1.1 }),
  [RHIZOH_FEDERATION_NODE_V0.CASTLE]: Object.freeze({ swayScale: 0.3, idleAmp: 0.045, audioGain: 0.85 }),
  [RHIZOH_FEDERATION_NODE_V0.OBSERVER]: Object.freeze({ swayScale: 0.2, idleAmp: 0.03, audioGain: 0.7 })
});

const DEFAULT_PROFILE_V0 = MEDUSA_DOMAIN_MOTION_PROFILE_V0[RHIZOH_FEDERATION_NODE_V0.MEDIA];

/**
 * @param {string | null | undefined} overlayNode
 */
export function resolveMedusaDomainMotionProfileV0(overlayNode) {
  const node = String(overlayNode || RHIZOH_FEDERATION_NODE_V0.MEDIA);
  return Object.freeze(
    MEDUSA_DOMAIN_MOTION_PROFILE_V0[node] || DEFAULT_PROFILE_V0
  );
}
