import { describe, expect, it } from "vitest";
import {
  assignPresenceRole,
  bindAvatarToEntity,
  createPresenceRoom,
  getStudioKernelState,
  joinPresenceRoom,
  moderateMute,
  moveAvatarInRoom,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore
} from "../store/studioStore.js";

function seed() {
  patchIdentity({
    ownerId: "pr-owner",
    actor: { id: "pr-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("presence roles + moderation", () => {
  it("second joiner is guest; owner can assign moderator with audit trail", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:pr:1", ownerId: "pr-owner" }).ok).toBe(true);
    expect(registerEntity({ uid: "ent:pr:2", ownerId: "pr-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:pr:a", linkedEntityUid: "ent:pr:1" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:pr:b", linkedEntityUid: "ent:pr:2" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:pr:1", title: "Hall" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:pr:1", avatarUid: "avatar:pr:a" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:pr:1", avatarUid: "avatar:pr:b" }).ok).toBe(true);

    const s0 = getStudioKernelState();
    expect(s0.presence.avatars["avatar:pr:a"]?.projection?.role).toBe("owner");
    expect(s0.presence.avatars["avatar:pr:b"]?.projection?.role).toBe("guest");
    expect(s0.presence.rooms["room:pr:1"]?.ownerAvatarUid).toBe("avatar:pr:a");

    const ar = assignPresenceRole({
      roomUid: "room:pr:1",
      targetAvatarUid: "avatar:pr:b",
      role: "moderator",
      assignedByAvatarUid: "avatar:pr:a"
    });
    expect(ar.ok).toBe(true);

    const s = getStudioKernelState();
    expect(s.presence.avatars["avatar:pr:b"]?.projection?.role).toBe("moderator");
    const rn = Object.values(s.registry.causalGraph.nodes).find(
      (n) => (n.payload.delta as { kind?: string })?.kind === "role.assign"
    );
    expect(rn).toBeDefined();
  });

  it("mute blocks move in hall", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:pr:3", ownerId: "pr-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:pr:m", linkedEntityUid: "ent:pr:3" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:pr:m", title: "M" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:pr:m", avatarUid: "avatar:pr:m" }).ok).toBe(true);

    expect(
      moderateMute({
        roomUid: "room:pr:m",
        targetAvatarUid: "avatar:pr:m",
        muted: true,
        actorAvatarUid: "avatar:pr:m"
      }).ok
    ).toBe(true);

    const mv = moveAvatarInRoom({
      avatarUid: "avatar:pr:m",
      roomUid: "room:pr:m",
      pos: { x: 1, y: 0, z: 0 }
    });
    expect(mv.ok).toBe(false);
    if (!mv.ok) expect(mv.error).toBe("muted");
  });
});
