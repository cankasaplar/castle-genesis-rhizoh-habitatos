import { describe, it, expect } from "vitest";
import { buildBlockedGridV0 } from "../../../studio/lib/realSimulation/minimalPathGridNavV0.ts";
import {
  applyNavInvalidationCellsV0,
  pathTouchesInvalidatedCellsV0,
  rebuildNavGridWithIncrementalInvalidationV0,
  shouldUseIncrementalNavPatchV0
} from "../navInvalidationIncrementalV0.js";
import { computeNavInvalidationMaskV0, DEFAULT_NAV_SPEC_V0 } from "../obstacleNavInvalidationV0.js";

describe("navInvalidationIncrementalV0", () => {
  it("patches only listed cells", () => {
    const spec = DEFAULT_NAV_SPEC_V0;
    const prev = [{ x: 0, z: 0, r: 1 }];
    const next = [{ x: 4, z: 4, r: 1 }];
    const keys = computeNavInvalidationMaskV0(prev, next, spec);
    const full = buildBlockedGridV0(spec, prev);
    const patched = applyNavInvalidationCellsV0(full, keys, spec, next);
    const fullNext = buildBlockedGridV0(spec, next);
    expect(patched.patchedCells).toBeGreaterThan(0);
    let same = 0;
    for (let i = 0; i < fullNext.length; i++) {
      if (patched.grid[i] === fullNext[i]) same += 1;
    }
    expect(same).toBe(fullNext.length);
  });

  it("detects path crossing invalidated cells", () => {
    const path = [
      { ix: 1, iz: 1 },
      { ix: 2, iz: 1 },
      { ix: 3, iz: 1 }
    ];
    const flat = [1 * 40 + 2];
    expect(pathTouchesInvalidatedCellsV0(path, flat, 40)).toBe(true);
    expect(pathTouchesInvalidatedCellsV0(path, [999], 40)).toBe(false);
  });

  it("prefers incremental rebuild under ratio threshold", () => {
    expect(shouldUseIncrementalNavPatchV0(10, 1600)).toBe(true);
    expect(shouldUseIncrementalNavPatchV0(800, 1600)).toBe(false);
  });

  it("rebuildNavGridWithIncrementalInvalidation chooses mode", () => {
    const spec = DEFAULT_NAV_SPEC_V0;
    const discs = [{ x: 0, z: 0, r: 1.2 }];
    const keys = computeNavInvalidationMaskV0([], discs, spec);
    const grid = buildBlockedGridV0(spec, []);
    const r = rebuildNavGridWithIncrementalInvalidationV0(grid, {
      discs,
      invalidationCellKeys: keys
    }, spec);
    expect(r.mode).toBe("incremental");
  });
});
