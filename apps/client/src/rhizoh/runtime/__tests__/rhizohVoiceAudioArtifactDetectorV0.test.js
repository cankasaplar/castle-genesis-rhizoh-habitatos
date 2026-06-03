import { describe, expect, it } from "vitest";
import {
  classifyVoiceSttArtifactV0,
  VOICE_STT_ARTIFACT_CLASS_V0
} from "../rhizohVoiceAudioArtifactDetectorV0.js";

describe("rhizohVoiceAudioArtifactDetectorV0", () => {
  it("blocks TR YouTube subscribe outro", () => {
    const v = classifyVoiceSttArtifactV0("Abone olmayı ve videoyu beğenmeyi unutmayın.", {
      confidence: 0.52
    });
    expect(v.block).toBe(true);
    expect(v.artifactClass).toBe(VOICE_STT_ARTIFACT_CLASS_V0.UI_CHROME);
  });

  it("blocks Turkish TV subtitle credit hallucination", () => {
    const v = classifyVoiceSttArtifactV0("Altyazı M.K.", { confidence: 0.55 });
    expect(v.block).toBe(true);
    expect(v.artifactClass).toBe(VOICE_STT_ARTIFACT_CLASS_V0.UI_CHROME);
  });

  it("blocks English outro template", () => {
    const v = classifyVoiceSttArtifactV0("Thank you for watching! Don't forget to subscribe!", {
      confidence: 0.7
    });
    expect(v.block).toBe(true);
    expect(v.artifactClass).toBe(VOICE_STT_ARTIFACT_CLASS_V0.PLATFORM_OUTRO);
  });

  it("allows conversational Turkish", () => {
    const v = classifyVoiceSttArtifactV0("merhaba rhizoh beni duyuyor musun", { confidence: 0.72 });
    expect(v.block).toBe(false);
    expect(v.artifactClass).toBe(VOICE_STT_ARTIFACT_CLASS_V0.CLEAN);
  });
});
