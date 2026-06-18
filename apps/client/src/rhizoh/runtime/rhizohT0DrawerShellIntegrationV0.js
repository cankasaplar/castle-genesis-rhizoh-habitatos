/**
 * T0 drawer shell integration — parity with AppRhizohWorldSpaceV0 state machine.
 * RESEARCH-ONLY — presentation orchestration only.
 */

import {
  bootDrawerStateMachineV0,
  closeProductSurfaceDrawerV0,
  DRAWER_SHELL_ACTION_V0,
  getDrawerStateSnapshotV0,
  handleProductShellSelectV0,
  subscribeDrawerStateV0
} from "./rhizohDrawerStateMachineV0.js";
import {
  applyT0DetailDrawerTogglePlanV0,
  planT0DetailDrawerToggleV0,
  planT0ProductDrawerOpenV0,
  resolveT0DrawerCoordinatorStateV0
} from "./rhizohT0DrawerCoordinatorV0.js";

export {
  applyT0DetailDrawerTogglePlanV0,
  planT0DetailDrawerToggleV0,
  planT0ProductDrawerOpenV0,
  resolveT0DrawerCoordinatorStateV0
};

export {
  bootDrawerStateMachineV0 as bootRhizohT0DrawerShellV0,
  closeProductSurfaceDrawerV0,
  getDrawerStateSnapshotV0,
  subscribeDrawerStateV0
};

/**
 * Execute product shell select on T0 using drawer state machine (in-place drawers).
 * @param {string} surfaceId
 * @param {{
 *   pathname?: string,
 *   resolveWorldTargetPath?: () => string,
 *   onWorldSelect?: (payload: { transition: object, targetPath: string }) => void,
 *   onDrawerClosed?: (surface: string, transition: object) => void,
 *   onDrawerOpened?: (surface: string, transition: object) => void,
 *   onNavigateSurface?: (surface: string, transition: object) => void,
 *   inPlace?: boolean
 * }} [ctx]
 */
export function runT0ProductShellSelectV0(surfaceId, ctx = {}) {
  const surface = String(surfaceId || "world");
  const pathname = String(ctx.pathname || "/");

  if (surface === "world") {
    const targetPath = ctx.resolveWorldTargetPath?.() || "/world/space";
    const transition = handleProductShellSelectV0("world", {
      pathname,
      worldPath: targetPath
    });
    ctx.onWorldSelect?.({ transition, targetPath });
    return transition;
  }

  const transition = handleProductShellSelectV0(surface, {
    pathname,
    inPlace: ctx.inPlace !== false
  });

  if (transition.toggled?.closed) {
    ctx.onDrawerClosed?.(surface, transition);
    return transition;
  }

  if (transition.toggled?.open || transition.nextOpenDrawerId) {
    ctx.onDrawerOpened?.(surface, transition);
  }

  if (transition.action === DRAWER_SHELL_ACTION_V0.NAVIGATE) {
    ctx.onNavigateSurface?.(surface, transition);
  }

  return transition;
}

/**
 * Product drawer takes precedence over legacy right detail drawer on T0.
 * @param {boolean} showDetailDrawer
 * @param {string|null|undefined} openSurfaceDrawerId
 */
export function resolveT0DetailDrawerVisibleV0(showDetailDrawer, openSurfaceDrawerId) {
  return resolveT0DrawerCoordinatorStateV0({
    detailRequested: showDetailDrawer,
    openSurfaceDrawerId
  }).detailDrawerVisible;
}

/**
 * Coordinator toggle for legacy right detail drawer (A3).
 * @param {boolean} showDetailDrawer
 * @param {string|null|undefined} openSurfaceDrawerId
 */
export function toggleT0DetailDrawerCoordinatedV0(showDetailDrawer, openSurfaceDrawerId) {
  const plan = planT0DetailDrawerToggleV0({
    detailRequested: showDetailDrawer,
    openSurfaceDrawerId
  });
  return applyT0DetailDrawerTogglePlanV0(plan);
}
