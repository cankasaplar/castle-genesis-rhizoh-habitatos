/**
 * Context Contract Layer v0 — intent snapshot before domain migration.
 * Flow: click → drawer transition → intent snapshot → domain migration
 * RESEARCH-ONLY (Sprint 38 pre-flight).
 */

import {
  auditCrossDomainDrawerV0,
  CONTEXT_SENSITIVITY_WEIGHT_V0,
  resolveFederationNodeFromProductSurfaceV0,
  RHIZOH_FEDERATION_NODE_V0
} from "./rhizohDomainGraphV0.js";

export const RHIZOH_CONTEXT_INTENT_SCHEMA_V0 = "rhizoh.context_intent.v0";
export const RHIZOH_CONTEXT_INTENT_EVENT_V0 = "rhizoh:context-intent-v0";

export { CONTEXT_SENSITIVITY_WEIGHT_V0 };

/** @type {object | null} */
let latestIntentSnapshotV0 = null;

/** @type {number} */
let intentSeqV0 = 0;

/**
 * @param {string | null | undefined} targetNode
 */
function resolveIntentConstraintsV0(targetNode) {
  const node = String(targetNode || "");
  return Object.freeze({
    exportSensitive: node === RHIZOH_FEDERATION_NODE_V0.STUDIO,
    perceptionSensitive:
      node === RHIZOH_FEDERATION_NODE_V0.MEDIA || node === RHIZOH_FEDERATION_NODE_V0.BROADCAST,
    contextWeight: CONTEXT_SENSITIVITY_WEIGHT_V0[node] ?? 0.5
  });
}

/**
 * Build intent from a planned drawer transition (pure).
 * @param {object} transition
 * @param {{ pathname?: string, hostNode?: string }} [ctx]
 */
export function buildContextIntentSnapshotV0(transition, ctx = {}) {
  const surface = String(transition?.surface || "world");
  const pathname =
    ctx.pathname ||
    (typeof window !== "undefined" ? String(window.location.pathname || "/") : "/world/space");
  const hostNode = ctx.hostNode || RHIZOH_FEDERATION_NODE_V0.WORLD;

  const federationAudit =
    transition?.federationAudit ||
    auditCrossDomainDrawerV0(hostNode, surface === "world" ? "world" : surface);

  const targetNode =
    surface === "world"
      ? null
      : federationAudit?.targetNode || resolveFederationNodeFromProductSurfaceV0(surface);

  const overlayNode = transition?.nextOpenDrawerId ? targetNode : null;
  const migrate =
    transition?.action === "context_shift" &&
    Boolean(transition?.contextShiftPlan) &&
    Boolean(overlayNode);

  const clearOverlay =
    transition?.clearOverlay === true ||
    (transition?.action === "close_all" && !overlayNode) ||
    (transition?.action === "context_shift" && !overlayNode);

  return Object.freeze({
    schema: RHIZOH_CONTEXT_INTENT_SCHEMA_V0,
    intentId: `ctx_intent_${++intentSeqV0}`,
    atMs: Date.now(),
    source: "drawer_shell",
    action: String(transition?.action || "stay"),
    surfaceId: surface,
    pathname,
    hostNode,
    targetNode,
    overlayNode,
    migrate,
    clearOverlay,
    contextShiftPlan: transition?.contextShiftPlan || null,
    federationAudit,
    constraints: resolveIntentConstraintsV0(targetNode),
    drawer: Object.freeze({
      open: Boolean(transition?.nextOpenDrawerId),
      drawerId: transition?.nextOpenDrawerId || null
    })
  });
}

/**
 * @param {ReturnType<typeof buildContextIntentSnapshotV0>} intent
 */
export function commitContextIntentSnapshotV0(intent) {
  latestIntentSnapshotV0 = Object.freeze({ ...intent });
  if (typeof window !== "undefined") {
    window.__RHIZOH_CONTEXT_INTENT__ = latestIntentSnapshotV0;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_CONTEXT_INTENT_EVENT_V0, {
          detail: latestIntentSnapshotV0
        })
      );
    } catch {
      /* noop */
    }
  }
  return latestIntentSnapshotV0;
}

export function getLatestContextIntentSnapshotV0() {
  return latestIntentSnapshotV0;
}

/**
 * @param {ReturnType<typeof buildContextIntentSnapshotV0> | null | undefined} intent
 */
export function shouldApplyDomainMigrationFromIntentV0(intent) {
  if (!intent) return false;
  if (intent.clearOverlay) return true;
  return intent.migrate === true && intent.contextShiftPlan != null;
}

/**
 * Resolve overlay node for consumers (Medusa/Studio) — intent first, not guesswork.
 * @param {string | null | undefined} [fallbackNode]
 */
export function resolveOverlayNodeFromContextIntentV0(fallbackNode = null) {
  const intent = getLatestContextIntentSnapshotV0();
  if (intent?.overlayNode) return intent.overlayNode;
  return fallbackNode;
}

/** @internal vitest */
export function __resetContextIntentSnapshotForTestV0() {
  latestIntentSnapshotV0 = null;
  intentSeqV0 = 0;
}
