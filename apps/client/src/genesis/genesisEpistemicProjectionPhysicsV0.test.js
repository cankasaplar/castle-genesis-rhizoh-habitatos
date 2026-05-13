import { describe, expect, it } from "vitest";
import {
  bandAlgebraMeasuresV0,
  buildTemporalProjectionTensorV0,
  classifyContainmentPhiV0,
  containmentAlignmentMapV0,
  crossOriginFieldTopologyV0,
  crossOriginObservationalGeometryV0,
  epistemicSetDifference,
  epistemicSetIntersection,
  genesisCheckpointRowsFromGetBodyV0,
  jaccardFiniteSetsV0,
  jaccardRangeLineageV0,
  seqSetFromCheckpointRowsInWindow
} from "./genesisEpistemicProjectionPhysicsV0.js";

const row = (seq) => ({ seqCommittedThrough: seq, prevLedgerRoot: "p", ledgerRoot: "l" });

describe("genesisEpistemicProjectionPhysicsV0", () => {
  it("parses checkpoint rows from GET body", () => {
    expect(genesisCheckpointRowsFromGetBodyV0(null)).toEqual([]);
    expect(genesisCheckpointRowsFromGetBodyV0({ checkpoints: [row(1)] })).toHaveLength(1);
  });

  it("classifies containment φ", () => {
    expect(classifyContainmentPhiV0(1, 10, 10)).toBe("contained");
    expect(classifyContainmentPhiV0(1, 11, 10)).toBe("exceeds");
    expect(classifyContainmentPhiV0(0, 10, 10)).toBe("invalid");
    expect(classifyContainmentPhiV0(1, 10, null)).toBe("unknown");
  });

  it("computes measurable band algebra (sets, not UI)", () => {
    const range = [row(2), row(4), row(6)];
    const lineage = [row(4), row(8)];
    const R = seqSetFromCheckpointRowsInWindow(range, 1, 10);
    const L = seqSetFromCheckpointRowsInWindow(lineage, 1, 10);
    expect([...R].sort((a, b) => a - b)).toEqual([2, 4, 6]);
    expect([...L].sort((a, b) => a - b)).toEqual([4, 8]);
    expect([...epistemicSetIntersection(R, L)].sort((a, b) => a - b)).toEqual([4]);
    expect([...epistemicSetDifference(R, L)].sort((a, b) => a - b)).toEqual([2, 6]);
    const j = jaccardRangeLineageV0(R, L);
    expect(j).toBeCloseTo(1 / 4, 6);
    const m = bandAlgebraMeasuresV0(R, L);
    expect(m.cardinalityOverlap).toBe(1);
    expect(m.cardinalityUnion).toBe(4);
    expect(m.jaccardRangeLineage).toBeCloseTo(0.25, 6);
  });

  it("builds temporal projection tensor v0", () => {
    const t = buildTemporalProjectionTensorV0({
      fromN: 1,
      toN: 10,
      rangeRows: [row(2), row(4)],
      lineageRows: [row(4), row(5)]
    });
    expect(t.v).toBe(0);
    expect(t.window).toEqual({ from: 1, to: 10 });
    expect(t.sets.rangeSeqSorted).toEqual([2, 4]);
    expect(t.sets.lineageSeqSorted).toEqual([4, 5]);
    expect(t.sets.overlapSeqSorted).toEqual([4]);
    expect(t.sets.rangeOnlySeqSorted).toEqual([2]);
    expect(t.sets.lineageOnlySeqSorted).toEqual([5]);
    expect(t.rows.find((r) => r.seq === 4)?.overlap).toBe(true);
    expect(t.rows.find((r) => r.seq === 2)?.overlap).toBe(false);
  });

  it("containment alignment map is explicit pair, not merge", () => {
    const a = containmentAlignmentMapV0("contained", "exceeds");
    expect(a.mode).toBe("divergent");
    expect(a.pair).toEqual(["contained", "exceeds"]);
    expect(a.code).toBe("cross:contained|exceeds");
    expect(containmentAlignmentMapV0("contained", "contained").map).toBe("diagonal");
    expect(containmentAlignmentMapV0("contained", null).mode).toBe("single_origin");
  });

  it("cross-origin observational geometry: |R_A∩R_B|, |L_A∩L_B|, tensor norm", () => {
    const tA = buildTemporalProjectionTensorV0({
      fromN: 1,
      toN: 10,
      rangeRows: [row(2), row(4)],
      lineageRows: [row(4)]
    });
    const tB = buildTemporalProjectionTensorV0({
      fromN: 1,
      toN: 10,
      rangeRows: [row(4), row(6)],
      lineageRows: [row(4), row(8)]
    });
    const g = crossOriginObservationalGeometryV0(tA, tB);
    expect(g?.windowMismatch).toBe(false);
    expect(g?.cardinalityRangeIntersectionAB).toBe(1);
    expect(g?.cardinalityLineageIntersectionAB).toBe(1);
    expect(g?.cardinalityOverlapIntersectionAB).toBe(1);
    expect(g?.overlapJaccardCrossOrigin).toBe(1);
    expect(g?.tensorDifferenceNorm01).toBeCloseTo(7 / 18, 5);
    expect(g?.channelDivergenceVector01).toEqual([
      g?.channelDivergenceRange01,
      g?.channelDivergenceLineage01,
      g?.channelDivergenceOverlap01
    ]);
    const topo = crossOriginFieldTopologyV0(/** @type {any} */ (g));
    expect(topo?.stressOrdering.startsWith("R")).toBe(true);
    expect(topo?.dominant).toBe("R");

    const tOtherWindow = buildTemporalProjectionTensorV0({
      fromN: 2,
      toN: 10,
      rangeRows: [row(4)],
      lineageRows: []
    });
    const mismatch = crossOriginObservationalGeometryV0(tA, tOtherWindow);
    expect(mismatch?.windowMismatch).toBe(true);
    expect(mismatch?.tensorDifferenceNorm01).toBeNull();
    expect(jaccardFiniteSetsV0(new Set([1, 2]), new Set([2, 3]))).toBeCloseTo(1 / 3, 6);
  });

  it("flat field topology", () => {
    const t = buildTemporalProjectionTensorV0({
      fromN: 1,
      toN: 5,
      rangeRows: [row(2)],
      lineageRows: [row(2)]
    });
    const topo = crossOriginFieldTopologyV0(crossOriginObservationalGeometryV0(t, t));
    expect(topo?.dominant).toBe("flat");
    expect(topo?.anisotropy01).toBe(0);
    expect(topo?.stressOrdering).toBe("L>O>R");
  });
});
