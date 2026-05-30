import { describe, it, expect, beforeEach } from "vitest";
import {
  runRhizohClagForLlmTurnV0,
  runRhizohClagForLivingWorldFrameV0
} from "../rhizohClagTurnBridgeV0.js";
import { resetClagGraphV0 } from "../rhizohCrossLayerAwarenessGraphV0.js";
import { getLastInternalClagGraphForStabilityV0 } from "../rhizohRuntimeStabilityLayerV0.js";
import { awaitRhizohSoftIntelligenceV0 } from "../rhizohFastSpeechModeV0.js";

describe("rhizohClagTurnBridgeV0", () => {
  beforeEach(() => resetClagGraphV0());

  it("runs LLM turn pipeline with depth, influence, and runtime stability", async () => {
    const out = runRhizohClagForLlmTurnV0({
      traceId: "TRC-BRIDGE-1",
      message: "Merhaba Rhizoh, dün ne konuşmuştuk?",
      conversationPhase: "TRUST_BUILD",
      userTurnCount: 3,
      layerSpec: { id: 10, code: "L10" }
    });
    expect(out.conversationDepth.conversationMode).toBeTruthy();
    expect(out.expression.scheduling).toBe("speech_first");
    expect(out.stability.conversationBehavior.rhythm.breath).toBeTruthy();
    expect(out.route.fastPath).toBe(true);
    await awaitRhizohSoftIntelligenceV0();
    const soft = await out.awaitSoftIntelligence();
    expect(soft?.turnInfluencePre?.dominantShaper).toBeTruthy();
    expect(soft?.turnInfluencePre?.dominantShaper).toBeTruthy();
  });

  it("ingests living world entry model into internal clag, publishes stability", () => {
    const stability = runRhizohClagForLivingWorldFrameV0({
      traceId: "TRC-LW-1",
      entryModel: {
        returning: true,
        continuityStrip: { todayChanged: "Hava değişti" },
        crossSessionCoherence: { line: "Önceki oturum hatırlandı" },
        worldState: {
          worldInstance: { instanceId: "wi-test" },
          spiralAgreement: { agreementLayer: true, meshPhase: "weave" },
          collectiveFeeling: { mode: "warm", label: "sıcak nabız" }
        },
        identityBinding: { sessionIdentity: "sess-lw-1" }
      }
    });
    expect(stability.conversationBehavior).toBeTruthy();
    expect(stability.architectureFrozen).toBe(true);
    const internal = getLastInternalClagGraphForStabilityV0();
    expect(internal.layerVisibility.spiral?.active).toBe(true);
    expect(internal.layerVisibility.real_life?.active).toBe(true);
  });
});
