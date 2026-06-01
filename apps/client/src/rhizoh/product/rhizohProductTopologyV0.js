/**
 * Rhizoh product shell ↔ URL topology (refresh-safe routes).
 * @see castleRuntimeShellModelV0.js deriveShellHighlightId
 */

/** @typedef {'world'|'hall'|'greenroom'|'broadcast'|'studio'|'profile'} RhizohProductSurfaceIdV0 */

import { RHIZOH_PRODUCT_SURFACE_COPY_TR_V0 } from "../runtime/rhizohProductCopyV0.js";

export const RHIZOH_PRODUCT_TOPOLOGY_V0 = Object.freeze({
  world: Object.freeze({
    path: "/",
    labelTr: RHIZOH_PRODUCT_SURFACE_COPY_TR_V0.world.shell
  }),
  hall: Object.freeze({
    path: "/hall/main",
    labelTr: RHIZOH_PRODUCT_SURFACE_COPY_TR_V0.hall.shell
  }),
  greenroom: Object.freeze({
    path: "/greenroom/main",
    labelTr: RHIZOH_PRODUCT_SURFACE_COPY_TR_V0.greenroom.shell
  }),
  broadcast: Object.freeze({
    path: "/broadcast/main",
    labelTr: RHIZOH_PRODUCT_SURFACE_COPY_TR_V0.broadcast.shell
  }),
  studio: Object.freeze({
    path: "/studio",
    labelTr: RHIZOH_PRODUCT_SURFACE_COPY_TR_V0.studio.shell
  }),
  profile: Object.freeze({
    path: "/settings",
    labelTr: RHIZOH_PRODUCT_SURFACE_COPY_TR_V0.profile.shell
  })
});

/**
 * @param {string} surfaceId
 * @returns {string}
 */
export function resolveRhizohProductPathV0(surfaceId) {
  const id = String(surfaceId || "").trim();
  const row = RHIZOH_PRODUCT_TOPOLOGY_V0[/** @type {RhizohProductSurfaceIdV0} */ (id)];
  return row?.path ?? "/";
}

/**
 * @param {string} surfaceId
 * @param {(path: string) => void} navigate
 * @param {string} [currentPathname]
 */
export function navigateRhizohProductSurfaceV0(surfaceId, navigate, currentPathname = "") {
  const path = resolveRhizohProductPathV0(surfaceId);
  if (typeof navigate !== "function") return path;
  const cur = String(currentPathname || "");
  if (cur !== path) navigate(path);
  return path;
}
