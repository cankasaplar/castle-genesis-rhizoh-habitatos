import { describe, expect, it, beforeEach } from "vitest";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";
import {
  INFLUENCE_ATTRIBUTION_KIND_V0,
  INFLUENCE_STRENGTH_V0,
  deriveVoiceInfluenceAttributionV0,
  recordVoiceInfluenceAttributionV0,
  resetVoiceInfluenceAttributionForTestV0,
  getVoiceInfluenceAttributionSnapshotV0
} from "../voiceInfluenceAttributionV0.js";

describe("voiceInfluenceAttributionV0", () => {
  beforeEach(() => resetVoiceInfluenceAttributionForTestV0());

  it("maps ambient band to ambient_artifact", () => {
    const a = deriveVoiceInfluenceAttributionV0({
      band: VOICE_DIRECTED_SPEECH_BAND.AMBIENT,
      source: "mic_v3"
    });
    expect(a.kind).toBe(INFLUENCE_ATTRIBUTION_KIND_V0.AMBIENT_ARTIFACT);
    expect(a.influenceStrength).toBe(INFLUENCE_STRENGTH_V0.OBSERVATION_ONLY);
    expect(a.influencesMemory).toBe(false);
  });

  it("egress model_response is observation-only (no memory/behavior flags)", () => {
    const a = deriveVoiceInfluenceAttributionV0({ direction: "egress" });
    expect(a.kind).toBe(INFLUENCE_ATTRIBUTION_KIND_V0.MODEL_RESPONSE);
    expect(a.trustWeight).toBe(0);
    expect(a.influencesMemory).toBe(false);
    expect(a.influencesBehavior).toBe(false);
  });

  it("committed directed without memory coupling in core port", () => {
    const a = deriveVoiceInfluenceAttributionV0({
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      commitment: { turnCounts: true, memoryEligible: true, behaviorEligible: true }
    });
    expect(a.kind).toBe(INFLUENCE_ATTRIBUTION_KIND_V0.USER_SPEECH_DIRECTED);
    expect(a.influencesMemory).toBe(false);
  });

  it("increments snapshot counts on record", () => {
    recordVoiceInfluenceAttributionV0(
      deriveVoiceInfluenceAttributionV0({
        band: VOICE_DIRECTED_SPEECH_BAND.AMBIENT,
        source: "mic"
      })
    );
    expect(getVoiceInfluenceAttributionSnapshotV0().counts.ambient_artifact).toBe(1);
  });
});
