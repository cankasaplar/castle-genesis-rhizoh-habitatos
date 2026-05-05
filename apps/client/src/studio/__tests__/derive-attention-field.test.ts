import { describe, expect, it } from "vitest";
import { deriveAttentionField } from "../lib/deriveAttentionField";
import {
  broadcastLifecycleStart,
  createBroadcastChannel,
  createPresenceRoom,
  getStudioKernelState,
  joinPresenceRoom,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore,
  bindAvatarToEntity
} from "../store/studioStore.js";

function seed() {
  patchIdentity({
    ownerId: "att-owner",
    actor: { id: "att-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("deriveAttentionField", () => {
  it("aggregates gaze edges and spotlight bias when broadcast is live in room", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:att:1", ownerId: "att-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:att:1", linkedEntityUid: "ent:att:1" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:att:1", title: "Hall" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:att:1", avatarUid: "avatar:att:1" }).ok).toBe(true);
    expect(
      createBroadcastChannel({
        channelUid: "broadcast:att:1",
        title: "Show",
        roomUid: "room:att:1"
      }).ok
    ).toBe(true);
    expect(broadcastLifecycleStart({ broadcastUid: "broadcast:att:1", roomUid: "room:att:1" }).ok).toBe(true);

    const s = getStudioKernelState();
    const f = deriveAttentionField(s.presence, "room:att:1");
    expect(f.roomUid).toBe("room:att:1");
    expect(f.spotlightField.broadcastUid).toBe("broadcast:att:1");
    expect(f.spotlightField.bias).toBeGreaterThan(0);
    expect(f.gazeTargets["avatar:att:1"]).toBeUndefined();
  });

  it("returns empty graph for unknown room", () => {
    resetRhizohStudioKernelStore();
    seed();
    const f = deriveAttentionField(getStudioKernelState().presence, "room:none");
    expect(f.gazeGraph.length).toBe(0);
    expect(f.spotlightField.bias).toBe(0);
  });
});
