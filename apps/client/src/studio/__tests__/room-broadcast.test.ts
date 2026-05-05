import { describe, expect, it } from "vitest";
import {
  bindAvatarToEntity,
  createBroadcastChannel,
  createPresenceRoom,
  getStudioKernelState,
  joinBroadcastChannel,
  joinPresenceRoom,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore
} from "../store/studioStore.js";

function seed() {
  patchIdentity({
    ownerId: "rb-owner",
    actor: { id: "rb-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("room + broadcast causal slice", () => {
  it("creates room, join appends member_join and updates membership", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:rb:1", ownerId: "rb-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:rb:a", linkedEntityUid: "ent:rb:1" }).ok).toBe(true);

    const cr = createPresenceRoom({ roomUid: "room:rb:1", title: "Hall" });
    expect(cr.ok).toBe(true);

    const jr = joinPresenceRoom({ roomUid: "room:rb:1", avatarUid: "avatar:rb:a" });
    expect(jr.ok).toBe(true);

    const s = getStudioKernelState();
    expect(s.presence.rooms["room:rb:1"]?.memberAvatarUids).toContain("avatar:rb:a");
    expect(s.presence.avatars["avatar:rb:a"]?.currentRoomUid).toBe("room:rb:1");
    const joinNode = Object.values(s.registry.causalGraph.nodes).find(
      (n) => (n.payload.delta as { kind?: string })?.kind === "presence.room.member_join"
    );
    expect(joinNode).toBeDefined();
    const spawnNode = Object.values(s.registry.causalGraph.nodes).find(
      (n) => (n.payload.delta as { kind?: string })?.kind === "avatar.spawn"
    );
    expect(spawnNode).toBeDefined();
    expect((spawnNode?.payload.delta as { zoneId?: string }).zoneId).toBe("audience");
    const enterNode = Object.values(s.registry.causalGraph.nodes).find(
      (n) => (n.payload.delta as { kind?: string })?.kind === "avatar.zone.enter"
    );
    expect(enterNode).toBeDefined();
    const proj = s.presence.avatars["avatar:rb:a"]?.projection;
    expect(proj?.roomUid).toBe("room:rb:1");
    expect(proj?.zoneId).toBe("audience");
    expect(proj?.role).toBe("owner");
    expect(typeof proj?.transform.x).toBe("number");
    expect(s.presence.rooms["room:rb:1"]?.zones?.stage).toBeDefined();

    const jr2 = joinPresenceRoom({ roomUid: "room:rb:1", avatarUid: "avatar:rb:a" });
    expect(jr2.ok).toBe(true);
    const joinCount = Object.values(getStudioKernelState().registry.causalGraph.nodes).filter(
      (n) => (n.payload.delta as { kind?: string })?.kind === "presence.room.member_join"
    ).length;
    expect(joinCount).toBe(1);
  });

  it("creates broadcast and audience join", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:rb:2", ownerId: "rb-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:rb:b", linkedEntityUid: "ent:rb:2" }).ok).toBe(true);

    expect(createBroadcastChannel({ channelUid: "bc:rb:1", title: "Live" }).ok).toBe(true);
    const jr = joinBroadcastChannel({
      channelUid: "bc:rb:1",
      avatarUid: "avatar:rb:b",
      role: "audience"
    });
    expect(jr.ok).toBe(true);

    const s = getStudioKernelState();
    expect(s.presence.broadcasts["bc:rb:1"]?.audienceAvatarUids).toContain("avatar:rb:b");
    expect(s.presence.avatars["avatar:rb:b"]?.currentBroadcastUid).toBe("bc:rb:1");
  });
});
