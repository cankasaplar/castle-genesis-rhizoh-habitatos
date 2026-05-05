import { describe, expect, it } from "vitest";
import { CAUSAL_MAIN_BRANCH_ID } from "../runtime/causalGraph";
import { GREENROOM_MAIN_HALL_ROOM_UID, ensureGreenRoomMainHallBound } from "../lib/greenRoomRouteBinding";
import { ingestPresenceMeshDelta } from "../store/presenceMeshIngestSlice";
import { moveAvatarInRoom } from "../store/presenceSpatialSlice";
import { getStudioKernelState, patchIdentity, resetRhizohStudioKernelStore } from "../store/studioStore";

function seedIdentity() {
  patchIdentity({
    ownerId: "mesh-test-owner",
    actor: { id: "mesh-test-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("presenceMeshIngestSlice", () => {
  it("treats duplicate causal node id as idempotent", () => {
    resetRhizohStudioKernelStore();
    seedIdentity();
    expect(ensureGreenRoomMainHallBound().ok).toBe(true);
    const avatarUid = "avatar:mesh-test-owner";
    const mv = moveAvatarInRoom({
      avatarUid,
      roomUid: GREENROOM_MAIN_HALL_ROOM_UID,
      pos: { x: 2, y: 0, z: 1 }
    });
    expect(mv.ok).toBe(true);

    const s = getStudioKernelState();
    const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
    const writer = `presence:${avatarUid}`;
    const tipId = s.registry.causalGraph.writerHeads[`${branchId}::${writer}`];
    expect(tipId).toBeTruthy();
    const node = s.registry.causalGraph.nodes[tipId!];
    expect(node).toBeTruthy();

    const ev = {
      kind: "delta" as const,
      seq: 42,
      roomUid: GREENROOM_MAIN_HALL_ROOM_UID,
      node,
      serverAt: Date.now(),
      writerSubject: writer
    };
    const again = ingestPresenceMeshDelta(ev);
    expect(again.ok).toBe(true);
    if (again.ok) expect(again.value?.duplicate).toBe(true);
  });
});
