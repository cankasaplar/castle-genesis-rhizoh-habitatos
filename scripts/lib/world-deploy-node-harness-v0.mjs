/**
 * Node harness for world deploy scripts (vitest-free window bootstrap).
 */
import { createInMemoryWorldWalIdbBackendV0, __setWorldWalIdbBackendForTestV0, __resetWorldWalIdbForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohWorldActionLogIdbV0.js";
import { resetRhizohStudioExecutionLoopForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohStudioExecutionLoopV0.js";
import { resetRhizohWorldActionLogForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohWorldActionLogV0.js";
import { resetRhizohArtifactRegistryForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohArtifactRegistryV0.js";
import { resetRhizohSurfaceBindingsForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohSurfaceBindingLayerV0.js";
import { resetRhizohSurfaceSingularityForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohSurfaceSingularityLayerV0.js";
import { resetRhizohSurfaceCitizenshipForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohSurfaceCitizenshipRuntimeV0.js";
import { resetRhizohStudioOutputPackForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohStudioOutputPackV0.js";
import { resetRhizohPetCitizenForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohPetCitizenRuntimeV0.js";
import { resetRhizohStudioProductionOrganismForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohStudioProductionOrganismV0.js";
import { resetRhizohCastleProjectionForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohCastleProjectionLayerV0.js";
import { resetRhizohCoPresenceForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohMultiInhabitantCoPresenceV0.js";
import { resetRhizohStudioCastleMappingForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohStudioCastleMappingV0.js";
import { resetRhizohCastleCoherenceHardeningForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohCastleCoherenceHardeningV0.js";
import { resetRhizohAgentCognitionBoundaryForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohAgentCognitionBoundaryV0.js";
import { resetRhizohStudioPerceptualLockForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohStudioPerceptualLockV0.js";
import { resetRhizohOrganismStabilizationForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohOrganismStabilizationV0.js";
import { resetRhizohPerceptualContinuitySmoothingForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohPerceptualContinuitySmoothingV0.js";
import { resetRhizohIdentityConsistencyLayerForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohIdentityConsistencyLayerV0.js";
import { resetRhizohWorldWalPersistenceForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohWorldWalPersistenceV0.js";
import { resetRhizohProductionRhythmStressForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohProductionRhythmStressTestV0.js";
import { resetRhizohProductionDeploymentRunbookForTestV0 } from "../../apps/client/src/rhizoh/runtime/rhizohProductionDeploymentRunbookV0.js";

export function resetWorldDeployHarnessV0() {
  globalThis.window = { __rhizoh: {} };
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
}

export function ensureWorldDeployWindowV0() {
  if (typeof globalThis.window === "undefined" || !globalThis.window.__rhizoh) {
    resetWorldDeployHarnessV0();
  }
  return globalThis.window;
}
