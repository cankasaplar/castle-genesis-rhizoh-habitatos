/**
 * Truth Loss Detector v0 — measures semantic loss after causal graph compression.
 * Answers: "ne kaybettim?" — causal meaning degradation, not raw data deletion.
 * Read-only — never influences execution.
 */

import { TRUTH_TRACE_KIND_V0 } from "./rhizohTruthTraceLayerV0.js";

/** Inline — avoid circular import with rhizohCausalMapLayerV0. */
const CAUSAL_EDGE_RELATION_V0 = Object.freeze({
  CAUSES: "causes",
  ENABLES: "enables",
  PROJECTS_TO: "projects_to",
  TRAILS: "trails",
  EXPLAINS: "explains"
});

export const RHIZOH_TRUTH_LOSS_DETECTOR_SCHEMA_V0 = "rhizoh.truth_loss_detector.v0";

const CRITICAL_EDGE_RELATIONS_V0 = new Set([
  CAUSAL_EDGE_RELATION_V0.CAUSES,
  CAUSAL_EDGE_RELATION_V0.ENABLES,
  CAUSAL_EDGE_RELATION_V0.PROJECTS_TO
]);

const CRITICAL_NODE_KINDS_V0 = new Set([
  TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION,
  TRUTH_TRACE_KIND_V0.TENSOR_DECISION,
  TRUTH_TRACE_KIND_V0.SPATIAL_NODE
]);

/** Acceptable semantic compression — above this ratio triggers review (not auto-fail). */
const SEMANTIC_LOSS_REVIEW_RATIO_V0 = 0.55;

/**
 * @param {object[]} nodes
 */
function countByKindV0(nodes) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const n of nodes) {
    const k = String(n.kind || "unknown");
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

/**
 * @param {object[]} nodes
 */
function countByDomainV0(nodes) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const n of nodes) {
    const d = String(n.domain || "unknown");
    out[d] = (out[d] || 0) + 1;
  }
  return out;
}

/**
 * @param {object[]} edges
 */
function edgeSignatureV0(e) {
  return `${e.from}|${e.to}|${e.relation}`;
}

/**
 * @param {object[]} rawNodes
 * @param {object[]} compressedNodes
 */
function detectDroppedCriticalNodesV0(rawNodes, compressedNodes) {
  const compressedIds = new Set(compressedNodes.map((n) => n.id));
  const compressedKinds = countByKindV0(compressedNodes);
  const rawKinds = countByKindV0(rawNodes);
  /** @type {object[]} */
  const losses = [];

  for (const kind of CRITICAL_NODE_KINDS_V0) {
    const rawCount = rawKinds[kind] || 0;
    const compCount = compressedKinds[kind] || 0;
    if (rawCount > 0 && compCount < rawCount) {
      losses.push(
        Object.freeze({
          code: "critical_node_kind_loss",
          severity: "high",
          kind,
          rawCount,
          compressedCount: compCount,
          hint: "Causal meaning weakened — critical path node kind reduced"
        })
      );
    }
  }

  for (const n of rawNodes) {
    if (!CRITICAL_NODE_KINDS_V0.has(n.kind)) continue;
    if (!compressedIds.has(n.id)) {
      losses.push(
        Object.freeze({
          code: "critical_node_pruned",
          severity: "high",
          nodeId: n.id,
          kind: n.kind,
          domain: n.domain,
          label: n.label,
          hint: "Specific critical node dropped — replay may not reconstruct full chain"
        })
      );
    }
  }

  return losses;
}

/**
 * @param {object[]} rawEdges
 * @param {object[]} compressedEdges
 * @param {Set<string>} rawNodeIds
 * @param {Set<string>} compressedNodeIds
 */
function detectWeakenedCausalPathsV0(rawEdges, compressedEdges, rawNodeIds, compressedNodeIds) {
  const compEdgeSigs = new Set(compressedEdges.map(edgeSignatureV0));
  /** @type {object[]} */
  const weakened = [];

  for (const e of rawEdges) {
    if (!CRITICAL_EDGE_RELATIONS_V0.has(e.relation)) continue;
    const sig = edgeSignatureV0(e);
    if (compEdgeSigs.has(sig)) continue;

    const fromKept = compressedNodeIds.has(e.from);
    const toKept = compressedNodeIds.has(e.to);
    const bothExisted = rawNodeIds.has(e.from) && rawNodeIds.has(e.to);

    if (bothExisted && fromKept && toKept) {
      weakened.push(
        Object.freeze({
          code: "causal_edge_semantic_loss",
          severity: "high",
          relation: e.relation,
          from: e.from,
          to: e.to,
          hint: "Endpoints survived but causal link removed — neden-sonuç zayıfladı"
        })
      );
    } else if (bothExisted && (!fromKept || !toKept)) {
      weakened.push(
        Object.freeze({
          code: "causal_path_broken",
          severity: "medium",
          relation: e.relation,
          from: e.from,
          to: e.to,
          fromKept,
          toKept,
          hint: "Causal path endpoint pruned — chain interrupted"
        })
      );
    }
  }

  return weakened;
}

/**
 * @param {object[]} rawNodes
 * @param {object[]} compressedNodes
 */
