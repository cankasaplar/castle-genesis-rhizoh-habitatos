import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetEpistemicMemoryGraphForTestV0,
  computeEpistemicMemoryGraphDigestV0,
  EPISTEMIC_MEMORY_GOVERNANCE_V0,
  EPISTEMIC_MEMORY_NODE_KIND_V0,
  getEpistemicMemoryGraphComplianceSummaryV0,
  getEpistemicMemoryGraphSnapshotV0,
  projectShadowTraceToEpistemicMemoryV0,
  projectStressConflictGraphToEpistemicMemoryV0
} from "../rhizohEpistemicMemoryGraphV0.js";
import {
  __resetShadowTraceLedgerForTestV0,
  appendShadowTraceRecordV0
} from "../rhizohShadowTraceLedgerV0.js";
import { buildEpistemicConflictGraphV0 } from "../rhizohEpistemicStressInjectionV0.js";

describe("rhizohEpistemicMemoryGraphV0", () => {
  beforeEach(() => {
    __resetShadowTraceLedgerForTestV0();
    __resetEpistemicMemoryGraphForTestV0();
    if (typeof window !== "undefined") {
      window.__rhizoh = { shadowMode: { force: true }, chessGameCluster: { running: true } };
    }
  });

  it("projects shadow records with stress run hub parent links", () => {
    const record = appendShadowTraceRecordV0({
      eventType: "POLICY_DIFF_DRIFT",
      causalChainId: "stress_1_abc_policy",
      matchId: "cluster_0_x",
      slotId: 0,
      payload: { stressRunId: "stress_1_abc", profile: "medium" },
      entropyScore: 0.72
    });
    const node = projectShadowTraceToEpistemicMemoryV0(record);
    expect(node?.parentNodeId).toBeTruthy();
    expect(node?.stressRunId).toBe("stress_1_abc");

    const summary = getEpistemicMemoryGraphComplianceSummaryV0();
    expect(summary.nodeCount).toBeGreaterThanOrEqual(2);
    expect(summary.stressHubCount).toBe(1);
    expect(summary.edgeCount).toBeGreaterThanOrEqual(1);
  });

  it("chains chess move anchors per matchId", () => {
    const first = appendShadowTraceRecordV0({
      eventType: "CHESS_MOVE_ANCHOR",
      causalChainId: "anchor_cluster_0_1",
      matchId: "cluster_0_x",
      slotId: 0
    });
    const second = appendShadowTraceRecordV0({
      eventType: "CHESS_MOVE_ANCHOR",
      causalChainId: "anchor_cluster_0_2",
      matchId: "cluster_0_x",
      slotId: 0
    });
    const n1 = projectShadowTraceToEpistemicMemoryV0(first);
    const n2 = projectShadowTraceToEpistemicMemoryV0(second);
    expect(n2?.parentNodeId).toBe(n1?.nodeId);
  });

  it("projects stress conflict lenses with cross links", () => {
    const conflictGraph = buildEpistemicConflictGraphV0({
      profile: "medium",
      evalVariance: 0.58,
      lensCount: 3
    });
    const lenses = projectStressConflictGraphToEpistemicMemoryV0({
      stressRunId: "stress_2_xyz",
      conflictGraph,
      matchId: "cluster_0_stress",
      slotId: 0
    });
    expect(lenses.length).toBe(3);
    const summary = getEpistemicMemoryGraphComplianceSummaryV0();
    expect(summary.lensCount).toBe(3);
    expect(summary.crossLinkCount).toBeGreaterThanOrEqual(1);
    expect(computeEpistemicMemoryGraphDigestV0()).toMatch(/^h[a-f0-9]{8}$/);
  });

  it("exposes snapshot on window via governance isolation", () => {
    appendShadowTraceRecordV0({
      eventType: "STOCKFISH_TIMEOUT",
      matchId: "cluster_1_x",
      slotId: 1
    });
    const snap = getEpistemicMemoryGraphSnapshotV0();
    expect(snap.schema).toContain("epistemic_memory_graph");
    expect(snap.recentNodes.length).toBeGreaterThanOrEqual(1);
    expect(EPISTEMIC_MEMORY_GOVERNANCE_V0.feedsDriftDetection).toBe(false);
    expect(EPISTEMIC_MEMORY_NODE_KIND_V0.SHADOW_PROJECTION).toBe("shadow_projection");
  });
});
