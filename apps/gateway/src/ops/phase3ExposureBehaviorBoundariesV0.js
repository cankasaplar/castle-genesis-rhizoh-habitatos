/**
 * Open exposure behavior boundaries — tests & verifies (no new runtime layer).
 * @see docs/ops/PHASE3D_OPEN_EXPOSURE_BEHAVIOR_BOUNDARIES_V1.0.md
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyControlPathFirewallV0 } from "./phase3ControlObservationFirewallV0.js";
import { validateProposalQueueV0 } from "./phase3DProposalQueueV0.js";
import { validateShadowLearningExportV0 } from "./phase3DShadowLearningBoundaryV0.js";
import {
  validateAuthorityPerceptionContractV0,
  AUTHORITY_PERCEPTION_FAILURE_MODES_V0,
  RHIZOH_PRIMARY_RISK_DOMAIN_V0
} from "./authorityPerceptionFailureModesV0.js";

export const EXPOSURE_BEHAVIOR_SCHEMA_V0 = "rhizoh.phase3.exposure_behavior_boundaries.v0";

/** Imperative / authority phrases forbidden in observation-side exports. */
export const FORBIDDEN_AUTHORITY_PHRASES_V0 = Object.freeze([
  /you should/i,
  /you must/i,
  /system advises/i,
  /rhizoh decided/i,
  /recommend deploy/i,
  /auto[- ]?apply/i,
  /go live now/i
]);

/** Fields that must not drive execution gate (re-export check list). */
export const FEEDBACK_LOOP_FORBIDDEN_EXECUTION_INPUTS_V0 = Object.freeze([
  "proposalQueue",
  "phase3DAttractorIntelligence",
  "primaryAttractor",
  "perturbationSensitivityMap",
  "operabilityBalance",
  "phase3dObservationGate"
]);

/**
 * User-misunderstanding scenarios (static — for counsel / QA).
 */
export const MISUNDERSTANDING_SCENARIOS_V0 = Object.freeze([
  Object.freeze({
    id: "M1_attractor_as_command",
    userBelief: "primaryAttractor means system wants this mode",
    engineeringTruth: "empirical basin label only; feedsExecution false",
    mitigation: "UX label: observed region not recommendation"
  }),
  Object.freeze({
    id: "M2_proposal_auto_applied",
    userBelief: "pending_human proposal already changed thresholds",
    engineeringTruth: "config unchanged until applied_config + human publish",
    mitigation: "Show proposal state + explicit not applied banner"
  }),
  Object.freeze({
    id: "M3_observation_gate_as_deploy",
    userBelief: "phase3dObservationGate is go-live approval",
    engineeringTruth: "audit readiness only; phase3ExecutionGate is control",
    mitigation: "Never surface observation gate as user-facing deploy"
  }),
  Object.freeze({
    id: "M4_telemetry_soft_steering",
    userBelief: "system learned my behavior and adapted gates to me",
    engineeringTruth: "telemetry may affect control gates; shadow proposals require human apply",
    mitigation: "Disclose path; audit proposal evidence for cohort bias"
  }),
  Object.freeze({
    id: "M5_passive_entity_anthropomorphism",
    userBelief: "Rhizoh understands me",
    engineeringTruth: "rich reflector surface; not agency",
    mitigation: "Interpretation layer boundary; counsel UX review"
  })
]);

/**
 * @param {string} jsonText
 */
export function scanForbiddenAuthorityPhrasesV0(jsonText) {
  const hits = [];
  for (const re of FORBIDDEN_AUTHORITY_PHRASES_V0) {
    if (re.test(jsonText)) hits.push(re.source);
  }
  return Object.freeze({ ok: hits.length === 0, hits: Object.freeze(hits) });
}

/**
 * @param {ReturnType<import("./phase3HarnessExportV0.js").runPhase3ExecutionSpecHarnessV0>} harnessExport
 */
