import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  tryInstantPresenceFastPathV0,
  isPresenceFastPathEligibleV0
} from "../rhizohInstantPresenceLayerV0.js";
import { __resetContinuityKernelForTestV0 } from "../rhizohContinuityKernelV0.js";
import { resetTurnSovereigntyStateForTestsV0 } from "../behavioralTurnSovereigntyV0.js";
import { resetVoiceInstantAckForTestV0 } from "../voiceInstantAckV0.js";

describe("rhizohInstantPresenceLayerV0", () => {
  beforeEach(() => {
    __resetContinuityKernelForTestV0();
    resetTurnSovereigntyStateForTestsV0();
    resetVoiceInstantAckForTestV0();
    vi.stubGlobal("speechSynthesis", {
      speak: vi.fn(),
      speaking: false,
      cancel: vi.fn()
    });
  });

  it("eligibility detects wake-only utterances", () => {
    expect(isPresenceFastPathEligibleV0("rhizoh")).toBe(true);
    expect(
      isPresenceFastPathEligibleV0("rhizoh bana istanbul haritasını aç ve detaylı anlat")
    ).toBe(false);
    expect(isPresenceFastPathEligibleV0("beni duyuyor musun")).toBe(true);
  });

  it("handles rhizoh wake with instant presence ack (no LLM)", async () => {
    const out = await tryInstantPresenceFastPathV0("rhizoh", {
      traceId: "PRES-1",
      speakReply: false,
      authority: { maySpeak: true, path: "test" }
    });
    expect(out.handled).toBe(true);
    expect(out.result?.presenceAck).toBe(true);
    expect(out.result?.llmBypass).toBe(true);
    expect(out.result?.reply).toMatch(/buradayım|duyuyorum/i);
    expect(out.result?.continuity?.state).toBe("speaking");
  });

  it("skips long substantive queries", async () => {
    const out = await tryInstantPresenceFastPathV0(
      "rhizoh bana istanbul haritasını aç ve detaylı anlat",
      { traceId: "PRES-2", speakReply: false, authority: { maySpeak: true } }
    );
    expect(out.handled).toBe(false);
  });
});
