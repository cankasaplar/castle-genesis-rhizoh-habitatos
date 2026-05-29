import { describe, it, expect, beforeEach } from "vitest";
import { buildRrhpPersistentMergePayload } from "./rrhpPersistentProjectionV1.js";
import {
  applyMinimalRrhpFromRcilEvent,
  __resetRrhpMinimalProjectionForTests,
  RRHP_BRIDGE_EXPECTED_RCIL_SCHEMA_VERSION
} from "./rcilRrhpMinimalBridgeV1.js";

describe("rrhpPersistentProjectionV1", () => {
  beforeEach(() => {
    __resetRrhpMinimalProjectionForTests();
  });

  it("buildRrhpPersistentMergePayload is merge-safe shape (no overwrite fields)", () => {
    applyMinimalRrhpFromRcilEvent({
      v: RRHP_BRIDGE_EXPECTED_RCIL_SCHEMA_VERSION,
      seq: 2,
      type: "boot",
      payload: { n: 1 },
      source: "client",
      orderingKey: "boot",
      ts: 1
    });
    const p = buildRrhpPersistentMergePayload("uid-test");
    expect(p.rrhpSliceSchema).toBe(1);
    expect(p.ownerUid).toBe("uid-test");
    expect(p.appliedKeysTail.length).toBeGreaterThan(0);
    expect(Array.isArray(p.appliedMetaTail)).toBe(true);
    expect(p.operationalReconcileTotal).toBe(1);
  });
});
