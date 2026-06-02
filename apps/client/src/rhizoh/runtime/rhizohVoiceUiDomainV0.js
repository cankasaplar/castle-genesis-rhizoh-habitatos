/**
 * L2 — Voice UI domain (mount partition). Single resolver for t0 / spatial / ingress.
 * @see docs/RHIZOH_CASTLE_LAYERS_EVOLUTION_PIPELINE_V1.md
 */

import { isRhizohSpatialProductShellEnabled } from "./castleWorldLayerGateV0.js";

export const VOICE_UI_DOMAIN_V0 = Object.freeze({
  T0_SHELL: "t0_shell",
  SPATIAL_SHELL: "spatial_shell",
  INGRESS: "ingress",
  RUNTIME_ONLY: "runtime_only"
});

/** @returns {typeof VOICE_UI_DOMAIN_V0[keyof typeof VOICE_UI_DOMAIN_V0]} */
export function resolveRhizohVoiceUiDomainV0() {
  if (typeof window === "undefined") return VOICE_UI_DOMAIN_V0.RUNTIME_ONLY;
  if (isRhizohSpatialProductShellEnabled()) return VOICE_UI_DOMAIN_V0.SPATIAL_SHELL;
  const route = String(window.__rhizoh_boot_context?.route || window.__rhizoh_ingress_route || "").trim();
  if (route === "legal_preamble" || route === "language" || route === "cohort") {
    return VOICE_UI_DOMAIN_V0.INGRESS;
  }
  return VOICE_UI_DOMAIN_V0.T0_SHELL;
}

/**
 * @param {string} eventDomain
 * @param {string} [activeDomain]
 */
export function isVoiceUiDomainScopeMatchV0(eventDomain, activeDomain = resolveRhizohVoiceUiDomainV0()) {
  const ev = String(eventDomain || "").trim();
  const active = String(activeDomain || "").trim();
  if (!ev || ev === VOICE_UI_DOMAIN_V0.RUNTIME_ONLY) return true;
  if (ev === "global") return true;
  return ev === active;
}
