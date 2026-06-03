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
import { resetRhizohProductionRhythmStressForTestV0 } from "../rhizohProductionRhythmStressTestV0.js";
import { resetRhizohProductionDeploymentRunbookForTestV0 } from "../rhizohProductionDeploymentRunbookV0.js";
import {
  createInMemoryWorldWalIdbBackendV0,
  __setWorldWalIdbBackendForTestV0,
  __resetWorldWalIdbForTestV0
} from "../rhizohWorldActionLogIdbV0.js";
import { bootstrapWorldV0, initScrv0 } from "../rhizohWorldBootstrapV0.js";
import { refreshIdentityConsistencyForDeployGateV0 } from "../rhizohProductionDeploymentRunbookV0.js";
import { runProductionRhythmStressTestV0 } from "../rhizohProductionRhythmStressTestV0.js";

function resetBootStackV0() {
  resetRhizohProductionDeploymentRunbookForTestV0();
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

describe("rhizohWorldBootstrapV0", () => {
  beforeEach(resetBootStackV0);

  it("bootstraps world with skipGates and publishes worldBootStatus", async () => {
    const status = await bootstrapWorldV0({ skipGates: true, nowMs: 1_700_000_500_000 });
    expect(status.ok).toBe(true);
    expect(status.mode).toBe("production_world");
    expect(window.__rhizoh.worldBootStatus?.ok).toBe(true);
    expect(window.__rhizoh.scr?.stable).toBe(true);
    expect(window.__rhizoh.studioLoop?.ok).toBe(true);
    expect(window.__rhizoh.petCitizen?.inhabited).toBe(true);
  });

  it("initScrv0 publishes SCR stable slice", () => {
    const scr = initScrv0(1_700_000_501_000);
    expect(scr.frame.coherenceId).toBeTruthy();
    expect(window.__rhizoh.scr?.stable).toBe(true);
  });

  it("bootstraps after rhythm stress + ICL prime", async () => {
    runProductionRhythmStressTestV0({ ticks: 32, startMs: 1_700_000_502_000 });
    await refreshIdentityConsistencyForDeployGateV0();
    const status = await bootstrapWorldV0({ skipGates: true, nowMs: 1_700_000_503_000 });
    expect(status.ok).toBe(true);
  });
});
