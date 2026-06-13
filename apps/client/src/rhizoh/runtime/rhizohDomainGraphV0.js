/**
 * Domain federation graph v0 — topology + permission routing (Sprint 38).
 * RESEARCH-ONLY product chrome.
 */

import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";

export const RHIZOH_DOMAIN_GRAPH_SCHEMA_V0 = "rhizoh.domain_graph.v0";

/** Federation-facing nodes (product + runtime overlay). */
export const RHIZOH_FEDERATION_NODE_V0 = Object.freeze({
  T0: "t0",
  WORLD: "world",
  STUDIO: "studio",
  BROADCAST: "broadcast",
  CASTLE: "castle",
  MEDIA: "media",
  OBSERVER: "observer"
});

export const DOMAIN_CONTEXT_SHIFT_MODE_V0 = Object.freeze({
  ROUTE: "route",
  OVERLAY: "overlay",
  PASS_ONLY: "pass_only",
  DENY: "deny"
});

export const DOMAIN_FEDERATION_EDGE_KIND_V0 = Object.freeze({
  ROUTE_TRANSITION: "route_transition",
  OVERLAY_DRAWER: "overlay_drawer",
  EXPLICIT_PASS: "explicit_pass",
  MEDIA_TUNNEL: "media_tunnel"
});

/** Product shell surface → federation node. */
export const PRODUCT_SURFACE_TO_FEDERATION_NODE_V0 = Object.freeze({
  world: RHIZOH_FEDERATION_NODE_V0.WORLD,
  hall: RHIZOH_FEDERATION_NODE_V0.CASTLE,
  greenroom: RHIZOH_FEDERATION_NODE_V0.CASTLE,
  broadcast: RHIZOH_FEDERATION_NODE_V0.BROADCAST,
  studio: RHIZOH_FEDERATION_NODE_V0.STUDIO,
  profile: RHIZOH_FEDERATION_NODE_V0.OBSERVER
});

/** Allowed adjacency (directed). */
export const DOMAIN_FEDERATION_EDGES_V0 = Object.freeze({
  [RHIZOH_FEDERATION_NODE_V0.T0]: Object.freeze([RHIZOH_FEDERATION_NODE_V0.WORLD]),
  [RHIZOH_FEDERATION_NODE_V0.WORLD]: Object.freeze([
    RHIZOH_FEDERATION_NODE_V0.T0,
    RHIZOH_FEDERATION_NODE_V0.CASTLE,
    RHIZOH_FEDERATION_NODE_V0.BROADCAST,
    RHIZOH_FEDERATION_NODE_V0.STUDIO,
    RHIZOH_FEDERATION_NODE_V0.MEDIA,
    RHIZOH_FEDERATION_NODE_V0.OBSERVER
  ]),
  [RHIZOH_FEDERATION_NODE_V0.CASTLE]: Object.freeze([
    RHIZOH_FEDERATION_NODE_V0.WORLD,
    RHIZOH_FEDERATION_NODE_V0.T0
  ]),
  [RHIZOH_FEDERATION_NODE_V0.BROADCAST]: Object.freeze([
    RHIZOH_FEDERATION_NODE_V0.WORLD,
    RHIZOH_FEDERATION_NODE_V0.CASTLE,
    RHIZOH_FEDERATION_NODE_V0.MEDIA
  ]),
  [RHIZOH_FEDERATION_NODE_V0.STUDIO]: Object.freeze([
    RHIZOH_FEDERATION_NODE_V0.WORLD,
    RHIZOH_FEDERATION_NODE_V0.OBSERVER,
    RHIZOH_FEDERATION_NODE_V0.MEDIA
  ]),
  [RHIZOH_FEDERATION_NODE_V0.MEDIA]: Object.freeze([
    RHIZOH_FEDERATION_NODE_V0.WORLD,
    RHIZOH_FEDERATION_NODE_V0.BROADCAST,
    RHIZOH_FEDERATION_NODE_V0.STUDIO
  ]),
  [RHIZOH_FEDERATION_NODE_V0.OBSERVER]: Object.freeze([
    RHIZOH_FEDERATION_NODE_V0.WORLD,
    RHIZOH_FEDERATION_NODE_V0.T0,
    RHIZOH_FEDERATION_NODE_V0.STUDIO
  ])
});

/** Overlay nodes may not mutate host render. */
export const OVERLAY_READ_ONLY_NODES_V0 = new Set([
  RHIZOH_FEDERATION_NODE_V0.CASTLE,
  RHIZOH_FEDERATION_NODE_V0.BROADCAST,
  RHIZOH_FEDERATION_NODE_V0.STUDIO,
  RHIZOH_FEDERATION_NODE_V0.OBSERVER,
  RHIZOH_FEDERATION_NODE_V0.MEDIA
]);

/** Context sensitivity weight per federation node (graph topology). */
export const CONTEXT_SENSITIVITY_WEIGHT_V0 = Object.freeze({
  [RHIZOH_FEDERATION_NODE_V0.T0]: 0.15,
  [RHIZOH_FEDERATION_NODE_V0.WORLD]: 0.2,
  [RHIZOH_FEDERATION_NODE_V0.CASTLE]: 0.45,
  [RHIZOH_FEDERATION_NODE_V0.BROADCAST]: 0.55,
  [RHIZOH_FEDERATION_NODE_V0.STUDIO]: 0.7,
  [RHIZOH_FEDERATION_NODE_V0.MEDIA]: 0.85,
  [RHIZOH_FEDERATION_NODE_V0.OBSERVER]: 0.35
});

/** @type {string | null} */
let activeOverlayNodeV0 = null;

/**
 * @param {string} node
 * @returns {string}
 */
