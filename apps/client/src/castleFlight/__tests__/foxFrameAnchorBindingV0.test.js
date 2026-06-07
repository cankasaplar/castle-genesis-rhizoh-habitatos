import { describe, expect, it, afterEach } from "vitest";
import {
  __resetFoxFrameAnchorBindingForTestV0,
  publishFoxAnchorFrameBindingV0,
  readSocialProjectionSourceMsV0
} from "../foxFrameAnchorBindingV0.js";
import { ALIGNMENT_DRIFT_RISK_V0 } from "../perceptionAlignmentSnapshotV0.js";

describe("foxFrameAnchorBindingV0", () => {
  afterEach(() => {
    __resetFoxFrameAnchorBindingForTestV0();
  });

  it("co-binds anchor camera social to same tick", () => {
    const binding = publishFoxAnchorFrameBindingV0({
      atMs: 10_050,
      speciesId: "fox_v1",
      mountId: "conversation_dock",
      force: true
    });
    expect(binding.frames.tickMs).toBe(10_000);
    expect(binding.frames.anchorFrameMs).toBe(10_000);
    expect(binding.frames.cameraFrameMs).toBe(10_000);
    expect(binding.frames.socialFrameMs).toBe(10_000);
    expect(binding.frames.speciesId).toBe("fox_v1");
    expect(binding.coherence.coherent).toBe(true);
    expect(binding.coherence.flickerRisk).toBe(ALIGNMENT_DRIFT_RISK_V0.LOW);
  });

  it("dedupes publish within same tick bucket", () => {
    const a = publishFoxAnchorFrameBindingV0({ atMs: 5000, force: true });
    const b = publishFoxAnchorFrameBindingV0({ atMs: 5040 });
    expect(b).toBe(a);
  });

  it("readSocialProjectionSourceMsV0 returns normalized ms", () => {
    const ms = readSocialProjectionSourceMsV0();
    expect(ms % 100).toBe(0);
  });
});
