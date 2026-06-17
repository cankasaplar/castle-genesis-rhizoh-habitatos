import { afterEach, describe, expect, it } from "vitest";
import {
  __resetNodeTemporalFissionForTestV0,
  dedupeTemporalNodeRowsV0,
  detectTemporalNodeClonesV0,
  resolveVersionedEvolutionNodeIdV0,
  stripNodeVersionSuffixV0
} from "../nodeTemporalFissionV0.js";

describe("nodeTemporalFissionV0", () => {
  afterEach(() => {
    __resetNodeTemporalFissionForTestV0();
  });

  it("detects temporal clones on same base node id", () => {
    const scan = detectTemporalNodeClonesV0([
      { nodeId: "tr_mqhxkmjp_e6y1e_256", atMs: 1000 },
      { nodeId: "tr_mqhxkmjp_e6y1e_256", atMs: 2000 },
      { nodeId: "tr_mqhxkmjp_e6y1e_256", atMs: 3000 }
    ]);
    expect(scan.temporalSpam).toBe(true);
    expect(scan.cloneCount).toBe(1);
    expect(scan.clones[0].distinctAtMs).toEqual([1000, 2000, 3000]);
  });

  it("versiones node ids across temporal fission", () => {
    const a = resolveVersionedEvolutionNodeIdV0({
      baseNodeId: "tr_mqhxkmjp_e6y1e_256",
      atMs: 1000,
      semanticSeed: "genesis"
    });
    const b = resolveVersionedEvolutionNodeIdV0({
      baseNodeId: "tr_mqhxkmjp_e6y1e_256",
      atMs: 2000,
      semanticSeed: "genesis"
    });
    expect(a.nodeId).toBe("tr_mqhxkmjp_e6y1e_256:v1");
    expect(b.nodeId).toBe("tr_mqhxkmjp_e6y1e_256:v2");
    expect(b.evolved).toBe(true);
  });

  it("dedupes batch rows into evolution line", () => {
    const out = dedupeTemporalNodeRowsV0([
      { nodeId: "node:alpha", atMs: 10 },
      { nodeId: "node:alpha", atMs: 20 },
      { nodeId: "node:beta", atMs: 30 }
    ]);
    expect(out.fissionCount).toBe(1);
    expect(out.rows.map((r) => r.nodeId)).toEqual(["node:alpha:v1", "node:alpha:v2", "node:beta:v1"]);
  });

  it("strips version suffix for base lookup", () => {
    expect(stripNodeVersionSuffixV0("tr_mqhxkmjp_e6y1e_256:v3")).toBe("tr_mqhxkmjp_e6y1e_256");
  });
});
