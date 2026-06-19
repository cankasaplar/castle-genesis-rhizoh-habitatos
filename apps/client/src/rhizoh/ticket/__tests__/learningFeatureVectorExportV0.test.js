import { describe, expect, it, beforeEach } from "vitest";
import { TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";
import { emitMutationRecordV0, clearMutationRecordsForTestV0 } from "../mutationRecordEmitterV0.js";
import { buildTicketTransitionIntentV1, TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV1.js";
import { exportLearningFeatureVectorV0 } from "../learningFeatureVectorExportV0.js";
import { MUTATION_REASON_CATEGORY_V1 } from "../mutationReasonCodeOntologyV1.js";

function emitRejected(reasonSlug, epoch) {
  const intent = buildTicketTransitionIntentV1({
    transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
    ticketId: `tkt_${reasonSlug}_${epoch}`,
    traceGraphLink: `edge_${reasonSlug}`
  });
  return emitMutationRecordV0({
    decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
    validation: { valid: false, reasons: [reasonSlug], executionClass: "mutate_l1" },
    intent,
    actor: { actorId: "castle:u1" },
    epochId: epoch
  });
}

describe("learningFeatureVectorExportV0", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
  });

  it("exports reason.category shares, drift severity, epoch trend, acceptance ratio, permission stress", () => {
    const records = [
      emitRejected("ticket_packet_direct_execution", "rec_epoch_a"),
      emitRejected("ticket_packet_direct_execution", "rec_epoch_a"),
      emitRejected("quota_exceeded", "rec_epoch_b")
    ];
    const vector = exportLearningFeatureVectorV0({
      records,
      drift: {
        signals: [{ share01: 0.55 }],
        categoryCounts: { SC: 2, QUOTA: 1 }
      }
    });

    expect(vector.researchOnly).toBe(true);
    expect(vector.vector.sampleCount).toBe(3);
    expect(vector.vector.reasonCategoryShares[MUTATION_REASON_CATEGORY_V1.SC]).toBeCloseTo(2 / 3, 2);
    expect(vector.vector.driftSeverity01).toBeCloseTo(0.55, 2);
    expect(vector.vector.epochTrend.length).toBe(2);
    expect(vector.vector.acceptanceRatio01).toBe(0);
    expect(vector.vector.permissionStress01).toBeGreaterThan(0);
  });
});
