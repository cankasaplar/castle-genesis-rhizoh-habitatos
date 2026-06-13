/**
 * Drawer state machine v0 — unifies awakening + chrome panels + domain tags.
 * RESEARCH-ONLY product chrome.
 */

import {
  bootDrawerAwakeningV0,
  listAwakenedDrawerModulesV0,
  shouldOpenDrawerInPlaceV0
} from "./rhizohDrawerAwakeningV0.js";
import {
  closeAllRhizohProductSurfacePanelsV0,
  getRhizohChromePanelsSnapshotV0,
  resolveOpenProductSurfaceDrawerIdV0,
  setRhizohProductSurfacePanelExclusiveV0,
  subscribeRhizohChromePanelsV0,
  toggleRhizohProductSurfacePanelV0
} from "./rhizohProductChromePanelsV0.js";
import { subscribeDrawerAwakeningV0 } from "./rhizohDrawerAwakeningV0.js";
import {
  applyRhizohDomainTagsToElementV0,
  resolveRhizohDomainTagsV0
} from "./rhizohDomainTagV0.js";

export const RHIZOH_DRAWER_STATE_MACHINE_SCHEMA_V0 = "rhizoh.drawer_state_machine.v0";

export const DRAWER_SHELL_ACTION_V0 = Object.freeze({
  STAY: "stay",
  NAVIGATE: "navigate",
  TOGGLE_DRAWER: "toggle_drawer",
  CLOSE_ALL: "close_all"
});

export function getDrawerStateSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_DRAWER_STATE_MACHINE_SCHEMA_V0,
    panels: getRhizohChromePanelsSnapshotV0(),
    openDrawerId: resolveOpenProductSurfaceDrawerIdV0(),
    awakenedModules: listAwakenedDrawerModulesV0()
  });
}

/** @param {() => void} onChange */
export function subscribeDrawerStateV0(onChange) {
  const unChrome = subscribeRhizohChromePanelsV0(onChange);
  const unAwake = subscribeDrawerAwakeningV0(onChange);
  return () => {
    unChrome();
    unAwake();
  };
}

/**
 * Boot drawer awakening defaults (idempotent).
 */
export function bootDrawerStateMachineV0() {
  bootDrawerAwakeningV0();
  return getDrawerStateSnapshotV0();
}

/**
 * @param {string | null | undefined} drawerId
 * @param {{ pathname?: string, surfaceId?: string }} [ctx]
 */
export function resolveDrawerDomainTagsV0(drawerId, ctx = {}) {
  return resolveRhizohDomainTagsV0({
    pathname: ctx.pathname,
    surfaceId: ctx.surfaceId || drawerId || "world",
    drawerId: drawerId || null
  });
}

/**
 * @param {HTMLElement | null | undefined} el
 * @param {ReturnType<typeof resolveRhizohDomainTagsV0>} tags
 */
export function applyDrawerDomainTagsV0(el, tags) {
  applyRhizohDomainTagsToElementV0(el, tags);
}

/**
 * @param {string} surfaceId
 * @param {{ pathname?: string, inPlace?: boolean, worldPath?: string }} [ctx]
 */
export function handleProductShellSelectV0(surfaceId, ctx = {}) {
  const surface = String(surfaceId || "world");
  const pathname =
    ctx.pathname ||
    (typeof window !== "undefined" ? String(window.location.pathname || "/") : "/");

  if (surface === "world") {
    closeAllRhizohProductSurfacePanelsV0();
    const tags = resolveDrawerDomainTagsV0(null, { pathname, surfaceId: "world" });
    return Object.freeze({
      action: DRAWER_SHELL_ACTION_V0.CLOSE_ALL,
      surface,
      navigateTo: ctx.worldPath || "/world/space",
      tags
    });
  }

  const inPlace = ctx.inPlace !== false && shouldOpenDrawerInPlaceV0(surface);
  if (inPlace) {
    const openDrawerId = resolveOpenProductSurfaceDrawerIdV0();
    const toggled = toggleRhizohProductSurfacePanelV0(surface, openDrawerId || "world");
    const nextDrawerId = toggled.closed ? null : surface;
    const tags = resolveDrawerDomainTagsV0(nextDrawerId, { pathname, surfaceId: surface });
    return Object.freeze({
      action: DRAWER_SHELL_ACTION_V0.TOGGLE_DRAWER,
      surface,
      toggled,
      tags
    });
  }

  const tags = resolveDrawerDomainTagsV0(null, { pathname, surfaceId: surface });
  return Object.freeze({
    action: DRAWER_SHELL_ACTION_V0.NAVIGATE,
    surface,
    tags
  });
}

/**
 * @returns {string | null}
 */
export function closeProductSurfaceDrawerV0() {
  const id = resolveOpenProductSurfaceDrawerIdV0();
  if (id) setRhizohProductSurfacePanelExclusiveV0(id, false);
  return id;
}
