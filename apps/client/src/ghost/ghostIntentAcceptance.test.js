import { describe, expect, it } from "vitest";
import { createGhostIntentController, mergeEmbodimentWithGhostIntent } from "./ghostIntentLayerV547.js";
import { narrateConstitutionalField } from "../broadcast/constitutionalNarrator.js";
import { scoreHabitatWake } from "../habitat/runtime/wakeMoments.js";
import { mergeEmphasisDistrictWithPresence, mergeNarrationToneWithPresence } from "./userPresenceLoopV548.js";
import { computeGhostResistance01, userWakeBoostGainMul } from "./ghostResistanceV549.js";
import { mergeCollectivePresenceSnaps } from "./ghostCollectivePresenceV549.js";

/** @param {number} c01 contradiction [0–1] pressure/resonance kanalı */
function districtSample(regionId, c01) {
  return {
    regionId,
    pressureMean: [0.52, c01, 0.5, 0.32, 0.22],
    resonanceMean: [0.48, c01, 0.34, 0.48, 0.2],
    branchEntropy: 0.22,
    conflictSeverity: 0.12
  };
}

/** @param {number} c01 */
function twoDistrictMap(c01) {
  const m = new Map();
  m.set("besiktas", districtSample("besiktas", c01));
  m.set("kadikoy", districtSample("kadikoy", c01));
  return m;
}

/** @param {string} fp @param {Map<string, object>} map */
function habitatFrame(fp, map) {
  return {
    frameFingerprint: fp,
    regionalMap: map,
    overlayState: {
      rhizohSovereign: { tier: "L1", drift: 0.04, legitimacyResonance: 0.62, mutation: "sealed" },
      weatherSummary: { seismicMicro: 0.02 }
    },
    branchSegments: []
  };
}

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

describe("vNext-547 Ghost Intent + wake", () => {
  it("scoreHabitatWake picks up contradiction spike", () => {
    const a = habitatFrame("0x1", twoDistrictMap(0.06));
    const b = habitatFrame("0x2", twoDistrictMap(0.48));
    expect(scoreHabitatWake(a, b)).toBeGreaterThan(0.42);
  });

  it("wake FSM advances on wall time when frame fingerprint is unchanged", () => {
    const ctrl = createGhostIntentController({ wakeThreshold: 0.35, risingMs: 80, peakMs: 200, decayMs: 400 });
    const low = twoDistrictMap(0.05);
    const high = twoDistrictMap(0.5);
    const fLow = habitatFrame("0xw0", low);
    const fHigh = habitatFrame("0xw1", high);

    ctrl.onHabitatFrame(fLow, genome, "Wanderer", 1_000, 0.016);
    const rWake = ctrl.onHabitatFrame(fHigh, genome, "Wanderer", 1_050, 0.016);
    expect(rWake.intent.wakePhase).toBe("rising");

    const rPeak = ctrl.onHabitatFrame(fHigh, genome, "Wanderer", 1_000 + 200, 0.016);
    expect(rPeak.intent.wakePhase).toBe("peak");
    expect(ctrl.episode.recent(3).some((e) => e.kind === "wake_climax")).toBe(true);
  });

  it("mergeEmbodimentWithGhostIntent boosts branch visibility on surge", () => {
    const base = Object.freeze({
      anchor: [0, 0, 0],
      oracleMode: false,
      branchVisibilityMul: 1,
      branchEmissiveMul: 1,
      fieldDistortionMul: 1,
      perDistrict: { besiktas: { scaleMul: 1, opacityMul: 1 } },
      bosphorusDistance: 0.5
    });
    const intent = {
      emphasizedDistrictId: "besiktas",
      oracleMomentForced: true,
      narrationTone: /** @type {const} */ ("oracle"),
      branchSurgeMul: 1.48,
      branchKindOpacityMul: { fork: 1, merge: 1, mainline: 1, pruned: 1 },
      wakePhase: /** @type {const} */ ("peak"),
      wakeIntensity01: 0.7,
      ghostResistance01: 0.35,
      microWake01: 0
    };
    const m = mergeEmbodimentWithGhostIntent(base, intent);
    expect(m.branchVisibilityMul).toBeGreaterThan(1.35);
    expect(m.oracleMode).toBe(true);
    expect(m.perDistrict.besiktas.scaleMul).toBeGreaterThan(1);
  });

  it("narrateConstitutionalField applies tone prefix (TR)", () => {
    const beats = {
      peakContradictionRegionId: "besiktas",
      peakContradiction: 0.4,
      peakMemoryRegionId: "fatih",
      peakMemory: 0.3,
      meanTruth: 0.55,
      meanTurbulence: 0.4,
      meanBranchEntropy: 0.2,
      meanConflict: 0.15,
      sovereign: { tier: "L1", drift: 0, legitimacyResonance: 0.5, mutation: "sealed" }
    };
    const oracle = narrateConstitutionalField(beats, "tr", null, { narrationTone: "oracle" });
    expect(oracle.startsWith("Oracle anı:")).toBe(true);
  });
});

