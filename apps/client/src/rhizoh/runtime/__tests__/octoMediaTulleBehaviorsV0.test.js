import { describe, expect, it } from "vitest";
import {
  buildOctoMediaTulleTargetBehaviorV0,
  cloneOctoMediaTulleBehaviorV0,
  deriveOctoMediaTulleDriveV0,
  lerpOctoMediaTulleBehaviorV0,
  resolveOctoMediaTulleBehaviorV0
} from "../octoMediaTulleBehaviorsV0.js";

describe("octoMediaTulleBehaviorsV0", () => {
  it("resolves behavior presets", () => {
    const swim = resolveOctoMediaTulleBehaviorV0("SWIM");
    expect(swim.freq).toBeGreaterThan(resolveOctoMediaTulleBehaviorV0("IDLE").freq);
  });

  it("maps fast movement to faster color lerp and dance/speak modes", () => {
    const slow = deriveOctoMediaTulleDriveV0({ audioMotion: 0.1, vx: 0.01, vy: 0.01 });
    const fast = deriveOctoMediaTulleDriveV0({ audioMotion: 0.45, vx: 0.12, vy: -0.08 });
    expect(fast.colorLerpSpeed).toBeGreaterThan(slow.colorLerpSpeed);
    expect(fast.mode).toBe("SPEAK");
  });

  it("alternates wave flow with velocity direction", () => {
    const down = deriveOctoMediaTulleDriveV0({ vx: 0.01, vy: -0.1, audioMotion: 0.2 });
    const up = deriveOctoMediaTulleDriveV0({ vx: 0.01, vy: 0.1, audioMotion: 0.2 });
    expect(down.waveFlow).not.toBe(up.waveFlow);
  });

  it("lerps behavior toward target", () => {
    const cur = cloneOctoMediaTulleBehaviorV0("IDLE");
    const tgt = resolveOctoMediaTulleBehaviorV0("DANCE");
    lerpOctoMediaTulleBehaviorV0(cur, tgt, 0.1, 3);
    expect(cur.freq).toBeGreaterThan(resolveOctoMediaTulleBehaviorV0("IDLE").freq);
  });

  it("clones frozen presets for mutation", () => {
    const frozen = resolveOctoMediaTulleBehaviorV0("SWIM");
    const cloned = cloneOctoMediaTulleBehaviorV0("SWIM");
    cloned.colorH += 12;
    expect(cloned.colorH).toBe(frozen.colorH + 12);
    expect(frozen.colorH).toBe(210);
  });

  it("builds mutable target with hue bias without touching frozen preset", () => {
    const frozen = resolveOctoMediaTulleBehaviorV0("DANCE");
    const target = buildOctoMediaTulleTargetBehaviorV0("DANCE", 18);
    expect(target.colorH).toBe(frozen.colorH + 18);
    expect(frozen.colorH).toBe(290);
  });
});
