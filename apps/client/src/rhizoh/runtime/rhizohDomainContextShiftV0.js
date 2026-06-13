/**
 * Domain context shift v0 — federation orchestration (Sprint 38).
 * Drawer open = overlay context migration trigger, not route hop.
 */

import { passDomainStateV0, getRhizohDomainCoreSnapshotV0 } from "./rhizohDomainCoreStoreV0.js";
import {
  DOMAIN_CONTEXT_SHIFT_MODE_V0,
  DOMAIN_FEDERATION_EDGE_KIND_V0,
  getActiveFederationOverlayNodeV0,
  resolveDomainFederationEdgeV0,
  resolveFederationNodeFromProductSurfaceV0,
  resolveRuntimeDomainFromFederationNodeV0,
  RHIZOH_FEDERATION_NODE_V0,
  setActiveFederationOverlayNodeV0
} from "./rhizohDomainGraphV0.js";
import { runDomainGateForPathV0 } from "./rhizohDomainNervousSystemV0.js";
import { resolveDomainIdFromPathV0 } from "./rhizohDomainGateV0.js";

export const RHIZOH_DOMAIN_CONTEXT_SHIFT_SCHEMA_V0 = "rhizoh.domain_context_shift.v0";

/**
 * @param {string} pathname
 * @returns {string}
 */
function resolveHostFederationNodeFromPathV0(pathname) {
  const domainId = resolveDomainIdFromPathV0(pathname);
  if (domainId === "world") return RHIZOH_FEDERATION_NODE_V0.WORLD;
  if (domainId === "studio") return RHIZOH_FEDERATION_NODE_V0.STUDIO;
  if (domainId === "castle") return RHIZOH_FEDERATION_NODE_V0.CASTLE;
  if (domainId === "observer") return RHIZOH_FEDERATION_NODE_V0.OBSERVER;
  return RHIZOH_FEDERATION_NODE_V0.T0;
}

/**
 * Plan a context shift without side effects.
 * @param {{
 *   toNode?: string,
 *   surfaceId?: string,
 *   hostNode?: string,
 *   pathname?: string,
 *   inPlace?: boolean,
 *   routeNavigate?: boolean,
 *   passPayload?: unknown
 * }} [ctx]
 */
export function planDomainContextShiftV0(ctx = {}) {
  const pathname =
    ctx.pathname ||
    getRhizohDomainCoreSnapshotV0().pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "/");
  const hostNode = ctx.hostNode || resolveHostFederationNodeFromPathV0(pathname);
  const toNode =
    ctx.toNode ||
    resolveFederationNodeFromProductSurfaceV0(ctx.surfaceId) ||
    hostNode;

  const edge = resolveDomainFederationEdgeV0(hostNode, toNode, {
    inPlace: ctx.inPlace,
    routeNavigate: ctx.routeNavigate
  });

  const runtimeDomain = resolveRuntimeDomainFromFederationNodeV0(toNode);
  const hostRuntimeDomain = resolveRuntimeDomainFromFederationNodeV0(hostNode);

  return Object.freeze({
    schema: RHIZOH_DOMAIN_CONTEXT_SHIFT_SCHEMA_V0,
    hostNode,
    toNode,
    hostRuntimeDomain,
    runtimeDomain,
    edge,
    mode: edge.mode,
    pathname,
    passPayload:
      ctx.passPayload ??
      Object.freeze({
        kind: edge.kind || DOMAIN_FEDERATION_EDGE_KIND_V0.EXPLICIT_PASS,
        surfaceId: ctx.surfaceId || null,
        overlay: edge.mode === DOMAIN_CONTEXT_SHIFT_MODE_V0.OVERLAY
      })
  });
}

/**
 * Apply planned context shift.
 * @param {ReturnType<typeof planDomainContextShiftV0>} plan
 * @param {{ userId?: string | null }} [opts]
 */
