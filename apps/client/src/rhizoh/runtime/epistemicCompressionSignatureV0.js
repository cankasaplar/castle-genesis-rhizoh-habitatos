/**
 * Phase 9.4.5 — Epistemic Compression & Signature Layer.
 *
 * event trace → semantic fingerprint · pattern → cluster identity · coherence drift → topology signature
 * Read-only compression — no write to execution, witness, or navigation.
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §15.5
 */

import { EPISTEMIC_EVENT_CLASS_V0 } from "./epistemicEventBusV0.js";

export const EPISTEMIC_COMPRESSION_SIGNATURE_SCHEMA_V0 =
  "castle.rhizoh.epistemic_compression_signature.v0.4.5";

export const EPISTEMIC_COMPRESSION_MODE_V0 = "compression_read_only";

/**
 * @param {string} str
 * @returns {string}
 */
function djb2HexV0(str) {
  let h = 5381;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * @param {readonly import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]} trace
 */
function buildKindHistogramV0(trace) {
  /** @type {Record<string, number>} */
  const hist = {};
  for (const e of trace) {
    const k = `${e.eventClass}:${e.kind}`;
    hist[k] = (hist[k] || 0) + 1;
  }
  return hist;
}

/**
 * @param {readonly import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]} trace
 */
export function deriveTraceSemanticFingerprintV0(trace) {
  const sorted = [...trace].sort((a, b) => a.seq - b.seq);
  const digestParts = sorted.map(
    (e) => `${e.seq}|${e.eventClass}|${e.kind}|${e.nodeId}|${Math.round((e.severity || 0) * 100)}`
  );
  const digest = digestParts.join(";");
  const hex = djb2HexV0(digest);
  return {
    fingerprint: `epi_trace_fp_${hex}`,
    digestLength: digestParts.length,
    kindHistogram: buildKindHistogramV0(sorted)
  };
}

/**
 * @param {import('./replayFeedbackAnalysisV0.js').EpistemicPatternV0[]} patterns
 */
export function derivePatternClusterIdentitiesV0(patterns) {
  /** @type {Map<string, { kind: string, patternIds: string[], severities: number[], evidence: number[] }>} */
  const byKind = new Map();

  for (const p of patterns || []) {
    const kind = String(p.kind || "unknown");
    const bucket = byKind.get(kind) || {
      kind,
      patternIds: [],
      severities: [],
      evidence: []
    };
    bucket.patternIds.push(p.id);
    bucket.severities.push(Number(p.severity) || 0);
    bucket.evidence.push(...(p.evidenceSeqs || []));
    byKind.set(kind, bucket);
  }

  return [...byKind.values()].map((b) => {
    const avgSeverity =
      b.severities.length > 0
        ? b.severities.reduce((a, c) => a + c, 0) / b.severities.length
        : 0;
    const clusterBasis = `${b.kind}|${b.patternIds.join(",")}|${avgSeverity.toFixed(3)}`;
    return Object.freeze({
      clusterId: `epi_cluster_${b.kind}_${djb2HexV0(clusterBasis).slice(0, 8)}`,
      patternKind: b.kind,
      memberPatternIds: [...b.patternIds],
      avgSeverity: Number(avgSeverity.toFixed(4)),
      evidenceSeqCount: b.evidence.length,
      clusterSignature: `epi_pcluster_${djb2HexV0(clusterBasis)}`
    });
  });
}

/**
 * @param {readonly import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]} trace
 * @param {import('./epistemicSimResearchStoreV0.js').EpistemicSimResearchSnapshotV0 | null} [simSnapshot]
 */
