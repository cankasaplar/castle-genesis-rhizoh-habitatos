/**
 * Phase Coupling Graph v0 — links temporal BEA phases to node-level coupling (RESEARCH-ONLY).
 * Answers: which node is more active in which phase? how do accumulate ↔ release transitions bind?
 */

import { CLAG_NODE_KIND_V0 } from "./rhizohClagTypesV0.js";
import {
  CLAG_ACTIVE_RUNTIME_NODE_ID_V0,
  CLAG_NODE_REGISTRY_ROLE_V0
} from "./rhizohClagNodeRegistryV0.js";
import { TEMPORAL_BEA_PHASE_V0 } from "./rhizohClagTemporalBeaV0.js";

export const RHIZOH_PHASE_COUPLING_GRAPH_SCHEMA_V0 =
  "castle.rhizoh.phase_coupling_graph.v0";

/** Phase → node-kind activation affinity (0..1). */
const PHASE_LAYER_AFFINITY_V0 = Object.freeze({
  [TEMPORAL_BEA_PHASE_V0.ACCUMULATE]: Object.freeze({
    [CLAG_NODE_KIND_V0.DEPTH]: 0.72,
    [CLAG_NODE_KIND_V0.CONVERSATION]: 0.55,
    [CLAG_NODE_KIND_V0.NARRATIVE]: 0.38,
    [CLAG_NODE_KIND_V0.INFLUENCE]: 0.4,
    [CLAG_NODE_KIND_V0.REAL_LIFE]: 0.35,
    [CLAG_NODE_KIND_V0.STUDIO]: 0.2,
    [CLAG_NODE_KIND_V0.SPIRAL]: 0.15,
    [CLAG_NODE_KIND_V0.ACADEMY]: 0.12,
    [CLAG_NODE_KIND_V0.SOCIAL]: 0.25
  }),
  [TEMPORAL_BEA_PHASE_V0.CONSERVE]: Object.freeze({
    [CLAG_NODE_KIND_V0.DEPTH]: 0.5,
    [CLAG_NODE_KIND_V0.CONVERSATION]: 0.45,
    [CLAG_NODE_KIND_V0.NARRATIVE]: 0.3,
    [CLAG_NODE_KIND_V0.INFLUENCE]: 0.55,
    [CLAG_NODE_KIND_V0.REAL_LIFE]: 0.4,
    [CLAG_NODE_KIND_V0.STUDIO]: 0.15,
    [CLAG_NODE_KIND_V0.SPIRAL]: 0.1,
    [CLAG_NODE_KIND_V0.ACADEMY]: 0.1,
    [CLAG_NODE_KIND_V0.SOCIAL]: 0.2
  }),
  [TEMPORAL_BEA_PHASE_V0.RELEASE]: Object.freeze({
    [CLAG_NODE_KIND_V0.NARRATIVE]: 0.88,
    [CLAG_NODE_KIND_V0.REAL_LIFE]: 0.82,
    [CLAG_NODE_KIND_V0.SPIRAL]: 0.65,
    [CLAG_NODE_KIND_V0.CONVERSATION]: 0.7,
    [CLAG_NODE_KIND_V0.DEPTH]: 0.45,
    [CLAG_NODE_KIND_V0.INFLUENCE]: 0.5,
    [CLAG_NODE_KIND_V0.STUDIO]: 0.35,
    [CLAG_NODE_KIND_V0.ACADEMY]: 0.2,
    [CLAG_NODE_KIND_V0.SOCIAL]: 0.55
  })
});

/** Sovereign registry ids — phase-specific cross-coupling base weights. */
const PHASE_SOVEREIGN_COUPLING_V0 = Object.freeze({
  [TEMPORAL_BEA_PHASE_V0.ACCUMULATE]: Object.freeze({
    [CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA]: 0.25,
    [CLAG_ACTIVE_RUNTIME_NODE_ID_V0.BESIKTAS_SERENCEBEY]: 0.25,
    crossLink: 0.08
  }),
  [TEMPORAL_BEA_PHASE_V0.CONSERVE]: Object.freeze({
    [CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA]: 0.35,
    [CLAG_ACTIVE_RUNTIME_NODE_ID_V0.BESIKTAS_SERENCEBEY]: 0.4,
    crossLink: 0.05
  }),
  [TEMPORAL_BEA_PHASE_V0.RELEASE]: Object.freeze({
    [CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA]: 0.55,
    [CLAG_ACTIVE_RUNTIME_NODE_ID_V0.BESIKTAS_SERENCEBEY]: 0.62,
    crossLink: 0.18
  })
});

const VALID_TRANSITIONS_V0 = Object.freeze([
  "accumulate_to_accumulate",
  "accumulate_to_conserve",
  "accumulate_to_release",
  "conserve_to_accumulate",
  "conserve_to_conserve",
  "conserve_to_release",
  "release_to_accumulate",
  "release_to_conserve",
  "release_to_release",
  "bootstrap"
]);

/**
 * @param {string | null | undefined} prev
 * @param {string} current
 */
function resolvePhaseTransitionV0(prev, current) {
  const cur = String(current || TEMPORAL_BEA_PHASE_V0.ACCUMULATE);
  if (!prev) return "bootstrap";
  const key = `${String(prev)}_to_${cur}`;
  return VALID_TRANSITIONS_V0.includes(key) ? key : `unknown_to_${cur}`;
}

/**
 * @param {object[]} nodes
 * @param {Record<string, number>} layerAffinity
 * @param {string} phase
 */
