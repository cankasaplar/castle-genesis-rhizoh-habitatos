/**
 * T0 drawer coordinator — product bottom drawer vs legacy right detail drawer (A3).
 * Product drawer wins; detail is mutually exclusive.
 * RESEARCH-ONLY — presentation orchestration only.
 */

import { closeProductSurfaceDrawerV0 } from "./rhizohDrawerStateMachineV0.js";

export const RHIZOH_T0_DRAWER_COORDINATOR_SCHEMA_V0 = "rhizoh.t0_drawer_coordinator.v0";

/**
 * @param {{
 *   detailRequested?: boolean,
 *   openSurfaceDrawerId?: string | null
 * }} [ctx]
 */
export function resolveT0DrawerCoordinatorStateV0(ctx = {}) {
  const openSurfaceDrawerId = ctx.openSurfaceDrawerId ? String(ctx.openSurfaceDrawerId) : null;
  const detailRequested = ctx.detailRequested === true;
  const productDrawerOpen = Boolean(openSurfaceDrawerId);
  return Object.freeze({
    schema: RHIZOH_T0_DRAWER_COORDINATOR_SCHEMA_V0,
    openSurfaceDrawerId,
    detailRequested,
    productDrawerOpen,
    detailDrawerVisible: detailRequested && !productDrawerOpen,
    activeDrawer: productDrawerOpen ? "product" : detailRequested ? "detail" : "none"
  });
}

/**
 * @param {{
 *   detailRequested?: boolean,
 *   openSurfaceDrawerId?: string | null
 * }} [ctx]
 */
export function planT0DetailDrawerToggleV0(ctx = {}) {
  const state = resolveT0DrawerCoordinatorStateV0(ctx);
  if (state.productDrawerOpen) {
    return Object.freeze({
      action: "close_product_then_open_detail",
      closeProductDrawer: true,
      nextDetailRequested: true
    });
  }
  return Object.freeze({
    action: "toggle_detail",
    closeProductDrawer: false,
    nextDetailRequested: !state.detailRequested
  });
}

/**
 * When a product drawer opens, detail must close.
 * @param {{ detailRequested?: boolean }} [ctx]
 * @param {{ nextOpenDrawerId?: string | null, toggled?: { open?: boolean } }} [transition]
 */
export function planT0ProductDrawerOpenV0(ctx = {}, transition = {}) {
  const opening = Boolean(
    transition.nextOpenDrawerId ||
      transition.toggled?.open ||
      (transition.toggled?.closed !== true && transition.nextOpenDrawerId !== null)
  );
  return Object.freeze({
    closeDetail: opening && ctx.detailRequested === true
  });
}

/**
 * Apply detail toggle plan — closes product drawer when required.
 * @param {ReturnType<typeof planT0DetailDrawerToggleV0>} plan
 */
export function applyT0DetailDrawerTogglePlanV0(plan) {
  if (plan.closeProductDrawer) {
    closeProductSurfaceDrawerV0();
  }
  return plan.nextDetailRequested;
}
