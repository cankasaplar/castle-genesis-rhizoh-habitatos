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
  registerCastleAgentSubscriberV0,
  resetRhizohCoPresenceForTestV0
} from "../rhizohMultiInhabitantCoPresenceV0.js";
import { resetRhizohStudioCastleMappingForTestV0 } from "../rhizohStudioCastleMappingV0.js";
import {
  AGENT_GOLDEN_RULE_V0,
  assertAgentInterpretOnlyV0,
  evaluateAgentCognitionBoundaryV0,
  resetRhizohAgentCognitionBoundaryForTestV0,
  validateCastleAgentRegistrationV0
} from "../rhizohAgentCognitionBoundaryV0.js";
import {
  detectPerceptionDivergenceV0,
  PERCEPTION_DRIFT_CLASS_V0,
  resetRhizohCastleCoherenceHardeningForTestV0,
  runCastleCoherenceStressHarnessV0
} from "../rhizohCastleCoherenceHardeningV0.js";
import {
  evaluateStudioPerceptualLockV0,
  resetRhizohStudioPerceptualLockForTestV0
} from "../rhizohStudioPerceptualLockV0.js";
import { registerCastleAgentSubscriberV0 } from "../rhizohMultiInhabitantCoPresenceV0.js";

describe("rhizohCastleCoherenceHardeningV0", () => {
  beforeEach(() => {
    resetRhizohAgentCognitionBoundaryForTestV0();
    resetRhizohCastleCoherenceHardeningForTestV0();
    resetRhizohStudioPerceptualLockForTestV0();
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
          ccf: { experiential_now_id: "en_hard", collapse_mode: "singular" }
        }
      },
      presenceState: { rhizoh_is_present: true }
    };
  });

  it("studio loop publishes hardening + perceptual lock + stress harness", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true }, transitionFeel: {} },
      null,
      1_700_000_040_000
    );
    window.__rhizoh.presenceFrame = frame;
    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true, silence_form: "listening" },
      resl: { orbModulation: { breathe: true } },
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: 1_700_000_040_000
    });

    runStudioExecutionLoopV0({ ecc, frame, cognitive: window.__rhizoh.cognitiveAttention });

    expect(window.__rhizoh.castleCoherenceHardening?.ok).toBe(true);
    expect(window.__rhizoh.castleCoherenceLock?.ok).toBe(true);
    expect(window.__rhizoh.studioPerceptualLock?.ok).toBe(true);
    expect(window.__rhizoh.castleCoherenceStressHarness?.ok).toBe(true);
    expect(window.__rhizoh.coPresence?.rules?.agent_interpret_only).toBe(true);
  });

  it("rejects agent registration that originates world state", () => {
    expect(
      validateCastleAgentRegistrationV0({
        agent_id: "bad",
        originate_world_state: true
      }).ok
    ).toBe(false);
    expect(
      registerCastleAgentSubscriberV0({
        agent_id: "bad",
        originate_world_state: true
      })
    ).toBe(false);
  });

  it("detects perception fork when castle coherence splits from SCR", () => {
    const div = detectPerceptionDivergenceV0({
      castle: Object.freeze({
        single_world: true,
        shared_wal: true,
        coherence_id: "castle_fork"
      }),
      coPresence: Object.freeze({
        coherence_id: "scr_truth",
        inhabitants: [],
        violations: []
      }),
      frame: Object.freeze({ coherenceId: "scr_truth" })
    });
    expect(div.ok).toBe(false);
    expect(div.drift_class).toBe(PERCEPTION_DRIFT_CLASS_V0.FORK_RISK);
  });

  it("agent golden rule: interpret only", () => {
    const ok = assertAgentInterpretOnlyV0(
      Object.freeze({
        kind: "agent",
        inhabitant_id: "a",
        interpret_only: true,
        originate_world_state: false
      })
    );
    expect(ok.ok).toBe(true);

    const bad = evaluateAgentCognitionBoundaryV0([
      Object.freeze({
        kind: "agent",
        inhabitant_id: "a",
        interpret_only: false,
        originate_world_state: false
      })
    ]);
    expect(bad.ok).toBe(false);
    expect(bad.golden_rule).toBe(AGENT_GOLDEN_RULE_V0);
  });
});
