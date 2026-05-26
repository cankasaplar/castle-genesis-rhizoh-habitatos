/**
 * RESEARCH-ONLY: Phase 9.3 — Epistemic Rendering Engine
 *
 * topologyCompiler → render packets (not truth):
 * - stressMesh → field shader uniforms + Cesium terrain deformation spec
 * - disagreementGraph → navigable UI manifold
 * - executionAxis → temporal ray cast
 *
 * Frozen core / prod Cesium MUST NOT import until explicit wire phase.
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §14
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "../walHashChainV0.js";
import {
  compileEpistemicTopologyFromObservationsV0,
  EPISTEMIC_TOPOLOGY_COMPILER_SCHEMA_V0
} from "./epistemicTopologyCompilerV0.js";

export const EPISTEMIC_RENDERING_ENGINE_SCHEMA_V0 =
  "castle.rhizoh.epistemic_rendering_engine.research.v0.3";

export const EPISTEMIC_FIELD_SHADER_ID_V0 = "rhizoh.epistemic_field.v0";

/**
 * Render ≠ truth. Depicts epistemic physics only.
 * @readonly
 */
export const EPISTEMIC_RENDER_INVARIANT_V0 = Object.freeze({
  statement: "Rendering depicts epistemic fields; it does not collapse or elect global truth."
});

/**
 * GPU-like uniform block for epistemic tension field (WebGL / custom material research).
 *
 * @param {import('./epistemicTopologyCompilerV0.js').EpistemicTopologyArtifactV0} topology
 */
export function compileFieldShaderUniformsV0(topology) {
  const mesh = topology.layers.stressMesh;
  const meta = topology.meta;
  const verts = mesh.vertices.filter((v) => !String(v.id).includes("hub"));
  const stressMax = verts.reduce((m, v) => Math.max(m, v.stress), 0) || 1;
  const stressMin = verts.reduce((m, v) => Math.min(m, v.stress), 1) || 0;

  return {
    kind: "epistemic_field_shader_uniforms",
    shaderId: EPISTEMIC_FIELD_SHADER_ID_V0,
    truthCollapsed: false,
    uniforms: {
      u_epistemicTension: Number(meta.epistemicSplitBrainScore) || 0,
      u_coherenceGradient: Number(meta.coherenceGradient) || 1,
      u_stressScale: 1,
      u_stressMin: stressMin,
      u_stressMax: stressMax,
      u_time: 0,
      u_topologyIdHash: foldWalSegmentHashV0(topology.topologyId, { layer: "shader" }).slice(0, 12)
    },
    vertexAttributes: ["a_stress", "a_coherence", "a_position"],
    fragmentHint:
      "mix coherence cool tone with tension warm tone; never zero-sum collapse two node readings",
    statement: "Field shader uniforms — GPU-like epistemic tension visualization."
  };
}

/**
 * Disagreement graph → navigable UI manifold (routes, focus, panels).
 *
 * @param {import('./epistemicTopologyCompilerV0.js').EpistemicTopologyArtifactV0} topology
 */
export function compileDisagreementManifoldV0(topology) {
  const graph = topology.layers.disagreementGraph;
  const routes = graph.edges
    .filter((e) => e.navigable && !e.virtual)
    .map((e) => ({
      routeId: e.id,
      from: e.from,
      to: e.to,
      label: e.label,
      weight: e.weight,
      navigable: true
    }));

  const panels = graph.nodes.map((n) => ({
    panelId: `panel_${n.id}`,
    nodeId: n.id,
    title: n.label,
    verdict: n.verdict,
    confidence: n.confidence,
    position: n.position,
    focusable: n.navigable
  }));

  return {
    kind: "disagreement_ui_manifold",
    truthCollapsed: false,
    routes,
    panels,
    ensembleHub: {
      verdict: graph.ensemble?.verdict,
      confidence: graph.ensemble?.confidence,
      stabilizationMode: graph.ensemble?.stabilizationMode
    },
    defaultFocusNodeId: graph.nodes[0]?.id ?? null,
    statement: "Navigable UI manifold — user moves across disagreement, system does not merge truths."
  };
}

/**
 * Stress mesh → Cesium terrain deformation research spec (height offsets).
 * Future wire: CesiumRealMapLayer / sampleTerrainMostDetailed consumer.
 *
 * @param {import('./epistemicTopologyCompilerV0.js').EpistemicTopologyArtifactV0} topology
 * @param {{
 *   anchorLon?: number,
 *   anchorLat?: number,
 *   metersPerUnit?: number,
 *   maxDisplacementMeters?: number
 * }} [geo]
 */
