import { describe, expect, it } from "vitest";
import {
  buildOctoMediaHarmonyCarryV0,
  deriveOctoMediaElegantDriveV0,
  resolveOctoMediaElegantScaleV0,
  stepOctoMediaBirdFloatV0
} from "../octoMediaHarmonyV0.js";

describe("octoMediaHarmonyV0", () => {
  it("bird float advances along arc", () => {
    const s0 = { x: 0.5, y: 0.5, vx: 0, vy: 0, targetX: 0.8, targetY: 0.3, arcT: 0 };
    const s1 = stepOctoMediaBirdFloatV0(s0, { motion: 0.3, dt: 0.05 });
    expect(s1.arcT).toBeGreaterThan(0);
    expect(Math.hypot(s1.vx, s1.vy)).toBeLessThan(0.5);
  });

  it("elegant drive scales with speed", () => {
    const slow = deriveOctoMediaElegantDriveV0({ audioMotion: 0.1, vx: 0, vy: 0 });
    const fast = deriveOctoMediaElegantDriveV0({ audioMotion: 0.4, vx: 0.1, vy: -0.08 });
    expect(fast.elegantScale).toBeGreaterThan(slow.elegantScale);
    expect(fast.colorLerpSpeed).toBeGreaterThan(slow.colorLerpSpeed);
  });

  it("harmony carry offsets per tentacle", () => {
    const drive = deriveOctoMediaElegantDriveV0({ audioMotion: 0.25, vx: 0.05, vy: 0.02 });
    const carry = buildOctoMediaHarmonyCarryV0(1.2, drive, { vx: 0.05, vy: 0.02 }, 8);
    expect(carry.harmonyOffsets).toHaveLength(8);
    expect(carry.harmonyOffsets[0]).not.toBe(carry.harmonyOffsets[4]);
  });

  it("elegant scale breathes subtly", () => {
    const a = resolveOctoMediaElegantScaleV0(0.4, 0);
    const b = resolveOctoMediaElegantScaleV0(0.4, 0.5);
    expect(Math.abs(a - b)).toBeLessThan(0.02);
  });
});