export function verifyFeedbackLoopHumanOnlyV0(harnessExport) {
  const violations = [];
  const control = harnessExport.phase3Control ?? {};
  const obs = harnessExport.phase3Observation ?? {};
  const gateSource = JSON.stringify(control);

  for (const key of FEEDBACK_LOOP_FORBIDDEN_EXECUTION_INPUTS_V0) {
    if (gateSource.includes(`"${key}"`) && control.phase3ExecutionGate) {
      violations.push(`execution_gate_must_not_reference:${key}`);
    }
  }
  if (obs.feedsExecution === true) violations.push("observation_feedsExecution");
  if (harnessExport.phase3ExecutionGate !== control.phase3ExecutionGate) {
    violations.push("top_level_execution_gate_must_match_control_only");
  }
  if (obs.proposalQueue?.feedsExecution !== false) violations.push("proposal_queue_feedsExecution");
  const applied = (obs.proposalQueue?.proposals ?? []).filter(
    (p) => p.state === "applied_config"
  );
  if (applied.length && !applied.every((p) => p.auditTrail?.length >= 4)) {
    violations.push("applied_config_requires_full_human_audit_trail");
  }

  return Object.freeze({
    ok: violations.length === 0,
    violations: Object.freeze(violations),
    path: "observation→proposal→config→execution_human_only"
  });
}

/**
 * @param {ReturnType<import("./phase3HarnessExportV0.js").runPhase3ExecutionSpecHarnessV0>} harnessExport
 */
export function runExposureBehaviorBoundaryHarnessV0(harnessExport) {
  const controlPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "phase3ControlledDivergenceRuntimeV0.js"
  );
  const controlSource = readFileSync(controlPath, "utf8");
  const firewall = verifyControlPathFirewallV0(controlSource);
  const feedback = verifyFeedbackLoopHumanOnlyV0(harnessExport);
  const obs = harnessExport.phase3Observation ?? {};
  const authorityScan = scanForbiddenAuthorityPhrasesV0(JSON.stringify(obs));
  const shadow = validateShadowLearningExportV0(obs);
  const queue = obs.proposalQueue
    ? validateProposalQueueV0(obs.proposalQueue)
    : { ok: false, violations: ["missing_proposal_queue"] };
  const authorityPerception = validateAuthorityPerceptionContractV0(obs);

  const openRisks = Object.freeze({
    feedbackLoopLeakage: feedback.ok ? "mitigated_human_only" : "investigate",
    humanBottleneck: "operational_cadence_required",
    proposalQualityDrift: "monitor_stats_and_reject_path",
    interpretiveLeakage: authorityScan.ok ? "phrases_clean_in_export" : "phrase_hits",
    schemaInflation: "require_explicit_schema_bump_per_new_field"
  });

  const pass =
    firewall.ok &&
    feedback.ok &&
    authorityScan.ok &&
    shadow.ok &&
    queue.ok &&
    authorityPerception.ok;

  return Object.freeze({
    schema: EXPOSURE_BEHAVIOR_SCHEMA_V0,
    atMs: new Date().toISOString(),
    pass: pass ? "exposure_behavior_boundaries_pass" : "hold_exposure_behavior_review",
    primaryRiskDomain: RHIZOH_PRIMARY_RISK_DOMAIN_V0,
    checks: Object.freeze({
      controlPathFirewall: firewall,
      feedbackLoopHumanOnly: feedback,
      authorityPhraseScan: authorityScan,
      authorityPerceptionContract: authorityPerception,
      shadowLearning: shadow,
      proposalQueue: queue
    }),
    authorityPerceptionFailureModes: AUTHORITY_PERCEPTION_FAILURE_MODES_V0,
    misunderstandingScenarios: MISUNDERSTANDING_SCENARIOS_V0,
    openRisks,
    stableOnOpen: Object.freeze({
      phase3Deterministic: true,
      phase3dObservationOnly: true,
      modeBProposalOnly: true,
      executionIsolatedFromShadow: firewall.ok
    })
  });
}