export function deriveTopologyDriftSignatureV0(trace, simSnapshot = null) {
  const physics = trace.filter((e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.PHYSICS);

  const gravities = [];
  const stresses = [];
  /** @type {Record<string, number>} */
  const nodeStressMap = {};

  for (const e of physics) {
    const snap = e.physicsSnapshot;
    if (snap?.navigationalGravity != null) gravities.push(Number(snap.navigationalGravity));
    if (snap?.movementCost != null) stresses.push(Number(snap.movementCost));
    const nid = e.nodeId || "node:unknown";
    nodeStressMap[nid] = (nodeStressMap[nid] || 0) + (Number(e.severity) || 0);
  }

  const coherenceMean =
    gravities.length > 0 ? gravities.reduce((a, c) => a + c, 0) / gravities.length : null;
  const stressMean =
    stresses.length > 0 ? stresses.reduce((a, c) => a + c, 0) / stresses.length : null;

  const liveCoherence = simSnapshot?.coherenceGradient;
  const liveSplitBrain = simSnapshot?.epistemicSplitBrainScore;
  const coherenceDrift =
    liveCoherence != null && coherenceMean != null
      ? Number((liveCoherence - coherenceMean).toFixed(4))
      : null;

  const topologyBasis = JSON.stringify({
    coherenceMean,
    stressMean,
    coherenceDrift,
    liveSplitBrain: liveSplitBrain ?? null,
    nodeStressMap,
    stabilizationMode: simSnapshot?.stabilizationMode ?? null
  });

  return Object.freeze({
    coherenceDriftSlope: coherenceDrift,
    splitBrainBand: liveSplitBrain ?? null,
    meanNavigationalGravity: coherenceMean != null ? Number(coherenceMean.toFixed(4)) : null,
    meanMovementCost: stressMean != null ? Number(stressMean.toFixed(4)) : null,
    nodeStressMap,
    topologySignature: `epi_topo_${djb2HexV0(topologyBasis)}`
  });
}

/**
 * @param {{
 *   trace: readonly import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0[],
 *   analysisReport?: import('./replayFeedbackAnalysisV0.js').ReplayFeedbackAnalysisReportV0 | null,
 *   simSnapshot?: import('./epistemicSimResearchStoreV0.js').EpistemicSimResearchSnapshotV0 | null
 * }} input
 */
export function buildEpistemicCompressionSignatureV0(input) {
  const trace = Array.isArray(input.trace) ? input.trace : [];
  const analysis = input.analysisReport ?? null;
  const simSnapshot = input.simSnapshot ?? null;

  const traceFp = deriveTraceSemanticFingerprintV0(trace);
  const patternClusters = derivePatternClusterIdentitiesV0(analysis?.patterns || []);
  const topology = deriveTopologyDriftSignatureV0(trace, simSnapshot);

  const seqs = trace.map((e) => e.seq);
  const composedBasis = JSON.stringify({
    traceFp: traceFp.fingerprint,
    clusters: patternClusters.map((c) => c.clusterSignature),
    topology: topology.topologySignature,
    dominantPattern: analysis?.summary?.dominantPattern ?? null
  });

  const report = {
    schema: EPISTEMIC_COMPRESSION_SIGNATURE_SCHEMA_V0,
    mode: EPISTEMIC_COMPRESSION_MODE_V0,
    witnessWrite: false,
    feedbackLoop: false,
    executionWrite: false,
    patternInterpretationInflationRisk: "analysis_must_not_drive_navigation_or_witness",
    compressedAtMs: Date.now(),
    traceLength: trace.length,
    seqRange: {
      min: seqs.length ? Math.min(...seqs) : 0,
      max: seqs.length ? Math.max(...seqs) : 0
    },
    traceSemanticFingerprint: traceFp.fingerprint,
    traceDigest: {
      digestLength: traceFp.digestLength,
      kindHistogram: traceFp.kindHistogram
    },
    patternClusters,
    topologySignature: topology,
    composedSignature: `epi_sig_${djb2HexV0(composedBasis)}`,
    linkedAnalysisMode: analysis?.mode ?? null
  };

  return Object.freeze(report);
}

/**
 * @param {import('./epistemicCompressionSignatureV0.js').EpistemicCompressionSignatureReportV0} [report]
 */
export function exportEpistemicCompressionSignatureJsonV0(report) {
  return JSON.stringify(
    report || {
      schema: EPISTEMIC_COMPRESSION_SIGNATURE_SCHEMA_V0,
      mode: EPISTEMIC_COMPRESSION_MODE_V0,
      empty: true
    },
    null,
    2
  );
}
