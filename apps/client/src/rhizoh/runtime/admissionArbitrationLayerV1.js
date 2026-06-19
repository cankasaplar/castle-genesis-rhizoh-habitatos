/**
 * Admission Arbitration Layer v1 — deterministic policy gate on stabilized projections.
 * fusion ≠ authority · stabilization = advisory · arbitration = inference eligibility only.
 * NEVER: fusion output writer, probabilistic filter, auto reality mutation.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_ADMISSION_ARBITRATION_LAYER_V1.md
 */

import {
  CROSS_SPACE_STABILIZATION_EVENT_V0,
  getCrossSpaceStabilizationSnapshotV0
} from "./crossSpaceStabilizationLayerV0.js";

export const ADMISSION_ARBITRATION_SCHEMA_V1 = "castle.rhizoh.admission_arbitration.v1";
export const ADMISSION_ARBITRATION_EVENT_V1 = "rhizoh:admission-arbitration-v1";

export const ADMISSION_VERDICT_V1 = Object.freeze({
  INFERENCE_ELIGIBLE: "inference_eligible",
  HOLD: "hold",
  HUMAN_ATTESTATION_REQUIRED: "human_attestation_required"
});

/** Active authority model — explicit rejection of unsafe alternatives. */
export const ADMISSION_AUTHORITY_MODEL_V1 = Object.freeze({
  FUSION_WRITES_ADMISSION: "forbidden",
  HUMAN_ONLY_GATE: "elevation_path_only",
  PROBABILISTIC_FILTER: "forbidden",
  POLICY_ARBITRATION: "active"
});

export const ADMISSION_HOLD_REASON_V1 = Object.freeze({
  PROJECTION_HOLD: "projection_hold",
  COLD_BOOT_NO_SIGNAL: "cold_boot_no_signal",
  PHASE_NOT_ALIGNED: "phase_not_aligned",
  SEPARABILITY_FAIL: "separability_fail",
  EPISTEMIC_OVERLOAD: "epistemic_overload",
  INSUFFICIENT_LANE_EVIDENCE: "insufficient_lane_evidence",
  FUSION_DEFERRED: "fusion_deferred"
});

let arbitrationSeqV1 = 0;
/** @type {object | null} */
let lastArbitrationV1 = null;
/** @type {object[]} */
const arbitrationLogV1 = [];
/** @type {object | null} */
let humanAttestationPendingV1 = null;

function dispatchArbitrationEventV1(detail) {
  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(ADMISSION_ARBITRATION_EVENT_V1, { detail }));
  }
}

/**
 * Count present lanes with separability evidence (deterministic).
 * @param {object} projection
 */
function countLaneEvidenceV1(projection) {
  const separability = projection?.separability;
  if (!separability?.lanes) {
    const audit = projection?.laneAudit;
    if (!audit) return 0;
    return ["chess", "sports", "cux"].filter((k) => audit[k]?.present).length;
  }
  return separability.lanes.filter((l) => l.present && l.aboveThreshold).length;
}

/**
 * Deterministic admission policy — no stochastic scoring.
 * @param {{ projection?: object, phaseContext?: object }} input
 * @param {{ atMs?: number, requestRealityMutation?: boolean, source?: string }} [opts]
 */
export function arbitrateAdmissionV1(input = {}, opts = {}) {
  const atMs = Number(opts.atMs) || input.projection?.atMs || Date.now();
  const projection = input.projection || input;
  const phaseContext = input.phaseContext || {};

  const realityMutationPermitted = false;
  const fusionAuthorityDenied = true;

  if (opts.requestRealityMutation) {
    const verdict = Object.freeze({
      schema: `${ADMISSION_ARBITRATION_SCHEMA_V1}.verdict`,
      arbitrationSeq: ++arbitrationSeqV1,
      verdict: ADMISSION_VERDICT_V1.HUMAN_ATTESTATION_REQUIRED,
      inferenceEligible: false,
      realityMutationPermitted,
      fusionAuthorityDenied,
      authorityModel: ADMISSION_AUTHORITY_MODEL_V1.POLICY_ARBITRATION,
      holdReason: null,
      elevationPath: ADMISSION_AUTHORITY_MODEL_V1.HUMAN_ONLY_GATE,
      projectionRef: projection.stabilizationId || projection.fusionRef || null,
      phaseContext,
      atMs,
      interpretationOnly: true,
      nonExecutive: true,
      orchestratesOnly: true
    });
    lastArbitrationV1 = verdict;
    arbitrationLogV1.unshift(verdict);
    dispatchArbitrationEventV1(verdict);
    return verdict;
  }

  let verdict = ADMISSION_VERDICT_V1.HOLD;
  let holdReason = ADMISSION_HOLD_REASON_V1.PROJECTION_HOLD;

  if (projection.schema?.endsWith(".hold") || projection.holdReason === "fusion_deferred") {
    holdReason = ADMISSION_HOLD_REASON_V1.FUSION_DEFERRED;
  } else if (
    String(opts.source || phaseContext.source || "").startsWith("boot") &&
    countLaneEvidenceV1(projection) < 1
  ) {
    holdReason = ADMISSION_HOLD_REASON_V1.COLD_BOOT_NO_SIGNAL;
  } else if (phaseContext.phaseAligned === false) {
    holdReason = ADMISSION_HOLD_REASON_V1.PHASE_NOT_ALIGNED;
  } else if (projection.load?.overload) {
    holdReason = ADMISSION_HOLD_REASON_V1.EPISTEMIC_OVERLOAD;
  } else if (projection.separability && !projection.separability.separabilityOk) {
    holdReason = ADMISSION_HOLD_REASON_V1.SEPARABILITY_FAIL;
  } else if (countLaneEvidenceV1(projection) < 1) {
    holdReason = ADMISSION_HOLD_REASON_V1.INSUFFICIENT_LANE_EVIDENCE;
  } else if (projection.admissionSafe || projection.projectionTrustClass === "admission_safe") {
    verdict = ADMISSION_VERDICT_V1.INFERENCE_ELIGIBLE;
    holdReason = null;
  } else if (projection.holdReason) {
    holdReason = ADMISSION_HOLD_REASON_V1.PROJECTION_HOLD;
  }

  const inferenceEligible = verdict === ADMISSION_VERDICT_V1.INFERENCE_ELIGIBLE;

  const result = Object.freeze({
    schema: `${ADMISSION_ARBITRATION_SCHEMA_V1}.verdict`,
    arbitrationSeq: ++arbitrationSeqV1,
    arbitrationId: `arb_${arbitrationSeqV1}`,
    verdict,
    inferenceEligible,
    realityMutationPermitted,
    fusionAuthorityDenied,
    authorityModel: ADMISSION_AUTHORITY_MODEL_V1.POLICY_ARBITRATION,
    admissionClass: inferenceEligible ? "inference_only" : "hold",
    holdReason: inferenceEligible ? null : holdReason,
    projectionTrustClass: projection.projectionTrustClass || null,
    laneEvidenceCount: countLaneEvidenceV1(projection),
    projectionRef: projection.stabilizationId || projection.fusionRef || null,
    phaseContext: Object.freeze({
      phaseSeq: phaseContext.phaseSeq ?? null,
      phaseAligned: phaseContext.phaseAligned ?? null,
      source: phaseContext.source || opts.source || null
    }),
    atMs,
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true
  });

  lastArbitrationV1 = result;
  arbitrationLogV1.unshift(result);
  if (arbitrationLogV1.length > 32) arbitrationLogV1.length = 32;

  dispatchArbitrationEventV1(result);
  return result;
}

