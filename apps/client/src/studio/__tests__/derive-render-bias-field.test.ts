import { describe, expect, it } from "vitest";
import { deriveAttentionRenderPack, deriveRenderBiasField } from "../lib/deriveRenderBiasField";
import {
  broadcastAudienceApplause,
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
    ownerId: "rb-owner",
    actor: { id: "rb-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("deriveRenderBiasField (5B-A)", () => {
  it("raises stageIntensity and cameraFocusWeight when live broadcast + applause", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:rb:1", ownerId: "rb-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:rb:1", linkedEntityUid: "ent:rb:1" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:rb:1", title: "Hall" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:rb:1", avatarUid: "avatar:rb:1" }).ok).toBe(true);
    expect(
      createBroadcastChannel({ channelUid: "broadcast:rb:1", title: "S", roomUid: "room:rb:1" }).ok
    ).toBe(true);
    expect(broadcastLifecycleStart({ broadcastUid: "broadcast:rb:1", roomUid: "room:rb:1" }).ok).toBe(true);
    expect(broadcastAudienceApplause({ broadcastUid: "broadcast:rb:1", intensity: 0.9 }).ok).toBe(true);

    const s = getStudioKernelState();
    const bias = deriveRenderBiasField(s.presence, "room:rb:1");
    expect(bias.stageIntensity).toBeGreaterThan(0.35);
    expect(bias.cameraFocusWeight).toBeGreaterThan(0.2);
    expect(bias.emissiveMap.some((e) => e.key.startsWith("zone:"))).toBe(true);
  });

  it("deriveAttentionRenderPack shares attention + bias for same room", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(createPresenceRoom({ roomUid: "room:rb:2", title: "H2" }).ok).toBe(true);
    const pack = deriveAttentionRenderPack(getStudioKernelState().presence, "room:rb:2");
    expect(pack.attention.roomUid).toBe("room:rb:2");
    expect(pack.renderBias.roomUid).toBe("room:rb:2");
    expect(pack.renderBias.stageIntensity).toBeGreaterThanOrEqual(0);
  });
});
