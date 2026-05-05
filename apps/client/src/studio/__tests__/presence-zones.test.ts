import { describe, expect, it } from "vitest";
import {
  bindAvatarToEntity,
  createPresenceRoom,
  getStudioKernelState,
  joinPresenceRoom,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore,
  transitionPresenceZone
} from "../store/studioStore.js";
import { setStudioKernelState } from "../store/internalStore";

function seed() {
  patchIdentity({
    ownerId: "z-owner",
    actor: { id: "z-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("presence room zones", () => {
  it("transition to stage updates zoneId and default broadcasting posture", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:z:1", ownerId: "z-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:z:1", linkedEntityUid: "ent:z:1" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:z:1", title: "Hall" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:z:1", avatarUid: "avatar:z:1" }).ok).toBe(true);

    const tr = transitionPresenceZone({
      avatarUid: "avatar:z:1",
      roomUid: "room:z:1",
      toZoneId: "stage"
    });
    expect(tr.ok).toBe(true);

    const s = getStudioKernelState();
    expect(s.presence.avatars["avatar:z:1"]?.projection?.zoneId).toBe("stage");
    expect(s.presence.avatars["avatar:z:1"]?.projection?.status).toBe("broadcasting");
    const tnode = Object.values(s.registry.causalGraph.nodes).find(
      (n) => (n.payload.delta as { kind?: string })?.kind === "avatar.zone.transition"
    );
    expect(tnode).toBeDefined();
  });

  it("vip zone rejects when allowlist is set and avatar not listed", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:z:2", ownerId: "z-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:z:2", linkedEntityUid: "ent:z:2" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:z:vip", title: "VIP Hall" }).ok).toBe(true);
    const s0 = getStudioKernelState();
    const room = s0.presence.rooms["room:z:vip"]!;
    setStudioKernelState({
      ...s0,
      presence: {
        ...s0.presence,
        rooms: {
          ...s0.presence.rooms,
          "room:z:vip": { ...room, vipAllowlistAvatarUids: ["avatar:z:other"] }
        }
      }
    });
    expect(joinPresenceRoom({ roomUid: "room:z:vip", avatarUid: "avatar:z:2" }).ok).toBe(true);

    const tr = transitionPresenceZone({ avatarUid: "avatar:z:2", roomUid: "room:z:vip", toZoneId: "vip" });
    expect(tr.ok).toBe(false);
    if (!tr.ok) expect(tr.error).toBe("vip_not_allowed");
  });
});