export function resolveRuntimeDomainFromFederationNodeV0(node) {
  const n = String(node || "").trim();
  if (n === RHIZOH_FEDERATION_NODE_V0.CASTLE || n === RHIZOH_FEDERATION_NODE_V0.BROADCAST) {
    return RHIZOH_DOMAIN_ID_V0.CASTLE;
  }
  if (n === RHIZOH_FEDERATION_NODE_V0.STUDIO) return RHIZOH_DOMAIN_ID_V0.STUDIO;
  if (n === RHIZOH_FEDERATION_NODE_V0.OBSERVER) return RHIZOH_DOMAIN_ID_V0.OBSERVER;
  if (n === RHIZOH_FEDERATION_NODE_V0.MEDIA || n === RHIZOH_FEDERATION_NODE_V0.WORLD) {
    return RHIZOH_DOMAIN_ID_V0.WORLD;
  }
  if (n === RHIZOH_FEDERATION_NODE_V0.T0) return RHIZOH_DOMAIN_ID_V0.T0;
  return RHIZOH_DOMAIN_ID_V0.T0;
}

/**
 * @param {string} surfaceId
 * @returns {string | null}
 */
export function resolveFederationNodeFromProductSurfaceV0(surfaceId) {
  return PRODUCT_SURFACE_TO_FEDERATION_NODE_V0[String(surfaceId || "")] || null;
}

/**
 * @param {string} fromNode
 * @param {string} toNode
 * @returns {boolean}
 */
export function isDomainFederationEdgeAllowedV0(fromNode, toNode) {
  const from = String(fromNode || "");
  const to = String(toNode || "");
  if (!from || !to || from === to) return from === to;
  const edges = DOMAIN_FEDERATION_EDGES_V0[from] || [];
  return edges.includes(to);
}

/**
 * @param {string} hostNode
 * @param {string} targetNode
 * @param {{ inPlace?: boolean, routeNavigate?: boolean }} [ctx]
 */
export function resolveDomainFederationEdgeV0(hostNode, targetNode, ctx = {}) {
  const from = String(hostNode || RHIZOH_FEDERATION_NODE_V0.WORLD);
  const to = String(targetNode || "");
  const allowed = isDomainFederationEdgeAllowedV0(from, to);

  if (!allowed) {
    return Object.freeze({
      allowed: false,
      mode: DOMAIN_CONTEXT_SHIFT_MODE_V0.DENY,
      kind: null,
      reason: "edge_not_allowed",
      mutateHost: false
    });
  }

  const overlayOnHost =
    from === RHIZOH_FEDERATION_NODE_V0.WORLD &&
    OVERLAY_READ_ONLY_NODES_V0.has(to) &&
    ctx.inPlace !== false &&
    !ctx.routeNavigate;

  if (overlayOnHost) {
    return Object.freeze({
      allowed: true,
      mode: DOMAIN_CONTEXT_SHIFT_MODE_V0.OVERLAY,
      kind: DOMAIN_FEDERATION_EDGE_KIND_V0.OVERLAY_DRAWER,
      reason: null,
      mutateHost: false,
      readOnlyOverlay: true,
      contextWeight: CONTEXT_SENSITIVITY_WEIGHT_V0[to] ?? 0.5
    });
  }

  if (to === RHIZOH_FEDERATION_NODE_V0.MEDIA && from === RHIZOH_FEDERATION_NODE_V0.WORLD) {
    return Object.freeze({
      allowed: true,
      mode: DOMAIN_CONTEXT_SHIFT_MODE_V0.OVERLAY,
      kind: DOMAIN_FEDERATION_EDGE_KIND_V0.MEDIA_TUNNEL,
      reason: null,
      mutateHost: false,
      readOnlyOverlay: true
    });
  }

  return Object.freeze({
    allowed: true,
    mode: DOMAIN_CONTEXT_SHIFT_MODE_V0.ROUTE,
    kind: DOMAIN_FEDERATION_EDGE_KIND_V0.ROUTE_TRANSITION,
    reason: null,
    mutateHost: true,
    readOnlyOverlay: OVERLAY_READ_ONLY_NODES_V0.has(to)
  });
}

/**
 * Cross-domain drawer audit — host stays authoritative for spatial render.
 * @param {string} hostNode
 * @param {string} surfaceId
 */
export function auditCrossDomainDrawerV0(hostNode, surfaceId) {
  const targetNode = resolveFederationNodeFromProductSurfaceV0(surfaceId);
  if (!targetNode) {
    return Object.freeze({ ok: false, reason: "unknown_surface", hostNode, surfaceId });
  }
  const edge = resolveDomainFederationEdgeV0(hostNode, targetNode, { inPlace: true });
  return Object.freeze({
    ok: edge.allowed,
    hostNode,
    targetNode,
    surfaceId,
    edge,
    overlayProjectionOnly: edge.mode === DOMAIN_CONTEXT_SHIFT_MODE_V0.OVERLAY
  });
}

/**
 * @param {string | null} overlayNode
 */
export function setActiveFederationOverlayNodeV0(overlayNode) {
  activeOverlayNodeV0 = overlayNode ? String(overlayNode) : null;
  if (typeof window !== "undefined") {
    window.__RHIZOH_DOMAIN_GRAPH__ = getDomainGraphSnapshotV0();
  }
}

export function getActiveFederationOverlayNodeV0() {
  return activeOverlayNodeV0;
}

export function getDomainGraphSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_DOMAIN_GRAPH_SCHEMA_V0,
    nodes: Object.freeze(Object.values(RHIZOH_FEDERATION_NODE_V0)),
    activeOverlayNode: activeOverlayNodeV0,
    edges: DOMAIN_FEDERATION_EDGES_V0
  });
}

/** @internal vitest */
export function __resetDomainGraphForTestV0() {
  activeOverlayNodeV0 = null;
}
