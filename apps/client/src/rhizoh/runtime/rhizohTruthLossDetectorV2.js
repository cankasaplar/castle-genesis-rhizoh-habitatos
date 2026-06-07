/**
 * Truth Loss Detector V2 — intent-aware loss classification.
 * Separates structural loss (FAIL) from intentional compression (OK) and probe artifacts (ignored).
 * Read-only — never influences execution.
 */

import { detectTruthLossV0 } from "./rhizohTruthLossDetectorV0.js";
import { TRUTH_TRACE_KIND_V0 } from "./rhizohTruthTraceLayerV0.js";

export const RHIZOH_TRUTH_LOSS_DETECTOR_SCHEMA_V2 = "rhizoh.truth_loss_detector.v2";

export const TRUTH_LOSS_TYPE_V2 = Object.freeze({
  STRUCTURAL: "structural",
  INTENTIONAL: "intentional",
  PROBE_ARTIFACT: "probe_artifact"
});

const STRUCTURAL_FAIL_THRESHOLD_V2 = 1;

/**
 * @param {object} item
 */
function isProbeArtifactV0(item) {
  const id = String(item.nodeId || item.from || item.id || "");
  const label = String(item.label || "");
  return (
    id.startsWith("probe-") ||
    id.startsWith("probe_") ||
    label.includes("probe") ||
    item.source === "full_system_probe"
  );
}

/**
 * @param {object} loss
 * @param {object} ctx
 */
function classifyLossV2(loss, ctx) {
  if (isProbeArtifactV0(loss)) {
    return Object.freeze({ ...loss, lossType: TRUTH_LOSS_TYPE_V2.PROBE_ARTIFACT });
  }
  if (ctx.compressionContext?.intentional) {
    const intentionalCodes = new Set([
      "replay_branch_collapsed",
      "temporal_trail_clustered",
      "cluster_summary",
      "policy_bounded_edge_cap"
    ]);
    if (intentionalCodes.has(loss.code)) {
      return Object.freeze({ ...loss, lossType: TRUTH_LOSS_TYPE_V2.INTENTIONAL });
    }
    if (
      ctx.skeletonOk &&
      (loss.code === "causal_edge_semantic_loss" ||
        loss.code === "causal_path_broken" ||
        loss.code === "critical_node_pruned")
    ) {
      return Object.freeze({ ...loss, lossType: TRUTH_LOSS_TYPE_V2.INTENTIONAL });
    }
  }
  if (
    loss.code === "critical_node_kind_loss" ||
    (loss.severity === "high" && loss.code === "causal_edge_semantic_loss" && !ctx.skeletonOk)
  ) {
    return Object.freeze({ ...loss, lossType: TRUTH_LOSS_TYPE_V2.STRUCTURAL });
  }
  if (loss.severity === "high" && !ctx.compressionContext?.intentional) {
    return Object.freeze({ ...loss, lossType: TRUTH_LOSS_TYPE_V2.STRUCTURAL });
  }
  return Object.freeze({ ...loss, lossType: TRUTH_LOSS_TYPE_V2.INTENTIONAL });
}

/**
 * @param {object[]} nodes
 * @param {string} domain
 */
function domainSemanticDensityV2(nodes, domain) {
  const inDomain = nodes.filter((n) => n.domain === domain);
  return Object.freeze({
    domain,
    domainTransitions: inDomain.filter((n) => n.kind === TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION)
      .length,
    tensorDecisions: inDomain.filter((n) => n.kind === TRUTH_TRACE_KIND_V0.TENSOR_DECISION)
      .length,
    spatialNodes: inDomain.filter((n) => n.kind === TRUTH_TRACE_KIND_V0.SPATIAL_NODE).length,
    density:
      inDomain.filter((n) =>
        [
          TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION,
          TRUTH_TRACE_KIND_V0.TENSOR_DECISION,
          TRUTH_TRACE_KIND_V0.SPATIAL_NODE
        ].includes(n.kind)
      ).length
  });
}

/**
 * Intent-aware truth loss — structural vs intentional vs probe artifact.
 * @param {object} raw
 * @param {object} compressed
 * @param {{ compressionContext?: object, probeIsolated?: boolean }} [opts]
 */
export function detectTruthLossV2(raw, compressed, opts = {}) {
  const v0 = detectTruthLossV0(raw, compressed);
  const compressionContext = Object.freeze({
    intentional: true,
    mode: "policy_bounded",
    skipTruthLossAsFailure: false,
    ...(compressed?.compressionContext || opts.compressionContext || {})
  });

  const ctx = Object.freeze({
    compressionContext,
    skeletonOk: v0.criticalSkeletonPreserved === true,
    probeIsolated: opts.probeIsolated === true
  });

  const allLosses = [
    ...v0.criticalLosses,
    ...v0.weakenedPaths,
    ...(v0.acceptableCompression || [])
  ];
  const classified = allLosses.map((l) => classifyLossV2(l, ctx));

  const structural = classified.filter((l) => l.lossType === TRUTH_LOSS_TYPE_V2.STRUCTURAL);
  const intentional = classified.filter((l) => l.lossType === TRUTH_LOSS_TYPE_V2.INTENTIONAL);
  const probeArtifact = classified.filter((l) => l.lossType === TRUTH_LOSS_TYPE_V2.PROBE_ARTIFACT);

  const compNodes = Array.isArray(compressed?.nodes) ? compressed.nodes : [];
  const domains = [...new Set(compNodes.map((n) => n.domain).filter(Boolean))];
  const semanticBudget = Object.freeze(
    domains.map((d) => domainSemanticDensityV2(compNodes, d))
  );

  const structuralLossCount = structural.length;
  const structuralPass = structuralLossCount < STRUCTURAL_FAIL_THRESHOLD_V2;

  const compressionBudget = Object.freeze({
    ratio: v0.compressionRatio,
    intentionalLossCount: intentional.length,
    probeArtifactCount: probeArtifact.length,
    semanticBudget,
    withinBudget: v0.criticalSkeletonPreserved === true,
    narrative:
      intentional.length > 0
        ? `Intentional compression: ${intentional.length} bounded reduction(s).`
        : "No intentional compression applied."
  });

  const pass = structuralPass;

  const selfExplanation = structuralPass
    ? [
        `Structural truth preserved (structural loss: ${structuralLossCount}).`,
        compressionBudget.narrative,
        v0.policyBoundedCompression ? "Compression budget within policy." : null
      ]
        .filter(Boolean)
        .join(" ")
    : [
        `Structural truth loss: ${structuralLossCount} critical degradation(s).`,
        structural.map((s) => s.code).join(", ")
      ].join(" ");

  return Object.freeze({
    schema: RHIZOH_TRUTH_LOSS_DETECTOR_SCHEMA_V2,
    evaluatedAtMs: Date.now(),
    influencesExecution: false,
    pass,
    structuralPass,
    structuralLossCount,
    intentionalLossCount: intentional.length,
    probeArtifactCount: probeArtifact.length,
    compressionContext,
    compressionBudget,
    lossClassification: Object.freeze({
      structural: Object.freeze(structural),
      intentional: Object.freeze(intentional),
      probeArtifact: Object.freeze(probeArtifact)
    }),
    v0,
    selfExplanation
  });
}

/**
 * @param {object} raw
 * @param {object} compressed
 * @param {object} [opts]
 */
export function publishTruthLossDetectorV2(raw, compressed, opts = {}) {
  const report = detectTruthLossV2(raw, compressed, opts);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.truthLoss = report;
    window.__rhizoh.truthLossV2 = report;
    window.__rhizoh.detectTruthLossV2 = detectTruthLossV2;
  }
  return report;
}
