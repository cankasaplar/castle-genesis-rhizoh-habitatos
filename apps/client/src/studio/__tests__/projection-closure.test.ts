import { describe, expect, it } from "vitest";
import { CAUSAL_GENESIS_NODE_ID, CAUSAL_MAIN_BRANCH_ID, defaultCausalGraphRegistry } from "../runtime/causalGraph";
import type { CausalNode } from "../types/rskOntology";
import { validateCausalClosureToGenesis } from "../runtime/projectionReducer";

describe("causal closure to genesis", () => {
  it("accepts a chain rooted at kernel genesis", () => {
    const base = defaultCausalGraphRegistry();
    const entityGenesis: CausalNode = {
      id: "cn:test:ent-gen",
      tickIndex: 0,
      timestamp: 1,
      type: "entity",
      causeIds: [CAUSAL_GENESIS_NODE_ID],
      actorId: "system",
      branchId: CAUSAL_MAIN_BRANCH_ID,
      payload: {
        delta: { kind: "entity.genesis", entityUid: "e1" },
        input: {},
        affectsEntityIds: ["e1"]
      }
    };
    const nodes = { ...base.nodes, [entityGenesis.id]: entityGenesis };
    expect(validateCausalClosureToGenesis(entityGenesis, nodes)).toBe(true);
  });

  it("rejects orphan causes that never reach genesis", () => {
    const base = defaultCausalGraphRegistry();
    const orphan: CausalNode = {
      id: "cn:test:orphan",
      tickIndex: 1,
      timestamp: 2,
      type: "entity",
      causeIds: ["cn:missing-parent"],
      actorId: "system",
      branchId: CAUSAL_MAIN_BRANCH_ID,
      payload: {
        delta: { kind: "entity.physical", entityUid: "e1", patch: { pos: { x: 1 } } },
        input: {},
        affectsEntityIds: ["e1"]
      }
    };
    const nodes = { ...base.nodes, [orphan.id]: orphan };
    expect(validateCausalClosureToGenesis(orphan, nodes)).toBe(false);
  });
});
