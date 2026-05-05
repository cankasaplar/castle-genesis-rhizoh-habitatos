import { describe, expect, it } from "vitest";
import { CAUSAL_MAIN_BRANCH_ID } from "../runtime/causalGraph";
import { ENTITY_CACHE_KEY, projectEntityFromCausalGraph } from "../runtime/projectionReducer";
import {
  applyEntityMoveIntent,
  getStudioKernelState,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore
} from "../store/studioStore.js";

function seedOwner(perms: Record<string, boolean>) {
  patchIdentity({
    ownerId: "mv-owner",
    actor: { id: "mv-owner", kind: "human" },
    session: null,
    permissions: perms,
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("PhysicsValidator v1 + entity move causal path", () => {
  it("commits move: projection pos updates from validated causal node", () => {
    resetRhizohStudioKernelStore();
    seedOwner({ "registry.*": true, "physics.*": true });

    const reg = registerEntity({ uid: "ent:mv:a", ownerId: "mv-owner" });
    expect(reg.ok).toBe(true);

    const move = applyEntityMoveIntent({ entityUid: "ent:mv:a", dpos: { x: 1, y: 0, z: 0 } });
    expect(move.ok).toBe(true);
    if (!move.ok) return;
    expect(move.value.outcome).toBe("moved");
    expect(move.value.causalNodeId).toMatch(/^cn:mv:/);

    const s = getStudioKernelState();
    const node = s.registry.causalGraph.nodes[move.value.causalNodeId];
    expect(node?.type).toBe("tool");
    expect(node?.payload.delta).toMatchObject({
      kind: "entity.physical",
      entityUid: "ent:mv:a",
      patch: { pos: { x: 1, y: 0, z: 0 } }
    });

    const replay = projectEntityFromCausalGraph(s.registry.causalGraph, "ent:mv:a", CAUSAL_MAIN_BRANCH_ID);
    expect(replay.state.physical.pos).toEqual({ x: 1, y: 0, z: 0 });

    const key = ENTITY_CACHE_KEY(CAUSAL_MAIN_BRANCH_ID, "ent:mv:a");
    expect(s.entityProjectionCache[key]?.state.physical.pos).toEqual({ x: 1, y: 0, z: 0 });
    expect(s.worldPhysics.globalTick).toBe(1);
  });

  it("rejects out-of-bounds move with rejectionTrace", () => {
    resetRhizohStudioKernelStore();
    seedOwner({ "registry.*": true, "physics.*": true });
    registerEntity({ uid: "ent:mv:b", ownerId: "mv-owner" });

    const move = applyEntityMoveIntent({ entityUid: "ent:mv:b", dpos: { x: 0, y: 0, z: 400 } });
    expect(move.ok).toBe(false);
    if (move.ok) return;
    expect(move.error).toBe("physics_rejected");
    expect(move.rejectionTrace?.join("|")).toContain("feasibility:bounds_violation");
  });

  it("emits tool.collision resolution artifact on narrow-phase co-presence (spatial broad-phase)", () => {
    resetRhizohStudioKernelStore();
    seedOwner({ "registry.*": true, "physics.*": true });
    registerEntity({ uid: "ent:mv:c1", ownerId: "mv-owner" });
    registerEntity({ uid: "ent:mv:c2", ownerId: "mv-owner" });

    const move = applyEntityMoveIntent({ entityUid: "ent:mv:c1", dpos: { x: 0.1, y: 0, z: 0 } });
    expect(move.ok).toBe(true);
    if (!move.ok) return;
    expect(move.value.outcome).toBe("collision_stop");
    if (move.value.outcome !== "collision_stop") return;
    expect(move.value.causalNodeId).toMatch(/^cn:col:/);
    expect(move.value.collisionTargetId).toBe("ent:mv:c2");

    const s = getStudioKernelState();
    const node = s.registry.causalGraph.nodes[move.value.causalNodeId];
    expect(node?.type).toBe("tool.collision");
    expect((node?.payload.delta as { kind?: string }).kind).toBe("collision.resolution");

    const p1 = projectEntityFromCausalGraph(s.registry.causalGraph, "ent:mv:c1", CAUSAL_MAIN_BRANCH_ID);
    expect(p1.state.physical.pos).toEqual({ x: 0, y: 0, z: 0 });
    expect((p1.state.metadata as { lastCollision?: unknown }).lastCollision).toBeDefined();

    const p2 = projectEntityFromCausalGraph(s.registry.causalGraph, "ent:mv:c2", CAUSAL_MAIN_BRANCH_ID);
    expect(p2.state.physical.pos).toEqual({ x: 0, y: 0, z: 0 });
    expect((p2.state.metadata as { lastCollision?: unknown }).lastCollision).toBeDefined();
  });

  it("kernel guard forbids physics without permission", () => {
    resetRhizohStudioKernelStore();
    seedOwner({ "registry.*": true });

    registerEntity({ uid: "ent:mv:d", ownerId: "mv-owner" });
    const move = applyEntityMoveIntent({ entityUid: "ent:mv:d", dpos: { x: 1, y: 0, z: 0 } });
    expect(move.ok).toBe(false);
    if (move.ok) return;
    expect(move.error).toBe("forbidden");
  });
});
