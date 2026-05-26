/**
 * Live runtime streaming core (v0) — single import surface for the atmosphere chain.
 *
 * Pipeline (ACTIVE / EFFECTOR):
 * `worldPresenceStoreV0` (weather cache) → `worldPresenceRuntimeV0` (state) →
 * `sceneProjectionAdapterV0` (hints + DOM CSS) → `liveRuntimeOrchestratorV0` (tick + smoothing) →
 * optional Cesium / map **projection consumer** + legacy `requestRender` sink → Castle presence surface (`data-rhizoh-atmosphere-castle-surface`).
 *
 * @see docs/LIVE_RUNTIME_STREAMING_CORE_V0.md
 */

export { refreshWeatherAtmosphereFeedIfStaleV0, getCachedWeatherAtmosphereFeedV0 } from "./worldPresenceStoreV0.js";
export { buildWorldPresenceStateV0 } from "./worldPresenceRuntimeV0.js";
export {
  deriveProjectionHintsV0,
  applyProjectionHintsToHostV0,
  applyProjectionHintsToCastleAuraSurfaceV0
} from "./sceneProjectionAdapterV0.js";
export {
  LIVE_RUNTIME_ORCHESTRATOR_DEFAULT_TICK_MS,
  runLiveRuntimeOrchestratorTickV0,
  startLiveRuntimeOrchestratorV0,
  registerLiveRuntimeCesiumRenderSinkV0,
  unregisterLiveRuntimeCesiumRenderSinkV0,
  registerLiveRuntimeProjectionConsumerV0,
  unregisterLiveRuntimeProjectionConsumerV0,
  clearLiveRuntimeOrchestratorProjectionStateV0
} from "./liveRuntimeOrchestratorV0.js";
export {
  LIVE_RUNTIME_TEMPORAL_SCHEMA_V0,
  clampLiveRuntimeOrchestratorIntervalMsV0,
  getLiveRuntimeTemporalSnapshotV0,
  getLiveRuntimeRenderSyncHintsV0
} from "./liveRuntimeTemporalLockV0.js";

export {
  runRhizohLivingLoopTickV0,
  startRhizohLivingLoopOrchestratorV0,
  getRhizohLivingLoopSnapshotV0,
  RHIZOH_LIVING_LOOP_ORCHESTRATOR_SCHEMA_V0
} from "./rhizohLivingLoopOrchestratorV0.js";

export const LIVE_RUNTIME_STREAMING_CORE_SCHEMA_V0 = "liveRuntimeStreamingCore.v0";
