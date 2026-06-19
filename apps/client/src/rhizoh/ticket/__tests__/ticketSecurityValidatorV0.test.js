import { describe, expect, it, beforeEach } from "vitest";
import { issueTimeOwnershipContractV0 } from "../../runtime/continuity/temporalIdentityBindingV0.js";
import { EPISTEMIC_PAST_V0 } from "../../runtime/continuity/replayCorruptionTaxonomyV0.js";
import {
  TICKET_EXECUTION_CLASS_V0,
  TICKET_EPOCH_WINDOW_V0,
  TICKET_TRANSITION_TYPE_V0
} from "../ticketTransitionIntentV0.js";
import { buildTicketTransitionIntentV1 } from "../ticketTransitionIntentV1.js";
import { TICKET_REJECT_REASON_V0, TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";
import { validateTicketTransitionV0 } from "../ticketSecurityValidatorV0.js";

function baseTicket(overrides = {}) {
  return {
    ticketId: "tkt_test_001",
    capabilityScope: "arena.go.match",
    contextNodeCube: "cube_001",
    traceGraphLink: "edge_001",
    executionClass: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
    quota: { usageLimit: 5, usageCount: 0, expiresAt: "2099-01-01T00:00:00Z" },
    journey: { continuityAnchor: "anchor_001" },
    ...overrides
  };
}

function temporalContractOk() {
  return issueTimeOwnershipContractV0({
    nodeId: "node_a",
    diskKey: "disk_a",
    epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
    trustedCheckpointTick: 10,
    trustedThroughTick: 20,
    replayFromTick: 10,
    executionPermitted: true
  });
}

describe("ticketSecurityValidatorV0", () => {
  it("accepts valid arena_enter mutate_l1 with signature", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_test_001",
      executionClass: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
      epochWindow: TICKET_EPOCH_WINDOW_V0.REC_BURST,
      traceGraphLink: "edge_001",
      continuityAnchor: "anchor_001"
    });
    const result = validateTicketTransitionV0({
      intent,
      ticket: baseTicket(),
      actor: { actorId: "castle:a", userSigned: true },
      epochWindow: TICKET_EPOCH_WINDOW_V0.REC_BURST,
      temporalContract: temporalContractOk()
    });
    expect(result.valid).toBe(true);
    expect(result.mutationClass).toBe("allowed");
    expect(result.decision).toBe(TICKET_VALIDATION_DECISION_V0.ACCEPTED);
  });

  it("rejects quota exceeded", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_test_001",
      executionClass: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
      traceGraphLink: "edge_001",
      continuityAnchor: "anchor_001"
    });
    const result = validateTicketTransitionV0({
      intent,
      ticket: baseTicket({ quota: { usageLimit: 3, usageCount: 3, expiresAt: "2099-01-01T00:00:00Z" } }),
      actor: { actorId: "castle:a", userSigned: true },
      epochWindow: TICKET_EPOCH_WINDOW_V0.REC_BURST,
      temporalContract: temporalContractOk()
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(TICKET_REJECT_REASON_V0.QUOTA_EXCEEDED);
    expect(result.decision).toBe(TICKET_VALIDATION_DECISION_V0.QUOTA_DENIED);
  });

  it("rejects expired ticket for mutate", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_test_001",
      executionClass: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
      traceGraphLink: "edge_001",
      continuityAnchor: "anchor_001"
    });
    const result = validateTicketTransitionV0({
      intent,
      ticket: baseTicket({ quota: { usageLimit: 5, usageCount: 0, expiresAt: "2020-01-01T00:00:00Z" } }),
      actor: { actorId: "castle:a", userSigned: true },
      nowMs: Date.parse("2025-01-01T00:00:00Z"),
      epochWindow: TICKET_EPOCH_WINDOW_V0.REC_BURST
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(TICKET_REJECT_REASON_V0.TICKET_EXPIRED);
  });

  it("allows read_only on expired ticket for journey restore", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.GHOST_ATTACH,
      ticketId: "tkt_test_001",
      executionClass: TICKET_EXECUTION_CLASS_V0.READ_ONLY,
      traceGraphLink: "edge_001",
      continuityAnchor: "anchor_001"
    });
    const result = validateTicketTransitionV0({
      intent,
      ticket: baseTicket({ quota: { usageLimit: 5, usageCount: 0, expiresAt: "2020-01-01T00:00:00Z" } }),
      nowMs: Date.parse("2025-01-01T00:00:00Z")
    });
    expect(result.valid).toBe(true);
    expect(result.mutationClass).toBe("read_only_restore");
  });

  it("rejects suggest ticket attempting mutate (SC-02)", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.INVITE_JOIN,
      ticketId: "tkt_test_001",
      executionClass: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
      traceGraphLink: "edge_001",
      continuityAnchor: "anchor_001"
    });
    const result = validateTicketTransitionV0({
      intent,
      ticket: baseTicket({ executionClass: TICKET_EXECUTION_CLASS_V0.SUGGEST, capabilityScope: "graph.node.extend" }),
      actor: { actorId: "castle:a", userSigned: true },
      epochWindow: TICKET_EPOCH_WINDOW_V0.REC_BURST,
      temporalContract: temporalContractOk()
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(TICKET_REJECT_REASON_V0.SUGGEST_MUTATE_FORBIDDEN);
  });

  it("rejects system_reconcile direct CubeState write (SC-01)", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.SYSTEM_RECONCILE,
      ticketId: "tkt_test_001",
      executionClass: TICKET_EXECUTION_CLASS_V0.SYSTEM_RECONCILE,
      directCubeMutation: true,
      traceGraphLink: "edge_001",
      continuityAnchor: "anchor_001"
    });
    const result = validateTicketTransitionV0({
      intent,
      ticket: baseTicket({ executionClass: TICKET_EXECUTION_CLASS_V0.SYSTEM_RECONCILE }),
      actor: { actorId: "system:rec_reconciler" },
      epochWindow: TICKET_EPOCH_WINDOW_V0.REC_CORE_MORNING
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(TICKET_REJECT_REASON_V0.SYSTEM_RECONCILE_CUBE_WRITE_FORBIDDEN);
  });

  it("rejects orphan edge missing traceGraphLink", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_test_001",
      executionClass: TICKET_EXECUTION_CLASS_V0.MUTATE_L1
    });
    const result = validateTicketTransitionV0({
      intent,
      ticket: baseTicket({ traceGraphLink: "", journey: {} }),
      actor: { actorId: "castle:a", userSigned: true },
      epochWindow: TICKET_EPOCH_WINDOW_V0.REC_BURST,
      temporalContract: temporalContractOk()
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(TICKET_REJECT_REASON_V0.ORPHAN_EDGE);
  });

  it("rejects unsigned mutate_l1", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_test_001",
      executionClass: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
      traceGraphLink: "edge_001",
      continuityAnchor: "anchor_001"
    });
    const result = validateTicketTransitionV0({
      intent,
      ticket: baseTicket(),
      actor: { actorId: "castle:a" },
      epochWindow: TICKET_EPOCH_WINDOW_V0.REC_BURST,
      temporalContract: temporalContractOk()
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(TICKET_REJECT_REASON_V0.UNSIGNED_MUTATE);
  });

  it("rejects direct TicketPacket execution (SC-03)", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_test_001",
      executionClass: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
      traceGraphLink: "edge_001",
      continuityAnchor: "anchor_001"
    });
    const result = validateTicketTransitionV0({
      intent,
      ticket: baseTicket(),
      actor: { actorId: "castle:a", userSigned: true },
      directTicketExecution: true,
      epochWindow: TICKET_EPOCH_WINDOW_V0.REC_BURST,
      temporalContract: temporalContractOk()
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(TICKET_REJECT_REASON_V0.TICKET_PACKET_DIRECT_EXECUTION);
  });

  it("rejects mutate without intentId (SC-03)", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_test_001",
      executionClass: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
      traceGraphLink: "edge_001",
      continuityAnchor: "anchor_001",
      intentId: ""
    });
    const broken = { ...intent, intentId: "" };
    const result = validateTicketTransitionV0({
      intent: broken,
      ticket: baseTicket(),
      actor: { actorId: "castle:a", userSigned: true },
      intentId: "",
      epochWindow: TICKET_EPOCH_WINDOW_V0.REC_BURST,
      temporalContract: temporalContractOk()
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(TICKET_REJECT_REASON_V0.INTENT_ID_REQUIRED);
  });
});
