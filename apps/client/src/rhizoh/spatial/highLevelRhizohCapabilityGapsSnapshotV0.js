/**
 * SPECFLOW: RESEARCH-ONLY — **High-level capability gap snapshot** (toy aşaması sonrası eksikler).
 * Tek JSON: spatial binding, multi-agent ecology, studio autonomy, somatic runtime — UI / debug / planlama.
 */

import { summarizeGhostPetLookAtPipelineV0 } from "./ghostPetLookAtSolverStubV0.js";
import { summarizeLocomotionFsmGapsV0 } from "./ghostPetLocomotionFsmStubV0.js";
import { summarizeObstacleAwarenessGapsV0 } from "./obstacleAwarenessStubV0.js";
import { summarizeMultiPetEcologyRoadmapV0 } from "./ghostPetMultiPetSocialPhysicsStubV0.js";

export const HIGH_LEVEL_RHIZOH_CAPABILITY_GAPS_SNAPSHOT_SCHEMA_V0 = "castle.rhizoh.high_level_capability_gaps_snapshot.v0";

/**
 * @param {{
 *   spatialBindingReadiness?: Record<string, unknown>|null,
 *   ghostPetEmbodimentDrive?: Record<string, unknown>|null
 * }|null|undefined} ctx
 */
export function buildHighLevelRhizohCapabilityGapsSnapshotV0(ctx) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const spatial = c.spatialBindingReadiness && typeof c.spatialBindingReadiness === "object" ? c.spatialBindingReadiness : null;
  const drive = c.ghostPetEmbodimentDrive && typeof c.ghostPetEmbodimentDrive === "object" ? c.ghostPetEmbodimentDrive : null;
  const symbolic = !!(drive && String(drive.schema || "").includes("ghost_pet_social_embodiment_drive"));

  return {
    schema: HIGH_LEVEL_RHIZOH_CAPABILITY_GAPS_SNAPSHOT_SCHEMA_V0,
    ts: Date.now(),
    realWorldSpatialBinding: {
      symbolicYawOrOrbitHints: symbolic,
      worldSpaceLookAt: false,
      worldSpaceNavigation: false,
      obstacleAwareness: false,
      roomGeometryBound: !!(spatial && spatial.hasRoomBounds),
      readiness01: spatial != null && Number.isFinite(Number(spatial.readiness01)) ? Number(spatial.readiness01) : 0,
      missingFromSpatialReadiness: Array.isArray(spatial?.missing) ? spatial.missing : null
    },
    persistentMultiAgentEcology: {
      globalCoherenceKernel: true,
      federationIdentityHints: true,
      prometheusLiveOperatorMesh: false,
      independentLongRunningAgentEcology: false,
      note: "Coherence + bleed law exist; Prometheus / foreign operator agents not wired as first-class ecology nodes."
    },
    studioAutonomy: {
      intentHintsFeedbackAnalytics: true,
      autonomousDirectorClipPipeline: false,
      sceneOrchestration: false,
      publishingIntelligence: false,
      note: "Director intent stub + YouTube feedback loop; no clip/scene/publish motor binding."
    },
    fullSomaticRuntime: {
      expressiveGhostPetDrive: symbolic,
      locomotionStateMachine: false,
      realPathing: false,
      gazeSolverWorld: false,
      animationBlending: false,
      petToPetFlocking: false,
      spatialMemory: false,
      note: "Locomotion hints + motion style envelope only; no FSM tick, pathing, or skeletal layer.",
      somaticRoadmapV0: {
        lookAt: summarizeGhostPetLookAtPipelineV0(),
        locomotionFsm: summarizeLocomotionFsmGapsV0(drive?.locomotionHint),
        obstacleAwareness: summarizeObstacleAwarenessGapsV0(
          Array.isArray(spatial?.missing) ? /** @type {string[]} */ (spatial.missing) : null
        ),
        multiPetEcology: summarizeMultiPetEcologyRoadmapV0()
      }
    }
  };
}
