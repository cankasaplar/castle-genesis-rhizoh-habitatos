/**
 * World domain routes — full-page navigation, no stacked drawer overlays.
 */

import { RHIZOH_WORLD_DRAWER_DOMAIN_V0 } from "./rhizohWorldDrawerDomainV0.js";

export const RHIZOH_WORLD_DOMAIN_PATH_V0 = Object.freeze({
  HUB: "/world",
  SPACE: "/world/space",
  SOCIAL: "/world/social",
  MODES: "/world/modes"
});

export const RHIZOH_T0_LIVE_PATH_V0 = "/";

/**
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function isRhizohWorldDomainPathV0(pathname = "") {
  const p = String(pathname || "").trim();
  return p === RHIZOH_WORLD_DOMAIN_PATH_V0.HUB || p.startsWith("/world/");
}

/**
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function isRhizohT0LivePathV0(pathname = "") {
  return !isRhizohWorldDomainPathV0(pathname);
}

/**
 * @param {string} [pathname]
 * @returns {"space" | "social" | "modes" | null}
 */
export function resolveWorldDomainFromPathV0(pathname = "") {
  const p = String(pathname || "").trim();
  if (p === RHIZOH_WORLD_DOMAIN_PATH_V0.SOCIAL || p.startsWith(`${RHIZOH_WORLD_DOMAIN_PATH_V0.SOCIAL}/`)) {
    return RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL;
  }
  if (p === RHIZOH_WORLD_DOMAIN_PATH_V0.MODES || p.startsWith(`${RHIZOH_WORLD_DOMAIN_PATH_V0.MODES}/`)) {
    return RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES;
  }
  if (
    p === RHIZOH_WORLD_DOMAIN_PATH_V0.HUB ||
    p === RHIZOH_WORLD_DOMAIN_PATH_V0.SPACE ||
    p.startsWith(`${RHIZOH_WORLD_DOMAIN_PATH_V0.SPACE}/`)
  ) {
    return RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE;
  }
  return null;
}

/**
 * @param {"space" | "social" | "modes"} domain
 * @returns {string}
 */
export function resolveWorldDomainPathV0(domain) {
  const d = String(domain || "").trim().toLowerCase();
  if (d === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL) return RHIZOH_WORLD_DOMAIN_PATH_V0.SOCIAL;
  if (d === RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES) return RHIZOH_WORLD_DOMAIN_PATH_V0.MODES;
  return RHIZOH_WORLD_DOMAIN_PATH_V0.SPACE;
}
