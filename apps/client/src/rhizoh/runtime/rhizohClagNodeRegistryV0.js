/**
 * CLAG node registry — design-time full schema vs execution-time active runtime.
 * Active runtime: Metehan Ankara + Beşiktaş Serencebey only (sovereign nodes).
 * Sarıyer = simulation/calibration artifact — never active runtime.
 */

import { RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0 } from "../spatial/geographicAnchorsV0.js";

export const RHIZOH_CLAG_NODE_REGISTRY_SCHEMA_V0 = "castle.rhizoh.clag_node_registry.v0";

export const CLAG_NODE_REGISTRY_ROLE_V0 = Object.freeze({
  ACTIVE_RUNTIME: "active_runtime",
  SIMULATION_CALIBRATION: "simulation_calibration",
  LATENT_DESIGN: "latent_design"
});

export const CLAG_REGISTRY_SCOPE_V0 = Object.freeze({
  SOVEREIGN: "sovereign",
  LAYER_META: "layer_meta"
});

/** Production sovereign nodes (execution-time allowed set). */
export const CLAG_ACTIVE_RUNTIME_NODE_ID_V0 = Object.freeze({
  METEHAN_ANKARA: "clag_node:metehan_ankara",
  BESIKTAS_SERENCEBEY: "clag_node:besiktas_serencebey"
});

export const CLAG_SIMULATION_NODE_ID_V0 = Object.freeze({
  SARIYER_CALIBRATION: "clag_node:anchor_sariyer_stability"
});

/** @type {readonly object[]} */
const CLAG_FULL_NODE_REGISTRY_V0 = Object.freeze([
  Object.freeze({
    id: CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA,
    label: "Metehan Ankara",
    role: CLAG_NODE_REGISTRY_ROLE_V0.ACTIVE_RUNTIME,
    scope: CLAG_REGISTRY_SCOPE_V0.SOVEREIGN,
    lat: 39.9334,
    lon: 32.8597,
    placeLabel: "Ankara",
    geographicAnchorId: null,
    dynamicSlug: "ankara_satellite"
  }),
  Object.freeze({
    id: CLAG_ACTIVE_RUNTIME_NODE_ID_V0.BESIKTAS_SERENCEBEY,
    label: "Beşiktaş Serencebey",
    role: CLAG_NODE_REGISTRY_ROLE_V0.ACTIVE_RUNTIME,
    scope: CLAG_REGISTRY_SCOPE_V0.SOVEREIGN,
    lat: 41.0422,
    lon: 29.0075,
    placeLabel: "Beşiktaş Serencebey",
    geographicAnchorId: "anchor_besiktas_pressure",
    dynamicSlug: "besiktas_satellite"
  }),
  Object.freeze({
    id: CLAG_SIMULATION_NODE_ID_V0.SARIYER_CALIBRATION,
    label: "Sarıyer calibration seed",
    role: CLAG_NODE_REGISTRY_ROLE_V0.SIMULATION_CALIBRATION,
    scope: CLAG_REGISTRY_SCOPE_V0.SOVEREIGN,
    lat: 41.1169,
    lon: 29.0567,
    placeLabel: "Sarıyer",
    geographicAnchorId: RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0,
    dynamicSlug: null,
    note: "World-layer calibration only — not a production CLAG runtime node"
  }),
  Object.freeze({
    id: "clag_node:anchor_kadikoy_divergence",
    label: "Kadıköy (latent design)",
    role: CLAG_NODE_REGISTRY_ROLE_V0.LATENT_DESIGN,
    scope: CLAG_REGISTRY_SCOPE_V0.SOVEREIGN,
    geographicAnchorId: "anchor_kadikoy_divergence"
  })
]);

const ACTIVE_ID_SET_V0 = new Set(Object.values(CLAG_ACTIVE_RUNTIME_NODE_ID_V0));
const SIMULATION_ID_SET_V0 = new Set(Object.values(CLAG_SIMULATION_NODE_ID_V0));
const CALIBRATION_GEO_IDS_V0 = new Set([
  RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0,
  CLAG_SIMULATION_NODE_ID_V0.SARIYER_CALIBRATION
]);

export function getClagFullNodeRegistryV0() {
  return CLAG_FULL_NODE_REGISTRY_V0;
}

export function getClagActiveNodeRegistryV0() {
  return Object.freeze(
    CLAG_FULL_NODE_REGISTRY_V0.filter((n) => n.role === CLAG_NODE_REGISTRY_ROLE_V0.ACTIVE_RUNTIME)
  );
}

/**
 * @param {string} registryId
 */
export function isClagActiveRuntimeNodeIdV0(registryId) {
  return ACTIVE_ID_SET_V0.has(String(registryId || ""));
}

/**
 * @param {string} geographicAnchorId
 */
export function isClagSimulationGeographicAnchorIdV0(geographicAnchorId) {
  const id = String(geographicAnchorId || "");
  return CALIBRATION_GEO_IDS_V0.has(id) || id.includes("sariyer");
}

/**
 * @param {string} registryId
 */
export function isClagSimulationRegistryNodeIdV0(registryId) {
  return SIMULATION_ID_SET_V0.has(String(registryId || ""));
}

