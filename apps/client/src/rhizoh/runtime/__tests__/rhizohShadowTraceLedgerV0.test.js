import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  __resetShadowTraceLedgerForTestV0,
  appendShadowTraceFromCouncilV0,
  appendShadowTraceFromDriftEventV0,
  appendShadowTraceFromStockfishTimeoutV0,
  appendShadowTraceRecordV0,
  exportShadowComplianceSnapshotV0,
  getShadowTraceLedgerSnapshotV0,
  isRhizohShadowModeActiveV0,
  SHADOW_LEDGER_GOVERNANCE_V0
} from "../rhizohShadowTraceLedgerV0.js";

vi.mock("../rhizohLegalPendingWaitLoopV0.js", () => ({
  isRhizohLegalPendingHoldV0: () => true
}));

describe("rhizohShadowTraceLedgerV0", () => {
  beforeEach(() => {
    __resetShadowTraceLedgerForTestV0();
    if (typeof window !== "undefined") {
      window.__rhizoh = { shadowMode: { force: true } };
    }
  });

  it("activates shadow mode under legal hold mock", () => {
    expect(isRhizohShadowModeActiveV0()).toBe(true);
  });

  it("appends drift envelope with hypothetical outcome", () => {
    const row = appendShadowTraceFromDriftEventV0({
      kind: "DRIFT_EVENT",
      severity: "warn",
      causalChainId: "chess_drift_cluster_3_5_1",
      matchId: "cluster_3_x",
      slotId: 3,
      entropyScore: 1,
      eventType: "TOPOLOGY_DRIFT_DETECTED"
    });
    expect(row?.hypotheticalOutcome).toContain("policy_diff");
    expect(row?.governance.feedsDriftDetection).toBe(false);
  });

  it("appends council observation without execution effect", () => {
    const row = appendShadowTraceFromCouncilV0({
      sessionId: "council_1_x",
      matchId: "cluster_7_x",
      slotId: 7,
      triggers: ["stockfish_timeout"],
      governance: { feedsDriftDetection: false }
    });
    expect(row?.sourceSystem).toBe("council");
    expect(row?.governance.executionEffect).toBe(false);
  });

  it("exports compliance snapshot with entropy summary", () => {
    appendShadowTraceFromStockfishTimeoutV0({ matchId: "cluster_0_x", movetimeMs: 320 });
    appendShadowTraceFromDriftEventV0({
      kind: "DRIFT_EVENT",
      severity: "warn",
      entropyScore: 0.8,
      eventType: "TOPOLOGY_DRIFT_DETECTED",
      causalChainId: "c1"
    });
    const snap = exportShadowComplianceSnapshotV0("test_checkpoint");
    expect(snap.label).toBe("test_checkpoint");
    expect(snap.timeoutCount).toBeGreaterThanOrEqual(1);
    expect(snap.entropySummary.driftEventCount).toBeGreaterThanOrEqual(1);
  });

  it("does not append when shadow mode inactive", async () => {
    vi.resetModules();
    vi.doMock("../rhizohLegalPendingWaitLoopV0.js", () => ({
      isRhizohLegalPendingHoldV0: () => false
    }));
    if (typeof window !== "undefined") {
      window.__rhizoh = { shadowMode: { force: false } };
    }
    const mod = await import("../rhizohShadowTraceLedgerV0.js");
    mod.__resetShadowTraceLedgerForTestV0();
    const row = mod.appendShadowTraceRecordV0({ eventType: "noop" });
    expect(row).toBeNull();
    expect(mod.getShadowTraceLedgerSnapshotV0().recordCount).toBe(0);
  });

  it("isolates ledger governance from feedback loops", () => {
    expect(SHADOW_LEDGER_GOVERNANCE_V0.feedsPolicyDiff).toBe(false);
    expect(SHADOW_LEDGER_GOVERNANCE_V0.uiEffect).toBe(false);
  });
});
