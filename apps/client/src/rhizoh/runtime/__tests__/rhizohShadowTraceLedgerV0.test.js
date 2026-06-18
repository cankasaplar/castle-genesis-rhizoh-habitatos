import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  __resetShadowTraceLedgerForTestV0,
  appendShadowTraceFromCouncilV0,
  appendShadowTraceFromDriftEventV0,
  appendShadowTraceFromStockfishTimeoutV0,
  appendShadowTraceRecordV0,
  computeShadowReplayFingerprintV0,
  exportShadowComplianceSnapshotV0,
  getShadowTraceLedgerSnapshotV0,
  injectShadowEntropyTestV0,
  isRhizohShadowModeActiveV0,
  resolveShadowModeReasonV0,
  SHADOW_LEDGER_GOVERNANCE_V0
} from "../rhizohShadowTraceLedgerV0.js";

vi.mock("../rhizohLegalPendingWaitLoopV0.js", () => ({
  isRhizohLegalPendingHoldV0: () => true
}));

describe("rhizohShadowTraceLedgerV0", () => {
  beforeEach(() => {
    __resetShadowTraceLedgerForTestV0();
    if (typeof window !== "undefined") {
      window.localStorage?.removeItem("rhizoh_chess_telemetry_level_v0");
      window.__rhizoh = { shadowMode: { force: true }, chessGameCluster: { running: true } };
    }
  });

  it("activates shadow mode when chess cluster is running", async () => {
    vi.resetModules();
    vi.doMock("../rhizohLegalPendingWaitLoopV0.js", () => ({
      isRhizohLegalPendingHoldV0: () => false
    }));
    vi.doMock("../ingress/ingress_router.js", () => ({
      resolveIngressRouteV0: () => ({ route: "app", required: false, acked: true })
    }));
    if (typeof window === "undefined") return;
    window.__rhizoh = { chessGameCluster: { running: true } };
    const mod = await import("../rhizohShadowTraceLedgerV0.js");
    expect(mod.isRhizohShadowModeActiveV0()).toBe(true);
    expect(mod.resolveShadowModeReasonV0()).toBe("chess_cluster_observation");
  });

  it("injects synthetic entropy for pipeline validation", () => {
    const out = injectShadowEntropyTestV0({ matchId: "cluster_0_test" });
    expect(out?.drift?.eventType).toContain("SYNTHETIC");
    expect(out?.timeout?.eventType).toBe("STOCKFISH_TIMEOUT");
    expect(getShadowTraceLedgerSnapshotV0().recordCount).toBeGreaterThanOrEqual(2);
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
    expect(snap.interpretationOnly).toBe(true);
    expect(snap.replayLock?.interpretationOnly).toBe(true);
    expect(snap.replayLock?.replayFingerprint).toMatch(/^h[a-f0-9]{8}$/);
    expect(snap.executionGovernance?.mode).toBeDefined();
    expect(snap.timeoutCount).toBeGreaterThanOrEqual(1);
    expect(snap.entropySummary.driftEventCount).toBeGreaterThanOrEqual(1);
    expect(snap).toHaveProperty("stressInjection");
    expect(snap).toHaveProperty("memoryGraph");
    expect(snap.memoryGraph.memoryGraphDigest).toMatch(/^h[a-f0-9]{8}$/);
  });

  it("does not append when shadow mode inactive", async () => {
    vi.resetModules();
    vi.doMock("../rhizohLegalPendingWaitLoopV0.js", () => ({
      isRhizohLegalPendingHoldV0: () => false
    }));
    vi.doMock("../ingress/ingress_router.js", () => ({
      resolveIngressRouteV0: () => ({ route: "app", required: false, acked: true })
    }));
    if (typeof window !== "undefined") {
      window.__rhizoh = { shadowMode: { force: false }, chessGameCluster: { running: false } };
    }
    const mod = await import("../rhizohShadowTraceLedgerV0.js");
    mod.__resetShadowTraceLedgerForTestV0();
    const row = mod.appendShadowTraceRecordV0({ eventType: "noop" });
    expect(row).toBeNull();
    expect(mod.getShadowTraceLedgerSnapshotV0().recordCount).toBe(0);
  });

  it("computes deterministic replay fingerprint", () => {
    appendShadowTraceFromDriftEventV0({
      kind: "DRIFT_EVENT",
      severity: "info",
      entropyScore: 0.5,
      eventType: "TOPOLOGY_DRIFT_DETECTED",
      causalChainId: "fp_a"
    });
    appendShadowTraceFromDriftEventV0({
      kind: "DRIFT_EVENT",
      severity: "info",
      entropyScore: 0.6,
      eventType: "TOPOLOGY_DRIFT_DETECTED",
      causalChainId: "fp_b"
    });
    const rows = getShadowTraceLedgerSnapshotV0().recent;
    const a = computeShadowReplayFingerprintV0(rows);
    const b = computeShadowReplayFingerprintV0(rows);
    expect(a).toBe(b);
    expect(a).toMatch(/^h[a-f0-9]{8}$/);
  });

  it("isolates ledger governance from feedback loops", () => {
    expect(SHADOW_LEDGER_GOVERNANCE_V0.feedsPolicyDiff).toBe(false);
    expect(SHADOW_LEDGER_GOVERNANCE_V0.uiEffect).toBe(false);
  });
});
