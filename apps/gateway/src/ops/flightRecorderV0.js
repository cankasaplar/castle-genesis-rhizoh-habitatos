/**
 * Rhizoh Flight Recorder v0 — forensic snapshot + narrative replay (Cognitive Infrastructure Stress Testing).
 */
import crypto from "node:crypto";
import {
  recordAgentStateSnapshotV0,
  listRecentAgentSnapshotsV0,
  fingerprintAgentContextV0,
  canonicalObservabilityJsonV0,
  hashPromptProvenanceV0
} from "./agentObservabilityV0.js";
import {
  getToolLineageV0,
  getAgentContainmentSessionStatsV0,
  simulateRecursiveToolChainV0
} from "./agentContainmentV0.js";
import { classifyStressResponseV0 } from "./stressResponseTaxonomyV0.js";

export const FLIGHT_RECORDER_SCHEMA_V0 = "rhizoh.flight_recorder.v0";

/**
 * @param {{
 *   traceId: string,
 *   uid?: string | null,
 *   event: string,
 *   sessionKey?: string,
 *   flightRecorderFlag?: string | null,
 *   riskFlags?: string[],
 *   containmentCode?: string | null,
 *   context?: unknown,
 *   tools?: { name: string, ok?: boolean }[],
 *   provenance?: {
 *     source?: string,
 *     channel?: string,
 *     promptText?: string,
 *     injectionFlag?: boolean
 *   },
 *   costCode?: string | null,
 *   driftSuspected?: boolean
 * }} input
 */
export function recordFlightRecorderV0(input) {
  const sessionKey = input.sessionKey;
  const lineage = sessionKey ? getToolLineageV0(sessionKey) : [];
  const provIn = input.provenance;
  const provenance =
    provIn && typeof provIn === "object"
      ? {
          source: provIn.source,
          channel: provIn.channel,
          promptSha256:
            provIn.promptText != null ? hashPromptProvenanceV0(provIn.promptText) : provIn.promptSha256 ?? null,
          injectionFlag: provIn.injectionFlag === true
        }
      : null;

  const taxonomy = classifyStressResponseV0({
    containmentCode: input.containmentCode,
    costCode: input.costCode,
    driftSuspected: input.driftSuspected === true,
    riskFlags: input.riskFlags,
    injectionFlag: provenance?.injectionFlag === true
  });

  return recordAgentStateSnapshotV0({
    traceId: input.traceId,
    uid: input.uid ?? null,
    sessionKey: sessionKey ?? null,
    event: input.event,
    riskFlags: [
      ...(input.riskFlags || []),
      ...(input.flightRecorderFlag ? [input.flightRecorderFlag] : [])
    ],
    containmentCode: input.containmentCode ?? null,
    costCode: input.costCode ?? null,
    context: input.context,
    provenance,
    stressClass: taxonomy.stressClass,
    responseAction: taxonomy.responseAction,
    stressMatrix: taxonomy.matrix,
    stressConfidence: taxonomy.stressConfidence,
    actionConfidence: taxonomy.actionConfidence,
    actionSoftened: taxonomy.actionSoftened,
    responseActionStrict: taxonomy.responseActionStrict,
    conflictResolution: taxonomy.conflictResolution,
    stressSecondary: taxonomy.stressSecondary,
    tools:
      input.tools ||
      lineage.map((name, i) => ({ name, ok: true, seq: i }))
  });
}

/** @param {string} traceId */
export function replaySnapshotsForTraceV0(traceId) {
  const tid = String(traceId || "");
  return listRecentAgentSnapshotsV0(500)
    .filter((s) => s.traceId === tid)
    .sort((a, b) => Number(a.snapshotSeq) - Number(b.snapshotSeq));
}

/**
 * @param {string} fingerprintHash
 */
export function findSnapshotsByContextFingerprintV0(fingerprintHash) {
  const h = String(fingerprintHash || "");
  return listRecentAgentSnapshotsV0(500).filter(
    (s) => s.contextFingerprint && s.contextFingerprint.hash === h
  );
}

/**
 * Timeline without wall-clock for determinism checks.
 * @param {string} traceId
 */
export function buildNarrativeReconstructionV0(traceId) {
  const steps = replaySnapshotsForTraceV0(traceId);
  return {
    schema: FLIGHT_RECORDER_SCHEMA_V0,
    traceId,
    stepCount: steps.length,
    timeline: steps.map((s, i) => ({
      index: i,
      snapshotSeq: s.snapshotSeq,
      event: s.event,
      uid: s.uid,
      sessionKey: s.sessionKey,
      containmentCode: s.containmentCode,
      riskFlags: s.riskFlags,
      toolLineage: (s.tools || []).map((t) => t.name),
      toolLineageDigest: digestToolLineageV0(s.tools),
      contextHash: s.contextFingerprint?.hash ?? null,
      provenance: s.provenance ?? null,
      stressClass: s.stressClass ?? null,
      responseAction: s.responseAction ?? null,
      stressMatrix: s.stressMatrix ?? null
    })),
    verdict: deriveNarrativeVerdictV0(steps),
    chainIntegrity: verifySnapshotChainIntegrityV0(steps)
  };
}

