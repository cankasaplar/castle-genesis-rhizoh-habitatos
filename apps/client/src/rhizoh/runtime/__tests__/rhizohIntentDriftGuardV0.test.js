import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetContextIntentSnapshotForTestV0,
  buildContextIntentSnapshotV0,
  commitContextIntentSnapshotV0
} from "../rhizohContextIntentSnapshotV0.js";
import {
  __resetDomainGraphForTestV0,
  getActiveFederationOverlayNodeV0,
  RHIZOH_FEDERATION_NODE_V0,
  setActiveFederationOverlayNodeV0
} from "../rhizohDomainGraphV0.js";
import { __resetRhizohDomainCoreStoreForTestV0, syncRhizohDomainCoreStoreV0 } from "../rhizohDomainCoreStoreV0.js";
import {
  evaluateIntentDriftV0,
  INTENT_DRIFT_SEVERITY_V0,
  reconcileIntentDriftV0
} from "../rhizohIntentDriftGuardV0.js";
import { setRhizohProductSurfacePanelExclusiveV0 } from "../rhizohProductChromePanelsV0.js";

describe("rhizohIntentDriftGuardV0", () => {
  beforeEach(() => {
    localStorage.clear();
    __resetContextIntentSnapshotForTestV0();
    __resetDomainGraphForTestV0();
    __resetRhizohDomainCoreStoreForTestV0();
    syncRhizohDomainCoreStoreV0({ pathname: "/world/space" });
  });

  afterEach(() => {
    localStorage.clear();
    __resetContextIntentSnapshotForTestV0();
    __resetDomainGraphForTestV0();
    __resetRhizohDomainCoreStoreForTestV0();
  });

  it("reports no drift when intent matches overlay and drawer", () => {
    const intent = buildContextIntentSnapshotV0({
      action: "context_shift",
      surface: "studio",
      nextOpenDrawerId: "studio",
      contextShiftPlan: { toNode: RHIZOH_FEDERATION_NODE_V0.STUDIO },
      federationAudit: { targetNode: RHIZOH_FEDERATION_NODE_V0.STUDIO, ok: true }
    });
    commitContextIntentSnapshotV0(intent);
    setActiveFederationOverlayNodeV0(RHIZOH_FEDERATION_NODE_V0.STUDIO);
    setRhizohProductSurfacePanelExclusiveV0("studio", true);

    const drift = evaluateIntentDriftV0();
    expect(drift.drifted).toBe(false);
    expect(drift.severity).toBe(INTENT_DRIFT_SEVERITY_V0.NONE);
  });

  it("detects high drift on overlay mismatch", () => {
    const intent = buildContextIntentSnapshotV0({
      action: "context_shift",
      surface: "studio",
      nextOpenDrawerId: "studio",
      contextShiftPlan: { toNode: RHIZOH_FEDERATION_NODE_V0.STUDIO },
      federationAudit: { targetNode: RHIZOH_FEDERATION_NODE_V0.STUDIO, ok: true }
    });
    commitContextIntentSnapshotV0(intent);
    setActiveFederationOverlayNodeV0(RHIZOH_FEDERATION_NODE_V0.BROADCAST);
    setRhizohProductSurfacePanelExclusiveV0("studio", true);

    const drift = evaluateIntentDriftV0();
    expect(drift.drifted).toBe(true);
    expect(drift.severity).toBe(INTENT_DRIFT_SEVERITY_V0.HIGH);
    expect(drift.mismatches).toContain("overlay_node");
  });

  it("reconciles overlay from intent when drawer still matches", () => {
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

    const result = reconcileIntentDriftV0();
    expect(result.reconciled).toBe(true);
    expect(result.action).toBe("resync_overlay_from_intent");
    expect(getActiveFederationOverlayNodeV0()).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
  });

  it("clears orphan overlay when intent is absent", () => {
    setActiveFederationOverlayNodeV0(RHIZOH_FEDERATION_NODE_V0.STUDIO);

    const drift = evaluateIntentDriftV0();
    expect(drift.mismatches).toContain("orphan_overlay");

    const result = reconcileIntentDriftV0();
    expect(result.reconciled).toBe(true);
    expect(result.action).toBe("clear_orphan_overlay");
    expect(getActiveFederationOverlayNodeV0()).toBeNull();
  });
});
