import { describe, expect, it } from "vitest";
import { audienceDensityGhostReaction } from "../broadcast/broadcastProtocolV555.js";
import { createGhostEpisodeMemory } from "./ghostEpisodeMemoryV547.js";
import {
  closeRuntimeFeedbackRound,
  computeFeedsFeedbackFromBroadcast,
  computeViewerReactionFieldNudge,
  createRuntimeFeedbackLoop,
  injectSyntheticEpisodeFromChat
} from "./runtimeFeedbackLoopV556.js";

const genome = {
  vitality: 0.6,
  calm: 0.55,
  curiosity: 0.5,
  wisdom: 0.5,
  playfulness: 0.45,
  resilience: 0.5,
  scarTension: 0.35,
  sovereignBond: 0.55,
  lineageAge: 0.4,
  memoryDepth: 0.5,
  mutationBloom: 0.2
};

function mockPacket(over = {}) {
  return {
    protocolVersion: "v555.1",
    seq: 1,
    emittedAtMs: 0,
    streamClockMs: 0,
    semanticHz: 3,
    habitat: {},
    civicStrataVisible: [],
    civicOneLiner: null,
    recommendedStratumTiers: [],
    layerBudget: {},
    ghostReactionToAudience: audienceDensityGhostReaction(0.7, 0.5),
    ghostIntentCapsule: null,
    audienceDensity01: 0.7,
    chatBurst01: 0.5,
    ...over
  };
}

describe("vNext-556 runtime feedback loop closure", () => {
  it("computeFeedsFeedbackFromBroadcast nudges traffic/events", () => {
    const d = computeFeedsFeedbackFromBroadcast(mockPacket());
    expect(d.traffic).toBeGreaterThan(0);
    expect(d.events).toBeGreaterThan(0);
  });

  it("computeViewerReactionFieldNudge scales with reaction", () => {
    expect(computeViewerReactionFieldNudge(0.9).traffic).toBeGreaterThan(computeViewerReactionFieldNudge(0.1).traffic);
  });

  it("createRuntimeFeedbackLoop merges broadcast into feeds and patches genome", () => {
    const loop = createRuntimeFeedbackLoop();
    loop.ingestBroadcastPacket(mockPacket(), 0.05);
    const feeds = loop.mergeIntoFeeds({ traffic: 0.4, events: 0.4, weather: 0.5 });
    expect(feeds.traffic).toBeGreaterThan(0.4);
    const g2 = loop.patchGenome(genome);
    expect(g2.playfulness).not.toBe(genome.playfulness);
    loop.reset();
    const feeds2 = loop.mergeIntoFeeds({ traffic: 0.4 });
    expect(feeds2.traffic).toBeCloseTo(0.4, 5);
  });

  it("ingestChat records civic mutation and optional episode", () => {
    const loop = createRuntimeFeedbackLoop();
    const ep = createGhostEpisodeMemory({ maxEntries: 20 });
    loop.ingestChat("oracle besiktas", { episodeMemory: ep, frameFingerprint: "0xc" });
    expect(loop.getCivicLedger().recent(5).length).toBe(1);
    expect(ep.recent(3).length).toBeGreaterThan(0);
  });

  it("closeRuntimeFeedbackRound is stateless orchestration", () => {
    const ep = createGhostEpisodeMemory({ maxEntries: 10 });
    const out = closeRuntimeFeedbackRound({
      baseFeeds: { traffic: 0.4, events: 0.4, weather: 0.5 },
      genome,
      packet: mockPacket(),
      chatLines: ["wow kadikoy"],
      viewerReaction01: 0.6,
      dtSec: 0.05,
      episodeMemory: ep,
      frameFingerprint: "0xr"
    });
    expect(out.feeds.traffic).toBeGreaterThan(0.4);
    expect(out.genomePatched.playfulness).toBeGreaterThanOrEqual(genome.playfulness);
    expect(out.civicMutations.length).toBeGreaterThan(0);
    expect(ep.recent(2).length).toBeGreaterThan(0);
  });

  it("injectSyntheticEpisodeFromChat skips low-energy chat", () => {
    const ep = createGhostEpisodeMemory({ maxEntries: 5 });
    injectSyntheticEpisodeFromChat(ep, "ok", "0x1");
    expect(ep.recent(2).length).toBe(0);
  });
});
