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
import { resetRhizohCoPresenceForTestV0 } from "../rhizohMultiInhabitantCoPresenceV0.js";
import { resetRhizohStudioCastleMappingForTestV0 } from "../rhizohStudioCastleMappingV0.js";
import { resetRhizohCastleCoherenceHardeningForTestV0 } from "../rhizohCastleCoherenceHardeningV0.js";
import { resetRhizohAgentCognitionBoundaryForTestV0 } from "../rhizohAgentCognitionBoundaryV0.js";
import { resetRhizohStudioPerceptualLockForTestV0 } from "../rhizohStudioPerceptualLockV0.js";
import {
  deriveOrganismHeartbeatV0,
  ORGANISM_HEARTBEAT_GRID_MS_V0
} from "../rhizohOrganismHeartbeatV0.js";
import {
  beginOrganismRhythmCycleV0,
  computeRhythmCoherenceV0,
  markOrganismLayerPhaseV0,
  normalizeAgentPerceptionDelayV0,
  publishOrganismStabilizationV0,
  resetRhizohOrganismStabilizationForTestV0
} from "../rhizohOrganismStabilizationV0.js";
import { resetRhizohPerceptualContinuitySmoothingForTestV0 } from "../rhizohPerceptualContinuitySmoothingV0.js";

describe("rhizohOrganismStabilizationV0", () => {
  beforeEach(() => {
    resetRhizohOrganismStabilizationForTestV0();
    resetRhizohPerceptualContinuitySmoothingForTestV0();
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
          mcib: { causes: [{ id: "a" }], superposition01: 0.15 },
          ccf: { experiential_now_id: "en_org", collapse_mode: "singular" }
        }
      },
      presenceState: { rhizoh_is_present: true }
    };
  });

  it("studio loop publishes organism rhythm + pet motion lock", () => {
    const now = 1_700_000_050_000;
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true, intensity01: 0.7 }, transitionFeel: {} },
      null,
      now
    );
    window.__rhizoh.presenceFrame = frame;
    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true, silence_form: "listening" },
      resl: { orbModulation: { breathe: true } },
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: now
    });

    runStudioExecutionLoopV0({ ecc, frame, cognitive: window.__rhizoh.cognitiveAttention });

    expect(window.__rhizoh.organismStabilization?.ok).toBe(true);
    expect(window.__rhizoh.organismRhythm?.grid_ms).toBe(ORGANISM_HEARTBEAT_GRID_MS_V0);
    expect(window.__rhizoh.petCitizen?.motion_frame_lock?.heartbeat_index).toBeDefined();
    expect(window.__rhizoh.perceptualContinuitySmooth?.authoritative).toBe(false);
    expect(window.__rhizoh.coPresence?.rhythm_ok).toBe(true);
  });

  it("computes rhythm coherence when layers align to heartbeat", () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "idle" },
      { orbModulation: {}, transitionFeel: {} },
      null,
      1_700_000_051_000
    );
    const hb = beginOrganismRhythmCycleV0(frame);
    markOrganismLayerPhaseV0("scr_tick", hb.aligned_at_ms);
    markOrganismLayerPhaseV0("wal_append", hb.aligned_at_ms + 5);
    markOrganismLayerPhaseV0("castle_projection", hb.aligned_at_ms + 12);

    const rhythm = computeRhythmCoherenceV0(hb, [
      { phase: "scr_tick", atMs: hb.aligned_at_ms },
      { phase: "wal_append", atMs: hb.aligned_at_ms + 5 },
      { phase: "castle_projection", atMs: hb.aligned_at_ms + 12 }
    ]);
    expect(rhythm.ok).toBe(true);
    expect(rhythm.max_jitter_ms).toBeLessThanOrEqual(64);
  });

  it("normalizes agent perception latency to heartbeat grid", () => {
    const hb = deriveOrganismHeartbeatV0(
      buildT0UnifiedPresenceFrameV0(
        { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "idle" },
        { orbModulation: {}, transitionFeel: {} },
        null,
        1_700_000_052_000
      )
    );
    const agents = normalizeAgentPerceptionDelayV0(
      [{ inhabitant_id: "a", kind: "agent" }],
      hb,
      hb.aligned_at_ms + 100
    );
    expect(agents[0].perception_latency_ms).toBe(100);
    expect(agents[0].perception_aligned).toBe(true);
  });
});
