import { describe, expect, it, beforeEach } from "vitest";
import { TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";
import { emitMutationRecordV0, clearMutationRecordsForTestV0 } from "../mutationRecordEmitterV0.js";
import { buildTicketTransitionIntentV1, TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV1.js";
import {
  clearNervousSignalInboxForTestV0,
  listNervousSignalInboxV0,
  wireDriftSuggestionsToNervousNetworkV0
} from "../ticketDriftSignalWireV0.js";
import { runTicketMemoryPipelineV0 } from "../ticketMemoryPipelineV0.js";
import { clearTraceGraphIndexForTestV0 } from "../traceGraphIndexOptimizerV0.js";
import { resetDriftSuggestionSequenceForTestV0 } from "../driftAnalyticsEngineV0.js";

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

describe("ticketDriftSignalWireV0", () => {
  beforeEach(() => {
    clearNervousSignalInboxForTestV0();
  });

  it("publishes suggest-only Signal bucket messages", () => {
    const wired = wireDriftSuggestionsToNervousNetworkV0({
      suggestions: [
        {
          suggestionId: "sug_1",
          suggestion: "increase_quota_window",
          confidence: 0.78,
          executionClass: "suggest",
          invariantAtRisk: "QUOTA_TOPOLOGY",
          basedOn: "resource_stress"
        }
      ],
      traceGraphLink: "edge_drift_1",
      dispatchEvent: false
    });
    expect(wired.bucket).toBe("signal");
    expect(wired.messages[0].messageKind).toBe("signal");
    expect(wired.messages[0].executionClass).toBe("suggest");
    expect(listNervousSignalInboxV0().length).toBe(1);
  });

  it("rejects non-suggest class (DR-01)", () => {
    expect(() =>
      wireDriftSuggestionsToNervousNetworkV0({
        suggestions: [{ executionClass: "mutate_l1", suggestion: "bad" }],
        dispatchEvent: false
      })
    ).toThrow(/DR-01/);
  });
});

describe("ticketMemoryPipelineV0", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
    clearTraceGraphIndexForTestV0();
    resetDriftSuggestionSequenceForTestV0();
    clearNervousSignalInboxForTestV0();
  });

  it("runs index → analytics → nervous signals end-to-end", () => {
    const records = [];
    for (let i = 0; i < 4; i++) {
      records.push(emitRejected("quota_exceeded", "rec_epoch_q"));
    }
    const pipeline = runTicketMemoryPipelineV0({
      records,
      wireSignals: true
    });
    expect(pipeline.index.indexedCount).toBe(4);
    expect(pipeline.analytics.suggestions.suggestions.length).toBeGreaterThan(0);
    expect(pipeline.nervousSignals?.count).toBeGreaterThan(0);
  });

  it("optionally derives reconcile proposal without commit", () => {
    const records = [emitRejected("quota_exceeded", "rec_epoch_a")];
    const pipeline = runTicketMemoryPipelineV0({
      records,
      reconcile: true,
      reconcileEpochId: "rec_epoch_a",
      wireSignals: false
    });
    expect(pipeline.reconcile?.proposedCubeDelta).toBeDefined();
    expect(pipeline.commit).toBeNull();
  });
});
