import { describe, expect, it } from "vitest";
import { audienceDensityGhostReaction } from "../broadcast/broadcastProtocolV555.js";
import { buildRhizohAccessLayer } from "../membership/membershipCoreV1.js";
import {
  applyPresenceInfluenceHardeningToPacket,
  createPresenceInjectionGovernor,
  ingestYoutubeEngagementForProductLoop,
  narrowCivicStrataForAccess,
  normalizeYoutubeEngagementSample,
  refineGhostReactionForAccess,
  youtubeEngagementToFeedbackScalars
} from "./presenceInfluenceLoopHardeningV556.js";

const freeAccess = buildRhizohAccessLayer({ membershipPlan: "free", subscriptionStatus: "none" });
const premAccess = buildRhizohAccessLayer({ membershipPlan: "premium", subscriptionStatus: "active" });

describe("presenceInfluenceLoopHardeningV556", () => {
  it("refineGhostReactionForAccess lowers free-tier wake vs premium", () => {
    const base = audienceDensityGhostReaction(0.8, 0.6);
    const f = refineGhostReactionForAccess(base, freeAccess);
    const p = refineGhostReactionForAccess(base, premAccess);
    expect(p.collectiveWakeFeedback01).toBeGreaterThan(f.collectiveWakeFeedback01);
  });

  it("narrowCivicStrataForAccess respects civicMemoryStrataDepth", () => {
    const strata = [
      { tier: "pulse", text: "a", salience01: 0.9, visible: true },
      { tier: "consensus", text: "b", salience01: 0.7, visible: true },
      { tier: "oracle", text: "c", salience01: 0.5, visible: true }
    ];
    const rec = ["pulse", "consensus", "oracle"];
    const out = narrowCivicStrataForAccess(strata, rec, freeAccess);
    expect(out.length).toBeLessThanOrEqual(freeAccess.civicMemoryStrataDepth);
    expect(out.length).toBe(2);
  });

  it("applyPresenceInfluenceHardeningToPacket combines reaction + strata", () => {
    const packet = {
      protocolVersion: "v555.1",
      seq: 1,
      emittedAtMs: 0,
      streamClockMs: 0,
      semanticHz: 3,
      habitat: {},
      civicStrataVisible: [
        { tier: "pulse", text: "p", salience01: 1, visible: true },
        { tier: "consensus", text: "c", salience01: 0.8, visible: true }
      ],
      civicOneLiner: null,
      recommendedStratumTiers: ["pulse", "consensus"],
      layerBudget: {},
      ghostReactionToAudience: audienceDensityGhostReaction(0.9, 0.5),
      ghostIntentCapsule: null,
      audienceDensity01: 0.9,
      chatBurst01: 0.5
    };
    const hardened = applyPresenceInfluenceHardeningToPacket(packet, freeAccess);
    expect(hardened.civicStrataVisible.length).toBeLessThanOrEqual(2);
    expect(hardened.ghostReactionToAudience.collectiveWakeFeedback01).toBeLessThan(
      packet.ghostReactionToAudience.collectiveWakeFeedback01
    );
  });

  it("createPresenceInjectionGovernor gates chat hints after budget exhaustion", () => {
    const gov = createPresenceInjectionGovernor(() => freeAccess, { windowMs: 60_000, freeMax: 2 });
    const hints = { biasWakeAffinity: 0.5, pulseInteraction: 0.4, districtGuess: null, requestOracle: false };
    const a = gov.scaleChatHints(hints);
    expect(a.gated).toBe(false);
    const b = gov.scaleChatHints(hints);
    expect(b.gated).toBe(true);
    expect(b.pulseInteraction).toBeLessThan(0.1);
  });

  it("youtubeEngagementToFeedbackScalars normalizes viewer and chat", () => {
    const s = normalizeYoutubeEngagementSample({
      concurrentViewers: 25_000,
      messagesPerMinute: 60,
      superChatDensity01: 0.2,
      reactionBurst01: 0.3
    });
    const sc = youtubeEngagementToFeedbackScalars(s, { referencePeakViewers: 50_000, referenceMessagesPerMin: 120 });
    expect(sc.viewerCount01).toBeCloseTo(0.5, 5);
    expect(sc.chatBurst01).toBeGreaterThan(0.1);
    expect(sc.viewerReaction01).toBeGreaterThan(0.2);
  });

  it("ingestYoutubeEngagementForProductLoop scales reaction with membership weight", () => {
    const hi = ingestYoutubeEngagementForProductLoop({
      sample: { messagesPerMinute: 100, concurrentViewers: 10_000 },
      rhizohAccess: freeAccess,
      emitSignal: false
    });
    const hp = ingestYoutubeEngagementForProductLoop({
      sample: { messagesPerMinute: 100, concurrentViewers: 10_000 },
      rhizohAccess: premAccess,
      emitSignal: false
    });
    expect(hp.viewerReaction01).toBeGreaterThan(hi.viewerReaction01);
  });
});
