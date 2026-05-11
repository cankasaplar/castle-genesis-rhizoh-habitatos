import { describe, expect, it } from "vitest";
import { aggregateRegionalSnapshots } from "./regionalSnapshotAggregator.js";
import { buildFieldAtlas, fieldSampleToCell } from "./fieldAtlasBuilder.js";
import { sampleConstitutionalWeather } from "./constitutionalWeather.js";
import { buildBranchRiverSegments } from "./branchRiverRenderer.js";
import { morton3D16 } from "../spatialMorton.js";

describe("vNext-538 embodied constitutional field", () => {
  it("regional aggregation averages pressure + resonance", () => {
    const m = aggregateRegionalSnapshots([
      {
        regionId: "istanbul",
        pressureVector: [0.5, 0.3, 0.6, 0.4, 0.35],
        resonanceField: { truthResonance: 0.6, legitimacyResonance: 0.7 },
        branchEntropy: 0.2,
        conflictSeverity: 0.1
      },
      {
        regionId: "istanbul",
        pressureVector: [0.7, 0.2, 0.5, 0.5, 0.4],
        branchEntropy: 0.3,
        conflictSeverity: 0.15
      }
    ]);
    const s = m.get("istanbul");
    expect(s).toBeDefined();
    expect(s.pressureMean.length).toBe(5);
    expect(s.branchEntropy).toBeGreaterThan(0);
  });

  it("field atlas packs Morton keys + FieldCell scalars", () => {
    const sample = {
      regionId: "r1",
      pressureMean: [0.6, 0.25, 0.7, 0.5, 0.4],
      resonanceMean: [0.55, 0.2, 0.5, 0.72, 0.38],
      branchEntropy: 0.15,
      conflictSeverity: 0.1
    };
    const cell = fieldSampleToCell(sample);
    const atlas = buildFieldAtlas({
      cells: [{ cx: 1, cy: 2, cz: 3, sample }]
    });
    expect(atlas.cellCount).toBe(1);
    expect(atlas.mortonKeys[0]).toBe(morton3D16(1, 2, 3));
    expect(atlas.texels[0]).toBeCloseTo(cell.truth, 5);
    expect(atlas.texels[6]).toBeCloseTo(cell.branchEntropy, 5);
    expect(atlas.texels[7]).toBeCloseTo(cell.conflictSeverity, 5);
  });

  it("constitutional weather maps FieldCell → VFX scalars", () => {
    const w = sampleConstitutionalWeather({
      truth: 0.8,
      contradiction: 0.2,
      legitimacy: 0.75,
      novelty: 0.5,
      memory: 0.6,
      entropy: 0.1,
      branchEntropy: 0.1,
      conflictSeverity: 0.05
    });
    expect(w.glowDensity).toBeGreaterThan(0.5);
    expect(w.turbulence).toBeGreaterThan(0);
  });

  it("branch rivers emit fork + merge + pruned segments", () => {
    const segs = buildBranchRiverSegments({
      parentEpochHash: "0xp",
      children: [
        { epochHash: "0xa", lineageBranchId: "fork-1" },
        { epochHash: "0xb", lineageBranchId: "main" }
      ],
      mergeMeta: { mergeAncestry: ["0xm1", "0xm2"] },
      prunedHashes: ["0xz"]
    });
    expect(segs.some((s) => s.kind === "fork")).toBe(true);
    expect(segs.some((s) => s.kind === "merge")).toBe(true);
    expect(segs.some((s) => s.kind === "pruned")).toBe(true);
  });
});
