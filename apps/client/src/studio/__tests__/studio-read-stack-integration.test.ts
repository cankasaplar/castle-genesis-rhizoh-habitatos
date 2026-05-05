import { describe, expect, it } from "vitest";
import {
  broadcastAudienceApplause,
  broadcastLifecycleStart,
  broadcastSpotlightAssign,
  collectRoomsForCrossRoomStitch,
  createBroadcastChannel,
  createPresenceRoom,
  deriveAttentionField,
  deriveAttentionRenderPack,
  derivePropagatedRenderBiasField,
  getStudioKernelState,
  joinPresenceRoom,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore,
  bindAvatarToEntity,
  stitchCrossRoomBiasMap,
  upgradeOntology
} from "../store/studioStore.js";
import { createInitialStudioKernelState } from "../store/initialState";
import { RSK_ONTOLOGY_VERSION } from "../types/rskOntology";

function seed() {
  patchIdentity({
    ownerId: "stk-owner",
    actor: { id: "stk-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("Studio read stack integration (5A → attention → bias → propagate → stitch)", () => {
  it("broadcast fold → deriveAttention → propagate → stitch without throw", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:stk:1", ownerId: "stk-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:stk:1", linkedEntityUid: "ent:stk:1" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:stk:1", title: "Hall" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:stk:1", avatarUid: "avatar:stk:1" }).ok).toBe(true);
    expect(
      createBroadcastChannel({ channelUid: "broadcast:stk:1", title: "Show", roomUid: "room:stk:1" }).ok
    ).toBe(true);
    expect(broadcastLifecycleStart({ broadcastUid: "broadcast:stk:1", roomUid: "room:stk:1" }).ok).toBe(true);
    expect(broadcastAudienceApplause({ broadcastUid: "broadcast:stk:1", intensity: 0.62 }).ok).toBe(true);
    expect(
      broadcastSpotlightAssign({
        broadcastUid: "broadcast:stk:1",
        targetAvatarUid: "avatar:stk:1"
      }).ok
    ).toBe(true);

    const pres = getStudioKernelState().presence;
    const attn = deriveAttentionField(pres, "room:stk:1");
    expect(attn.roomUid).toBe("room:stk:1");
    expect(attn.audienceField.energy).toBeGreaterThan(0.08);
    expect(attn.spotlightField.bias).toBeGreaterThan(0.05);

    const pack = deriveAttentionRenderPack(pres, "room:stk:1");
    expect(pack.attention.roomUid).toBe("room:stk:1");
    expect(pack.renderBias.roomUid).toBe("room:stk:1");

    const prop = derivePropagatedRenderBiasField(pres, "room:stk:1", { zoneIterations: 2, neighborMix: 0.35 });
    expect(prop.emissiveMap.length).toBeGreaterThan(0);

    const rooms = collectRoomsForCrossRoomStitch(pres);
    expect(rooms).toContain("room:stk:1");
    const roomList = rooms.length > 0 ? rooms : ["room:stk:1"];
    const local: Record<string, typeof prop> = {};
    for (const r of roomList) {
      local[r] = derivePropagatedRenderBiasField(pres, r, { zoneIterations: 2, neighborMix: 0.35 });
    }
    const stitched = stitchCrossRoomBiasMap(pres, local, Date.now(), { maxBleed: 0.11 });
    const view = stitched["room:stk:1"];
    expect(view).toBeDefined();
    expect(view!.roomUid).toBe("room:stk:1");
    expect(Number.isFinite(view!.cameraFocusWeight)).toBe(true);
  });

  it("upgradeOntology keeps roomFieldEdges on same ontology version", () => {
    const base = createInitialStudioKernelState();
    const edges = [{ fromRoomUid: "room:x", toRoomUid: "room:y", coupling: 0.4 }];
    const snap = {
      ...base,
      meta: { ...base.meta, ontologyVersion: RSK_ONTOLOGY_VERSION },
      presence: { ...base.presence, roomFieldEdges: edges }
    };
    const up = upgradeOntology(snap);
    expect(up.meta.ontologyVersion).toBe(RSK_ONTOLOGY_VERSION);
    expect(up.presence.roomFieldEdges).toEqual(edges);
  });
});
