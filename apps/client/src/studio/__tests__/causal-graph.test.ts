import { describe, expect, it } from "vitest";
import { bootstrapKernelRootIfNeeded } from "../lib/bootstrapKernelRoot";
import { CAUSAL_GENESIS_NODE_ID } from "../runtime/causalGraph";
import { tickMind } from "../store/mindRuntimeSlice";
import {
  getStudioKernelState,
  patchIdentity,
  resetRhizohStudioKernelStore
} from "../store/studioStore.js";

describe("causal graph (Phase 2A)", () => {
  it("records a causal node on each mind tick", () => {
    resetRhizohStudioKernelStore();
    patchIdentity({
      ownerId: "cg-user",
      actor: { id: "cg-user", kind: "human" },
      session: null,
      permissions: { "registry.*": true, "sim.*": true },
      delegates: [],
      sharedOwnerIds: []
    });
    bootstrapKernelRootIfNeeded("cg-user", { environment: "default" });

    const mindUid = "mind:cg-user:seed";
    const before = Object.keys(getStudioKernelState().registry.causalGraph.nodes).length;

    const r = tickMind(mindUid);
    expect(r.ok).toBe(true);

    const cg = getStudioKernelState().registry.causalGraph;
    expect(Object.keys(cg.nodes).length).toBeGreaterThanOrEqual(before + 1);
    const tip = cg.writerHeads["branch:main::" + mindUid];
    expect(tip).toBeDefined();
    const node = tip ? cg.nodes[tip] : undefined;
    expect(node?.type).toBe("mind");
    expect(node?.branchId).toBe("branch:main");
    expect(node?.causeIds?.length).toBeGreaterThanOrEqual(1);
    expect(node?.causeIds?.[0]).toBe(CAUSAL_GENESIS_NODE_ID);

    const firstTip = tip;
    const r2 = tickMind(mindUid);
    expect(r2.ok).toBe(true);
    const cg2 = getStudioKernelState().registry.causalGraph;
    const tip2 = cg2.writerHeads["branch:main::" + mindUid];
    expect(tip2).not.toBe(firstTip);
    const n2 = tip2 ? cg2.nodes[tip2] : undefined;
    expect(n2?.causeIds?.[0]).toBe(firstTip);
  });
});
