import { describe, it, expect, beforeEach } from "vitest";
import { resetRhizohStudioExecutionLoopForTestV0 } from "../rhizohStudioExecutionLoopV0.js";
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
import { resetRhizohPerceptualContinuitySmoothingForTestV0 } from "../rhizohPerceptualContinuitySmoothingV0.js";
import { resetRhizohIdentityConsistencyLayerForTestV0 } from "../rhizohIdentityConsistencyLayerV0.js";
import { resetRhizohWorldWalPersistenceForTestV0 } from "../rhizohWorldWalPersistenceV0.js";
import {
  createInMemoryWorldWalIdbBackendV0,
  __setWorldWalIdbBackendForTestV0,
  __resetWorldWalIdbForTestV0
} from "../rhizohWorldActionLogIdbV0.js";
import {
  runProductionRhythmStressTestV0,
  resetRhizohProductionRhythmStressForTestV0
} from "../rhizohProductionRhythmStressTestV0.js";

function resetStressStackV0() {
  __resetWorldWalIdbForTestV0();
  __setWorldWalIdbBackendForTestV0(createInMemoryWorldWalIdbBackendV0());
  resetRhizohProductionRhythmStressForTestV0();
  resetRhizohOrganismStabilizationForTestV0();
  resetRhizohPerceptualContinuitySmoothingForTestV0();
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
  window.__rhizoh = {};
}

describe("rhizohProductionRhythmStressTestV0", () => {
  beforeEach(resetStressStackV0);

  it("passes compressed load sim with jitter graph and drift trace", () => {
    const report = runProductionRhythmStressTestV0({ ticks: 48, startMs: 1_700_000_300_000 });

    expect(report.ticks).toBe(48);
    expect(report.jitter_graph.length).toBeGreaterThan(0);
    expect(report.drift_trace.length).toBeGreaterThan(0);
    expect(report.summary.studio_ok_rate).toBeGreaterThanOrEqual(0.99);
    expect(report.gate.jitter_p95_ok).toBe(true);
    expect(report.deploy_ready).toBe(true);
    expect(window.__rhizoh.deployRhythmGate?.ok).toBe(true);
  });

  it("records pet motion continuity under stress", () => {
    const report = runProductionRhythmStressTestV0({ ticks: 32, startMs: 1_700_000_310_000 });
    expect(report.summary.pet_lock_rate).toBeGreaterThanOrEqual(0.99);
    expect(report.pet_continuity.length).toBeGreaterThan(0);
  });
});