/**
 * Primary sovereign for this turn (edges default target).
 * @param {{ persona?: { firstName?: string, displayName?: string }, pathname?: string, geographicAnchor?: string | null }} [ctx]
 */
export function resolveClagPrimaryActiveSovereignNodeV0(ctx = {}) {
  const persona = String(ctx.persona?.firstName || ctx.persona?.displayName || "").toLowerCase();
  const path = String(ctx.pathname || "").toLowerCase();
  const geo = String(ctx.geographicAnchor || "");

  if (persona.includes("metehan") || geo.includes("ankara")) {
    return CLAG_FULL_NODE_REGISTRY_V0.find((n) => n.id === CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA);
  }
  if (path.includes("besiktas") || path.includes("serencebey") || geo.includes("besiktas")) {
    return CLAG_FULL_NODE_REGISTRY_V0.find((n) => n.id === CLAG_ACTIVE_RUNTIME_NODE_ID_V0.BESIKTAS_SERENCEBEY);
  }
  return CLAG_FULL_NODE_REGISTRY_V0.find(
    (n) => n.id === CLAG_ACTIVE_RUNTIME_NODE_ID_V0.BESIKTAS_SERENCEBEY
  );
}

/**
 * @param {{
 *   nodes: object[],
 *   edges: object[],
 *   attemptedGeographicAnchor?: string | null
 * }} input
 */
export function filterClagGraphToActiveRuntimeV0(input) {
  const nodes = Array.isArray(input.nodes) ? input.nodes : [];
  const edges = Array.isArray(input.edges) ? input.edges : [];
  const activeRegistry = getClagActiveNodeRegistryV0();
  const activeSovereignSuffixes = new Set(
    activeRegistry.map((n) => n.id.replace(/^clag_node:/, ""))
  );

  /** @type {string[]} */
  const blockedNodeIds = [];
  /** @type {object[]} */
  const activeNodes = [];
  /** @type {object[]} */
  const fullNodes = [...nodes];

  for (const n of nodes) {
    const registryId = n.meta?.registryId || null;
    const isRealLife = n.kind === "real_life";
    const isSimulation =
      isClagSimulationRegistryNodeIdV0(registryId) ||
      isClagSimulationGeographicAnchorIdV0(n.meta?.anchor) ||
      isClagSimulationGeographicAnchorIdV0(n.meta?.geographicAnchorId);

    if (isRealLife && isSimulation) {
      blockedNodeIds.push(n.id);
      continue;
    }
    if (isRealLife) {
      const suffix = String(n.id.split(":").slice(1).join(":") || "");
      const allowed =
        activeSovereignSuffixes.has(suffix) ||
        activeRegistry.some((a) => suffix === a.id.replace(/^clag_node:/, ""));
      if (!allowed) {
        blockedNodeIds.push(n.id);
        continue;
      }
    }
    activeNodes.push(n);
  }

  const activeIdSet = new Set(activeNodes.map((n) => n.id));
  const activeEdges = edges.filter((e) => activeIdSet.has(e.from) && activeIdSet.has(e.to));
  const blockedEdges = edges.length - activeEdges.length;

  const contaminationDetected =
    blockedNodeIds.length > 0 ||
    isClagSimulationGeographicAnchorIdV0(input.attemptedGeographicAnchor);

  return Object.freeze({
    schema: RHIZOH_CLAG_NODE_REGISTRY_SCHEMA_V0,
    activeNodeRegistry: activeRegistry,
    fullNodeRegistry: getClagFullNodeRegistryV0(),
    activeSovereignNodeCount: activeRegistry.length,
    nodes: Object.freeze(activeNodes),
    edges: Object.freeze(activeEdges),
    fullNodes: Object.freeze(fullNodes),
    fullEdges: Object.freeze(edges),
    graphContamination: Object.freeze({
      detected: contaminationDetected,
      blockedNodeIds: Object.freeze(blockedNodeIds),
      blockedEdgeCount: blockedEdges,
      attemptedGeographicAnchor: input.attemptedGeographicAnchor ?? null,
      message: contaminationDetected
        ? "simulation_or_non_active_sovereign_excluded_from_runtime_graph"
        : "runtime_graph_clean"
    })
  });
}

/**
 * Influence / narrative MUST call this — never read fullNodes for routing scores.
 * @param {ReturnType<typeof filterClagGraphToActiveRuntimeV0> | { nodes?: object[], edges?: object[], activeNodeRegistry?: object[] }} view
 */
export function assertClagInfluenceUsesActiveRegistryOnlyV0(view) {
  const registry = view?.activeNodeRegistry || getClagActiveNodeRegistryV0();
  const nodes = view?.nodes || [];
  const bad = nodes.filter(
    (n) =>
      n.kind === "real_life" &&
      (isClagSimulationRegistryNodeIdV0(n.meta?.registryId) ||
        isClagSimulationGeographicAnchorIdV0(n.meta?.anchor))
  );
  return Object.freeze({
    ok: bad.length === 0,
    activeSovereignNodeCount: registry.length,
    violationCount: bad.length
  });
}
