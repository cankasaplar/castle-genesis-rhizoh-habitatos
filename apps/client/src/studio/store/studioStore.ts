/**
 * Public RSK store API — composed from slices.
 */

export {
  createInitialStudioKernelState,
  defaultCausalEconomy,
  defaultPresence,
  defaultMeta,
  defaultRuntime,
  defaultSimulation,
  emptyIdentity,
  emptyRegistry
} from "./initialState.js";

export {
  getStudioKernelState,
  setStudioKernelState,
  resetStudioKernelInternal,
  subscribeStudioKernel,
  subscribeStudioKernelSelector
} from "./internalStore.js";

export {
  patchIdentity,
  updateAvatarIdentity,
  updateCompanionIdentity,
  updateGhostPetIdentity,
  appendJournalClip,
  grantVaultUnlock
} from "./identitySlice";
export {
  identityCausalUpdateAvatar,
  identityCausalUpdateCompanion,
  identityCausalUpdateGhostPet,
  identityCausalUpdateSignature,
  identityCausalUnlockVault,
  identityCausalJournalAppend,
  setIdentityMeshPublishEnabled,
  registerIdentityMeshPublisher
} from "./identityCausalSlice";
export { patchSimulation, setSimulationDiff } from "./simulationSlice";
export {
  patchRuntime,
  setActiveBranchId,
  setActiveMind,
  setActiveSoul,
  setCurrentPanel,
  setSelectedEntity,
  setShellMode
} from "./runtimeSlice.js";

export {
  attachMind,
  attachMindToEntity,
  DEFAULT_MIND_ALIGNMENT,
  DEFAULT_MIND_LIFECYCLE,
  linkMind,
  linkMindToEntity,
  linkSoulToMind,
  registerEntity,
  registerGhost,
  registerGhostProfile,
  registerMemoryProfile,
  registerMind,
  registerMindDefinition,
  registerMindLink,
  registerPolicy,
  registerSoul,
  registerSoulMindBinding,
  registerTool,
  spawnMindInstance,
  upsertMindInstance,
  upsertSpiralNode
} from "./registrySlice.js";

