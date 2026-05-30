/**
 * Product shell (UnifiedProductShellBar) — surface id persistence + live mesh gates.
 */

export const RHIZOH_PRODUCT_SURFACE_SCHEMA_V0 = "castle.rhizoh.product_surface.v0";

export const PRODUCT_SURFACE_IDS_V0 = Object.freeze([
  "world",
  "hall",
  "greenroom",
  "broadcast",
  "studio",
  "profile"
]);

const STORAGE_KEY_V0 = "rhizoh_product_surface_v0.1";

/** @typedef {(typeof PRODUCT_SURFACE_IDS_V0)[number]} ProductSurfaceIdV0 */

/** @returns {ProductSurfaceIdV0} */
export function readProductSurfaceV0() {
  if (typeof sessionStorage === "undefined") return "world";
  try {
    const raw = String(sessionStorage.getItem(STORAGE_KEY_V0) || "").trim();
    if (PRODUCT_SURFACE_IDS_V0.includes(/** @type {ProductSurfaceIdV0} */ (raw))) {
      return /** @type {ProductSurfaceIdV0} */ (raw);
    }
  } catch {
    /* noop */
  }
  return "world";
}

/** @param {ProductSurfaceIdV0} id */
export function writeProductSurfaceV0(id) {
  if (typeof sessionStorage === "undefined") return;
  if (!PRODUCT_SURFACE_IDS_V0.includes(id)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY_V0, id);
  } catch {
    /* noop */
  }
}

/** @param {string} surface */
export function shouldStartGreenRoomPresenceMeshV0(surface) {
  return surface === "hall" || surface === "greenroom" || surface === "broadcast";
}

/** @param {ProductSurfaceIdV0} surface */
export function productSurfaceOpensDrawerV0(surface) {
  return surface !== "world";
}

/** @param {ProductSurfaceIdV0} id @param {ProductSurfaceIdV0} current */
export function resolveProductShellSelectionV0(id, current) {
  if (id === "world" && current === "world") {
    return { surface: "world", toggleDrawer: false, closeDrawer: true };
  }
  if (id === current) {
    return { surface: id, toggleDrawer: true, closeDrawer: false };
  }
  return { surface: id, toggleDrawer: false, closeDrawer: false };
}

/** Test helper */
export function clearProductSurfaceForTestV0() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY_V0);
  } catch {
    /* noop */
  }
}
