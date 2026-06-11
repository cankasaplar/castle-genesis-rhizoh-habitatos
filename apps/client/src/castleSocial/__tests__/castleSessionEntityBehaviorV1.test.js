import { describe, expect, it } from "vitest";
import {
  buildCompanionBehaviorModelV1,
  buildDefaultCastleSessionEntityLayerV1,
  buildFoxBehaviorModelV1
} from "../castleSessionEntityBehaviorV1.js";

describe("castleSessionEntityBehaviorV1", () => {
  it("keeps Fox silent while reacting to memory triggers", () => {
    const fox = buildFoxBehaviorModelV1({
      conversationIntensity01: 0.82,
      memoryTrigger: true,
      spatialEventDensity01: 0.4
    });

    expect(fox.state).toBe("reacting");
    expect(fox.silent).toBe(true);
    expect(fox.mediaParticipant).toBe(false);
    expect(fox.canSpeakAsPrimary).toBe(false);
    expect(fox.output.gazeDirection).toBe("memory_event");
  });

  it("moves companion toward user focus when intensity rises", () => {
    const companion = buildCompanionBehaviorModelV1({
      conversationIntensity01: 0.9
    });

    expect(companion.state).toBe("following");
    expect(companion.output.gazeDirection).toBe("user_focus");
    expect(companion.output.proximityShift).toBe("near_user");
  });

  it("creates local entity instances per castle, not a global Fox", () => {
    const layer = buildDefaultCastleSessionEntityLayerV1({
      hostCastleId: "istanbul_castle",
      peerCastleId: "barcelona_castle",
      signals: { spatialEventDensity01: 0.6 }
    });

    const companion = layer.localEntities.find((entity) => entity.entityKind === "companion");
    const fox = layer.localEntities.find((entity) => entity.entityKind === "fox");
    const ghost = layer.localEntities.find((entity) => entity.entityKind === "ghost");

    expect(companion.instanceId).toBe("istanbul_castle:companion");
    expect(fox.instanceId).toBe("barcelona_castle:fox");
    expect(fox.globalSingleton).toBe(false);
    expect(fox.mediaParticipant).toBe(false);
    expect(ghost.binding).toBe("memory_bound");
  });
});
