import { describe, it, expect, beforeEach } from "vitest";
import { compileExperienceContinuityV0, publishExperienceContinuityV0 } from "../rhizohExperienceContinuityCompilerV0.js";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import { runStudioExecutionLoopV0, resetRhizohStudioExecutionLoopForTestV0 } from "../rhizohStudioExecutionLoopV0.js";
import { resetRhizohWorldActionLogForTestV0, getLastWorldActionLogEntryV0 } from "../rhizohWorldActionLogV0.js";
import { resetRhizohArtifactRegistryForTestV0 } from "../rhizohArtifactRegistryV0.js";
import { resetRhizohSurfaceBindingsForTestV0 } from "../rhizohSurfaceBindingLayerV0.js";
import { resetRhizohSurfaceSingularityForTestV0 } from "../rhizohSurfaceSingularityLayerV0.js";
import { resetRhizohSurfaceCitizenshipForTestV0 } from "../rhizohSurfaceCitizenshipRuntimeV0.js";
import { resetRhizohStudioOutputPackForTestV0 } from "../rhizohStudioOutputPackV0.js";

describe("rhizohStudioExecutionLoopV0", () => {
  beforeEach(() => {
    resetRhizohStudioExecutionLoopForTestV0();
    resetRhizohWorldActionLogForTestV0();
    resetRhizohArtifactRegistryForTestV0();
    resetRhizohSurfaceBindingsForTestV0();
    resetRhizohSurfaceSingularityForTestV0();
    resetRhizohSurfaceCitizenshipForTestV0();
    resetRhizohStudioOutputPackForTestV0();
    window.__rhizoh = {
      cognitiveAttention: {
        attention_inertia: {
          mcib: { causes: [{ id: "a" }], superposition01: 0.2 },
          ccf: { experiential_now_id: "en_1", collapse_mode: "singular" }
        }
      }
    };
  });

  it("runs full pipeline: RAR → pack → WAL → SCR", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true, intensity01: 0.7 }, transitionFeel: {} },
      null,
      1_700_000_001_000
    );
    window.__rhizoh.presenceFrame = frame;

    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true, silence_form: "listening" },
      resl: { orbModulation: { breathe: true } },
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: 1_700_000_001_000
    });

    const run = runStudioExecutionLoopV0({ ecc, frame, cognitive: window.__rhizoh.cognitiveAttention });

    expect(run?.wal_entry_id).toMatch(/^wal_/);
    expect(run?.artifact_id).toMatch(/^rar_/);
    expect(window.__rhizoh.surfaceCitizenship).toBeTruthy();
    expect(window.__rhizoh.studioOutputPack.lived_state.persistence).toBe("wal_v0");
    expect(getLastWorldActionLogEntryV0()?.entry_id).toBe(run.wal_entry_id);
    expect(window.__rhizoh.studioProductionOrganism?.unity).toBe(
      "world_as_production_organism_v0"
    );
    expect(run.stages).toContain("studio_production_organism");
  });

  it("publishExperienceContinuityV0 triggers studio loop", () => {
    window.__rhizoh.presenceFrame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "idle" },
      { orbModulation: {}, transitionFeel: {} },
      null,
      1_700_000_002_000
    );
    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true },
      resl: {},
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: 1_700_000_002_000
    });
    publishExperienceContinuityV0(ecc);
    expect(window.__rhizoh.worldEpisode?.wal_entry_id).toBeTruthy();
    expect(window.__rhizoh.worldActionLog?.count).toBeGreaterThan(0);
  });
});
