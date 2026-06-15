import { describe, expect, it } from "vitest";
import {
  deriveOctoMediaAudioDriveV0,
  octoMediaFloatToSceneXYV0,
  sampleOctoMediaAudioBandsV0,
  stepOctoMediaFloatV0
} from "../octoMediaCompanionMotionV0.js";

describe("octoMediaCompanionMotionV0", () => {
  it("samples idle bands without freq data", () => {
    const bands = sampleOctoMediaAudioBandsV0(null);
    expect(bands.motion).toBeGreaterThan(0);
    expect(bands.centroid).toBeCloseTo(0.5, 1);
  });

  it("maps audio bands to motion drive", () => {
    const drive = deriveOctoMediaAudioDriveV0({ motion: 0.5, centroid: 0.6 });
    expect(drive.swayBoost).toBeGreaterThan(0.5);
    expect(drive.emotion).toBeTruthy();
  });

  it("float state stays inside margins", () => {
    const state = { x: 0.5, y: 0.5, vx: 0, vy: 0, targetX: 0.9, targetY: 0.1 };
    const next = stepOctoMediaFloatV0(state, { motion: 0.4, centroid: 0.5, dt: 0.016 });
    expect(next.x).toBeGreaterThanOrEqual(0.08);
    expect(next.x).toBeLessThanOrEqual(0.92);
    expect(next.y).toBeGreaterThanOrEqual(0.08);
    expect(next.y).toBeLessThanOrEqual(0.92);
  });

  it("converts normalized float to scene coords", () => {
    const { sceneX, sceneY } = octoMediaFloatToSceneXYV0(0.5, 0.5, 1.6);
    expect(sceneX).toBeCloseTo(0, 1);
    expect(sceneY).toBeCloseTo(0, 1);
  });
});
