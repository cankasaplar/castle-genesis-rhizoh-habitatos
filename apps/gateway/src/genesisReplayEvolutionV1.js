/**
 * Evolution bundle: phase criticality + equivalence collapse scan + causal curvature scalar.
 */
import { computeGenesisReplayAnalyticsV1 } from "./genesisReplayAnalyticsV1.js";
import { detectPhaseRegimeCriticalityV1 } from "./genesisReplayPhaseTransitionV1.js";
import { detectEquivalenceCollapseWindowsV1 } from "./genesisReplayEquivalenceCollapseV1.js";
import { computeCausalCurvatureScalarV1 } from "./genesisReplayCurvatureV1.js";
import { computeCurvatureSeriesAndPhaseBoundariesV1 } from "./genesisReplayCurvatureSeriesV1.js";
import { computeEquivalenceClassStabilityFieldV1 } from "./genesisReplayEquivalenceStabilityV1.js";
import { computeTemporalEmbeddingProjectionV1 } from "./genesisReplayTemporalEmbeddingV1.js";
import { segmentManifoldFromEmbeddingV1 } from "./genesisReplayManifoldSegmentV1.js";
import { computeCurvatureCriticalPhaseAtlasV1 } from "./genesisReplayPhaseAtlasV1.js";
import { computeEquivalenceTopologyGraphV1 } from "./genesisReplayEquivalenceTopologyV1.js";
import { computeMetricStabilityAxisV1 } from "./genesisReplayMetricStabilityV1.js";
import { computeCrossManifoldAlignmentV1 } from "./genesisReplayCrossManifoldAlignmentV1.js";
import { computeTemporalRenormalizationAxisV1 } from "./genesisReplayTemporalRenormalizeV1.js";
import { computeMetricTensorFieldV1 } from "./genesisReplayMetricTensorFieldV1.js";
import { computeStabilityCouplingAxisV1 } from "./genesisReplayStabilityCouplingV1.js";
import { computeInvarianceManifoldAxisV1 } from "./genesisReplayInvarianceManifoldV1.js";
import { computeFieldEvolutionLawV1 } from "./genesisReplayFieldEvolutionLawV1.js";
import { GENESIS_REPLAY_ROUTER_MAX_SPAN } from "./genesisReplayRouterV1.js";

export const GENESIS_REPLAY_EVOLUTION_SCHEMA = "castle.genesis.replay_evolution.v1";

/**
 * @param {{ from: number, to: number, type?: string, bins?: number, collapseWindows?: number, includeCheckpoints?: boolean }} opts
 */
