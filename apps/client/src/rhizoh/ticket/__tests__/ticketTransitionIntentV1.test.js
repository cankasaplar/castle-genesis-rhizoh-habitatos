import { describe, expect, it, beforeEach } from "vitest";
import {
  buildTicketTransitionIntentV1,
  formatIntentEpochV1,
  resetIntentIdSequenceForTestV1
} from "../ticketTransitionIntentV1.js";
import { TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV0.js";

describe("ticketTransitionIntentV1", () => {
  beforeEach(() => {
    resetIntentIdSequenceForTestV1();
  });

  it("assigns intentId and intentEpoch", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_1",
      executionClass: "mutate_l1"
    });
    expect(intent.schemaVersion).toBe(1);
    expect(intent.intentId).toMatch(/^intent_/);
    expect(intent.intentEpoch).toMatch(/^rec_\d{4}_\d{2}_\d{2}_0644$/);
  });

  it("formatIntentEpochV1 supports evening slot", () => {
    expect(formatIntentEpochV1(Date.UTC(2026, 5, 19, 12, 0, 0), "evening")).toBe("rec_2026_06_19_1844");
  });
});
