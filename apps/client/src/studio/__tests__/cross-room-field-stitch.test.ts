import { describe, expect, it } from "vitest";
import type { PresenceLayerState, RenderBiasField } from "../types/rskOntology";
import {
  computeBroadcastEchoByRoom,
  computeCrossRoomLeaks,
  stitchCrossRoomBiasMap
} from "../lib/crossRoomFieldStitch.js";

function zoneInt(b: RenderBiasField, z: string): number {
  return b.emissiveMap.find((e) => e.key === `zone:${z}`)?.intensity ?? 0;
}

describe("crossRoomFieldStitch (partitioned bleed + temporal echo)", () => {
  it("edge A→B increases room B audience emissive vs B alone (capped)", () => {
    const biasA: RenderBiasField = {
      roomUid: "room:A",
      emissiveMap: [
        { key: "zone:audience", intensity: 0.92 },
        { key: "zone:stage", intensity: 0.88 }
      ],
      cameraFocusWeight: 0.55,
      stageIntensity: 0.82,
      avatarGlow: {},
      petGlow: {},
      rhizohPulse: {}
    };
    const biasB: RenderBiasField = {
      roomUid: "room:B",
      emissiveMap: [{ key: "zone:audience", intensity: 0.06 }],
      cameraFocusWeight: 0.08,
      stageIntensity: 0.05,
      avatarGlow: {},
      petGlow: {},
      rhizohPulse: {}
    };
    const pres: PresenceLayerState = {
      avatars: {},
      rooms: {},
      roomFieldEdges: [{ fromRoomUid: "room:A", toRoomUid: "room:B", coupling: 1 }],
      broadcasts: {}
    };
    const wall = 1_700_000_000_000;
    const stitched = stitchCrossRoomBiasMap(pres, { "room:A": biasA, "room:B": biasB }, wall, { maxBleed: 0.18 });
    expect(zoneInt(stitched["room:B"]!, "audience")).toBeGreaterThan(zoneInt(biasB, "audience") + 0.02);
    expect(zoneInt(stitched["room:B"]!, "audience")).toBeLessThan(0.95);
  });

  it("computeCrossRoomLeaks is zero without edges", () => {
    const local = {
      "room:X": {
        roomUid: "room:X",
        emissiveMap: [{ key: "zone:audience", intensity: 0.9 }],
        cameraFocusWeight: 0.2,
        stageIntensity: 0.7,
        avatarGlow: {},
        petGlow: {},
        rhizohPulse: {}
      } satisfies RenderBiasField
    };
    const leaks = computeCrossRoomLeaks(undefined, local, 0.2);
    expect(leaks["room:X"].audienceBleed).toBe(0);
  });

  it("ended broadcast leaves bounded echo in its room", () => {
    const now = 1_800_000_000_000;
    const pres: PresenceLayerState = {
      avatars: {},
      rooms: {},
      broadcasts: {},
      broadcastProjections: {
        "proj:1": {
          uid: "proj:1",
          roomUid: "room:echo",
          state: "ended",
          stageAvatarUids: [],
          audienceCount: 0,
          cameraMode: "auto",
          overlayStack: [],
          lastEventAt: now - 12_000,
          audienceEnergy: 0.9
        }
      }
    };
    const echo = computeBroadcastEchoByRoom(pres, now, 48_000);
    expect(echo["room:echo"]?.audienceEcho ?? 0).toBeGreaterThan(0.08);
    const bias: RenderBiasField = {
      roomUid: "room:echo",
      emissiveMap: [{ key: "zone:audience", intensity: 0.1 }],
      cameraFocusWeight: 0.1,
      stageIntensity: 0.1,
      avatarGlow: {},
      petGlow: {},
      rhizohPulse: {}
    };
    const stitched = stitchCrossRoomBiasMap(pres, { "room:echo": bias }, now);
    expect(zoneInt(stitched["room:echo"]!, "audience")).toBeGreaterThan(zoneInt(bias, "audience"));
  });
});
