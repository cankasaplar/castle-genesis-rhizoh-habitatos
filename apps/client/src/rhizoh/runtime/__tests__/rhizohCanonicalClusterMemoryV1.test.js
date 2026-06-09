import { describe, expect, it, beforeEach } from "vitest";
import {
  buildCanonicalFeatureSignatureV1,
  clearCanonicalClusterMemoryForTestV1,
  probeCanonicalClusterMemoryV1,
  recordCanonicalClusterHitV1
} from "../rhizohCanonicalClusterMemoryV1.js";
import { CANONICAL_INTENT_V1, probeCanonicalIntentV1 } from "../rhizohCanonicalIntentV1.js";

describe("rhizohCanonicalClusterMemoryV1", () => {
  beforeEach(() => {
    clearCanonicalClusterMemoryForTestV1();
    localStorage.clear();
  });

  it("builds stable feature signatures regardless of token order", () => {
    const a = buildCanonicalFeatureSignatureV1({
      features: new Set(["greeting", "entity_rhizoh"]),
      entity: "rhizoh"
    });
    const b = buildCanonicalFeatureSignatureV1({
      features: new Set(["entity_rhizoh", "greeting"]),
      entity: "rhizoh"
    });
    expect(a).toBe(b);
    expect(a).toContain("greeting");
    expect(a).toContain("entity:rhizoh");
  });

  it("recalls intent after repeated cluster hits", () => {
    const bag = Object.freeze({
      features: new Set(["greeting", "entity_rhizoh", "experimental_signal"]),
      entity: "rhizoh",
      surfaceLanguage: "unknown",
      tokenCount: 3
    });
    recordCanonicalClusterHitV1(bag, CANONICAL_INTENT_V1.GREETING_WAKE);
    expect(probeCanonicalClusterMemoryV1(bag)).toBeNull();
    recordCanonicalClusterHitV1(bag, CANONICAL_INTENT_V1.GREETING_WAKE);
    const recalled = probeCanonicalClusterMemoryV1(bag);
    expect(recalled?.canonicalIntent).toBe(CANONICAL_INTENT_V1.GREETING_WAKE);
    expect(recalled?.fromClusterMemory).toBe(true);
  });

  it("records cluster on successful canonical probe", () => {
    probeCanonicalIntentV1("hola rhizoh");
    const hit = probeCanonicalIntentV1("hola rhizoh");
    expect(hit?.canonicalIntent).toBe(CANONICAL_INTENT_V1.GREETING_WAKE);
  });
});
