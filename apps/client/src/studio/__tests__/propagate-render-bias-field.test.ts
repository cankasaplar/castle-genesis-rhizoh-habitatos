import { describe, expect, it } from "vitest";
import { deriveRenderBiasField } from "../lib/deriveRenderBiasField";
import { derivePropagatedRenderBiasField, propagateRenderBiasField } from "../lib/propagateRenderBiasField";
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
    ownerId: "pb2-owner",
    actor: { id: "pb2-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("propagateRenderBiasField (5B-C)", () => {
  it("diffuses zone-linked energy so emissiveMap can differ from point sample", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:pb2:1", ownerId: "pb2-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:pb2:1", linkedEntityUid: "ent:pb2:1" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:pb2:1", title: "Hall" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:pb2:1", avatarUid: "avatar:pb2:1" }).ok).toBe(true);
    expect(
      createBroadcastChannel({ channelUid: "broadcast:pb2:1", title: "S", roomUid: "room:pb2:1" }).ok
    ).toBe(true);
    expect(broadcastLifecycleStart({ broadcastUid: "broadcast:pb2:1", roomUid: "room:pb2:1" }).ok).toBe(true);
    expect(broadcastAudienceApplause({ broadcastUid: "broadcast:pb2:1", intensity: 0.95 }).ok).toBe(true);

    const s = getStudioKernelState();
    const base = deriveRenderBiasField(s.presence, "room:pb2:1");
    const prop = derivePropagatedRenderBiasField(s.presence, "room:pb2:1", { zoneIterations: 3, neighborMix: 0.45 });
    const zInt = (m: typeof base.emissiveMap, k: string) => m.find((e) => e.key === k)?.intensity ?? 0;
    const delta =
      Math.abs(zInt(prop.emissiveMap, "zone:stage") - zInt(base.emissiveMap, "zone:stage")) +
      Math.abs(zInt(prop.emissiveMap, "zone:audience") - zInt(base.emissiveMap, "zone:audience"));
    expect(delta).toBeGreaterThan(0.02);
    expect(prop.stageIntensity).toBeGreaterThan(0);
    expect(zInt(prop.emissiveMap, "zone:stage")).toBeGreaterThan(0);
  });

  it("propagateRenderBiasField accepts prebuilt AttentionRenderPack", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(createPresenceRoom({ roomUid: "room:pb2:2", title: "H" }).ok).toBe(true);
    const s = getStudioKernelState();
    const pack = {
      attention: {
        roomUid: "room:pb2:2",
        gazeTargets: {},
        gazeGraph: [],
        focusHeatmap: { stage: 0.9, audience: 0.2 },
        resonancePairs: [],
        spotlightField: { bias: 0.5, targetUid: undefined },
        audienceField: { energy: 0.3, broadcastUid: undefined },
        companionLinks: [],
        petLinks: []
      },
      renderBias: {
        roomUid: "room:pb2:2",
        emissiveMap: [],
        cameraFocusWeight: 0.4,
        stageIntensity: 0.6,
        avatarGlow: {},
        petGlow: {},
        rhizohPulse: {}
      }
    };
    const out = propagateRenderBiasField(pack, s.presence);
    expect(out.emissiveMap.length).toBeGreaterThan(0);
  });
});
