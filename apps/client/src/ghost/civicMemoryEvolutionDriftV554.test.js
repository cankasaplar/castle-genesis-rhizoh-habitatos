import { describe, expect, it } from "vitest";
import { compressNarrativeToLayers } from "./narrativeCompressionCivicMemoryV553.js";
import {
  computeGhostResistanceFeedback,
  createCivicMemoryEvolutionRuntime,
  evolveIdentityTagEma,
  manageCollectiveMemoryBias,
  measureNarrativeDrift,
  smoothPublicOneLiner
} from "./civicMemoryEvolutionDriftV554.js";

const t0 = 3_000_000;

function packForDay(dayKey, district, extraTagBoost = false) {
  const episodes = [
    {
      t: t0,
      kind: /** @type {const} */ ("wake_climax"),
      intensity01: extraTagBoost ? 0.95 : 0.5,
      habitatFingerprint: `0x${dayKey}`,
      narrationTone: /** @type {const} */ ("oracle"),
      emphasizedDistrictId: district
    }
  ];
  return compressNarrativeToLayers({
    dayKey,
    episodeEntries: episodes,
    nowMs: t0 + 1000,
    locale: "tr",
    verdict: {
      dominantLane: "crowd",
      crowdPressure01: 0.6,
      ghostPushback01: 0.45,
      conflictEntropy01: extraTagBoost ? 0.6 : 0.25,
      tension01: 0.2
    }
  });
}

describe("vNext-554 civic evolution & drift control", () => {
  it("measureNarrativeDrift increases when tags diverge", () => {
    const a = packForDay("d1", "besiktas", false);
    const b = packForDay("d2", "kadikoy", true);
    const d0 = measureNarrativeDrift(null, a);
    const d1 = measureNarrativeDrift(a, b);
    expect(d0.driftMagnitude01).toBe(0);
    expect(d1.tagDrift01).toBeGreaterThan(0.1);
    expect(d1.primaryDistrictChanged).toBe(true);
  });

  it("evolveIdentityTagEma accumulates recurring themes", () => {
    let ema = {};
    ema = evolveIdentityTagEma(ema, ["uyanış", "alan_besiktas"], 0.4);
    ema = evolveIdentityTagEma(ema, ["uyanış"], 0.4);
    expect(ema.uyanış ?? 0).toBeGreaterThan(0.15);
  });

  it("smoothPublicOneLiner blends consecutive civic lines", () => {
    const s = smoothPublicOneLiner("Bugün şehir ne oldu: yeni tema burada.", "Bugün şehir ne oldu: eski tema.", 0.5);
    expect(s.includes("yeni") || s.includes("eski")).toBe(true);
  });

  it("computeGhostResistanceFeedback rises under high drift", () => {
    const low = computeGhostResistanceFeedback(0.2, 0.5, 0.2);
    const high = computeGhostResistanceFeedback(0.7, 0.45, 0.1);
    expect(high).toBeGreaterThan(low);
  });

  it("createCivicMemoryEvolutionRuntime chains days and reports identity drift", () => {
    const rt = createCivicMemoryEvolutionRuntime({ stagnationWindowDays: 3, oneLinerBlend: 0.2 });
    const p1 = packForDay("1", "besiktas", false);
    const p2 = packForDay("2", "fatih", true);
    const r1 = rt.stepDay(p1, 0.45);
    const r2 = rt.stepDay(p2, 0.45);
    expect(r1.drift.driftMagnitude01).toBe(0);
    expect(r2.identityDrift01).toBeGreaterThan(0);
    expect(typeof r2.smoothedCivicOneLiner).toBe("string");
    expect(r2.packAdjusted.consensus.tags.length).toBeGreaterThan(0);
  });

  it("manageCollectiveMemoryBias handles empty weights", () => {
    const o = manageCollectiveMemoryBias({});
    expect(Object.keys(o).length).toBe(0);
  });
});
