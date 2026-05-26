/**
 * Drift Causality Layer (DCL) v0 — why drift shapes occur (RDOL observes what; DCL explains why).
 * Causal domains: propagation, EDPL pacing, DPUB uncertainty, CAB/ECL authority.
 * @see docs/ops/DRIFT_CAUSALITY_V1.0.md
 */

import { MISAPPREHENSION_SHAPE_V0 } from "./realityDriftObserverLayerV0.js";
import { COHERENCE_VERDICT_V0 } from "./epistemicCoherenceLayerV0.js";
import { PACKET_OVERCONFIDENCE_CLASS_V0 } from "./decisionPacketUncertaintyBoundaryV0.js";
import { AUTHORITY_DRIFT_CLASS_V0 } from "./coherenceAuthorityBoundaryV0.js";

export const DRIFT_CAUSALITY_SCHEMA_V0 = "rhizoh.drift_causality.v0";

export const CAUSAL_DOMAIN_V0 = Object.freeze({
  PROPAGATION: "propagation_distortion",
  EDPL_PACING: "edpl_temporal_compression",
  DPUB_UNCERTAINTY: "dpub_closure_illusion",
  CAB_ECL_AUTHORITY: "cab_ecl_authority_misread"
});

/**
 * Propagation → why distortion amplifies.
 * @param {object} narrativeExport
 */
export function explainPropagationDistortionCausalityV0(narrativeExport) {
  const propagation = narrativeExport?.humanOps?.socialPropagationSimulation;
  const paths = propagation?.paths || [];

  const highResidual = paths.filter((p) => p.residualRisk === "high");
  const compressionLeaders = paths
    .filter((p) => (p.compressionScore ?? 0) >= 0.5)
    .map((p) => p.id);

  const causes = [];
  if ((propagation?.highResidualCount ?? 0) > 0) {
    causes.push("headline_first_channel_strips_raw_and_policy_layers");
  }
  if (propagation?.aggregate?.dominantDistortionSource) {
    causes.push(`dominant_distortion_source_${propagation.aggregate.dominantDistortionSource}`);
  }
  if (paths.some((p) => p.confidencePublicDistortionRisk)) {
    causes.push("confidence_hero_clip_detached_from_epistemic_context");
  }
  if ((propagation?.aggregate?.worstWatermarkSurvivability ?? 1) < 0.4) {
    causes.push("watermark_survivability_low_on_viral_path");
  }

  return Object.freeze({
    domain: CAUSAL_DOMAIN_V0.PROPAGATION,
    question: "why_distortion_amplifies",
    active: causes.length > 0,
    causes: Object.freeze(causes),
    drivers: Object.freeze({
      highResidualPathCount: highResidual.length,
      compressionLeaderPaths: Object.freeze(compressionLeaders),
      mythologyFork: narrativeExport?.culturalRisk?.trustDynamics?.fork
    }),
    contributesToShapes: Object.freeze([
      MISAPPREHENSION_SHAPE_V0.PROPAGATION_LIVE_DIVERGENCE,
      MISAPPREHENSION_SHAPE_V0.NARRATIVE_RAW_DIVERGENCE
    ])
  });
}

/**
 * EDPL pacing → why temporal compression shifts perception.
 * @param {object} narrativeExport
 */
export function explainEdplTemporalCompressionCausalityV0(narrativeExport) {
  const edpl = narrativeExport?.epistemicDecisionPacing;
  const saturation = edpl?.operatorPacingControl?.queueSaturation;
  const windows = edpl?.temporaryStaticPostureWindows?.temporaryStaticPostureWindows?.windows ?? [];

  const causes = [];
  if ((saturation?.queueSaturationIndex ?? 0) >= 0.45) {
    causes.push("queue_saturation_index_elevates_operator_processing_latency");
  }
  if (edpl?.operatorPacingControl?.pacingFrequencyLimit?.maxDecisionBundlesPerHour <= 4) {
    causes.push("pacing_frequency_limit_thins_decision_sampling");
  }
  if (windows.length >= 2) {
    causes.push("multiple_temporary_static_posture_windows_overlap_in_time");
  }
  if (edpl?.latencyInflation?.pressure === "high") {
    causes.push("decision_chain_depth_inflates_before_human_packet");
  }

  return Object.freeze({
    domain: CAUSAL_DOMAIN_V0.EDPL_PACING,
    question: "why_temporal_compression_shifts_perception",
    active: causes.length > 0,
    causes: Object.freeze(causes),
    drivers: Object.freeze({
      queueSaturationTier: saturation?.tier,
      operatorProcessingLatency: saturation?.operatorProcessingLatency,
      postureWindowCount: windows.length,
      latencyInflationScore: edpl?.latencyInflation?.score
    }),
    contributesToShapes: Object.freeze([
      MISAPPREHENSION_SHAPE_V0.REALITY_MODEL_DRIFT,
      MISAPPREHENSION_SHAPE_V0.PROPAGATION_LIVE_DIVERGENCE
    ])
  });
}

