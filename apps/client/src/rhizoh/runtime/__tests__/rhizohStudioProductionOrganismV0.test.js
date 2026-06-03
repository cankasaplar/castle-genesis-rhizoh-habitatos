import { describe, it, expect, beforeEach } from "vitest";
import { compileExperienceContinuityV0 } from "../rhizohExperienceContinuityCompilerV0.js";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import { runStudioExecutionLoopV0, resetRhizohStudioExecutionLoopForTestV0 } from "../rhizohStudioExecutionLoopV0.js";
import { resetRhizohWorldActionLogForTestV0 } from "../rhizohWorldActionLogV0.js";
import { resetRhizohArtifactRegistryForTestV0 } from "../rhizohArtifactRegistryV0.js";
import { resetRhizohSurfaceBindingsForTestV0 } from "../rhizohSurfaceBindingLayerV0.js";
import { resetRhizohSurfaceSingularityForTestV0 } from "../rhizohSurfaceSingularityLayerV0.js";
import { resetRhizohSurfaceCitizenshipForTestV0 } from "../rhizohSurfaceCitizenshipRuntimeV0.js";
import { resetRhizohStudioOutputPackForTestV0 } from "../rhizohStudioOutputPackV0.js";
import { resetRhizohPetCitizenForTestV0 } from "../rhizohPetCitizenRuntimeV0.js";
import {
  buildStudioProductionOrganismV0,
  readStudioProductionOrganismV0,
  resetRhizohStudioProductionOrganismForTestV0
} from "../rhizohStudioProductionOrganismV0.js";
import { STUDIO_ORGANISM_SURFACE_ROLE_V0, STUDIO_ORGANISM_UNITY_V0 } from "../rhizohStudioOrganismSurfaceRolesV0.js";

describe("rhizohStudioProductionOrganismV0", () => {
  beforeEach(() => {
    resetRhizohStudioExecutionLoopForTestV0();
    resetRhizohWorldActionLogForTestV0();
    resetRhizohArtifactRegistryForTestV0();
    resetRhizohSurfaceBindingsForTestV0();
    resetRhizohSurfaceSingularityForTestV0();
    resetRhizohSurfaceCitizenshipForTestV0();
    resetRhizohStudioOutputPackForTestV0();
    resetRhizohPetCitizenForTestV0();
    resetRhizohStudioProductionOrganismForTestV0();
    window.__rhizoh = {
      cognitiveAttention: {
        attention_inertia: {
          mcib: { causes: [{ id: "a" }], superposition01: 0.2 },
          ccf: { experiential_now_id: "en_1", collapse_mode: "singular" }
        }
      }
    };
  });

  it("unifies pack, WAL, pet actor, and surface roles after studio loop", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true, intensity01: 0.7 }, transitionFeel: {} },
      null,
      1_700_000_002_000
    );
    window.__rhizoh.presenceFrame = frame;

    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true, silence_form: "listening" },
      resl: { orbModulation: { breathe: true } },
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: 1_700_000_002_000
    });

    const run = runStudioExecutionLoopV0({ ecc, frame, cognitive: window.__rhizoh.cognitiveAttention });
    const organism = readStudioProductionOrganismV0();

    expect(organism?.unity).toBe(STUDIO_ORGANISM_UNITY_V0);
    expect(organism?.memory_organ?.wal_entry_id).toBe(run.wal_entry_id);
    expect(organism?.memory_organ?.role).toBe(STUDIO_ORGANISM_SURFACE_ROLE_V0.UI_DRAWER);
    expect(organism?.gesture_field?.role).toBe(STUDIO_ORGANISM_SURFACE_ROLE_V0.CAP_WHEEL);
    expect(organism?.spatial_truth?.role).toBe(STUDIO_ORGANISM_SURFACE_ROLE_V0.CESIUM);
    expect(organism?.pet_actor?.production_aware).toBe(true);
    expect(window.__rhizoh.petCitizen?.studio_actor?.role).toBe(
      STUDIO_ORGANISM_SURFACE_ROLE_V0.PET
    );
  });

  it("builds from SSOT without published snapshot", () => {
    window.__rhizoh.worldEpisode = { current_seq: 3, wal_entry_id: "wal_test" };
    window.__rhizoh.studioOutputPack = {
      pack_id: "sop_x",
      lived_state: { persistence: "wal_v0", wal_entry_id: "wal_test", episode_seq: 3 }
    };
    const o = buildStudioProductionOrganismV0();
    expect(o.memory_organ.episode_seq).toBe(3);
    expect(o.memory_organ.pack_id).toBe("sop_x");
  });
});