/**
 * Human elevation path — does NOT auto-admit; records pending attestation only.
 * @param {{ reason?: string, operatorId?: string }} [opts]
 */
export function requestHumanAdmissionAttestationV1(opts = {}) {
  humanAttestationPendingV1 = Object.freeze({
    schema: `${ADMISSION_ARBITRATION_SCHEMA_V1}.human_pending`,
    pending: true,
    reason: String(opts.reason || "reality_mutation_request"),
    operatorId: opts.operatorId || null,
    atMs: Date.now(),
    note: "Human attestation does not auto-grant inference or mutation",
    interpretationOnly: true,
    nonExecutive: true
  });
  return humanAttestationPendingV1;
}

export function getAdmissionArbitrationSnapshotV1() {
  return Object.freeze({
    schema: `${ADMISSION_ARBITRATION_SCHEMA_V1}.snapshot`,
    arbitrationSeq: arbitrationSeqV1,
    lastVerdict: lastArbitrationV1,
    authorityModel: ADMISSION_AUTHORITY_MODEL_V1,
    humanAttestationPending: humanAttestationPendingV1,
    recentVerdicts: Object.freeze(arbitrationLogV1.slice(0, 8)),
    diagnosis: Object.freeze({
      fusionIsAuthority: false,
      realityMutationAutoPath: false,
      probabilisticAdmission: false,
      policyArbitrationActive: true
    }),
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function buildAdmissionArbitrationReportV1() {
  return Object.freeze({
    schema: `${ADMISSION_ARBITRATION_SCHEMA_V1}.report`,
    note: "Deterministic admission arbitration — inference eligibility only, fusion ≠ authority",
    snapshot: getAdmissionArbitrationSnapshotV1(),
    apis: Object.freeze({
      snapshot: "window.__rhizoh.admissionArbitration()",
      arbitrate: "window.__rhizoh.arbitrateAdmission(projection?)",
      humanAttestation: "window.__rhizoh.requestHumanAdmissionAttestation()"
    }),
    atMs: Date.now()
  });
}

export function ensureAdmissionArbitrationLayerV1() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.admissionArbitration) {
    window.__rhizoh.admissionArbitration = () => getAdmissionArbitrationSnapshotV1();
  }
  if (!window.__rhizoh.admissionArbitrationReport) {
    window.__rhizoh.admissionArbitrationReport = () => buildAdmissionArbitrationReportV1();
  }
  if (!window.__rhizoh.arbitrateAdmission) {
    window.__rhizoh.arbitrateAdmission = (projection) =>
      arbitrateAdmissionV1({
        projection: projection || getCrossSpaceStabilizationSnapshotV1().lastProjection
      });
  }
  if (!window.__rhizoh.requestHumanAdmissionAttestation) {
    window.__rhizoh.requestHumanAdmissionAttestation = (opts) =>
      requestHumanAdmissionAttestationV1(opts);
  }

  if (!window.__rhizoh.__admissionArbitrationWired) {
    window.__rhizoh.__admissionArbitrationWired = true;
    window.addEventListener(CROSS_SPACE_STABILIZATION_EVENT_V0, (ev) => {
      arbitrateAdmissionV1({ projection: ev?.detail });
    });
  }

  return window.__rhizoh.admissionArbitration;
}

/** @internal vitest */
export function resetAdmissionArbitrationForTestV1() {
  arbitrationSeqV1 = 0;
  lastArbitrationV1 = null;
  arbitrationLogV1.length = 0;
  humanAttestationPendingV1 = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.__admissionArbitrationWired;
  }
}