export async function computeGenesisReplayEvolutionV1(opts) {
  const from = Math.floor(Number(opts?.from) || 0);
  const to = Math.floor(Number(opts?.to) || 0);
  const typeFilter = String(opts?.type ?? "").trim();
  const bins = Number(opts?.bins) || 16;
  const collapseWindows = Number(opts?.collapseWindows) || 0;
  const includeCheckpoints = opts?.includeCheckpoints !== false;

  if (from <= 0 || to <= 0) {
    return { ok: false, error: "invalid_range", schema: GENESIS_REPLAY_EVOLUTION_SCHEMA };
  }
  if (to < from) {
    return { ok: false, error: "range_inverted", schema: GENESIS_REPLAY_EVOLUTION_SCHEMA };
  }
  if (to - from > GENESIS_REPLAY_ROUTER_MAX_SPAN) {
    return {
      ok: false,
      error: "range_span_too_large",
      maxSpan: GENESIS_REPLAY_ROUTER_MAX_SPAN,
      schema: GENESIS_REPLAY_EVOLUTION_SCHEMA
    };
  }

  const analytics = await computeGenesisReplayAnalyticsV1({
    from,
    to,
    type: typeFilter,
    bins,
    includeCheckpoints
  });
  if (!analytics.ok) {
    return { ...analytics, schema: GENESIS_REPLAY_EVOLUTION_SCHEMA };
  }

  const phaseRegimeCriticality = detectPhaseRegimeCriticalityV1({
    causalTopology: analytics.causalTopology,
    stabilityField: analytics.stabilityField,
    from,
    to
  });

  const grad = Array.isArray(analytics.stabilityField?.gradient) ? analytics.stabilityField.gradient : [];
  const meanAbsGradient =
    grad.length > 0
      ? grad.reduce((s, g) => s + Math.abs(Number(g.deltaH) || 0), 0) / grad.length
      : 0;

  const collapse = await detectEquivalenceCollapseWindowsV1({
    from,
    to,
    type: typeFilter,
    windowCount: collapseWindows > 0 ? collapseWindows : undefined
  });
  if (!collapse.ok) {
    return { ...collapse, schema: GENESIS_REPLAY_EVOLUTION_SCHEMA };
  }

  const edgeCount = Math.floor(Number(analytics.causalTopology?.edgeCount) || 0);
  const causalCurvature = computeCausalCurvatureScalarV1({
    from,
    to,
    edgeCount,
    spikeCount: phaseRegimeCriticality.spikeCount,
    meanAbsGradient,
    collapseCount: collapse.collapseCount,
    edgeBurstHeuristic: phaseRegimeCriticality.edgeBurstHeuristic
  });

  const curvatureSeriesPhase = computeCurvatureSeriesAndPhaseBoundariesV1({
    from,
    to,
    stabilityField: analytics.stabilityField,
    causalTopology: analytics.causalTopology
  });

  const equivalenceClassStabilityField = computeEquivalenceClassStabilityFieldV1(
    collapse.windows,
    from,
    to
  );

  const temporalEmbeddingProjection = computeTemporalEmbeddingProjectionV1(
    collapse.windows,
    from,
    to,
    analytics.stabilityField?.entropyField
  );

  const manifoldSegmentation = segmentManifoldFromEmbeddingV1(temporalEmbeddingProjection.points);

  const curvatureCriticalPhaseAtlas = computeCurvatureCriticalPhaseAtlasV1({
    from,
    to,
    curvatureSeriesPhase,
    equivalenceClassStabilityField,
    phaseRegimeCriticality
  });

  const metricStabilityAxis = computeMetricStabilityAxisV1({
    from,
    to,
    points: temporalEmbeddingProjection.points,
    manifoldSegmentation,
    curvatureSeriesPhase,
    curvatureCriticalPhaseAtlas
  });

  const crossManifoldAlignment = computeCrossManifoldAlignmentV1(temporalEmbeddingProjection.points);

  const temporalRenormalizationAxis = computeTemporalRenormalizationAxisV1(
    temporalEmbeddingProjection.points,
    manifoldSegmentation
  );

  const metricTensorField = computeMetricTensorFieldV1(temporalEmbeddingProjection.points);

  const stabilityCouplingAxis = computeStabilityCouplingAxisV1({
    metricStabilityAxis,
    crossManifoldAlignment,
    equivalenceClassStabilityField
  });

  const invarianceManifoldAxis = computeInvarianceManifoldAxisV1({
    metricTensorField,
    temporalRenormalizationAxis,
    crossManifoldAlignment,
    stabilityCouplingAxis
  });

  const fieldEvolutionLaw = computeFieldEvolutionLawV1({
    temporalEmbeddingProjection,
    equivalenceClassStabilityField,
    metricTensorField,
    stabilityCouplingAxis,
    invarianceManifoldAxis
  });

  const equivalenceTopologyGraph = computeEquivalenceTopologyGraphV1(equivalenceClassStabilityField);

  const topologyCompact = {
    schema: analytics.causalTopology?.schema,
    nodeCount: analytics.causalTopology?.nodeCount,
    edgeCount: analytics.causalTopology?.edgeCount,
    edges: analytics.causalTopology?.edges
  };

  return {
    ok: true,
    schema: GENESIS_REPLAY_EVOLUTION_SCHEMA,
    from,
    to,
    type: typeFilter || null,
    replayFingerprint: analytics.replayFingerprint,
    determinismProjection: analytics.determinismProjection,
    phaseRegimeCriticality,
    equivalenceCollapses: collapse,
    causalCurvature,
    curvatureSeriesPhase,
    equivalenceClassStabilityField,
    temporalEmbeddingProjection,
    manifoldSegmentation,
    curvatureCriticalPhaseAtlas,
    metricStabilityAxis,
    crossManifoldAlignment,
    temporalRenormalizationAxis,
    metricTensorField,
    stabilityCouplingAxis,
    invarianceManifoldAxis,
    fieldEvolutionLaw,
    equivalenceTopologyGraph,
    stabilityField: analytics.stabilityField,
    causalTopologyCompact: topologyCompact,
    sources: analytics.sources
  };
}
