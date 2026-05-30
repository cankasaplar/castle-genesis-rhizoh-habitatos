import { describe, it, expect, beforeEach } from "vitest";
import { extractMeaningFrameV0, MF0_INTENT_V0 } from "../rhizohMeaningFrameV0.js";
import { routeFastConversationV0, FAST_ROUTE_V0 } from "../rhizohFastConversationRouterV0.js";
import { projectMeaningFrameV0 } from "../rhizohGlobalMeaningProjectorV0.js";
import {
  pushContinuityFrameV0,
  resetContinuityCacheV0,
  getContinuityCacheSnapshotV0
} from "../rhizohContinuityCacheV0.js";
import {
  runRhizohGlobalMeaningTurnV0,
  resetRhizohGlobalMeaningEngineV0
} from "../rhizohGlobalMeaningEngineV0.js";
import { awaitRhizohSoftIntelligenceV0 } from "../rhizohFastSpeechModeV0.js";
import { resetClagGraphV0 } from "../rhizohCrossLayerAwarenessGraphV0.js";
import { resetRuntimeStabilityLayerV0 } from "../rhizohRuntimeStabilityLayerV0.js";

describe("rhizohGlobalMeaningEngineV0", () => {
  beforeEach(() => {
    resetContinuityCacheV0();
    resetRhizohGlobalMeaningEngineV0();
    resetRuntimeStabilityLayerV0();
    resetClagGraphV0();
  });

  it("extracts language-independent MF-0", () => {
    const tr = extractMeaningFrameV0({ text: "Rhizoh, dün ne konuşmuştuk?" });
    const en = extractMeaningFrameV0({ text: "Rhizoh, what did we discuss yesterday?" });
    expect(tr.intent).toBe(MF0_INTENT_V0.ASK);
    expect(en.intent).toBe(MF0_INTENT_V0.ASK);
    expect(tr.language).toBe("tr");
    expect(en.language).toBe("en");
    expect(tr.emotionVector.curiosity).toBeGreaterThan(0.3);
  });

  it("fast router sends greet to fast_greet without CLAG", () => {
    const mf = extractMeaningFrameV0({ text: "Merhaba Rhizoh" });
    const route = routeFastConversationV0({ text: "Merhaba Rhizoh", meaningFrame: mf });
    expect(route.route).toBe(FAST_ROUTE_V0.FAST_GREET);
    expect(route.useClag).toBe(false);
    expect(route.fastPath).toBe(true);
  });

  it("projects meaning rhythm per language (not translation)", () => {
    const mfTr = extractMeaningFrameV0({ text: "Anlat bakalım", cohortLanguage: "tr" });
    const mfJp = extractMeaningFrameV0({ text: "続けて", cohortLanguage: "jp" });
    const pTr = projectMeaningFrameV0(mfTr);
    const pJp = projectMeaningFrameV0(mfJp);
    expect(pTr.isTranslation).toBe(false);
    expect(pJp.profile.compression01).toBeGreaterThan(pTr.profile.compression01);
    expect(pJp.profile.explicitness01).toBeLessThan(pTr.profile.explicitness01);
  });

  it("continuity cache stores last frames without CLAG", () => {
    pushContinuityFrameV0(extractMeaningFrameV0({ text: "ilk" }));
    pushContinuityFrameV0(extractMeaningFrameV0({ text: "devam" }));
    const snap = getContinuityCacheSnapshotV0();
    expect(snap.frameCount).toBe(2);
  });

  it("runRhizohGlobalMeaningTurnV0 publishes expression surface", async () => {
    const out = runRhizohGlobalMeaningTurnV0({
      traceId: "TRC-GME-1",
      message: "Merhaba",
      conversationPhase: "INTRO",
      userTurnCount: 0
    });
    expect(out.expression.route.fastPath).toBe(true);
    expect(out.expression.scheduling).toBe("speech_first");
    expect(out.expression.speechShape.targetFirstAudioMs).toBeLessThanOrEqual(400);
    expect(window.__CASTLE_RHIZOH_EXPRESSION__).toBeTruthy();
    expect(out.softIntelligencePending).toBe(true);
    expect(out.companion.ownsConversation).toBe(false);
    await awaitRhizohSoftIntelligenceV0();
    const soft = await out.awaitSoftIntelligence();
    expect(soft?.stability?.conversationBehavior?.speechResonance).toBeTruthy();
  });

  it("heavy debate routes to full_pipeline with CLAG", async () => {
    const out = runRhizohGlobalMeaningTurnV0({
      traceId: "TRC-GME-2",
      message:
        "Ama bu mimari yanlış değil mi? Çünkü CLAG contamination riski var ve bunu challenge etmek istiyorum. " +
        "Lorem ipsum ".repeat(12),
      conversationPhase: "POWER_MODE",
      userTurnCount: 30,
      conversationMode: "debate"
    });
    expect(out.route.route).toBe(FAST_ROUTE_V0.FULL_PIPELINE);
    await awaitRhizohSoftIntelligenceV0();
    const soft = await out.awaitSoftIntelligence();
    expect(soft?.clagGraph?.nodeCount).toBeGreaterThan(3);
  });
});
