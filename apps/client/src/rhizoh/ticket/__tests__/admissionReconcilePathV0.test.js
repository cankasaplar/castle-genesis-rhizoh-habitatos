import { describe, expect, it, beforeEach } from "vitest";
import { TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";
import { emitMutationRecordV0, clearMutationRecordsForTestV0 } from "../mutationRecordEmitterV0.js";
import { buildTicketTransitionIntentV1, TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV1.js";
import { deriveReconcileProposalV0 } from "../ticketReconcileProposalV0.js";
import {
  clearAdmissionCubeStateForTestV0,
  commitProposedCubeDeltaV0,
  getCubeStateSnapshotV0
} from "../admissionCubeCommitV0.js";
import { evaluateClosedAdmissionV0 } from "../../ingress/closedUserAdmissionEngineV0.js";

function emitAccepted(epoch) {
  const intent = buildTicketTransitionIntentV1({
    transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
    ticketId: `tkt_acc_${epoch}`,
    traceGraphLink: `edge_acc_${epoch}`
  });
  return emitMutationRecordV0({
    decision: TICKET_VALIDATION_DECISION_V0.ACCEPTED,
    validation: { valid: true, reasons: [], executionClass: "mutate_l1" },
    intent,
    actor: { actorId: "castle:u1" },
    epochId: epoch
  });
}

function emitQuotaDenied(epoch) {
  const intent = buildTicketTransitionIntentV1({
    transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
    ticketId: `tkt_q_${epoch}`,
    traceGraphLink: `edge_q_${epoch}`
  });
  return emitMutationRecordV0({
    decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
    validation: { valid: false, reasons: ["quota_exceeded"], executionClass: "mutate_l1" },
    intent,
    actor: { actorId: "castle:u1" },
    epochId: epoch
  });
}

describe("ticketReconcileProposalV0", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
  });

  it("derives proposedCubeDelta without direct cubeState fields (SC-01)", () => {
    const records = [emitAccepted("rec_epoch_a"), emitQuotaDenied("rec_epoch_a")];
    const proposal = deriveReconcileProposalV0({
      records,
      epochId: "rec_epoch_a",
      ticketId: "tkt_rec"
    });
    expect(proposal.proposedCubeDelta.executionClass).toBe("system_reconcile");
    expect(proposal.proposedCubeDelta.proposedMutation).toBeDefined();
    expect(proposal.proposedCubeDelta.quotaSummary.deniedCount).toBe(1);
    expect("cubeState" in proposal.proposedCubeDelta).toBe(false);
  });
});

describe("admissionCubeCommitV0", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
    clearAdmissionCubeStateForTestV0();
  });

  it("rejects commit without admission admit verdict (SC-02)", () => {
    const proposal = deriveReconcileProposalV0({
      records: [emitAccepted("rec_epoch_a")],
      epochId: "rec_epoch_a"
    });
    const result = commitProposedCubeDeltaV0({
      subjectRef: "subj_hold",
      cubeId: "cube_001",
      proposedCubeDelta: proposal.proposedCubeDelta
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("admission_not_admit");
  });

  it("commits proposedCubeDelta after admission admit", () => {
    const subjectRef = "subj_admit";
    evaluateClosedAdmissionV0({
      subjectRef,
      signals: {
        formalCorrectnessStress: 0.95,
        infraReplayStress: 0.9,
        physicalCouplingStress: 0.1,
        interpretationStress: 0.1
      }
    });

    const proposal = deriveReconcileProposalV0({
      records: [emitAccepted("rec_epoch_a"), emitAccepted("rec_epoch_a")],
      epochId: "rec_epoch_a"
    });

    const result = commitProposedCubeDeltaV0({
      subjectRef,
      cubeId: "cube_001",
      proposedCubeDelta: proposal.proposedCubeDelta,
      auditChain: { ticketId: "tkt_1", intentId: "intent_1", mutationId: "mut_1" }
    });

    expect(result.ok).toBe(true);
    expect(result.admissionCommitId).toMatch(/^adm_commit_/);
    const snap = getCubeStateSnapshotV0("cube_001");
    expect(snap.sourceKind).toBe("admission_commit_v0");
  });

  it("rejects drift-class mutate execution on delta (DR-01)", () => {
    const result = commitProposedCubeDeltaV0({
      subjectRef: "subj_x",
      cubeId: "cube_001",
      proposedCubeDelta: { executionClass: "mutate_l1" },
      skipAdmissionCheck: true
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("dr_01_drift_mutation_forbidden");
  });
});
