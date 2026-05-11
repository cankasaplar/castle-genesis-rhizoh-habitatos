/**
 * Gateway — R6 halka tampon + isteğe bağlı JSONL; R7 aktif/shadow/canary policy JSON env yükleme.
 */
import fs from "node:fs";

import {
  RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION,
  normalizeRhizohConstitutionalPolicyPackage,
  mergeRhizohConstitutionalGovernanceThresholds,
  rhizohConstitutionalStableBucketUnderPct,
  compareRhizohConstitutionalShadowDecisions,
  evaluateRhizohConstitutionalRollbackTriggers
} from "../../client/src/rhizoh/constitution/constitutionalPolicyGovernanceV1.js";
import {
  normalizeRhizohConstitutionalFeedbackEvent,
  appendRhizohConstitutionalFeedbackRing,
  aggregateRhizohConstitutionalFeedbackWindow,
  proposeRhizohConstitutionalPolicyTuningFromAggregate,
  RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION
} from "../../client/src/rhizoh/constitution/constitutionalFeedbackLearningLoopV1.js";

/** @type {Record<string, unknown>[]} */
const FEEDBACK_RING = [];

export { RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION, RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION };

/**
 * @param {string} envKey
 */
function loadPolicyPackageFromEnv(envKey) {
  const raw = process.env[envKey];
  if (raw == null || !String(raw).trim()) return null;
  try {
    const parsed = JSON.parse(String(raw));
    return normalizeRhizohConstitutionalPolicyPackage(parsed);
  } catch {
    return null;
  }
}

/**
 * @param {string} traceId
 */
export function getRhizohGatewayConstitutionalGovernanceContextForTurn(traceId) {
  const activePkg = loadPolicyPackageFromEnv("CASTLE_RHIZOH_GOVERNANCE_POLICY_JSON");
  const shadowPkg = loadPolicyPackageFromEnv("CASTLE_RHIZOH_GOVERNANCE_SHADOW_POLICY_JSON");
  const canaryPkg = loadPolicyPackageFromEnv("CASTLE_RHIZOH_GOVERNANCE_CANARY_POLICY_JSON");
  const canaryPct = Number(process.env.CASTLE_RHIZOH_GOVERNANCE_CANARY_PCT || 0);

  const useCanary =
    canaryPct > 0 && canaryPkg != null && rhizohConstitutionalStableBucketUnderPct(traceId, canaryPct);

  const primaryPkg = useCanary && canaryPkg != null ? canaryPkg : activePkg;

  const primaryThresholds = mergeRhizohConstitutionalGovernanceThresholds(primaryPkg);
  const primaryPolicyId =
    primaryPkg?.policyId != null && String(primaryPkg.policyId).trim()
      ? String(primaryPkg.policyId)
      : useCanary
        ? "rhizoh.gateway.canary_decision.v1"
        : "rhizoh.gateway.production_decision.v1";

  const shadowThresholds =
    shadowPkg != null ? mergeRhizohConstitutionalGovernanceThresholds(shadowPkg) : null;

  return {
    primaryThresholds,
    primaryPolicyVersion: primaryPkg?.policyVersion ?? "baseline",
    primaryLifecycleStatus: primaryPkg?.status ?? null,
    primaryPolicyId,
    shadowThresholds,
    shadowPolicyId:
      shadowPkg?.policyId != null && String(shadowPkg.policyId).trim()
        ? String(shadowPkg.policyId)
        : "rhizoh.gateway.shadow_decision.v1",
    shadowPolicyVersion: shadowPkg?.policyVersion ?? null,
    useCanary: Boolean(useCanary)
  };
}

export function recordRhizohGatewayConstitutionalFeedback(snapshot) {
  const ev = normalizeRhizohConstitutionalFeedbackEvent(snapshot);
  const max = Math.max(64, Math.floor(Number(process.env.CASTLE_RHIZOH_FEEDBACK_RING_MAX || 2000)));
  appendRhizohConstitutionalFeedbackRing(FEEDBACK_RING, ev, max);

  const logPath = String(process.env.CASTLE_RHIZOH_FEEDBACK_LOG_PATH || "").trim();
  if (logPath) {
    try {
      fs.appendFileSync(logPath, `${JSON.stringify(ev)}\n`, { encoding: "utf8" });
    } catch {
      /* disk / izin */
    }
  }
}

export function getRhizohGatewayConstitutionalRollbackQuick() {
  const aggregate = aggregateRhizohConstitutionalFeedbackWindow(FEEDBACK_RING);
  return evaluateRhizohConstitutionalRollbackTriggers({
    sampleCount: aggregate.sampleCount,
    rejectRate: aggregate.rejectRate,
    throttleRate: aggregate.throttleRate,
    recoveryRate: aggregate.recoveryRate,
    latencyOkRate: aggregate.latencyOkRate,
    negativeOutcomeRate: aggregate.negativeOutcomeRate
  });
}

export function getRhizohGatewayConstitutionalFeedbackSummary() {
  const aggregate = aggregateRhizohConstitutionalFeedbackWindow(FEEDBACK_RING);
  const proposals = proposeRhizohConstitutionalPolicyTuningFromAggregate(aggregate);
  const rollback = evaluateRhizohConstitutionalRollbackTriggers({
    sampleCount: aggregate.sampleCount,
    rejectRate: aggregate.rejectRate,
    throttleRate: aggregate.throttleRate,
    recoveryRate: aggregate.recoveryRate,
    latencyOkRate: aggregate.latencyOkRate,
    negativeOutcomeRate: aggregate.negativeOutcomeRate
  });
  return {
    aggregate,
    proposals,
    rollback,
    governanceVersion: RHIZOH_CONSTITUTIONAL_POLICY_GOVERNANCE_VERSION,
    feedbackLoopVersion: RHIZOH_CONSTITUTIONAL_FEEDBACK_LOOP_VERSION
  };
}

export function compareRhizohGatewayShadowDecisions(primary, shadow) {
  return compareRhizohConstitutionalShadowDecisions(primary, shadow);
}
