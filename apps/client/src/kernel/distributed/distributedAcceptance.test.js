import { describe, expect, it } from "vitest";
import { createLineageFork } from "./constitutionalFork.js";
import { mergeEpochLineages } from "./constitutionalMerge.js";
import { selectCanonicalFork } from "./constitutionalConsensus.js";
import { mergePressureVectorsSemilattice, mergePolicyWeightsLWW } from "./constitutionalCRDT.js";
import { runConstitutionalEpoch } from "../orchestrator/runConstitutionalEpoch.js";
import { epochInput } from "../orchestrator/epochFixtures.js";
import { classifyConstitutionalConflict, CONFLICT_CLASSES } from "./constitutionalConflict.js";
import { hashCollapsedBranches, pruneBranchLineage } from "./branchPruner.js";

describe("vNext-536 distributed constitutional protocol", () => {
  it("fork header binds parent + branch id", () => {
    const f = createLineageFork({ parentEpochHash: "0xabc", branchId: "fork-A" });
    expect(f.parentEpochHash).toBe("0xabc");
    expect(f.lineageBranchId).toBe("fork-A");
  });

  it("merge produces sorted mergeAncestry + mergeHash", () => {
    const m = mergeEpochLineages({
      left: {
        epochHash: "0x2",
        legitimacyResonance: 0.7,
        atomicSnapshot: { constitution: { confidence: 0.8, contradiction: 0.2 } }
      },
      right: {
        epochHash: "0x1",
        legitimacyResonance: 0.5,
        atomicSnapshot: { constitution: { confidence: 0.75, contradiction: 0.25 } }
      }
    });
    expect(m.mergeAncestry).toEqual(["0x1", "0x2"]);
    expect(m.mergeHash).toMatch(/^0x[0-9a-f]+$/);
    expect(m.mergedLegitimacyResonance).toBeGreaterThan(0);
  });

  it("consensus selects higher composite score", () => {
    const a = selectCanonicalFork([
      {
        epochHash: "a",
        lineageDepth: 4,
        sealConfidence: 0.5,
        legitimacyResonance: 0.5,
        contradictionCost: 0.4,
        constitutionalSimilarity: 0.5
      },
      {
        epochHash: "b",
        lineageDepth: 6,
        sealConfidence: 0.85,
        legitimacyResonance: 0.8,
        contradictionCost: 0.15,
        constitutionalSimilarity: 0.9
      }
    ]);
    expect(a.winner.epochHash).toBe("b");
  });

  it("CRDT merges are pure and bounded", () => {
    const p = mergePressureVectorsSemilattice([0.2, 0.9], [0.7, 0.3]);
    expect(p.every((x) => x >= 0 && x <= 1)).toBe(true);
    const w = mergePolicyWeightsLWW(new Float32Array([0.3, 0.8]), new Float32Array([0.9, 0.2]), 2, 1);
    expect(w[0]).toBeCloseTo(0.3, 5);
    expect(w[1]).toBeCloseTo(0.8, 5);
  });

  it("same parent + different branch id → different epochHash", () => {
    const inp = epochInput();
    const a = runConstitutionalEpoch({ ...inp, lineageBranchId: "main" });
    const b = runConstitutionalEpoch({ ...inp, lineageBranchId: "fork-A" });
    expect(a.epochHash).not.toBe(b.epochHash);
    expect(b.lineage.lineageBranchId).toBe("fork-A");
  });
});

