import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetContextIntentSnapshotForTestV0,
  buildContextIntentSnapshotV0,
  commitContextIntentSnapshotV0,
  getLatestContextIntentSnapshotV0,
  resolveOverlayNodeFromContextIntentV0,
  shouldApplyDomainMigrationFromIntentV0
} from "../rhizohContextIntentSnapshotV0.js";
import { __resetDomainGraphForTestV0, RHIZOH_FEDERATION_NODE_V0 } from "../rhizohDomainGraphV0.js";
import { __resetRhizohDomainCoreStoreForTestV0 } from "../rhizohDomainCoreStoreV0.js";

describe("rhizohContextIntentSnapshotV0", () => {
  beforeEach(() => {
    __resetContextIntentSnapshotForTestV0();
    __resetDomainGraphForTestV0();
    __resetRhizohDomainCoreStoreForTestV0();
  });

  afterEach(() => {
    __resetContextIntentSnapshotForTestV0();
    __resetDomainGraphForTestV0();
    __resetRhizohDomainCoreStoreForTestV0();
  });

  it("builds intent before migration with target node from surface", () => {
    const intent = buildContextIntentSnapshotV0(
      {
        action: "context_shift",
        surface: "studio",
        nextOpenDrawerId: "studio",
        contextShiftPlan: { toNode: RHIZOH_FEDERATION_NODE_V0.STUDIO },
        federationAudit: { targetNode: RHIZOH_FEDERATION_NODE_V0.STUDIO, ok: true }
      },
      { pathname: "/world/space" }
    );
    expect(intent.targetNode).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
    expect(intent.migrate).toBe(true);
    expect(intent.constraints.exportSensitive).toBe(true);
  });

  it("commit + resolve overlay from intent (not guesswork)", () => {
    const intent = buildContextIntentSnapshotV0({
      action: "context_shift",
      surface: "broadcast",
      nextOpenDrawerId: "broadcast",
      contextShiftPlan: {},
      federationAudit: { targetNode: RHIZOH_FEDERATION_NODE_V0.BROADCAST, ok: true }
    });
    commitContextIntentSnapshotV0(intent);
    expect(resolveOverlayNodeFromContextIntentV0()).toBe(RHIZOH_FEDERATION_NODE_V0.BROADCAST);
    expect(getLatestContextIntentSnapshotV0()?.intentId).toBe(intent.intentId);
  });

  it("clear overlay intent triggers migration gate", () => {
    const intent = buildContextIntentSnapshotV0({
      action: "close_all",
      surface: "world",
      nextOpenDrawerId: null,
      clearOverlay: true
    });
    expect(shouldApplyDomainMigrationFromIntentV0(intent)).toBe(true);
    expect(intent.migrate).toBe(false);
  });
});
