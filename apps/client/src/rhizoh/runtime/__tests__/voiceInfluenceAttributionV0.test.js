import { describe, expect, it, beforeEach } from "vitest";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";
import {
  INFLUENCE_ATTRIBUTION_KIND_V0,
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
      source: "mic_v3",
      stage: "raw"
    });
    expect(a.kind).toBe(INFLUENCE_ATTRIBUTION_KIND_V0.AMBIENT_ARTIFACT);
    expect(a.influencesMemory).toBe(false);
    expect(a.influencesBehavior).toBe(false);
  });

  it("maps committed directed speech to user_speech_directed without memory coupling", () => {
    const a = deriveVoiceInfluenceAttributionV0({
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      source: "mic_v3",
      commitment: { turnCounts: true, memoryEligible: true, behaviorEligible: true }
    });
    expect(a.kind).toBe(INFLUENCE_ATTRIBUTION_KIND_V0.USER_SPEECH_DIRECTED);
    expect(a.influencesMemory).toBe(false);
  });

  it("maps gate reject to user_speech_rejected", () => {
    const a = deriveVoiceInfluenceAttributionV0({
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      source: "mic_v3",
      turnAcceptance: { accepted: false, reason: "confidence_below_threshold" },
      sanityAccepted: true
    });
    expect(a.kind).toBe(INFLUENCE_ATTRIBUTION_KIND_V0.USER_SPEECH_REJECTED);
  });

  it("maps egress to model_response observation-only", () => {
    const a = deriveVoiceInfluenceAttributionV0({ direction: "egress" });
    expect(a.kind).toBe(INFLUENCE_ATTRIBUTION_KIND_V0.MODEL_RESPONSE);
    expect(a.trustWeight).toBe(0);
    expect(a.influencesBehavior).toBe(false);
  });

  it("increments snapshot counts on record", () => {
    recordVoiceInfluenceAttributionV0(
      deriveVoiceInfluenceAttributionV0({
        band: VOICE_DIRECTED_SPEECH_BAND.AMBIENT,
        source: "mic"
      })
    );
    const snap = getVoiceInfluenceAttributionSnapshotV0();
    expect(snap.counts.ambient_artifact).toBe(1);
    expect(snap.recent.length).toBe(1);
  });
});
