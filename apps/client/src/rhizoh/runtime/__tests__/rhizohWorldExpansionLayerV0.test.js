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
import { resetRhizohOrganismStabilizationForTestV0 } from "../rhizohOrganismStabilizationV0.js";
import { resetRhizohIdentityConsistencyLayerForTestV0 } from "../rhizohIdentityConsistencyLayerV0.js";
import { resetRhizohWorldWalPersistenceForTestV0 } from "../rhizohWorldWalPersistenceV0.js";
import { resetRhizohProductionRhythmStressForTestV0 } from "../rhizohProductionRhythmStressTestV0.js";
import { resetRhizohProductionDeploymentRunbookForTestV0 } from "../rhizohProductionDeploymentRunbookV0.js";
import { resetRhizohHotReloadRuntimeForTestV0 } from "../rhizohHotReloadRuntimeV0.js";
import { resetRhizohScrDistributedMeshForTestV0 } from "../rhizohScrDistributedMeshV0.js";
import { resetRhizohCastleGraphForTestV0 } from "../rhizohCastleGraphV0.js";
import { resetRhizohStudioLiveEditorForTestV0 } from "../rhizohStudioLiveEditorV0.js";
import { resetRhizohPetEvolutionForTestV0 } from "../rhizohPetEvolutionV0.js";
import { resetRhizohWorldExpansionLayerForTestV0 } from "../rhizohWorldExpansionLayerV0.js";
import {
  createInMemoryWorldWalIdbBackendV0,
  __setWorldWalIdbBackendForTestV0,
  __resetWorldWalIdbForTestV0
} from "../rhizohWorldActionLogIdbV0.js";
import { tickPetEvolutionV0, foldPetMemoryTraceV0 } from "../rhizohPetEvolutionV0.js";
import {
  submitStudioEditSuggestionV0,
  STUDIO_EDIT_TARGET_V0,
  STUDIO_EDIT_MODE_V0
} from "../rhizohStudioLiveEditorV0.js";
import {
  registerCastleGraphNodeV0,
  linkCastleGraphNodesV0,
  publishCastleGraphV0
} from "../rhizohCastleGraphV0.js";
import { executeWorldHotReloadV0 } from "../rhizohHotReloadRuntimeV0.js";
import {
  reportScrRegionHeartbeatV0,
  publishScrDistributedMeshV0,
  SCR_SYNC_MODE_V0
} from "../rhizohScrDistributedMeshV0.js";
import { primeWorldExpansionLayerV0 } from "../rhizohWorldExpansionLayerV0.js";
import { runWorldIdentityConsistencyHarnessV0 } from "../rhizohIdentityConsistencyLayerV0.js";
import { persistWorldWalEntryV0 } from "../rhizohWorldWalPersistenceV0.js";
import { getLastWorldActionLogEntryV0 } from "../rhizohWorldActionLogV0.js";

function resetExpansionStackV0() {
  resetRhizohWorldExpansionLayerForTestV0();
  resetRhizohPetEvolutionForTestV0();
  resetRhizohStudioLiveEditorForTestV0();
  resetRhizohCastleGraphForTestV0();
  resetRhizohHotReloadRuntimeForTestV0();
  resetRhizohScrDistributedMeshForTestV0();
  resetRhizohProductionDeploymentRunbookForTestV0();
  resetRhizohProductionRhythmStressForTestV0();
  resetRhizohOrganismStabilizationForTestV0();
  resetRhizohIdentityConsistencyLayerForTestV0();
  resetRhizohWorldWalPersistenceForTestV0();
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
  __resetWorldWalIdbForTestV0();
  __setWorldWalIdbBackendForTestV0(createInMemoryWorldWalIdbBackendV0());
  window.__rhizoh = {
    cognitiveAttention: {
      attention_inertia: {
        mcib: { causes: [{ id: "exp" }], superposition01: 0.15 },
        ccf: { experiential_now_id: "en_exp", collapse_mode: "singular" }
      }
    },
    presenceState: { rhizoh_is_present: true }
  };
}

