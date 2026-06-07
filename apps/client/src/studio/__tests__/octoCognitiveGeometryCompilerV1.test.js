import { describe, expect, it } from "vitest";
import {
  analyzeCognitiveSemanticsV1,
  buildCognitiveLinkPairsV1,
  buildSentenceColorKeyV1,
  createCognitiveGeometryEngineV1,
  createCognitiveNodeV1,
  extractActiveSentenceV1,
  ingestActiveSentenceV1,
  ingestCognitiveDraftV1,
  resolveOppositeCrystalColorV1,
  resolveSpeakingCrystalColorV1
} from "../octoCognitiveGeometryCompilerV1.js";

describe("octoCognitiveGeometryCompilerV1", () => {
  it("maps observation words to stretch topology", () => {
    const semantic = analyzeCognitiveSemanticsV1("merhaba göster bak");
    expect(semantic.dominant).toBe("OBSERVATION");
    expect(semantic.targetTopology.stretchY).toBeGreaterThan(1);
  });

  it("maps memory words to fold topology", () => {
    const semantic = analyzeCognitiveSemanticsV1("hatırla geçmiş bellek");
    expect(semantic.dominant).toBe("MEMORY");
    expect(semantic.targetTopology.fold).toBeGreaterThan(0);
  });

  it("maps action words to spikes", () => {
    const semantic = analyzeCognitiveSemanticsV1("korku tehlike kaç");
    expect(semantic.dominant).toBe("ACTION");
    expect(semantic.targetTopology.spikes).toBeGreaterThan(0.5);
  });

  it("builds fibonacci nodes and mesh links", () => {
    const nodes = [0, 1, 2, 3, 4].map((i) => createCognitiveNodeV1(i, 5));
    const links = buildCognitiveLinkPairsV1(nodes, 2);
    expect(nodes[0].originX).toBeGreaterThanOrEqual(-1);
    expect(links.length).toBeGreaterThan(0);
  });

  it("tracks active sentence for color revision", () => {
    expect(extractActiveSentenceV1("merhaba. neden mantık")).toBe("neden mantık");
    const a = buildSentenceColorKeyV1("merhaba.", "", 0);
    const b = buildSentenceColorKeyV1("merhaba. neden", "", 0);
    expect(a).not.toBe(b);

    const engine = createCognitiveGeometryEngineV1(12);
    ingestActiveSentenceV1(engine, "korku tehlike");
    expect(engine.dominant).toBe("ACTION");
    ingestActiveSentenceV1(engine, "merhaba göster");
    expect(engine.dominant).toBe("OBSERVATION");
  });

  it("inverts palette for octo contrast", () => {
    const base = resolveSpeakingCrystalColorV1("merhaba");
    const inverse = resolveOppositeCrystalColorV1(base);
    expect(inverse.base).not.toBe(base.base);
  });

  it("ingests draft and shifts speaking crystal color", () => {
    const engine = createCognitiveGeometryEngineV1(24);
    ingestCognitiveDraftV1(engine, "neden mantık çözüm");
    expect(engine.dominant).toBe("REASONING");
    expect(engine.targetTopology.twist).toBeGreaterThan(0);

    const short = resolveSpeakingCrystalColorV1("a");
    const longer = resolveSpeakingCrystalColorV1("merhaba rhizoh kristal compiler");
    expect(longer.base).not.toBe(short.base);
  });
});
