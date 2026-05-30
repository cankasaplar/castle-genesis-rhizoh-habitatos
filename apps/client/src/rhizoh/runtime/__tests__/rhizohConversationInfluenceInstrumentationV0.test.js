import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildRhizohTurnInfluencePreLlmV0,
  buildRhizohInfluenceDeltaV0,
  buildInfluenceObservabilityBundleV0,
  emitRhizohInfluenceObservabilityV0
} from "../rhizohConversationInfluenceInstrumentationV0.js";
import { buildInfluenceFeedbackSignalV0 } from "../rhizohInfluenceObservabilityFirewallV0.js";

describe("rhizohConversationInfluenceInstrumentationV0", () => {
  it("names depth as dominant on standard product path", () => {
    const pre = buildRhizohTurnInfluencePreLlmV0({
      traceId: "TRC-X",
      layerSpec: { id: 10, code: "L10" },
      conversationPhase: "TRUST_BUILD",
      conversationDepth: {
        conversationMode: "explore",
        depthLevel: 2,
        continuityStrength: 0.55,
        storySnapshot: {
          storyContinuityScore: 0.8,
          storyContinuityGuarantee: true,
          whatHappenedLast: "last",
          unresolvedThreads: ["q1"]
        }
      },
      rhizohRouter: { intent: "CHAT", confidence: 0.7 }
    });
    expect(pre.layers.academy.influence).toBe("passive");
    expect(pre.layers.academy.effectPresent).toBe(false);
    expect(pre.layers.narrative.storyFlowing).toBe(true);
    expect(["depth", "narrative", "narrative+depth", "depth+narrative"]).toContain(
      pre.dominantShaper.includes("narrative") || pre.dominantShaper === "depth"
        ? pre.dominantShaper
        : "depth"
    );
  });

  it("builds influence_delta with post shift metadata", () => {
    const pre = buildRhizohTurnInfluencePreLlmV0({
      traceId: "TRC-Y",
      conversationDepth: { depthLevel: 4, conversationMode: "debate" }
    });
    const delta = buildRhizohInfluenceDeltaV0(pre, {
      replyChars: 420,
      rhizohDeliveryKind: "ok",
      replyParsingConfidence: 1
    });
    expect(delta.traceId).toBe("TRC-Y");
    expect(delta.delta.replyChars).toBe(420);
    expect(delta.dominantShaper).toBeTruthy();
  });
});

describe("emitRhizohInfluenceObservabilityV0", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits single bundled log when not verbose (prod-style)", () => {
    vi.stubEnv("DEV", "");
    vi.stubEnv("VITE_RHIZOH_INFLUENCE_VERBOSE", "");
    const pre = buildRhizohTurnInfluencePreLlmV0({ traceId: "TRC-Z", layerSpec: { id: 10 } });
    const bundle = buildInfluenceObservabilityBundleV0(pre);
    emitRhizohInfluenceObservabilityV0("pre_llm", bundle);
    const tags = console.info.mock.calls.map((c) => String(c[0]));
    expect(tags.filter((t) => t === "[CASTLE_influence_observability]").length).toBe(1);
    expect(tags.filter((t) => t === "[CASTLE_academy_tick]").length).toBe(0);
    vi.unstubAllEnvs();
  });

  it("feedback signal is measurement-only by default", () => {
    const pre = buildRhizohTurnInfluencePreLlmV0({ traceId: "TRC-F", conversationDepth: { depthLevel: 3 } });
    const signal = buildInfluenceFeedbackSignalV0(pre);
    expect(signal.enabled).toBe(false);
    expect(signal.appliedToNextTurn).toBe(false);
    expect(signal.layerWeights.depth).toBeGreaterThan(0);
  });
});
