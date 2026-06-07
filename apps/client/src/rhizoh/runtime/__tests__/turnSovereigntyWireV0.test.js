import { describe, expect, it, beforeEach, vi } from "vitest";
import { RHIZOH_INTENT } from "../../router/intentTypes.js";
import { resetTurnSovereigntyStateForTestsV0 } from "../behavioralTurnSovereigntyV0.js";
import { resetPromptBoundaryFirewallForTestsV0 } from "../turnSovereigntyPromptFirewallV0.js";
import {
  ensureTurnSovereigntyLockedV0,
  gateInstantAckForTurnV0,
  gateLlmInputForTurnV0
} from "../turnSovereigntyWireV0.js";
import { TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0 } from "../turnSovereigntyEnforcementModeV0.js";

describe("turnSovereigntyWireV0", () => {
  beforeEach(() => {
    resetTurnSovereigntyStateForTestsV0();
    resetPromptBoundaryFirewallForTestsV0();
    vi.stubEnv("VITE_RHIZOH_TURN_SOVEREIGNTY_MODE", "soft");
  });

  it("locks turn and returns presence wire hints", () => {
    const out = ensureTurnSovereigntyLockedV0({
      turnId: "WIRE-1",
      text: "beni duyuyor musun",
      modality: "voice",
      router: { intent: RHIZOH_INTENT.CHAT, confidence: 0.7, silenceMode: false },
      voice: { band: "directed_candidate", authority: { maySpeak: true } }
    });
    expect(out.lock?.sovereignReality).toBe("presence_ack");
    expect(out.wire?.bypassLlm).toBe(true);
    expect(out.wire?.speakPresenceAck).toBe(true);
  });

  it("soft mode logs but allows llm boundary write on presence turn", () => {
    ensureTurnSovereigntyLockedV0({
      turnId: "WIRE-2",
      text: "beni duyuyor musun",
      modality: "voice",
      router: { intent: RHIZOH_INTENT.CHAT, confidence: 0.7, silenceMode: false },
      voice: { band: "directed_candidate", authority: { maySpeak: true } }
    });
    const gate = gateLlmInputForTurnV0("WIRE-2");
    expect(gate.allowed).toBe(true);
    expect(gate.block).toBe(false);
    expect(gate.violation?.code).toBe("LLM_BYPASS_LEAK");
  });

  it("partial mode blocks llm and instant_ack on presence_ack", () => {
    vi.stubEnv("VITE_RHIZOH_TURN_SOVEREIGNTY_MODE", TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.PARTIAL);
    ensureTurnSovereigntyLockedV0({
      turnId: "WIRE-3",
      text: "rhizoh",
      modality: "voice",
      router: { intent: RHIZOH_INTENT.CHAT, confidence: 0.6, silenceMode: false },
      voice: { band: "directed_candidate", authority: { maySpeak: true } }
    });
    const llm = gateLlmInputForTurnV0("WIRE-3");
    const ack = gateInstantAckForTurnV0("WIRE-3");
    expect(llm.block).toBe(true);
    expect(ack.block).toBe(true);
  });
});
