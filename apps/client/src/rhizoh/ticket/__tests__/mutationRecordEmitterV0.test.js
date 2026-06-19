import { describe, expect, it, beforeEach } from "vitest";
import {
  clearMutationRecordsForTestV0,
  emitMutationRecordV0,
  groupMutationRecordsByCategoryV0,
  listMutationRecordsV0
} from "../mutationRecordEmitterV0.js";
import { MUTATION_REASON_CODE_V1 } from "../mutationReasonCodeOntologyV1.js";
import { TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";
import { buildTicketTransitionIntentV1, TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV1.js";

describe("mutationRecordEmitterV0", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
  });

  it("records accepted transitions with v2 shape", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_1",
      traceGraphLink: "edge_1"
    });
    const record = emitMutationRecordV0({
      decision: TICKET_VALIDATION_DECISION_V0.ACCEPTED,
      validation: { valid: true, reasons: [], validatorVersion: "v1", executionClass: "mutate_l1" },
      intent,
      ticket: { ticketId: "tkt_1", capabilityScope: "arena.go.match", contextNodeCube: "cube_1" },
      actor: { actorId: "castle:u1" },
      epochId: "rec_burst_2026"
    });
    expect(record.schemaVersion).toBe(2);
    expect(record.status).toBe("accepted");
    expect(record.reason).toBeNull();
    expect(record.metrics.validatorVersion).toBe("v1");
    expect(record.ticketId).toBe("tkt_1");
    expect(record.intentId).toBe(intent.intentId);
    expect(record.actor.type).toBe("user");
    expect(record.interpretationOnly).toBe(true);
    expect(listMutationRecordsV0()).toHaveLength(1);
  });

  it("records rejected and quota_denied with ontology", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.INVITE_JOIN,
      ticketId: "tkt_2"
    });
    emitMutationRecordV0({
      decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
      validation: { valid: false, reasons: ["orphan_edge"], executionClass: "mutate_l1" },
      intent,
      actor: { actorId: "castle:u2" }
    });
    const quotaRecord = emitMutationRecordV0({
      decision: TICKET_VALIDATION_DECISION_V0.QUOTA_DENIED,
      validation: { valid: false, reasons: ["quota_exceeded"], executionClass: "mutate_l1" },
      intent,
      actor: { actorId: "castle:u2" }
    });
    expect(listMutationRecordsV0()).toHaveLength(2);
    expect(quotaRecord.status).toBe("quota_denied");
    expect(quotaRecord.reason?.primary).toBe(MUTATION_REASON_CODE_V1.QUOTA_EXHAUSTED);
    const grouped = groupMutationRecordsByCategoryV0();
    expect(grouped.REC).toBe(1);
    expect(grouped.QUOTA).toBe(1);
  });

  it("maps SC_03 on direct ticket execution", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_3"
    });
    const record = emitMutationRecordV0({
      decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
      validation: {
        valid: false,
        reasons: ["ticket_packet_direct_execution"],
        executionClass: "mutate_l1"
      },
      intent,
      actor: { actorId: "castle:u3" }
    });
    expect(record.status).toBe("rejected");
    expect(record.reason?.primary).toBe(MUTATION_REASON_CODE_V1.SC_03_TICKET_EXECUTION_DIRECT);
  });
});