/**
 * DPUB uncertainty → why closure illusion emerges.
 * @param {object} narrativeExport
 */
export function explainDpubClosureIllusionCausalityV0(narrativeExport) {
  const packet = narrativeExport?.decisionLatencyGovernance?.humanDecisionPacket;
  const dpub = narrativeExport?.decisionPacketUncertaintyBoundary;

  const causes = [];
  if (packet?.fastPathEligible) {
    causes.push("fast_path_skips_layer_re_read_implying_completeness");
  }
  if ((packet?.overconfidenceRisk?.risks?.length ?? 0) > 0) {
    causes.push("compression_trust_inflation_on_clean_packet_surface");
  }
  if (packet?.overconfidenceRisk?.risks?.some(
    (r) => r.class === PACKET_OVERCONFIDENCE_CLASS_V0.COMPRESSION_TRUST_INFLATION
  )) {
    causes.push("packet_surface_reads_resolved_while_uncertainty_envelope_open");
  }
  if (dpub?.invariantCheck?.valid && (packet?.uncertaintyEnvelope?.itemCount ?? 0) >= 2) {
    causes.push("mandatory_banner_present_but_cognitive_closure_still_tempting");
  }

  return Object.freeze({
    domain: CAUSAL_DOMAIN_V0.DPUB_UNCERTAINTY,
    question: "why_closure_illusion_emerges",
    active: causes.length > 0,
    causes: Object.freeze(causes),
    drivers: Object.freeze({
      certaintyCap: packet?.certaintyCap,
      fastPath: packet?.fastPathEligible,
      overconfidenceClasses: Object.freeze(
        (packet?.overconfidenceRisk?.risks || []).map((r) => r.class)
      )
    }),
    contributesToShapes: Object.freeze([
      MISAPPREHENSION_SHAPE_V0.NARRATIVE_RAW_DIVERGENCE,
      MISAPPREHENSION_SHAPE_V0.PROPAGATION_LIVE_DIVERGENCE
    ])
  });
}

/**
 * CAB / ECL → why authority misread happens.
 * @param {object} narrativeExport
 */
export function explainCabEclAuthorityMisreadCausalityV0(narrativeExport) {
  const cab = narrativeExport?.coherenceAuthorityBoundary;
  const ecl = narrativeExport?.epistemicTemporalCoherence;
  const eclUx = narrativeExport?.epistemicCoherence?.uxCompression;

  const causes = [];
  if (ecl?.systemCoherence?.verdict === COHERENCE_VERDICT_V0.COHERENT) {
    causes.push("coherent_verdict_read_as_safety_or_truth_proxy");
  }
  if (ecl?.systemCoherence?.verdict === COHERENCE_VERDICT_V0.FRAGMENTED) {
    causes.push("fragmented_coherence_still_compressed_to_single_headline");
  }
  if ((cab?.authorityDrift?.driftRisks?.length ?? 0) > 0) {
    causes.push("cab_monitors_authority_drift_but_signal_strength_persists");
  }
  if (
    cab?.authorityDrift?.driftRisks?.some((r) => r.class === AUTHORITY_DRIFT_CLASS_V0.OPS_SAFETY_MISREAD)
  ) {
    causes.push("ops_interprets_coherence_as_cluster_health");
  }
  if (eclUx?.operatorDecision && eclUx.operatorDecision !== "observe_only") {
    causes.push("operator_decision_label_overrides_non_binding_contract");
  }

  return Object.freeze({
    domain: CAUSAL_DOMAIN_V0.CAB_ECL_AUTHORITY,
    question: "why_authority_misread_happens",
    active: causes.length > 0,
    causes: Object.freeze(causes),
    drivers: Object.freeze({
      coherenceVerdict: ecl?.systemCoherence?.verdict,
      coherenceScore: ecl?.systemCoherence?.score,
      cabNegationsEnforced: cab?.negations != null,
      eclHeadlinePresent: Boolean(eclUx?.headline?.tr)
    }),
    contributesToShapes: Object.freeze([
      MISAPPREHENSION_SHAPE_V0.SIM_READ_AS_LIVE,
      MISAPPREHENSION_SHAPE_V0.REALITY_MODEL_DRIFT,
      MISAPPREHENSION_SHAPE_V0.ROBOTICS_FEEDBACK_MISMATCH
    ])
  });
}

