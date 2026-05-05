import { describe, expect, it } from "vitest";
import {
  broadcastAudienceApplause,
  broadcastLifecycleStart,
  broadcastLifecycleStop,
  createBroadcastChannel,
  getStudioKernelState,
  joinBroadcastChannel,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore,
  bindAvatarToEntity
} from "../store/studioStore.js";

function seed() {
  patchIdentity({
    ownerId: "bd-owner",
    actor: { id: "bd-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("5A broadcast causal layer", () => {
  it("create + fold yields projection; start/stop updates state and streamState", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(
      createBroadcastChannel({
        channelUid: "broadcast:5a:1",
        title: "Hall A",
        roomUid: "room:5a:1"
      }).ok
    ).toBe(true);
    let s = getStudioKernelState();
    const proj0 = s.presence.broadcastProjections?.["broadcast:5a:1"];
    expect(proj0?.uid).toBe("broadcast:5a:1");
    expect(proj0?.roomUid).toBe("room:5a:1");
    expect(proj0?.state).toBe("idle");
    expect(s.presence.broadcasts["broadcast:5a:1"]?.streamState).toBe("idle");

    expect(broadcastLifecycleStart({ broadcastUid: "broadcast:5a:1", roomUid: "room:5a:1" }).ok).toBe(true);
    s = getStudioKernelState();
    expect(s.presence.broadcastProjections?.["broadcast:5a:1"]?.state).toBe("live");
    expect(s.presence.broadcasts["broadcast:5a:1"]?.streamState).toBe("live");
    expect(s.presence.directorByRoomUid?.["room:5a:1"]?.currentBroadcastUid).toBe("broadcast:5a:1");

    expect(broadcastLifecycleStop({ broadcastUid: "broadcast:5a:1" }).ok).toBe(true);
    s = getStudioKernelState();
    expect(s.presence.broadcastProjections?.["broadcast:5a:1"]?.state).toBe("ended");
    expect(s.presence.broadcasts["broadcast:5a:1"]?.streamState).toBe("ended");
    expect(s.presence.directorByRoomUid?.["room:5a:1"]?.currentBroadcastUid).toBeUndefined();
  });

  it("join audience increments folded audienceCount", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:5a:a", ownerId: "bd-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:5a:a", linkedEntityUid: "ent:5a:a" }).ok).toBe(true);
    expect(createBroadcastChannel({ channelUid: "broadcast:5a:2", title: "B" }).ok).toBe(true);
    expect(
      joinBroadcastChannel({
        channelUid: "broadcast:5a:2",
        avatarUid: "avatar:5a:a",
        role: "audience"
      }).ok
    ).toBe(true);
    const s = getStudioKernelState();
    expect(s.presence.broadcastProjections?.["broadcast:5a:2"]?.audienceCount).toBe(1);
  });

  it("audience applause updates energy hint", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(createBroadcastChannel({ channelUid: "broadcast:5a:3", title: "C" }).ok).toBe(true);
    expect(broadcastAudienceApplause({ broadcastUid: "broadcast:5a:3", intensity: 0.88 }).ok).toBe(true);
    const s = getStudioKernelState();
    expect(s.presence.broadcastProjections?.["broadcast:5a:3"]?.audienceEnergy).toBeCloseTo(0.88, 5);
  });
});