describe("vNext-537 constitutional conflict + branch prune", () => {
  it("classifyConstitutionalConflict returns class, severity, resolutionPath", () => {
    const c = classifyConstitutionalConflict({
      left: {
        legitimacyResonance: 0.9,
        atomicSnapshot: { constitution: { confidence: 0.8, contradiction: 0.15 } }
      },
      right: {
        legitimacyResonance: 0.35,
        atomicSnapshot: { constitution: { confidence: 0.45, contradiction: 0.72 } }
      },
      mergeMeta: { constitutionalSimilarity: 0.25 },
      leftBranchId: "main",
      rightBranchId: "fork-A",
      sameParent: true,
      clockSkewMs: 100,
      storeHashCollision: false
    });
    expect(CONFLICT_CLASSES).toContain(c.conflictClass);
    expect(c.severity).toBeGreaterThanOrEqual(0);
    expect(c.severity).toBeLessThanOrEqual(1);
    expect(typeof c.resolutionPath).toBe("string");
    expect(c.scores.semantic_conflict).toBeGreaterThan(0);
  });

  it("epistemic_conflict wins when observation filters diverge (same similarity)", () => {
    const c = classifyConstitutionalConflict({
      left: {
        atomicSnapshot: { constitution: { confidence: 0.75, contradiction: 0.2 } },
        legitimacyResonance: 0.6
      },
      right: {
        atomicSnapshot: { constitution: { confidence: 0.76, contradiction: 0.19 } },
        legitimacyResonance: 0.61
      },
      mergeMeta: { constitutionalSimilarity: 0.95 },
      leftObservationFilter: { coherenceLift: 0.45, uncertaintyDamp: 0.05, salienceBoost: 0.4, noveltyDamp: 0.1, conflictDamp: 0.2 },
      rightObservationFilter: { coherenceLift: 0.02, uncertaintyDamp: 0.55, salienceBoost: 0.02, noveltyDamp: 0.5, conflictDamp: 0.01 }
    });
    expect(c.conflictClass).toBe("epistemic_conflict");
    expect(c.severity).toBeGreaterThan(0.22);
    expect(c.resolutionPath).toMatch(/perception|observation|merge_perception/);
  });

  it("resource_conflict wins when storeHashCollision", () => {
    const c = classifyConstitutionalConflict({
      left: { atomicSnapshot: { constitution: { confidence: 0.7, contradiction: 0.2 } } },
      right: { atomicSnapshot: { constitution: { confidence: 0.71, contradiction: 0.19 } } },
      mergeMeta: { constitutionalSimilarity: 0.95 },
      storeHashCollision: true
    });
    expect(c.conflictClass).toBe("resource_conflict");
    expect(c.resolutionPath).toBe("partition_shard_reconcile");
  });

  it("pruneBranchLineage retains top scores and collapses pruned artifact", () => {
    const heads = [
      { epochHash: "h1", lineageBranchId: "main", consensusScore: 0.9, lineageDepth: 5 },
      { epochHash: "h2", lineageBranchId: "fork-a", consensusScore: 0.4, lineageDepth: 4 },
      { epochHash: "h3", lineageBranchId: "fork-b", consensusScore: 0.35, lineageDepth: 3 },
      { epochHash: "h4", lineageBranchId: "fork-c", consensusScore: 0.8, lineageDepth: 6 },
      { epochHash: "h5", lineageBranchId: "fork-d", consensusScore: 0.2, lineageDepth: 2 }
    ];
    const p = pruneBranchLineage({ branches: heads, maxRetain: 3, minScoreToKeep: 0.3 });
    expect(p.canonical?.epochHash).toBe("h1");
    expect(p.retained.length).toBeLessThanOrEqual(3);
    expect(p.pruned.length + p.retained.length).toBe(heads.length);
    expect(p.collapsedArtifactHash).toBe(hashCollapsedBranches(p.pruned));
  });

  it("aggressive prune when branch count exceeds entropyCap", () => {
    const heads = Array.from({ length: 20 }, (_, i) => ({
      epochHash: `e${i}`,
      consensusScore: 0.5 + i * 0.01,
      lineageDepth: i
    }));
    const p = pruneBranchLineage({ branches: heads, maxRetain: 4, entropyCap: 16 });
    expect(p.prunePolicy).toBe("aggressive_entropy_cap");
    expect(p.retained.length).toBeLessThanOrEqual(4);
  });
});