/**
 * Map RDOL shapes to causal explanations.
 * @param {object} narrativeExport
 */
export function buildShapeCausalityLinksV0(narrativeExport) {
  const shapes = narrativeExport?.realityDriftObserver?.misapprehensionShapeCatalog?.shapes ?? [];
  const domains = buildCausalDomainBundleV0(narrativeExport);

  const links = shapes.map((shape) => {
    const contributing = [];
    for (const d of Object.values(domains)) {
      if (d.contributesToShapes?.includes(shape.shapeId) && d.active) {
        contributing.push(
          Object.freeze({
            domain: d.domain,
            question: d.question,
            topCause: d.causes[0] || "layer_active_without_single_root"
          })
        );
      }
    }

    return Object.freeze({
      shapeId: shape.shapeId,
      severity: shape.severity,
      primaryCauses: Object.freeze(contributing.map((c) => `${c.domain}:${c.topCause}`)),
      contributingDomains: Object.freeze(contributing)
    });
  });

  return Object.freeze({
    schema: "rhizoh.shape_causality_links.v0",
    shapeCount: links.length,
    links: Object.freeze(links)
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildCausalDomainBundleV0(narrativeExport) {
  return Object.freeze({
    propagation: explainPropagationDistortionCausalityV0(narrativeExport),
    edpl: explainEdplTemporalCompressionCausalityV0(narrativeExport),
    dpub: explainDpubClosureIllusionCausalityV0(narrativeExport),
    cabEcl: explainCabEclAuthorityMisreadCausalityV0(narrativeExport)
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildDriftCausalityLayerV0(narrativeExport) {
  const rdol = narrativeExport?.realityDriftObserver;
  const causalDomains = buildCausalDomainBundleV0(narrativeExport);
  const shapeCausality = buildShapeCausalityLinksV0(narrativeExport);

  const explainedCount = shapeCausality.links.filter((l) => l.primaryCauses.length > 0).length;
  const activeDomains = Object.values(causalDomains).filter((d) => d.active).length;

  return Object.freeze({
    schema: DRIFT_CAUSALITY_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    role: "why_rdol_drift_shapes_occur",
    stackPosition: "above_realityDriftObserver",
    rdolLinkage: Object.freeze({
      driftShapesObserved: rdol?.misapprehensionShapeCatalog?.shapeCount ?? 0,
      shapesWithCausalExplanation: explainedCount
    }),
    causalDomains,
    shapeCausality,
    causalitySummary: Object.freeze({
      activeDomainCount: activeDomains,
      unansweredIfZeroShapes: (rdol?.misapprehensionShapeCatalog?.shapeCount ?? 0) === 0,
      questionAnswered: "why_not_only_what"
    }),
    operatorGuidance: Object.freeze({
      tr:
        explainedCount > 0
          ? `DCL: ${explainedCount} drift şekline nedensel açıklama (propagation/EDPL/DPUB/CAB-ECL).`
          : "DCL: RDOL şekli yok — nedensel graf boş.",
      en:
        explainedCount > 0
          ? `DCL: causal explanation for ${explainedCount} drift shape(s).`
          : "DCL: no RDOL shapes — causality graph empty."
    }),
    invariants: Object.freeze([
      "dcl_explains_does_not_remediate",
      "causality_is_hypothesis_not_blame",
      "no_cause_implies_execution_approval",
      "rdol_shape_required_for_shape_causality_link"
    ]),
    nonExecutable: true,
    nonBinding: true
  });
}
