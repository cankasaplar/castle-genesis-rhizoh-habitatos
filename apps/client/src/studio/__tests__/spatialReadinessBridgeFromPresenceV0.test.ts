import { describe, expect, it } from "vitest";
import type { PresenceLayerState } from "../types/rskOntology";
import {
  buildSpatialReadinessBridgeFromPresenceV0,
  mergeGhostPetEmbodimentDriveWithSpatialPresenceBridgeV0,
  SPATIAL_READINESS_BRIDGE_FROM_PRESENCE_SCHEMA_V0
} from "../lib/spatialReadinessBridgeFromPresenceV0";
import { GHOST_PET_LOCOMOTION_HINT_V0 } from "../../rhizoh/spatial/ghostPetLocomotionIntentV0.js";

function mockPresenceTwoAvatars(): PresenceLayerState {
  return {
    avatars: {
      "avatar:op": {
        uid: "avatar:op",
        ownerId: "firebase-op",
        projection: {
          roomUid: "room:hall",
          zoneId: "stage",
          role: "host",
          transform: { x: 0, y: 0, z: 0, rotY: 0 },
          status: "broadcasting"
        }
      },
      "avatar:guest": {
        uid: "avatar:guest",
        ownerId: "firebase-guest",
        projection: {
          roomUid: "room:hall",
          zoneId: "audience",
          role: "member",
          transform: { x: 2.5, y: 0, z: 1.8, rotY: 0.2 },
          status: "watching"
        }
      }
    },
    rooms: {
      "room:hall": {
        uid: "room:hall",
        title: "Main",
        memberAvatarUids: ["avatar:op", "avatar:guest"],
        ownerAvatarUid: "avatar:op",
        createdAt: Date.now()
      }
    },
    broadcasts: {},
    broadcastProjections: {},
    directorByRoomUid: {},
    voiceStubByRoomUid: {},
    companionAgents: {},
    pets: {}
  };
}

describe("buildSpatialReadinessBridgeFromPresenceV0", () => {
  it("computes world yaw toward focus speaker when readiness allows", () => {
    const pres = mockPresenceTwoAvatars();
    const baseDrive = {
      schema: "castle.rhizoh.ghost_pet_social_embodiment_drive.v0",
      orbitPhaseRad: Math.PI * 0.22,
      radiusScale01: 1,
      verticalBobScale01: 1,
      locomotionHint: GHOST_PET_LOCOMOTION_HINT_V0.FOLLOW,
      attention: { mode: "ACTIVE_SPEAKER", secondaryUid: null }
    };
    const bridge = buildSpatialReadinessBridgeFromPresenceV0({
      presence: pres,
      roomUid: "room:hall",
      focusUserId: "firebase-guest",
      operatorUserId: "firebase-op",
      attentionMode: "ACTIVE_SPEAKER",
      locomotionHint: GHOST_PET_LOCOMOTION_HINT_V0.FOLLOW,
      baseEmbodimentDrive: baseDrive,
      symbolicEmbodimentActive: true
    });
    expect(bridge.schema).toBe(SPATIAL_READINESS_BRIDGE_FROM_PRESENCE_SCHEMA_V0);
    expect(bridge.spatialReadiness.readiness01).toBeGreaterThan(0.55);
    expect(bridge.embodimentAugmentation.worldAttentionYawOffsetRad).not.toBeNull();
    expect(bridge.debug.focusAvatarUid).toBe("avatar:guest");

    const merged = mergeGhostPetEmbodimentDriveWithSpatialPresenceBridgeV0(baseDrive, bridge);
    expect(merged.worldAttentionYawOffsetRad).toBeDefined();
    expect(merged.worldSpatialBlend01).toBeGreaterThan(0);
  });

  it("uses retreat direction away from focus", () => {
    const pres = mockPresenceTwoAvatars();
    const baseDrive = {
      schema: "castle.rhizoh.ghost_pet_social_embodiment_drive.v0",
      orbitPhaseRad: Math.PI * 0.22,
      radiusScale01: 1,
      verticalBobScale01: 1,
      locomotionHint: GHOST_PET_LOCOMOTION_HINT_V0.RETREAT
    };
    const bridge = buildSpatialReadinessBridgeFromPresenceV0({
      presence: pres,
      roomUid: "room:hall",
      focusUserId: "firebase-guest",
      operatorUserId: "firebase-op",
      locomotionHint: GHOST_PET_LOCOMOTION_HINT_V0.RETREAT,
      baseEmbodimentDrive: baseDrive,
      symbolicEmbodimentActive: true
    });
    expect(bridge.embodimentAugmentation.worldRadialScale01).toBeGreaterThan(1);
  });
});