export { patchIdentityFromAuth, refreshStudioSessionFromUser } from "../auth/patchIdentityFromAuth";
export { KernelGuard, KernelGuardRun, clearKernelAuditTrail, getKernelAuditTail } from "../runtime/kernelGuard";
export { identityAllowsAction, permissionKeyAllowsAction } from "../runtime/permissionResolver";
export { computeSoulContinuityHash } from "../lib/soulHash";
export { upgradeOntology } from "../lib/ontologyMigration";
export { bootstrapKernelRootIfNeeded, RSK_DEFAULT_SEED_UID } from "../lib/bootstrapKernelRoot";
export { useStudioKernel } from "../hooks/useStudioKernel";
export { tickMind, ensureMindRuntimeForInstance } from "./mindRuntimeSlice";
export { runShadow } from "../runtime/shadowEngine";
export { buildMindTickCausalNode, computeMindCausalNodeId } from "../runtime/mindCausalFactory";
export { appendCausalNode } from "../runtime/graphReducer";
export {
  ENTITY_CACHE_KEY,
  KERNEL_PROJECTION_RULE_CAUSAL_CLOSURE,
  projectEntity,
  projectEntityFromCausalGraph,
  applyPhysicsPatch,
  validateCausalChain,
  validateCausalStep,
  validateCausalClosureToGenesis
} from "../runtime/projectionReducer.js";
export {
  buildEntityGenesisCausalNode,
  buildEntityPhysicalMoveCausalNode,
  buildCollisionResolutionCausalNode
} from "../runtime/entityCausalFactory.js";
export { buildPresenceJoinCausalNode, buildAvatarEmoteCausalNode } from "../runtime/presenceCausalFactory";
export {
  getSpatialBucketId,
  getNeighborBucketIds,
  buildSpatialRegistryFromPositions,
  collectCandidateEntityUids,
  DEFAULT_SPATIAL_BUCKET_SIZE
} from "../runtime/spatialRegistry.js";
export { validateMoveIntent, DEFAULT_MOVE_BOUNDS } from "../runtime/physicsValidator";
export { applyEntityMoveIntent } from "./entityMoveSlice";
export type { ApplyEntityMoveIntentResult } from "./entityMoveSlice";
export { bindAvatarToEntity, emitAvatarEmote, applyAvatarMoveIntent } from "./presenceSlice";
export { moveAvatarInRoom, nudgeAvatarInHall, randomHallSpawn, PRESENCE_HALL_HALF } from "./presenceSpatialSlice";
export { transitionPresenceZone } from "./presenceZoneSlice";
export {
  assignPresenceRole,
  moderateKick,
  moderateMute,
  revokePresenceRole,
  stageInvite,
  stagePin
} from "./presenceRoleSlice.js";
export {
  ghostPetDepart,
  isGhostPetSummon,
  stablePetSlotUid,
  presenceWithSyncedPetTransforms,
  mergeGhostPetEmbodimentDriveIntoPresence
} from "./ghostPetOrbitSlice.js";
export {
  buildSpatialReadinessBridgeFromPresenceV0,
  mergeGhostPetEmbodimentDriveWithSpatialPresenceBridgeV0,
  SPATIAL_READINESS_BRIDGE_FROM_PRESENCE_SCHEMA_V0
} from "../lib/spatialReadinessBridgeFromPresenceV0";
export {
  registerSomaticExecutionCouplingHandlersV0,
  clearSomaticExecutionCouplingHandlersV0,
  tickSomaticExecutionCouplingV0,
  getSomaticExecutionCouplingTickStatsV0,
  SOMATIC_EXECUTION_COUPLING_LAYER_SCHEMA_V0
} from "../lib/somaticExecutionCouplingLayerV0";
export {
  MINIMUM_REAL_SIMULATION_KERNEL_REGISTRATION_SCHEMA_V0,
  registerMinimumRealSimulationKernelHandlersV0
} from "../lib/minimumRealSimulationKernelRegistrationV0";
export type { MinimumRealSimulationKernelEnginesV0 } from "../lib/minimumRealSimulationKernelRegistrationV0";
export {
  REAL_SIMULATION_ENGINE_COUPLING_SCHEMA_V0,
  installRealSimulationEngineCouplingV0,
  uninstallRealSimulationEngineCouplingV0,
  getRealSimulationEngineDebugV0,
  applyRealSimulationRewindV0,
  getPredictedPetXZForSlotV0,
  setRealSimulationDiscObstaclesV0
} from "../lib/realSimulationEngineCouplingV0";
export type { RealSimulationEngineCouplingOptionsV0 } from "../lib/realSimulationEngineCouplingV0";
export {
  rhizohCompanionDepart,
  stableRhizohCompanionUid,
  stableAtlasCompanionUid,
  stableGhostCompanionUid,
  isRhizohCompanionInvoke,
  isAtlasCompanionInvoke,
  isGhostCompanionInvoke,
  resolveCompanionArchetypeFromInvoke,
  companionAppendArchetypeChain
} from "./rhizohCompanionSlice.js";
export {
  listCompanionArchetypeDefinitionsV1,
  getCompanionArchetypeDefinitionV1
} from "../runtime/companionAgentRegistryV1.js";
export {
  getVoiceStubSegmentsForRoom,
  presenceAvatarAgentInvoke,
  presenceAvatarPetSummon,
  presenceAvatarRaiseHand,
  presenceAvatarReact,
  presenceAvatarSpeakStart,
  presenceAvatarSpeakStop
} from "./presenceProtocolSlice.js";
export {
  createPresenceRoom,
  joinPresenceRoom,
  leavePresenceRoom,
  createBroadcastChannel,
  joinBroadcastChannel,
  leaveBroadcastChannel
} from "./roomBroadcastSlice.js";
export { deriveAttentionField } from "../lib/deriveAttentionField";
export {
  deriveAttentionRenderPack,
  deriveRenderBiasField,
  deriveRenderBiasFromAttention
} from "../lib/deriveRenderBiasField.js";
export { derivePropagatedRenderBiasField, propagateRenderBiasField } from "../lib/propagateRenderBiasField";
export {
  collectRoomsForCrossRoomStitch,
  computeBroadcastEchoByRoom,
  computeCrossRoomLeaks,
  mergeEchoAndLeakIntoBias,
  stitchCrossRoomBiasMap
} from "../lib/crossRoomFieldStitch.js";
export {
  patchPresenceWithBroadcastFold,
  broadcastLifecycleStart,
  broadcastLifecyclePause,
  broadcastLifecycleResume,
  broadcastLifecycleStop,
  broadcastSegmentOpen,
  broadcastSegmentClose,
  broadcastSpotlightAssign,
  broadcastSpotlightRelease,
  broadcastCameraFocus,
  broadcastCameraFollow,
  broadcastCameraCut,
  broadcastOverlayPush,
  broadcastOverlayRemove,
  broadcastAudienceWave,
  broadcastAudienceApplause,
  broadcastAudienceCheer,
  broadcastAudienceEmojiRain,
  broadcastClipMark,
  broadcastSceneSet
} from "./broadcastDirectorSlice.js";
export { patchCausalEconomy } from "./economySlice";
export { ingestPresenceMeshDelta } from "./presenceMeshIngestSlice";
export { PresenceMeshClient, resolvePresenceMeshHttpBase } from "../runtime/presenceMeshClient";
export { startGreenRoomPresenceMesh } from "../runtime/greenRoomPresenceMesh";
export {
  getInfluenceTrace,
  resetInfluenceTrace,
  type InfluenceTraceEntry
} from "../runtime/influenceTraceRegistry";
export { validateInfluenceReplayDeterminism } from "../runtime/identityInfluenceRouter";
export {
  bindPresenceRoomToRegion,
  patchRegionChunkRuntime,
  patchRegionEcology,
  resolveWorldRoute,
  upsertWorldPortal,
  upsertWorldRegion
} from "./worldTopologySlice.js";
export { patchSocietyEconomy } from "./societyEconomySlice";
export { startRhizohAgentRuntime, stopRhizohAgentRuntime } from "../runtime/agentRuntimeLoop";
export { ensureCastleWorldTopology } from "../lib/bootstrapWorldTopology";
export { applyWorldLocomotionAfterAvatarMove, pickRegionUidAtWorldPosition } from "./worldLocomotionSlice";
export {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateEconomyForNodeType,
  estimateShadowPackCharge,
  withEconomyPayload
} from "../runtime/causalEconomy.js";
export {
  buildRhizohMemoryContextPack,
  type BuildRhizohMemoryContextPackOptions
} from "../runtime/contextBuilder.js";
export {
  scoreRhizohSalience,
  withSalience,
  buildRhizohMemoryContextPackWithSalience,
  biasSalienceFromAttentionFocus
} from "../runtime/salienceScorer.js";
export { composeRhizohLlmPrompt, type RhizohLlmPromptBundleV0 } from "../runtime/promptComposer";
export { parseAgentBridgeResponse, type AgentBridgeParseResult } from "../runtime/agentBridge";
export {
  runRhizohAgentTurn,
  RHIZOH_TURN_MAX_INTENTS_DEFAULT,
  RHIZOH_TURN_MIN_CONFIDENCE_DEFAULT,
  type RhizohTurnRunnerOptions,
  type RhizohTurnRunnerResult
} from "../runtime/rhizohTurnRunner.js";
export {
  invokeRhizohCognitiveTurn,
  type RhizohCognitiveInvokeOptions,
  type RhizohCognitiveInvokeResult
} from "../runtime/rhizohCognitiveInvoke.js";
export { scheduleGreenRoomMeshCausalPublish } from "../runtime/greenRoomPresenceMesh";

import {
  getStudioKernelState,
  resetStudioKernelInternal,
  subscribeStudioKernel
} from "./internalStore.js";

export function getRhizohStudioKernelSnapshot() {
  return getStudioKernelState();
}

export function subscribeRhizohStudioKernel(fn: () => void) {
  return subscribeStudioKernel(fn);
}

export function resetRhizohStudioKernelStore() {
  resetStudioKernelInternal();
}
