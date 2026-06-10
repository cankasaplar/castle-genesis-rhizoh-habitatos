import { describe, expect, it } from "vitest";
import {
  evaluateVoiceSmokeScenarioV0,
  runVoiceCommandSmokeSuiteV0
} from "../rhizohVoiceCommandSmokeHarnessV0.js";

describe("rhizohVoiceCommandSmokeHarnessV0", () => {
  it("matches stop listening local command", () => {
    const row = evaluateVoiceSmokeScenarioV0({
      id: "stop",
      utterance: "dinlemeyi durdur",
      expectCommand: "stop_listening"
    });
    expect(row.ok).toBe(true);
  });

  it("matches briefing and thanks intents", () => {
    expect(
      evaluateVoiceSmokeScenarioV0({
        id: "briefing",
        utterance: "kısa brifing",
        expectIntent: "briefing_query"
      }).ok
    ).toBe(true);
    expect(
      evaluateVoiceSmokeScenarioV0({
        id: "thanks",
        utterance: "teşekkür ederim",
        expectIntent: "thanks"
      }).ok
    ).toBe(true);
  });

  it("full smoke suite passes core scenarios", () => {
    const report = runVoiceCommandSmokeSuiteV0();
    expect(report.total).toBeGreaterThan(8);
    expect(report.passed).toBeGreaterThanOrEqual(report.total - 1);
  });
});
