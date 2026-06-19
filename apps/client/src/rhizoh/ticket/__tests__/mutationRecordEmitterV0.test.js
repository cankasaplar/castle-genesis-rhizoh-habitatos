import { describe, expect, it, beforeEach } from "vitest";
import {
  clearMutationRecordsForTestV0,
  emitMutationRecordV0,
  listMutationRecordsV0
} from "../mutationRecordEmitterV0.js";
import { TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";
import { buildTicketTransitionIntentV0, TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV0.js";

describe("mutationRecordEmitterV0", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
  });

  it("records accepted transitions", () => {
    const intent = buildTicketTransitionIntentV0({
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
    expect(record.decision).toBe("accepted");
    expect(record.validatorVersion).toBe("v1");
    expect(record.ticketId).toBe("tkt_1");
    expect(record.interpretationOnly).toBe(true);
    expect(listMutationRecordsV0()).toHaveLength(1);
  });

  it("records rejected and quota_denied", () => {
    const intent = buildTicketTransitionIntentV0({
      transitionType: TICKET_TRANSITION_TYPE_V0.INVITE_JOIN,
      ticketId: "tkt_2"
    });
    emitMutationRecordV0({
      decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
      validation: { valid: false, reasons: ["orphan_edge"], executionClass: "mutate_l1" },
      intent,
      actor: { actorId: "castle:u2" }
    });
    emitMutationRecordV0({
      decision: TICKET_VALIDATION_DECISION_V0.QUOTA_DENIED,
      validation: { valid: false, reasons: ["quota_exceeded"], executionClass: "mutate_l1" },
      intent,
      actor: { actorId: "castle:u2" }
    });
    expect(listMutationRecordsV0()).toHaveLength(2);
    expect(listMutationRecordsV0()[1].decision).toBe("quota_denied");
  });
});
