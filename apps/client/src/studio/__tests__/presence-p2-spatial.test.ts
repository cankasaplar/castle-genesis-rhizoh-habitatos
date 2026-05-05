import { describe, expect, it } from "vitest";
import {
  bindAvatarToEntity,
  createPresenceRoom,
  getStudioKernelState,
  joinPresenceRoom,
  moveAvatarInRoom,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore
} from "../store/studioStore.js";

function seed() {
  patchIdentity({
    ownerId: "p2-owner",
    actor: { id: "p2-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true, "world.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("Presence P2 spatial", () => {
  it("moveAvatarInRoom appends avatar.move and updates projection", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:p2:1", ownerId: "p2-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:p2:a", linkedEntityUid: "ent:p2:1" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:p2:1", title: "Hall" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:p2:1", avatarUid: "avatar:p2:a" }).ok).toBe(true);
    expect(getStudioKernelState().presence.avatars["avatar:p2:a"]?.projection?.zoneId).toBe("audience");

    const mr = moveAvatarInRoom({
      avatarUid: "avatar:p2:a",
      roomUid: "room:p2:1",
      pos: { x: 2.5, y: 0, z: -1.25 },
      rotY: 0.4,
      status: "talking"
    });
    expect(mr.ok).toBe(true);

    const s = getStudioKernelState();
    expect(s.presence.avatars["avatar:p2:a"]?.projection?.transform.x).toBeCloseTo(2.5, 5);
    expect(s.presence.avatars["avatar:p2:a"]?.projection?.status).toBe("talking");
    expect(s.presence.avatars["avatar:p2:a"]?.projection?.rigAnimation).toBe("talk");
    const moveNode = Object.values(s.registry.causalGraph.nodes).find(
      (n) => (n.payload.delta as { kind?: string })?.kind === "avatar.move"
    );
    expect(moveNode).toBeDefined();
  });

  it("moveAvatarInRoom sets rig walk when not broadcasting", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:p2:2", ownerId: "p2-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:p2:b", linkedEntityUid: "ent:p2:2" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:p2:2", title: "Hall2" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:p2:2", avatarUid: "avatar:p2:b" }).ok).toBe(true);
    expect(
      moveAvatarInRoom({
        avatarUid: "avatar:p2:b",
        roomUid: "room:p2:2",
        pos: { x: 1, y: 0, z: 1 },
        rotY: 0
      }).ok
    ).toBe(true);
    expect(getStudioKernelState().presence.avatars["avatar:p2:b"]?.projection?.rigAnimation).toBe("walk");
  });
});
