import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetClusterCivilizationForTestV0,
  advanceClusterCivilizationFromIntentV0,
  getClusterCivilizationSnapshotV0,
  resolveOverlayNodeFromClusterEcologyV0
} from "../rhizohClusterCivilizationV0.js";
import {
  __resetContextIntentSnapshotForTestV0,
  buildContextIntentSnapshotV0,
  commitContextIntentSnapshotV0
} from "../rhizohContextIntentSnapshotV0.js";
import {
  __resetDomainGraphForTestV0,
  RHIZOH_FEDERATION_NODE_V0,
  setActiveFederationOverlayNodeV0
} from "../rhizohDomainGraphV0.js";
import { __resetRhizohDomainCoreStoreForTestV0 } from "../rhizohDomainCoreStoreV0.js";
import { ingestIntentIntoClusterV0 } from "../rhizohIntentClusterV0.js";
import { setRhizohProductSurfacePanelExclusiveV0 } from "../rhizohProductChromePanelsV0.js";

describe("rhizohClusterCivilizationV0", () => {
  beforeEach(() => {
    localStorage.clear();
    __resetClusterCivilizationForTestV0();
    __resetContextIntentSnapshotForTestV0();
    __resetDomainGraphForTestV0();
    __resetRhizohDomainCoreStoreForTestV0();
  });

  afterEach(() => {
    localStorage.clear();
    __resetClusterCivilizationForTestV0();
    __resetContextIntentSnapshotForTestV0();
    __resetDomainGraphForTestV0();
    __resetRhizohDomainCoreStoreForTestV0();
  });

  it("advances cluster ecology from committed intent", () => {
    const intent = buildContextIntentSnapshotV0({
      action: "context_shift",
      surface: "studio",
      nextOpenDrawerId: "studio",
      contextShiftPlan: { toNode: RHIZOH_FEDERATION_NODE_V0.STUDIO },
      federationAudit: { targetNode: RHIZOH_FEDERATION_NODE_V0.STUDIO, ok: true }
    });

    const profile = advanceClusterCivilizationFromIntentV0(intent);
    expect(profile.cluster.ecology.intentCount).toBe(1);
    expect(profile.dominantNode).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
    expect(getClusterCivilizationSnapshotV0().cluster.intents[0].intentId).toBe(intent.intentId);
  });

  it("falls back to dominant cluster node on high intent drift", () => {
    ingestIntentIntoClusterV0({
      intentId: "ctx_intent_a",
      atMs: 1,
      surfaceId: "broadcast",
      hostNode: "world",
      targetNode: RHIZOH_FEDERATION_NODE_V0.BROADCAST,
      overlayNode: RHIZOH_FEDERATION_NODE_V0.BROADCAST,
      action: "context_shift",
      migrate: true,
      constraints: { exportSensitive: false, perceptionSensitive: true, contextWeight: 0.7 }
    });
    ingestIntentIntoClusterV0({
      intentId: "ctx_intent_b",
      atMs: 2,
      surfaceId: "broadcast",
      hostNode: "world",
      targetNode: RHIZOH_FEDERATION_NODE_V0.BROADCAST,
      overlayNode: RHIZOH_FEDERATION_NODE_V0.BROADCAST,
      action: "context_shift",
      migrate: true,
      constraints: { exportSensitive: false, perceptionSensitive: true, contextWeight: 0.7 }
    });

    const intent = buildContextIntentSnapshotV0({
      action: "context_shift",
      surface: "studio",
      nextOpenDrawerId: "studio",
      contextShiftPlan: { toNode: RHIZOH_FEDERATION_NODE_V0.STUDIO },
      federationAudit: { targetNode: RHIZOH_FEDERATION_NODE_V0.STUDIO, ok: true }
    });
    commitContextIntentSnapshotV0(intent);
    setActiveFederationOverlayNodeV0(RHIZOH_FEDERATION_NODE_V0.MEDIA);
    setRhizohProductSurfacePanelExclusiveV0("studio", true);

    expect(resolveOverlayNodeFromClusterEcologyV0()).toBe(RHIZOH_FEDERATION_NODE_V0.BROADCAST);
  });
});
