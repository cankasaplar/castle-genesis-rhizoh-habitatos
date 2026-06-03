import { describe, it, expect, beforeEach } from "vitest";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import { compileExperienceContinuityV0 } from "../rhizohExperienceContinuityCompilerV0.js";
import { runStudioExecutionLoopV0, resetRhizohStudioExecutionLoopForTestV0 } from "../rhizohStudioExecutionLoopV0.js";
import {
  replayWorldActionLogEntryV0,
  clearWorldReplayModeV0,
  resetRhizohWorldReplayForTestV0
} from "../rhizohWorldReplayV0.js";
import { resetRhizohWorldActionLogForTestV0 } from "../rhizohWorldActionLogV0.js";
import { resetRhizohArtifactRegistryForTestV0 } from "../rhizohArtifactRegistryV0.js";
import { resetRhizohSurfaceBindingsForTestV0 } from "../rhizohSurfaceBindingLayerV0.js";
import { resetRhizohSurfaceSingularityForTestV0 } from "../rhizohSurfaceSingularityLayerV0.js";
import { resetRhizohSurfaceCitizenshipForTestV0 } from "../rhizohSurfaceCitizenshipRuntimeV0.js";

describe("rhizohWorldReplayV0", () => {
  beforeEach(() => {
    resetRhizohWorldReplayForTestV0();
    resetRhizohStudioExecutionLoopForTestV0();
    resetRhizohWorldActionLogForTestV0();
    resetRhizohArtifactRegistryForTestV0();
    resetRhizohSurfaceBindingsForTestV0();
    resetRhizohSurfaceSingularityForTestV0();
    resetRhizohSurfaceCitizenshipForTestV0();
    window.__rhizoh = { cognitiveAttention: { attention_inertia: { ccf: { experiential_now_id: "x" } } } };
  });

  it("replays WAL entry read-only", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true }, transitionFeel: {} },
      null,
      1_700_000_003_000
    );
    window.__rhizoh.presenceFrame = frame;
    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true },
      resl: {},
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: 1_700_000_003_000
    });
    const run = runStudioExecutionLoopV0({ ecc, frame });
    const replay = replayWorldActionLogEntryV0(run.wal_entry_id);

    expect(replay?.mode).toBe("read_only");
    expect(window.__rhizoh.replayMode).toBe(true);
    expect(window.__rhizoh.presenceFrame.coherenceId).toBe(frame.coherenceId);
    clearWorldReplayModeV0();
    expect(window.__rhizoh.replayMode).toBe(false);
  });
});