export function applyDomainContextShiftV0(plan, opts = {}) {
  if (!plan?.edge?.allowed) {
    return Object.freeze({ ok: false, reason: plan?.edge?.reason || "denied", plan });
  }

  passDomainStateV0(plan.hostRuntimeDomain, plan.runtimeDomain, plan.passPayload);

  if (plan.mode === DOMAIN_CONTEXT_SHIFT_MODE_V0.OVERLAY) {
    setActiveFederationOverlayNodeV0(plan.toNode);
    return Object.freeze({
      ok: true,
      mode: plan.mode,
      overlayNode: plan.toNode,
      hostNode: plan.hostNode,
      activeDomainUnchanged: true
    });
  }

  if (plan.mode === DOMAIN_CONTEXT_SHIFT_MODE_V0.ROUTE) {
    setActiveFederationOverlayNodeV0(null);
    const gate = runDomainGateForPathV0(plan.pathname, {
      fromDomain: plan.hostRuntimeDomain,
      passPayload: plan.passPayload,
      userId: opts.userId || null
    });
    return Object.freeze({
      ok: true,
      mode: plan.mode,
      overlayNode: null,
      gate
    });
  }

  return Object.freeze({ ok: true, mode: plan.mode, overlayNode: getActiveFederationOverlayNodeV0() });
}

/**
 * Single entry — plan + apply.
 * @param {Parameters<typeof planDomainContextShiftV0>[0]} ctx
 * @param {{ userId?: string | null }} [opts]
 */
export function shiftRhizohDomainContextV0(ctx = {}, opts = {}) {
  const plan = planDomainContextShiftV0(ctx);
  const applied = applyDomainContextShiftV0(plan, opts);
  return Object.freeze({ plan, applied });
}

/**
 * Domain migration from committed intent snapshot — step 3 of context contract.
 * @param {import("./rhizohContextIntentSnapshotV0.js").ReturnType<typeof import("./rhizohContextIntentSnapshotV0.js").buildContextIntentSnapshotV0> | null | undefined} intent
 * @param {{ userId?: string | null }} [opts]
 */
export function applyDomainMigrationFromIntentV0(intent, opts = {}) {
  if (!intent) {
    return Object.freeze({ ok: false, reason: "no_intent", skipped: true });
  }

  if (intent.clearOverlay) {
    const cleared = clearFederationOverlayContextV0(intent.hostNode || RHIZOH_FEDERATION_NODE_V0.WORLD);
    return Object.freeze({ ok: true, phase: "clear_overlay", cleared });
  }

  if (!intent.migrate || !intent.contextShiftPlan) {
    return Object.freeze({ ok: true, phase: "chrome_only", skipped: true });
  }

  const plan = planDomainContextShiftFromIntentV0(intent);
  const applied = applyDomainContextShiftV0(plan, opts);
  return Object.freeze({ ok: applied.ok !== false, phase: "migrate", plan, applied });
}

/**
 * Validate intent-bound plan (intent drives graph, not pathname guess).
 * @param {object} intent
 */
export function planDomainContextShiftFromIntentV0(intent) {
  if (!intent?.contextShiftPlan) {
    return planDomainContextShiftV0({
      surfaceId: intent?.surfaceId,
      pathname: intent?.pathname,
      toNode: intent?.targetNode,
      inPlace: true
    });
  }

  const plan = intent.contextShiftPlan;
  if (plan.toNode !== intent.targetNode) {
    return planDomainContextShiftV0({
      surfaceId: intent.surfaceId,
      pathname: intent.pathname,
      toNode: intent.targetNode,
      inPlace: true,
      passPayload: Object.freeze({
        ...plan.passPayload,
        intentId: intent.intentId
      })
    });
  }

  return Object.freeze({
    ...plan,
    passPayload: Object.freeze({
      ...plan.passPayload,
      intentId: intent.intentId
    })
  });
}

/**
 * Clear overlay context (e.g. world shell close all).
 * @param {string} hostNode
 */
export function clearFederationOverlayContextV0(hostNode = RHIZOH_FEDERATION_NODE_V0.WORLD) {
  const prev = getActiveFederationOverlayNodeV0();
  if (!prev) return Object.freeze({ ok: true, cleared: false });
  setActiveFederationOverlayNodeV0(null);
  passDomainStateV0(resolveRuntimeDomainFromFederationNodeV0(prev), resolveRuntimeDomainFromFederationNodeV0(hostNode), {
    kind: DOMAIN_FEDERATION_EDGE_KIND_V0.EXPLICIT_PASS,
    closedOverlay: prev
  });
  return Object.freeze({ ok: true, cleared: true, previousOverlay: prev });
}
