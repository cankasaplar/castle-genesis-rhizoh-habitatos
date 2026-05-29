import { describe, it, expect, beforeEach } from "vitest";
import {
  applyMinimalRrhpFromRcilEvent,
  validateRcilEventForRrhpMutation,
  isSyntheticIsolatedRcilEvent,
  getRrhpMinimalProjectionSnapshot,
  hydrateRrhpFromPersistentSlice,
  __resetRrhpMinimalProjectionForTests,
  RRHP_BRIDGE_EXPECTED_RCIL_SCHEMA_VERSION
} from "./rcilRrhpMinimalBridgeV1.js";

const baseEvent = (overrides = {}) => ({
  v: RRHP_BRIDGE_EXPECTED_RCIL_SCHEMA_VERSION,
  seq: 1,
  type: "boot",
  payload: { x: 1 },
  source: "client",
  orderingKey: "boot",
  ts: Date.now(),
  ...overrides
});

describe("rcilRrhpMinimalBridgeV1", () => {
  beforeEach(() => {
    __resetRrhpMinimalProjectionForTests();
  });

  it("fail-closed: invalid event does not mutate", () => {
    expect(applyMinimalRrhpFromRcilEvent(null).outcome).toBe("skipped");
    expect(getRrhpMinimalProjectionSnapshot().operationalReconcileTotal).toBe(0);
  });

  it("synthetic isolation: pressure_loop never mutates", () => {
    const r = applyMinimalRrhpFromRcilEvent(baseEvent({ source: "pressure_loop", seq: 2 }));
    expect(r.outcome).toBe("skipped");
    expect(r.reason).toBe("synthetic_blocked");
    expect(getRrhpMinimalProjectionSnapshot().operationalReconcileTotal).toBe(0);
    expect(isSyntheticIsolatedRcilEvent(baseEvent({ source: "pressure_loop" }))).toBe(true);
  });

  it("idempotent: same event twice → second duplicate", () => {
    const ev = baseEvent({ seq: 5, type: "t", orderingKey: "k" });
    const a = applyMinimalRrhpFromRcilEvent(ev);
    const b = applyMinimalRrhpFromRcilEvent(ev);
    expect(a.outcome).toBe("applied");
    expect(b.outcome).toBe("skipped");
    expect(b.reason).toBe("idempotent_duplicate");
    expect(getRrhpMinimalProjectionSnapshot().operationalReconcileTotal).toBe(1);
  });

  it("validateRcilEventForRrhpMutation rejects bad schema", () => {
    expect(validateRcilEventForRrhpMutation(baseEvent({ v: 999 })).ok).toBe(false);
  });

  it("hydrateRrhpFromPersistentSlice restores keys so same event is idempotent", () => {
    const ev = baseEvent({ seq: 1, type: "x", orderingKey: "ok1" });
    applyMinimalRrhpFromRcilEvent(ev);
    const key = "v1|s1|ok:ok1|t:x";
    __resetRrhpMinimalProjectionForTests();
    const h = hydrateRrhpFromPersistentSlice({
      rrhpSliceSchema: 1,
      operationalReconcileTotal: 1,
      lastAppliedSeq: 1,
      lastOperationalType: "x",
      appliedKeysTail: [key],
      appliedMetaTail: [{ seq: 1, type: "x", at: 1 }]
    });
    expect(h.ok).toBe(true);
    const again = applyMinimalRrhpFromRcilEvent(ev);
    expect(again.outcome).toBe("skipped");
    expect(again.reason).toBe("idempotent_duplicate");
  });

  it("hydrate refuses when local projection already has progress", () => {
    applyMinimalRrhpFromRcilEvent(baseEvent({ seq: 1 }));
    const h = hydrateRrhpFromPersistentSlice({
      rrhpSliceSchema: 1,
      operationalReconcileTotal: 0,
      appliedKeysTail: []
    });
    expect(h.ok).toBe(false);
    expect(h.reason).toBe("local_nonempty");
  });
});
