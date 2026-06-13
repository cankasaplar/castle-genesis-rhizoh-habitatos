import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetIntentClusterForTestV0,
  evolveClusterEcologyFromIntentsV0,
  getIntentClusterSnapshotV0,
  ingestIntentIntoClusterV0,
  resolveDominantClusterNodeV0
} from "../rhizohIntentClusterV0.js";
import { RHIZOH_FEDERATION_NODE_V0 } from "../rhizohDomainGraphV0.js";

describe("rhizohIntentClusterV0", () => {
  beforeEach(() => {
    __resetIntentClusterForTestV0();
  });

  afterEach(() => {
    __resetIntentClusterForTestV0();
  });

  it("evolves ecology weights from multiple intents", () => {
    ingestIntentIntoClusterV0({
      intentId: "ctx_intent_1",
      atMs: 1,
      surfaceId: "studio",
      hostNode: "world",
      targetNode: RHIZOH_FEDERATION_NODE_V0.STUDIO,
      overlayNode: RHIZOH_FEDERATION_NODE_V0.STUDIO,
      action: "context_shift",
      migrate: true,
      constraints: { exportSensitive: true, perceptionSensitive: false, contextWeight: 0.9 }
    });
    ingestIntentIntoClusterV0({
      intentId: "ctx_intent_2",
      atMs: 2,
      surfaceId: "broadcast",
      hostNode: "world",
      targetNode: RHIZOH_FEDERATION_NODE_V0.BROADCAST,
      overlayNode: RHIZOH_FEDERATION_NODE_V0.BROADCAST,
      action: "context_shift",
      migrate: true,
      constraints: { exportSensitive: false, perceptionSensitive: true, contextWeight: 0.7 }
    });
    ingestIntentIntoClusterV0({
      intentId: "ctx_intent_3",
      atMs: 3,
      surfaceId: "studio",
      hostNode: "world",
      targetNode: RHIZOH_FEDERATION_NODE_V0.STUDIO,
      overlayNode: RHIZOH_FEDERATION_NODE_V0.STUDIO,
      action: "context_shift",
      migrate: true,
      constraints: { exportSensitive: true, perceptionSensitive: false, contextWeight: 0.9 }
    });

    const snap = getIntentClusterSnapshotV0();
    expect(snap.intents).toHaveLength(3);
    expect(snap.ecology.dominantNode).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
    expect(snap.ecology.nodeWeights[RHIZOH_FEDERATION_NODE_V0.STUDIO]).toBe(2);
    expect(snap.ecology.exportExposure).toBe(2);
    expect(snap.ecology.perceptionExposure).toBe(1);
    expect(resolveDominantClusterNodeV0()).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
  });

  it("dedupes by intentId and caps cluster size", () => {
    for (let i = 0; i < 70; i += 1) {
      ingestIntentIntoClusterV0({
        intentId: `ctx_intent_${i}`,
        atMs: i,
        surfaceId: "media",
        hostNode: "world",
        targetNode: RHIZOH_FEDERATION_NODE_V0.MEDIA,
        overlayNode: RHIZOH_FEDERATION_NODE_V0.MEDIA,
        action: "context_shift",
        migrate: true,
        constraints: { exportSensitive: false, perceptionSensitive: true, contextWeight: 0.6 }
      });
    }

    ingestIntentIntoClusterV0({
      intentId: "ctx_intent_5",
      atMs: 999,
      surfaceId: "castle",
      hostNode: "world",
      targetNode: RHIZOH_FEDERATION_NODE_V0.CASTLE,
      overlayNode: RHIZOH_FEDERATION_NODE_V0.CASTLE,
      action: "context_shift",
      migrate: true,
      constraints: { exportSensitive: false, perceptionSensitive: false, contextWeight: 0.4 }
    });

    const snap = getIntentClusterSnapshotV0();
    expect(snap.intents).toHaveLength(64);
    expect(snap.intents[0].intentId).toBe("ctx_intent_5");
    expect(snap.intents[0].targetNode).toBe(RHIZOH_FEDERATION_NODE_V0.CASTLE);
  });

  it("evolveClusterEcologyFromIntentsV0 picks dominant node by count", () => {
    const ecology = evolveClusterEcologyFromIntentsV0([
      { overlayNode: RHIZOH_FEDERATION_NODE_V0.MEDIA, exportSensitive: false, perceptionSensitive: true },
      { overlayNode: RHIZOH_FEDERATION_NODE_V0.STUDIO, exportSensitive: true, perceptionSensitive: false },
      { overlayNode: RHIZOH_FEDERATION_NODE_V0.MEDIA, exportSensitive: false, perceptionSensitive: true }
    ]);
    expect(ecology.dominantNode).toBe(RHIZOH_FEDERATION_NODE_V0.MEDIA);
    expect(ecology.intentCount).toBe(3);
  });

  it("uses lexicographic tiebreak for equal node weights", () => {
    const ecology = evolveClusterEcologyFromIntentsV0([
      { overlayNode: RHIZOH_FEDERATION_NODE_V0.STUDIO, exportSensitive: false, perceptionSensitive: false },
      { overlayNode: RHIZOH_FEDERATION_NODE_V0.BROADCAST, exportSensitive: false, perceptionSensitive: false }
    ]);
    expect(ecology.dominantNode).toBe(RHIZOH_FEDERATION_NODE_V0.BROADCAST);
  });
});
