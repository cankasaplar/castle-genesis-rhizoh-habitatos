import { describe, expect, it, beforeEach } from "vitest";
import {
  buildVoiceShadowTimelineSegmentsV0,
  buildVoiceShadowTimelineViewV0,
  recordVoiceTimelineEventV0,
  resetVoiceShadowTimelineForTestV0,
  VOICE_TIMELINE_PHASE_LABEL_V0
} from "../voiceShadowTimelineV0.js";

describe("voiceShadowTimelineV0", () => {
  beforeEach(() => {
    resetVoiceShadowTimelineForTestV0();
  });

  it("segments interaction rejection spike in first 5s window", () => {
    const t0 = 1_000_000;
    recordVoiceTimelineEventV0({
      atMs: t0,
      rejectionLayer: "interaction",
      reason: "low_confidence",
      observationForward: true,
      kind: "shadow_forward"
    });
    recordVoiceTimelineEventV0({
      atMs: t0 + 2000,
      rejectionLayer: "interaction",
      reason: "low_confidence",
      observationForward: true,
      kind: "shadow_forward"
    });

    const { segments } = buildVoiceShadowTimelineSegmentsV0(undefined, { bucketMs: 5000 });
    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0].phaseLabel).toBe(VOICE_TIMELINE_PHASE_LABEL_V0.INTERACTION_REJECTION_SPIKE);
    expect(segments[0].label).toBe("0s–5s");
  });

  it("shows execution emergence after observation window", () => {
    const t0 = 2_000_000;
    recordVoiceTimelineEventV0({
      atMs: t0 + 1000,
      rejectionLayer: "interaction",
      kind: "shadow_forward",
      observationForward: true
    });
    recordVoiceTimelineEventV0({
      atMs: t0 + 6000,
      rejectionLayer: "execution",
      kind: "execution_dispatch",
      executionAccepted: true,
      confidence: 0.72
    });

    const view = buildVoiceShadowTimelineViewV0({ bucketMs: 5000 });
    const labels = view.segments.map((s) => s.phaseLabel);
    expect(labels).toContain(VOICE_TIMELINE_PHASE_LABEL_V0.EXECUTION_EMERGENCE);
    expect(view.trajectory.summary).toBe("observation_to_execution");
  });

  it("labels mixed sanity+interaction as confidence stabilization", () => {
    const t0 = 3_000_000;
    recordVoiceTimelineEventV0({
      atMs: t0 + 500,
      rejectionLayer: "sanity",
      kind: "shadow_forward"
    });
    recordVoiceTimelineEventV0({
      atMs: t0 + 1500,
      rejectionLayer: "interaction",
      kind: "shadow_forward"
    });

    const { segments } = buildVoiceShadowTimelineSegmentsV0(undefined, { bucketMs: 5000 });
    expect(segments[0].phaseLabel).toBe(VOICE_TIMELINE_PHASE_LABEL_V0.CONFIDENCE_STABILIZATION);
  });
});