describe("vNext-548 wake budget + user presence", () => {
  it("wake budget blocks after max_wake_per_minute", () => {
    const ctrl = createGhostIntentController({
      wakeThreshold: 0.35,
      risingMs: 40,
      peakMs: 60,
      decayMs: 80,
      wakeBudget: { maxWakePerMinute: 2, silentStabilizationMs: 0 }
    });
    const low = twoDistrictMap(0.05);
    const high = twoDistrictMap(0.5);

    const fullCycle = (t0, fpL, fpH) => {
      const hi = (t) => ctrl.onHabitatFrame(habitatFrame(fpH, high), genome, "Wanderer", t, 0.016);
      ctrl.onHabitatFrame(habitatFrame(fpL, low), genome, "Wanderer", t0, 0.016);
      hi(t0 + 10);
      hi(t0 + 55);
      hi(t0 + 130);
      hi(t0 + 215);
      expect(ctrl.getWakePhase()).toBe("idle");
    };

    fullCycle(10_000, "0xc1", "0xc2");
    fullCycle(10_300, "0xc3", "0xc4");

    ctrl.onHabitatFrame(habitatFrame("0xc5", low), genome, "Wanderer", 10_600, 0.016);
    const blocked = ctrl.onHabitatFrame(habitatFrame("0xc6", high), genome, "Wanderer", 10_610, 0.016);
    expect(blocked.intent.wakePhase).toBe("idle");
  });

  it("user presence steers idle emphasis district", () => {
    const habitatPick = "kadikoy";
    const snap = {
      focusedDistrictId: "besiktas",
      interactionEnergy01: 0.2,
      wakeAffinity01: 0,
      presenceWeight01: 0.95,
      oracleNudgeConsumed: false
    };
    expect(mergeEmphasisDistrictWithPresence(habitatPick, snap, "idle")).toBe("besiktas");
    expect(mergeEmphasisDistrictWithPresence(habitatPick, snap, "rising")).toBe("kadikoy");
  });

  it("mergeNarrationToneWithPresence upgrades calm under high wake affinity", () => {
    expect(mergeNarrationToneWithPresence("calm", {
      focusedDistrictId: null,
      interactionEnergy01: 0,
      wakeAffinity01: 0.7,
      presenceWeight01: 0.5,
      oracleNudgeConsumed: false
    })).toBe("tense");
  });

  it("ghost resistance softens user emphasis steal", () => {
    const snap = {
      focusedDistrictId: "besiktas",
      interactionEnergy01: 0.2,
      wakeAffinity01: 0,
      presenceWeight01: 0.95,
      oracleNudgeConsumed: false
    };
    expect(mergeEmphasisDistrictWithPresence("kadikoy", snap, "idle", 0)).toBe("besiktas");
    expect(mergeEmphasisDistrictWithPresence("kadikoy", snap, "idle", 0.88)).toBe("kadikoy");
  });

  it("high ghost resistance blocks oracle narration nudge into oracle tone", () => {
    const snap = {
      focusedDistrictId: null,
      interactionEnergy01: 0,
      wakeAffinity01: 0,
      presenceWeight01: 0.5,
      oracleNudgeConsumed: true
    };
    expect(mergeNarrationToneWithPresence("calm", snap, 0)).toBe("oracle");
    expect(mergeNarrationToneWithPresence("calm", snap, 0.86)).toBe("calm");
  });

  it("computeGhostResistance01 stays in 01 and wake boost gain shrinks with resistance", () => {
    const r = computeGhostResistance01(genome, "Oracle");
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
    expect(userWakeBoostGainMul(0)).toBeGreaterThan(userWakeBoostGainMul(0.9));
  });

  it("mergeCollectivePresenceSnaps aggregates competing foci", () => {
    const a = {
      focusedDistrictId: "besiktas",
      interactionEnergy01: 0.4,
      wakeAffinity01: 0.2,
      presenceWeight01: 0.9,
      oracleNudgeConsumed: false
    };
    const b = {
      focusedDistrictId: "kadikoy",
      interactionEnergy01: 0.35,
      wakeAffinity01: 0.25,
      presenceWeight01: 0.85,
      oracleNudgeConsumed: true
    };
    const m = mergeCollectivePresenceSnaps([a, b]);
    expect(m).not.toBeNull();
    expect(m?.oracleNudgeConsumed).toBe(true);
    expect(m?.focusedDistrictId === "besiktas" || m?.focusedDistrictId === "kadikoy").toBe(true);
  });

  it("vNext-550 microWake leakage stays >0 in idle without spending wake FSM", () => {
    const ctrl = createGhostIntentController({
      wakeThreshold: 0.99,
      microWake: { staleStartMs: 0, staleMsForFull: 800, baseLeak: 0.035, maxMicro: 0.18 }
    });
    const low = twoDistrictMap(0.22);
    const f = habitatFrame("0xµ1", low);
    ctrl.onHabitatFrame(f, genome, "Wanderer", 0, 0.016);
    const r = ctrl.onHabitatFrame(f, genome, "Wanderer", 40, 0.05);
    expect(r.intent.wakePhase).toBe("idle");
    expect(r.intent.microWake01).toBeGreaterThan(0.02);
  });

  it("microWake is suppressed during rising wake phase", () => {
    const ctrl = createGhostIntentController({
      wakeThreshold: 0.35,
      risingMs: 500,
      microWake: { baseLeak: 0.08, maxMicro: 0.3 }
    });
    const low = twoDistrictMap(0.05);
    const high = twoDistrictMap(0.5);
    ctrl.onHabitatFrame(habitatFrame("0xµa", low), genome, "Wanderer", 0, 0.016);
    const up = ctrl.onHabitatFrame(habitatFrame("0xµb", high), genome, "Wanderer", 20, 0.016);
    expect(up.intent.wakePhase).toBe("rising");
    expect(up.intent.microWake01).toBe(0);
  });
});
