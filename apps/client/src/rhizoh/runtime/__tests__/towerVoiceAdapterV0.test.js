import { describe, expect, it, vi } from "vitest";
import {
  isTowerElevenLabsVoiceEnabledV0,
  resolveTowerVoicePresetV0,
  TOWER_VOICE_PRESETS_V0
} from "../towerVoiceAdapterV0.js";

vi.mock("../../ingress/ingress_router.js", () => ({
  hasLegalAccessAckV0: () => false
}));

describe("towerVoiceAdapterV0", () => {
  it("exposes per-tower voice presets", () => {
    expect(TOWER_VOICE_PRESETS_V0.gemini_tower.voiceId).toBeTruthy();
    expect(resolveTowerVoicePresetV0("claude_tower").label).toBe("Claude");
  });

  it("blocks ElevenLabs until legal ack + env flag", () => {
    expect(isTowerElevenLabsVoiceEnabledV0()).toBe(false);
  });
});
