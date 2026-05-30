import { describe, it, expect, beforeEach } from "vitest";
import {
  runRhizohHotSpeechPathV0,
  scheduleRhizohSoftIntelligencePathV0,
  awaitRhizohSoftIntelligenceV0,
  getLastSoftIntelligenceSnapshotV0
} from "../rhizohFastSpeechModeV0.js";
import { resetRhizohGlobalMeaningEngineV0 } from "../rhizohGlobalMeaningEngineV0.js";
import { resetContinuityCacheV0 } from "../rhizohContinuityCacheV0.js";
import { resetClagGraphV0 } from "../rhizohCrossLayerAwarenessGraphV0.js";
import { FAST_ROUTE_V0 } from "../rhizohFastConversationRouterV0.js";

describe("rhizohFastSpeechModeV0", () => {
  beforeEach(() => {
    resetContinuityCacheV0();
    resetRhizohGlobalMeaningEngineV0();
    resetClagGraphV0();
  });

  it("hot path publishes speech skeleton before CLAG", async () => {
    const hot = runRhizohHotSpeechPathV0({
      traceId: "TRC-FSH-1",
      message: "Merhaba Rhizoh"
    });
    expect(hot.expression.scheduling).toBe("speech_first");
    expect(hot.speechSkeleton.preCommit).toBe(true);
    expect(hot.expression.route.clagEnrichment).toBe("async_scheduled");
    expect(hot.hotPathMs).toBeLessThan(200);
    expect(window.__CASTLE_RHIZOH_HOT_SPEECH__).toBeTruthy();
  });

  it("soft path runs CLAG async for full_pipeline", async () => {
    const hot = runRhizohHotSpeechPathV0({
      traceId: "TRC-FSH-2",
      message: "Ama bu mimari yanlış değil mi? " + "detay ".repeat(40),
      userTurnCount: 25
    });
    scheduleRhizohSoftIntelligencePathV0(
      {
        traceId: "TRC-FSH-2",
        message: "Ama bu mimari yanlış değil mi? " + "detay ".repeat(40),
        userTurnCount: 25,
        conversationPhase: "POWER_MODE"
      },
      hot
    );
    await awaitRhizohSoftIntelligenceV0();
    const soft = getLastSoftIntelligenceSnapshotV0();
    expect(soft?.clagGraph?.nodeCount).toBeGreaterThan(3);
    expect(soft?.expression.route.softIntelligence).toBe("ready");
  });
});
