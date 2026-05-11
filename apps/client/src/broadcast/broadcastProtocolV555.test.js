import { describe, expect, it } from "vitest";
import { createCastleFieldBridge } from "../bridge/CastleFieldBridge.js";
import { buildIstanbulBridgeInputV540 } from "../scene/istanbulBiomePresetV540.js";
import { buildFieldStoryBeats } from "./fieldStoryEngine.js";
import { createUserPresenceLoop } from "../ghost/userPresenceLoopV548.js";
import {
  BROADCAST_PROTOCOL_VERSION,
  applyChatHintsToPresence,
  audienceDensityGhostReaction,
  chatMessageToPresenceHints,
  composeCastleGenesisPacket,
  compensateStreamClock,
  createSemanticFrameBatcher,
  parseCastleGenesisPacket,
  serializeCastleGenesisPacket
} from "./broadcastProtocolV555.js";

describe("vNext-555 CastleGenesis broadcast protocol", () => {
  it("compensateStreamClock subtracts offset and buffer", () => {
    expect(compensateStreamClock(1000, 100, 50)).toBe(850);
  });

  it("createSemanticFrameBatcher gates emission by Hz", () => {
    const b = createSemanticFrameBatcher({ semanticHz: 2 });
    expect(b.shouldEmit(0)).toBe(true);
    b.markEmit(0);
    expect(b.shouldEmit(400)).toBe(false);
    expect(b.shouldEmit(600)).toBe(true);
  });

  it("chatMessageToPresenceHints detects district and oracle", () => {
    const h = chatMessageToPresenceHints("oracle anı besiktas", 0.9);
    expect(h.districtGuess).toBe("besiktas");
    expect(h.requestOracle).toBe(true);
    expect(h.biasWakeAffinity).toBeGreaterThan(0);
  });

  it("applyChatHintsToPresence drives presence loop", () => {
    const loop = createUserPresenceLoop();
    applyChatHintsToPresence(loop, chatMessageToPresenceHints("kadikoy!", 1));
    const snap = loop.snapshot();
    expect(snap.focusedDistrictId).toBe("kadikoy");
  });

  it("audienceDensityGhostReaction increases collective feedback with density", () => {
    const low = audienceDensityGhostReaction(0.1, 0.1);
    const high = audienceDensityGhostReaction(0.9, 0.8);
    expect(high.collectiveWakeFeedback01).toBeGreaterThan(low.collectiveWakeFeedback01);
    expect(high.microWakeBoost01).toBeGreaterThan(low.microWakeBoost01);
  });

  it("composeCastleGenesisPacket wires habitat + civic strata + protocol meta", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const frame = bridge.submitFrame(buildIstanbulBridgeInputV540({ epochHash: "0xcg555" }));
    const beats = buildFieldStoryBeats(frame);
    const civicPack = {
      dayKey: "test",
      strata: [
        { tier: /** @type {const} */ ("pulse"), text: "Nefes.", salience01: 0.8 },
        { tier: /** @type {const} */ ("tension"), text: "Gerilim.", salience01: 0.5 }
      ],
      civicOneLiner: "Bugün şehir ne oldu: test.",
      consensus: { tags: ["a"], tagWeight: { a: 1 }, primaryDistrictId: "besiktas" },
      cognitiveLoad01: 0.4,
      clarity01: 0.7,
      recommendedVisible: /** @type {const} */ (["pulse", "consensus"])
    };
    const batcher = createSemanticFrameBatcher({ semanticHz: 3 });
    batcher.markEmit(0);
    const pkt = composeCastleGenesisPacket({
      frame,
      beats,
      streamOpts: { narrationLine: "Test narration", channelTitle: "CastleGenesis" },
      civicPack,
      ghostIntent: {
        emphasizedDistrictId: "besiktas",
        oracleMomentForced: false,
        narrationTone: /** @type {const} */ ("calm"),
        branchSurgeMul: 1,
        branchKindOpacityMul: {},
        wakePhase: /** @type {const} */ ("idle"),
        wakeIntensity01: 0,
        ghostResistance01: 0.5,
        microWake01: 0.02
      },
      batcher,
      emittedAtMs: 10_000,
      viewerOffsetMs: 80,
      audienceDensity01: 0.5,
      chatBurst01: 0.3
    });
    expect(pkt.protocolVersion).toBe(BROADCAST_PROTOCOL_VERSION);
    expect(pkt.seq).toBe(1);
    expect(pkt.habitat.caption).toContain("Test");
    expect(pkt.civicOneLiner).toContain("Bugün");
    expect(pkt.civicStrataVisible.length).toBe(1);
    expect(pkt.ghostIntentCapsule?.wakePhase).toBe("idle");
    expect(pkt.layerBudget.fieldGhostVisualPct).toBe(60);
  });

  it("serialize and parse roundtrip", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const frame = bridge.submitFrame(buildIstanbulBridgeInputV540({ epochHash: "0xrt" }));
    const beats = buildFieldStoryBeats(frame);
    const p = composeCastleGenesisPacket({ frame, beats, streamOpts: {} });
    const json = serializeCastleGenesisPacket(p);
    const back = parseCastleGenesisPacket(json);
    expect(back?.protocolVersion).toBe(p.protocolVersion);
    expect(back?.habitat.sceneFrameRef).toBe(p.habitat.sceneFrameRef);
  });
});
