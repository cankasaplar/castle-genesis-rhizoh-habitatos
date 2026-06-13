/**
 * Drawer state machine v0 — unifies awakening + chrome panels + domain tags.
 * Sprint 37.5: pure transition compute + serialized apply (deterministic).
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
  RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0,
  setRhizohProductSurfacePanelExclusiveV0,
  subscribeRhizohChromePanelsV0,
  writeRhizohChromePanelsOpenV0
} from "./rhizohProductChromePanelsV0.js";
import { subscribeDrawerAwakeningV0 } from "./rhizohDrawerAwakeningV0.js";
import {
  applyRhizohDomainTagsToElementV0,
  resolveRhizohDomainTagsV0
} from "./rhizohDomainTagV0.js";
import {
  auditCrossDomainDrawerV0,
  DOMAIN_CONTEXT_SHIFT_MODE_V0,
  RHIZOH_FEDERATION_NODE_V0
} from "./rhizohDomainGraphV0.js";
import {
  applyDomainMigrationFromIntentV0,
  planDomainContextShiftV0
} from "./rhizohDomainContextShiftV0.js";
import {
  buildContextIntentSnapshotV0,
  commitContextIntentSnapshotV0
} from "./rhizohContextIntentSnapshotV0.js";

export const RHIZOH_DRAWER_STATE_MACHINE_SCHEMA_V0 = "rhizoh.drawer_state_machine.v0";

export const DRAWER_SHELL_ACTION_V0 = Object.freeze({
  STAY: "stay",
  NAVIGATE: "navigate",
  TOGGLE_DRAWER: "toggle_drawer",
  CONTEXT_SHIFT: "context_shift",
  CLOSE_ALL: "close_all"
});

/** @type {Promise<unknown>} */
let drawerTransitionQueueV0 = Promise.resolve();

/** @type {number} */
let drawerTransitionSeqV0 = 0;

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

export function bootDrawerStateMachineV0() {
  bootDrawerAwakeningV0();
  return getDrawerStateSnapshotV0();
}

/**
 * Pure transition — same snapshot + input → same planned transition.
 * @param {string} surfaceId
 * @param {ReturnType<typeof getDrawerStateSnapshotV0>} snapshot
 * @param {{ pathname?: string, inPlace?: boolean, worldPath?: string }} [ctx]
 */
export function computeDrawerShellTransitionV0(surfaceId, snapshot, ctx = {}) {
  const surface = String(surfaceId || "world");
  const pathname =
    ctx.pathname ||
    (typeof window !== "undefined" ? String(window.location.pathname || "/") : "/");

  if (surface === "world") {
    return Object.freeze({
      action: DRAWER_SHELL_ACTION_V0.CLOSE_ALL,
      surface,
      nextOpenDrawerId: null,
      navigateTo: ctx.worldPath || "/world/space",
      clearOverlay: true,
      tags: resolveDrawerDomainTagsV0(null, { pathname, surfaceId: "world", overlayNode: null })
    });
  }

  const inPlace = ctx.inPlace !== false && shouldOpenDrawerInPlaceV0(surface);
  if (inPlace) {
    const currentlyOpen = snapshot.openDrawerId === surface;
    const nextOpenDrawerId = currentlyOpen ? null : surface;
    const federationAudit = auditCrossDomainDrawerV0(RHIZOH_FEDERATION_NODE_V0.WORLD, surface);
    const contextShiftPlan = planDomainContextShiftV0({
      surfaceId: surface,
      pathname,
      inPlace: true,
      toNode: federationAudit.targetNode
    });
    const useContextShift =
      federationAudit.ok && contextShiftPlan.mode === DOMAIN_CONTEXT_SHIFT_MODE_V0.OVERLAY;

  return Object.freeze({
      action: useContextShift ? DRAWER_SHELL_ACTION_V0.CONTEXT_SHIFT : DRAWER_SHELL_ACTION_V0.TOGGLE_DRAWER,
      surface,
      nextOpenDrawerId,
      clearOverlay: currentlyOpen,
      contextShiftPlan: useContextShift ? contextShiftPlan : null,
      federationAudit,
      toggled: Object.freeze({
        open: !currentlyOpen,
        closed: currentlyOpen,
        surface
      }),
      tags: resolveDrawerDomainTagsV0(nextOpenDrawerId, {
        pathname,
        surfaceId: surface,
        overlayNode: nextOpenDrawerId ? federationAudit.targetNode : null
      })
    });
  }

  return Object.freeze({
    action: DRAWER_SHELL_ACTION_V0.NAVIGATE,
    surface,
    nextOpenDrawerId: snapshot.openDrawerId,
    tags: resolveDrawerDomainTagsV0(snapshot.openDrawerId, { pathname, surfaceId: surface })
  });
}

/**
 * Apply drawer chrome (panels) only — step 1 of context contract.
 * @param {ReturnType<typeof computeDrawerShellTransitionV0>} transition
 */
