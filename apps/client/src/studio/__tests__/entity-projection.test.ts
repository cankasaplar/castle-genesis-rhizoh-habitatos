import { describe, expect, it } from "vitest";
import { CAUSAL_MAIN_BRANCH_ID } from "../runtime/causalGraph";
import { ENTITY_CACHE_KEY, projectEntity, projectEntityFromCausalGraph } from "../runtime/projectionReducer";
import {
  getStudioKernelState,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore
} from "../store/studioStore.js";

describe("entity projection reducer v1", () => {
  it("registerEntity emits genesis causal node and fills projection cache", () => {
    resetRhizohStudioKernelStore();
    patchIdentity({
      ownerId: "e-owner",
      actor: { id: "e-owner", kind: "human" },
      session: null,
      permissions: { "registry.*": true },
      delegates: [],
      sharedOwnerIds: []
    });

    const r = registerEntity({ uid: "ent:castle:1", ownerId: "e-owner" });
    expect(r.ok).toBe(true);

    const s = getStudioKernelState();
    expect(s.registry.entity["ent:castle:1"]).toBeDefined();

    const entityNodes = Object.values(s.registry.causalGraph.nodes).filter((n) => n.type === "entity");
    expect(entityNodes.length).toBeGreaterThanOrEqual(1);
    const gen = entityNodes.find((n) => n.payload.affectsEntityIds?.includes("ent:castle:1"));
    expect(gen?.payload.delta).toMatchObject({ kind: "entity.genesis", entityUid: "ent:castle:1" });

    const key = ENTITY_CACHE_KEY(CAUSAL_MAIN_BRANCH_ID, "ent:castle:1");
    const cached = s.entityProjectionCache[key];
    expect(cached).toBeDefined();
    expect(cached?.uid).toBe("ent:castle:1");
    expect(cached?.genesisNodeId).toBe(gen?.id);
    expect(cached?.anchors.lastAppliedBranchId).toBe(CAUSAL_MAIN_BRANCH_ID);
    expect(cached?.lastProjectionNodeId).toBe(gen?.id);

    const replay = projectEntityFromCausalGraph(s.registry.causalGraph, "ent:castle:1", CAUSAL_MAIN_BRANCH_ID);
    expect(replay.state.physical.pos).toEqual({ x: 0, y: 0, z: 0 });

    const sliced = projectEntity(s.registry.causalGraph, "ent:castle:1", CAUSAL_MAIN_BRANCH_ID, {
      tickLimit: gen?.tickIndex ?? 0
    });
    expect(sliced.lastProjectionNodeId).toBe(gen?.id);
  });
});
