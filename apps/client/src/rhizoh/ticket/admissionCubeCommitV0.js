/**
 * Admission Cube Commit V0 — sole CubeState writer path (SC-02).
 *
 * Commits proposedCubeDelta only after Admission Engine verdict `admit`.
 * interpretationOnly · nonExecutive at proposal layer; commit is explicit authority gate
 * @see docs/RHIZOH_SECURITY_BOUNDARY_V1.md (SC-02)
 */

import {
  ADMISSION_VERDICT_V0,
  evaluateClosedAdmissionV0,
  getAdmittedSubjectReportV0,
  isSubjectAdmittedV0
} from "../ingress/closedUserAdmissionEngineV0.js";
import { normalizeCubeStateV0 } from "../experience/cubeFieldSpiralMathV0.js";
import { RECONCILE_PROPOSAL_SCHEMA_V0 } from "./ticketReconcileProposalV0.js";

export const ADMISSION_CUBE_COMMIT_SCHEMA_V0 = "castle.rhizoh.admission_cube_commit.v0";

/** @type {Map<string, object>} */
const cubeStateStoreV0 = new Map();
/** @type {object[]} */
const commitLedgerV0 = [];

let commitSeqV0 = 0;

/**
 * @param {string} cubeId
 */
export function getCubeStateSnapshotV0(cubeId) {
  const id = String(cubeId || "cube_default");
  return cubeStateStoreV0.get(id) ?? normalizeCubeStateV0({ cubeId: id, sourceKind: "admission_commit_v0" });
}

/**
 * Apply allowlisted delta fields onto normalized CubeState partial.
 * @param {object} prev
 * @param {object} proposedCubeDelta
 */
function applyProposedMutationV0(prev, proposedCubeDelta) {
  const mutation = proposedCubeDelta?.proposedMutation || {};
  const merged = { ...prev };

  if (typeof mutation.rankDelta === "number" && mutation.rankDelta !== 0) {
    merged.rank = Math.max(0, (Number(prev.rank) || 0) + mutation.rankDelta);
  }
  if (typeof mutation.rewardDelta === "number") {
    merged.rewardAccum = Math.max(
      0,
      (Number(prev.rewardAccum) || 0) + mutation.rewardDelta
    );
  }
  if (proposedCubeDelta?.quotaSummary) {
    merged.quotaRemainingHint01 = proposedCubeDelta.quotaSummary.remainingHint01;
  }

  return normalizeCubeStateV0({
    ...merged,
    cubeId: prev.cubeId,
    sourceKind: "admission_commit_v0",
    lastCommitEpoch: proposedCubeDelta?.epochId
  });
}

/**
 * @param {{
 *   subjectRef: string,
 *   cubeId: string,
 *   proposedCubeDelta: object,
 *   admissionReport?: object | null,
 *   auditChain?: { ticketId?: string, intentId?: string, mutationId?: string },
 *   skipAdmissionCheck?: boolean
 * }} input
 */
export function commitProposedCubeDeltaV0(input) {
  const subjectRef = String(input.subjectRef || "");
  const cubeId = String(input.cubeId || "cube_default");
  const delta = input.proposedCubeDelta;

  if (!delta || typeof delta !== "object") {
    return Object.freeze({
      ok: false,
      code: "missing_proposed_cube_delta",
      interpretationOnly: true,
      nonExecutive: true
    });
  }

  if (delta.executionClass === "mutate_l1" || delta.executionClass === "mutate_l2") {
    return Object.freeze({
      ok: false,
      code: "dr_01_drift_mutation_forbidden",
      message: "DR-01: drift-derived deltas cannot commit",
      interpretationOnly: true,
      nonExecutive: true
    });
  }

  let admission = input.admissionReport;
  if (!input.skipAdmissionCheck) {
    if (isSubjectAdmittedV0(subjectRef)) {
      admission = admission || getAdmittedSubjectReportV0(subjectRef);
    } else {
      admission = admission || evaluateClosedAdmissionV0({
        subjectRef,
        signals: {}
      });
      if (!admission || admission.verdict !== ADMISSION_VERDICT_V0.ADMIT) {
        return Object.freeze({
          ok: false,
          code: "admission_not_admit",
          verdict: admission?.verdict ?? "missing",
          interpretationOnly: true,
          nonExecutive: true
        });
      }
    }
  }

  const prev = getCubeStateSnapshotV0(cubeId);
  const nextCubeState = applyProposedMutationV0(prev, delta);
  cubeStateStoreV0.set(cubeId, nextCubeState);

  const admissionCommitId = `adm_commit_${++commitSeqV0}_${Date.now()}`;
  const commitRecord = Object.freeze({
    schema: ADMISSION_CUBE_COMMIT_SCHEMA_V0,
    admissionCommitId,
    subjectRef,
    cubeId,
    proposedSchema: delta.schema || RECONCILE_PROPOSAL_SCHEMA_V0,
    auditChain: Object.freeze({
      ticketId: String(input.auditChain?.ticketId || ""),
      intentId: String(input.auditChain?.intentId || ""),
      mutationId: String(input.auditChain?.mutationId || "")
    }),
    cubeState: nextCubeState,
    interpretationOnly: true,
    nonExecutive: true
  });

  commitLedgerV0.push(commitRecord);

  return Object.freeze({
    ok: true,
    admissionCommitId,
    cubeState: nextCubeState,
    commitRecord,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function listAdmissionCommitsV0(limit = 50) {
  return commitLedgerV0.slice(-limit);
}

/** Test only. */
export function clearAdmissionCubeStateForTestV0() {
  cubeStateStoreV0.clear();
  commitLedgerV0.length = 0;
  commitSeqV0 = 0;
}