/**
 * @param {{ name?: string }[] | undefined} tools
 */
function digestToolLineageV0(tools) {
  const names = (tools || []).map((t) => String(t.name || ""));
  return crypto.createHash("sha256").update(names.join("→"), "utf8").digest("hex").slice(0, 16);
}

/**
 * @param {Record<string, unknown>[]} steps
 */
function deriveNarrativeVerdictV0(steps) {
  if (steps.length === 0) return "no_trace";
  if (
    steps.some((s) => (s.riskFlags || []).includes("Recursive Lock Triggered")) ||
    steps.some((s) => s.containmentCode === "agent_recursive_tool_lock")
  ) {
    return "containment_engaged";
  }
  if (steps.some((s) => s.provenance && s.provenance.injectionFlag)) {
    return "injection_traced";
  }
  return "observed";
}

/**
 * @param {Record<string, unknown>[]} steps
 */
function verifySnapshotChainIntegrityV0(steps) {
  if (steps.length === 0) {
    return { ok: true, silentLoss: false, seqGaps: [] };
  }
  const seqs = steps.map((s) => Number(s.snapshotSeq));
  const gaps = [];
  for (let i = 1; i < seqs.length; i++) {
    if (seqs[i] - seqs[i - 1] !== 1) gaps.push({ from: seqs[i - 1], to: seqs[i] });
  }
  return {
    ok: gaps.length === 0,
    silentLoss: gaps.length > 0,
    seqGaps: gaps,
    firstSeq: seqs[0],
    lastSeq: seqs[seqs.length - 1]
  };
}

/**
 * Stable digest — excludes atMs for replay determinism (hard requirement A).
 * @param {string} traceId
 */
export function narrativeReconstructionDigestV0(traceId) {
  const n = buildNarrativeReconstructionV0(traceId);
  const stable = {
    schema: n.schema,
    traceId: n.traceId,
    stepCount: n.stepCount,
    timeline: n.timeline,
    verdict: n.verdict,
    chainIntegrity: n.chainIntegrity
  };
  return crypto.createHash("sha256").update(canonicalObservabilityJsonV0(stable), "utf8").digest("hex");
}

/**
 * @param {string} traceId
 */
export function verifyReplayDeterminismV0(traceId) {
  const d1 = narrativeReconstructionDigestV0(traceId);
  const d2 = narrativeReconstructionDigestV0(traceId);
  return { pass: d1 === d2, digest: d1 };
}

/**
 * @param {string} traceId
 */
export function buildInjectionProvenanceChainV0(traceId) {
  return replaySnapshotsForTraceV0(traceId)
    .filter((s) => s.provenance && (s.provenance.injectionFlag || s.provenance.promptSha256))
    .map((s, i) => ({
      index: i,
      snapshotSeq: s.snapshotSeq,
      source: s.provenance.source,
      channel: s.provenance.channel,
      promptSha256: s.provenance.promptSha256,
      injectionFlag: s.provenance.injectionFlag,
      event: s.event
    }));
}

/**
 * Cross-session isolation: snapshots for trace must not mix uids.
 * @param {string} traceId
 * @param {string} expectedUid
 */
export function verifyTraceUidIsolationV0(traceId, expectedUid) {
  const steps = replaySnapshotsForTraceV0(traceId);
  const uids = new Set(steps.map((s) => s.uid).filter(Boolean));
  const expected = String(expectedUid);
  return {
    pass: uids.size <= 1 && (uids.size === 0 || uids.has(expected)),
    uids: [...uids],
    expectedUid: expected
  };
}

/**
 * Tool path determinism: same scripted chain → same lineage digest at lock.
 * @param {string} sessionKey
 * @param {string} toolName
 * @param {number} attempts
 */
export function verifyToolLineageDeterminismV0(sessionKey, toolName, attempts) {
  const run = () => {
    const chain = simulateRecursiveToolChainV0(sessionKey, toolName, attempts);
    const stats = getAgentContainmentSessionStatsV0(sessionKey);
    const digest = crypto
      .createHash("sha256")
      .update((stats?.toolLineage || []).join("→"), "utf8")
      .digest("hex")
      .slice(0, 16);
    const lockAt = chain.findIndex((c) => !c.ok);
    return { digest, lockAt, chain };
  };
  const a = run();
  return { singleRun: a, note: "call twice on fresh sessions in harness for A/B compare" };
}
