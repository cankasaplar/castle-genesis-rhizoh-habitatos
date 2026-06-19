import { describe, expect, it, beforeEach } from "vitest";
import {
  clearDeferredIntentQueueForTestV0,
  dequeueDeferredIntentsForRecV0,
  enqueueDeferredIntentV0,
  listPendingDeferredIntentsV0
} from "../recDeferredIntentQueueV0.js";
import { buildTicketTransitionIntentV1 } from "../ticketTransitionIntentV1.js";
import { TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV0.js";

describe("recDeferredIntentQueueV0", () => {
  beforeEach(() => {
    clearDeferredIntentQueueForTestV0();
  });

  it("enqueues and dequeues for target REC epoch", () => {
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.INVITE_JOIN,
      ticketId: "tkt_1",
      intentEpoch: "rec_2026_06_19_1844"
    });
    const entry = enqueueDeferredIntentV0({
      intent,
      deferReason: "epoch_closed",
      targetRecEpoch: "rec_2026_06_19_1844"
    });
    expect(entry.status).toBe("pending");
    expect(listPendingDeferredIntentsV0()).toHaveLength(1);

    const replayed = dequeueDeferredIntentsForRecV0("rec_2026_06_19_1844");
    expect(replayed).toHaveLength(1);
    expect(replayed[0].intentId).toBe(intent.intentId);
    expect(listPendingDeferredIntentsV0()).toHaveLength(0);
  });
});
