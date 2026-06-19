import { describe, expect, it, beforeEach } from "vitest";
import { TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";
import { clearMutationRecordsForTestV0, emitMutationRecordV0 } from "../mutationRecordEmitterV0.js";
import { buildTicketTransitionIntentV1, TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV1.js";
import { clearAdmissionCubeStateForTestV0 } from "../admissionCubeCommitV0.js";
import { clearRecTombstoneQueueForTestV0 } from "../recTombstoneQueueV0.js";
import { buildAlertPacketV0, clearAnomalyDetectorStateForTestV0 } from "../driftAnomalyDetectorV0.js";
import { MUTATION_REASON_CATEGORY_V1 } from "../mutationReasonCodeOntologyV1.js";
import {
  assertCognitiveActionCaInertV0,
  bindCognitiveActionV0,
  CAL_INTERACTION_TYPE_V0,
  exploreEpistemicInteractionV0
} from "../cognitiveActionLayerV0.js";

function emitRejected(reasonSlug, ticketId) {
  const intent = buildTicketTransitionIntentV1({
    transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
    ticketId,
    traceGraphLink: `edge_${ticketId}`
  });
  return emitMutationRecordV0({
    decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
    validation: { valid: false, reasons: [reasonSlug], executionClass: "mutate_l1" },
    intent,
    actor: { actorId: "castle:u1" },
    epochId: "rec_epoch_a"
  });
}

describe("cognitiveActionLayerV0", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
    clearAdmissionCubeStateForTestV0();
    clearRecTombstoneQueueForTestV0();
    clearAnomalyDetectorStateForTestV0();
  });

  it("CAL-01: exploration packet is read_only and causally inert", () => {
    emitRejected("ticket_packet_direct_execution", "tkt_sc_1");
    emitRejected("ticket_packet_direct_execution", "tkt_sc_2");

    const packet = exploreEpistemicInteractionV0({
      interactionType: CAL_INTERACTION_TYPE_V0.CATEGORY_SPIKE_CLICK,
      targetCategory: MUTATION_REASON_CATEGORY_V1.SC
    });

    expect(packet.executionClass).toBe("read_only");
    expect(packet.causallyInert).toBe(true);
    expect(packet.ticketLineage.length).toBeGreaterThan(0);
    expect(packet.driftCauseChain.length).toBeGreaterThan(0);
    expect(packet.stateProposal.kind).toBe("exploration_view");
    expect(assertCognitiveActionCaInertV0(packet).ok).toBe(true);
  });

  it("category spike click returns lineage without mutation", () => {
    emitRejected("quota_exceeded", "tkt_q_1");
    const packet = exploreEpistemicInteractionV0({
      interactionType: CAL_INTERACTION_TYPE_V0.CATEGORY_SPIKE_CLICK,
      targetCategory: MUTATION_REASON_CATEGORY_V1.QUOTA
    });
    expect(packet.stateProposal.summary).toContain("quota");
    expect(packet.recInfluenceWindow).toBeDefined();
  });

  it("alert packet click expands drift context (DR-02 safe)", () => {
    emitRejected("ticket_packet_direct_execution", "tkt_alert");
    const alert = buildAlertPacketV0({
      category: MUTATION_REASON_CATEGORY_V1.SC,
      suggestion: "sc_frequency_increased",
      confidence: 0.7
    });
    const packet = exploreEpistemicInteractionV0({
      interactionType: CAL_INTERACTION_TYPE_V0.ALERT_PACKET_CLICK,
      alertId: alert.alertId,
      alerts: [alert]
    });
    expect(packet.alertId).toBe(alert.alertId);
    expect(packet.driftCauseChain.length).toBeGreaterThan(0);
  });

  it("audit chain click expands ticketId → mutationId lineage", () => {
    const record = emitRejected("orphan_edge", "tkt_chain_1");
    const packet = exploreEpistemicInteractionV0({
      interactionType: CAL_INTERACTION_TYPE_V0.AUDIT_CHAIN_CLICK,
      auditChain: { mutationId: record.mutationId }
    });
    expect(packet.ticketLineage[0].mutationId).toBe(record.mutationId);
  });

  it("bindCognitiveActionV0 never sets cubeStateCommit", () => {
    emitRejected("ticket_packet_direct_execution", "tkt_bind");
    const bound = bindCognitiveActionV0({
      interaction: {
        interactionType: CAL_INTERACTION_TYPE_V0.CATEGORY_SPIKE_CLICK,
        targetCategory: MUTATION_REASON_CATEGORY_V1.SC
      }
    });
    expect(bound.cubeStateCommit).toBe(false);
    expect(bound.exploration.causallyInert).toBe(true);
  });

  it("rejects CAL packet with execution class leak", () => {
    const guard = assertCognitiveActionCaInertV0({
      executionClass: "mutate_l1",
      causallyInert: true
    });
    expect(guard.ok).toBe(false);
  });
});
