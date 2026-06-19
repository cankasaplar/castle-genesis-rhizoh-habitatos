import { describe, expect, it, beforeEach } from "vitest";
import {
  clearTicketTombstonesForTestV0,
  isActiveTicketV0,
  isTombstonedTicketV0,
  listActiveTicketIdsV0,
  registerActiveTicketV0,
  tombstoneTicketV0,
  TOMBSTONE_REASON_V0
} from "../ticketTombstoneLayerV0.js";
import { TICKET_REJECT_REASON_V0 } from "../ticketSecurityConstantsV0.js";
import { buildTicketTransitionIntentV1 } from "../ticketTransitionIntentV1.js";
import { TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV0.js";
import { validateTicketTransitionV0 } from "../ticketSecurityValidatorV0.js";

describe("ticketTombstoneLayerV0", () => {
  beforeEach(() => {
    clearTicketTombstonesForTestV0();
  });

  it("tombstones ticket and removes from active set", () => {
    registerActiveTicketV0("tkt_a");
    expect(isActiveTicketV0("tkt_a")).toBe(true);
    const tomb = tombstoneTicketV0({
      ticketId: "tkt_a",
      reason: TOMBSTONE_REASON_V0.EXPIRED,
      epochId: "rec_core_morning"
    });
    expect(tomb.ticketId).toBe("tkt_a");
    expect(isTombstonedTicketV0("tkt_a")).toBe(true);
    expect(isActiveTicketV0("tkt_a")).toBe(false);
    expect(listActiveTicketIdsV0()).not.toContain("tkt_a");
  });

  it("validator rejects tombstoned ticket", () => {
    registerActiveTicketV0("tkt_dead");
    tombstoneTicketV0({ ticketId: "tkt_dead", reason: TOMBSTONE_REASON_V0.REC_CLOSEOUT });
    const intent = buildTicketTransitionIntentV1({
      transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
      ticketId: "tkt_dead"
    });
    const result = validateTicketTransitionV0({
      intent,
      ticket: {
        ticketId: "tkt_dead",
        contextNodeCube: "cube_1",
        traceGraphLink: "edge_1",
        journey: { continuityAnchor: "a1" },
        quota: { usageLimit: 1, usageCount: 0, expiresAt: "2099-01-01T00:00:00Z" }
      }
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(TICKET_REJECT_REASON_V0.TICKET_TOMBSTONED);
  });
});
