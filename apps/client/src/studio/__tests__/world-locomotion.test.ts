import { describe, expect, it } from "vitest";
import {
  bindAvatarToEntity,
  createPresenceRoom,
  getStudioKernelState,
  joinPresenceRoom,
  moveAvatarInRoom,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore,
  upsertWorldPortal,
  upsertWorldRegion,
  bindPresenceRoomToRegion
} from "../store/studioStore.js";

function seedOwner() {
  patchIdentity({
    ownerId: "wl-owner",
    actor: { id: "wl-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true, "world.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("world locomotion (avatar.move → region)", () => {
  it("emits leave / portal.cross / enter / chunk causal chain when xz crosses regions", async () => {
    resetRhizohStudioKernelStore();
    seedOwner();

    upsertWorldRegion({
      uid: "region:wl-left",
      kind: "district",
      title: "WL Left",
      bounds: { minX: -11, maxX: -0.25, minZ: -11, maxZ: 11 },
      priority: 2,
      portals: [],
      density: 0.4,
      weather: "clear",
      biome: "urban",
      ecologyHealth: 0.7
    });
    upsertWorldRegion({
      uid: "region:wl-right",
      kind: "district",
      title: "WL Right",
      bounds: { minX: 0.25, maxX: 11, minZ: -11, maxZ: 11 },
      priority: 2,
      portals: [],
      density: 0.4,
      weather: "clear",
      biome: "urban",
      ecologyHealth: 0.7
    });
    upsertWorldPortal({
      uid: "edge:wl-left-right",
      fromRegionUid: "region:wl-left",
      toRegionUid: "region:wl-right",
      cost: 1,
      bidirectional: true
    });
    bindPresenceRoomToRegion({ roomUid: "room:wl:1", regionUid: "region:wl-left" });

    expect(registerEntity({ uid: "ent:wl:1", ownerId: "wl-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:wl:a", linkedEntityUid: "ent:wl:1" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:wl:1", title: "Test hall" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:wl:1", avatarUid: "avatar:wl:a" }).ok).toBe(true);

    expect(
      moveAvatarInRoom({
        avatarUid: "avatar:wl:a",
        roomUid: "room:wl:1",
        pos: { x: -4, y: 0, z: 0 },
        rotY: 0
      }).ok
    ).toBe(true);

    const afterLeft = getStudioKernelState();
    expect(afterLeft.worldLocomotion?.avatarRegionUid["avatar:wl:a"]).toBe("region:wl-left");

    await new Promise<void>((r) => setTimeout(r, 260));

    expect(
      moveAvatarInRoom({
        avatarUid: "avatar:wl:a",
        roomUid: "room:wl:1",
        pos: { x: 4, y: 0, z: 0 },
        rotY: 0
      }).ok
    ).toBe(true);

    const s = getStudioKernelState();
    expect(s.worldLocomotion?.avatarRegionUid["avatar:wl:a"]).toBe("region:wl-right");
    expect(s.presence.avatars["avatar:wl:a"]?.worldRegionUid).toBe("region:wl-right");
    expect(s.worldLocomotion?.activeRegionUid).toBe("region:wl-right");

    const kinds = Object.values(s.registry.causalGraph.nodes).map((n) => (n.payload.delta as { kind?: string })?.kind);
    expect(kinds).toContain("world.avatar.region.leave");
    expect(kinds).toContain("world.portal.cross");
    expect(kinds).toContain("world.avatar.region.enter");
    expect(kinds).toContain("world.chunk.deactivate");
    expect(kinds).toContain("world.chunk.activate");
  });
});
