import { describe, expect, it } from "vitest";
import {
  buildBlockedGridV0,
  bfsPathOnGridV0,
  worldToCellV0,
  cellCenterV0
} from "../lib/realSimulation/minimalPathGridNavV0";

describe("minimalPathGridNavV0", () => {
  const spec = { halfExtent: 8, resolution: 24 };

  it("finds path around a central disc obstacle", () => {
    const obs = [{ x: 0, z: 0, r: 2.5 }];
    const blocked = buildBlockedGridV0(spec, obs);
    const a = worldToCellV0(-4, -4, spec);
    const b = worldToCellV0(4, 4, spec);
    const path = bfsPathOnGridV0(spec, blocked, a, b);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(2);
    const mid = cellCenterV0(path![Math.floor(path!.length / 2)].ix, path![Math.floor(path!.length / 2)].iz, spec);
    expect(Math.hypot(mid.x, mid.z)).toBeGreaterThan(2.2);
  });
});
