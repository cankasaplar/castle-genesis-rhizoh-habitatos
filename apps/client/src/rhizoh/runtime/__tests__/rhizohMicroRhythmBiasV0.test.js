import { describe, it, expect, beforeEach } from "vitest";
import { extractMeaningFrameV0 } from "../rhizohMeaningFrameV0.js";
import { routeFastConversationV0 } from "../rhizohFastConversationRouterV0.js";
import { resolveCompanionLayerV0 } from "../rhizohCompanionLayerV0.js";
import { projectMeaningFrameV0 } from "../rhizohGlobalMeaningProjectorV0.js";
import { applyCompanionToProjectionV0 } from "../rhizohCompanionLayerV0.js";
import { buildVoiceStreamShapeV0 } from "../rhizohVoiceStreamEngineV0.js";
import { applyMicroRhythmBiasV0, collapseMicroRhythmFeelV0 } from "../rhizohMicroRhythmBiasV0.js";
import { resetContinuityCacheV0 } from "../rhizohContinuityCacheV0.js";

describe("rhizohMicroRhythmBiasV0", () => {
  beforeEach(() => resetContinuityCacheV0());

  it("applies hesitation and earlier start on fast ask path", () => {
    const text = "Rhizoh, bu nedir?";
    const mf = extractMeaningFrameV0({ text, traceId: "TRC-MR-1" });
    const route = routeFastConversationV0({ text, meaningFrame: mf });
    const companion = resolveCompanionLayerV0({ meaningFrame: mf, route });
    const projection = applyCompanionToProjectionV0(projectMeaningFrameV0(mf), companion);
    const base = buildVoiceStreamShapeV0({
      text,
      meaningFrame: mf,
      projection,
      route,
      companion: null
    });
    const biased = applyMicroRhythmBiasV0({
      speechShape: base,
      meaningFrame: mf,
      companion,
      route
    });
    expect(biased.microRhythm.hesitationMs).toBeGreaterThan(40);
    expect(biased.stream.targetFirstAudioMs).toBeLessThanOrEqual(base.stream.targetFirstAudioMs);
    expect(biased.microRhythm.interruptible).toBe(true);
  });

  it("exposes concrete microRhythmFeel on collapsed speech shape", () => {
    const text = "Merhaba";
    const mf = extractMeaningFrameV0({ text });
    const route = routeFastConversationV0({ text, meaningFrame: mf });
    const companion = resolveCompanionLayerV0({ meaningFrame: mf, route });
    const projection = applyCompanionToProjectionV0(projectMeaningFrameV0(mf), companion);
    const shape = buildVoiceStreamShapeV0({
      text,
      meaningFrame: mf,
      projection,
      route,
      companion
    });
    const feel = collapseMicroRhythmFeelV0(shape);
    expect(feel?.whenYouHearMs).toBeGreaterThan(200);
    expect(feel?.hesitationMs).toBeGreaterThan(0);
  });
});