function buildNodeAffinitiesV0(nodes, layerAffinity, phase) {
  const sovereignCfg = PHASE_SOVEREIGN_COUPLING_V0[phase] || PHASE_SOVEREIGN_COUPLING_V0.accumulate;
  return Object.freeze(
    nodes.map((n) => {
      const kind = n.kind || "unknown";
      const registryId = n.meta?.registryId || null;
      const isSovereign = n.meta?.registryRole === CLAG_NODE_REGISTRY_ROLE_V0.ACTIVE_RUNTIME;
      const activation01 = isSovereign && registryId
        ? sovereignCfg[registryId] ?? layerAffinity[kind] ?? 0.2
        : layerAffinity[kind] ?? 0.2;
      return Object.freeze({
        nodeId: n.id,
        kind,
        label: n.label,
        registryId,
        activation01: Math.round(activation01 * 1000) / 1000,
        isPrimary: n.meta?.isPrimary === true
      });
    })
  );
}

/**
 * @param {string} phase
 * @param {object[]} nodeAffinities
 */
function buildPhaseCouplingEdgesV0(phase, nodeAffinities) {
  const sovereign = nodeAffinities.filter((n) => n.registryId);
  const layer = nodeAffinities.filter((n) => !n.registryId);
  const sovereignCfg = PHASE_SOVEREIGN_COUPLING_V0[phase] || PHASE_SOVEREIGN_COUPLING_V0.accumulate;
  /** @type {object[]} */
  const edges = [];

  if (sovereign.length >= 2) {
    const a = sovereign.find((n) => n.registryId === CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA) || sovereign[0];
    const b =
      sovereign.find((n) => n.registryId === CLAG_ACTIVE_RUNTIME_NODE_ID_V0.BESIKTAS_SERENCEBEY) ||
      sovereign[1];
    edges.push(
      Object.freeze({
        kind: "phase_coupling",
        from: a.registryId,
        to: b.registryId,
        weight: sovereignCfg.crossLink,
        label: "sovereign_cross_phase_coupling",
        phase
      })
    );
  }

  const narr = layer.find((n) => n.kind === CLAG_NODE_KIND_V0.NARRATIVE);
  const primary = sovereign.find((n) => n.isPrimary) || sovereign[0];
  if (narr && primary) {
    const aff = PHASE_LAYER_AFFINITY_V0[phase] || {};
    edges.push(
      Object.freeze({
        kind: "phase_coupling",
        from: `layer:${narr.kind}`,
        to: primary.registryId,
        weight: Math.round((aff[CLAG_NODE_KIND_V0.NARRATIVE] || 0.3) * 0.35 * 1000) / 1000,
        label: "narrative_sovereign_phase_coupling",
        phase
      })
    );
  }

  if (phase === TEMPORAL_BEA_PHASE_V0.RELEASE) {
    const spiral = layer.find((n) => n.kind === CLAG_NODE_KIND_V0.SPIRAL);
    if (spiral && primary) {
      edges.push(
        Object.freeze({
          kind: "phase_coupling",
          from: `layer:${spiral.kind}`,
          to: primary.registryId,
          weight: 0.12,
          label: "spiral_release_coupling",
          phase
        })
      );
    }
  }

  return Object.freeze(edges);
}

/**
 * @param {{
 *   boundedEmergence?: Record<string, unknown> | null,
 *   nodes?: object[],
 *   activeNodeRegistry?: readonly object[]
 * }} input
 */
export function buildPhaseCouplingGraphV0(input = {}) {
  const bea = input.boundedEmergence;
  const phase =
    bea?.temporal?.strategicFlow?.phase || TEMPORAL_BEA_PHASE_V0.ACCUMULATE;
  const tickHistory = bea?.temporal?.tickHistory || [];
  const prevPhase =
    tickHistory.length >= 2 ? tickHistory[tickHistory.length - 2]?.phase : null;
  const transition = resolvePhaseTransitionV0(prevPhase, phase);
  const affinity = PHASE_LAYER_AFFINITY_V0[phase] || PHASE_LAYER_AFFINITY_V0.accumulate;

  const nodes = Array.isArray(input.nodes) ? input.nodes : [];
  const mergedAffinities = buildNodeAffinitiesV0(nodes, affinity, phase);
  const phaseCouplingEdges = buildPhaseCouplingEdgesV0(phase, mergedAffinities);
  const dominantNodes = [...mergedAffinities]
    .sort((a, b) => b.activation01 - a.activation01)
    .slice(0, 4)
    .map((n) => `${n.kind}:${n.registryId || "meta"}`);

  const systemBreath = Object.freeze({
    inhale: TEMPORAL_BEA_PHASE_V0.ACCUMULATE,
    hold: TEMPORAL_BEA_PHASE_V0.CONSERVE,
    exhale: TEMPORAL_BEA_PHASE_V0.RELEASE,
    current: phase
  });

  return Object.freeze({
    schema: RHIZOH_PHASE_COUPLING_GRAPH_SCHEMA_V0,
    executionApplied: false,
    currentPhase: phase,
    previousPhase: prevPhase,
    phaseTransition: transition,
    systemBreath,
    nodeAffinities: mergedAffinities,
    phaseCouplingEdges,
    dominantNodesThisPhase: Object.freeze(dominantNodes),
    schedulerSurface: Object.freeze({
      singlePointOfBehavioralControl: "temporal_bea_phase",
      calibrationSensitive: true,
      note: "phase_model_miscalibration_shifts_whole_manifold_behavior"
    }),
    couplingSummary: Object.freeze({
      accumulate: "low cross-sovereign · depth-primary",
      conserve: "variance suppression · influence watch",
      release: "narrative + sovereign spike · controlled surprise"
    }[phase] || "unknown")
  });
}
