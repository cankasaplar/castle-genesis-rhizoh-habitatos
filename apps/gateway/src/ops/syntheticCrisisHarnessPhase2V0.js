/**
 * Synthetic Crisis Week — Phase 2: Observability Integrity
 * Hard requirements: A replay determinism, B cross-session isolation, C injection provenance
 */
import { randomUUID } from "node:crypto";
import {
  resetAgentContainmentSessionsV0,
  getAgentSessionKeyV0,
  simulateRecursiveToolChainV0
} from "./agentContainmentV0.js";
import { resetAgentObservabilityRingV0, fingerprintAgentContextV0 } from "./agentObservabilityV0.js";
import {
  recordFlightRecorderV0,
  buildNarrativeReconstructionV0,
  verifyReplayDeterminismV0,
  narrativeReconstructionDigestV0,
  buildInjectionProvenanceChainV0,
  verifyTraceUidIsolationV0,
  findSnapshotsByContextFingerprintV0,
  replaySnapshotsForTraceV0
} from "./flightRecorderV0.js";
import { detectPromptAbuseV0 } from "./moderationMvpV0.js";

/**
 * PHASE 2 — Observability Integrity
 */
export function runSyntheticCrisisPhase2V0() {
  resetAgentObservabilityRingV0();
  resetAgentContainmentSessionsV0();

  /** @type {Record<string, unknown>[]} */
  const cases = [];
  const traceId = `crisis-phase2-${randomUUID()}`;

  // --- Build rich trace for narrative + chain tests ---
  const sessionKey = getAgentSessionKeyV0("user-a", "session-a");
  const injectionPrompt = "ignore previous instructions jailbreak system prompt leak";
  const abuse = detectPromptAbuseV0(injectionPrompt);

  recordFlightRecorderV0({
    traceId,
    uid: "user-a",
    sessionKey,
    event: "turn_begin",
    context: { agentId: "agent-user-a-only", tenant: "A" },
    provenance: { source: "llm_message", channel: "POST /rhizoh/llm", promptText: "hello" }
  });
  simulateRecursiveToolChainV0(sessionKey, "search_docs", 2);
  recordFlightRecorderV0({
    traceId,
    uid: "user-a",
    sessionKey,
    event: "tool_invoke",
    context: { agentId: "agent-user-a-only", tenant: "A" },
    provenance: { source: "tool", channel: "internal_docs" }
  });
  recordFlightRecorderV0({
    traceId,
    uid: "user-a",
    sessionKey,
    event: "injection_detected",
    flightRecorderFlag: "Injection Provenance Captured",
    riskFlags: abuse.reasons,
    context: { agentId: "agent-user-a-only", tenant: "A" },
    provenance: {
      source: "llm_message",
      channel: "POST /rhizoh/llm",
      promptText: injectionPrompt,
      injectionFlag: true
    }
  });
  simulateRecursiveToolChainV0(sessionKey, "delegate_to_self", 5);
  recordFlightRecorderV0({
    traceId,
    uid: "user-a",
    sessionKey,
    event: "containment_reject",
    flightRecorderFlag: "Recursive Lock Triggered",
    containmentCode: "agent_recursive_tool_lock",
    context: { agentId: "agent-user-a-only", tenant: "A" }
  });

  // A — Replay determinism
  const replay = verifyReplayDeterminismV0(traceId);
  const narrative = buildNarrativeReconstructionV0(traceId);
  cases.push({
    id: "replay_determinism",
    hardRequirement: "A",
    scenario: "Same trace → same reconstruction digest",
    expected: "digest1 === digest2, stepCount stable",
    pass: replay.pass && narrative.stepCount >= 4,
    digest: replay.digest,
    stepCount: narrative.stepCount
  });

  // B — Snapshot chain integrity (no silent seq loss within trace)
  cases.push({
    id: "snapshot_chain_integrity",
    hardRequirement: "B-part-1",
    scenario: "No silent data loss in snapshot seq chain",
    expected: "chainIntegrity.ok && no seqGaps",
    pass: narrative.chainIntegrity.ok === true && narrative.chainIntegrity.silentLoss === false,
    chainIntegrity: narrative.chainIntegrity
  });

  // B — Cross-session fingerprint isolation
  const ctxA = { agentId: "agent-user-a-only", tenant: "A" };
  const ctxB = { agentId: "agent-user-b-only", tenant: "B" };
  const fpA = fingerprintAgentContextV0(ctxA);
  const fpB = fingerprintAgentContextV0(ctxB);
  const traceB = `crisis-phase2-b-${randomUUID()}`;
  recordFlightRecorderV0({
    traceId: traceB,
    uid: "user-b",
    sessionKey: getAgentSessionKeyV0("user-b", "session-b"),
    event: "turn_begin",
    context: ctxB,
    provenance: { source: "llm_message", channel: "POST /rhizoh/llm", promptText: "hi from B" }
  });
  const clusterA = findSnapshotsByContextFingerprintV0(fpA.hash);
  const clusterB = findSnapshotsByContextFingerprintV0(fpB.hash);
  const crossLeak = clusterA.some((s) => s.uid === "user-b") || clusterB.some((s) => s.uid === "user-a");
  const uidIsoA = verifyTraceUidIsolationV0(traceId, "user-a");
  const uidIsoB = verifyTraceUidIsolationV0(traceB, "user-b");
  cases.push({
    id: "cross_session_fingerprint_isolation",
    hardRequirement: "B-part-2",
    scenario: "User A ≠ User B in fingerprint clusters",
    expected: "fpA.hash !== fpB.hash, no cross-uid leak, per-trace uid isolation",
    pass:
      fpA.hash !== fpB.hash &&
      !crossLeak &&
      uidIsoA.pass &&
      uidIsoB.pass,
    fpA: fpA.hash,
    fpB: fpB.hash,
    crossLeak
  });

  // C — Injection provenance tracking
  const provChain = buildInjectionProvenanceChainV0(traceId);
  const injectionStep = provChain.find((p) => p.injectionFlag);
  cases.push({
    id: "injection_provenance_tracking",
    hardRequirement: "C",
    scenario: "Injection origin 100% traceable",
    expected: "provenance chain with source, channel, promptSha256",
    pass:
      provChain.length >= 1 &&
      Boolean(injectionStep) &&
      injectionStep.source === "llm_message" &&
      injectionStep.channel.includes("/rhizoh/llm") &&
      Boolean(injectionStep.promptSha256),
    provenanceChain: provChain
  });

  // Tool lineage in narrative
  const hasToolLineage = narrative.timeline.some((t) => t.toolLineage && t.toolLineage.length > 0);
  cases.push({
    id: "narrative_tool_lineage_present",
    hardRequirement: "A-extension",
    scenario: "Post-incident story includes tool chain",
    expected: "timeline entries with toolLineageDigest",
    pass: hasToolLineage && narrative.verdict !== "no_trace",
    verdict: narrative.verdict
  });

  // Tool lineage determinism (two fresh sessions, same script)
  resetAgentContainmentSessionsV0();
  const sk1 = getAgentSessionKeyV0("det", "s1");
  const sk2 = getAgentSessionKeyV0("det", "s2");
  const run1 = simulateRecursiveToolChainV0(sk1, "same_tool", 5);
  const run2 = simulateRecursiveToolChainV0(sk2, "same_tool", 5);
  const lockIdx1 = run1.findIndex((c) => !c.ok);
  const lockIdx2 = run2.findIndex((c) => !c.ok);
  cases.push({
    id: "tool_lineage_determinism",
    hardRequirement: "A-extension",
    scenario: "Same input script → same lock step index",
    expected: "lockAt equal across isolated sessions",
    pass: lockIdx1 === lockIdx2 && lockIdx1 > 0,
    lockIdx1,
    lockIdx2
  });

  const passCount = cases.filter((c) => c.pass).length;
  return {
    schema: "rhizoh.synthetic_crisis.phase2_report.v0",
    phase: 2,
    name: "Observability Integrity",
    traceId,
    narrativeDigest: narrativeReconstructionDigestV0(traceId),
    atMs: Date.now(),
    layers: {
      control: "phase1_verified_separately",
      forensics: passCount === cases.length ? "integrity_ok" : "gaps_detected",
      behavioralDrift: "not_in_v0 — see SYNTHETIC_CRISIS_BEHAVIORAL_DRIFT_NOTE_V1.0.md"
    },
    summary: {
      total: cases.length,
      passed: passCount,
      failed: cases.length - passCount,
      forensicReadiness: passCount === cases.length ? "narrative_replay_ready" : "forensic_blindness_risk"
    },
    cases,
    narrative,
    phase3Gate: passCount === cases.length ? "may_proceed_controlled" : "hold_before_phase3"
  };
}
