import { describe, expect, it } from "vitest";
import {
  arbitrateCollectiveNarrative,
  computeIntentConflictEntropy,
  mergeWeightedCollectivePresence,
  pruneSharedEpisodeMemory
} from "./collectiveNarrativeArbitrationV551.js";

const snap = (over = {}) => ({
  focusedDistrictId: null,
  interactionEnergy01: 0,
  wakeAffinity01: 0,
  presenceWeight01: 0.8,
  oracleNudgeConsumed: false,
  ...over
});

describe("vNext-551 collective narrative arbitration", () => {
  it("mergeWeightedCollectivePresence respects participant weights", () => {
    const m = mergeWeightedCollectivePresence([
      { snapshot: snap({ focusedDistrictId: "besiktas", presenceWeight01: 1 }), weight01: 0.2 },
      { snapshot: snap({ focusedDistrictId: "kadikoy", presenceWeight01: 1 }), weight01: 1 }
    ]);
    expect(m?.focusedDistrictId).toBe("kadikoy");
  });

  it("computeIntentConflictEntropy rises with split districts", () => {
    const low = computeIntentConflictEntropy([
      { snapshot: snap({ focusedDistrictId: "besiktas" }) },
      { snapshot: snap({ focusedDistrictId: "besiktas" }) }
    ]);
    const high = computeIntentConflictEntropy([
      { snapshot: snap({ focusedDistrictId: "besiktas", presenceWeight01: 0.9 }) },
      { snapshot: snap({ focusedDistrictId: "kadikoy", presenceWeight01: 0.9 }) },
      { snapshot: snap({ focusedDistrictId: "fatih", presenceWeight01: 0.85 }) }
    ]);
    expect(high).toBeGreaterThan(low);
  });

  it("arbitrateCollectiveNarrative softens oracle under multi-user conflict", () => {
    const out = arbitrateCollectiveNarrative({
      ghostResistance01: 0.45,
      ghostStage: "Wanderer",
      fieldPreferredDistrictId: "sisli",
      participants: [
        { id: "a", snapshot: snap({ focusedDistrictId: "besiktas", oracleNudgeConsumed: true, presenceWeight01: 0.95 }) },
        { id: "b", snapshot: snap({ focusedDistrictId: "kadikoy", wakeAffinity01: 0.7, presenceWeight01: 0.9 }) },
        { id: "c", snapshot: snap({ focusedDistrictId: "fatih", interactionEnergy01: 0.6, presenceWeight01: 0.85 }) }
      ]
    });
    expect(out.mergedPresence).not.toBeNull();
    expect(out.verdict.conflictEntropy01).toBeGreaterThan(0.2);
    expect(out.wakeEconomy.softenOracleNudge || out.mergedPresence?.oracleNudgeConsumed === false).toBe(true);
  });

  it("pruneSharedEpisodeMemory keeps stronger salient entries", () => {
    const t0 = 1_000_000;
    const entries = [
      { t: t0, kind: /** @type {const} */ ("branch_surge"), intensity01: 0.2, habitatFingerprint: "a", narrationTone: "calm", emphasizedDistrictId: null },
      { t: t0 + 1000, kind: /** @type {const} */ ("wake_climax"), intensity01: 0.95, habitatFingerprint: "b", narrationTone: "oracle", emphasizedDistrictId: "x" },
      { t: t0 + 2000, kind: /** @type {const} */ ("branch_surge"), intensity01: 0.15, habitatFingerprint: "c", narrationTone: "calm", emphasizedDistrictId: null }
    ];
    const pruned = pruneSharedEpisodeMemory(entries, { maxKeep: 2, nowMs: t0 + 60_000 });
    expect(pruned.length).toBe(2);
    expect(pruned.some((e) => e.kind === "wake_climax")).toBe(true);
  });
});