async function runStudioTickV0(nowMs) {
  const frame = buildT0UnifiedPresenceFrameV0(
    { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
    { orbModulation: { breathe: true }, transitionFeel: {} },
    null,
    nowMs
  );
  window.__rhizoh.presenceFrame = frame;
  const ecc = compileExperienceContinuityV0({
    presence: { rhizoh_is_present: true, silence_form: "listening" },
    resl: { orbModulation: { breathe: true } },
    cognitive: window.__rhizoh.cognitiveAttention,
    nowMs
  });
  window.__rhizoh.experienceContinuity = ecc;
  runStudioExecutionLoopV0({ ecc, frame, cognitive: window.__rhizoh.cognitiveAttention });
  await persistWorldWalEntryV0(getLastWorldActionLogEntryV0());
  runWorldIdentityConsistencyHarnessV0({ skipReplay: true });
}

describe("rhizohWorldExpansionLayerV0", () => {
  beforeEach(resetExpansionStackV0);

  it("pet evolution accumulates memory trace ICL-guided", async () => {
    await runStudioTickV0(1_700_001_000_000);
    const evo = tickPetEvolutionV0();
    expect(evo.inhabited).toBe(true);
    expect(evo.behavior.adaptation).toBe("icl_guided");
    expect(evo.memory_trace.visited_castles.length).toBeGreaterThan(0);
    expect(evo.behavior.scr_unity_preserved).toBe(true);
  });

  it("studio live editor rejects direct world mutation", () => {
    const bad = submitStudioEditSuggestionV0({
      target: STUDIO_EDIT_TARGET_V0.CASTLE_PROJECTION,
      payload: { mutate_world: true }
    });
    expect(bad.ok).toBe(false);

    const ok = submitStudioEditSuggestionV0({
      target: STUDIO_EDIT_TARGET_V0.PET_SPATIAL_NUDGE,
      mode: STUDIO_EDIT_MODE_V0.SUGGESTION_ONLY,
      payload: { dx: 0.01, dy: 0.0 }
    });
    expect(ok.ok).toBe(true);
    expect(window.__rhizoh.studioLiveEditor?.direct_mutation_forbidden).toBe(true);
  });

  it("castle graph preserves single_world constraint", async () => {
    await runStudioTickV0(1_700_001_010_000);
    registerCastleGraphNodeV0({ castle_node_id: "castle_a" });
    registerCastleGraphNodeV0({ castle_node_id: "castle_b" });
    linkCastleGraphNodesV0({ from: "castle_a", to: "castle_b", kind: "visual_echo" });
    const graph = publishCastleGraphV0();
    expect(graph.constraint).toBe("single_world_only");
    expect(graph.shared_wal).toBe(true);
    expect(window.__rhizoh.castleGraph?.mode).toBe("shared_projection_graph");
  });

  it("hot reload preserves T0 without world restart", async () => {
    await runStudioTickV0(1_700_001_020_000);
    const coherenceBefore = window.__rhizoh.presenceFrame.coherenceId;
    const report = await executeWorldHotReloadV0({ moduleLabels: ["test_patch"] });
    expect(report.ok).toBe(true);
    expect(report.world_restart).toBe(false);
    expect(report.t0_preserved).toBe(true);
    expect(window.__rhizoh.presenceFrame.coherenceId).toBe(coherenceBefore);
    expect(window.__rhizoh.hotReloadRuntime?.phase).toBe("complete");
  });

  it("SCR mesh uses ICL-verified T0 not fastest node", async () => {
    await runStudioTickV0(1_700_001_030_000);
    reportScrRegionHeartbeatV0({
      region: "US",
      coherence_id: "wrong_coherence",
      jitter_ms: 5,
      atMs: Date.now()
    });
    reportScrRegionHeartbeatV0({
      region: "TR",
      coherence_id: window.__rhizoh.presenceFrame.coherenceId,
      jitter_ms: 90,
      atMs: Date.now() - 10
    });
    const mesh = publishScrDistributedMeshV0();
    expect(mesh.syncMode.type).toBe(SCR_SYNC_MODE_V0.type);
    expect(mesh.single_t0_rule).toBe("only_one_t0_exists_globally");
    expect(mesh.global_t0?.coherence_id).toBe(window.__rhizoh.presenceFrame.coherenceId);
  });

  it("primeWorldExpansionLayerV0 runs full evolution stack", async () => {
    await runStudioTickV0(1_700_001_040_000);
    const report = await primeWorldExpansionLayerV0();
    expect(report.ok).toBe(true);
    expect(report.steps.length).toBe(5);
    expect(window.__rhizoh.petEvolution).toBeDefined();
    expect(window.__rhizoh.castleGraph).toBeDefined();
    expect(window.__rhizoh.worldExpansionLayer?.version).toBe("0.1");
  });

  it("foldPetMemoryTraceV0 deduplicates castle visits", () => {
    let trace = foldPetMemoryTraceV0({ castle_node_id: "c1", interaction_weight: 0.1 });
    trace = foldPetMemoryTraceV0({ castle_node_id: "c1", interaction_weight: 0.2 }, trace);
    expect(trace.visited_castles).toEqual(["c1"]);
    expect(trace.interaction_weight.length).toBe(2);
  });
});
