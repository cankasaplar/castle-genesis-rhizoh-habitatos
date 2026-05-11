import { describe, expect, it } from "vitest";
import {
  abstractCityDaySummary,
  compressNarrativeToLayers,
  createCivicMemoryLedger,
  formHistoricalConsensus
} from "./narrativeCompressionCivicMemoryV553.js";

const t0 = 2_000_000;

describe("vNext-553 narrative compression & civic memory", () => {
  it("formHistoricalConsensus weights wake and districts", () => {
    const c = formHistoricalConsensus(
      [
        {
          t: t0,
          kind: "wake_climax",
          intensity01: 0.9,
          habitatFingerprint: "0x1",
          narrationTone: "oracle",
          emphasizedDistrictId: "besiktas"
        },
        {
          t: t0 + 500,
          kind: "branch_surge",
          intensity01: 0.3,
          habitatFingerprint: "0x2",
          narrationTone: "calm",
          emphasizedDistrictId: null
        }
      ],
      t0 + 2000
    );
    expect(c.primaryDistrictId).toBe("besiktas");
    expect(c.tags.some((x) => x.includes("uyanış") || x.includes("alan_"))).toBe(true);
  });

  it("compressNarrativeToLayers exposes strata and clarity", () => {
    const pack = compressNarrativeToLayers({
      dayKey: "2026-05-08",
      locale: "tr",
      nowMs: t0 + 10_000,
      meanContradiction01: 0.25,
      verdict: {
        dominantLane: "plural_soft",
        crowdPressure01: 0.5,
        ghostPushback01: 0.55,
        conflictEntropy01: 0.45,
        tension01: 0.2
      },
      episodeEntries: [
        {
          t: t0,
          kind: "wake_climax",
          intensity01: 0.85,
          habitatFingerprint: "0xa",
          narrationTone: "oracle",
          emphasizedDistrictId: "kadikoy"
        },
        {
          t: t0 + 2000,
          kind: "wake_climax",
          intensity01: 0.6,
          habitatFingerprint: "0xb",
          narrationTone: "tense",
          emphasizedDistrictId: "fatih"
        }
      ]
    });
    expect(pack.strata.length).toBeGreaterThanOrEqual(3);
    expect(pack.strata.some((s) => s.tier === "pulse")).toBe(true);
    expect(pack.strata.some((s) => s.tier === "consensus")).toBe(true);
    expect(pack.clarity01).toBeGreaterThan(0);
    expect(pack.civicOneLiner.length).toBeGreaterThan(10);
  });

  it("abstractCityDaySummary matches compress", () => {
    const input = {
      dayKey: "d",
      episodeEntries: [],
      locale: /** @type {const} */ ("tr"),
      nowMs: t0
    };
    expect(abstractCityDaySummary(input).dayKey).toBe(compressNarrativeToLayers(input).dayKey);
  });

  it("createCivicMemoryLedger rolls consensus across days", () => {
    const ledger = createCivicMemoryLedger({ maxDays: 5 });
    const p1 = compressNarrativeToLayers({
      dayKey: "1",
      episodeEntries: [
        {
          t: t0,
          kind: "wake_climax",
          intensity01: 0.8,
          habitatFingerprint: "x",
          narrationTone: "oracle",
          emphasizedDistrictId: "besiktas"
        }
      ],
      nowMs: t0 + 1000
    });
    ledger.recordDay("1", p1);
    const p2 = compressNarrativeToLayers({
      dayKey: "2",
      episodeEntries: [
        {
          t: t0 + 5000,
          kind: "wake_climax",
          intensity01: 0.7,
          habitatFingerprint: "y",
          narrationTone: "oracle",
          emphasizedDistrictId: "besiktas"
        }
      ],
      nowMs: t0 + 6000
    });
    ledger.recordDay("2", p2);
    const tags = ledger.rollingConsensusTags(3);
    expect(tags.length).toBeGreaterThan(0);
  });
});