export function applyDrawerChromeFromTransitionV0(transition) {
  if (transition.action === DRAWER_SHELL_ACTION_V0.CLOSE_ALL) {
    closeAllRhizohProductSurfacePanelsV0();
    return transition;
  }

  if (
    transition.action === DRAWER_SHELL_ACTION_V0.TOGGLE_DRAWER ||
    transition.action === DRAWER_SHELL_ACTION_V0.CONTEXT_SHIFT
  ) {
    if (transition.nextOpenDrawerId) {
      /** @type {Record<string, boolean>} */
      const patch = {};
      for (const id of RHIZOH_PRODUCT_SURFACE_PANEL_IDS_V0) {
        patch[id] = id === transition.nextOpenDrawerId;
      }
      writeRhizohChromePanelsOpenV0(patch);
    } else {
      setRhizohProductSurfacePanelExclusiveV0(transition.surface, false);
    }
  }

  return transition;
}

/**
 * Apply planned transition — context contract: chrome → intent → migration.
 * @param {ReturnType<typeof computeDrawerShellTransitionV0>} transition
 * @param {{ pathname?: string, hostNode?: string }} [ctx]
 */
export function applyDrawerShellTransitionV0(transition, ctx = {}) {
  applyDrawerChromeFromTransitionV0(transition);

  const intent = commitContextIntentSnapshotV0(buildContextIntentSnapshotV0(transition, ctx));
  applyDomainMigrationFromIntentV0(intent);

  return Object.freeze({ ...transition, intent });
}

/**
 * Atomic sync transition (compute + apply).
 * @param {string} surfaceId
 * @param {{ pathname?: string, inPlace?: boolean, worldPath?: string }} [ctx]
 */
export function executeDrawerShellTransitionV0(surfaceId, ctx = {}) {
  const seq = ++drawerTransitionSeqV0;
  const snapshot = getDrawerStateSnapshotV0();
  const planned = computeDrawerShellTransitionV0(surfaceId, snapshot, ctx);
  const applied = applyDrawerShellTransitionV0(planned, {
    pathname: ctx.pathname,
    hostNode: RHIZOH_FEDERATION_NODE_V0.WORLD
  });
  return Object.freeze({ ...applied, seq });
}

/**
 * Serialized async transition — prevents interleaved rapid taps.
 * @param {string} surfaceId
 * @param {{ pathname?: string, inPlace?: boolean, worldPath?: string }} [ctx]
 */
export function enqueueDrawerShellTransitionV0(surfaceId, ctx = {}) {
  const run = drawerTransitionQueueV0.then(() => executeDrawerShellTransitionV0(surfaceId, ctx));
  drawerTransitionQueueV0 = run.catch(() => {});
  return run;
}

/**
 * @param {string} surfaceId
 * @param {{ pathname?: string, inPlace?: boolean, worldPath?: string }} [ctx]
 */
export function handleProductShellSelectV0(surfaceId, ctx = {}) {
  return executeDrawerShellTransitionV0(surfaceId, ctx);
}

/**
 * Determinism self-check for tests — pure compute must match across runs.
 * @param {string} surfaceId
 * @param {ReturnType<typeof getDrawerStateSnapshotV0>} snapshot
 * @param {object} ctx
 * @param {number} [iterations=50]
 */
export function verifyDrawerTransitionDeterminismV0(surfaceId, snapshot, ctx = {}, iterations = 50) {
  const first = computeDrawerShellTransitionV0(surfaceId, snapshot, ctx);
  for (let i = 0; i < iterations; i += 1) {
    const next = computeDrawerShellTransitionV0(surfaceId, snapshot, ctx);
    if (JSON.stringify(next) !== JSON.stringify(first)) {
      return Object.freeze({ ok: false, iteration: i, first, next });
    }
  }
  return Object.freeze({ ok: true, transition: first, iterations });
}

/**
 * @param {string | null | undefined} drawerId
 * @param {{ pathname?: string, surfaceId?: string }} [ctx]
 */
export function resolveDrawerDomainTagsV0(drawerId, ctx = {}) {
  return resolveRhizohDomainTagsV0({
    pathname: ctx.pathname,
    surfaceId: ctx.surfaceId || drawerId || "world",
    drawerId: drawerId || null,
    overlayNode: ctx.overlayNode ?? null
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
 * @returns {string | null}
 */
export function closeProductSurfaceDrawerV0() {
  const id = resolveOpenProductSurfaceDrawerIdV0();
  const transition = Object.freeze({
    action: DRAWER_SHELL_ACTION_V0.CONTEXT_SHIFT,
    surface: id || "world",
    nextOpenDrawerId: null,
    clearOverlay: true,
    contextShiftPlan: null,
    federationAudit: null
  });
  applyDrawerShellTransitionV0(transition, { hostNode: RHIZOH_FEDERATION_NODE_V0.WORLD });
  return id;
}

/** @internal test reset */
export function __resetDrawerTransitionQueueForTestV0() {
  drawerTransitionQueueV0 = Promise.resolve();
  drawerTransitionSeqV0 = 0;
}
