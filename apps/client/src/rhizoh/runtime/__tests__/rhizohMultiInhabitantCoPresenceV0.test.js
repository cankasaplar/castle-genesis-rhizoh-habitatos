import { describe, it, expect, beforeEach } from "vitest";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import { compileExperienceContinuityV0 } from "../rhizohExperienceContinuityCompilerV0.js";
import { runStudioExecutionLoopV0, resetRhizohStudioExecutionLoopForTestV0 } from "../rhizohStudioExecutionLoopV0.js";
import { resetRhizohWorldActionLogForTestV0 } from "../rhizohWorldActionLogV0.js";
import { resetRhizohArtifactRegistryForTestV0 } from "../rhizohArtifactRegistryV0.js";
import { resetRhizohSurfaceBindingsForTestV0 } from "../rhizohSurfaceBindingLayerV0.js";
import { resetRhizohSurfaceSingularityForTestV0 } from "../rhizohSurfaceSingularityLayerV0.js";
import { resetRhizohSurfaceCitizenshipForTestV0 } from "../rhizohSurfaceCitizenshipRuntimeV0.js";
import { resetRhizohStudioOutputPackForTestV0 } from "../rhizohStudioOutputPackV0.js";
import { resetRhizohPetCitizenForTestV0 } from "../rhizohPetCitizenRuntimeV0.js";
import { resetRhizohStudioProductionOrganismForTestV0 } from "../rhizohStudioProductionOrganismV0.js";
import { resetRhizohCastleProjectionForTestV0 } from "../rhizohCastleProjectionLayerV0.js";
import {
  INHABITANT_KIND_V0,
  registerCastleAgentSubscriberV0,
  resetRhizohCoPresenceForTestV0,
  tickMultiInhabitantCoPresenceV0
} from "../rhizohMultiInhabitantCoPresenceV0.js";
import { resetRhizohStudioCastleMappingForTestV0 } from "../rhizohStudioCastleMappingV0.js";

describe("rhizohMultiInhabitantCoPresenceV0", () => {
  beforeEach(() => {
    resetRhizohCoPresenceForTestV0();
    resetRhizohCastleProjectionForTestV0();
    resetRhizohStudioCastleMappingForTestV0();
    resetRhizohStudioProductionOrganismForTestV0();
    resetRhizohStudioExecutionLoopForTestV0();
    resetRhizohWorldActionLogForTestV0();
    resetRhizohArtifactRegistryForTestV0();
    resetRhizohSurfaceBindingsForTestV0();
    resetRhizohSurfaceSingularityForTestV0();
    resetRhizohSurfaceCitizenshipForTestV0();
    resetRhizohStudioOutputPackForTestV0();
    resetRhizohPetCitizenForTestV0();
    window.__rhizoh = {
      cognitiveAttention: {
        attention_inertia: {
          mcib: { causes: [{ id: "a" }], superposition01: 0.2 },
          ccf: { experiential_now_id: "en_cp", collapse_mode: "singular" }
        }
      },
      presenceState: { rhizoh_is_present: true, rhizoh_attention: "focused" }
    };
  });

  it("studio loop publishes castle projection + co-presence + mapping", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true, intensity01: 0.7 }, transitionFeel: {} },
      null,
      1_700_000_030_000
    );
    window.__rhizoh.presenceFrame = frame;
    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true, silence_form: "listening" },
      resl: { orbModulation: { breathe: true } },
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: 1_700_000_030_000
    });

    runStudioExecutionLoopV0({ ecc, frame, cognitive: window.__rhizoh.cognitiveAttention });

    expect(window.__rhizoh.castleProjection?.single_world).toBe(true);
    expect(window.__rhizoh.castleProjection?.shared_wal).toBe(true);
    expect(window.__rhizoh.coPresence?.ok).toBe(true);
    expect(window.__rhizoh.studioCastleMapping?.co_presence_ok).toBe(true);
  });

  it("registers extra agent subscribers without wal authority", () => {
    registerCastleAgentSubscriberV0({ agent_id: "observer_alpha", label: "Alpha" });
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "idle" },
      { orbModulation: {}, transitionFeel: {} },
      null,
      1_700_000_031_000
    );
    window.__rhizoh.presenceFrame = frame;

    const field = tickMultiInhabitantCoPresenceV0({
      frame,
      cognitive: window.__rhizoh.cognitiveAttention,
      presence: window.__rhizoh.presenceState
    });

    const agents = field.inhabitants.filter((i) => i.kind === INHABITANT_KIND_V0.AGENT);
    expect(agents.length).toBeGreaterThanOrEqual(2);
    expect(agents.every((a) => a.wal_authority === false && a.owns_state === false)).toBe(true);
  });
});