function detectDomainInfluenceDegradationV0(rawNodes, compressedNodes) {
  const rawByDomain = countByDomainV0(rawNodes);
  const compByDomain = countByDomainV0(compressedNodes);
  const domains = new Set([...Object.keys(rawByDomain), ...Object.keys(compByDomain)]);
  /** @type {object[]} */
  const influence = [];

  for (const domain of domains) {
    const raw = rawByDomain[domain] || 0;
    const comp = compByDomain[domain] || 0;
    const retention = raw > 0 ? Math.round((comp / raw) * 1000) / 1000 : 1;
    const degraded = raw > 0 && retention < 0.5;
    influence.push(
      Object.freeze({
        domain,
        rawNodes: raw,
        compressedNodes: comp,
        retention,
        degraded,
        hint: degraded ? "Domain narrative influence significantly compressed" : null
      })
    );
  }

  return Object.freeze(influence);
}

/**
 * @param {object} compressionStats
 * @param {object[]} compressedNodes
 */
function detectAcceptableSemanticCompressionV0(compressionStats, compressedNodes) {
  /** @type {object[]} */
  const notes = [];
  if (compressionStats?.replayBranchesDropped > 0) {
    notes.push(
      Object.freeze({
        code: "replay_branch_collapsed",
        severity: "low",
        count: compressionStats.replayBranchesDropped,
        acceptable: true,
        hint: "Duplicate replay branches removed — no unique causal meaning lost"
      })
    );
  }
  if (compressionStats?.temporalTrailClustered > 0) {
    notes.push(
      Object.freeze({
        code: "temporal_trail_clustered",
        severity: "low",
        count: compressionStats.temporalTrailClustered,
        acceptable: true,
        hint: "Temporal markers clustered — event history summarized, not erased"
      })
    );
  }
  const clusters = compressedNodes.filter((n) => n.kind === "temporal_trail_cluster");
  for (const c of clusters) {
    notes.push(
      Object.freeze({
        code: "cluster_summary",
        severity: "info",
        clusterId: c.id,
        memberCount: c.memberCount,
        acceptable: true,
        hint: c.label
      })
    );
  }
  return Object.freeze(notes);
}

/**
 * Compare raw vs compressed causal graph — semantic truth loss report.
 * @param {object} raw
 * @param {object} compressed
 */
export function detectTruthLossV0(raw, compressed) {
  const rawNodes = Array.isArray(raw?.nodes) ? raw.nodes : [];
  const rawEdges = Array.isArray(raw?.edges) ? raw.edges : [];
  const compNodes = Array.isArray(compressed?.nodes) ? compressed.nodes : [];
  const compEdges = Array.isArray(compressed?.edges) ? compressed.edges : [];
  const stats = compressed?.stats || raw?.compression || {};

  const rawNodeIds = new Set(rawNodes.map((n) => n.id));
  const compNodeIds = new Set(compNodes.map((n) => n.id));

  const criticalLosses = detectDroppedCriticalNodesV0(rawNodes, compNodes);
  const weakenedPaths = detectWeakenedCausalPathsV0(rawEdges, compEdges, rawNodeIds, compNodeIds);
  const domainInfluence = detectDomainInfluenceDegradationV0(rawNodes, compNodes);
  const acceptableCompression = detectAcceptableSemanticCompressionV0(stats, compNodes);

  const highSeverity = [
    ...criticalLosses.filter((l) => l.severity === "high"),
    ...weakenedPaths.filter((p) => p.severity === "high")
  ];
  const degradedDomains = domainInfluence.filter((d) => d.degraded);

  const compressionRatio = Number(stats.compressionRatio) || 0;
  const semanticOverCompression =
    compressionRatio >= SEMANTIC_LOSS_REVIEW_RATIO_V0 && highSeverity.length > 0;

  const pass = highSeverity.length === 0 && degradedDomains.length === 0;

  const selfExplanation = buildTruthLossNarrativeV0({
    pass,
    highSeverity,
    weakenedPaths,
    degradedDomains,
    compressionRatio,
    semanticOverCompression,
    acceptableCompression
  });

  return Object.freeze({
    schema: RHIZOH_TRUTH_LOSS_DETECTOR_SCHEMA_V0,
    evaluatedAtMs: Date.now(),
    influencesExecution: false,
    pass,
    semanticOverCompression,
    compressionRatio,
    criticalLossCount: criticalLosses.length,
    weakenedPathCount: weakenedPaths.length,
    degradedDomainCount: degradedDomains.length,
    criticalLosses: Object.freeze(criticalLosses),
    weakenedPaths: Object.freeze(weakenedPaths),
    domainInfluence,
    acceptableCompression,
    selfExplanation
  });
}

/**
 * @param {object} ctx
 */
function buildTruthLossNarrativeV0(ctx) {
  if (ctx.pass) {
    const acceptable = ctx.acceptableCompression?.length
      ? ` Acceptable compression: ${ctx.acceptableCompression.map((a) => a.code).join(", ")}.`
      : "";
    return `No semantic truth loss detected (ratio ${ctx.compressionRatio}). Causal meaning preserved.${acceptable}`;
  }
  const parts = [
    `Semantic truth loss detected (ratio ${ctx.compressionRatio}).`,
    ctx.highSeverity.length
      ? `${ctx.highSeverity.length} critical loss(es).`
      : null,
    ctx.weakenedPaths.length
      ? `${ctx.weakenedPaths.length} weakened causal path(s).`
      : null,
    ctx.degradedDomains.length
      ? `${ctx.degradedDomains.length} domain influence degrade(s).`
      : null,
    ctx.semanticOverCompression ? "Over-compression: causal meaning at risk." : null
  ].filter(Boolean);
  return parts.join(" ");
}

/**
 * @param {object} raw
 * @param {object} compressed
 */
export function publishTruthLossDetectorV0(raw, compressed) {
  const report = detectTruthLossV0(raw, compressed);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.truthLoss = report;
    window.__rhizoh.detectTruthLossV0 = detectTruthLossV0;
  }
  return report;
}