export function compileCesiumTerrainDeformationV0(topology, geo = {}) {
  const mesh = topology.layers.stressMesh;
  const anchorLon = Number(geo.anchorLon) || 28.9784;
  const anchorLat = Number(geo.anchorLat) || 41.0082;
  const metersPerUnit = Number(geo.metersPerUnit) || 12_000;
  const maxDisp = Number(geo.maxDisplacementMeters) || 48;

  const samples = mesh.vertices
    .filter((v) => !String(v.id).includes("hub"))
    .map((v) => ({
      nodeId: v.id,
      lon: anchorLon + v.x * (metersPerUnit / 111_320),
      lat: anchorLat + v.y * (metersPerUnit / 110_540),
      heightOffsetMeters: v.stress * maxDisp,
      stress: v.stress,
      coherence: v.coherence
    }));

  const gridSize = Math.max(2, Math.ceil(Math.sqrt(samples.length)));
  const heightmap = new Array(gridSize * gridSize).fill(0);
  samples.forEach((s, i) => {
    heightmap[i % heightmap.length] = s.heightOffsetMeters / maxDisp;
  });

  return {
    kind: "cesium_terrain_deformation_research",
    truthCollapsed: false,
    anchor: { lon: anchorLon, lat: anchorLat },
    maxDisplacementMeters: maxDisp,
    samples,
    heightmap: {
      width: gridSize,
      height: gridSize,
      normalized: heightmap
    },
    materialHint: "vertex displacement from epistemic stress, not geological truth",
    statement: "Cesium terrain deformation spec — reality tension shapes ground, does not replace it."
  };
}

/**
 * Execution axis → temporal ray cast (governance convergence in time-like axis).
 *
 * @param {import('./epistemicTopologyCompilerV0.js').EpistemicTopologyArtifactV0} topology
 */
export function compileTemporalRayCastV0(topology) {
  const axis = topology.layers.executionAxis;
  const splitBrain = Number(topology.meta.epistemicSplitBrainScore) || 0;

  const rays = (axis.segments || []).map((seg, i) => {
    const dx = seg.to.x - seg.from.x;
    const dy = seg.to.y - seg.from.y;
    const len = Math.hypot(dx, dy) || 0.001;
    return {
      rayId: `ray_${i}`,
      origin: { x: seg.from.x, y: seg.from.y, z: 0, nodeId: seg.from.nodeId },
      direction: { x: dx / len, y: dy / len, z: 0.15 + splitBrain * 0.5 },
      length: len,
      temporalWeight: seg.collapsePressure,
      targetExecutorId: seg.to.nodeId,
      axis: "execution_convergence"
    };
  });

  const hub = axis.hub
    ? {
        x: axis.hub.x,
        y: axis.hub.y,
        z: 0.2,
        nodeId: axis.hub.nodeId
      }
    : null;

  return {
    kind: "temporal_ray_cast",
    truthCollapsed: false,
    executorNodeId: axis.executorNodeId,
    rays,
    convergencePoint: hub,
    tickHint: "ray length encodes governance pull, not checkpoint truth",
    statement:
      "Temporal ray cast — execution axis as converging rays; epistemic time geometry, not WAL tick."
  };
}

/**
 * Full render packet from compiled topology.
 *
 * @param {import('./epistemicTopologyCompilerV0.js').EpistemicTopologyArtifactV0} topology
 * @param {{ geo?: { anchorLon?: number, anchorLat?: number } }} [opts]
 */
export function compileEpistemicRenderPacketV0(topology, opts = {}) {
  const renderId = foldWalSegmentHashV0(topology.topologyId, { layer: "render_v0.3" });

  return {
    schema: EPISTEMIC_RENDERING_ENGINE_SCHEMA_V0,
    renderId,
    topologyId: topology.topologyId,
    topologySchema: EPISTEMIC_TOPOLOGY_COMPILER_SCHEMA_V0,
    truthCollapsed: false,
    invariant: EPISTEMIC_RENDER_INVARIANT_V0.statement,
    channels: {
      fieldShader: compileFieldShaderUniformsV0(topology),
      disagreementManifold: compileDisagreementManifoldV0(topology),
      cesiumTerrain: compileCesiumTerrainDeformationV0(topology, opts.geo),
      temporalRayCast: compileTemporalRayCastV0(topology)
    },
    meta: { ...topology.meta },
    statement: "Epistemic render packet — system renders reality fields, does not elect reality."
  };
}

/**
 * Observations → topology → render (research pipeline terminus).
 *
 * @param {Parameters<typeof compileEpistemicTopologyFromObservationsV0>[0]} input
 * @param {{ geo?: { anchorLon?: number, anchorLat?: number } }} [opts]
 */
export function compileEpistemicRenderFromObservationsV0(input, opts = {}) {
  const topology = compileEpistemicTopologyFromObservationsV0(input);
  return compileEpistemicRenderPacketV0(topology, opts);
}
