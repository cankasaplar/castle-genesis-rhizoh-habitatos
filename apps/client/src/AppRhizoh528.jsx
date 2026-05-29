import React, { useState, useRef, useEffect, useLayoutEffect, useSyncExternalStore, useCallback, useMemo, memo, useReducer } from "react";
import { useLocation, useNavigate, matchPath, Link } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Globe,
  Atom,
  ShieldAlert,
  Satellite,
  Target,
  Layers,
  Info,
  Mic,
  Send,
  Map as MapIcon,
  Orbit,
  Activity,
  Network,
  GraduationCap,
  Cpu,
  Camera,
  Navigation2,
  Shield,
  MapPin,
  Trash2,
  Power,
  Users,
  Radio,
  BookOpen,
  Video,
  PlayCircle,
  FastForward,
  Share2,
  MessageCircle,
  Hash,
  Handshake
} from "lucide-react";
import SovereignRuntimePanel from "./sovereign/SovereignRuntimePanel.jsx";
import { sovereignRuntimeSingleton } from "./sovereign/sovereignRuntimeSpec.js";
import { ISTANBUL_GEO, ISTANBUL_POI, latLonToSceneXZ, sceneXZToLatLon } from "./castleFlight/geo.js";
import { getCastleFlightConfig } from "./castleFlight/castleFlightConfig.js";
import { DroneFlightBridge } from "./castleFlight/DroneFlightBridge.js";
import "./castleFlight/registerGlobals.js";
import { installWebglContextLostReporter } from "./boot/castleCrashTelemetry.js";
import {
  configureRealityDirector,
  notifyRealityEngineReady,
  reconcileMapSurfaceFromGateway,
  setRealityMode,
  enqueueApexCameraAfterCesiumIfNeeded
} from "./reality/realityDirector.js";
import { computeMapSurfaceActive } from "./reality/realityEngineSurface.js";
import CastleFlightHud from "./castleFlight/CastleFlightHud.jsx";
import CesiumRealMapLayer from "./castleFlight/CesiumRealMapLayer.jsx";
import { useCastleAuth } from "./firebase/useCastleAuth.js";
import { useCastleActiveCastles } from "./firebase/useCastleActiveCastles.js";
import { CastleAuthOverlay, CastleAccountBadge } from "./auth/CastleAuthOverlay.jsx";
import { patchIdentityFromAuth } from "./studio/auth/patchIdentityFromAuth";
import { DirectorDeckPanel } from "./studio/ui/DirectorDeckPanel";
import { KernelConsolePanel } from "./studio/ui/KernelConsolePanel";
import { WorldLivingMapPanel } from "./studio/ui/WorldLivingMapPanel";
import { UnifiedProductShellBar } from "./studio/ui/UnifiedProductShellBar";
import { ProductProfilePanel } from "./studio/ui/ProductProfilePanel";
import { RuntimeHealthPanel } from "./studio/ui/RuntimeHealthPanel";
import { CASTLE_RUNTIME_VERSION } from "./studio/runtime/castleRuntimeVersion";
import { createCastleUlid, stableJitterFromId } from "./kernel/castleIds.js";
import { worldToSpatialBucket } from "./kernel/spatialMorton.js";
import { KnowledgeGraphSubstrate, KG_NODE, KG_EDGE } from "./kernel/knowledgeGraphSubstrate.js";
import { ChronosScheduler, CapabilityToken } from "./kernel/sovereignChronos.js";
import { verifyTwistCommand } from "./kernel/roboticsClosedLoop.js";
import {
  buildThoughtChainL8V1,
  buildPulseSeriesFromSeed,
  CASTLE_L9_SOCIAL_EVENT
} from "./kernel/castleL9EventMeshV1.js";
import {
  pushL9SocialDraftArbitrated,
  resetL9EventBus,
  configureL9ExecutionGate,
  flushL9ExecutionHoldQueue
} from "./kernel/castleL9EventBusV2.js";
import { recordCastleRuntimeFrame } from "./kernel/castleRuntimeMetrics.js";
import { getL9BackgroundTickStride } from "./kernel/castleL9GatePolicy.js";
import { CASTLE_L9_EXECUTION_FEEDBACK } from "./kernel/castleL9ExecutionFeedback.js";
import { warmSwarmGpu, createRhizohAutonomousCompanyRuntimeV0 } from "./kernel/swarmGpuBridge.js";
import { composeRhizohVisualCognitionStateV1 } from "./kernel/visual/RhizohVisualCognitionComposerV1.js";
import { composeRelationalPresenceStateV1 } from "./kernel/visual/RelationalPresenceComposerV1.js";
import { computeRhizohCinematicOutputV1, resolveAdaptiveIntroRouteV1 } from "./kernel/visual/RhizohCinematicOrchestratorV1.js";
import { resolveRhizohFirstName } from "./kernel/rhizohDisplayName.js";
import {
  buildRhizohFirstTouchEpistemicBody,
  buildRhizohFirstTouchEpistemicArtifact
} from "./kernel/rhizohWelcomeEpistemicV1.js";
import { buildBootObservationProvenance } from "./kernel/rhizohScenarioPhaseReadoutV1.js";
import {
  hydrateIdentityGraphFromSignals,
  buildIdentityNarrativeForLlm,
  readIdentityGraph,
  writeIdentityGraph,
  touchIdentitySessionOnce,
  buildRhizohWelcomeNarrativeTr
} from "./kernel/rhizohIdentityKernelV1.js";
import { computeLaunchSceneDirectorOverlayV1 } from "./kernel/visual/RhizohLaunchSceneDirectorV1.js";
import { RhizohCapabilityHaloV1 } from "./components/RhizohCapabilityHaloV1.jsx";
import { CASTLE_RHIZOH_KERNEL_DRAWER_HREF } from "./kernel/visual/rhizohCapabilityHaloConfigV1.js";
import { ensureGreenRoomMainHallBound } from "./studio/lib/greenRoomRouteBinding";
import { startGreenRoomPresenceMesh } from "./studio/runtime/greenRoomPresenceMesh";
import { ensureCastleWorldTopology } from "./studio/lib/bootstrapWorldTopology";
import { startRhizohAgentRuntime } from "./studio/runtime/agentRuntimeLoop";
import { RhizohGatewayBanner } from "./components/RhizohGatewayBanner.jsx";
import { RhizohWorldContinuityStrip } from "./components/RhizohWorldContinuityStrip.jsx";
import { RhizohCohortInspectStrip } from "./components/RhizohCohortInspectStrip.jsx";
import { SwarmCollectiveAuraV1 } from "./components/SwarmCollectiveAuraV1.jsx";
import { RhizohPresenceField } from "./components/RhizohPresenceField.jsx";
import { RhizohGroupPresenceField } from "./components/RhizohGroupPresenceField.jsx";
import {
  normalizeRhizohOutput,
  materializeCommsFromNormalized,
  emitRhizohPresence,
  stepPresenceFsm,
  initialPresenceFsmState,
  QPP_EVENT,
  QPP_PHASE,
  installRhizohPresenceAcoustics,
  deriveCognitiveTraceLabel
} from "./rhizoh/presence/index.js";
import { useRhizohGatewayMonitor, getRhizohApiBase } from "./rhizoh/useRhizohGatewayMonitor.js";
import { startGenesisContinuityClientWireV0 } from "./rhizoh/runtime/genesisContinuityClientWireV0.js";
import {
  maybePublishWorldTickObservationV0,
  publishAgentSpokeObservationV0
} from "./rhizoh/runtime/worldTickPublisherV0.js";
import {
  activateVoiceFallbackModeV0,
  clearVoiceSttRecoveryV0,
  ensureVoiceAdapterRegistered,
  getRhizohInputAdaptersV0,
  getVoiceAdapterRegistrySnapshot,
  recordVoiceSttErrorV0
} from "./rhizoh/runtime/voiceInputAdapterRegistryV0.js";
import {
  resolveCommandHintV0,
  resolveCommandPlaceholderV0,
  resolveFirstInteractionIntentsV0,
  shouldShowSemanticHintChipsV0,
  shouldShowVerboseCommandHintV0
} from "./rhizoh/experience/livingWorldFirstInteractionV0.js";
import {
  buildRhizohHealthState,
  computeRhizohHealthInfluence,
  blendRelationalToneWithHealthRecommended,
  adjustRelationalToneForHealthLatency,
  stepReliabilityEpisodesMeta,
  formatReliabilityEpisodesSummaryForLlm
} from "./rhizoh/reliability/index.js";
import { deriveRhizohPolicy } from "./rhizoh/policy/index.js";
import {
  advanceSocialField,
  advanceCastleSocialIdentity,
  createBrowserPresenceSignalRef,
  attachBrowserPresenceSensors,
  snapshotBrowserPresenceForCsil,
  castlePeersForSocial,
  formatCognitiveSubThreadsForPrompt
} from "./rhizoh/social/index.js";
import { rhizohGatewayPhaseShowsRetry } from "./rhizoh/gatewayPhaseUtils.js";
import {
  buildEpistemicTruthContract,
  CASTLE_RHIZOH_EPISTEMIC_SURFACE_EVENT,
  RhizohEpistemicOrb,
  RhizohEpistemicWorldGravity,
  sealRhizohEpistemicTrace,
  sha256HexUtf8
} from "./rhizoh/epistemic/index.js";
import { enqueueRhizohMessageIntent, drainRhizohMessageIntentQueue } from "./castleFlight/castleIntentQueue.js";
import { parseDSL, detectCastleIntentWithoutCoords } from "./kernel/rhizohCommandParser.js";
import {
  TCEE_PHASE,
  ensurePreBreathSeed,
  commitWakeSeal,
  revertTceeToPreBreath,
  CASTLE_FIELD_TICK_MS,
  castleFieldTickPlan,
  runCastleFieldPhysicsTick,
  runCastleFieldMemoryIdentityTick,
  runCastleFieldConsolidationTick,
  scheduleCastleFieldDeferredTask,
  createFieldTickBackpressure,
  withFieldPhysicsBackpressure,
  executionMetricsFromBackpressure,
  appendCastleTemporalLedgerEntry,
  buildPolicyLedgerEntryV0,
  getCastleTemporalLedgerSnapshot,
  getSuppressedRealityIndexForPromptV0,
  enqueueCastleRuntimeTransaction,
  peekCastleRuntimeTransactionQueueDepth,
  drainCastleRuntimeTransactionQueue,
  resolveCastleRuntimeTransactionBatch,
  buildRtqBatchLedgerEntryV0,
  withRuntimeMergeCommit,
  getLastRuntimeMergeId
} from "./rhizoh/boot/index.js";
import { registerClientContinuitySync, syncClientContinuityRef } from "./rhizoh/continuity/continuitySyncBridge.js";
import { KERNEL_SEAL_V1, CAPABILITY_MANIFEST_V1 } from "./rhizoh/contracts/index.js";
import L10Observatory from "./rhizoh/observatory/index.js";
import {
  pickPrimaryCognitiveThreadId,
  buildUserAgentGhostProjectionV1
} from "./rhizoh/agents/userAgentGhostProjectionV1.js";
import { normalizeArbitrationGovernorBuffer } from "./rhizoh/agents/arbitrationStabilityGovernorV1.js";
import {
  normalizeTemporalIntentDriftMemory,
  pushTemporalIntentSnapshot,
  buildTemporalIntentSnapshotFromStack,
  summarizeIntentDriftForPrompt,
  computeArbitrationReasonDrift
} from "./rhizoh/agents/temporalIntentDriftMemoryV1.js";
import { routeRhizohInput } from "./rhizoh/router/routeRhizohInput.js";
import {
  RHIZOH_CONVERSATION_ORCHESTRATOR_VERSION,
  advanceRhizohConversationPhase,
  buildRhizohConversationLlmDirective,
  buildRhizohProductCapabilityEnvelope,
  rhizohConversationPhaseShortLabelTr
} from "./rhizoh/product/rhizohConversationOrchestratorV1.js";
import {
  appendRhizohClosureMilestone,
  loadRhizohProductSession,
  readRhizohExplicitPowerUnlock,
  saveRhizohProductSession
} from "./rhizoh/product/rhizohProductSessionPersistenceV1.js";
import { emitRhizohProductDecisionSignal } from "./rhizoh/product/rhizohProductDecisionLayerV1.js";
import { finalizeRhizohProductOverlay } from "./rhizoh/product/rhizohProductPolicyLearningV1.js";
import {
  computeRhizohDecisionOverlayFingerprint,
  runRhizohDecisionFeedbackTick
} from "./rhizoh/product/rhizohDecisionEffectivenessV1.js";
import { getRhizohPolicyProductionInsight } from "./rhizoh/product/rhizohProductProductionTruthV1.js";
import {
  buildRhizohCapabilitySurfaceRows,
  buildRhizohConversationGoals,
  buildRhizohPhaseStory,
  buildRhizohPhaseClosure,
  inferRhizohUserGoalHint
} from "./rhizoh/experience/index.js";
import { RhizohExperienceRibbon } from "./components/RhizohExperienceRibbon.jsx";
import {
  applyEmotionDelta,
  applyRepairOutcome,
  deriveRelationalTone,
  readOutcomeSessionFromMeta,
  DEFAULT_EMOTIONS,
  normalizeEmotionState
} from "./rhizoh/emotion/index.js";
import {
  selectWeightedMemoryTurns,
  buildRhizohWeightedTurnRecord,
  appendRhizohWeightedTurn,
  buildMemoryEpisodesFromTurns,
  buildPhysicsPhaseImprint,
  classifyMemoryCrystallization,
  computeMemoryWeight,
  computeIdentityFeedbackFromRecall,
  applyRecallFeedbackToIdentityGraph,
  recallClosurePayloadForMeta
} from "./rhizoh/memory/index.js";
import {
  buildRhizohDriftLogEntry,
  emitRhizohBehaviorSignal,
  recordRhizohVisitAndEmitReturnSignals,
  buildRhizohTurnDepthSignal,
  startRhizohBehaviorMetricsAggregation,
  getRhizohBehaviorMetricsSnapshot
} from "./rhizoh/telemetry/index.js";
import {
  getRhizohStabilityAnchorSnapshot,
  normalizeGovernorCalibration,
  stepGovernorCalibrationFromDriftLog,
  softClampEmotionsToIdentityAnchor,
  clampRelationalToneToAnchor,
  applyMemoryDominanceCap,
  mergeRhizohNarrativeThread
} from "./rhizoh/stability/index.js";
import { advanceRhizohNarrativeArc } from "./rhizoh/narrative/index.js";

const CODEX_VERSION = "vNext-530.Kernel-Morton-ULID";
const CODEX_DATE = "2026-04-28";
const GLOBE_RADIUS = 3000;
const MAX_INSTANCES = 50000;

/** İstemci `options.maxTokens` — gateway `RHIZOH_GENERATION_MODES` ile aynı anahtarlar. */
const RHIZOH_GENERATION_MODE_MAX = {
  FAST_DIALOGUE: 120,
  STANDARD: 320,
  REFLECTIVE: 900,
  NARRATIVE: 1600,
  DEEP_REASONING: 2600
};

const RHIZOH_GENERATION_MODE_UI = [
  { id: "FAST_DIALOGUE", label: "Hızlı", sub: "Kısa cevap" },
  { id: "STANDARD", label: "Standart", sub: "Dengeli sohbet" },
  { id: "REFLECTIVE", label: "Yansıtıcı", sub: "Derin / ölçülü" },
  { id: "NARRATIVE", label: "Anlatı", sub: "Uzun hikâye" },
  { id: "DEEP_REASONING", label: "Akıl yürütme", sub: "Katmanlı düşünce" }
];

/** Voice loop — faster LLM + shorter watchdog so mic does not appear stuck. */
const VOICE_LLM_TIMEOUT_MS = 22_000;
const TEXT_LLM_TIMEOUT_MS = 32_000;
const VOICE_TURN_BUSY_WATCHDOG_MS = 38_000;
const VOICE_AFTER_TURN_RESTART_MS = 280;

function normalizeRhizohGenerationModeId(mode) {
  return String(mode || "STANDARD").trim().toUpperCase().replace(/-/g, "_");
}

/** L0–L13 + Rhizoh command plane (L13 = Robotics Mechanics bridge layer) */
const LAYER_SPECS = [
  { id: 0, code: "L0", name: "Core Physics" },
  { id: 1, code: "L1", name: "Spatial Hash" },
  { id: 2, code: "L2", name: "Agent Brain" },
  { id: 3, code: "L3", name: "MMO Presence Cloud" },
  { id: 4, code: "L4", name: "Satellite Layer" },
  { id: 5, code: "L5", name: "GreenRoom Live Stream" },
  { id: 6, code: "L6", name: "Swarm / Squad AI" },
  { id: 7, code: "L7", name: "Ghost Evolution" },
  { id: 8, code: "L8", name: "Procedural City Mind" },
  { id: 9, code: "L9", name: "Event Mesh" },
  { id: 10, code: "L10", name: "Rhizoh Command Layer" },
  { id: 11, code: "L11", name: "Castle Academics Core" },
  { id: 12, code: "L12", name: "Sovereign Runtime (META)" },
  { id: 13, code: "L13", name: "Robotics Mechanics Bridge" }
];

const LAYER_UI_PROFILES = {
  0: {
    mission: "Fizik stabilitesi ve tick senkronu",
    detail: "ECS hareketleri, damping, sabit adım simülasyon doğrulama",
    reality: "GLOBE",
    camera: "ORBIT",
    satellite: false,
    quickActions: ["SCAN CITY", "ACTIVATE SWARM"],
    widgets: ["stack", "rail", "camera", "events"],
    theme: { bg: "rgba(4, 22, 38, 0.8)", border: "#0ea5e9", text: "#67e8f9", accent: "#22d3ee" },
    flight: "globe-wide"
  },
  1: {
    mission: "Spatial hash yoğunluğu ve komsuluk taraması",
    detail: "Yakın ajan kümeleri ve grid tabanlı davranış etkilerini izle",
    reality: "GLOBE",
    camera: "DRONE",
    satellite: false,
    quickActions: ["ZOOM AGENT", "SUMMON SQUAD"],
    widgets: ["stack", "rail", "layerxp", "camera", "events"],
    theme: { bg: "rgba(15, 23, 42, 0.85)", border: "#22d3ee", text: "#bae6fd", accent: "#38bdf8" },
    flight: "agent"
  },
  2: {
    mission: "Agent beyin tipleri ve rol dengesi",
    detail: "Arketip bazlı davranış çeşitliliği ve görev dağılımı",
    reality: "GLOBE",
    camera: "DRONE",
    satellite: false,
    quickActions: ["CALL AGENTS", "ZOOM AGENT"],
    widgets: ["stack", "layerxp", "camera", "events", "rhizoh", "connections"],
    theme: { bg: "rgba(17, 24, 39, 0.86)", border: "#60a5fa", text: "#dbeafe", accent: "#93c5fd" },
    flight: "agent"
  },
  3: {
    mission: "MMO presence akışı ve canlı popülasyon",
    detail: "Eşzamanlı ajan yoğunluğu ve etkileşim sürekliliği",
    reality: "GLOBE",
    camera: "ORBIT",
    satellite: true,
    quickActions: ["SUMMON SQUAD", "ACTIVATE SWARM"],
    widgets: ["stack", "rail", "layerxp", "camera", "events"],
    theme: { bg: "rgba(31, 41, 55, 0.86)", border: "#06b6d4", text: "#cffafe", accent: "#22d3ee" },
    flight: "globe-wide"
  },
  4: {
    mission: "Uydu sinyal katmanı doğrulaması",
    detail: "Katmanlar arası tarama, feed ve telemetri görünürlüğü",
    reality: "REAL_MAP",
    camera: "ORBIT",
    satellite: true,
    quickActions: ["SATELLITE LINK", "SATELLITE SIGNAL"],
    widgets: ["stack", "layerxp", "camera", "flighthud", "events"],
    theme: { bg: "rgba(7, 23, 35, 0.86)", border: "#14b8a6", text: "#99f6e4", accent: "#2dd4bf" },
    flight: "istanbul-high"
  },
  5: {
    mission: "GreenRoom canlı yayın ve medya rezonansı",
    detail: "Canlı bağlantı, stream tetikleyicileri ve media köprüsü",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: false,
    quickActions: ["OPEN GREENROOM", "ENTER GREENROOM"],
    widgets: ["stack", "layerxp", "camera", "flighthud", "events", "studiomirror"],
    theme: { bg: "rgba(20, 12, 36, 0.86)", border: "#a78bfa", text: "#ede9fe", accent: "#c4b5fd" },
    flight: "istanbul-mid"
  },
  6: {
    mission: "Swarm/Squad formasyon davranışı",
    detail: "Squad intent ve yörünge ayrışmasının sahnede izlenmesi",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: false,
    quickActions: ["SUMMON SQUAD", "ACTIVATE SWARM"],
    widgets: ["stack", "rail", "layerxp", "camera", "flighthud", "events"],
    theme: { bg: "rgba(22, 18, 10, 0.86)", border: "#f59e0b", text: "#fde68a", accent: "#fbbf24" },
    flight: "agent"
  },
  7: {
    mission: "Ghost pet evrimi ve owner bağı",
    detail: "Pet progression, bağ gücü ve mikro sürü etkileri",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: false,
    quickActions: ["CALL PET", "ZOOM AGENT"],
    widgets: ["stack", "layerxp", "camera", "events", "rhizoh"],
    theme: { bg: "rgba(30, 10, 28, 0.86)", border: "#e879f9", text: "#f5d0fe", accent: "#f0abfc" },
    flight: "agent"
  },
  8: {
    mission: "Procedural city zihin katmanı",
    detail: "District enerji akışı, tower etkisi ve şehir dokusu",
    reality: "REAL_MAP",
    camera: "ORBIT",
    satellite: false,
    quickActions: ["SCAN CITY", "BUILD TOWER"],
    widgets: ["stack", "rail", "layerxp", "camera", "events", "academy", "intel"],
    theme: { bg: "rgba(10, 24, 20, 0.86)", border: "#34d399", text: "#a7f3d0", accent: "#6ee7b7" },
    flight: "istanbul-wide"
  },
  9: {
    mission: "Event mesh darbeleri ve neden-sonuç zinciri",
    detail: "Katmanlar arası event pulse izleme ve yoğunluk kontrolü",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: true,
    quickActions: ["RUN CURRICULUM", "EXAM MODE"],
    widgets: ["stack", "rail", "layerxp", "camera", "events", "academy", "identitylab", "academyroom", "continuity", "intel"],
    theme: { bg: "rgba(23, 11, 38, 0.86)", border: "#c084fc", text: "#e9d5ff", accent: "#d8b4fe" },
    flight: "istanbul-mid"
  },
  10: {
    mission: "Komut orkestrasyonu ve operasyon kontrolü",
    detail: "Rhizoh komut hattı ile gerçek zamanlı senaryo yönetimi",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: true,
    quickActions: ["SPAWN RHIZOH", "ZOOM CASTLE"],
    widgets: ["stack", "rail", "layerxp", "camera", "events", "rhizoh", "connections", "identitylab", "academyroom", "continuity", "intel"],
    theme: { bg: "rgba(28, 15, 12, 0.86)", border: "#fb7185", text: "#fecdd3", accent: "#fda4af" },
    flight: "rhizoh"
  },
  11: {
    mission: "Academics yaşam döngüsü ve mezuniyet",
    detail: "Curriculum, exam, graduation queue ve öğretici etkileşim",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: false,
    quickActions: ["RUN CURRICULUM", "EXAM MODE"],
    widgets: ["stack", "rail", "layerxp", "camera", "academy", "events", "rhizoh", "connections", "identitylab", "academyroom", "continuity", "intel"],
    theme: { bg: "rgba(15, 16, 41, 0.86)", border: "#818cf8", text: "#c7d2fe", accent: "#a5b4fc" },
    flight: "academy"
  },
  12: {
    mission: "META orchestrator ve sovereign registries",
    detail: "Boot sequence, Chronos clock ve manifest sağlığı",
    reality: "REAL_MAP",
    camera: "ORBIT",
    satellite: true,
    quickActions: ["SOVEREIGN BOOT", "META BOOT"],
    widgets: ["stack", "rail", "layerxp", "camera", "sovereign", "events", "rhizoh", "connections", "identitylab", "academyroom", "continuity", "intel"],
    theme: { bg: "rgba(9, 22, 35, 0.9)", border: "#22d3ee", text: "#e0f2fe", accent: "#67e8f9" },
    flight: "castle"
  },
  13: {
    mission: "Robotics-mechanics entegrasyonu ve live kontrol köprüsü",
    detail: "Kullanıcı robotik/drone sistemlerini Rhizoh Brain ile bağlar, komut-plan döngüsü üretir",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: true,
    quickActions: ["ZOOM AGENT", "ZOOM CASTLE"],
    widgets: ["stack", "rail", "layerxp", "camera", "rhizoh", "connections", "identitylab", "academyroom", "continuity", "intel", "studiomirror", "robotics"],
    theme: { bg: "rgba(8, 24, 18, 0.9)", border: "#34d399", text: "#d1fae5", accent: "#6ee7b7" },
    flight: "agent"
  }
};

const STATE = {
  DEAD: 0,
  CITIZEN: 1,
  PENDING: 2,
  GHOSTPET: 3,
  RHIZOH: 4,
  GUARDIAN: 5,
  SCOUT: 6,
  BUILDER: 7,
  SENTINEL: 8,
  AGENT_PROFESSOR: 9,
  AGENT_CADET: 10,
  AGENT_STUDENT: 11,
  AGENT_MASTER: 12
};
const PET_STAGE = { SEED: 0, BUD: 1, CRAWLER: 2, SPIRIT: 3, GUARDIAN: 4, MYTHIC: 5, CELESTIAL: 6 };

const ABILITY = {
  SCAN: 1 << 0,
  HEAL: 1 << 1,
  BUILD: 1 << 2,
  SUMMON: 1 << 3,
  COMMAND: 1 << 4,
  SATELLITE: 1 << 5,
  GREENROOM: 1 << 6,
  EVOLVE: 1 << 7,
  PORTAL: 1 << 8,
  SHIELD: 1 << 9,
  OVERMIND: 1 << 10,
  POSSESS: 1 << 11
};

/** District zoning (procedural city mind) — + Castle Academics */
const MAX_DISTRICTS = 128;
const DISTRICT = {
  CIVIC: 0,
  INDUSTRIAL: 1,
  GREENROOM: 2,
  ARCHIVE: 3,
  DEFENSE: 4,
  MARKET: 5,
  SANCTUARY: 6,
  ANOMALY: 7,
  ACADEMICS: 8,
  ACADEMY: 8
};

const DISTRICT_LABEL = ["civic", "industrial", "greenroom", "archive", "defense", "market", "sanctuary", "anomaly", "academics"];

const AGENT_ARCHETYPE = { NONE: 0, SCOUT: 1, GUARD: 2, HACKER: 3, BUILDER: 4, HEALER: 5, HUNTER: 6 };

const SQUAD_INTENT = { SCAN: 0, ATTACK: 1, DEFEND: 2, ESCORT: 3, HARVEST: 4, BUILD: 5, HEAL: 6, EXPLORE: 7 };

const SATELLITE_CHANNEL = ["VOICE", "MUSIC", "MEMORY", "DREAM", "SIGNAL", "STREAM"];

const HEATMAP_SIZE = 256;
const HEATMAP_LEN = HEATMAP_SIZE * HEATMAP_SIZE;

const YOUTUBE_LIVE_URL = "https://www.youtube.com/@CastleGenesis/live";

/** Boids / hayalet grid komşu üst sınırı (O(N·K) yerine sabit K). */
const BOID_NEIGHBOR_CAP = 22;
const BOID_COLLECT_CAP = 120;

function sampleLiveAgentProjection(limit = 20) {
  const rows = [];
  const cap = Math.min(coreWorld.activeCount, coreWorld.MAX);
  const seen = new Set();
  const push = (i) => {
    if (rows.length >= limit || seen.has(i)) return;
    seen.add(i);
    const s = coreWorld.state[i];
    if (s === 0) return;
    const id = String(coreWorld.indexToId[i] || `AGENT-${i}`);
    const { lat, lon } = sceneXZToLatLon(coreWorld.posX[i], coreWorld.posZ[i]);
    rows.push({
      id,
      idx: i,
      state: s,
      brainType: Number(coreWorld.brainType[i] || 0),
      level: Number(coreWorld.level[i] || 0),
      energy: Math.round(Number(coreWorld.energy[i] || 0)),
      x: Number(coreWorld.posX[i] || 0),
      y: Number(coreWorld.posY[i] || 0),
      z: Number(coreWorld.posZ[i] || 0),
      lat: Number(lat || 0),
      lon: Number(lon || 0)
    });
  };
  for (let i = 0; i < cap; i++) if (coreWorld.state[i] === STATE.RHIZOH) push(i);
  for (let i = 0; i < cap; i++) {
    const s = coreWorld.state[i];
    if (s === STATE.AGENT_PROFESSOR || s === STATE.AGENT_CADET || s === STATE.AGENT_STUDENT || s === STATE.AGENT_MASTER) push(i);
  }
  for (let i = 0; i < cap; i++) if (coreWorld.state[i] === STATE.GUARDIAN || coreWorld.state[i] === STATE.SCOUT) push(i);
  for (let i = 0; i < cap && rows.length < limit; i++) {
    if (coreWorld.state[i] === STATE.CITIZEN && coreWorld.brainType[i] > 0) push(i);
  }
  for (let i = 0; i < cap && rows.length < limit; i++) {
    if (coreWorld.state[i] === STATE.CITIZEN) push(i);
  }
  return rows;
}

function resolveHeroAvatar(row) {
  const s = row.state;
  const bt = row.brainType || 0;
  if (s === STATE.RHIZOH) return { key: "rhizoh", label: "Rhizoh Core" };
  const byBrain = {
    1: { key: "scout", label: "Scout" },
    2: { key: "curator", label: "Curator" },
    3: { key: "archivist", label: "Archivist" },
    4: { key: "builder", label: "Builder" },
    5: { key: "sentinel", label: "Sentinel" },
    6: { key: "navigator", label: "Navigator" }
  };
  if (byBrain[bt]) return byBrain[bt];
  if (s === STATE.AGENT_PROFESSOR) return { key: "broadcaster", label: "Broadcaster" };
  return { key: "hero", label: "Hero" };
}

function buildMemoryConstellationNodes(heat, maxNodes = 36) {
  const n = Math.max(0, Math.min(maxNodes, Math.floor(Number(heat || 0) * 1.5 + 8)));
  const base = ISTANBUL_POI.FATIH;
  const out = [];
  for (let k = 0; k < n; k++) {
    const t = (k / Math.max(1, n)) * Math.PI * 2;
    const r = 0.018 + (k % 7) * 0.004;
    out.push({
      lat: base.lat + Math.sin(t) * r,
      lon: base.lon + Math.cos(t * 1.07) * r,
      alt: 140 + (k % 5) * 35
    });
  }
  return out;
}

function getOrCreateCastleDevUid() {
  const key = "castle.dev.uid";
  let uid = "";
  try {
    uid = window.localStorage.getItem(key) || "";
    if (!uid) {
      uid = `u-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(key, uid);
    }
  } catch {
    uid = `u-${Math.random().toString(36).slice(2, 10)}`;
  }
  return uid;
}

function getRhizohDevFetchHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid(),
    ...extra
  };
}

function absolutizeRhizohAssetPath(maybePath) {
  const s = String(maybePath || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `${typeof window !== "undefined" ? window.location.protocol : "https:"}${s}`;
  if (typeof window === "undefined") return s;
  const origin = String(window.location.origin || "").replace(/\/$/, "");
  return `${origin}${s.startsWith("/") ? "" : "/"}${s}`;
}

function classifyMediaUrl(url) {
  const base = String(url || "").split(/[?#]/)[0].toLowerCase();
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(base)) return "audio";
  return "video";
}

/** Studio oturumları + transcript meta alanlarından oynatılabilir URL listesi üretir. */
function mergeMediaPlaylistFromGateway(sessions, transcripts) {
  const out = [];
  const seen = new Set();
  const push = (id, label, kind, url, origin) => {
    const u = String(url || "").trim();
    if (!/^https?:\/\//i.test(u) || seen.has(u)) return;
    seen.add(u);
    out.push({ id, label, kind: kind || classifyMediaUrl(u), url: u, origin });
  };
  for (const s of sessions || []) {
    const ingest = String(s?.ingestUrl || "").trim();
    if (ingest) push(`pub-${s.id}`, `${s.protocol || "PUB"} · ${String(s.target || s.status || "").slice(0, 28)}`, classifyMediaUrl(ingest), ingest, "publish");
  }
  for (const t of transcripts || []) {
    const m = t?.meta && typeof t.meta === "object" ? t.meta : {};
    const cand = [m.replayPath, m.sharePath, m.ingestUrl, m.playbackUrl, m.streamUrl].filter(Boolean);
    let k = 0;
    for (const p of cand) {
      const abs = absolutizeRhizohAssetPath(p);
      push(
        `trx-${t.id || "x"}-${k}`,
        `${t.eventType || "event"} · ${String(t.text || "").slice(0, 36)}`,
        classifyMediaUrl(abs),
        abs,
        "transcript"
      );
      k += 1;
    }
  }
  return out;
}

/** E1: GreenRoom capability — transcript + Castle Library memory commit (gateway). */
async function postGreenRoomCapability({ idToken, intentRaw, title, audienceEstimate, traceId, roomId }) {
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json" };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  else headers["X-Castle-Dev-Uid"] = getOrCreateCastleDevUid();
  const res = await fetch(`${apiBase}/studio/capabilities/greenroom`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      intentRaw,
      title,
      audienceEstimate,
      traceId,
      roomId: roomId || "greenroom-main"
    })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || "greenroom_route_failed");
  return json;
}

/** Simulated live field estimate (world telemetry, not external analytics). */
function computeSimulatedAudienceEstimate({ swarmBoost, activeHeroCount, memoryHeat }) {
  const s = swarmBoost ? 1 : 0;
  const h = Math.max(0, Math.min(22, Number(activeHeroCount) || 0));
  const mem = Math.max(0, Math.min(10, Number(memoryHeat) || 0));
  return Math.max(8, Math.floor(8 + s * 14 + h * 3 + mem * 6));
}

function audienceSignalLabel(watching) {
  const n = Number(watching) || 0;
  if (n >= 80) return "Peak";
  if (n >= 55) return "Strong";
  if (n >= 30) return "Moderate";
  return "Low";
}

function formatGreenRoomElapsed(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

const LIVE_FIELD_REACTIONS = [
  () => `+${2 + Math.floor(Math.random() * 4)} viewers joined`,
  () => "+3 viewers joined",
  () => "Signal spike detected",
  () => "Swarm cluster responded",
  () => "••• ripple echoes increased",
  () => "Field echo converging on anchor",
  () => "Memory plane acknowledged pulse"
];

function AudienceSparkline({ values }) {
  const w = 118;
  const h = 28;
  const pad = 3;
  if (!values?.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-6, max - min);
  const n1 = Math.max(1, values.length - 1);
  const pts = values
    .map((v, i) => {
      const x = pad + (i / n1) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="opacity-95" aria-hidden>
      <polyline fill="none" stroke="rgba(232,121,249,0.9)" strokeWidth="1.6" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function findAgentIdxForBroadcastName(name) {
  const want = String(name || "")
    .toLowerCase()
    .trim();
  if (!want) return -1;
  const n = Math.min(coreWorld.activeCount, coreWorld.MAX);
  for (let i = 0; i < n; i++) {
    const id = String(coreWorld.indexToId[i] || "").toLowerCase();
    if (id && (id.includes(want) || want.includes(id.replace(/\s/g, "")))) return i;
  }
  if (want.includes("prometheus") || want.includes("citymind")) {
    if (coreWorld.rhizohIdx >= 0) return coreWorld.rhizohIdx;
  }
  if (want.includes("atlas")) {
    for (let i = 0; i < n; i++) if (coreWorld.state[i] === STATE.GUARDIAN) return i;
  }
  return -1;
}

function BroadcastPulseSparkline({ values, tone = "cyan" }) {
  const w = 76;
  const h = 22;
  const pad = 2;
  if (!values?.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-6, max - min);
  const n1 = Math.max(1, values.length - 1);
  const stroke = tone === "fuchsia" ? "rgba(232,121,249,0.95)" : "rgba(34,211,238,0.88)";
  const pts = values
    .map((v, i) => {
      const x = pad + (i / n1) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="opacity-95 shrink-0" aria-hidden>
      <polyline fill="none" stroke={stroke} strokeWidth="1.35" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function readClientContinuity() {
  try {
    const raw = window.localStorage.getItem("rhizoh.continuity.v1") || "";
    if (!raw) return { turns: [], persona: {}, meta: {} };
    const parsed = JSON.parse(raw);
    return {
      turns: Array.isArray(parsed?.turns) ? parsed.turns.slice(-10) : [],
      persona: parsed?.persona && typeof parsed.persona === "object" ? parsed.persona : {},
      meta: parsed?.meta && typeof parsed.meta === "object" ? parsed.meta : {}
    };
  } catch {
    return { turns: [], persona: {}, meta: {} };
  }
}

function writeClientContinuity(next) {
  try {
    window.localStorage.setItem("rhizoh.continuity.v1", JSON.stringify(next));
  } catch {
    /* noop */
  }
}

function patchRhizohEmotionDisk(emotions, relationalTone, outcomeResonance, outcomeSession, driftLogEntry) {
  try {
    const disk = readClientContinuity();
    const meta = disk.meta && typeof disk.meta === "object" ? disk.meta : {};
    const nextMeta = {
      ...meta,
      rhizohEmotions: emotions,
      rhizohRelationalTone: relationalTone,
      rhizohEmotionUpdatedAt: Date.now()
    };
    if (typeof outcomeResonance === "number" && Number.isFinite(outcomeResonance)) {
      nextMeta.rhizohLastOutcomeResonance = Math.round(outcomeResonance * 1000) / 1000;
      nextMeta.rhizohLastOutcomeAt = Date.now();
    }
    if (outcomeSession && typeof outcomeSession === "object") {
      nextMeta.rhizohLastRemoteFetchFailed = !!outcomeSession.lastRemoteFetchFailed;
      nextMeta.rhizohConsecutiveLocalStubCount = Math.max(
        0,
        Math.min(24, Number(outcomeSession.consecutiveLocalStubCount) || 0)
      );
    }
    if (driftLogEntry && typeof driftLogEntry === "object") {
      const log = Array.isArray(nextMeta.rhizohDriftLog) ? nextMeta.rhizohDriftLog.slice(-31) : [];
      log.push({ ts: Date.now(), ...driftLogEntry });
      nextMeta.rhizohDriftLog = log;
      nextMeta.rhizohGovernorCalibration = stepGovernorCalibrationFromDriftLog(nextMeta);
      try {
        if (import.meta.env?.DEV) window.__CASTLE_RHIZOH_DRIFT_LOG__ = log.slice(-24);
      } catch {
        /* noop */
      }
    }
    writeClientContinuity({
      turns: Array.isArray(disk.turns) ? disk.turns : [],
      persona: disk.persona && typeof disk.persona === "object" ? disk.persona : {},
      meta: nextMeta
    });
  } catch {
    /* noop */
  }
}

function priorAssistantRepliesFromContinuity(cont) {
  const rt = Array.isArray(cont?.recentTurns) ? cont.recentTurns : [];
  return rt.map((x) => String(x?.assistant || "")).filter(Boolean).slice(-8);
}

function finalizeRhizohAfterLlm(
  preLlmEmotions,
  {
    rhizohRouter,
    reply,
    source,
    runtimeHints,
    gatewayUx,
    persistRhizohEmotions,
    outcomeSession,
    priorAssistantReplies
  }
) {
  const { emotions: emotionsRaw, resonance, outcomeSession: nextOutcomeSession } = applyRepairOutcome({
    router: rhizohRouter,
    llmResult: { reply, source },
    gatewayUx: gatewayUx && typeof gatewayUx === "object" ? gatewayUx : {},
    runtime: runtimeHints,
    previousEmotion: preLlmEmotions,
    outcomeSession,
    priorAssistantReplies
  });
  const tonePreOutcome = deriveRelationalTone(emotionsRaw);
  const govCalPost = normalizeGovernorCalibration(readClientContinuity().meta?.rhizohGovernorCalibration);
  const emotions = softClampEmotionsToIdentityAnchor(emotionsRaw, "postOutcome", govCalPost);
  const hsPost =
    runtimeHints && typeof runtimeHints === "object" && runtimeHints.healthState ? runtimeHints.healthState : null;
  const relationalTone = blendRelationalToneForHealth(emotions, hsPost);
  const emotionUpdatedAt = Date.now();
  const driftPost = buildRhizohDriftLogEntry({
    phase: "postOutcome",
    emotionsPre: emotionsRaw,
    emotionsPost: emotions,
    tonePre: tonePreOutcome,
    tonePost: relationalTone,
    intent: rhizohRouter?.intent,
    source,
    resonance
  });
  patchRhizohEmotionDisk(emotions, relationalTone, resonance, nextOutcomeSession, driftPost);
  if (typeof persistRhizohEmotions === "function") {
    try {
      persistRhizohEmotions({
        emotions,
        relationalTone,
        emotionUpdatedAt,
        outcomeResonance: resonance,
        outcomeSession: nextOutcomeSession
      });
    } catch {
      /* noop */
    }
  }
  return {
    emotions,
    relationalTone,
    outcomeResonance: resonance,
    emotionUpdatedAt,
    outcomeSession: nextOutcomeSession
  };
}

function blendRelationalToneForHealth(emotionSource, healthState) {
  const base = deriveRelationalTone(emotionSource);
  if (!healthState || typeof healthState !== "object") {
    return clampRelationalToneToAnchor(base);
  }
  return clampRelationalToneToAnchor(
    adjustRelationalToneForHealthLatency(
      blendRelationalToneWithHealthRecommended(base, healthState),
      healthState
    )
  );
}

/** LLM-friendly lines from meta.realityLog (disk may be ahead of continuityRef). */
function formatRecentRealityLines(meta, firstName) {
  const log = Array.isArray(meta?.realityLog) ? meta.realityLog : [];
  const who = (firstName && String(firstName).trim()) || "Sen";
  return log.slice(-12).map((e) => {
    if (e?.note) {
      return String(e.note).replace(/^Kullanıcı\b/, who);
    }
    const src = e?.source || "APP";
    const dm = Number.isFinite(e?.durationMs) ? ` (${e.durationMs}ms)` : "";
    if (e?.to === "REAL_MAP" && e?.from === "GLOBE") return `${who} ${src} ile REAL_MAP'e geçti${dm}`;
    if (e?.to === "GLOBE" && e?.from === "REAL_MAP") return `${who} ${src} ile GLOBE'a döndü${dm}`;
    return `${who} ${src}: ${e?.from} → ${e?.to}${dm}`;
  });
}

function normalizeGhostPetForLlm(meta) {
  const gp = meta?.ghostPet && typeof meta.ghostPet === "object" ? meta.ghostPet : {};
  const lastReal = gp.lastRealMapAt;
  return {
    mood: gp.mood ?? "neutral",
    curiosity: Number(gp.curiosity || 0),
    confused: Number(gp.confused || 0),
    lastRealMapAt:
      lastReal != null
        ? typeof lastReal === "number"
          ? new Date(lastReal).toISOString()
          : String(lastReal)
        : null,
    lastSource: gp.lastSource ?? null,
    lastFailReason: gp.lastFailReason ?? null
  };
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

class EventMesh {
  constructor(capacity = 64) {
    this.capacity = capacity;
    this.buf = new Array(capacity);
    this.head = 0;
    this.size = 0;
  }
  push(ev) {
    this.buf[this.head] = ev;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) this.size += 1;
  }
  recent(n = 8) {
    const take = Math.max(0, Math.min(n | 0, this.size));
    const out = new Array(take);
    for (let i = 0; i < take; i++) {
      const idx = (this.head - 1 - i + this.capacity) % this.capacity;
      out[i] = this.buf[idx];
    }
    return out;
  }
  clear() {
    this.head = 0;
    this.size = 0;
  }
}

class SquadRegistry {
  constructor() {
    this.nextId = 1;
    /** @type {Map<number, { rank: number; morale: number; intent: number; memorySeed: number; orbitMode: string }>} */
    this.squads = new Map();
  }
  create(intentKey = "ESCORT", orbitMode = "escort") {
    const id = this.nextId++;
    const intent = SQUAD_INTENT[intentKey] ?? SQUAD_INTENT.ESCORT;
    const memorySeed = (Math.random() * 0xffffffff) >>> 0;
    this.squads.set(id, {
      rank: 1,
      morale: 100,
      intent,
      memorySeed,
      orbitMode
    });
    return id;
  }
  get(id) {
    return this.squads.get(id);
  }
  clear() {
    this.squads.clear();
    this.nextId = 1;
  }
}

function ownerStringToDistrictKey(s) {
  const str = String(s || "GUEST");
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h === 0 ? 1 : h;
}

/** L8 procedural city mind + L9 heatmaps + Castle Academics district */
class CityMind {
  constructor() {
    this.districtType = new Uint8Array(MAX_DISTRICTS);
    this.districtEnergy = new Float32Array(MAX_DISTRICTS);
    this.districtThreat = new Float32Array(MAX_DISTRICTS);
    this.districtOwner = new Int32Array(MAX_DISTRICTS).fill(-1);
    this.heatMap = new Float32Array(HEATMAP_LEN);
    this.signalMap = new Float32Array(HEATMAP_LEN);
    this.threatMap = new Float32Array(HEATMAP_LEN);
    this.lifeMap = new Float32Array(HEATMAP_LEN);
    this.academicsTier = 1;
    this.academicsEnergy = 0;
    this.boxCount = 1500;
    this.seedDistricts();
  }

  seedDistricts() {
    for (let i = 0; i < MAX_DISTRICTS; i++) {
      const r = Math.random();
      if (i === 0) this.districtType[i] = DISTRICT.ACADEMICS;
      else if (r < 0.12) this.districtType[i] = DISTRICT.CIVIC;
      else if (r < 0.22) this.districtType[i] = DISTRICT.INDUSTRIAL;
      else if (r < 0.32) this.districtType[i] = DISTRICT.GREENROOM;
      else if (r < 0.4) this.districtType[i] = DISTRICT.ARCHIVE;
      else if (r < 0.52) this.districtType[i] = DISTRICT.DEFENSE;
      else if (r < 0.65) this.districtType[i] = DISTRICT.MARKET;
      else if (r < 0.78) this.districtType[i] = DISTRICT.SANCTUARY;
      else if (r < 0.9) this.districtType[i] = DISTRICT.ANOMALY;
      else this.districtType[i] = DISTRICT.CIVIC;
      this.districtEnergy[i] = 20 + Math.random() * 80;
      this.districtThreat[i] = Math.random() * 30;
      this.districtOwner[i] = -1;
    }
  }

  scanCity() {
    for (let i = 0; i < HEATMAP_LEN; i++) {
      const n = Math.random();
      this.heatMap[i] = n;
      this.signalMap[i] = n * 0.6;
      this.threatMap[i] = (1 - n) * 0.4;
      this.lifeMap[i] = 0.4 + n * 0.6;
    }
    let peak = 0;
    for (let i = 0; i < HEATMAP_LEN; i++) if (this.heatMap[i] > peak) peak = this.heatMap[i];
    return peak;
  }

  buildTower(districtId = 0) {
    const d = Math.max(0, Math.min(MAX_DISTRICTS - 1, districtId | 0));
    this.districtEnergy[d] += 35;
    this.districtThreat[d] = Math.max(0, this.districtThreat[d] - 2);
    return this.districtEnergy[d];
  }

  /** L8 city mind tick + living districts (academy field grows) */
  tick(dt, world) {
    if (!world) return;
    const ts = dt * 60;
    for (let i = 0; i < MAX_DISTRICTS; i++) {
      this.districtEnergy[i] += (Math.random() - 0.5) * 2 * ts;
      if (this.districtType[i] === DISTRICT.ACADEMICS || this.districtType[i] === DISTRICT.ACADEMY) {
        this.districtEnergy[i] += 0.5 * ts;
      }
      this.districtEnergy[i] = Math.max(5, Math.min(9999, this.districtEnergy[i]));
    }
    this.academicsEnergy += dt * (10 + this.academicsTier * 0.35);
    if (this.districtType[0] === DISTRICT.ACADEMICS) this.districtEnergy[0] += dt * 4;
    if (this.academicsEnergy > 220) {
      this.academicsEnergy = 0;
      this.academicsTier = Math.min(255, this.academicsTier + 1);
    }
    const cap = Math.min(world.activeCount, 512);
    for (let i = 0; i < cap; i++) {
      if (world.state[i] === STATE.CITIZEN && world.brainType[i] !== AGENT_ARCHETYPE.NONE) {
        world.xp[i] += dt * 2.5;
      }
    }
  }

  academicsDistrictSnapshot() {
    return {
      tier: this.academicsTier,
      energy: this.districtEnergy[0],
      threat: this.districtThreat[0],
      label: DISTRICT_LABEL[DISTRICT.ACADEMICS] || "academics"
    };
  }

  /** Kişisel kale — districtOwner + tip; koordinat CityMind dışında saklanır (continuity). */
  spawnPersonalCastle(ownerId, lat, lon, typeStr) {
    const typeMap = {
      SANCTUARY: DISTRICT.SANCTUARY,
      ACADEMY: DISTRICT.ACADEMICS,
      ACADEMICS: DISTRICT.ACADEMICS,
      DEFENSE: DISTRICT.DEFENSE,
      NEXUS: DISTRICT.ANOMALY
    };
    const dt = typeMap[String(typeStr || "SANCTUARY").toUpperCase()] ?? DISTRICT.SANCTUARY;
    const oid = ownerStringToDistrictKey(ownerId);
    let slot = -1;
    for (let i = 1; i < MAX_DISTRICTS; i++) {
      if (this.districtOwner[i] === oid) {
        slot = i;
        break;
      }
    }
    if (slot < 0) {
      for (let i = 1; i < MAX_DISTRICTS; i++) {
        if (this.districtOwner[i] < 0) {
          slot = i;
          break;
        }
      }
    }
    if (slot < 0) slot = Math.max(1, (Math.abs(oid) % (MAX_DISTRICTS - 1)) + 1);
    this.districtType[slot] = dt;
    this.districtOwner[slot] = oid;
    this.districtEnergy[slot] = Math.max(this.districtEnergy[slot], 140);
    this.districtThreat[slot] = Math.max(0, this.districtThreat[slot] - 6);
    this.academicsEnergy += 18;
    return { slot, districtKey: oid, districtType: dt, lat, lon };
  }

  purgePersonalCastle(ownerId) {
    const oid = ownerStringToDistrictKey(ownerId);
    let cleared = 0;
    for (let i = 0; i < MAX_DISTRICTS; i++) {
      if (this.districtOwner[i] === oid) {
        this.districtOwner[i] = -1;
        this.districtEnergy[i] = Math.max(8, this.districtEnergy[i] * 0.32);
        cleared += 1;
      }
    }
    return cleared;
  }

  reset() {
    this.academicsTier = 1;
    this.academicsEnergy = 0;
    this.seedDistricts();
    this.heatMap.fill(0);
    this.signalMap.fill(0);
    this.threatMap.fill(0);
    this.lifeMap.fill(0);
  }
}

const cityMind = new CityMind();
const eventMesh = new EventMesh(96);
const squadRegistry = new SquadRegistry();

function syncGhostPetToCastle(lat, lon) {
  try {
    const disk = readClientContinuity();
    const meta = { ...disk.meta };
    const prev = meta.ghostPet && typeof meta.ghostPet === "object" ? meta.ghostPet : {};
    meta.ghostPet = {
      ...prev,
      mood: "guard",
      castleLat: lat,
      castleLon: lon,
      guardSince: Date.now(),
      lastCastleSpawnAt: Date.now()
    };
    const cs0 = meta.castleState && typeof meta.castleState === "object" ? meta.castleState : {};
    meta.castleState = {
      ...cs0,
      phase: "SEED",
      anchorLat: lat,
      anchorLon: lon,
      updatedAt: Date.now()
    };
    const log = Array.isArray(meta.realityLog) ? meta.realityLog.slice() : [];
    log.push({
      at: Date.now(),
      note: `Kişisel kale SEED · ${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`,
      source: "DSL_SPAWN"
    });
    meta.realityLog = log.slice(-24);
    writeClientContinuity({ ...disk, meta });
  } catch {
    /* noop */
  }
}

function clearGhostPetCastleAnchor() {
  try {
    const disk = readClientContinuity();
    const meta = { ...disk.meta };
    const prev = meta.ghostPet && typeof meta.ghostPet === "object" ? meta.ghostPet : {};
    meta.ghostPet = {
      ...prev,
      mood: "neutral",
      castleLat: null,
      castleLon: null,
      guardSince: null
    };
    if (meta.castleState && typeof meta.castleState === "object") {
      meta.castleState = { ...meta.castleState, phase: "PURGED", updatedAt: Date.now() };
    }
    writeClientContinuity({ ...disk, meta });
  } catch {
    /* noop */
  }
}

/**
 * DSL köprüsü: CityMind + Event Mesh + süreklilik + REAL_MAP + Cesium flyToCustom.
 * @param {{ verb: string, args: Record<string, string> }} parsed
 */
async function applyPersonalCastleDsl(parsed) {
  if (!parsed || !parsed.verb) return { ok: false, reply: "Geçersiz DSL." };
  if (parsed.verb === "SPAWN_CASTLE") {
    const lat = Number(parsed.args.lat);
    const lon = Number(parsed.args.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return {
        ok: false,
        reply:
          "SPAWN CASTLE için --lat ve --lon sayısal olmalı (örn. --lat 41.0082 --lon 28.9784). Panelden «Konum ile kur» kullanabilirsiniz."
      };
    }
    const owner = String(parsed.args.owner || "GUEST");
    const type = String(parsed.args.type || "SANCTUARY");
    enqueueCastleRuntimeTransaction({
      kind: "spawn_request",
      source: "applyPersonalCastleDsl",
      payload: { verb: "SPAWN_CASTLE", owner, lat, lon, type }
    });
    const { x, z } = latLonToSceneXZ(lat, lon);
    const zone = cityMind.spawnPersonalCastle(owner, lat, lon, type);
    eventMesh.push({
      eventType: "CASTLE_SPAWN",
      eventSource: owner,
      eventTarget: `DISTRICT_${zone.slot}`,
      eventEnergy: 12,
      eventLifetime: 44,
      ts: new Date().toLocaleTimeString(),
      meta: { lat, lon, type, sceneX: x, sceneZ: z, slot: zone.slot }
    });
    uiStore.dispatch({ type: "EVENT_PULSE" });
    uiStore.dispatch({
      type: "SYNC_METRICS",
      payload: { district0Energy: cityMind.districtEnergy[0] }
    });
    syncGhostPetToCastle(lat, lon);
    await setRealityMode("REAL_MAP", { source: "DSL_SPAWN_CASTLE" });
    const t0 = performance.now();
    const fly = () => {
      const c = window.__CASTLE_CESIUM__;
      if (c?.flyToCustom) {
        c.flyToCustom(lat, lon, 820);
        return;
      }
      if (performance.now() - t0 > 9000) return;
      requestAnimationFrame(fly);
    };
    requestAnimationFrame(fly);
    return {
      ok: true,
      reply: `Kale yükseltildi (${type}) · bölge #${zone.slot} · sahip ${owner}. Ghost devriye; SEED aşamasında Event Mesh rezonansı ve çevre ajanlarından pasif XP akışı başlar.`,
      directive: "ZOOM_CASTLE"
    };
  }
  if (parsed.verb === "WAKE_TCEE") {
    const reason = String(parsed.args.reason || "kernel_wake").slice(0, 64);
    enqueueCastleRuntimeTransaction({
      kind: "dsl_command",
      source: "applyPersonalCastleDsl",
      payload: { verb: "WAKE_TCEE", reason }
    });
    const disk = readClientContinuity();
    const meta = disk.meta && typeof disk.meta === "object" ? disk.meta : {};
    const seeded = ensurePreBreathSeed(meta);
    const nextMeta = commitWakeSeal(seeded, { reason, sessionKey: getOrCreateCastleDevUid() });
    const next = { ...disk, meta: nextMeta };
    withRuntimeMergeCommit(() => {
      writeClientContinuity(next);
      syncClientContinuityRef(next);
    });
    uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 10 });
    uiStore.dispatch({
      type: "ADD_LOG",
      payload: {
        ts: new Date().toLocaleTimeString(),
        type: "SYS",
        data: `TCEE WAKE · Phase B seal (${reason}) · L10 · memoryClockEpoch=${nextMeta.tceeBoot?.memoryClockEpoch ?? ""}`
      }
    });
    return {
      ok: true,
      reply:
        "TCEE WAKE tamam (Phase B): kimlik manifoldu mühürlendi, hafıza saati epoch başladı, tam CSPE + recall→identity açık. Önceki faz pre-breath yalnızca pasif sensör/nabız.",
      directive: "FOCUS_RHIZOH"
    };
  }
  if (parsed.verb === "SLEEP_TCEE") {
    enqueueCastleRuntimeTransaction({
      kind: "dsl_command",
      source: "applyPersonalCastleDsl",
      payload: { verb: "SLEEP_TCEE" }
    });
    const disk = readClientContinuity();
    const meta = disk.meta && typeof disk.meta === "object" ? disk.meta : {};
    const nextMeta = revertTceeToPreBreath(meta);
    const next = { ...disk, meta: nextMeta };
    withRuntimeMergeCommit(() => {
      writeClientContinuity(next);
      syncClientContinuityRef(next);
    });
    uiStore.dispatch({
      type: "ADD_LOG",
      payload: {
        ts: new Date().toLocaleTimeString(),
        type: "SYS",
        data: "TCEE HIBERNATE · pre_breath (recall→identity kapalı)"
      }
    });
    return {
      ok: true,
      reply:
        "TCEE HIBERNATE: pre-breath. Pasif alan nabzı sürer; recall→identity geri beslemesi bu fazda kapalı. Hafıza diskte kalır.",
      directive: "FOCUS_RHIZOH"
    };
  }
  if (parsed.verb === "PURGE_CASTLE") {
    const owner = String(parsed.args.owner || "GUEST");
    enqueueCastleRuntimeTransaction({
      kind: "dsl_command",
      source: "applyPersonalCastleDsl",
      payload: { verb: "PURGE_CASTLE", owner }
    });
    const n = cityMind.purgePersonalCastle(owner);
    eventMesh.push({
      eventType: "CASTLE_PURGE",
      eventSource: owner,
      eventTarget: "NEXUS",
      eventEnergy: 5,
      eventLifetime: 20,
      ts: new Date().toLocaleTimeString()
    });
    uiStore.dispatch({ type: "EVENT_PULSE" });
    clearGhostPetCastleAnchor();
    return {
      ok: true,
      reply:
        n > 0
          ? `PURGE tamam: ${n} bölge sıfırlandı (${owner}). Simülasyondan kale kaldırıldı.`
          : `PURGE: ${owner} için atanmış kişisel bölge yoktu.`
    };
  }
  return { ok: false, reply: "Bilinmeyen DSL fiili." };
}

/** Server-side LLM recommended; client stub keeps ECS loop closed */
async function callLLMStub(prompt) {
  return {
    action: "MOVE",
    dx: (Math.random() - 0.5) * 0.02,
    dz: (Math.random() - 0.5) * 0.02,
    _stub: true,
    prompt
  };
}

function logRhizohHealth(stage, detail = {}) {
  try {
    const meta = detail && typeof detail === "object" ? detail : {};
    console.info(`[RHIZOH_OK] ${String(stage || "unknown")}`, meta);
  } catch {
    /* noop */
  }
}

/** Uzak /rhizoh/llm hattı hatalarını A/B/C sınıflarına ayırır (UI ve telemetri). */
function classifyRhizohLlmClientFailure(err, httpStatusFromBody) {
  const msg = String(err?.message || err || "");
  if (err?.rhizohFailureKind && typeof err.rhizohFailureKind === "string") {
    return {
      kind: err.rhizohFailureKind,
      httpStatus: err.providerHttpStatus ?? httpStatusFromBody ?? null
    };
  }
  if (/rhizoh_llm_timeout/i.test(msg) || /AbortError|aborted/i.test(msg)) {
    return { kind: "timeout", httpStatus: httpStatusFromBody ?? null };
  }
  const m = msg.match(/rhizoh_llm_http_(\d+)/i);
  if (m) {
    const st = Number(m[1]);
    if (st === 408 || st === 504) return { kind: "timeout", httpStatus: st };
    if (st === 429) return { kind: "rate_limit", httpStatus: st };
    return { kind: "provider_error", httpStatus: st };
  }
  if (/failed to fetch|NetworkError|network/i.test(msg)) return { kind: "network_error", httpStatus: null };
  if (/rhizoh_llm_bad_json|unexpected token|json\.parse|is not valid json/i.test(msg))
    return { kind: "provider_error", httpStatus: httpStatusFromBody ?? null };
  return { kind: "unknown", httpStatus: httpStatusFromBody ?? null };
}

async function queryRhizohLLM({
  message,
  provider,
  connectionId,
  agentId,
  layerProfile,
  layerSpec,
  simTime,
  idToken,
  continuity,
  runtime,
  llmKeySource = "auto",
  /** @type {string} FAST_DIALOGUE | STANDARD | REFLECTIVE | NARRATIVE | DEEP_REASONING */
  generationMode = "STANDARD",
  persistRhizohEmotions,
  gatewayUx,
  productDecisionOverlay,
  fetchTimeoutMs = TEXT_LLM_TIMEOUT_MS,
  slimVoicePath = false
}) {
  const trimmed = String(message || "").trim();
  logRhizohHealth("ui_send", { chars: trimmed.length });
  const dslParsed = parseDSL(trimmed);
  if (dslParsed) {
    const out = await applyPersonalCastleDsl(dslParsed);
    return {
      reply: out.reply,
      directive: out.directive || "FOCUS_RHIZOH",
      source: out.ok ? "dsl-castle" : "dsl-castle-error"
    };
  }
  if (detectCastleIntentWithoutCoords(trimmed)) {
    return {
      reply:
        "Kişisel kale için tarayıcı konumu gerekir — detay çekmecesinde «Sovereign Castle» panelinden «Konum ile kur» kullanın. Ya da tam komut: SPAWN CASTLE --owner sizin-id --lat 41.0082 --lon 28.9784 --type SANCTUARY",
      directive: "FOCUS_RHIZOH",
      source: "dsl-hint"
    };
  }

  const cont = continuity && typeof continuity === "object" ? continuity : {};
  const diskIntro =
    typeof window !== "undefined" && window.localStorage.getItem("rhizoh_intro_seen_v1") === "1";
  const diskMetaEarly = readClientContinuity().meta || {};
  const rhizohProductSnap = loadRhizohProductSession(
    diskMetaEarly && typeof diskMetaEarly === "object" ? diskMetaEarly : {}
  );
  const relPhase = cont.relationship && typeof cont.relationship === "object" ? cont.relationship : {};
  const tuning = productDecisionOverlay?.phaseTuning && typeof productDecisionOverlay.phaseTuning === "object"
    ? productDecisionOverlay.phaseTuning
    : {};
  const rhizohPhaseForTurn = advanceRhizohConversationPhase(
    rhizohProductSnap.conversationPhase,
    {
      trust: Number(relPhase.trust || 0),
      familiarity: Number(relPhase.familiarity || 0),
      userTurnCount: rhizohProductSnap.userTurnCount + 1,
      introSeen: diskIntro,
      explicitPowerUnlock: readRhizohExplicitPowerUnlock()
    },
    tuning
  );
  const bondGovernance01 =
    (Math.max(0, Math.min(1, Number(relPhase.trust) || 0)) +
      Math.max(0, Math.min(1, Number(relPhase.familiarity) || 0))) /
    2;
  const rhizohCapabilityEnvelope = buildRhizohProductCapabilityEnvelope(rhizohPhaseForTurn, {
    governanceBond01: bondGovernance01,
    suppressGovernanceOpsBadgeUnlessBond01:
      productDecisionOverlay?.capabilityGates?.suppressGovernanceOpsBadgeUnlessBond01 ?? null
  });
  const rhizohLlmDirective = buildRhizohConversationLlmDirective(rhizohPhaseForTurn);
  const bumpRhizohProductSessionAfterReply = () => {
    const gh = inferRhizohUserGoalHint(trimmed);
    saveRhizohProductSession({
      ...rhizohProductSnap,
      conversationPhase: rhizohPhaseForTurn,
      userTurnCount: rhizohProductSnap.userTurnCount + 1,
      userGoalHintBucket: gh.bucket,
      userGoalHintLabel: gh.label
    });
  };

  let runtimeHints = runtime && typeof runtime === "object" && !Array.isArray(runtime) ? { ...runtime } : {};
  if (Object.keys(runtimeHints).length === 0) {
    try {
      const st = uiStore.getState();
      runtimeHints = {
        realityMode: st.realityMode,
        mapSurfaceActive: st.mapSurfaceActive,
        layerFocus: st.layerFocus,
        governanceState: st.governanceState
      };
    } catch {
      runtimeHints = {};
    }
  }
  const cr = cont.runtime;
  if (cr && typeof cr === "object" && !Array.isArray(cr)) {
    runtimeHints = { ...runtimeHints, ...cr };
  }
  if (gatewayUx && typeof gatewayUx === "object" && gatewayUx.phase) {
    runtimeHints = {
      ...runtimeHints,
      gatewayPhase: gatewayUx.phase,
      rhizohGatewayPhase: gatewayUx.phase
    };
  }
  const healthState = buildRhizohHealthState({
    gatewayPhase: gatewayUx?.phase,
    healthDeps: gatewayUx?.healthDeps,
    mapSurfaceActive: runtimeHints.mapSurfaceActive
  });
  const rhizohHealthInfluence = computeRhizohHealthInfluence(healthState);
  runtimeHints = { ...runtimeHints, healthState, rhizohHealthInfluence };
  const rhizohRouter = routeRhizohInput(trimmed, cont, runtimeHints);
  const rhizohPolicy = deriveRhizohPolicy({ ...runtimeHints, rhizohRouter });
  runtimeHints = { ...runtimeHints, rhizohPolicy };
  enqueueCastleRuntimeTransaction({
    kind: "llm_turn",
    source: "chat",
    payload: {
      intent: String(rhizohRouter?.intent || "CHAT").slice(0, 32),
      msgLen: trimmed.length
    }
  });

  const relBase = cont.relationship && typeof cont.relationship === "object" ? cont.relationship : {};
  const emotionPrev =
    relBase.emotions && typeof relBase.emotions === "object" ? relBase.emotions : { ...DEFAULT_EMOTIONS };
  const emotionLastAt =
    typeof relBase.emotionUpdatedAt === "number" && Number.isFinite(relBase.emotionUpdatedAt)
      ? relBase.emotionUpdatedAt
      : null;
  const emotionsAfterDelta = applyEmotionDelta({
    current: emotionPrev,
    routerOutput: rhizohRouter,
    runtime: runtimeHints,
    continuity: cont,
    lastUpdatedAt: emotionLastAt
  });
  const tonePreGovernor = deriveRelationalTone(emotionsAfterDelta);
  const diskForPre = readClientContinuity();
  const diskMetaPre =
    diskForPre.meta && typeof diskForPre.meta === "object" ? diskForPre.meta : {};
  const govCalPre = normalizeGovernorCalibration(diskMetaPre.rhizohGovernorCalibration);
  const rhizohEmotions = softClampEmotionsToIdentityAnchor(emotionsAfterDelta, "preLlm", govCalPre);
  const relationalTone = blendRelationalToneForHealth(rhizohEmotions, healthState);
  const driftPre = buildRhizohDriftLogEntry({
    phase: "preLlm",
    emotionsPre: emotionsAfterDelta,
    emotionsPost: rhizohEmotions,
    tonePre: tonePreGovernor,
    tonePost: relationalTone,
    intent: rhizohRouter.intent,
    source: "input-turn",
    resonance: null
  });
  patchRhizohEmotionDisk(rhizohEmotions, relationalTone, undefined, undefined, driftPre);
  const emotionUpdatedAt = Date.now();
  const diskSnap = readClientContinuity();
  const diskMeta = diskSnap.meta && typeof diskSnap.meta === "object" ? diskSnap.meta : {};
  const tceeBootPhase = String(diskMeta.tceeBoot?.phase || TCEE_PHASE.PRE_BREATH);
  const govCalMem = normalizeGovernorCalibration(diskMeta.rhizohGovernorCalibration);
  const outcomeSessionMirror =
    cont.rhizohOutcomeSession && typeof cont.rhizohOutcomeSession === "object"
      ? cont.rhizohOutcomeSession
      : readOutcomeSessionFromMeta(diskMeta);
  const priorAssistantReplies = priorAssistantRepliesFromContinuity(cont);
  const bondForMemory = Math.min(
    1,
    Math.max(0, (Number(relBase.trust || 0) + Number(relBase.familiarity || 0)) / 2)
  );
  const episodeSlice = Array.isArray(diskMeta.rhizohMemoryEpisodes) ? diskMeta.rhizohMemoryEpisodes.slice(-16) : [];
  const turnSlice =
    Array.isArray(cont.rhizohWeightedMemory) && cont.rhizohWeightedMemory.length
      ? cont.rhizohWeightedMemory
      : Array.isArray(diskMeta.rhizohWeightedTurns)
        ? diskMeta.rhizohWeightedTurns.slice(-40)
        : [];
  const weightedMemorySource = [...episodeSlice, ...turnSlice].slice(-52);
  const rhizohMemoryEpisodes = Array.isArray(cont.rhizohMemoryEpisodes)
    ? cont.rhizohMemoryEpisodes
    : Array.isArray(diskMeta.rhizohMemoryEpisodes)
      ? diskMeta.rhizohMemoryEpisodes
      : [];
  const rhizohWeightedRecollection = applyMemoryDominanceCap(
    selectWeightedMemoryTurns(weightedMemorySource, {
      now: Date.now(),
      queryIntent: rhizohRouter.intent,
      currentBond: Math.min(1, Math.max(0.08, bondForMemory || 0.35)),
      limit: 14,
      currentPhysics: runtimeHints.socialPhysics,
      currentFieldTheory: runtimeHints.socialRegistry?.socialFieldTheory
    }),
    { maxTopShare: govCalMem.memoryMaxTopShare }
  );
  let rhizohRecallIdentityFeedback = null;
  let rhizohRecallMerge = null;
  if (tceeBootPhase === TCEE_PHASE.AWAKE) {
    try {
      const fb = computeIdentityFeedbackFromRecall(rhizohWeightedRecollection, {
        currentPhysics: runtimeHints.socialPhysics,
        now: Date.now()
      });
      if (fb) {
        const ig0 = readIdentityGraph();
        const igNext = applyRecallFeedbackToIdentityGraph(ig0, fb);
        rhizohRecallIdentityFeedback = fb;
        const payload = recallClosurePayloadForMeta(fb);
        rhizohRecallMerge =
          igNext && typeof igNext === "object"
            ? { identityGraphNext: igNext, recallClosurePayload: payload || null }
            : null;
      }
    } catch {
      /* noop */
    }
  }
  const igAfterRecall = rhizohRecallMerge?.identityGraphNext || readIdentityGraph();
  const rhizohRelAfterRecall = igAfterRecall.rhizoh || {};
  const relForLlm =
    tceeBootPhase === TCEE_PHASE.AWAKE
      ? {
          ...relBase,
          trust: Number(rhizohRelAfterRecall.trust ?? relBase.trust ?? 0),
          familiarity: Number(rhizohRelAfterRecall.familiarity ?? relBase.familiarity ?? 0),
          bondScore:
            Math.round(
              ((Number(rhizohRelAfterRecall.trust ?? relBase.trust ?? 0) +
                Number(rhizohRelAfterRecall.familiarity ?? relBase.familiarity ?? 0)) /
                2) *
                100
            ) / 100
        }
      : { ...relBase };
  const rhizohStabilityAnchor = getRhizohStabilityAnchorSnapshot();
  const rhizohNarrativeThread =
    cont.rhizohNarrativeThread && typeof cont.rhizohNarrativeThread === "object"
      ? cont.rhizohNarrativeThread
      : diskMeta.rhizohNarrativeThread && typeof diskMeta.rhizohNarrativeThread === "object"
        ? diskMeta.rhizohNarrativeThread
        : null;
  const rhizohNarrativeArc =
    cont.rhizohNarrativeArc && typeof cont.rhizohNarrativeArc === "object"
      ? cont.rhizohNarrativeArc
      : diskMeta.rhizohNarrativeArc && typeof diskMeta.rhizohNarrativeArc === "object"
        ? diskMeta.rhizohNarrativeArc
        : null;
  const reliabilityEpisodes = Array.isArray(diskMeta.rhizohReliabilityEpisodes)
    ? diskMeta.rhizohReliabilityEpisodes
    : [];
  const rhizohReliabilitySummary = formatReliabilityEpisodesSummaryForLlm(reliabilityEpisodes);
  const contForLlm = {
    ...cont,
    runtime: {
      ...(cont.runtime && typeof cont.runtime === "object" ? cont.runtime : {}),
      gatewayPhase: runtimeHints.gatewayPhase,
      rhizohGatewayPhase: runtimeHints.rhizohGatewayPhase,
      healthState,
      rhizohPolicy,
      rhizohProductOrchestration: {
        schemaVersion: "1.0.0",
        orchestratorVersion: RHIZOH_CONVERSATION_ORCHESTRATOR_VERSION,
        sessionId: rhizohProductSnap.sessionId,
        conversationPhase: rhizohPhaseForTurn,
        userTurnIndex: rhizohProductSnap.userTurnCount + 1,
        capabilityEnvelope: rhizohCapabilityEnvelope
      }
    },
    relationship: {
      ...relForLlm,
      emotions: rhizohEmotions,
      relationalTone,
      emotionUpdatedAt
    },
    rhizohWeightedRecollection,
    rhizohRecallIdentityFeedback,
    rhizohStabilityAnchor,
    rhizohNarrativeThread,
    rhizohMemoryEpisodes,
    rhizohNarrativeArc,
    rhizohGovernorCalibration: govCalMem,
    rhizohReliabilityEpisodes: reliabilityEpisodes.slice(-12),
    rhizohReliabilitySummary,
    recentReliabilitySummary: rhizohReliabilitySummary,
    meta: {
      rhizohReliabilityEpisodes: reliabilityEpisodes.slice(-12),
      rhizohHealthInfluence,
      ...(rhizohRecallIdentityFeedback ? { rhizohRecallIdentityFeedback } : {})
    }
  };
  if (slimVoicePath) {
    contForLlm.rhizohMemoryEpisodes = Array.isArray(contForLlm.rhizohMemoryEpisodes)
      ? contForLlm.rhizohMemoryEpisodes.slice(-4)
      : [];
    contForLlm.rhizohReliabilityEpisodes = [];
    contForLlm.rhizohReliabilitySummary = "";
    contForLlm.recentReliabilitySummary = "";
    if (contForLlm.meta && typeof contForLlm.meta === "object") {
      contForLlm.meta = { ...contForLlm.meta, rhizohReliabilityEpisodes: [] };
    }
  }
  if (typeof persistRhizohEmotions === "function") {
    try {
      persistRhizohEmotions({ emotions: rhizohEmotions, relationalTone, emotionUpdatedAt });
    } catch {
      /* noop */
    }
  }

  const cfg = getCastleFlightConfig();
  const endpoint = cfg.rhizohLlmHttp;
  const modeKey = normalizeRhizohGenerationModeId(generationMode);
  const maxTok = RHIZOH_GENERATION_MODE_MAX[modeKey] ?? 320;
  if (!endpoint) {
    const replyStub = `Rhizoh: ${layerProfile.mission}. Talep alındı -> ${message}. LLM için ağ geçidi (VITE_GATEWAY_HTTP veya VITE_RHIZOH_LLM_HTTP) tanımlayın; anahtar sunucuda OPENAI_API_KEY.`;
    const post = finalizeRhizohAfterLlm(rhizohEmotions, {
      rhizohRouter,
      reply: replyStub,
      source: "local-stub",
      runtimeHints,
      gatewayUx,
      persistRhizohEmotions,
      outcomeSession: outcomeSessionMirror,
      priorAssistantReplies
    });
    bumpRhizohProductSessionAfterReply();
    return {
      reply: replyStub,
      directive: "FOCUS_RHIZOH",
      source: "local-stub",
      traceId: "",
      llmProvider: null,
      llmModel: null,
      rhizohRouter,
      rhizohEmotions: post.emotions,
      relationalTone: post.relationalTone,
      outcomeResonance: post.outcomeResonance,
      emotionsPreOutcome: rhizohEmotions,
      outcomeSession: post.outcomeSession,
      rhizohRecallMerge
    };
  }

  const authHeader =
    idToken && String(idToken).trim()
      ? { Authorization: `Bearer ${String(idToken).trim()}` }
      : cfg.rhizohLlmToken
        ? { Authorization: `Bearer ${cfg.rhizohLlmToken}` }
        : {};

  try {
    const fetchOpts = {
      method: "POST",
      body: JSON.stringify({
        message,
        provider,
        llmKeySource,
        connectionId: connectionId || "",
        context: {
          agentId: agentId || "",
          layerId: layerSpec.id,
          layerCode: layerSpec.code,
          layerName: layerSpec.name,
          mission: layerProfile.mission,
          detail: layerProfile.detail,
          reality: layerProfile.reality,
          camera: layerProfile.camera,
          simTime,
          continuity: contForLlm,
          rhizohRouter,
          rhizohProductOrchestration: {
            schemaVersion: "1.0.0",
            orchestratorVersion: RHIZOH_CONVERSATION_ORCHESTRATOR_VERSION,
            sessionId: rhizohProductSnap.sessionId,
            conversationPhase: rhizohPhaseForTurn,
            userTurnIndex: rhizohProductSnap.userTurnCount + 1,
            capabilityEnvelope: rhizohCapabilityEnvelope
          },
          rhizohConversationLlmDirective: rhizohLlmDirective,
          rhizohMemoryContract: `${[
            "continuity state is authoritative session memory (identity, castleState, ghostPet, recentReality, codex, relationship). Do not invent facts beyond it; answer in natural Turkish and reference it when relevant. When you should hold quiet companionship without spoken reply, output only the tag <SILENCE> (optional attributes: intensity=0..1 resonance=0..1 durationMs=milliseconds state=listening|present).",
            "",
            rhizohLlmDirective
          ].join("\n")}`
        },
        options: {
          maxTokens: maxTok,
          language: "tr-TR",
          generationMode: modeKey
        }
      }),
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
      }
    };
    let timeoutCtrl = null;
    let timeoutId = 0;
    const llmTimeoutMs = Math.max(8000, Number(fetchTimeoutMs) || TEXT_LLM_TIMEOUT_MS);
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      fetchOpts.signal = AbortSignal.timeout(llmTimeoutMs);
    } else if (typeof AbortController !== "undefined") {
      timeoutCtrl = new AbortController();
      timeoutId = window.setTimeout(() => {
        try {
          timeoutCtrl.abort(new Error("rhizoh_llm_timeout"));
        } catch {
          /* noop */
        }
      }, llmTimeoutMs);
      fetchOpts.signal = timeoutCtrl.signal;
    }
    const res = await fetch(endpoint, fetchOpts);
    logRhizohHealth("gateway_accept", { status: Number(res?.status || 0) });
    if (timeoutId) window.clearTimeout(timeoutId);
    if (!res.ok) {
      let errBody = null;
      try {
        errBody = await res.json();
      } catch {
        /* noop */
      }
      const e = new Error(`rhizoh_llm_http_${res.status}`);
      if (errBody && typeof errBody === "object") {
        if (errBody.rhizohFailureKind) e.rhizohFailureKind = String(errBody.rhizohFailureKind);
        if (errBody.providerHttpStatus != null) e.providerHttpStatus = Number(errBody.providerHttpStatus);
      }
      throw e;
    }
    let json;
    try {
      json = await res.json();
    } catch {
      const bad = new Error("rhizoh_llm_bad_json");
      bad.rhizohFailureKind = "provider_error";
      throw bad;
    }
    logRhizohHealth("llm_response", { traceId: String(json?.traceId || "") });
    if (!rhizohCapabilityEnvelope.backendHints.attachFullRhizohProduction && json && typeof json === "object") {
      try {
        delete json.rhizohProduction;
      } catch {
        /* noop */
      }
    }
    const replyOk = String(json?.reply || json?.text || "Rhizoh yanıtı boş döndü.");
    const postOk = finalizeRhizohAfterLlm(rhizohEmotions, {
      rhizohRouter,
      reply: replyOk,
      source: "remote-llm",
      runtimeHints,
      gatewayUx,
      persistRhizohEmotions,
      outcomeSession: outcomeSessionMirror,
      priorAssistantReplies
    });
    bumpRhizohProductSessionAfterReply();
    logRhizohHealth("continuity_saved", { phase: rhizohPhaseForTurn });
    return {
      reply: replyOk,
      directive: String(json?.directive || json?.action || ""),
      source: "remote-llm",
      traceId: String(json?.traceId || ""),
      llmProvider: json?.provider ?? provider ?? null,
      llmModel: json?.model ?? null,
      llmKeyBillingOwner: json?.llmKeyBillingOwner,
      llmKeyOrigin: json?.llmKeyOrigin,
      llmKeySourceUsed: json?.llmKeySourceUsed,
      rhizohDeliveryKind: json?.rhizohDeliveryKind ?? "ok",
      rhizohCompressionLedger:
        json?.rhizohCompressionLedger && typeof json.rhizohCompressionLedger === "object"
          ? json.rhizohCompressionLedger
          : null,
      rhizohRouter,
      rhizohEmotions: postOk.emotions,
      relationalTone: postOk.relationalTone,
      outcomeResonance: postOk.outcomeResonance,
      emotionsPreOutcome: rhizohEmotions,
      outcomeSession: postOk.outcomeSession,
      rhizohRecallMerge
    };
  } catch (err) {
    const fail = classifyRhizohLlmClientFailure(err, err?.providerHttpStatus);
    try {
      window.__CASTLE_RHIZOH_LLM_DIAG__ = {
        at: Date.now(),
        endpoint: String(endpoint).split(/[?#]/)[0],
        message: String(err?.message || err || "fetch_failed"),
        rhizohFailureKind: fail.kind,
        httpStatus: fail.httpStatus
      };
      if (import.meta.env?.DEV) console.warn("[Rhizoh LLM]", endpoint, err);
    } catch {
      /* noop */
    }
    const httpBit = fail.httpStatus != null ? ` HTTP ${fail.httpStatus}` : "";
    const replyByKind =
      fail.kind === "timeout"
        ? `Rhizoh: Uzak model zaman aşımı. Kısa bir mesajla tekrar deneyin.`
        : fail.kind === "network_error"
          ? `Rhizoh: Ağ hatası — bağlantıyı kontrol edin.`
          : fail.kind === "rate_limit"
            ? `Rhizoh: İstek sınırı aşıldı; bir süre sonra tekrar deneyin.`
            : fail.kind === "client_config"
              ? `Rhizoh: Sunucu veya API anahtarı yapılandırması eksik (client_config).`
              : fail.kind === "provider_error"
                ? `Rhizoh: Uzak model yanıt vermedi${httpBit}. Yerel protokolle devam ediyorum.`
                : `Rhizoh: Uzak LLM hattı yanıt vermedi (${fail.kind}). Yerel protokolle devam ediyorum -> ${message}`;
    const replyFb = replyByKind;
    const postFb = finalizeRhizohAfterLlm(rhizohEmotions, {
      rhizohRouter,
      reply: replyFb,
      source: "fallback",
      runtimeHints,
      gatewayUx,
      persistRhizohEmotions,
      outcomeSession: outcomeSessionMirror,
      priorAssistantReplies
    });
    bumpRhizohProductSessionAfterReply();
    logRhizohHealth("continuity_saved", { phase: rhizohPhaseForTurn, fallback: true });
    return {
      reply: replyFb,
      directive: "FOCUS_RHIZOH",
      source: "fallback",
      traceId: "",
      llmProvider: null,
      llmModel: null,
      llmFailureKind: fail.kind,
      llmFailureHttpStatus: fail.httpStatus,
      rhizohRouter,
      rhizohEmotions: postFb.emotions,
      relationalTone: postFb.relationalTone,
      outcomeResonance: postFb.outcomeResonance,
      emotionsPreOutcome: rhizohEmotions,
      outcomeSession: postFb.outcomeSession,
      rhizohRecallMerge
    };
  }
}

async function rhizohPersistTraceFromOut(out, epistemicCtx) {
  if (!out?.rhizohRouter) return undefined;
  const turnId =
    (epistemicCtx && typeof epistemicCtx === "object" && epistemicCtx.turnId) ||
    `turn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const trace = {
    turnId: String(turnId),
    traceId:
      epistemicCtx && typeof epistemicCtx === "object" && epistemicCtx.traceId
        ? String(epistemicCtx.traceId)
        : "",
    router: out.rhizohRouter,
    source: out.source,
    outcomeResonance: out.outcomeResonance,
    emotionsAfter: out.rhizohEmotions,
    emotionsBefore: out.emotionsPreOutcome
  };
  if (out.llmProvider != null || out.llmModel != null) {
    trace.modelRoute = { provider: out.llmProvider ?? null, model: out.llmModel ?? null };
  }
  if (out.rhizohRecallMerge && typeof out.rhizohRecallMerge === "object") {
    trace.rhizohRecallMerge = out.rhizohRecallMerge;
  }
  if (out.rhizohCompressionLedger && typeof out.rhizohCompressionLedger === "object") {
    trace.rhizohCompressionLedger = out.rhizohCompressionLedger;
  }
  if (out.rhizohDeliveryKind) trace.rhizohDeliveryKind = out.rhizohDeliveryKind;
  if (out.llmFailureKind) trace.llmFailureKind = out.llmFailureKind;
  if (epistemicCtx && typeof epistemicCtx === "object") {
    try {
      trace.epistemic = buildEpistemicTruthContract({
        source: out.source,
        gatewayPhase: epistemicCtx.gatewayPhase,
        mapSurfaceActive: epistemicCtx.mapSurfaceActive,
        router: out.rhizohRouter
      });
      if (epistemicCtx.seal !== false && trace.epistemic) {
        const diskForSeal = readClientContinuity();
        const diskMetaSeal =
          diskForSeal.meta && typeof diskForSeal.meta === "object" ? diskForSeal.meta : {};
        const memoryDigest = await sha256HexUtf8(JSON.stringify(diskMetaSeal));
        const worldSnap = JSON.stringify({
          layerFocus: epistemicCtx.layerFocus ?? null,
          simTime: epistemicCtx.simTime ?? null,
          realityMode: epistemicCtx.realityMode ?? null,
          governanceState: epistemicCtx.governanceState ?? null
        });
        const worldSnapshotHash = await sha256HexUtf8(worldSnap);
        const runtimeHash = await sha256HexUtf8(
          JSON.stringify({
            gatewayPhase: epistemicCtx.gatewayPhase ?? null,
            mapSurfaceActive: epistemicCtx.mapSurfaceActive ?? null,
            source: out.source
          })
        );
        trace.epistemic.clientBindings = {
          worldSnapshotHash,
          memoryDigest,
          runtimeHash
        };
        await sealRhizohEpistemicTrace(trace, {
          runtimeHash,
          modelRoute: {
            provider: out.llmProvider ?? null,
            model: out.llmModel ?? null
          },
          memoryDigest,
          worldSnapshotHash,
          realityMode: epistemicCtx.realityMode ?? null,
          governanceState: epistemicCtx.governanceState ?? null,
          idToken: epistemicCtx.idToken ? String(epistemicCtx.idToken).trim() : ""
        });
      }
    } catch {
      /* noop */
    }
  }
  return trace;
}

function getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function applyRhizohDirective(directive, engineRef) {
  const engine = engineRef.current;
  if (!directive) return;
  const d = String(directive).toUpperCase();
  if (d === "FOCUS_RHIZOH") {
    if (coreWorld.rhizohIdx === -1) coreWorld.allocate("RHIZOH-PRIME", STATE.RHIZOH);
    const idx = coreWorld.rhizohIdx;
    if (idx >= 0 && engine) {
      engine.focusWorldPoint(coreWorld.posX[idx], coreWorld.posY[idx], coreWorld.posZ[idx], 1800);
    }
    return;
  }
  if (d === "ZOOM_CASTLE") {
    const c = window.__CASTLE_CESIUM__;
    if (c?.focusCastle) c.focusCastle();
    else engine?.focusCastleBeacon?.();
    return;
  }
  if (d === "ZOOM_AGENT") {
    engine?.focusNextAgent?.();
    return;
  }
  if (d === "ISTANBUL_OVERVIEW") {
    window.__CASTLE_CESIUM__?.flyToIstanbul?.();
  }
}

class World {
  constructor(maxEntities) {
    this.MAX = maxEntities;
    this.posX = new Float32Array(this.MAX);
    this.posY = new Float32Array(this.MAX);
    this.posZ = new Float32Array(this.MAX);
    this.velX = new Float32Array(this.MAX);
    this.velY = new Float32Array(this.MAX);
    this.velZ = new Float32Array(this.MAX);
    this.state = new Uint8Array(this.MAX);
    this.isDirty = new Uint8Array(this.MAX);
    this.colorDirty = new Uint8Array(this.MAX);
    this.cellHash = new Int32Array(this.MAX).fill(-1);
    this.brainType = new Uint8Array(this.MAX);
    this.energy = new Float32Array(this.MAX);
    this.focus = new Float32Array(this.MAX);
    this.xp = new Float32Array(this.MAX);
    this.level = new Uint16Array(this.MAX);
    this.abilityMask = new Uint32Array(this.MAX);
    this.targetIdx = new Int32Array(this.MAX).fill(-1);
    this.petStage = new Uint8Array(this.MAX);
    this.bond = new Float32Array(this.MAX);
    this.ownerIdx = new Int32Array(this.MAX).fill(-1);
    this.presenceState = new Uint8Array(this.MAX);
    this.channelId = new Uint16Array(this.MAX);
    this.idToIndex = new Map();
    this.indexToId = new Array(this.MAX);
    this.removedSet = new Set();
    this.HASH_SIZE = 16411;
    this.CELL_SIZE = 250;
    /** Hayalet / boids için daha ince hücre (hotspot zincirlerini kısaltır). */
    this.GHOST_CELL_SIZE = 48;
    this.ghostGridHead = new Int32Array(this.HASH_SIZE).fill(-1);
    this.ghostGridNext = new Int32Array(this.MAX).fill(-1);
    this.agentGridHead = new Int32Array(this.HASH_SIZE).fill(-1);
    this.agentGridNext = new Int32Array(this.MAX).fill(-1);
    this.nearbyScratch = new Int32Array(512);
    this.neighborPoolScratch = new Int32Array(BOID_COLLECT_CAP);
    this.squadId = new Uint16Array(this.MAX);
    this.swarmActive = false;
    this.portalCharge = 0;
    this.activeCount = 0;
    this.simTime = 0;
    this.targetMode = "GLOBE";
    this.rhizohIdx = -1;
    /** Köprü üzerinden tek ajan için parabolik transit (tick içinde konum yazılır). */
    this.bridgeTransit = null;

    // --- L11: CASTLE ACADEMICS CORE ---
    this.curriculum = [
      { id: "basics", name: "Spatial Awareness", req: 0 },
      { id: "physics", name: "Motion & Force", req: 1000 },
      { id: "swarm", name: "Swarm Intelligence", req: 3000 },
      { id: "command", name: "Command Systems", req: 6000 },
      { id: "overmind", name: "Overmind Theory", req: 10000 }
    ];
    this.curriculumTier = new Uint16Array(this.MAX);
    this.examQueue = [];
    this.graduationQueue = [];
    this.examMode = false;
    this.academyXP = new Float32Array(this.MAX);
    this.knowledge = new Float32Array(this.MAX);
    this.discipline = new Float32Array(this.MAX);
    this.llmProfiles = new Map();
    this.agentMemory = new Map();
    this.agentPersona = new Map();
    this.agentBindings = new Map();
    this.agentPetLink = new Map();
    this.knowledgeGraph = new KnowledgeGraphSubstrate();
    this.knowledgeGraph.upsertNode("castle:academies:root", KG_NODE.CONCEPT, "Castle Academies", { layer: 11 });
    this.chronos = new ChronosScheduler();
    this.capability = new CapabilityToken({
      scope: "rhizoh-client",
      expiresAtSim: Infinity,
      actions: ["MOVE", "TEACH", "SUMMON_PET", "SUMMON PET", "*"]
    });
    this.castles = {
      academy: {
        knowledgeGraph: this.knowledgeGraph,
        connectedAgents: [],
        globalMemory: []
      }
    };

    /** Per-entity shell altitude + swirl phase — avoids single shared orbit ring */
    this.orbitShellOffset = new Float32Array(this.MAX);
    this.orbitDrift = new Float32Array(this.MAX);
  }

  reset() {
    this.activeCount = 0;
    this.simTime = 0;
    this.swarmActive = false;
    this.portalCharge = 0;
    this.idToIndex.clear();
    this.indexToId = new Array(this.MAX);
    this.removedSet.clear();
    this.state.fill(0);
    this.isDirty.fill(0);
    this.colorDirty.fill(0);
    this.cellHash.fill(-1);
    this.squadId.fill(0);
    this.rhizohIdx = -1;
    this.bridgeTransit = null;
    this.academyXP.fill(0);
    this.knowledge.fill(0);
    this.discipline.fill(0);
    this.curriculumTier.fill(0);
    this.orbitShellOffset.fill(0);
    this.orbitDrift.fill(0);
    this.examQueue.length = 0;
    this.graduationQueue.length = 0;
    this.examMode = false;
    this.llmProfiles.clear();
    this.agentMemory.clear();
    this.agentPersona.clear();
    this.agentBindings.clear();
    this.agentPetLink.clear();
    this.knowledgeGraph.clear();
    this.knowledgeGraph.upsertNode("castle:academies:root", KG_NODE.CONCEPT, "Castle Academies", { layer: 11 });
    this.chronos = new ChronosScheduler();
    this.castles.academy.connectedAgents.length = 0;
    this.castles.academy.globalMemory.length = 0;
  }

  spatialHash(x, y, z) {
    return worldToSpatialBucket(x, y, z, this.CELL_SIZE, this.HASH_SIZE);
  }

  spatialHashGhost(x, y, z) {
    return worldToSpatialBucket(x, y, z, this.GHOST_CELL_SIZE, this.HASH_SIZE);
  }

  allocate(id, stateCode = STATE.CITIZEN, archetype = AGENT_ARCHETYPE.NONE, squadIdVal = 0) {
    if (this.idToIndex.has(id)) {
      const idx = this.idToIndex.get(id);
      this.state[idx] = stateCode;
      this.isDirty[idx] = 1;
      this.colorDirty[idx] = 1;
      this.cellHash[idx] = -1;
      if (archetype) this.brainType[idx] = archetype;
      if (squadIdVal) this.squadId[idx] = squadIdVal;
      return idx;
    }
    if (this.activeCount >= this.MAX) return -1;

    const idx = this.activeCount++;
    this.idToIndex.set(id, idx);
    this.indexToId[idx] = id;

    this.posX[idx] = (Math.random() - 0.5) * 4000;
    this.posY[idx] = 3500;
    this.posZ[idx] = (Math.random() - 0.5) * 4000;
    this.velX[idx] = (Math.random() - 0.5) * 5;
    this.velY[idx] = (Math.random() - 0.5) * 5;
    this.velZ[idx] = (Math.random() - 0.5) * 5;

    this.state[idx] = stateCode;
    this.isDirty[idx] = 1;
    this.colorDirty[idx] = 1;
    this.cellHash[idx] = -1;
    this.brainType[idx] = archetype;
    this.squadId[idx] = squadIdVal;

    this.xp[idx] = 0;
    this.level[idx] = 1;
    this.petStage[idx] = PET_STAGE.SEED;
    this.ownerIdx[idx] = -1;
    this.targetIdx[idx] = -1;
    this.academyXP[idx] = 0;
    this.knowledge[idx] = 0;
    this.discipline[idx] = 0;
    {
      const { lo, hi } = typeof id === "string" ? stableJitterFromId(id) : stableJitterFromId(`slot-${idx}`);
      this.orbitShellOffset[idx] = (lo % 2001) / 20 - 50;
      this.orbitDrift[idx] = (hi % 6283) / 1000;
    }

    if (stateCode === STATE.RHIZOH) {
      this.rhizohIdx = idx;
      this.abilityMask[idx] =
        ABILITY.SCAN |
        ABILITY.SUMMON |
        ABILITY.EVOLVE |
        ABILITY.COMMAND |
        ABILITY.SATELLITE |
        ABILITY.GREENROOM |
        ABILITY.OVERMIND |
        ABILITY.PORTAL;
      this.posY[idx] = 4000;
    }

    return idx;
  }

  remove(id) {
    const idx = this.idToIndex.get(id);
    if (idx === undefined) return;

    if (this.state[idx] === STATE.RHIZOH) this.rhizohIdx = -1;

    const lastIdx = --this.activeCount;

    if (idx !== lastIdx) {
      this.posX[idx] = this.posX[lastIdx];
      this.posY[idx] = this.posY[lastIdx];
      this.posZ[idx] = this.posZ[lastIdx];
      this.velX[idx] = this.velX[lastIdx];
      this.velY[idx] = this.velY[lastIdx];
      this.velZ[idx] = this.velZ[lastIdx];
      this.state[idx] = this.state[lastIdx];
      this.cellHash[idx] = this.cellHash[lastIdx];

      this.brainType[idx] = this.brainType[lastIdx];
      this.energy[idx] = this.energy[lastIdx];
      this.xp[idx] = this.xp[lastIdx];
      this.level[idx] = this.level[lastIdx];
      this.abilityMask[idx] = this.abilityMask[lastIdx];
      this.targetIdx[idx] = this.targetIdx[lastIdx];
      this.petStage[idx] = this.petStage[lastIdx];
      this.ownerIdx[idx] = this.ownerIdx[lastIdx];
      this.squadId[idx] = this.squadId[lastIdx];
      this.academyXP[idx] = this.academyXP[lastIdx];
      this.knowledge[idx] = this.knowledge[lastIdx];
      this.discipline[idx] = this.discipline[lastIdx];
      this.curriculumTier[idx] = this.curriculumTier[lastIdx];
      this.orbitShellOffset[idx] = this.orbitShellOffset[lastIdx];
      this.orbitDrift[idx] = this.orbitDrift[lastIdx];

      this.isDirty[idx] = 1;
      this.colorDirty[idx] = 1;

      const lastId = this.indexToId[lastIdx];
      this.idToIndex.set(lastId, idx);
      this.indexToId[idx] = lastId;

      if (this.state[idx] === STATE.RHIZOH) this.rhizohIdx = idx;

      if (this.agentMemory.has(lastIdx)) this.agentMemory.set(idx, this.agentMemory.get(lastIdx));
      else this.agentMemory.delete(idx);
      this.agentMemory.delete(lastIdx);

      if (this.agentPersona.has(lastIdx)) this.agentPersona.set(idx, this.agentPersona.get(lastIdx));
      else this.agentPersona.delete(idx);
      this.agentPersona.delete(lastIdx);

      if (this.agentPetLink.has(lastIdx)) {
        this.agentPetLink.set(idx, this.agentPetLink.get(lastIdx));
        this.agentPetLink.delete(lastIdx);
      } else {
        this.agentPetLink.delete(idx);
      }
    } else {
      this.agentMemory.delete(idx);
      this.agentPersona.delete(idx);
      this.agentPetLink.delete(idx);
    }

    this.state[lastIdx] = 0;
    this.idToIndex.delete(id);
    this.indexToId[lastIdx] = undefined;
    this.removedSet.add(id);
  }

  flushRemoved() {
    if (this.removedSet.size === 0) return null;
    const arr = Array.from(this.removedSet);
    this.removedSet.clear();
    return arr;
  }

  beginCastleBridgeTransit(agentIdx, tx, ty, tz, duration = 4.5) {
    if (agentIdx < 0 || agentIdx >= this.activeCount || this.state[agentIdx] === 0) return false;
    const ax = this.posX[agentIdx];
    const ay = this.posY[agentIdx];
    const az = this.posZ[agentIdx];
    let perpX = -(tz - az);
    let perpZ = tx - ax;
    const pl = Math.hypot(perpX, perpZ);
    if (pl > 1e-6) {
      perpX /= pl;
      perpZ /= pl;
    } else {
      perpX = 1;
      perpZ = 0;
    }
    const arcHeight = Math.min(4200, Math.max(800, Math.hypot(tx - ax, ty - ay, tz - az) * 0.38));
    this.bridgeTransit = {
      idx: agentIdx,
      ax,
      ay,
      az,
      tx,
      ty,
      tz,
      perpX,
      perpZ,
      arcHeight,
      t: 0,
      dur: Math.max(1.2, duration)
    };
    return true;
  }

  findNearbyAgents(i, radius) {
    const px = this.posX[i];
    const py = this.posY[i];
    const pz = this.posZ[i];
    const r2 = radius * radius;
    const cx = Math.floor(px / this.CELL_SIZE);
    const cy = Math.floor(py / this.CELL_SIZE);
    const cz = Math.floor(pz / this.CELL_SIZE);
    const cellR = Math.ceil(radius / this.CELL_SIZE) + 1;
    let outCount = 0;
    for (let dx = -cellR; dx <= cellR; dx++) {
      for (let dy = -cellR; dy <= cellR; dy++) {
        for (let dz = -cellR; dz <= cellR; dz++) {
          const hh = this.spatialHash((cx + dx) * this.CELL_SIZE, (cy + dy) * this.CELL_SIZE, (cz + dz) * this.CELL_SIZE);
          let j = this.agentGridHead[hh];
          while (j !== -1) {
            if (j !== i && this.state[j] !== 0) {
              const ddx = this.posX[j] - px;
              const ddy = this.posY[j] - py;
              const ddz = this.posZ[j] - pz;
              if (ddx * ddx + ddy * ddy + ddz * ddz <= r2) {
                if (outCount < this.nearbyScratch.length) this.nearbyScratch[outCount] = j;
                outCount++;
              }
            }
            j = this.agentGridNext[j];
          }
        }
      }
    }
    return { count: Math.min(outCount, this.nearbyScratch.length), ids: this.nearbyScratch };
  }

  spawnEvent(srcIdx, tgtIdx, kind, energy) {
    const src = this.indexToId[srcIdx] ?? `i${srcIdx}`;
    const tgt = tgtIdx >= 0 ? (this.indexToId[tgtIdx] ?? `i${tgtIdx}`) : "MESH";
    eventMesh.push({
      eventType: `ACADEMY_${kind}`,
      eventSource: String(src),
      eventTarget: String(tgt),
      eventEnergy: energy,
      eventLifetime: 8 + Math.random() * 4,
      ts: new Date().toLocaleTimeString()
    });
    uiStore.dispatch({ type: "EVENT_PULSE" });
  }

  processGraduationQueue() {
    if (this.graduationQueue.length === 0) return;
    const idx = this.graduationQueue.pop();
    if (idx === undefined || this.state[idx] === 0) return;
    if (this.state[idx] !== STATE.AGENT_STUDENT) return;
    this.state[idx] = STATE.AGENT_MASTER;
    this.colorDirty[idx] = 1;
    this.isDirty[idx] = 1;
    this.spawnEvent(idx, -1, 7, 4.0);
    const gid = this.indexToId[idx];
    if (gid) {
      const nk = `graduate:${gid}`;
      this.knowledgeGraph.upsertNode(nk, KG_NODE.CONCEPT, "Graduate", { tier: "MASTER" });
      this.knowledgeGraph.link(String(gid), KG_EDGE.SUPPORTS, nk, 1);
    }
    this.castles.academy.globalMemory.push({ type: "GRADUATION", agent: this.indexToId[idx], t: this.simTime });
    uiStore.dispatch({
      type: "ADD_LOG",
      payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "🎓 ACADEMY GRADUATION: AGENT -> MASTER" }
    });
  }

  registerLLMAgent(userId, agentConfig) {
    const agentId = agentConfig.agentId;
    this.llmProfiles.set(agentId, { ...agentConfig, userId });
    if (!this.agentBindings.has(userId)) this.agentBindings.set(userId, []);
    this.agentBindings.get(userId).push(agentId);
    const idx = this.allocate(`LLM-${agentId}`, STATE.AGENT_PROFESSOR);
    if (idx < 0) return -1;
    this.agentPersona.set(idx, agentConfig.persona || { role: "Academy Professor", traits: ["mentor"], domain: "academics" });
    this.agentMemory.set(idx, { shortTerm: [], longTerm: [], skills: {} });
    this.castles.academy.connectedAgents.push(`LLM-${agentId}`);
    const gk = `agent:LLM-${agentId}`;
    this.knowledgeGraph.upsertNode(gk, KG_NODE.AGENT, String(agentConfig.persona?.role || "Academy Professor"), {
      model: agentConfig.model,
      domain: agentConfig.persona?.domain
    });
    this.knowledgeGraph.link("castle:academies:root", KG_EDGE.TEACHES, gk, 1);
    return idx;
  }

  applyAgentDecision(i, response) {
    if (!response || typeof response !== "object") return;
    const act = String(response.action || "");
    if (!this.capability.allows(act, this.simTime)) return;
    if (response.action === "MOVE") {
      const v = verifyTwistCommand(
        { speed: Math.hypot(Number(response.dx) || 0, Number(response.dz) || 0), x: this.posX[i], y: this.posY[i], z: this.posZ[i] },
        { vMax: 80, xMax: 8000, yMax: 9000, zMax: 8000 }
      );
      if (!v.ok) return;
      this.velX[i] += response.dx || 0;
      this.velZ[i] += response.dz || 0;
      this.isDirty[i] = 1;
    }
    if (response.action === "TEACH") {
      this.discipline[i] += 2;
      const t = response.target;
      if (typeof t === "number" && t >= 0 && t < this.activeCount) {
        this.spawnEvent(i, t, 6, 2.0);
        const tid = this.indexToId[t];
        if (tid) {
          const sid = `cadet:${tid}`;
          this.knowledgeGraph.upsertNode(sid, KG_NODE.MEMORY, "cadet_session", { mentor: this.indexToId[i] });
          this.knowledgeGraph.link(String(this.indexToId[i]), KG_EDGE.TEACHES, sid, 1);
        }
      }
    }
    if (response.action === "SUMMON_PET" || response.action === "SUMMON PET") {
      const petId = `PET-${createCastleUlid()}`;
      const pidx = this.allocate(petId, STATE.GHOSTPET);
      if (pidx >= 0) {
        this.ownerIdx[pidx] = i;
        this.agentPetLink.set(i, pidx);
      }
    }
    const mem = this.agentMemory.get(i);
    if (mem) mem.shortTerm.push(response);
  }

  async runLLMThought(agentIdx, stimulus) {
    const persona = this.agentPersona.get(agentIdx);
    const memory = this.agentMemory.get(agentIdx);
    if (!persona || !memory) return;
    const prompt = {
      role: persona.role,
      traits: persona.traits,
      worldState: {
        position: [this.posX[agentIdx], this.posY[agentIdx], this.posZ[agentIdx]],
        knowledge: this.knowledge[agentIdx],
        academyLevel: this.academyXP[agentIdx]
      },
      memory: memory.shortTerm.slice(-8),
      stimulus
    };
    const response = await callLLMStub(prompt);
    this.applyAgentDecision(agentIdx, response);
  }

  resetAcademyLayer() {
    this.academyXP.fill(0);
    this.knowledge.fill(0);
    this.discipline.fill(0);
    this.curriculumTier.fill(0);
    this.examQueue.length = 0;
    this.graduationQueue.length = 0;
    this.examMode = false;
    this.llmProfiles.clear();
    this.agentMemory.clear();
    this.agentPersona.clear();
    this.agentBindings.clear();
    this.agentPetLink.clear();
    this.knowledgeGraph.clear();
    this.knowledgeGraph.upsertNode("castle:academies:root", KG_NODE.CONCEPT, "Castle Academies", { layer: 11 });
    this.castles.academy.connectedAgents.length = 0;
    this.castles.academy.globalMemory.length = 0;
  }

  /** Cadet ring by curriculum tier + discipline bump */
  runCurriculumOrganize() {
    const cadets = [];
    for (let i = 0; i < this.activeCount; i++) {
      if (this.state[i] === STATE.AGENT_CADET) cadets.push(i);
    }
    cadets.sort((a, b) => this.curriculumTier[a] - this.curriculumTier[b]);
    const n = cadets.length;
    const ringR = 1200;
    const baseY = 3500;
    for (let k = 0; k < n; k++) {
      const i = cadets[k];
      const angle = (k / Math.max(1, n)) * Math.PI * 2;
      this.posX[i] = Math.cos(angle) * ringR;
      this.posZ[i] = Math.sin(angle) * ringR;
      this.posY[i] = baseY + this.curriculumTier[i] * 45;
      this.discipline[i] += 5;
      this.velX[i] *= 0.5;
      this.velZ[i] *= 0.5;
      this.isDirty[i] = 1;
      this.colorDirty[i] = 1;
    }
  }

  tick(dt) {
    const safeDt = Number.isFinite(dt) ? Math.max(0.0001, Math.min(dt, 0.05)) : 0.016;
    const timeScale = safeDt * 60;
    this.simTime += safeDt;
    this.chronos.flushDue(this.simTime);

    let bridgeIdx = -1;
    if (this.bridgeTransit) {
      const b = this.bridgeTransit;
      b.t = (b.t || 0) + safeDt;
      const u = Math.min(1, b.t / b.dur);
      const sm = u * u * (3 - 2 * u);
      const arc = Math.sin(u * Math.PI) * b.arcHeight;
      const i = b.idx;
      bridgeIdx = i;
      if (i >= 0 && i < this.activeCount && this.state[i] !== 0) {
        const f = sm;
        this.posX[i] = b.ax + (b.tx - b.ax) * f + b.perpX * arc * 0.22;
        this.posY[i] = b.ay + (b.ty - b.ay) * f + arc;
        this.posZ[i] = b.az + (b.tz - b.az) * f + b.perpZ * arc * 0.22;
        this.velX[i] = 0;
        this.velY[i] = 0;
        this.velZ[i] = 0;
        this.isDirty[i] = 1;
      }
      if (u >= 1) this.bridgeTransit = null;
    }

    const k = 0.008;
    const damping = Math.pow(0.99, timeScale);

    this.ghostGridHead.fill(-1);
    this.agentGridHead.fill(-1);

    for (let i = 0; i < this.activeCount; i++) {
      if (this.state[i] === 0) continue;

      const px = this.posX[i];
      const py = this.posY[i];
      const pz = this.posZ[i];
      const h = this.spatialHash(px, py, pz);

      if (this.cellHash[i] !== h) this.cellHash[i] = h;

      this.agentGridNext[i] = this.agentGridHead[h];
      this.agentGridHead[h] = i;

      if (this.state[i] === STATE.GHOSTPET) {
        const hg = this.spatialHashGhost(px, py, pz);
        this.ghostGridNext[i] = this.ghostGridHead[hg];
        this.ghostGridHead[hg] = i;
      }
    }

    for (let i = 0; i < this.activeCount; i++) {
      if (this.state[i] === 0) continue;
      if (bridgeIdx === i) continue;

      const px = this.posX[i];
      const py = this.posY[i];
      const pz = this.posZ[i];
      let moved = false;

      if (this.state[i] === STATE.AGENT_CADET || this.state[i] === STATE.AGENT_STUDENT || this.state[i] === STATE.AGENT_MASTER) {
        const knowledgeGain = safeDt * (10 + this.discipline[i] * 0.1);
        this.academyXP[i] += knowledgeGain;
        this.knowledge[i] += knowledgeGain * 0.5;
        const curIdx = this.curriculum.findIndex((c) => this.academyXP[i] < c.req);
        const lvl = curIdx === -1 ? this.curriculum.length - 1 : curIdx;
        this.curriculumTier[i] = lvl;
        this.colorDirty[i] = 1;
      }

      if (this.state[i] === STATE.RHIZOH) {
        const orbitR = 1000;
        const orbitSpeed = this.simTime * 0.2;
        const targetX = Math.cos(orbitSpeed) * orbitR;
        const targetZ = Math.sin(orbitSpeed) * orbitR;
        const targetY = this.targetMode === "GLOBE" ? GLOBE_RADIUS + 1200 : 800;

        this.velX[i] += (targetX - px) * 0.01 * timeScale;
        this.velY[i] += (targetY - py) * 0.01 * timeScale;
        this.velZ[i] += (targetZ - pz) * 0.01 * timeScale;
        moved = true;
        this.isDirty[i] = 1;
      } else if (this.state[i] === STATE.AGENT_PROFESSOR) {
        const nearby = this.findNearbyAgents(i, 800);
        for (let ni = 0; ni < nearby.count; ni++) {
          const s = nearby.ids[ni];
          if (this.state[s] === STATE.AGENT_CADET || this.state[s] === STATE.AGENT_STUDENT) {
            this.academyXP[s] += safeDt * 80;
            this.knowledge[s] += safeDt * 3;
            this.discipline[s] += safeDt * 0.5;
            if (Math.random() < 0.02) this.spawnEvent(i, s, 6, 1.2);
          }
        }
        moved = true;
        this.isDirty[i] = 1;
      } else if (this.state[i] === STATE.GHOSTPET) {
        this.xp[i] += safeDt * 10;
        if (this.xp[i] > 500 && this.petStage[i] === PET_STAGE.SEED) {
          this.petStage[i] = PET_STAGE.BUD;
          this.colorDirty[i] = 1;
          uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "EVOLUTION: PET YÜKSELDİ [BUD]" } });
        }
        if (this.xp[i] > 1500 && this.petStage[i] === PET_STAGE.BUD) {
          this.petStage[i] = PET_STAGE.SPIRIT;
          this.colorDirty[i] = 1;
        }
        if (this.xp[i] > 3000 && this.petStage[i] === PET_STAGE.SPIRIT) {
          this.petStage[i] = PET_STAGE.GUARDIAN;
          this.colorDirty[i] = 1;
        }

        let cohX = 0,
          cohY = 0,
          cohZ = 0,
          aliX = 0,
          aliY = 0,
          aliZ = 0,
          sepX = 0,
          sepY = 0,
          sepZ = 0;
        let count = 0;

        if (this.ownerIdx[i] !== -1 && this.state[this.ownerIdx[i]] !== 0) {
          const ox = this.posX[this.ownerIdx[i]],
            oy = this.posY[this.ownerIdx[i]],
            oz = this.posZ[this.ownerIdx[i]];
          cohX += ox;
          cohY += oy;
          cohZ += oz;
          count++;
        }

        const gcx = Math.floor(px / this.GHOST_CELL_SIZE);
        const gcy = Math.floor(py / this.GHOST_CELL_SIZE);
        const gcz = Math.floor(pz / this.GHOST_CELL_SIZE);
        const neighborPool = this.neighborPoolScratch;
        let neighborCount = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              const hh = this.spatialHashGhost(
                (gcx + dx) * this.GHOST_CELL_SIZE,
                (gcy + dy) * this.GHOST_CELL_SIZE,
                (gcz + dz) * this.GHOST_CELL_SIZE
              );
              let neighborIdx = this.ghostGridHead[hh];
              while (neighborIdx !== -1 && neighborCount < BOID_COLLECT_CAP) {
                if (neighborIdx !== i) {
                  const nx = this.posX[neighborIdx];
                  const ny = this.posY[neighborIdx];
                  const nz = this.posZ[neighborIdx];
                  const dxDist = px - nx;
                  const dyDist = py - ny;
                  const dzDist = pz - nz;
                  const distSq2 = dxDist * dxDist + dyDist * dyDist + dzDist * dzDist;
                  if (distSq2 > 0.001 && distSq2 < 15000) {
                    neighborPool[neighborCount] = neighborIdx;
                    neighborCount++;
                  }
                }
                neighborIdx = this.ghostGridNext[neighborIdx];
              }
            }
          }
        }
        let pickN = neighborCount;
        if (pickN > BOID_NEIGHBOR_CAP) pickN = BOID_NEIGHBOR_CAP;
        if (neighborCount === 0) continue;
        const stride = 17;
        const base = (((this.simTime * 60) | 0) + i * 13) % neighborCount;
        for (let p = 0; p < pickN; p++) {
          const neighborIdx = neighborPool[(base + p * stride) % neighborCount];
          const nx = this.posX[neighborIdx];
          const ny = this.posY[neighborIdx];
          const nz = this.posZ[neighborIdx];
          const dxDist = px - nx;
          const dyDist = py - ny;
          const dzDist = pz - nz;
          const distSq2 = dxDist * dxDist + dyDist * dyDist + dzDist * dzDist;
          cohX += nx;
          cohY += ny;
          cohZ += nz;
          aliX += this.velX[neighborIdx];
          aliY += this.velY[neighborIdx];
          aliZ += this.velZ[neighborIdx];
          const invDist = 1.0 / Math.max(0.1, Math.sqrt(distSq2));
          sepX += dxDist * invDist;
          sepY += dyDist * invDist;
          sepZ += dzDist * invDist;
          count++;
        }

        if (count > 0) {
          cohX /= count;
          cohY /= count;
          cohZ /= count;
          aliX /= count;
          aliY /= count;
          aliZ /= count;

          const stageMult = 1 + this.petStage[i] * 0.2;

          this.velX[i] += ((cohX - px) * 0.0005 * stageMult + aliX * 0.02 + sepX * 0.05) * timeScale;
          this.velY[i] += ((cohY - py) * 0.0005 * stageMult + aliY * 0.02 + sepY * 0.05) * timeScale;
          this.velZ[i] += ((cohZ - pz) * 0.0005 * stageMult + aliZ * 0.02 + sepZ * 0.05) * timeScale;
          moved = true;
        }
      }

      this.posX[i] += this.velX[i] * timeScale;
      this.posY[i] += this.velY[i] * timeScale;
      this.posZ[i] += this.velZ[i] * timeScale;

      const vSq = this.velX[i] * this.velX[i] + this.velY[i] * this.velY[i] + this.velZ[i] * this.velZ[i];
      const distSq = this.posX[i] * this.posX[i] + this.posY[i] * this.posY[i] + this.posZ[i] * this.posZ[i];

      if (this.targetMode === "GLOBE") {
        const squadLane = this.squadId[i] * 2.3;
        const brainLane = this.brainType[i] * 11;
        const targetRadius = GLOBE_RADIUS + 380 + this.orbitShellOffset[i] + squadLane + brainLane * 0.15;

        if (distSq > 100 && this.state[i] !== STATE.GHOSTPET && this.state[i] !== STATE.RHIZOH) {
          const invDist = 1 / Math.sqrt(distSq + 0.0001);
          const dist = distSq * invDist;
          const pull = -k * (dist - targetRadius) * timeScale;
          this.velX[i] += this.posX[i] * invDist * pull;
          this.velY[i] += this.posY[i] * invDist * pull;
          this.velZ[i] += this.posZ[i] * invDist * pull;
          moved = true;

          const wf = 0.028 + this.brainType[i] * 0.0035 + (this.orbitDrift[i] % 1) * 0.018;
          const ph = this.simTime * wf + this.orbitDrift[i] * 12.566 + this.squadId[i] * 0.17;
          const swirl = Math.sin(ph) * 0.14 * timeScale;
          this.velX[i] += -this.posZ[i] * swirl * 0.000018;
          this.velZ[i] += this.posX[i] * swirl * 0.000018;
        }

        const distOffset = Math.abs(Math.sqrt(distSq + 0.0001) - targetRadius);

        if (vSq < 0.0005 && distOffset < 5 && !moved && this.state[i] !== STATE.RHIZOH) {
          this.velX[i] = 0;
          this.velY[i] = 0;
          this.velZ[i] = 0;
          this.isDirty[i] = 0;
        } else {
          this.isDirty[i] = 1;
        }
      } else {
        if (this.state[i] !== STATE.RHIZOH) {
          const targetY = 50 + (i % 200);
          this.velY[i] += (targetY - this.posY[i]) * 0.02 * timeScale;

          if (this.posX[i] > 3000) this.velX[i] -= 0.5 * timeScale;
          if (this.posX[i] < -3000) this.velX[i] += 0.5 * timeScale;
          if (this.posZ[i] > 3000) this.velZ[i] -= 0.5 * timeScale;
          if (this.posZ[i] < -3000) this.velZ[i] += 0.5 * timeScale;

          const lane = 1 + (this.brainType[i] % 10) * 0.012 + (this.squadId[i] % 13) * 0.009;
          this.velX[i] += this.posZ[i] * 0.0001 * timeScale * lane;
          this.velZ[i] -= this.posX[i] * 0.0001 * timeScale * lane;
        }
        this.isDirty[i] = 1;
      }

      this.velX[i] *= damping;
      this.velY[i] *= damping;
      this.velZ[i] *= damping;
    }

    if (this.swarmActive) {
      for (let i = 0; i < this.activeCount; i++) {
        if (this.state[i] !== STATE.CITIZEN) continue;
        this.velX[i] += (Math.random() - 0.5) * 2.5 * timeScale;
        this.velZ[i] += (Math.random() - 0.5) * 2.5 * timeScale;
        this.isDirty[i] = 1;
      }
    }

    if (this.portalCharge > 0) this.portalCharge = Math.max(0, this.portalCharge - safeDt * 0.35);

    const examP = 0.001 * (this.examMode ? 4 : 1);
    if (Math.random() < examP) {
      for (let i = 0; i < this.activeCount; i++) {
        if (this.state[i] >= STATE.AGENT_CADET && this.state[i] <= STATE.AGENT_STUDENT) {
          const score = this.knowledge[i] + this.discipline[i] * 2;
          if (score > 5000 && this.state[i] === STATE.AGENT_STUDENT && !this.graduationQueue.includes(i)) {
            this.graduationQueue.push(i);
          }
        }
      }
    }
    this.processGraduationQueue();
  }
}

const coreWorld = new World(MAX_INSTANCES);

class RealMapCore {
  static isLoaded = false;
  static isLoading = false;
  /** Fatih beacon — zoom / drone targets */
  static castleWorldPos = new THREE.Vector3(0, 320, 0);

  static async loadCity(sceneGroup, onLog) {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;
    try {
      onLog("SATELLITE_LINK: L5 ZONE GENERATION STARTED…");
      this.buildProceduralFallback(sceneGroup);
      this.isLoaded = true;
      onLog("SATELLITE_LINK: ISTANBUL TILE · procedural REAL_MAP injected.");
    } finally {
      this.isLoading = false;
    }
  }

  static buildProceduralFallback(sceneGroup) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x051a30,
      emissive: 0x00ff88,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
      metalness: 0.8
    });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const count = 1600;
    const instanced = new THREE.InstancedMesh(geo, material, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      let x;
      let z;
      if (i < count * 0.9) {
        const lat = ISTANBUL_GEO.latMin + Math.random() * (ISTANBUL_GEO.latMax - ISTANBUL_GEO.latMin);
        const lon = ISTANBUL_GEO.lonMin + Math.random() * (ISTANBUL_GEO.lonMax - ISTANBUL_GEO.lonMin);
        const p = latLonToSceneXZ(lat, lon);
        x = p.x + (Math.random() - 0.5) * 180;
        z = p.z + (Math.random() - 0.5) * 180;
      } else {
        x = (Math.random() - 0.5) * 16000;
        z = (Math.random() - 0.5) * 16000;
      }
      const h = Math.random() > 0.9 ? 520 + Math.random() * 380 : 80 + Math.random() * 160;
      dummy.position.set(x, 0, z);
      dummy.scale.set(45 + Math.random() * 85, h, 45 + Math.random() * 85);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    sceneGroup.add(instanced);

    const fp = latLonToSceneXZ(ISTANBUL_POI.FATIH.lat, ISTANBUL_POI.FATIH.lon);
    RealMapCore.castleWorldPos.set(fp.x, 340, fp.z);

    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xffaa33,
      emissive: 0xff6600,
      emissiveIntensity: 0.85,
      metalness: 0.6,
      roughness: 0.25
    });
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(90, 140, 520, 10), beaconMat);
    spire.position.set(fp.x, 260, fp.z);
    sceneGroup.add(spire);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(160, 1), beaconMat);
    crown.position.set(fp.x, 560, fp.z);
    sceneGroup.add(crown);
  }
}

class RingBuffer {
  constructor(size) {
    this.size = size;
    this.data = new Array(size).fill(null);
    this.head = 0;
  }
  push(item) {
    this.data[this.head] = item;
    this.head = (this.head + 1) % this.size;
  }
  toArray() {
    const result = [];
    for (let i = 0; i < this.size; i++) {
      const idx = (this.head - 1 - i + this.size) % this.size;
      if (this.data[idx]) result.push(this.data[idx]);
    }
    return result;
  }
}

const logBuffer = new RingBuffer(50);
logBuffer.push({ ts: CODEX_DATE, type: "SYS", data: "RHIZOH L0–L13 stack + Sovereign Runtime + Robotics bridge online." });

const layerTransitionRing = new RingBuffer(28);

const uiStore = {
  state: {
    viewMode: "CITIZEN",
    realityMode: "GLOBE",
    /** Cesium REAL_MAP yüzeyi — RealityDirector + gateway fazı ile commit */
    mapSurfaceActive: false,
    lastRealityCommit: null,
    tickCounter: 0,
    activeEntityCount: 0,
    isSatelliteActive: false,
    layerFocus: 10,
    layerTransitionSeq: 0,
    cameraMode: "ORBIT",
    satelliteScanMode: "SIGNAL",
    heatPeak: 0,
    academicsTier: 1,
    district0Energy: 0,
    swarmActive: false,
    greenRoomArm: false,
    portalVisible: false,
    squadCount: 0,
    eventPulseCount: 0,
    /** Rhizoh 3D sahnesi üzerinde yüzen CODEX / medya ankrajı */
    rhizohSceneAnchor: null,
    /** Phase P1 — unified shell: world | hall | greenroom | broadcast | studio | profile */
    productSurface: "world"
  },
  pendingEventPulses: 0,
  listeners: new Set(),
  getState() {
    return this.state;
  },
  subscribe(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  },
  dispatch(action) {
    if (action.type === "EVENT_PULSE") {
      this.pendingEventPulses += 1;
      return;
    }
    if (action.type === "FLUSH_EVENT_PULSES") {
      const pulseCount = this.pendingEventPulses;
      this.pendingEventPulses = 0;
      if (!pulseCount) return;
      this.state = {
        ...this.state,
        tickCounter: this.state.tickCounter + 1,
        eventPulseCount: this.state.eventPulseCount + pulseCount
      };
      this.listeners.forEach((l) => l());
      return;
    }
    if (action.type === "ADD_LOG") {
      logBuffer.push(action.payload);
      this.state = { ...this.state, tickCounter: this.state.tickCounter + 1 };
    } else if (action.type === "SYNC_STATS") {
      const nextCount = Number(action.payload) || 0;
      if (this.state.activeEntityCount === nextCount) return;
      this.state = { ...this.state, activeEntityCount: nextCount };
    } else if (action.type === "SYNC_METRICS") {
      const payload = action.payload && typeof action.payload === "object" ? action.payload : {};
      let changed = false;
      for (const [k, v] of Object.entries(payload)) {
        if (this.state[k] !== v) {
          changed = true;
          break;
        }
      }
      if (!changed) return;
      this.state = { ...this.state, ...payload };
    } else {
      let next = this.state;
      if (action.type === "TOGGLE_VIEW") next = { ...next, viewMode: next.viewMode === "CITIZEN" ? "DEVELOPER" : "CITIZEN" };
      if (action.type === "REALITY_CHANGED") {
        const p = action.payload;
        const mode = p.to ?? p.mode;
        const gw = p.gatewayPhase ?? this.state.lastRealityCommit?.gatewayPhase ?? "unconfigured";
        const mapSurface =
          typeof p.mapSurfaceActive === "boolean" ? p.mapSurfaceActive : computeMapSurfaceActive(mode, gw);
        next = {
          ...next,
          realityMode: mode,
          mapSurfaceActive: mapSurface,
          lastRealityCommit: {
            at: Date.now(),
            gatewayPhase: p.gatewayPhase ?? gw,
            source: p.source,
            durationMs: p.durationMs
          },
          tickCounter: this.state.tickCounter + 1
        };
      }
      if (action.type === "REALITY_ENGINE_SYNC") {
        const p = action.payload;
        const nextMap = !!p.mapSurfaceActive;
        const prevGw = next.lastRealityCommit?.gatewayPhase;
        const nextGw = p.gatewayPhase ?? prevGw;
        if (next.mapSurfaceActive !== nextMap || prevGw !== nextGw) {
          next = {
            ...next,
            mapSurfaceActive: nextMap,
            lastRealityCommit: {
              ...(next.lastRealityCommit || {}),
              at: Date.now(),
              gatewayPhase: nextGw,
              reason: p.reason
            },
            tickCounter: this.state.tickCounter + 1
          };
        }
      }
      if (action.type === "SET_REALITY") {
        coreWorld.targetMode = action.payload;
        const mode = action.payload;
        const gw = this.state.lastRealityCommit?.gatewayPhase ?? "unconfigured";
        next = {
          ...next,
          realityMode: mode,
          mapSurfaceActive: computeMapSurfaceActive(mode, gw)
        };
      }
      if (action.type === "TOGGLE_SATELLITE") next = { ...next, isSatelliteActive: !next.isSatelliteActive };
      if (action.type === "SET_LAYER_FOCUS") {
        const nf = Math.max(0, Math.min(13, action.payload | 0));
        const prev = this.state.layerFocus;
        if (prev !== nf) {
          const fromSpec = LAYER_SPECS.find((x) => x.id === prev);
          const toSpec = LAYER_SPECS.find((x) => x.id === nf);
          layerTransitionRing.push({
            ts: new Date().toLocaleTimeString(),
            from: prev,
            to: nf,
            label: `${fromSpec?.code ?? "?"}→${toSpec?.code ?? "?"} · ${toSpec?.name ?? ""}`
          });
          logBuffer.push({
            ts: new Date().toLocaleTimeString(),
            type: "SYS",
            data: `LAYER · ${fromSpec?.code ?? "?"} → ${toSpec?.code ?? "?"} (${toSpec?.name ?? ""})`
          });
          next = {
            ...next,
            layerFocus: nf,
            layerTransitionSeq: (this.state.layerTransitionSeq || 0) + 1,
            tickCounter: this.state.tickCounter + 1
          };
        }
      }
      if (action.type === "SET_CAMERA_MODE") {
        const mode = action.payload === "DRONE" ? "DRONE" : "ORBIT";
        if (next.cameraMode !== mode) {
          next = { ...next, cameraMode: mode, tickCounter: this.state.tickCounter + 1 };
        }
      }
      if (action.type === "SET_SATELLITE_MODE" && next.satelliteScanMode !== action.payload) {
        next = { ...next, satelliteScanMode: action.payload };
      }
      if (action.type === "TOGGLE_SWARM") {
        coreWorld.swarmActive = !coreWorld.swarmActive;
        next = { ...next, swarmActive: coreWorld.swarmActive };
      }
      if (action.type === "SET_SWARM_ACTIVE") {
        const on = !!action.payload;
        if (coreWorld.swarmActive !== on || next.swarmActive !== on) {
          coreWorld.swarmActive = on;
          next = { ...next, swarmActive: on };
        }
      }
      if (action.type === "SET_GREENROOM") {
        const on = !!action.payload;
        if (next.greenRoomArm !== on) next = { ...next, greenRoomArm: on };
      }
      if (action.type === "SET_PORTAL") {
        const on = !!action.payload;
        if (next.portalVisible !== on || coreWorld.portalCharge !== (on ? 1 : 0)) {
          coreWorld.portalCharge = on ? 1 : 0;
          next = { ...next, portalVisible: on };
        }
      }
      if (action.type === "SET_RHIZOH_SCENE_ANCHOR") {
        const anchor = action.payload ?? null;
        if (next.rhizohSceneAnchor !== anchor) {
          next = { ...next, rhizohSceneAnchor: anchor, tickCounter: this.state.tickCounter + 1 };
        }
      }
      if (action.type === "SET_PRODUCT_SURFACE") {
        const allowed = new Set(["world", "hall", "greenroom", "broadcast", "studio", "profile"]);
        const id = String(action.payload || "");
        if (allowed.has(id) && this.state.productSurface !== id) {
          next = { ...next, productSurface: id, tickCounter: this.state.tickCounter + 1 };
        }
      }
      if (next === this.state) return;
      this.state = next;
    }
    this.listeners.forEach((l) => l());
  }
};

const ARCHETYPE_NAMES = ["", "SCOUT", "GUARD", "HACKER", "BUILDER", "HEALER", "HUNTER"];

function formatRoster(roster) {
  return roster.map((a) => ARCHETYPE_NAMES[a] || "?").join(", ");
}

function pushRhizohEvent(eventType, eventSource, eventTarget, eventEnergy = 1) {
  eventMesh.push({
    eventType,
    eventSource,
    eventTarget,
    eventEnergy,
    eventLifetime: 6 + Math.random() * 8,
    ts: new Date().toLocaleTimeString()
  });
  uiStore.dispatch({ type: "EVENT_PULSE" });
}

const useUISelector = (selector) => {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  return useSyncExternalStore(
    uiStore.subscribe.bind(uiStore),
    useCallback(() => selectorRef.current(uiStore.getState()), [])
  );
};

class ApexEngine {
  constructor(container) {
    this.container = container;
    this.active = true;
    /** Kept in lockstep with uiStore.realityMode via RealityDirector.commitReality */
    this.internalRealityMode = "GLOBE";

    this.slotColorCache = new Uint8Array(coreWorld.MAX).fill(255);

    this._dirCacheX = new Float32Array(coreWorld.MAX).fill(0);
    this._dirCacheY = new Float32Array(coreWorld.MAX).fill(0);
    this._dirCacheZ = new Float32Array(coreWorld.MAX).fill(1);
    this._qCacheX = new Float32Array(coreWorld.MAX).fill(0);
    this._qCacheY = new Float32Array(coreWorld.MAX).fill(0);
    this._qCacheZ = new Float32Array(coreWorld.MAX).fill(0);
    this._qCacheW = new Float32Array(coreWorld.MAX).fill(1);

    this._qTemp = new THREE.Quaternion();
    this._dirTemp = new THREE.Vector3();

    this.camForward = new THREE.Vector3(0, 0, -1);
    this.agentForward = new THREE.Vector3(0, 0, 1);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010103);
    this.scene.fog = new THREE.FogExp2(0x010103, 0.00006);

    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 50, 400000);
    this.targetCamPos = new THREE.Vector3();
    this.targetCamDir = new THREE.Vector3();
    this._camScratch = new THREE.Vector3();

    const win =
      typeof navigator !== "undefined" && /Windows/i.test(String(navigator.userAgent || ""));
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      ...(win ? {} : { powerPreference: "high-performance" })
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    installWebglContextLostReporter(this.renderer.domElement, "three_apex");

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 80;
    this.controls.maxDistance = 180000;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.enabled = false;
    this._zoomAgentCursor = 0;
    this.droneBridge = null;
    this._wallPrev = performance.now();
    this._renderErrorLogged = false;

    /** Kesilebilir otopilot: OrbitControls ile kullanıcı müdahalesi sonrası ~5s programatik hareket yok. */
    this._userAutopilotHoldUntil = 0;
    this._bezierMove = null;
    this._orbitalRaf = null;
    this._autoLookScratch = new THREE.Vector3();
    this._orbitStartHandler = () => this._noteUserCameraIntervention();
    this.controls.addEventListener("start", this._orbitStartHandler);

    this.setupWorld();
    this.setupInstancing();

    this.renderLoop = this.renderLoop.bind(this);
    this.renderLoop();
  }

  setupWorld() {
    this.globeGroup = new THREE.Group();
    this.globe = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x051020, emissive: 0x0a1a3f, emissiveIntensity: 1.2, roughness: 0.1, metalness: 1.0, transparent: true, opacity: 0.9 })
    );
    this.globeGroup.add(this.globe);
    const grid = new THREE.GridHelper(GLOBE_RADIUS * 8, 50, 0x00ffff, 0x0a1a3f);
    grid.position.y = -GLOBE_RADIUS - 100;
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    this.globeGroup.add(grid);
    this.scene.add(this.globeGroup);

    this.realMapGroup = new THREE.Group();
    this.realMapGroup.visible = false;
    const cityGrid = new THREE.GridHelper(20000, 100, 0x00ff88, 0x051020);
    cityGrid.material.opacity = 0.4;
    cityGrid.material.transparent = true;
    this.realMapGroup.add(cityGrid);
    this.scene.add(this.realMapGroup);

    this.satelliteGroup = new THREE.Group();
    const satRing = new THREE.Mesh(
      new THREE.TorusGeometry(8000, 10, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.1, wireframe: true })
    );
    satRing.rotation.x = Math.PI / 2;
    this.satelliteGroup.add(satRing);
    this.satelliteGroup.visible = false;
    this.scene.add(this.satelliteGroup);

    this.bridgeArcGroup = new THREE.Group();
    this.bridgeArcGroup.name = "rhizoh_mirror_bridges";
    this.scene.add(this.bridgeArcGroup);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    this.sunLight = new THREE.DirectionalLight(0x00ffff, 4.0);
    this.sunLight.position.set(10000, 10000, 10000);
    this.scene.add(this.sunLight);
  }

  setupInstancing() {
    const geometry = new THREE.IcosahedronGeometry(80, 1);

    this.agentInstances = new THREE.InstancedMesh(
      geometry,
      new THREE.MeshStandardMaterial({
        roughness: 0,
        metalness: 1,
        emissiveIntensity: 2.5,
        flatShading: true,
        vertexColors: true
      }),
      coreWorld.MAX
    );
    this.agentInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const colorArray = new Float32Array(coreWorld.MAX * 3).fill(1.0);
    this.agentInstances.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
    this.agentInstances.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.agentInstances);
  }

  handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.controls) this.controls.update();
  }

  rollbackPartialRealMapPrepare() {
    if (this.droneBridge) {
      this.droneBridge.dispose();
      this.droneBridge = null;
    }
    this.realMapGroup.visible = false;
  }

  async prepareReality(mode) {
    if (mode !== "REAL_MAP") return;
    this.realMapGroup.visible = false;
    if (!RealMapCore.isLoaded) {
      await RealMapCore.loadCity(this.realMapGroup, () => {});
    }
    if (!this.droneBridge) {
      const cfg = getCastleFlightConfig();
      this.droneBridge = new DroneFlightBridge(this.realMapGroup, cfg);
      this.droneBridge.startSimulated();
      if (cfg.droneTelemetryWs) this.droneBridge.connectTelemetryWs(cfg.droneTelemetryWs);
      if (cfg.gatewayWsUrl) this.droneBridge.connectGatewayMirror(cfg.gatewayWsUrl, cfg.gatewayToken);
    }
  }

  commitReality(mode) {
    this.internalRealityMode = mode;
    const setFog = (d) => {
      const f = this.scene?.fog;
      if (f && typeof f.density === "number") f.density = d;
    };
    if (mode === "REAL_MAP") {
      this.realMapGroup.visible = true;
      setFog(0.00015);
    } else {
      this.realMapGroup.visible = false;
      setFog(0.00006);
      if (this.droneBridge) {
        this.droneBridge.dispose();
        this.droneBridge = null;
      }
    }
  }

  renderLoop() {
    if (!this.active) return;
    requestAnimationFrame(this.renderLoop);

    const nowWall = performance.now();
    const frameDt = Math.min(0.1, Math.max(0.001, (nowWall - this._wallPrev) / 1000));
    this._wallPrev = nowWall;
    recordCastleRuntimeFrame(frameDt);

    const simTime = coreWorld.simTime;
    const activeCount = Math.min(coreWorld.activeCount, coreWorld.MAX);
    const mode = this.internalRealityMode;

    maybePublishWorldTickObservationV0({
      simTime,
      activeCount,
      mode
    });

    const isSat = uiStore.getState().isSatelliteActive;

    if (isSat) {
      this.satelliteGroup.visible = true;
      this.satelliteGroup.rotation.y += 0.001;
      this.satelliteGroup.rotation.z = Math.sin(simTime * 0.1) * 0.1;
    } else {
      this.satelliteGroup.visible = false;
    }

    let matrixBatchDirty = false;
    let colorBatchDirty = false;

    const imArray = this.agentInstances.instanceMatrix.array;
    const icArray = this.agentInstances.instanceColor.array;

    for (let i = 0; i < activeCount; i++) {
      const stateCode = coreWorld.state[i];
      if (stateCode === 0) continue;

      if (coreWorld.isDirty[i]) {
        const px = coreWorld.posX[i];
        const py = coreWorld.posY[i];
        const pz = coreWorld.posZ[i];
        const vx = coreWorld.velX[i];
        const vy = coreWorld.velY[i];
        const vz = coreWorld.velZ[i];

        const speedSq = vx * vx + vy * vy + vz * vz;
        if (speedSq > 0.001) {
          const invSpeed = 1 / Math.sqrt(speedSq);
          const nx = vx * invSpeed;
          const ny = vy * invSpeed;
          const nz = vz * invSpeed;

          const dot = this._dirCacheX[i] * nx + this._dirCacheY[i] * ny + this._dirCacheZ[i] * nz;
          if (dot < 0.999) {
            this._dirCacheX[i] = nx;
            this._dirCacheY[i] = ny;
            this._dirCacheZ[i] = nz;
            this._dirTemp.set(nx, ny, nz);
            this._qTemp.setFromUnitVectors(this.agentForward, this._dirTemp);
            this._qCacheX[i] = this._qTemp.x;
            this._qCacheY[i] = this._qTemp.y;
            this._qCacheZ[i] = this._qTemp.z;
            this._qCacheW[i] = this._qTemp.w;
          }
        }

        let baseS = mode === "REAL_MAP" ? 0.6 : 1.2 + Math.sin(simTime * 3 + i) * 0.2;

        if (stateCode === STATE.RHIZOH) {
          baseS = 6.0 + Math.sin(simTime * 5) * 1.0;
        } else if (stateCode === STATE.AGENT_PROFESSOR) {
          baseS = 2.8 + Math.sin(simTime * 2 + i * 0.01) * 0.25;
        } else if (stateCode === STATE.AGENT_MASTER) {
          baseS = 2.4 + Math.sin(simTime * 3 + i) * 0.15;
        } else if (stateCode === STATE.GHOSTPET) {
          const stage = coreWorld.petStage[i];
          baseS = 1.0 + stage * 0.5;
        }

        const sx = baseS * 0.5,
          sy = baseS * 0.5,
          sz = baseS * 1.5;

        const qx = this._qCacheX[i],
          qy = this._qCacheY[i],
          qz = this._qCacheZ[i],
          qw = this._qCacheW[i];
        const x2 = qx + qx,
          y2 = qy + qy,
          z2 = qz + qz;
        const xx = qx * x2,
          xy = qx * y2,
          xz = qx * z2;
        const yy = qy * y2,
          yz = qy * z2,
          zz = qz * z2;
        const wx = qw * x2,
          wy = qw * y2,
          wz = qw * z2;

        const offset = i * 16;
        imArray[offset + 0] = (1 - (yy + zz)) * sx;
        imArray[offset + 1] = (xy + wz) * sx;
        imArray[offset + 2] = (xz - wy) * sx;
        imArray[offset + 3] = 0;
        imArray[offset + 4] = (xy - wz) * sy;
        imArray[offset + 5] = (1 - (xx + zz)) * sy;
        imArray[offset + 6] = (yz + wx) * sy;
        imArray[offset + 7] = 0;
        imArray[offset + 8] = (xz + wy) * sz;
        imArray[offset + 9] = (yz - wx) * sz;
        imArray[offset + 10] = (1 - (xx + yy)) * sz;
        imArray[offset + 11] = 0;
        imArray[offset + 12] = px;
        imArray[offset + 13] = py;
        imArray[offset + 14] = pz;
        imArray[offset + 15] = 1;

        matrixBatchDirty = true;
      }

      const tierPart = stateCode >= STATE.AGENT_PROFESSOR && stateCode <= STATE.AGENT_MASTER ? coreWorld.curriculumTier[i] : 0;
      const cacheKey = stateCode + coreWorld.petStage[i] * 100 + coreWorld.brainType[i] * 1000 + tierPart * 10000;
      if (coreWorld.colorDirty[i] || this.slotColorCache[i] !== cacheKey) {
        this.slotColorCache[i] = cacheKey;
        coreWorld.colorDirty[i] = 0;

        let r = 0,
          g = 1,
          b = 1;
        if (stateCode === STATE.RHIZOH) {
          r = 0;
          g = 1;
          b = 1;
        } else if (stateCode === STATE.CITIZEN && coreWorld.brainType[i] > 0) {
          const a = coreWorld.brainType[i];
          r = 0.2 + (a % 3) * 0.2;
          g = 0.75;
          b = 0.35 + (a % 5) * 0.1;
        } else if (stateCode === STATE.GHOSTPET) {
          const stage = coreWorld.petStage[i];
          if (stage === PET_STAGE.SEED) {
            r = 0.5;
            g = 0.5;
            b = 0.5;
          } else if (stage === PET_STAGE.BUD) {
            r = 0.2;
            g = 0.8;
            b = 0.2;
          } else if (stage === PET_STAGE.SPIRIT) {
            r = 0.2;
            g = 0.5;
            b = 1.0;
          } else if (stage === PET_STAGE.GUARDIAN) {
            r = 0.8;
            g = 0.2;
            b = 1.0;
          } else {
            r = 1.0;
            g = 0.84;
            b = 0.0;
          }
        } else if (stateCode === STATE.PENDING) {
          r = 1;
          g = 0;
          b = 1;
        } else if (stateCode === STATE.AGENT_PROFESSOR) {
          r = 0.95;
          g = 0.75;
          b = 0.15;
        } else if (stateCode === STATE.AGENT_CADET) {
          r = 0.15;
          g = 0.55;
          b = 0.95;
        } else if (stateCode === STATE.AGENT_STUDENT) {
          r = 0.2;
          g = 0.95;
          b = 0.85;
        } else if (stateCode === STATE.AGENT_MASTER) {
          r = 0.75;
          g = 0.35;
          b = 1.0;
        }

        const cIdx = i * 3;
        icArray[cIdx] = r;
        icArray[cIdx + 1] = g;
        icArray[cIdx + 2] = b;
        colorBatchDirty = true;
      }
    }

    this.agentInstances.count = activeCount;

    if (matrixBatchDirty) this.agentInstances.instanceMatrix.needsUpdate = true;
    if (colorBatchDirty && this.agentInstances.instanceColor) this.agentInstances.instanceColor.needsUpdate = true;

    const camMode = uiStore.getState().cameraMode;
    const layerFocus = uiStore.getState().layerFocus;

    if (camMode === "ORBIT") {
      this.controls.enabled = false;
      let lookTargetY = 500;
      if (mode === "GLOBE") {
        const camAngle = simTime * 0.1;
        const orbitBoost = 1 + (layerFocus / 13) * 0.07;
        this.targetCamPos.set(
          Math.cos(camAngle) * 14000 * orbitBoost,
          5000 + Math.sin(simTime * 0.2) * 1500,
          Math.sin(camAngle) * 14000 * orbitBoost
        );
        this.globe.rotation.y += 0.0003;
        this.globeGroup.visible = true;
        const globMat = this.globe?.material;
        if (globMat && !Array.isArray(globMat) && typeof globMat.opacity === "number" && globMat.opacity < 0.9) globMat.opacity += 0.02;
      } else {
        const cityPan = simTime * 0.05;
        this.targetCamPos.set(Math.cos(cityPan) * 5200, 2100 + Math.sin(simTime * 0.03) * 400, Math.sin(cityPan) * 5200);
        lookTargetY = Math.max(140, RealMapCore.castleWorldPos.y * 0.45);
        const beaconX = RealMapCore.castleWorldPos.x;
        const beaconZ = RealMapCore.castleWorldPos.z;
        this._camScratch.set(beaconX, lookTargetY, beaconZ);
        const globMat = this.globe?.material;
        if (globMat && !Array.isArray(globMat) && typeof globMat.opacity === "number") {
          if (globMat.opacity > 0) globMat.opacity -= 0.02;
          else this.globeGroup.visible = false;
        } else this.globeGroup.visible = false;
      }

      this.camera.position.lerp(this.targetCamPos, 0.022);
      if (mode === "REAL_MAP") {
        this.targetCamDir.copy(this._camScratch).sub(this.camera.position);
        if (this.targetCamDir.lengthSq() > 1e-6) this.targetCamDir.normalize();
        else this.targetCamDir.copy(this.camForward).negate();
      } else {
        this.targetCamDir.set(0, lookTargetY, 0).sub(this.camera.position);
        if (this.targetCamDir.lengthSq() > 1e-6) this.targetCamDir.normalize();
        else this.targetCamDir.copy(this.camForward).negate();
      }
      try {
        if (Number.isFinite(this.targetCamDir.x)) {
          this._qTemp.setFromUnitVectors(this.camForward, this.targetCamDir);
          this.camera.quaternion.slerp(this._qTemp, 0.022);
        }
      } catch {
        /* avoid NaN quaternion from parallel-opposite edge cases */
      }
    } else if (this._bezierMove) {
      const m = this._bezierMove;
      m.t += frameDt;
      const u = Math.min(1, m.t / m.duration);
      const s = u * u * (3 - 2 * u);
      const o = 1 - s;
      this._camScratch
        .copy(m.p0)
        .multiplyScalar(o * o)
        .addScaledVector(m.p1, 2 * o * s)
        .addScaledVector(m.p2, s * s);
      this.camera.position.copy(this._camScratch);
      this.controls.target.copy(m.look);
      this.controls.enabled = false;
      this._autoLookScratch.copy(m.look).sub(this.camera.position);
      if (this._autoLookScratch.lengthSq() > 1e-8) {
        this._autoLookScratch.normalize();
        try {
          this._qTemp.setFromUnitVectors(this.camForward, this._autoLookScratch);
          this.camera.quaternion.slerp(this._qTemp, Math.min(1, 0.12 + frameDt * 4.5));
        } catch {
          /* parallel */
        }
      }
      this.controls.update();
      if (u >= 1) {
        this._bezierMove = null;
        this.controls.enabled = true;
      }
    } else {
      this.controls.enabled = true;
      this.controls.update();
    }

    if (mode === "REAL_MAP" && this.droneBridge) {
      try {
        this.droneBridge.tick(simTime, frameDt);
      } catch (e) {
        if (!this._renderErrorLogged) {
          console.error("[CASTLE_DRONE_BRIDGE]", e);
          this._renderErrorLogged = true;
        }
      }
    }

    try {
      if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
    } catch (e) {
      if (!this._renderErrorLogged) {
        console.error("[CASTLE_APEX_RENDER]", e);
        this._renderErrorLogged = true;
      }
    }
  }

  setCameraMode(mode) {
    uiStore.dispatch({ type: "SET_CAMERA_MODE", payload: mode === "DRONE" ? "DRONE" : "ORBIT" });
  }

  isAutopilotAllowed() {
    return performance.now() >= this._userAutopilotHoldUntil;
  }

  _noteUserCameraIntervention() {
    this._userAutopilotHoldUntil = performance.now() + 5000;
    this._cancelProgrammaticCamera();
  }

  _cancelProgrammaticCamera() {
    if (this._orbitalRaf != null) {
      cancelAnimationFrame(this._orbitalRaf);
      this._orbitalRaf = null;
    }
    this._bezierMove = null;
  }

  /**
   * İki nokta arasında kontrol noktası yükseltilmiş quadratic Bezier — düz lerp yerine "swoop".
   */
  _beginBezierCameraTo(tx, ty, tz, distance, opts = {}) {
    const duration = opts.duration ?? 1.85;
    const cinematicBias = opts.cinematicBias ?? 0.62;
    if (!this.isAutopilotAllowed()) {
      this._focusWorldPointImpl(tx, ty, tz, distance, { instant: true });
      return;
    }
    this._cancelProgrammaticCamera();
    this.setCameraMode("DRONE");
    this.controls.enabled = false;

    const target = new THREE.Vector3(Number(tx) || 0, Number(ty) || 0, Number(tz) || 0);
    const p0 = this.camera.position.clone();
    const toT = this._dirTemp.subVectors(target, p0);
    const distTo = toT.length();
    if (distTo < 2) {
      this._focusWorldPointImpl(tx, ty, tz, distance, { instant: true });
      return;
    }
    toT.normalize();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().copy(toT).cross(worldUp);
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    else side.normalize();

    const p2 = target
      .clone()
      .addScaledVector(side, distance * 0.42)
      .addScaledVector(worldUp, distance * 0.29 * cinematicBias)
      .addScaledVector(toT, -distance * 0.09);

    const p1 = p0.clone().lerp(p2, 0.46);
    p1.addScaledVector(worldUp, distance * (0.2 + 0.14 * cinematicBias));
    p1.addScaledVector(side, distance * 0.12);

    this._bezierMove = {
      t: 0,
      duration,
      p0,
      p1,
      p2,
      look: new THREE.Vector3(Number(tx) || 0, Number(ty) || 0, Number(tz) || 0)
    };
  }

  /** L9 büyük olay: çapraz çerçeve + bezier yaklaşma */
  frameL9CinematicEvent(detail) {
    enqueueApexCameraAfterCesiumIfNeeded(() => this._frameL9CinematicEventImpl(detail), "L9 sinematik");
  }

  _frameL9CinematicEventImpl(detail) {
    if (!detail || !this.isAutopilotAllowed()) return;
    let wx;
    let wy;
    let wz;
    const idx = detail.agentIdx;
    if (typeof idx === "number" && idx >= 0 && idx < coreWorld.activeCount && coreWorld.state[idx] !== 0) {
      wx = coreWorld.posX[idx];
      wy = coreWorld.posY[idx];
      wz = coreWorld.posZ[idx];
    } else if (Number.isFinite(detail.lat) && Number.isFinite(detail.lon)) {
      const xz = latLonToSceneXZ(detail.lat, detail.lon);
      wx = xz.x;
      wy = 220;
      wz = xz.z;
    } else {
      const p = RealMapCore.castleWorldPos;
      wx = p.x;
      wy = p.y;
      wz = p.z;
    }
    const cnt = Number(detail.agentCount) || 0;
    const dist = 1580 + Math.min(900, cnt * 42);
    const dur = 2.0 + Math.min(0.75, cnt * 0.025);
    this._beginBezierCameraTo(wx, wy, wz, dist, { duration: dur, cinematicBias: 0.98 });
  }

  /** Çoklu kale köprüleri: parabolik enerji arkı (Line). */
  setRhizohMirrorBridges(arcs) {
    if (!this.bridgeArcGroup) return;
    while (this.bridgeArcGroup.children.length) {
      const ch = this.bridgeArcGroup.children.pop();
      this.bridgeArcGroup.remove(ch);
      if (ch.geometry) ch.geometry.dispose();
      if (ch.material) ch.material.dispose();
    }
    for (const a of arcs || []) {
      const ax = Number(a.ax) || 0;
      const ay = Number(a.ay) || 0;
      const az = Number(a.az) || 0;
      const bx = Number(a.bx) || 0;
      const by = Number(a.by) || 0;
      const bz = Number(a.bz) || 0;
      const mid = new THREE.Vector3((ax + bx) / 2, Math.max(ay, by) + 1600 + Math.hypot(bx - ax, bz - az) * 0.12, (az + bz) / 2);
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(ax, ay, az), mid, new THREE.Vector3(bx, by, bz));
      const pts = curve.getPoints(56);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const line = new THREE.Line(geo, mat);
      this.bridgeArcGroup.add(line);
    }
  }

  focusWorldPoint(x, y, z, distance = 1600, opts = {}) {
    enqueueApexCameraAfterCesiumIfNeeded(() => this._focusWorldPointImpl(x, y, z, distance, opts), "dünya odak");
  }

  _focusWorldPointImpl(x, y, z, distance = 1600, opts = {}) {
    const instant = opts.instant === true || !this.isAutopilotAllowed();
    if (instant) this._cancelProgrammaticCamera();
    uiStore.dispatch({ type: "SET_CAMERA_MODE", payload: "DRONE" });
    if (instant) {
      this.controls.target.set(x, y, z);
      this.camera.position.set(x + distance * 0.48, y + distance * 0.32, z + distance * 0.52);
      this.controls.update();
      return;
    }
    this._beginBezierCameraTo(x, y, z, distance, {
      duration: opts.duration ?? 1.72,
      cinematicBias: opts.cinematicBias ?? 0.55
    });
  }

  focusNextAgent() {
    const n = coreWorld.activeCount;
    if (n <= 0) return -1;
    for (let step = 0; step < n; step++) {
      const i = this._zoomAgentCursor % n;
      this._zoomAgentCursor++;
      if (coreWorld.state[i] !== 0) {
        const d = 720 + (coreWorld.brainType[i] % 7) * 130 + (coreWorld.squadId[i] % 6) * 95;
        this.focusWorldPoint(coreWorld.posX[i], coreWorld.posY[i], coreWorld.posZ[i], d);
        return i;
      }
    }
    return -1;
  }

  focusCastleBeacon() {
    const p = RealMapCore.castleWorldPos;
    this.focusWorldPoint(p.x, p.y, p.z, 2600);
  }

  focusIstanbulPOI(key) {
    const poi = ISTANBUL_POI[key];
    if (!poi) return;
    const xz = latLonToSceneXZ(poi.lat, poi.lon);
    this.focusWorldPoint(xz.x, 200, xz.z, 3000);
  }

  /** Onay sonrası sinematik tur: hedef etrafında hızlı orbital sweep */
  runOrbitalSweepAt(x, y, z, opts = {}) {
    enqueueApexCameraAfterCesiumIfNeeded(() => this._runOrbitalSweepAtImpl(x, y, z, opts), "orbital sweep");
  }

  _runOrbitalSweepAtImpl(x, y, z, opts = {}) {
    if (!this.isAutopilotAllowed()) return;
    this._cancelProgrammaticCamera();
    const durationMs = opts.durationMs ?? 1400;
    const radius = opts.radius ?? 920;
    const target = new THREE.Vector3(Number(x) || 0, Number(y) || 0, Number(z) || 0);
    this.setCameraMode("DRONE");
    this.controls.enabled = false;
    const start = performance.now();
    const step = (now) => {
      if (!this.active) {
        this._orbitalRaf = null;
        return;
      }
      const t = Math.min(1, (now - start) / durationMs);
      const ang = t * Math.PI * 2;
      const ox = Math.cos(ang) * radius;
      const oz = Math.sin(ang) * radius;
      this.controls.target.copy(target);
      this.camera.position.set(target.x + ox, target.y + 480 + t * 220, target.z + oz);
      this.controls.update();
      if (t < 1) {
        this._orbitalRaf = requestAnimationFrame(step);
      } else {
        this._orbitalRaf = null;
        this.controls.enabled = true;
      }
    };
    this._orbitalRaf = requestAnimationFrame(step);
  }

  /** Kısa süreli “sinyal halesi” — torus mesh, sahneye eklenir ve soluklar */
  emitSignalHaloFlash(x, y, z) {
    const gx = Number(x) || 0;
    const gy = Number(y) || 0;
    const gz = Number(z) || 0;
    const geo = new THREE.TorusGeometry(140, 10, 10, 40);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.82
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(gx, gy + 160, gz);
    mesh.rotation.x = Math.PI / 2;
    this.scene.add(mesh);
    const begin = performance.now();
    const fade = () => {
      const e = performance.now() - begin;
      mat.opacity = Math.max(0, 0.82 - e * 0.0011);
      mesh.scale.multiplyScalar(1.025);
      if (mat.opacity > 0.02) requestAnimationFrame(fade);
      else {
        this.scene.remove(mesh);
        geo.dispose();
        mat.dispose();
      }
    };
    requestAnimationFrame(fade);
  }

  terminate() {
    this.active = false;
    this._cancelProgrammaticCamera();
    if (this.controls && this._orbitStartHandler) {
      try {
        this.controls.removeEventListener("start", this._orbitStartHandler);
      } catch {
        /* noop */
      }
    }
    if (this.bridgeArcGroup) {
      this.setRhizohMirrorBridges([]);
    }
    if (this.droneBridge) {
      this.droneBridge.dispose();
      this.droneBridge = null;
    }
    if (this.controls) this.controls.dispose();
    this.scene.traverse((object) => {
      if (!object.isMesh && !object.isInstancedMesh && !object.isLine) return;
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
        else object.material.dispose();
      }
    });

    try {
      const el = this.renderer?.domElement;
      if (this.container && el && this.container.contains(el)) this.container.removeChild(el);
    } catch {
      /* dom may already be detached */
    }
    this.renderer.dispose();
  }
}

const SovereignHud = memo(({ engineRef }) => {
  const viewMode = useUISelector((s) => s.viewMode);
  const realityMode = useUISelector((s) => s.realityMode);
  const isSatActive = useUISelector((s) => s.isSatelliteActive);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(Math.floor(coreWorld.simTime * 10) / 10), 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const substrate = companyRuntimeRef.current?.substrate;
      if (!substrate) return;
      setSubstrateSnapshot(substrate.getSnapshot());
      setSubstrateEvents(substrate.getEventLog({ limit: 12 }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const seen = window.localStorage.getItem("rhizoh_intro_seen_v1") === "1";
    setReturningUser(seen);
    introStartedAtRef.current = Date.now();
    const interval = setInterval(() => {
      setCinematicElapsedMs(Date.now() - introStartedAtRef.current);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const toggleReality = () => {
    const nextMode = realityMode === "GLOBE" ? "REAL_MAP" : "GLOBE";
    void setRealityMode(nextMode, { source: "HUD" });
  };

  const toggleSatellite = () => {
    uiStore.dispatch({ type: "TOGGLE_SATELLITE" });
    uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L4: UYDU KATMANI TOGGLE" } });
  };

  return (
    <div className="flex flex-col gap-6 pointer-events-auto">
      <div className="bg-[#0a0f1d]/95 backdrop-blur-3xl border border-cyan-400/40 p-7 rounded-[2.5rem] flex items-center gap-6 shadow-[0_0_60px_rgba(0,255,255,0.15)] ring-1 ring-white/10 transition-all">
        <div
          onClick={() => uiStore.dispatch({ type: "TOGGLE_VIEW" })}
          className={`p-5 rounded-3xl cursor-pointer transition-all duration-700 ${viewMode === "DEVELOPER" ? "bg-rose-500 shadow-[0_0_40px_#f43f5e]" : "bg-cyan-400 shadow-[0_0_40px_#00ffff]"}`}
        >
          {viewMode === "DEVELOPER" ? <ShieldAlert size={30} className="text-black" /> : <Orbit size={30} className="text-black animate-spin-slow" />}
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-widest text-white uppercase">{viewMode}</h1>
          <div className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.5em]">
            {CODEX_VERSION} • {tick}s
          </div>
          <p className="text-[8px] text-white/45 mt-3 normal-case tracking-wide font-semibold leading-snug max-w-[28rem]">
            LLM MMO city simulation (research sandbox) · Playable game (real-time multiplayer feel) · Agent marketplace + user-owned AI ecosystem · Castle Genesis production platform
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={toggleReality}
          className={`flex-1 relative overflow-hidden group flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-500 shadow-2xl backdrop-blur-md ${realityMode === "REAL_MAP" ? "bg-emerald-950/80 border-emerald-500/50 hover:bg-emerald-900" : "bg-indigo-950/80 border-indigo-500/50 hover:bg-indigo-900"}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          {realityMode === "REAL_MAP" ? <MapIcon size={28} className="text-emerald-400" /> : <Globe size={28} className="text-indigo-400" />}
          <div className="text-left z-10">
            <div className="text-[10px] text-white/50 tracking-[0.3em] font-black uppercase">Active Layer</div>
            <div className={`text-lg font-black tracking-widest ${realityMode === "REAL_MAP" ? "text-emerald-400" : "text-indigo-400"}`}>
              {realityMode === "REAL_MAP" ? "REAL CITY 3D (CESIUM)" : "ABSTRACT GLOBE"}
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={toggleSatellite}
          className={`p-5 rounded-[2rem] border flex items-center justify-center transition-all cursor-pointer ${isSatActive ? "bg-amber-500/20 border-amber-400/50 text-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]" : "bg-white/5 border-white/10 text-white/30 hover:text-amber-300/80"}`}
          aria-pressed={isSatActive}
        >
          <Satellite size={28} className={isSatActive ? "animate-pulse" : ""} />
        </button>
      </div>

      <div className="bg-[#050a14]/90 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] w-[450px] text-left shadow-2xl border-t-cyan-500/20">
         <div className="text-[10px] text-cyan-400 tracking-[0.5em] mb-6 flex items-center gap-2 uppercase font-black">
            <Layers size={16} className="animate-pulse text-rose-400" /> LOG STREAM (L10 FEED)
         </div>
        <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar flex flex-col">
          <LogList />
        </div>
      </div>
    </div>
  );
});

const LogList = memo(() => {
  useUISelector((s) => s.tickCounter);
  const logs = logBuffer.toArray();
  return logs.map((l, i) => (
    <div key={i} className="text-[10px] text-white/60 font-mono flex gap-3 border-b border-white/5 pb-2 hover:text-cyan-300 transition-colors group">
      <span className={`${l.type === "ERR" ? "text-rose-500" : l.type === "WARN" ? "text-amber-400" : "text-cyan-500"} group-hover:animate-pulse`}>
        [{String(l.ts).split(" ")[0] || l.ts}]›
      </span>{" "}
      {l.data}
    </div>
  ));
});

const LayerStackMini = memo(() => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  return (
    <div className="rounded-2xl p-3" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] text-cyan-500/90 tracking-[0.35em] mb-2 font-black flex items-center gap-2">
        <Cpu size={12} /> L0–L13 RHIZOH STACK
      </div>
      <div className="flex flex-wrap gap-1">
        {LAYER_SPECS.map((L) => (
          <button
            key={L.code}
            type="button"
            onClick={() => {
              uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: L.id });
              pushRhizohEvent("LAYER_FOCUS", "Rhizoh", L.code, L.id / 10);
            }}
            className={`text-[8px] px-2 py-1 rounded-lg border transition-colors ${focus === L.id ? "border-cyan-400 text-cyan-200 bg-cyan-500/10" : "border-white/10 text-white/45 hover:border-white/25"}`}
            title={L.name}
          >
            {L.code}
          </button>
        ))}
      </div>
      <div className="text-[8px] text-white/35 mt-2 font-mono">{LAYER_SPECS.find((x) => x.id === focus)?.name || "—"}</div>
    </div>
  );
});

const LayerRail = memo(() => {
  useUISelector((s) => s.layerTransitionSeq);
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const rows = layerTransitionRing.toArray();
  return (
    <div className="rounded-2xl p-3 max-h-36 overflow-y-auto no-scrollbar" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] text-cyan-400 tracking-[0.3em] mb-2 font-black flex items-center gap-2">
        <Layers size={14} /> KATMAN GEÇİŞLERİ
      </div>
      {rows.length === 0 ? (
        <div className="text-[8px] text-white/35 normal-case font-semibold">L0–L13 düğmeleri veya komut: LAYER 7 · L12=META · L13=ROBOTICS</div>
      ) : (
        <div className="space-y-1 text-[8px] text-white/65 font-mono">
          {rows.map((r, i) => (
            <div key={`${r.ts}-${i}`} className="border-b border-white/5 pb-1">
              <span className="text-cyan-500">{r.ts}</span> · {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const LayerExperiencePanel = memo(({ engineRef }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const reality = useUISelector((s) => s.realityMode);
  const camera = useUISelector((s) => s.cameraMode);
  const isSat = useUISelector((s) => s.isSatelliteActive);
  const profile = LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10];
  const spec = LAYER_SPECS.find((l) => l.id === focus) || LAYER_SPECS[10];
  const tinyBtn = "text-[8px] px-2 py-1.5 rounded-lg border font-bold transition-colors";

  const runQuickAction = async (action) => {
    const log = (data) =>
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data }
      });

    if (action === "ZOOM CASTLE") {
      await setRealityMode("REAL_MAP", { source: "LAYER_QUICK" });
      const eng = engineRef.current;
      const c = window.__CASTLE_CESIUM__;
      if (c?.focusCastle) c.focusCastle();
      else eng?.focusCastleBeacon();
      log("LAYER ACTION · Zoom castle");
      return;
    }

    const engine = engineRef.current;
    if (!engine) return;

    if (action === "ZOOM AGENT") {
      engine.focusNextAgent();
      log("LAYER ACTION · Zoom agent");
      return;
    }
    log(`LAYER ACTION · Komut terminali: ${action}`);
  };

  const applyLayerPreset = async (id) => {
    const p = LAYER_UI_PROFILES[id];
    const engine = engineRef.current;
    if (!p) return;

    uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: id });
    if (p.reality) {
      await setRealityMode(p.reality, { source: "LAYER_PRESET" });
    }
    if (engine && p.camera) engine.setCameraMode(p.camera);
    const satShouldBe = !!p.satellite;
    if (satShouldBe !== isSat) uiStore.dispatch({ type: "TOGGLE_SATELLITE" });

    uiStore.dispatch({
      type: "ADD_LOG",
      payload: {
        ts: new Date().toLocaleTimeString(),
        type: "SYS",
        data: `LAYER PRESET · ${spec.code} (${spec.name}) · ${p.reality}/${p.camera}${satShouldBe ? " + SAT" : ""}`
      }
    });
  };

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: profile.theme.bg, border: `1px solid ${profile.theme.border}` }}>
      <div className="text-[9px] text-cyan-300 tracking-[0.35em] flex items-center gap-2 font-black">
        <Layers size={14} /> LAYER EXPERIENCE
      </div>
      <div className="rounded-xl border border-white/10 p-3 bg-white/[0.03]">
        <div className="text-[8px] text-white/45 tracking-[0.25em]">{spec.code}</div>
        <div className="text-xs text-white font-black mt-1">{spec.name}</div>
        <div className="text-[9px] text-cyan-100 mt-2">{profile.mission}</div>
        <div className="text-[8px] text-white/45 mt-1 leading-relaxed">{profile.detail}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[8px]">
        <div className="rounded-lg border border-white/10 p-2 bg-black/25 text-white/70">Reality: <span className="text-white">{reality}</span></div>
        <div className="rounded-lg border border-white/10 p-2 bg-black/25 text-white/70">Camera: <span className="text-white">{camera}</span></div>
        <div className="rounded-lg border border-white/10 p-2 bg-black/25 text-white/70">Satellite: <span className="text-white">{isSat ? "ON" : "OFF"}</span></div>
        <div className="rounded-lg border border-white/10 p-2 bg-black/25 text-white/70">Preset: <span className="text-white">{profile.reality}/{profile.camera}</span></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${tinyBtn} border-cyan-400/35 text-cyan-100`} onClick={() => void applyLayerPreset(focus)}>
          Katman preset uygula
        </button>
        {profile.quickActions.map((action) => (
          <button
            key={action}
            type="button"
            className={`${tinyBtn} border-white/15 text-white/70 hover:border-cyan-400/35`}
            onClick={() => void runQuickAction(action)}
          >
            {action}
          </button>
        ))}
      </div>
      <div className="text-[8px] text-white/35 leading-relaxed">
        L0-L13 arasında geçişte artık yalnızca log değil, katman bazlı görev, görünüm preset'i ve hızlı operasyon butonları uygulanır.
      </div>
    </div>
  );
});

const CameraFlightDeck = memo(({ engineRef }) => {
  const camMode = useUISelector((s) => s.cameraMode);
  const reality = useUISelector((s) => s.realityMode);
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const btn = "text-[8px] px-2 py-1.5 rounded-lg border font-bold transition-colors";
  const flyRealMapThen = async (fn) => {
    await setRealityMode("REAL_MAP", { source: "CAMERA_DECK" });
    const e = engineRef.current;
    if (e) fn(e);
  };
  const flyCesium = async (action) => {
    await setRealityMode("REAL_MAP", { source: "CAMERA_DECK" });
    const c = window.__CASTLE_CESIUM__;
    if (!c) return false;
    if (action === "castle") c.focusCastle?.();
    else if (action && action.startsWith("poi:")) c.focusPOI?.(action.slice(4));
    else c.flyToIstanbul?.();
    return true;
  };
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] text-sky-300 tracking-[0.35em] flex flex-wrap items-center gap-2 font-black">
        <Camera size={14} /> KAMERA · <span className="text-white">{camMode}</span>
        <span className="text-white/40 font-mono normal-case tracking-normal">{reality === "REAL_MAP" ? "İstanbul REAL_MAP" : "Globe"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${btn} border-emerald-500/45 ${camMode === "ORBIT" ? "bg-emerald-500/15 text-emerald-200" : "border-white/15 text-white/55"}`} onClick={() => engineRef.current?.setCameraMode("ORBIT")}>
          Orbit auto
        </button>
        <button type="button" className={`${btn} border-amber-500/45 ${camMode === "DRONE" ? "bg-amber-500/15 text-amber-200" : "border-white/15 text-white/55"}`} onClick={() => engineRef.current?.setCameraMode("DRONE")}>
          Drone free
        </button>
        <button type="button" className={`${btn} border-cyan-500/40 text-cyan-100`} onClick={() => engineRef.current?.focusNextAgent()}>
          Zoom agent
        </button>
        <button
          type="button"
          className={`${btn} border-orange-400/45 text-orange-100`}
          onClick={() =>
            void (async () => {
              const ok = await flyCesium("castle");
              if (!ok) await flyRealMapThen((e) => e.focusCastleBeacon());
            })()
          }
        >
          Zoom castle
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Navigation2 size={12} className="text-white/35 shrink-0" />
        {["FATIH", "KADIKOY", "BESIKTAS", "USKUDAR"].map((k) => (
          <button
            key={k}
            type="button"
            className={`${btn} border-white/12 text-white/70 normal-case tracking-normal`}
            onClick={() =>
              void (async () => {
                const ok = await flyCesium(`poi:${k}`);
                if (!ok) await flyRealMapThen((e) => e.focusIstanbulPOI(k));
              })()
            }
          >
            {ISTANBUL_POI[k].label}
          </button>
        ))}
      </div>
      <p className="text-[7px] text-white/40 normal-case tracking-wide leading-relaxed font-semibold">
        Drone: sürükleyerek dön · tekerlek zoom · orta tuş kaydır. Gerçek şehir için önce “PROCEDURAL CITY” (REAL_MAP).
      </p>
    </div>
  );
});

const CastleAcademicsCard = memo(() => {
  const tier = useUISelector((s) => s.academicsTier);
  const nexus = useUISelector((s) => s.district0Energy);
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  return (
    <div className="rounded-[2rem] p-5 backdrop-blur-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[10px] text-violet-300 tracking-[0.4em] mb-2 flex items-center gap-2 font-black uppercase">
        <GraduationCap size={16} /> Castle Academics
      </div>
      <p className="text-[9px] text-white/55 leading-relaxed uppercase tracking-widest mb-3">
        L8 district index 0 · agents with archetypes gain XP · ties to GreenRoom / Spiral training loops.
      </p>
      <div className="text-sm font-mono text-violet-200">
        Tier <span className="text-white">{tier}</span> · Nexus Δ <span className="text-emerald-300">{nexus.toFixed(1)}</span>
      </div>
      <div className="text-[8px] text-white/35 mt-2">1500 procedural boxes · {MAX_DISTRICTS} districts · heatmap 256²</div>
    </div>
  );
});

const EventMeshMini = memo(() => {
  useUISelector((s) => s.tickCounter);
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const rows = eventMesh.recent(8);
  return (
    <div className="rounded-2xl p-3" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] text-fuchsia-300/90 tracking-[0.3em] mb-2 font-black">L9 EVENT MESH</div>
      <div className="text-[9px] text-white/55 space-y-1 max-h-28 overflow-y-auto font-mono no-scrollbar">
        {rows.length === 0 ? <span className="text-white/30">awaiting pulses…</span> : null}
        {rows.map((ev, i) => (
          <div key={i}>
            {ev.ts} · {ev.eventType} · {ev.eventSource}→{ev.eventTarget} · ε{ev.eventEnergy.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
});

const MyLLMConnectionsPanel = memo(({ selectedConnectionId, onSelectConnection }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [items, setItems] = useState([]);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState("idle");
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const apiBase = getRhizohApiBase();
  const headers = {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };

  const loadConnections = async () => {
    try {
      const res = await fetch(`${apiBase}/llm/connections`, { headers });
      const json = await res.json();
      if (json?.ok) {
        setItems(Array.isArray(json.items) ? json.items : []);
        if (!selectedConnectionId) {
          const d = (json.items || []).find((x) => x.isDefault) || json.items?.[0];
          if (d?.id) onSelectConnection(d.id);
        }
      }
    } catch {
      /* keep silent in UI */
    }
  };

  useEffect(() => {
    void loadConnections();
  }, []);

  const createConn = async () => {
    if (!provider || !model || !apiKey) return;
    setStatus("saving");
    try {
      const res = await fetch(`${apiBase}/llm/connections`, {
        method: "POST",
        headers,
        body: JSON.stringify({ provider, model, apiKey, label, isDefault: items.length === 0 })
      });
      const json = await res.json();
      if (json?.ok) {
        setItems(json.items || []);
        setApiKey("");
        if (json?.id) onSelectConnection(json.id);
        setStatus("saved");
      } else {
        setStatus(`err:${json?.error || "create_failed"}`);
      }
    } catch {
      setStatus("err:create_failed");
    }
  };

  const setDefault = async (id) => {
    try {
      const res = await fetch(`${apiBase}/llm/connections/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isDefault: true })
      });
      const json = await res.json();
      if (json?.ok) {
        setItems(json.items || []);
        onSelectConnection(id);
      }
    } catch {
      /* noop */
    }
  };

  const removeConn = async (id) => {
    try {
      const res = await fetch(`${apiBase}/llm/connections/${id}`, { method: "DELETE", headers });
      const json = await res.json();
      if (json?.ok) {
        const next = json.items || [];
        setItems(next);
        if (selectedConnectionId === id) onSelectConnection(next[0]?.id || "");
      }
    } catch {
      /* noop */
    }
  };

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">MY LLM CONNECTIONS</div>
      <div className="grid grid-cols-2 gap-2">
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Google Gemini</option>
          <option value="xai">xAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="mistral">Mistral</option>
          <option value="openrouter">OpenRouter</option>
        </select>
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="model" className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label" className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="api key" className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      </div>
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={createConn}>
          Kaydet
        </button>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void loadConnections()}>
          Yenile
        </button>
        <span className="text-[8px] text-white/40 self-center">{status}</span>
      </div>
      <div className="space-y-2 max-h-28 overflow-y-auto no-scrollbar">
        {items.length === 0 ? <div className="text-[8px] text-white/40">Kayıt yok.</div> : null}
        {items.map((it) => (
          <div key={it.id} className={`rounded border px-2 py-1 text-[8px] ${selectedConnectionId === it.id ? "border-cyan-300 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}>
            <div className="text-white/80 normal-case">{it.label || `${it.provider}:${it.model}`}</div>
            <div className="text-white/45 normal-case">{it.provider} · {it.model} · {it.keyMask}</div>
            <div className="flex gap-2 mt-1">
              <button type="button" className={`${btn} border-white/15 text-white/70`} onClick={() => onSelectConnection(it.id)}>Kullan</button>
              <button type="button" className={`${btn} border-white/15 text-white/70`} onClick={() => void setDefault(it.id)}>Default</button>
              <button type="button" className={`${btn} border-rose-400/35 text-rose-200`} onClick={() => void removeConn(it.id)}>Sil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const AgentIdentityLabPanel = memo(({ selectedAgentId, onSelectAgent }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [items, setItems] = useState([]);
  const [agentId, setAgentId] = useState("");
  const [role, setRole] = useState("AGENT_STUDENT");
  const [status, setStatus] = useState("");
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const load = async () => {
    try {
      const res = await fetch(`${apiBase}/agents/identities`, { headers });
      const json = await res.json();
      if (json?.ok) {
        setItems(json.items || []);
        if (!selectedAgentId && json.items?.[0]?.id) onSelectAgent(json.items[0].id);
      }
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!agentId.trim()) return;
    setStatus("saving");
    try {
      const res = await fetch(`${apiBase}/agents/identities`, {
        method: "POST",
        headers,
        body: JSON.stringify({ agentId: agentId.trim(), role, capabilityLevel: 1, personaSeed: { style: "adaptive" } })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("saved");
        setAgentId("");
        await load();
        if (json?.row?.id) onSelectAgent(json.row.id);
      } else setStatus(`err:${json?.error || "failed"}`);
    } catch {
      setStatus("err:failed");
    }
  };

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">AGENT IDENTITY LAB</div>
      <div className="flex gap-2">
        <input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="agent-id" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="AGENT_CADET">CADET</option>
          <option value="AGENT_STUDENT">STUDENT</option>
          <option value="AGENT_PROFESSOR">PROFESSOR</option>
          <option value="AGENT_MASTER">MASTER</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={create}>Kayıt</button>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void load()}>Yenile</button>
        <span className="text-[8px] text-white/40 self-center">{status}</span>
      </div>
      <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
        {items.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`w-full text-left text-[8px] rounded border px-2 py-1 normal-case ${selectedAgentId === a.id ? "border-cyan-300 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}
            onClick={() => onSelectAgent(a.id)}
          >
            {a.id} · {a.role} · rank {a?.progress?.academyRank ?? 1}
          </button>
        ))}
      </div>
    </div>
  );
});

const AcademyEventRoomPanel = memo(({ selectedAgentId }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [items, setItems] = useState([]);
  const [type, setType] = useState("LECTURE");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const load = async () => {
    try {
      const res = await fetch(`${apiBase}/academy/events`, { headers });
      const json = await res.json();
      if (json?.ok) setItems(json.items || []);
    } catch {
      /* noop */
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const queueEvent = async () => {
    setStatus("queueing");
    try {
      const participants = selectedAgentId ? [{ agentId: selectedAgentId, role: "focus" }] : [];
      const res = await fetch(`${apiBase}/academy/events`, {
        method: "POST",
        headers,
        body: JSON.stringify({ type, topic: topic || "academy session", participants, roomId: "academy-main" })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("queued");
        setTopic("");
        await load();
      } else setStatus(`err:${json?.error || "failed"}`);
    } catch {
      setStatus("err:failed");
    }
  };

  const resolveEvent = async (id) => {
    try {
      const res = await fetch(`${apiBase}/academy/events/${id}/resolve`, {
        method: "POST",
        headers,
        body: JSON.stringify({ status: "resolved", xpGain: 140 })
      });
      const json = await res.json();
      if (json?.ok) await load();
    } catch {
      /* noop */
    }
  };

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">ACADEMY EVENT ROOM</div>
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="LECTURE">LECTURE</option>
          <option value="EXAM">EXAM</option>
          <option value="MENTOR_SESSION">MENTOR_SESSION</option>
          <option value="RESEARCH_QUEST">RESEARCH_QUEST</option>
          <option value="DUEL">DUEL</option>
        </select>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="topic" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      </div>
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={queueEvent}>Queue</button>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void load()}>Yenile</button>
        <span className="text-[8px] text-white/40 self-center">{status}</span>
      </div>
      <div className="space-y-1 max-h-28 overflow-y-auto no-scrollbar">
        {items.map((ev) => (
          <div key={ev.id} className="rounded border border-white/10 bg-black/20 px-2 py-1 text-[8px] normal-case">
            {ev.type} · {ev.topic} · {ev.status}
            {ev.status !== "resolved" ? (
              <button type="button" className={`${btn} ml-2 border-emerald-400/35 text-emerald-200`} onClick={() => void resolveEvent(ev.id)}>
                Resolve
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
});

const RhizohContinuityHud = memo(({ selectedAgentId }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [profile, setProfile] = useState(null);
  const [context, setContext] = useState(null);
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const refresh = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${apiBase}/memory/profile`, { headers }),
        fetch(`${apiBase}/memory/context`, {
          method: "POST",
          headers,
          body: JSON.stringify({ agentId: selectedAgentId || "", query: "continuity", limit: 90 })
        })
      ]);
      const p = await pRes.json();
      const c = await cRes.json();
      if (p?.ok) setProfile(p.profile || null);
      if (c?.ok) setContext(c.context || null);
    } catch {
      /* noop */
    }
  };
  useEffect(() => {
    void refresh();
  }, [selectedAgentId]);

  const heat = (context?.episodic?.length || 0) + (context?.semantic?.length || 0) * 2 + (context?.procedural?.length || 0) * 3;
  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">RHIZOH CONTINUITY HUD</div>
      <div className="text-[8px] text-white/70 normal-case">
        Goals: {(profile?.goals || []).slice(0, 3).join(" · ") || "—"}
      </div>
      <div className="text-[8px] text-white/50 normal-case">
        Memory heat: {heat} · E:{context?.episodic?.length || 0} S:{context?.semantic?.length || 0} P:{context?.procedural?.length || 0}
      </div>
      <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void refresh()}>Yenile</button>
    </div>
  );
});

const StudioMirrorPanel = memo(() => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [liveArmed, setLiveArmed] = useState(false);
  const [status, setStatus] = useState("idle");
  const [protocol, setProtocol] = useState("WHIP");
  const [target, setTarget] = useState("");
  const [sessions, setSessions] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchRows, setSearchRows] = useState([]);
  const [note, setNote] = useState("");
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const refreshMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      setMicOn(stream.getAudioTracks().length > 0);
      setCamOn(stream.getVideoTracks().length > 0);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus("camera+mic hazır");
    } catch {
      setStatus("media izin hatası");
    }
  };

  const toggleScreen = async () => {
    if (screenOn) {
      setScreenOn(false);
      setStatus("screen off");
      return;
    }
    try {
      const sc = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenOn(true);
      if (videoRef.current) videoRef.current.srcObject = sc;
      sc.getVideoTracks()[0].addEventListener("ended", () => setScreenOn(false));
      setStatus("screen paylaşımı açık");
    } catch {
      setStatus("screen izin hatası");
    }
  };

  const toggleRecord = () => {
    const s = streamRef.current;
    if (!s) {
      setStatus("önce media başlat");
      return;
    }
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      setStatus("kayıt durdu");
      return;
    }
    try {
      const rec = new MediaRecorder(s);
      recRef.current = rec;
      rec.ondataavailable = () => {};
      rec.start();
      setRecording(true);
      setStatus("kayıt başladı");
    } catch {
      setStatus("kayıt başlatılamadı");
    }
  };

  const armPublish = async () => {
    try {
      const res = await fetch(`${apiBase}/studio/publish/session`, {
        method: "POST",
        headers,
        body: JSON.stringify({ protocol, target, roomId: "studio-main", bridge: "OBS/LiveKit/SFU", status: "armed" })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus(`publish armed:${json?.session?.id || ""}`);
        await refreshSessions();
      } else {
        setStatus(`publish err:${json?.error || "failed"}`);
      }
    } catch {
      setStatus("publish err");
    }
  };

  const runHealthCheck = async () => {
    const latest = sessions[0];
    const targetToCheck = target || latest?.target || "";
    const proto = protocol || latest?.protocol || "WHIP";
    if (!targetToCheck) {
      setStatus("health-check için target gerekli");
      return;
    }
    try {
      const res = await fetch(`${apiBase}/studio/publish/health-check`, {
        method: "POST",
        headers,
        body: JSON.stringify({ protocol: proto, target: targetToCheck, sessionId: latest?.id || "" })
      });
      const json = await res.json();
      if (json?.ok) {
        const h = json.health || {};
        setStatus(`health:${h.ok ? "ok" : "degraded"} (${h.reason || ""})`);
        await refreshSessions();
      } else {
        setStatus(`health err:${json?.error || "failed"}`);
      }
    } catch {
      setStatus("health-check error");
    }
  };

  const refreshSessions = async () => {
    try {
      const res = await fetch(`${apiBase}/studio/publish/sessions`, { headers });
      const json = await res.json();
      if (json?.ok) setSessions(json.items || []);
    } catch {
      /* noop */
    }
  };

  const refreshTranscripts = async () => {
    try {
      const res = await fetch(`${apiBase}/studio/transcripts?limit=60`, { headers: { "X-Castle-Dev-Uid": getOrCreateCastleDevUid() } });
      const json = await res.json();
      if (json?.ok) setTranscripts(json.items || []);
    } catch {
      /* noop */
    }
  };

  const addNote = async () => {
    const text = note.trim();
    if (!text) return;
    try {
      const res = await fetch(`${apiBase}/studio/transcripts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ source: "operator", eventType: "studio-note", text, roomId: "studio-main", meta: { layer: "studio" } })
      });
      const json = await res.json();
      if (json?.ok) {
        setNote("");
        await refreshTranscripts();
      }
    } catch {
      /* noop */
    }
  };

  const searchMeta = async () => {
    try {
      const res = await fetch(`${apiBase}/studio/metadata/search?q=${encodeURIComponent(searchQ)}&limit=80`, {
        headers: { "X-Castle-Dev-Uid": getOrCreateCastleDevUid() }
      });
      const json = await res.json();
      if (json?.ok) setSearchRows(json.items || []);
    } catch {
      /* noop */
    }
  };

  const jumpToTranscriptTarget = (row) => {
    const meta = row?.meta || {};
    const c = window.__CASTLE_CESIUM__;
    const lat = Number(meta?.lat);
    const lon = Number(meta?.lon);
    if (c && Number.isFinite(lat) && Number.isFinite(lon)) {
      c.streetView?.(lat, lon, 180);
      return;
    }
    if (meta?.directive === "ZOOM_CASTLE") {
      c?.focusCastle?.();
      return;
    }
    if (meta?.directive === "ISTANBUL_OVERVIEW") {
      c?.flyToIstanbul?.();
    }
  };

  useEffect(() => {
    void refreshSessions();
    void refreshTranscripts();
    const intv = setInterval(() => {
      void refreshTranscripts();
    }, 3000);
    return () => {
      clearInterval(intv);
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">STUDIO MIRROR</div>
      <div className="text-[8px] text-white/60 normal-case">
        mic:{micOn ? "on" : "off"} · cam:{camOn ? "on" : "off"} · screen:{screenOn ? "on" : "off"} · rec:{recording ? "on" : "off"} · live:{liveArmed ? "armed" : "idle"}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={() => void refreshMedia()}>Mic+Cam</button>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void toggleScreen()}>{screenOn ? "Screen Off" : "Screen On"}</button>
        <button type="button" className={`${btn} border-amber-400/35 text-amber-200`} onClick={toggleRecord}>{recording ? "Stop Rec" : "Start Rec"}</button>
        <button type="button" className={`${btn} border-rose-400/35 text-rose-200`} onClick={() => setLiveArmed((v) => !v)}>{liveArmed ? "Live Disarm" : "Live Arm"}</button>
      </div>
      <div className="flex gap-2">
        <select value={protocol} onChange={(e) => setProtocol(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="WHIP">WHIP</option>
          <option value="RTMP">RTMP</option>
          <option value="SFU">SFU</option>
        </select>
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="publish target / endpoint" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-fuchsia-400/35 text-fuchsia-200`} onClick={() => void armPublish()}>Arm Publish</button>
        <button type="button" className={`${btn} border-amber-400/35 text-amber-200`} onClick={() => void runHealthCheck()}>Health Check</button>
      </div>
      <div className="flex gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="studio note / event metadata" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={() => void addNote()}>Add Note</button>
      </div>
      <div className="flex gap-2">
        <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="metadata search (event, place, directive...)" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void searchMeta()}>Search</button>
      </div>
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-28 rounded border border-white/10 bg-black/40" />
      <div className="text-[8px] text-white/45">{status}</div>
      {sessions.length > 0 ? (
        <div className="text-[8px] text-white/65 normal-case max-h-14 overflow-y-auto no-scrollbar">
          {sessions.slice(0, 4).map((s) => (
            <div key={s.id}>{s.protocol} · {s.target || "n/a"} · {s.status}</div>
          ))}
        </div>
      ) : null}
      <div className="text-[8px] text-cyan-300 tracking-[0.2em]">LIVE TRANSCRIPT RAIL</div>
      <div className="text-[8px] text-white/70 normal-case max-h-24 overflow-y-auto no-scrollbar border border-white/10 rounded p-2 bg-black/20 space-y-1">
        {transcripts.length === 0 ? (
          "Henüz transcript yok."
        ) : (
          transcripts.map((t) => (
            <div key={t.id || `${t.ts}-${t.eventType}`} className="border-b border-white/10 pb-1">
              <div>{new Date(t.ts || Date.now()).toLocaleTimeString()} · {t.eventType} · {t.text}</div>
              <div className="flex gap-2 mt-1">
                <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => jumpToTranscriptTarget(t)}>
                  Jump
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {searchRows.length > 0 ? (
        <div className="text-[8px] text-emerald-200 normal-case max-h-24 overflow-y-auto no-scrollbar border border-emerald-500/30 rounded p-2 bg-emerald-900/10">
          {searchRows.map((t) => `${new Date(t.ts || Date.now()).toLocaleTimeString()} · ${t.eventType} · ${t.text}`).join("\n")}
        </div>
      ) : null}
    </div>
  );
});

const RoboticsMechanicsPanel = memo(({ selectedAgentId }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [deviceName, setDeviceName] = useState("castle-drone-01");
  const [deviceKind, setDeviceKind] = useState("drone");
  const [endpoint, setEndpoint] = useState("");
  const [message, setMessage] = useState("Hedefe güvenli rota planla ve telemetriyi optimize et.");
  const [status, setStatus] = useState("");
  const [devices, setDevices] = useState([]);
  const [telemetryRows, setTelemetryRows] = useState([]);
  const [bridgeReply, setBridgeReply] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [telemetryLat, setTelemetryLat] = useState(41.0082);
  const [telemetryLon, setTelemetryLon] = useState(28.9784);
  const [telemetrySpeed, setTelemetrySpeed] = useState(8);
  const [autoTitle, setAutoTitle] = useState("Akşam yemeğini hazırlamaya başla");
  const [autoAt, setAutoAt] = useState("");
  const [automations, setAutomations] = useState([]);
  const [deviceAdapter, setDeviceAdapter] = useState("websocket");
  const [capabilitiesText, setCapabilitiesText] = useState("smart-oven.preheat,smart-watch.notify");
  const [commandAction, setCommandAction] = useState("smart-watch.notify");
  const [commandParams, setCommandParams] = useState('{"text":"Castle update hazır"}');
  const [commands, setCommands] = useState([]);
  const [graphSummary, setGraphSummary] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("telegram");
  const [socialEndpoint, setSocialEndpoint] = useState("");
  const [socialChannels, setSocialChannels] = useState([]);
  const [broadcastText, setBroadcastText] = useState("Castle teknik geliştirme güncellemesi yayında.");
  const [ethicsTracks, setEthicsTracks] = useState([]);
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const loadDevices = async () => {
    try {
      const res = await fetch(`${apiBase}/robotics/devices`, { headers });
      const json = await res.json();
      if (json?.ok) {
        setDevices(json.items || []);
        if (!selectedDeviceId && json.items?.[0]?.id) setSelectedDeviceId(json.items[0].id);
      }
    } catch {
      /* noop */
    }
  };
  const loadTelemetry = async () => {
    try {
      const res = await fetch(`${apiBase}/robotics/telemetry`, { headers });
      const json = await res.json();
      if (json?.ok) setTelemetryRows(json.items || []);
    } catch {
      /* noop */
    }
  };
  const loadAutomations = async () => {
    try {
      const res = await fetch(`${apiBase}/robotics/automations`, { headers });
      const json = await res.json();
      if (json?.ok) setAutomations(json.items || []);
    } catch {
      /* noop */
    }
  };
  const loadCommands = async () => {
    try {
      const res = await fetch(`${apiBase}/robotics/commands`, { headers });
      const json = await res.json();
      if (json?.ok) setCommands(json.items || []);
    } catch {
      /* noop */
    }
  };
  const loadSocialChannels = async () => {
    try {
      const res = await fetch(`${apiBase}/social/channels`, { headers });
      const json = await res.json();
      if (json?.ok) setSocialChannels(json.items || []);
    } catch {
      /* noop */
    }
  };
  const loadEthics = async () => {
    try {
      const res = await fetch(`${apiBase}/social/ethics/programs`, { headers });
      const json = await res.json();
      if (json?.ok) setEthicsTracks(json.tracks || []);
    } catch {
      /* noop */
    }
  };
  useEffect(() => {
    void loadDevices();
    void loadTelemetry();
    void loadAutomations();
    void loadCommands();
    void loadSocialChannels();
    void loadEthics();
  }, []);

  const register = async () => {
    setStatus("registering...");
    try {
      const res = await fetch(`${apiBase}/robotics/devices`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: deviceName,
          kind: deviceKind,
          endpoint,
          transport: deviceAdapter,
          adapter: deviceAdapter,
          capabilityProfile: capabilitiesText.split(",").map((x) => x.trim()).filter(Boolean),
          status: "registered"
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("device registered");
        await loadDevices();
      } else setStatus(`err:${json?.error || "failed"}`);
    } catch {
      setStatus("err:register");
    }
  };

  const bridge = async () => {
    setStatus("bridging...");
    try {
      const res = await fetch(`${apiBase}/robotics/rhizoh/bridge`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          agentId: selectedAgentId || "",
          worldState: { mode: "ROBOTICS_MECHANICS" },
          deviceState: { devices: devices.slice(0, 8) }
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setBridgeReply(json.result?.reply || "");
        setStatus("bridge ok");
      } else setStatus(`err:${json?.error || "bridge_failed"}`);
    } catch {
      setStatus("err:bridge");
    }
  };

  const pushTelemetry = async () => {
    if (!selectedDeviceId) return;
    setStatus("telemetry...");
    try {
      const res = await fetch(`${apiBase}/robotics/telemetry`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          lat: Number(telemetryLat),
          lon: Number(telemetryLon),
          speed: Number(telemetrySpeed),
          mode: "ACTIVE"
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus(`telemetry ok (${json?.command || "CONTINUE"})`);
        await loadTelemetry();
        await loadDevices();
      } else setStatus(`err:${json?.error || "telemetry_failed"}`);
    } catch {
      setStatus("err:telemetry");
    }
  };

  const scheduleAutomation = async () => {
    const when = autoAt ? new Date(autoAt).getTime() : Date.now() + 5 * 60 * 1000;
    setStatus("scheduling...");
    try {
      const res = await fetch(`${apiBase}/robotics/automations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: autoTitle,
          scheduleAt: when,
          action: "SMART_HOME_TASK",
          deviceId: selectedDeviceId || "",
          payload: { plannerIntent: autoTitle }
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("automation scheduled");
        await loadAutomations();
      } else setStatus(`err:${json?.error || "automation_failed"}`);
    } catch {
      setStatus("err:automation");
    }
  };

  const queueCommand = async () => {
    if (!selectedDeviceId) return;
    setStatus("command queue...");
    try {
      const params = commandParams ? JSON.parse(commandParams) : {};
      const res = await fetch(`${apiBase}/robotics/commands`, {
        method: "POST",
        headers,
        body: JSON.stringify({ deviceId: selectedDeviceId, action: commandAction, params })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("command queued");
        await loadCommands();
      } else setStatus(`err:${json?.error || "command_failed"}`);
    } catch {
      setStatus("err:command_json_or_send");
    }
  };

  const buildPlannerGraph = async () => {
    setStatus("planner graph...");
    try {
      const res = await fetch(`${apiBase}/robotics/planner/graph`, {
        method: "POST",
        headers,
        body: JSON.stringify({ task: autoTitle, context: { selectedDeviceId } })
      });
      const json = await res.json();
      if (json?.ok) {
        const g = json.graph || {};
        setGraphSummary(`${g.taskTitle || "Planner"} | nodes:${(g.nodes || []).length} edges:${(g.edges || []).length}`);
        setStatus("planner ok");
      } else setStatus(`err:${json?.error || "planner_failed"}`);
    } catch {
      setStatus("err:planner");
    }
  };

  const registerSocial = async () => {
    setStatus("social register...");
    try {
      const res = await fetch(`${apiBase}/social/channels`, {
        method: "POST",
        headers,
        body: JSON.stringify({ platform: socialPlatform, connectorType: "webhook", endpoint: socialEndpoint, status: "enabled" })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("social channel enabled");
        await loadSocialChannels();
      } else setStatus(`err:${json?.error || "social_failed"}`);
    } catch {
      setStatus("err:social");
    }
  };

  const broadcastUpdate = async () => {
    setStatus("broadcast...");
    try {
      const res = await fetch(`${apiBase}/social/broadcast`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: broadcastText })
      });
      const json = await res.json();
      if (json?.ok) setStatus(`broadcast queued (${json.queuedChannels})`);
      else setStatus(`err:${json?.error || "broadcast_failed"}`);
    } catch {
      setStatus("err:broadcast");
    }
  };

  const dispatchQueuedCommands = async () => {
    setStatus("dispatching queued commands...");
    try {
      const res = await fetch(`${apiBase}/robotics/commands/dispatch`, {
        method: "POST",
        headers,
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus(`dispatch ok (${json.processed})`);
        await loadCommands();
      } else setStatus(`err:${json?.error || "dispatch_failed"}`);
    } catch {
      setStatus("err:dispatch");
    }
  };

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">ROBOTICS-MECHANICS BRIDGE</div>
      <div className="flex gap-2">
        <input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="device name" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <select value={deviceAdapter} onChange={(e) => setDeviceAdapter(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="websocket">websocket</option>
          <option value="mqtt">mqtt</option>
        </select>
        <select value={deviceKind} onChange={(e) => setDeviceKind(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="drone">drone</option>
          <option value="robot">robot</option>
          <option value="rover">rover</option>
          <option value="arm">arm</option>
          <option value="smart-watch">smart-watch</option>
          <option value="smart-tv">smart-tv</option>
          <option value="smart-speaker">smart-speaker</option>
          <option value="smart-light">smart-light</option>
          <option value="smart-oven">smart-oven</option>
          <option value="smart-fridge">smart-fridge</option>
          <option value="smart-ac">smart-ac</option>
          <option value="smart-lock">smart-lock</option>
          <option value="smart-vacuum">smart-vacuum</option>
          <option value="smart-washer">smart-washer</option>
          <option value="iot-sensor">iot-sensor</option>
        </select>
      </div>
      <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="ws/http endpoint (opsiyonel)" className="w-full bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <input value={capabilitiesText} onChange={(e) => setCapabilitiesText(e.target.value)} placeholder="capability profile (comma): smart-oven.preheat,smart-watch.notify" className="w-full bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={() => void register()}>Device Register</button>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void loadDevices()}>Yenile</button>
      </div>
      <div className="flex gap-2">
        <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="">select-device</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.kind})
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <input value={telemetryLat} onChange={(e) => setTelemetryLat(Number(e.target.value) || 0)} className="w-24 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" placeholder="lat" />
        <input value={telemetryLon} onChange={(e) => setTelemetryLon(Number(e.target.value) || 0)} className="w-24 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" placeholder="lon" />
        <input value={telemetrySpeed} onChange={(e) => setTelemetrySpeed(Number(e.target.value) || 0)} className="w-20 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" placeholder="m/s" />
        <button type="button" className={`${btn} border-amber-400/35 text-amber-200`} onClick={() => void pushTelemetry()}>
          Telemetry Push
        </button>
      </div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full h-14 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <button type="button" className={`${btn} border-emerald-400/35 text-emerald-200`} onClick={() => void bridge()}>Rhizoh Bridge Decision</button>
      <div className="flex gap-2">
        <input value={autoTitle} onChange={(e) => setAutoTitle(e.target.value)} placeholder="planner task (örn: akşam yemeğini hazırla)" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      </div>
      <div className="flex gap-2">
        <input type="datetime-local" value={autoAt} onChange={(e) => setAutoAt(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-fuchsia-400/35 text-fuchsia-200`} onClick={() => void scheduleAutomation()}>
          Schedule
        </button>
        <button type="button" className={`${btn} border-indigo-400/35 text-indigo-200`} onClick={() => void buildPlannerGraph()}>
          Build Action Graph
        </button>
      </div>
      <div className="flex gap-2">
        <input value={commandAction} onChange={(e) => setCommandAction(e.target.value)} placeholder="action (capability)" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-sky-400/35 text-sky-200`} onClick={() => void queueCommand()}>
          Queue Command
        </button>
        <button type="button" className={`${btn} border-violet-400/35 text-violet-200`} onClick={() => void dispatchQueuedCommands()}>
          Dispatch Queue
        </button>
      </div>
      <textarea value={commandParams} onChange={(e) => setCommandParams(e.target.value)} className="w-full h-12 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <div className="flex gap-2">
        <select value={socialPlatform} onChange={(e) => setSocialPlatform(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="telegram">telegram</option>
          <option value="whatsapp">whatsapp</option>
          <option value="webhook">webhook</option>
        </select>
        <input value={socialEndpoint} onChange={(e) => setSocialEndpoint(e.target.value)} placeholder="social webhook/bot endpoint" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-lime-400/35 text-lime-200`} onClick={() => void registerSocial()}>
          Add Social Channel
        </button>
      </div>
      <div className="flex gap-2">
        <input value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-cyan-300/35 text-cyan-100`} onClick={() => void broadcastUpdate()}>
          Broadcast Update
        </button>
      </div>
      <div className="text-[8px] text-white/45">{status}</div>
      <div className="text-[8px] text-indigo-200/80 normal-case">{graphSummary}</div>
      <div className="text-[8px] text-white/70 normal-case max-h-20 overflow-y-auto no-scrollbar">{bridgeReply}</div>
      <div className="text-[8px] text-white/65 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {devices.map((d) => `${d.name} (${d.kind}) · ${d.status} · ${Array.isArray(d.capabilityProfile) ? d.capabilityProfile.join("|") : "-"}`).join("\n")}
      </div>
      <div className="text-[8px] text-white/55 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {telemetryRows.slice(0, 6).map((t) => `${new Date(t.ts || Date.now()).toLocaleTimeString()} · ${t.deviceId} · ${t.mode} · ${t.speed}m/s`).join("\n")}
      </div>
      <div className="text-[8px] text-white/55 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {automations.slice(0, 6).map((a) => `${a.title} · ${a.status} · ${new Date(a.scheduleAt || Date.now()).toLocaleString()}`).join("\n")}
      </div>
      <div className="text-[8px] text-white/55 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {commands.slice(0, 6).map((c) => `${c.deviceId} · ${c.action} · ${c.adapter} · ${c.status}`).join("\n")}
      </div>
      <div className="text-[8px] text-white/55 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {socialChannels.slice(0, 6).map((c) => `${c.platform} · ${c.connectorType} · ${c.status}`).join("\n")}
      </div>
      <div className="text-[8px] text-emerald-200/80 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {ethicsTracks.slice(0, 4).map((t) => `${t.title} · ${t.audience} · ${(t.modules || []).slice(0, 2).join(",")}`).join("\n")}
      </div>
    </div>
  );
});

const EventLayerIntelPanel = memo(({ selectedAgentId, selectedConnectionId }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const mapSurfaceActive = useUISelector((s) => s.mapSurfaceActive);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [place, setPlace] = useState("Suleymaniye Library Istanbul");
  const [docUrl, setDocUrl] = useState("");
  const [docText, setDocText] = useState("");
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");
  const [companionOn, setCompanionOn] = useState(false);
  const [thresholdM, setThresholdM] = useState(260);
  const [cooldownSec, setCooldownSec] = useState(25);
  const [pdfJobId, setPdfJobId] = useState("");
  const [pdfCitations, setPdfCitations] = useState([]);
  const [waypointName, setWaypointName] = useState("");
  const [waypointPersona, setWaypointPersona] = useState("historian");
  const [waypoints, setWaypoints] = useState([]);
  const [routeReplies, setRouteReplies] = useState([]);
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";
  const lastPoiRef = useRef({ id: "", ts: 0 });

  const placeBrief = async (overridePlace = "") => {
    const placeName = String(overridePlace || place || "").trim();
    if (!placeName) return;
    setStatus("place-brief...");
    try {
      const res = await fetch(`${apiBase}/event-layer/place-brief`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          placeName,
          agentId: selectedAgentId || "",
          connectionId: selectedConnectionId || ""
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setReply(json.reply || "");
        setStatus("ok");
        if ("speechSynthesis" in window && json.reply) {
          const u = new SpeechSynthesisUtterance(String(json.reply).slice(0, 300));
          u.lang = "tr-TR";
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } else setStatus(`err:${json?.error || "failed"}`);
    } catch {
      setStatus("err:failed");
    }
  };

  const docBrief = async () => {
    setStatus("doc-brief...");
    try {
      const res = await fetch(`${apiBase}/event-layer/pdf-brief`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: place, url: docUrl, text: docText, agentId: selectedAgentId || "", connectionId: selectedConnectionId || "" })
      });
      const json = await res.json();
      if (json?.ok) {
        setReply(json.reply || "");
        setStatus("ok");
      } else setStatus(`err:${json?.error || "failed"}`);
    } catch {
      setStatus("err:failed");
    }
  };

  const addWaypoint = () => {
    const name = waypointName.trim();
    if (!name) return;
    setWaypoints((prev) => [...prev, { name, persona: waypointPersona }].slice(0, 24));
    setWaypointName("");
  };

  const runRouteBrief = async () => {
    if (waypoints.length === 0) return;
    setStatus("route-brief...");
    try {
      const res = await fetch(`${apiBase}/event-layer/route-brief`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          waypoints,
          agentId: selectedAgentId || "",
          connectionId: selectedConnectionId || ""
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setRouteReplies(json.items || []);
        setStatus("route-ok");
        const first = json.items?.[0]?.reply;
        if (first && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(String(first).slice(0, 300));
          u.lang = "tr-TR";
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } else {
        setStatus(`err:${json?.error || "route_failed"}`);
      }
    } catch {
      setStatus("err:route_failed");
    }
  };

  const uploadPdf = async (file) => {
    if (!file) return;
    setStatus("pdf-upload...");
    try {
      const buf = await file.arrayBuffer();
      const b64 = arrayBufferToBase64(buf);
      const res = await fetch(`${apiBase}/pdf/upload`, {
        method: "POST",
        headers,
        body: JSON.stringify({ fileName: file.name, contentBase64: b64 })
      });
      const json = await res.json();
      if (json?.ok?.toString() === "true" || json?.ok) {
        setPdfJobId(json?.job?.id || "");
        setStatus(`pdf-job:${json?.job?.id || "queued"}`);
      } else setStatus(`err:${json?.error || "upload_failed"}`);
    } catch {
      setStatus("err:upload_failed");
    }
  };

  useEffect(() => {
    if (!pdfJobId) return;
    let dead = false;
    const tick = async () => {
      try {
        const res = await fetch(`${apiBase}/pdf/jobs/${pdfJobId}`, {
          headers: { "X-Castle-Dev-Uid": getOrCreateCastleDevUid() }
        });
        const json = await res.json();
        if (dead || !json?.ok) return;
        const job = json.job || {};
        setStatus(`pdf:${job.status}`);
        if (job.status === "done") {
          const text = String(job.extractedText || "").slice(0, 12000);
          setPdfCitations(Array.isArray(job.citations) ? job.citations : []);
          if (text) {
            setDocText(text);
            void docBrief();
          }
          setPdfJobId("");
        }
        if (job.status === "failed") setPdfJobId("");
      } catch {
        /* noop */
      }
    };
    const intv = setInterval(() => void tick(), 3000);
    void tick();
    return () => {
      dead = true;
      clearInterval(intv);
    };
  }, [pdfJobId]);

  useEffect(() => {
    if (!companionOn || !mapSurfaceActive) return;
    let dead = false;
    const intv = setInterval(() => {
      if (dead) return;
      const c = window.__CASTLE_CESIUM__;
      if (!c?.getCameraGeo || !c?.findNearestImportant) return;
      const geo = c.getCameraGeo();
      const near = c.findNearestImportant(geo?.lat, geo?.lon, thresholdM);
      if (!near?.id) return;
      const now = Date.now();
      if (near.id === lastPoiRef.current.id && now - lastPoiRef.current.ts < cooldownSec * 1000) return;
      if (now - lastPoiRef.current.ts < cooldownSec * 1000) return;
      lastPoiRef.current = { id: near.id, ts: now };
      setPlace(near.name || place);
      void placeBrief(near.name || "");
    }, 3500);
    return () => {
      dead = true;
      clearInterval(intv);
    };
  }, [companionOn, thresholdM, cooldownSec, mapSurfaceActive, selectedAgentId, selectedConnectionId]);

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">EVENT LAYER INTEL + ROUTE COMPANION</div>
      <div className="flex gap-2">
        <input value={waypointName} onChange={(e) => setWaypointName(e.target.value)} placeholder="waypoint adı" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <select value={waypointPersona} onChange={(e) => setWaypointPersona(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="historian">historian</option>
          <option value="architect">architect</option>
          <option value="storyteller">storyteller</option>
          <option value="researcher">researcher</option>
          <option value="friendly-guide">friendly-guide</option>
        </select>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={addWaypoint}>Ekle</button>
      </div>
      {waypoints.length > 0 ? (
        <div className="text-[8px] text-white/65 normal-case max-h-12 overflow-y-auto no-scrollbar">
          {waypoints.map((w, i) => (
            <div key={`${w.name}-${i}`}>{i + 1}. {w.name} · {w.persona}</div>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-fuchsia-400/35 text-fuchsia-200`} onClick={runRouteBrief}>
          Route briefing
        </button>
      </div>
      <div className="flex items-center gap-2 text-[8px] text-white/65">
        <label className="normal-case">Companion</label>
        <input type="checkbox" checked={companionOn} onChange={(e) => setCompanionOn(e.target.checked)} />
        <label className="normal-case">POI m</label>
        <input value={thresholdM} onChange={(e) => setThresholdM(Number(e.target.value) || 260)} className="w-14 bg-black/35 border border-white/15 rounded px-1 py-0.5 text-[8px]" />
        <label className="normal-case">Cooldown s</label>
        <input value={cooldownSec} onChange={(e) => setCooldownSec(Number(e.target.value) || 25)} className="w-14 bg-black/35 border border-white/15 rounded px-1 py-0.5 text-[8px]" />
      </div>
      <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="yürüyüş rotası / yapı adı" className="w-full bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={() => void placeBrief()}>Yapı bilgisi</button>
      </div>
      <input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="kütüphane doküman url (html/txt)" className="w-full bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <textarea value={docText} onChange={(e) => setDocText(e.target.value)} placeholder="veya metni buraya yapıştır (PDF extract)" className="w-full h-16 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <div className="flex gap-2 items-center">
        <button type="button" className={`${btn} border-amber-400/35 text-amber-200`} onClick={() => void docBrief()}>Doküman/PDF brief</button>
        <label className={`${btn} border-white/20 text-white/70 cursor-pointer`}>
          PDF Upload
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadPdf(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="text-[8px] text-white/40">{status}</div>
      <div className="text-[8px] text-white/75 normal-case leading-relaxed max-h-24 overflow-y-auto no-scrollbar">{reply}</div>
      {pdfCitations.length > 0 ? (
        <div className="text-[8px] text-white/60 normal-case max-h-20 overflow-y-auto no-scrollbar">
          {pdfCitations.map((c, i) => (
            <div key={`cite-${i}`}>p.{c.page} {c.title}</div>
          ))}
        </div>
      ) : null}
      {routeReplies.length > 0 ? (
        <div className="text-[8px] text-white/70 normal-case max-h-24 overflow-y-auto no-scrollbar">
          {routeReplies.map((r, i) => (
            <div key={`route-${i}`}>{i + 1}. {r.name} [{r.persona}] — {r.reply}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
});

const RhizohSceneAnchorWindow = memo(() => {
  const anchor = useUISelector((s) => s.rhizohSceneAnchor);
  if (!anchor?.open) return null;
  const title = String(anchor.title || "Rhizoh · CODEX");
  return (
    <div className="pointer-events-auto fixed bottom-20 right-4 z-[52] w-[min(420px,92vw)] rounded-2xl border border-cyan-400/35 bg-[#030912]/92 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-xl p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/90">Rhizoh sahne penceresi</div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-white/15 px-2 py-0.5 text-[9px] text-white/60 hover:bg-white/10"
          onClick={() => uiStore.dispatch({ type: "SET_RHIZOH_SCENE_ANCHOR", payload: null })}
        >
          Kapat
        </button>
      </div>
      <div className="mb-2 text-[10px] text-white/85 normal-case leading-snug">{title}</div>
      {anchor.kind === "video" && anchor.src ? (
        <video src={anchor.src} controls playsInline className="max-h-52 w-full rounded-lg border border-white/10 bg-black" />
      ) : null}
      {anchor.kind === "audio" && anchor.src ? <audio src={anchor.src} controls className="w-full" /> : null}
      {anchor.kind === "text" && anchor.text ? (
        <div className="max-h-56 overflow-y-auto no-scrollbar rounded-lg border border-indigo-400/25 bg-indigo-950/30 p-2 text-[9px] text-indigo-100/90 normal-case leading-relaxed whitespace-pre-wrap">
          {anchor.text}
        </div>
      ) : null}
      {!anchor.src && anchor.kind !== "text" ? (
        <div className="text-[8px] text-white/45 normal-case">Bu ankraj için kaynak URL bağlı değil; panelden ingest veya replay seçin.</div>
      ) : null}
    </div>
  );
});
RhizohSceneAnchorWindow.displayName = "RhizohSceneAnchorWindow";

const SOCIAL_MESH_PLATFORMS = [
  { id: "telegram", apiPlatform: "telegram", name: "Telegram", icon: MessageCircle, color: "text-sky-400" },
  { id: "x", apiPlatform: "x", name: "X (Twitter)", icon: Hash, color: "text-white" },
  { id: "youtube", apiPlatform: "youtube", name: "YouTube Live", icon: Video, color: "text-red-400" },
  { id: "discord", apiPlatform: "discord", name: "Discord", icon: Globe, color: "text-indigo-400" }
];

const SovereignCastleCommandPanel = memo(
  ({
    engineRef,
    currentUserId,
    rhizohFirstName,
    selectedAgentId = "",
    selectedConnectionId = "",
    remoteCastles = [],
    bridgeRegistryReady = false,
    onInitiateMirrorBridge = null,
    onCastleLifecycleChange = null,
    onOpenRhizohKernelDrawer = null
  }) => {
  const navigate = useNavigate();
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;

  const [castleState, setCastleState] = useState("DORMANT");
  const [userLocation, setUserLocation] = useState(null);
  const [activeTab, setActiveTab] = useState("GREETING");
  const [castleType, setCastleType] = useState("SANCTUARY");
  const [kernelNote, setKernelNote] = useState("");
  const [garrison, setGarrison] = useState([
    { id: "A-01", name: "Prometheus", role: "Overmind", status: "Hibernating" },
    { id: "A-02", name: "Atlas", role: "Guardian", status: "Hibernating" },
    { id: "P-01", name: "Ghost Pet", role: "Companion", status: "Hibernating" }
  ]);
  const [mediaState, setMediaState] = useState({ playing: false, track: "CODEX_Memory_Fragment_01.wav", src: "", kind: "video" });
  const [waveHeights, setWaveHeights] = useState(() => Array.from({ length: 16 }, () => 20));
  const [mediaPlaylist, setMediaPlaylist] = useState([]);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [archiveStatus, setArchiveStatus] = useState("");
  const [codexQuery, setCodexQuery] = useState("greenroom");
  const [codexHits, setCodexHits] = useState([]);
  const [pdfBriefText, setPdfBriefText] = useState("");
  const mediaElRef = useRef(null);
  const codexQueryRef = useRef(codexQuery);
  codexQueryRef.current = codexQuery;

  const [socialStatus, setSocialStatus] = useState("");
  const [socialServerByPlatform, setSocialServerByPlatform] = useState({});
  const [socialUnbindLocal, setSocialUnbindLocal] = useState({});
  const [broadcastDraft, setBroadcastDraft] = useState("");
  const [autoPostMode, setAutoPostMode] = useState("MANUAL_APPROVAL");
  const [attachSimContext, setAttachSimContext] = useState(true);
  const [thoughtExpandedId, setThoughtExpandedId] = useState(null);
  const [pendingBroadcasts, setPendingBroadcasts] = useState([
    {
      id: "bcast-01",
      agent: "Prometheus",
      platform: "X (Twitter)",
      text: "Castle Genesis L10 subsystem stabilized. The swarm is expanding across Istanbul coordinates.",
      time: "2 dk önce",
      agentIdx: -1,
      lat: ISTANBUL_POI.FATIH.lat,
      lon: ISTANBUL_POI.FATIH.lon,
      heatPulse: buildPulseSeriesFromSeed(401, 14),
      thoughtChain: buildThoughtChainL8V1({ threatLevel: 0.55, districtEnergy: 0.62, swarmLevel: 0.7, memoryEcho: 0.48 }),
      trigger: "demo"
    },
    {
      id: "bcast-02",
      agent: "Broadcaster",
      platform: "Telegram",
      text: "Yeni bir ajan arketipi sisteme dahil oldu. Event Mesh verileri analiz ediliyor.",
      time: "5 dk önce",
      agentIdx: -1,
      lat: ISTANBUL_POI.FATIH.lat,
      lon: ISTANBUL_POI.FATIH.lon,
      heatPulse: buildPulseSeriesFromSeed(902, 14),
      thoughtChain: buildThoughtChainL8V1({ threatLevel: 0.33, districtEnergy: 0.58, swarmLevel: 0.44, memoryEcho: 0.61 }),
      trigger: "demo"
    }
  ]);

  const owner = String(currentUserId || getOrCreateCastleDevUid() || "GUEST");

  useEffect(() => {
    const onDraft = (e) => {
      const d = e?.detail;
      if (!d?.id) return;
      setPendingBroadcasts((prev) => {
        if (prev.some((x) => x.id === d.id)) return prev;
        return [{ ...d, time: d.time || "L9" }, ...prev].slice(0, 22);
      });
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: {
          ts: new Date().toLocaleTimeString(),
          type: "SYS",
          data: `L9 · ${d.trigger || "event"} → sosyal kuyruk · ${String(d.text || "").slice(0, 72)}`
        }
      });
      const cnt = Number(d.agentCount) || 0;
      const big = cnt >= 8 || (d.trigger === "swarm_nexus" && cnt >= 6) || d.trigger === "academy_master";
      if (big) {
        const eng = engineRef?.current;
        window.requestAnimationFrame(() => eng?.frameL9CinematicEvent?.(d));
      }
    };
    window.addEventListener(CASTLE_L9_SOCIAL_EVENT, onDraft);
    return () => window.removeEventListener(CASTLE_L9_SOCIAL_EVENT, onDraft);
  }, []);

  const focusCameraForBroadcast = (b) => {
    const mapSurface = uiStore.getState().mapSurfaceActive;
    const c = window.__CASTLE_CESIUM__;
    const idx =
      typeof b.agentIdx === "number" && b.agentIdx >= 0 ? b.agentIdx : findAgentIdxForBroadcastName(b.agent);
    if (mapSurface && c?.flyToCustom && Number.isFinite(b.lat) && Number.isFinite(b.lon)) {
      c.flyToCustom(b.lat, b.lon, 1180);
      return;
    }
    const eng = engineRef?.current;
    if (!eng) return;
    if (idx >= 0) {
      eng.focusWorldPoint(coreWorld.posX[idx], coreWorld.posY[idx], coreWorld.posZ[idx], 1580);
      return;
    }
    if (Number.isFinite(b.lat) && Number.isFinite(b.lon)) {
      const xz = latLonToSceneXZ(b.lat, b.lon);
      eng.focusWorldPoint(xz.x, 220, xz.z, 2480);
      return;
    }
    eng.focusCastleBeacon?.();
  };

  const runApprovalCinematic = (b) => {
    const idx =
      typeof b.agentIdx === "number" && b.agentIdx >= 0 ? b.agentIdx : findAgentIdxForBroadcastName(b.agent);
    const eng = engineRef?.current;
    if (!eng) return;
    if (idx >= 0) {
      eng.runOrbitalSweepAt(coreWorld.posX[idx], coreWorld.posY[idx], coreWorld.posZ[idx], { durationMs: 1500, radius: 880 });
      window.setTimeout(() => eng.emitSignalHaloFlash(coreWorld.posX[idx], coreWorld.posY[idx], coreWorld.posZ[idx]), 380);
      return;
    }
    if (Number.isFinite(b.lat) && Number.isFinite(b.lon)) {
      const xz = latLonToSceneXZ(b.lat, b.lon);
      eng.runOrbitalSweepAt(xz.x, 220, xz.z, { durationMs: 1500, radius: 900 });
      window.setTimeout(() => eng.emitSignalHaloFlash(xz.x, 220, xz.z), 380);
      return;
    }
    const p = RealMapCore.castleWorldPos;
    eng.runOrbitalSweepAt(p.x, p.y, p.z, { durationMs: 1400, radius: 960 });
    window.setTimeout(() => eng.emitSignalHaloFlash(p.x, p.y, p.z), 400);
  };

  const refreshSocialChannels = useCallback(async () => {
    const apiBase = getRhizohApiBase();
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/social/channels`, { headers: getRhizohDevFetchHeaders() });
      const j = await res.json().catch(() => ({}));
      if (!j?.ok || !Array.isArray(j.items)) return;
      const map = {};
      for (const c of j.items) {
        const p = String(c.platform || "").toLowerCase();
        if (String(c.status || "").toLowerCase() === "enabled") map[p] = true;
      }
      setSocialServerByPlatform(map);
    } catch {
      /* noop */
    }
  }, []);

  const meshRowConnected = (row) => !!socialServerByPlatform[row.apiPlatform] && !socialUnbindLocal[row.id];

  const connectSocialRow = async (row) => {
    const apiBase = getRhizohApiBase();
    const hasServer = !!socialServerByPlatform[row.apiPlatform];
    if (hasServer && socialUnbindLocal[row.id]) {
      setSocialUnbindLocal((p) => {
        const n = { ...p };
        delete n[row.id];
        return n;
      });
      setSocialStatus(`${row.name} · mevcut gateway kanalıyla yeniden bağlandı.`);
      return;
    }
    if (!apiBase) {
      setSocialStatus("Gateway yok — rhizohLlmHttp.");
      return;
    }
    setSocialStatus(`${row.name} köprüleniyor…`);
    try {
      const res = await fetch(`${apiBase}/social/channels`, {
        method: "POST",
        headers: getRhizohDevFetchHeaders(),
        body: JSON.stringify({
          platform: row.apiPlatform,
          connectorType: "webhook",
          endpoint: "",
          status: "enabled",
          audience: "castle-mesh"
        })
      });
      const j = await res.json().catch(() => ({}));
      if (j?.ok) {
        setSocialStatus(`${row.name} Sentinel ağına kaydedildi.`);
        setSocialUnbindLocal((p) => {
          const n = { ...p };
          delete n[row.id];
          return n;
        });
        await refreshSocialChannels();
      } else {
        setSocialStatus(`Sosyal kanal: ${j?.error || "failed"}`);
      }
    } catch {
      setSocialStatus("Sosyal kanal isteği başarısız.");
    }
  };

  const disconnectSocialRow = (row) => {
    setSocialUnbindLocal((p) => ({ ...p, [row.id]: true }));
    setSocialStatus(`${row.name} UI’da ayıklandı (sunucudaki etkin kanallar /social/broadcast ile yine tetiklenebilir).`);
  };

  const sendMeshBroadcast = async () => {
    const text = broadcastDraft.trim();
    if (!text) return;
    const apiBase = getRhizohApiBase();
    if (!apiBase) {
      setSocialStatus("Gateway yok — metin yerelde kaldı.");
      return;
    }
    setSocialStatus("Duyuru gönderiliyor…");
    try {
      const res = await fetch(`${apiBase}/social/broadcast`, {
        method: "POST",
        headers: getRhizohDevFetchHeaders(),
        body: JSON.stringify({ text })
      });
      const j = await res.json().catch(() => ({}));
      if (j?.ok) {
        setSocialStatus(`Duyuru kuyruğa alındı (${j.queuedChannels ?? "?"} kanal).`);
        setBroadcastDraft("");
        uiStore.dispatch({
          type: "ADD_LOG",
          payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `SOCIAL BROADCAST · ${text.slice(0, 120)}` }
        });
      } else {
        setSocialStatus(`Broadcast: ${j?.error || "failed"}`);
      }
    } catch {
      setSocialStatus("Broadcast ağ hatası.");
    }
  };

  const approveBroadcast = async (b) => {
    runApprovalCinematic(b);
    let payloadText = b.text;
    if (attachSimContext && mediaState.playing && mediaState.track) {
      payloadText += `\n\n— Castle ambiyans: ${String(mediaState.track).slice(0, 96)}`;
    }
    if (attachSimContext && pdfBriefText) {
      const clip = String(pdfBriefText).trim().slice(0, 300);
      payloadText += `\n\n— CODEX: ${clip}${pdfBriefText.length > 300 ? "…" : ""}`;
    }
    const apiBase = getRhizohApiBase();
    setSocialStatus("Onaylı yayın iletiliyor…");
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/social/broadcast`, {
          method: "POST",
          headers: getRhizohDevFetchHeaders(),
          body: JSON.stringify({ text: payloadText })
        });
        const j = await res.json().catch(() => ({}));
        setSocialStatus(j?.ok ? "Yayın gateway’e iletildi." : `Hata: ${j?.error || "broadcast"}`);
      } catch {
        setSocialStatus("Yayın ağ hatası.");
      }
    } else {
      setSocialStatus("Gateway yok — kuyruk öğesi kaldırıldı (demo).");
    }
    setThoughtExpandedId(null);
    setPendingBroadcasts((prev) => prev.filter((x) => x.id !== b.id));
  };

  const rejectBroadcast = (id) => {
    setPendingBroadcasts((prev) => prev.filter((b) => b.id !== id));
    setThoughtExpandedId((cur) => (cur === id ? null : cur));
    setSocialStatus("Ajan yayını reddedildi.");
  };

  const applyPlaylistIndex = useCallback((idx, list) => {
    const rows = list ?? mediaPlaylist;
    const n = rows.length;
    if (!n) {
      setMediaState((s) => ({ ...s, track: "Gateway’den akış yok", src: "", kind: "video", playing: false }));
      return;
    }
    const i = ((idx % n) + n) % n;
    const row = rows[i];
    setMediaIndex(i);
    setMediaState((s) => ({ ...s, track: row.label, src: row.url, kind: row.kind, playing: false }));
  }, [mediaPlaylist]);

  const refreshArchive = useCallback(async () => {
    const apiBase = getRhizohApiBase();
    if (!apiBase) {
      setArchiveStatus("API tabanı yok (rhizohLlmHttp).");
      setMediaPlaylist([]);
      return;
    }
    setArchiveStatus("Senkron…");
    try {
      const q = String(codexQueryRef.current || "greenroom").trim() || "greenroom";
      const devH = { "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
      const [trRes, sessRes, metaRes] = await Promise.all([
        fetch(`${apiBase}/studio/transcripts?limit=50`, { headers: devH }),
        fetch(`${apiBase}/studio/publish/sessions`, { headers: getRhizohDevFetchHeaders() }),
        fetch(`${apiBase}/studio/metadata/search?q=${encodeURIComponent(q)}&limit=28`, { headers: devH })
      ]);
      const trJ = await trRes.json().catch(() => ({}));
      const sJ = await sessRes.json().catch(() => ({}));
      const mJ = await metaRes.json().catch(() => ({}));
      const list = mergeMediaPlaylistFromGateway(sJ.items, trJ.items);
      setMediaPlaylist(list);
      setCodexHits(Array.isArray(mJ.items) ? mJ.items : []);
      setArchiveStatus(`Kayıt: tr ${trJ.items?.length ?? "—"} · yayın ${sJ.items?.length ?? "—"} · arama ${mJ.items?.length ?? "—"}`);
      if (list.length) {
        const row = list[0];
        setMediaIndex(0);
        setMediaState((s) => ({ ...s, track: row.label, src: row.url, kind: row.kind, playing: false }));
      } else {
        setMediaState((s) => ({ ...s, track: "Oynatılabilir URL yok (ingest/replay)", src: "", playing: false }));
      }
    } catch {
      setArchiveStatus("Arşiv isteği başarısız.");
    }
  }, []);

  const runPdfBriefOnRow = useCallback(
    async (row) => {
      const apiBase = getRhizohApiBase();
      if (!apiBase || !row) return;
      setArchiveStatus("pdf-brief…");
      try {
        const text = String(row.text || "").slice(0, 12000);
        const res = await fetch(`${apiBase}/event-layer/pdf-brief`, {
          method: "POST",
          headers: getRhizohDevFetchHeaders(),
          body: JSON.stringify({
            title: String(row.eventType || "codex-hit"),
            url: "",
            text,
            agentId: selectedAgentId || "",
            connectionId: selectedConnectionId || ""
          })
        });
        const j = await res.json().catch(() => ({}));
        if (j?.ok) setPdfBriefText(String(j.reply || ""));
        setArchiveStatus(j?.ok ? "PDF / doküman özeti hazır" : `pdf-brief: ${j?.error || "failed"}`);
      } catch {
        setArchiveStatus("pdf-brief ağ hatası");
      }
    },
    [selectedAgentId, selectedConnectionId]
  );

  useEffect(() => {
    if (castleState !== "ACTIVE" || activeTab !== "ARCHIVE") return;
    void refreshArchive();
  }, [castleState, activeTab, refreshArchive]);

  useEffect(() => {
    if (castleState !== "ACTIVE" || activeTab !== "NETWORK") return;
    void refreshSocialChannels();
  }, [castleState, activeTab, refreshSocialChannels]);

  useEffect(() => {
    if (castleState !== "ACTIVE") return;
    const apiBase = getRhizohApiBase();
    if (!apiBase) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const h = getRhizohDevFetchHeaders();
        const [dRes, tRes] = await Promise.all([
          fetch(`${apiBase}/robotics/devices`, { headers: h }),
          fetch(`${apiBase}/robotics/telemetry`, { headers: h })
        ]);
        const dJ = await dRes.json().catch(() => ({}));
        const tJ = await tRes.json().catch(() => ({}));
        if (cancelled || !dJ?.ok) return;
        const telById = new Map((tJ.items || []).map((x) => [x.deviceId, x]));
        const drones = (dJ.items || []).filter((x) => String(x.kind || "").toLowerCase() === "drone");
        setGarrison((prev) => {
          const core = prev.filter((a) => !String(a.id).startsWith("api-"));
          const apiRows = drones.map((d) => {
            const tel = telById.get(d.id);
            return {
              id: `api-${d.id}`,
              name: d.name || d.id,
              role: "DroneRelay",
              status: tel ? `${tel.mode || "—"} · ${tel.speed ?? "?"} m/s` : String(d.status || "registered")
            };
          });
          return [...core, ...apiRows];
        });
      } catch {
        /* noop */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 9000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [castleState]);

  useEffect(() => {
    const el = mediaElRef.current;
    if (!el || !mediaState.src) return;
    if (mediaState.playing) {
      void el.play().catch(() => setMediaState((s) => ({ ...s, playing: false })));
    } else el.pause();
  }, [mediaState.playing, mediaState.src, mediaIndex]);

  useEffect(() => {
    if (!mediaState.playing) {
      setWaveHeights(Array.from({ length: 16 }, () => 20));
      return;
    }
    const id = window.setInterval(() => {
      setWaveHeights(Array.from({ length: 16 }, () => 20 + Math.random() * 72));
    }, 220);
    return () => window.clearInterval(id);
  }, [mediaState.playing]);

  const handleSpawn = () => {
    if (!navigator.geolocation) {
      setKernelNote("Geolocation desteklenmiyor.");
      return;
    }
    setCastleState("SPAWNING");
    setKernelNote("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        try {
          window.__CASTLE_NEXUS_GEO__ = { lat: latitude, lon: longitude };
          window.__CASTLE_CLIENT_CASTLE_STATE__ = "ACTIVE";
        } catch {
          /* noop */
        }
        onCastleLifecycleChange?.("ACTIVE");
        const spawnCmd = `SPAWN CASTLE --owner ${owner} --lat ${latitude} --lon ${longitude} --type ${castleType}`;
        uiStore.dispatch({
          type: "ADD_LOG",
          payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `KERNEL DSL · ${spawnCmd}` }
        });
        const parsed = parseDSL(spawnCmd);
        const out = parsed ? await applyPersonalCastleDsl(parsed) : { ok: false, reply: "DSL ayrıştırılamadı." };
        setKernelNote(out.reply);
        if (!out.ok) {
          setCastleState("DORMANT");
          return;
        }
        window.setTimeout(() => {
          setCastleState("ACTIVE");
          setGarrison((prev) => prev.map((agent) => ({ ...agent, status: "Online & Patrol" })));
          uiStore.dispatch({
            type: "ADD_LOG",
            payload: {
              ts: new Date().toLocaleTimeString(),
              type: "SYS",
              data: "CASTLE ACTIVE · CODEX sürekliliği ve Event Mesh bu merkeze bağlandı (L10)."
            }
          });
        }, 400);
      },
      (err) => {
        setCastleState("DORMANT");
        setKernelNote(`Konum: ${err?.message || err?.code || "hata"}`);
      },
      { enableHighAccuracy: true, timeout: 14_000, maximumAge: 60_000 }
    );
  };

  const handlePurge = async () => {
    const purgeCmd = `PURGE CASTLE --owner ${owner}`;
    uiStore.dispatch({
      type: "ADD_LOG",
      payload: { ts: new Date().toLocaleTimeString(), type: "WARN", data: `KERNEL DSL · ${purgeCmd}` }
    });
    const parsed = parseDSL(purgeCmd);
    if (parsed) await applyPersonalCastleDsl(parsed);
    setCastleState("DORMANT");
    setUserLocation(null);
    try {
      delete window.__CASTLE_NEXUS_GEO__;
      window.__CASTLE_CLIENT_CASTLE_STATE__ = "DORMANT";
    } catch {
      /* noop */
    }
    onCastleLifecycleChange?.("DORMANT");
    uiStore.dispatch({ type: "SET_RHIZOH_SCENE_ANCHOR", payload: null });
    setGarrison((prev) =>
      prev.filter((a) => !String(a.id).startsWith("api-")).map((a) => ({ ...a, status: "Hibernating" }))
    );
    setActiveTab("GREETING");
    setMediaPlaylist([]);
    setPdfBriefText("");
    setSocialUnbindLocal({});
    setBroadcastDraft("");
    setSocialStatus("");
    setKernelNote("PURGE tamamlandı; kale simülasyondan kaldırıldı.");
  };

  const mirrorToRhizohScene = () => {
    if (mediaState.src) {
      uiStore.dispatch({
        type: "SET_RHIZOH_SCENE_ANCHOR",
        payload: { open: true, title: mediaState.track, kind: mediaState.kind === "audio" ? "audio" : "video", src: mediaState.src }
      });
      return;
    }
    if (pdfBriefText) {
      uiStore.dispatch({
        type: "SET_RHIZOH_SCENE_ANCHOR",
        payload: { open: true, title: "CODEX · pdf-brief", kind: "text", text: pdfBriefText }
      });
    }
  };

  const btnClass =
    "text-[9px] px-3 py-1.5 rounded-lg border font-bold transition-all uppercase tracking-wider flex items-center gap-2 justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";
  const tabClass = (tab) =>
    `shrink-0 px-2 sm:px-3 py-1.5 text-[8px] font-black uppercase tracking-widest border-b-2 transition-all ${
      activeTab === tab ? "border-cyan-400 text-cyan-200 bg-cyan-400/10" : "border-transparent text-white/40 hover:text-white/70"
    }`;

  const welcomeName = (rhizohFirstName && String(rhizohFirstName).trim()) || "MİMAR";

  return (
    <div
      className="rounded-2xl p-4 space-y-4 backdrop-blur-xl shadow-2xl normal-case"
      style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-cyan-300 font-black tracking-[0.28em] text-[10px]">
          <Shield size={16} className={castleState === "ACTIVE" ? "text-cyan-400 animate-pulse shrink-0" : "text-white/40 shrink-0"} aria-hidden />
          PERSONAL CASTLE
          {castleState === "ACTIVE" ? <span className="text-emerald-400/95">[ONLINE]</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {castleState === "DORMANT" || castleState === "SPAWNING" ? (
            <select
              value={castleType}
              onChange={(e) => setCastleType(e.target.value)}
              disabled={castleState === "SPAWNING"}
              className="bg-black/35 border border-white/15 rounded-lg px-2 py-1 text-[8px] text-white uppercase outline-none"
              aria-label="Kale tipi"
            >
              <option value="SANCTUARY">SANCTUARY</option>
              <option value="ACADEMY">ACADEMY</option>
              <option value="DEFENSE">DEFENSE</option>
            </select>
          ) : null}
          {castleState === "DORMANT" ? (
            <button type="button" onClick={handleSpawn} className={`${btnClass} border-cyan-400/50 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20`}>
              <Power size={12} aria-hidden /> INITIALIZE CASTLE
            </button>
          ) : castleState === "SPAWNING" ? (
            <span className="text-[8px] text-cyan-200/80 uppercase tracking-widest">SPAWNING…</span>
          ) : (
            <button type="button" onClick={() => void handlePurge()} className={`${btnClass} border-rose-400/50 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20`}>
              <Trash2 size={12} aria-hidden /> PURGE
            </button>
          )}
        </div>
      </div>

      {kernelNote && castleState !== "ACTIVE" ? (
        <div className="text-[8px] text-amber-200/90 border border-amber-400/25 rounded-lg px-2 py-1.5 bg-amber-950/20">{kernelNote}</div>
      ) : null}

      {castleState === "SPAWNING" ? (
        <div className="text-[9px] text-cyan-300 animate-pulse text-center py-4 tracking-widest uppercase">
          <Cpu size={24} className="mx-auto mb-2 animate-spin-slow" aria-hidden />
          Synchronizing Spatial Engine… Awakening Nodes…
        </div>
      ) : null}

      {castleState === "ACTIVE" ? (
        <>
          <div className="flex gap-1 border-b border-white/10 overflow-x-auto no-scrollbar">
            <button type="button" onClick={() => setActiveTab("GREETING")} className={tabClass("GREETING")}>
              Welcome
            </button>
            <button type="button" onClick={() => setActiveTab("GARRISON")} className={tabClass("GARRISON")}>
              Agents
            </button>
            <button type="button" onClick={() => setActiveTab("MODULES")} className={tabClass("MODULES")}>
              Modules
            </button>
            <button type="button" onClick={() => setActiveTab("ARCHIVE")} className={tabClass("ARCHIVE")}>
              Library &amp; Media
            </button>
            <button type="button" onClick={() => setActiveTab("NETWORK")} className={tabClass("NETWORK")}>
              Network
            </button>
            <button type="button" onClick={() => setActiveTab("ALLIANCES")} className={tabClass("ALLIANCES")}>
              Alliances
            </button>
          </div>

          <div className="min-h-[120px] max-h-[min(320px,48vh)] overflow-y-auto no-scrollbar pt-2">
            {activeTab === "GREETING" ? (
              <div className="space-y-2 text-[9px] text-white/70 leading-relaxed">
                <div className="text-cyan-200 font-black text-[10px] tracking-widest mb-2">HOŞ GELDİN, {welcomeName}.</div>
                <p>
                  Kaleniz {userLocation?.lat.toFixed(4)}, {userLocation?.lon.toFixed(4)} koordinatlarında stabilize edildi ({castleType}).
                </p>
                <p>L10 Command Layer üzerinden Event Mesh ve CityMind akışları bu merkeze bağlandı.</p>
                <div className="p-2 mt-2 bg-black/40 border border-emerald-500/30 rounded text-emerald-200">
                  Nexus Energy: Optimal. Savunma ve iletişim kanalları açık.
                </div>
              </div>
            ) : null}

            {activeTab === "GARRISON" ? (
              <div className="space-y-2">
                <div className="text-[8px] text-white/40 tracking-widest uppercase mb-2 flex items-center gap-1">
                  <Users size={10} aria-hidden /> Bağlı ajanlar &amp; swarm
                </div>
                {garrison.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded border border-white/10 bg-black/20 text-[9px]">
                    <div>
                      <span className="text-cyan-300 font-bold">{a.name}</span>
                      <span className="text-white/40 ml-2">[{a.role}]</span>
                    </div>
                    <span className="text-emerald-400 font-mono">{a.status}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === "MODULES" ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onOpenRhizohKernelDrawer?.()}
                  className="p-3 rounded border border-fuchsia-400/30 bg-fuchsia-500/10 text-left hover:bg-fuchsia-500/20 transition-all group"
                >
                  <Video size={14} className="text-fuchsia-300 mb-1 group-hover:scale-110 transition-transform" aria-hidden />
                  <div className="text-[9px] text-fuchsia-100 font-bold uppercase tracking-wide">Rhizoh Studio</div>
                  <div className="text-[7px] text-fuchsia-200/50 mt-1">Kernel, director, presence (bu sayfa)</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 13 });
                    uiStore.dispatch({
                      type: "ADD_LOG",
                      payload: {
                        ts: new Date().toLocaleTimeString(),
                        type: "SYS",
                        data: "SWARM RELAY · L13 Robotics — gateway /robotics/* telemetri ve komut köprüsü"
                      }
                    });
                  }}
                  className="p-3 rounded border border-amber-400/30 bg-amber-500/10 text-left hover:bg-amber-500/20 transition-all group col-span-2"
                >
                  <Radio size={14} className="text-amber-300 mb-1 group-hover:scale-110 transition-transform" aria-hidden />
                  <div className="text-[9px] text-amber-100 font-bold uppercase tracking-wide">Swarm Relay</div>
                  <div className="text-[7px] text-amber-200/50 mt-1">Drone telemetrisi · detay L13 Robotics panel</div>
                </button>
              </div>
            ) : null}

            {activeTab === "ARCHIVE" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 border border-indigo-400/30 bg-indigo-900/20 rounded">
                  <BookOpen size={20} className="text-indigo-300 shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] text-indigo-200 font-bold uppercase tracking-widest">CODEX Library</div>
                    <div className="text-[8px] text-indigo-300/60">
                      Gateway: transcripts, publish ingest, metadata araması ve event-layer/pdf-brief.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    value={codexQuery}
                    onChange={(e) => setCodexQuery(e.target.value)}
                    placeholder="metadata arama (ör. pdf, greenroom)"
                    className="min-w-[8rem] flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[8px] normal-case"
                  />
                  <button
                    type="button"
                    onClick={() => void refreshArchive()}
                    className="text-[8px] px-2 py-1 rounded-lg border border-cyan-400/40 text-cyan-100 font-bold"
                  >
                    Yenile
                  </button>
                  <button
                    type="button"
                    onClick={() => mirrorToRhizohScene()}
                    className="text-[8px] px-2 py-1 rounded-lg border border-fuchsia-400/40 text-fuchsia-100 font-bold"
                  >
                    Sahneye yansıt
                  </button>
                </div>
                <div className="text-[8px] text-white/45">{archiveStatus}</div>

                {mediaPlaylist.length > 0 ? (
                  <div className="max-h-24 overflow-y-auto no-scrollbar space-y-1 rounded border border-white/10 bg-black/25 p-2">
                    {mediaPlaylist.map((row, idx) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => applyPlaylistIndex(idx)}
                        className={`w-full text-left rounded px-2 py-1 text-[8px] normal-case ${
                          idx === mediaIndex ? "bg-cyan-500/20 text-cyan-100" : "text-white/70 hover:bg-white/5"
                        }`}
                      >
                        <span className="text-cyan-400/80">{row.kind}</span> · {row.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[8px] text-white/40 normal-case">Henüz HTTP(S) ingest veya replay URL’si yok; Studio publish veya transcript meta ekleyin.</div>
                )}

                <div className="p-3 rounded-xl border border-cyan-400/20 bg-black/40">
                  <div className="text-[8px] text-cyan-400/60 tracking-[0.2em] uppercase mb-2 flex justify-between gap-2">
                    <span>Castle Media Player</span>
                    <span className="text-white/40 shrink-0">{mediaState.playing ? "PLAYING" : "PAUSED"}</span>
                  </div>
                  <div className="text-[9px] text-white font-mono mb-2 truncate">{mediaState.track}</div>
                  {mediaState.src ? (
                    mediaState.kind === "audio" ? (
                      <audio key={mediaState.src} ref={mediaElRef} src={mediaState.src} controls className="mb-2 w-full" />
                    ) : (
                      <video
                        key={mediaState.src}
                        ref={mediaElRef}
                        src={mediaState.src}
                        controls
                        playsInline
                        className="mb-2 max-h-28 w-full rounded border border-white/10 bg-black"
                      />
                    )
                  ) : null}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!mediaState.src) {
                          setArchiveStatus("Önce listeden oynatılabilir bir URL seçin.");
                          return;
                        }
                        setMediaState((s) => ({ ...s, playing: !s.playing }));
                      }}
                      className="p-2 rounded-full bg-cyan-400 text-black hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={mediaState.playing ? "Duraklat" : "Oynat"}
                    >
                      <PlayCircle size={16} className={mediaState.playing ? "animate-pulse" : ""} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!mediaPlaylist.length) return;
                        applyPlaylistIndex(mediaIndex + 1);
                      }}
                      className="p-1.5 text-white/50 hover:text-white transition-colors"
                      aria-label="Sonraki kaynak"
                    >
                      <FastForward size={14} aria-hidden />
                    </button>
                    <div className="flex-1 flex items-center gap-0.5 h-4 opacity-70">
                      {waveHeights.map((h, i) => (
                        <div key={i} className="w-1 bg-cyan-400 rounded-full transition-[height] duration-200" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[8px] text-indigo-300/80 tracking-wide uppercase">Arama sonuçları · doküman özeti</div>
                <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1">
                  {codexHits.length === 0 ? (
                    <div className="text-[8px] text-white/40 normal-case">Sonuç yok — sorguyu değiştirip yenileyin.</div>
                  ) : (
                    codexHits.slice(0, 12).map((row, i) => (
                      <div
                        key={row.id || `hit-${i}`}
                        className="rounded border border-white/10 bg-black/20 p-2 text-[8px] text-white/75 normal-case"
                      >
                        <div className="font-mono text-cyan-200/80">
                          {row.eventType} · {new Date(row.ts || Date.now()).toLocaleTimeString()}
                        </div>
                        <div className="mt-0.5 line-clamp-3">{String(row.text || "").slice(0, 220)}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => void runPdfBriefOnRow(row)}
                            className="rounded border border-amber-400/35 px-2 py-0.5 text-[7px] text-amber-100"
                          >
                            PDF / doküman brief
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const t = String(row.text || "").slice(0, 8000);
                              setPdfBriefText(t);
                              uiStore.dispatch({
                                type: "SET_RHIZOH_SCENE_ANCHOR",
                                payload: { open: true, title: `Ham metin · ${row.eventType}`, kind: "text", text: t }
                              });
                            }}
                            className="rounded border border-indigo-400/35 px-2 py-0.5 text-[7px] text-indigo-100"
                          >
                            Metni sahneye aç
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {pdfBriefText ? (
                  <div className="rounded border border-emerald-400/25 bg-emerald-950/20 p-2 text-[8px] text-emerald-100/90 normal-case max-h-28 overflow-y-auto no-scrollbar whitespace-pre-wrap">
                    {pdfBriefText.slice(0, 2400)}
                    {pdfBriefText.length > 2400 ? "…" : ""}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "NETWORK" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Share2 size={14} aria-hidden /> Social Mesh Bindings
                  </div>
                  <div className="text-[8px] text-white/40 max-w-[14rem] text-right normal-case">{socialStatus}</div>
                </div>
                <p className="text-[8px] text-white/50 leading-relaxed">
                  Dış yayın ve sinyaller için gateway <span className="text-cyan-200/80">/social/channels</span> ve{" "}
                  <span className="text-cyan-200/80">/social/broadcast</span> uçlarına bağlanır; Event Mesh (L9) ile birlikte düşünün.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {SOCIAL_MESH_PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const connected = meshRowConnected(platform);
                    return (
                      <div
                        key={platform.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          connected ? "border-emerald-500/30 bg-emerald-900/20" : "border-white/10 bg-black/20"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`shrink-0 p-1.5 rounded-full ${connected ? "bg-emerald-500/20" : "bg-white/5"} ${platform.color}`}>
                            <Icon size={14} aria-hidden />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[9px] font-bold text-white uppercase truncate">{platform.name}</div>
                            <div className="text-[7px] text-white/40 uppercase tracking-widest">
                              {connected ? "Data stream (UI)" : "Disconnected"}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => (connected ? disconnectSocialRow(platform) : void connectSocialRow(platform))}
                          className={`shrink-0 text-[8px] px-3 py-1 rounded font-bold uppercase transition-colors ${
                            connected ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30" : "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                          }`}
                        >
                          {connected ? "Unbind" : "Connect"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {SOCIAL_MESH_PLATFORMS.some((p) => meshRowConnected(p)) ? (
                  <div className="mt-1 p-2 border border-cyan-400/20 bg-cyan-900/20 rounded flex items-center gap-2">
                    <input
                      type="text"
                      value={broadcastDraft}
                      onChange={(e) => setBroadcastDraft(e.target.value)}
                      placeholder="Bağlı kanallara hızlı duyuru (broadcast)…"
                      className="flex-1 min-w-0 bg-transparent border-none outline-none text-[9px] text-cyan-100 placeholder:text-cyan-300/30"
                    />
                    <button
                      type="button"
                      onClick={() => void sendMeshBroadcast()}
                      className="shrink-0 text-[8px] px-2 py-1 bg-cyan-500 text-black font-black rounded uppercase"
                    >
                      Send
                    </button>
                  </div>
                ) : null}

                <div className="mt-2 p-3 border border-fuchsia-500/30 bg-fuchsia-900/10 rounded-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-fuchsia-500/20 pb-2">
                    <div className="text-[9px] text-fuchsia-300 font-bold uppercase tracking-widest flex items-center gap-2">
                      <MessageCircle size={12} aria-hidden /> Agent Broadcast Queue
                    </div>
                    <select
                      value={autoPostMode}
                      onChange={(e) => setAutoPostMode(e.target.value)}
                      className="bg-black/50 border border-fuchsia-500/30 text-fuchsia-200 text-[8px] rounded px-2 py-1 outline-none uppercase max-w-[11rem]"
                    >
                      <option value="MANUAL_APPROVAL">Sıfır otonomi (onay şart)</option>
                      <option value="SEMI_AUTO">Yarı otonom (öneriler)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 mb-2 text-[8px] text-white/55 normal-case cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachSimContext}
                      onChange={(e) => setAttachSimContext(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Onayda Library oynatılan ambiyans + CODEX özetini gönderiye ekle
                  </label>

                  {pendingBroadcasts.length === 0 ? (
                    <div className="text-[8px] text-white/40 text-center py-2 italic normal-case">Onay bekleyen ajan yayını yok.</div>
                  ) : (
                    <div className="space-y-2 max-h-[min(240px,40vh)] overflow-y-auto no-scrollbar">
                      {pendingBroadcasts.map((broadcast) => (
                        <div
                          key={broadcast.id}
                          className="p-2 bg-black/40 border border-fuchsia-500/20 rounded relative group"
                          onMouseEnter={() => focusCameraForBroadcast(broadcast)}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-[8px] text-cyan-300 font-bold uppercase">
                              {broadcast.agent} <span className="text-white/40">via</span> {broadcast.platform}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[7px] text-fuchsia-300/50 uppercase tracking-tighter hidden sm:inline">heat</span>
                              <BroadcastPulseSparkline
                                values={broadcast.heatPulse || buildPulseSeriesFromSeed(String(broadcast.id).length * 9, 12)}
                              />
                              <span className="text-[7px] text-white/40">{broadcast.time}</span>
                            </div>
                          </div>
                          {broadcast.trigger ? (
                            <div className="text-[7px] text-fuchsia-300/75 font-mono mb-0.5">L9 · {broadcast.trigger}</div>
                          ) : null}
                          <p className="text-[9px] text-white/80 leading-relaxed pr-16 normal-case">"{broadcast.text}"</p>
                          <button
                            type="button"
                            className="mt-1 text-[7px] text-indigo-300/95 hover:text-indigo-200 normal-case"
                            onClick={() => setThoughtExpandedId((id) => (id === broadcast.id ? null : broadcast.id))}
                          >
                            Thought process (L8 City Mind)
                          </button>
                          {thoughtExpandedId === broadcast.id && Array.isArray(broadcast.thoughtChain) ? (
                            <ol className="mt-1.5 list-decimal pl-4 space-y-1 text-[8px] text-indigo-100/88 normal-case leading-relaxed border-t border-indigo-500/15 pt-1.5">
                              {broadcast.thoughtChain.map((line, li) => (
                                <li key={`${broadcast.id}-th-${li}`}>{line}</li>
                              ))}
                            </ol>
                          ) : null}
                          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => void approveBroadcast(broadcast)}
                              className="text-[8px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded hover:bg-emerald-500/40"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectBroadcast(broadcast.id)}
                              className="text-[8px] px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded hover:bg-rose-500/40"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === "ALLIANCES" ? (
              <div className="space-y-3">
                <div className="text-[9px] text-sky-300 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Handshake size={14} aria-hidden /> Diplomacy &amp; Rhizoh-Mirror Bridges
                </div>
                <p className="text-[8px] text-white/50 leading-relaxed normal-case">
                  Çevrimiçi kaleler <span className="text-cyan-200/80">active_castles</span> koleksiyonundan okunur; köprü kurunca Apex sahnesinde
                  parabolik enerji arkı ve (Master / Rhizoh varsa) ajan transit animasyonu başlar.
                </p>
                {!bridgeRegistryReady ? (
                  <div className="text-[8px] text-amber-200/90 border border-amber-400/30 rounded-lg px-2 py-2 bg-amber-950/20 normal-case">
                    Firebase yapılandırılmadı veya oturum yok — liste yerel demo modunda; yine de INITIATE BRIDGE sahne arkını üretebilir.
                  </div>
                ) : null}
                {remoteCastles.length === 0 ? (
                  <div className="text-[8px] text-white/40 text-center py-6 normal-case italic">
                    Aktif uzak kale sinyali yok. Başka bir mimar kalenizi açıp konum heartbeat gönderdiğinde burada görünür.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[min(260px,42vh)] overflow-y-auto no-scrollbar">
                    {remoteCastles.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-2 rounded border border-cyan-500/25 bg-black/30 text-[8px]"
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-cyan-200/90 truncate">{c.displayName || c.id.slice(0, 10)}</div>
                          <div className="text-white/45 normal-case mt-0.5">
                            {Number.isFinite(c.lat) && Number.isFinite(c.lon)
                              ? `${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}`
                              : "—"}{" "}
                            · nexus{" "}
                            {typeof c.nexusEnergy === "number" ? `${(c.nexusEnergy * 100).toFixed(0)}%` : "—"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onInitiateMirrorBridge?.(c)}
                          className="shrink-0 px-2 py-1 rounded-lg border border-emerald-400/45 bg-emerald-500/15 text-emerald-200 font-black uppercase text-[7px] tracking-wide hover:bg-emerald-500/25"
                        >
                          Initiate bridge
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
  }
);

SovereignCastleCommandPanel.displayName = "SovereignCastleCommandPanel";

function buildRhizohNormalizedLlmOutput(out, gatewaySnapshot, mapSurfaceActive) {
  const healthState = buildRhizohHealthState({
    gatewayPhase: gatewaySnapshot?.phase,
    healthDeps: gatewaySnapshot?.healthDeps,
    mapSurfaceActive
  });
  const policy = deriveRhizohPolicy({
    healthState,
    rhizohRouter: out.rhizohRouter,
    gatewayPhase: gatewaySnapshot?.phase
  });
  return normalizeRhizohOutput({
    reply: out.reply,
    router: out.rhizohRouter,
    resonance: out.outcomeResonance,
    emotions: out.rhizohEmotions,
    policy,
    gatewayPhase: gatewaySnapshot?.phase
  });
}

const RhizohCommsPanel = memo(
  ({
    engineRef,
    selectedConnectionId,
    selectedAgentId,
    gatewayModel = null,
    onGatewayRetry = () => {},
    hasHttpOrigin = false,
    castleAuth = null,
    continuityBuilder = null,
    socialFieldPreview = null,
    onPersistRhizohTurn = null,
    socialRegistryPreview = null,
    browserPresenceRef = null,
    remoteAgentActivity = null,
    productDecisionOverlayRef = null,
    rhizohGenerationMode = "STANDARD"
  }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const mapSurfaceActive = useUISelector((s) => s.mapSurfaceActive);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const prevGatewayPhaseRef = useRef("");
  const gatewayModelRef = useRef(gatewayModel);
  gatewayModelRef.current = gatewayModel;
  const presencePhaseWasRef = useRef(QPP_PHASE.IDLE);
  const [input, setInput] = useState("");
  const [lastReply, setLastReply] = useState("Henüz yanıt yok — ilk komutunuzu gönderin.");
  const [isThinking, setIsThinking] = useState(false);
  const thinkWatchdogRef = useRef(0);
  const [source, setSource] = useState("local");
  const [provider, setProvider] = useState("openai");
  /** Gateway: env = sunucu OPENAI_* , user_connection = kayıtlı bağlantı (giriş + connectionId), auto = önce sunucu anahtarı */
  const [llmKeySource, setLlmKeySource] = useState("auto");
  const [lastBillingLabel, setLastBillingLabel] = useState(null);
  const [commsError, setCommsError] = useState(null);
  const [sendPulseNonce, setSendPulseNonce] = useState(0);
  const [lastRouterIntent, setLastRouterIntent] = useState("CHAT");
  const [qppSound, setQppSound] = useState(() => {
    try {
      return window.localStorage.getItem("rhizoh.qpp.sound") === "1";
    } catch {
      return false;
    }
  });
  const [presenceFsm, dispatchPresence] = useReducer(stepPresenceFsm, undefined, initialPresenceFsmState);
  const [sensorLiveTick, setSensorLiveTick] = useState(0);
  const socialRegistryRef = useRef(socialRegistryPreview);
  socialRegistryRef.current = socialRegistryPreview;
  const presenceFsmRef = useRef(presenceFsm);
  presenceFsmRef.current = presenceFsm;
  const lastPhysicsBiasRef = useRef(0);
  const btn =
    "text-[8px] px-2 py-1.5 rounded-lg border font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";

  useEffect(() => {
    emitRhizohPresence({ kind: "fsm", source: "rhizoh-comms", ...presenceFsm });
  }, [presenceFsm]);

  useEffect(() => {
    if (focus !== 10 || !browserPresenceRef?.current) return undefined;
    const id = window.setInterval(() => setSensorLiveTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [focus, browserPresenceRef]);

  useEffect(() => {
    return installRhizohPresenceAcoustics({ isSoundEnabled: () => qppSound });
  }, [qppSound]);

  useEffect(() => {
    if (presenceFsm.phase !== QPP_PHASE.PULSE) return undefined;
    const id = window.setTimeout(() => {
      dispatchPresence({ type: QPP_EVENT.PULSE_COMPLETE, payload: { stillThinking: isThinking } });
    }, 1150);
    return () => window.clearTimeout(id);
  }, [presenceFsm.phase, isThinking]);

  useEffect(() => {
    if (presenceFsm.phase !== QPP_PHASE.SETTLING) return undefined;
    const id = window.setTimeout(() => dispatchPresence({ type: QPP_EVENT.FADE_COMPLETE }), 420);
    return () => window.clearTimeout(id);
  }, [presenceFsm.phase]);

  useEffect(() => {
    if (presenceFsm.phase !== QPP_PHASE.QUIET || !presenceFsm.durationMs) return undefined;
    const id = window.setTimeout(() => dispatchPresence({ type: QPP_EVENT.TIMEOUT }), presenceFsm.durationMs);
    return () => window.clearTimeout(id);
  }, [presenceFsm.phase, presenceFsm.durationMs]);

  useEffect(() => {
    if (presenceFsm.phase !== QPP_PHASE.FADE) return undefined;
    const id = window.setTimeout(() => dispatchPresence({ type: QPP_EVENT.FADE_COMPLETE }), 900);
    return () => window.clearTimeout(id);
  }, [presenceFsm.phase]);

  useEffect(() => {
    if (presencePhaseWasRef.current === QPP_PHASE.FADE && presenceFsm.phase === QPP_PHASE.IDLE) {
      setLastReply((r) => (String(r).trim() === "—" ? "Rhizoh burada — sessiz eşlik sona erdi." : r));
    }
    presencePhaseWasRef.current = presenceFsm.phase;
  }, [presenceFsm.phase]);

  useEffect(() => {
    if (focus !== 10) return undefined;
    const id = window.setInterval(() => {
      if (presenceFsmRef.current.phase !== QPP_PHASE.QUIET) return;
      const phys = socialRegistryRef.current?.socialPhysics;
      if (!phys || typeof phys !== "object") return;
      const qProb = Number(phys.quietStateProbability) || 0;
      const recon = Number(phys.reconciliationNeed) || 0;
      const obs = Number(phys.observationMode) || 0;
      const iEng = Number(phys.interactionEnergy);
      const energy = Number.isFinite(iEng) ? iEng : 1;
      const ph = String(phys.phase || "");
      if (ph !== "reconcile" && qProb < 0.28 && recon < 0.56) return;
      const t = Date.now();
      if (t - lastPhysicsBiasRef.current < 2600) return;
      lastPhysicsBiasRef.current = t;
      const extend = Math.round(320 + qProb * 2600 * recon + obs * 480);
      const intensity = Math.max(0.2, Math.min(0.55, 0.44 - obs * 0.15));
      const resonance = Math.max(0.24, Math.min(0.62, 0.54 - energy * 0.15));
      dispatchPresence({
        type: QPP_EVENT.PHYSICS_BIAS,
        payload: {
          biasField: {
            quietExtendMs: extend,
            intensity,
            resonance,
            ...(obs > 0.55 ? { label: "holding space" } : {})
          }
        }
      });
    }, 3200);
    return () => window.clearInterval(id);
  }, [focus]);

  useEffect(() => {
    const cur = gatewayModel?.phase || "";
    const prev = prevGatewayPhaseRef.current;
    prevGatewayPhaseRef.current = cur;
    if (cur !== "connected" || prev === "connected") return;
    const items = drainRhizohMessageIntentQueue();
    if (!items.length) return;
    void (async () => {
      for (const it of items) {
        if (it.type !== "SEND_MESSAGE") continue;
        setSendPulseNonce((n) => n + 1);
        dispatchPresence({
          type: QPP_EVENT.USER_MESSAGE,
          payload: {
            label: "listening",
            intensity: 0.48,
            resonance: 0.55,
            pulsePattern: "receive_absorb_settle"
          }
        });
        setIsThinking(true);
        setCommsError(null);
        try {
          if (llmKeySource === "user_connection" && !castleAuth?.user) {
            setCommsError("Kayıtlı bağlantı modu için hesapla giriş yapın.");
            break;
          }
          let idToken = "";
          try {
            idToken = castleAuth?.user ? await castleAuth.user.getIdToken() : "";
          } catch {
            idToken = "";
          }
          const st = uiStore.getState();
          const f = Number.isFinite(Number(it.focus)) ? Number(it.focus) : focus;
          const profile = LAYER_UI_PROFILES[f] || LAYER_UI_PROFILES[10];
          const spec = LAYER_SPECS.find((layerRow) => layerRow.id === f) || LAYER_SPECS[10];
          const q = String(it.message || "");
          const cont =
            typeof continuityBuilder === "function"
              ? continuityBuilder(q)
              : {
                  runtime: {
                    layerFocus: f,
                    realityMode: st.realityMode,
                    governanceState: st.governanceState,
                    mapSurfaceActive: st.mapSurfaceActive,
                    message: q.slice(0, 1600),
                    gatewayPhase: gatewayModelRef.current?.phase,
                    rhizohGatewayPhase: gatewayModelRef.current?.phase
                  }
                };
          const out = await queryRhizohLLM({
            message: q,
            provider: it.provider || "openai",
            connectionId: it.connectionId || "",
            agentId: it.agentId || "",
            layerProfile: profile,
            layerSpec: spec,
            simTime: coreWorld.simTime,
            idToken,
            llmKeySource: it.llmKeySource || "auto",
            generationMode: rhizohGenerationMode,
            gatewayUx: gatewayModelRef.current,
            continuity: cont,
            productDecisionOverlay: productDecisionOverlayRef?.current ?? null
          });
          const norm = buildRhizohNormalizedLlmOutput(out, gatewayModelRef.current, mapSurfaceActive);
          const procQ = materializeCommsFromNormalized(norm, out.reply);
          if (typeof onPersistRhizohTurn === "function") {
            try {
              onPersistRhizohTurn(
                String(it.message || ""),
                out.reply,
                await rhizohPersistTraceFromOut(out, {
                  traceId: out.traceId || "",
                  gatewayPhase: gatewayModelRef.current?.phase,
                  mapSurfaceActive,
                  layerFocus: f,
                  simTime: coreWorld.simTime,
                  realityMode: st.realityMode,
                  governanceState: st.governanceState,
                  idToken
                })
              );
              logRhizohHealth("telemetry_emitted", { traceId: String(out?.traceId || "") });
            } catch {
              /* noop */
            }
          }
          setLastReply(procQ.uiReply);
          setLastRouterIntent(out.rhizohRouter?.intent || "CHAT");
          setSource(out.source || "local");
          if (norm.type === "QPP_STATE") {
            const pr = norm.payload.presence;
            dispatchPresence({
              type: QPP_EVENT.QPP_ENTER,
              payload: {
                intensity: pr.intensity,
                resonance: pr.resonance,
                durationMs: pr.durationMs,
                label: typeof pr.state === "string" ? pr.state : "listening",
                pulsePattern: pr.pulsePattern
              }
            });
          } else {
            dispatchPresence({ type: QPP_EVENT.THINKING_END });
          }
          applyDirective(out.directive);
          if (!procQ.skipSpeech) speak(procQ.uiReply);
          else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
          uiStore.dispatch({
            type: "ADD_LOG",
            payload: {
              ts: new Date().toLocaleTimeString(),
              type: "SYS",
              data: `RHIZOH COMMS (kuyruk) [${out.source}] · ${String(it.message || "").slice(0, 120)}`
            }
          });
        } catch (err) {
          const msg = String(err?.message || err || "İstek başarısız");
          setCommsError(msg.length > 160 ? `${msg.slice(0, 160)}…` : msg);
        } finally {
          setIsThinking(false);
        }
      }
    })();
  }, [gatewayModel?.phase, castleAuth?.user, llmKeySource, continuityBuilder, onPersistRhizohTurn]);

  const ensureRhizoh = () => {
    if (coreWorld.rhizohIdx !== -1) return coreWorld.rhizohIdx;
    const idx = coreWorld.allocate("RHIZOH-PRIME", STATE.RHIZOH);
    uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "RHIZOH ONLINE · avatar materialized." } });
    return idx;
  };

  const focusRhizoh = () => {
    const idx = ensureRhizoh();
    if (idx < 0) return;
    engineRef.current?.focusWorldPoint(coreWorld.posX[idx], coreWorld.posY[idx], coreWorld.posZ[idx], 1800);
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "tr-TR";
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const applyDirective = (directive) => {
    const engine = engineRef.current;
    if (!engine || !directive) return;
    const d = String(directive).toUpperCase();
    if (d === "FOCUS_RHIZOH") {
      focusRhizoh();
      return;
    }
    if (d === "ZOOM_CASTLE") {
      const c = window.__CASTLE_CESIUM__;
      if (c?.focusCastle) c.focusCastle();
      else engine.focusCastleBeacon();
      return;
    }
    if (d === "ZOOM_AGENT") {
      engine.focusNextAgent();
      return;
    }
    if (d === "ISTANBUL_OVERVIEW") {
      window.__CASTLE_CESIUM__?.flyToIstanbul?.();
    }
  };

  const sendPrompt = async (overrideRaw) => {
    const q = String(overrideRaw != null ? overrideRaw : input).trim();
    if (!q || isThinking) return;
    setCommsError(null);
    const profile = LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10];
    const spec = LAYER_SPECS.find((layerRow) => layerRow.id === focus) || LAYER_SPECS[10];
    if (llmKeySource === "user_connection" && !castleAuth?.user) {
      setCommsError("Kayıtlı bağlantı modu için hesapla giriş yapın.");
      setIsThinking(false);
      return;
    }
    const gwPh = gatewayModel?.phase || "";
    if (gwPh === "offline" || gwPh === "offline_dns") {
      setSendPulseNonce((n) => n + 1);
      dispatchPresence({
        type: QPP_EVENT.USER_MESSAGE,
        payload: {
          label: "listening",
          intensity: 0.45,
          resonance: 0.5,
          pulsePattern: "receive_absorb_settle"
        }
      });
      enqueueRhizohMessageIntent({
        type: "SEND_MESSAGE",
        message: q,
        provider,
        connectionId: selectedConnectionId || "",
        agentId: selectedAgentId || "",
        llmKeySource,
        focus
      });
      setLastReply("Bağlantı kurulur kurulmaz ileteceğim — mesaj sıraya alındı.");
      if (overrideRaw == null) setInput("");
      setIsThinking(false);
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `RHIZOH KUYRUK · ${q.slice(0, 120)}` }
      });
      return;
    }
    setSendPulseNonce((n) => n + 1);
    dispatchPresence({
      type: QPP_EVENT.USER_MESSAGE,
      payload: {
        label: "listening",
        intensity: 0.48,
        resonance: 0.55,
        pulsePattern: "receive_absorb_settle"
      }
    });
    setIsThinking(true);
    if (thinkWatchdogRef.current) window.clearTimeout(thinkWatchdogRef.current);
    thinkWatchdogRef.current = window.setTimeout(() => {
      setIsThinking(false);
      setCommsError((prev) => prev || "Rhizoh yanıtı zaman aşımına uğradı. Lütfen tekrar deneyin.");
      dispatchPresence({ type: QPP_EVENT.THINKING_END });
    }, 65_000);
    ensureRhizoh();
    let idToken = "";
    try {
      idToken = castleAuth?.user ? await castleAuth.user.getIdToken() : "";
    } catch {
      idToken = "";
    }
    try {
      const st = uiStore.getState();
      const cont =
        typeof continuityBuilder === "function"
          ? continuityBuilder(q)
          : {
              runtime: {
                layerFocus: focus,
                realityMode: st.realityMode,
                governanceState: st.governanceState,
                mapSurfaceActive: st.mapSurfaceActive,
                message: q.slice(0, 1600),
                gatewayPhase: gatewayModel?.phase,
                rhizohGatewayPhase: gatewayModel?.phase
              }
            };
      const out = await queryRhizohLLM({
        message: q,
        provider,
        connectionId: selectedConnectionId || "",
        agentId: selectedAgentId || "",
        layerProfile: profile,
        layerSpec: spec,
        simTime: coreWorld.simTime,
        idToken,
        llmKeySource,
        generationMode: rhizohGenerationMode,
        gatewayUx: gatewayModel,
        continuity: cont,
        productDecisionOverlay: productDecisionOverlayRef?.current ?? null
      });
      const norm = buildRhizohNormalizedLlmOutput(out, gatewayModel, mapSurfaceActive);
      const procQ = materializeCommsFromNormalized(norm, out.reply);
      if (typeof onPersistRhizohTurn === "function") {
        try {
          onPersistRhizohTurn(
            q,
            out.reply,
            await rhizohPersistTraceFromOut(out, {
              traceId: out.traceId || "",
              gatewayPhase: gatewayModel?.phase,
              mapSurfaceActive,
              layerFocus: focus,
              simTime: coreWorld.simTime,
              realityMode: st.realityMode,
              governanceState: st.governanceState,
              idToken
            })
          );
        } catch {
          /* noop */
        }
      }
      setLastReply(procQ.uiReply);
      setLastRouterIntent(out.rhizohRouter?.intent || "CHAT");
      if (norm.type === "QPP_STATE") {
        const pr = norm.payload.presence;
        dispatchPresence({
          type: QPP_EVENT.QPP_ENTER,
          payload: {
            intensity: pr.intensity,
            resonance: pr.resonance,
            durationMs: pr.durationMs,
            label: typeof pr.state === "string" ? pr.state : "listening",
            pulsePattern: pr.pulsePattern
          }
        });
      } else {
        dispatchPresence({ type: QPP_EVENT.THINKING_END });
      }
      setSource(out.source || "local");
      const origin = out.llmKeyOrigin || "";
      const bill = out.llmKeyBillingOwner || "";
      if (origin === "env" || bill === "server")
        setLastBillingLabel("Son kullanım: sunucu anahtarı (ENV)");
      else if (origin === "user_connection" || bill === "user")
        setLastBillingLabel("Son kullanım: hesabınızdaki LLM bağlantısı");
      else if (origin || bill) setLastBillingLabel(`Son kullanım: ${origin || bill}`);
      else setLastBillingLabel(null);
      applyDirective(out.directive);
      if (!procQ.skipSpeech) speak(procQ.uiReply);
      else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `RHIZOH COMMS [${out.source}] · ${q}` }
      });
      if (overrideRaw == null) setInput("");
    } catch (err) {
      const msg = String(err?.message || err || "İstek başarısız");
      setCommsError(msg.length > 160 ? `${msg.slice(0, 160)}…` : msg);
      setLastReply("Bu komut gönderilemedi. Bağlantınızı kontrol edip yeniden deneyin.");
    } finally {
      if (thinkWatchdogRef.current) {
        window.clearTimeout(thinkWatchdogRef.current);
        thinkWatchdogRef.current = 0;
      }
      setIsThinking(false);
    }
  };

  const sendDisabled = !input.trim() || isThinking;
  const sendReason = isThinking ? "Rhizoh yanıt üretiyor…" : !input.trim() ? "Göndermek için metin yazın" : "";
  const inQuietPresence =
    presenceFsm.phase === QPP_PHASE.QUIET || presenceFsm.phase === QPP_PHASE.FADE;
  const cognitiveTraceLabel =
    presenceFsm.phase !== QPP_PHASE.IDLE
      ? presenceFsm.label
      : deriveCognitiveTraceLabel(lastRouterIntent, gatewayModel?.phase);
  void sensorLiveTick;
  const basePresenceTel =
    socialRegistryPreview?.presenceTelemetry && typeof socialRegistryPreview.presenceTelemetry === "object"
      ? socialRegistryPreview.presenceTelemetry
      : {};
  let mergedPresenceTelemetry = basePresenceTel;
  if (focus === 10 && browserPresenceRef?.current) {
    const snap = snapshotBrowserPresenceForCsil(browserPresenceRef.current);
    mergedPresenceTelemetry = { ...basePresenceTel };
    if (basePresenceTel.qppMode !== "cautious") {
      if (snap.cursorActivity || snap.micActive) {
        mergedPresenceTelemetry.qppMode = "soft_pulse";
        if (
          presenceFsm.phase === QPP_PHASE.IDLE &&
          (!basePresenceTel.qppLabel || basePresenceTel.qppLabel === "present")
        ) {
          mergedPresenceTelemetry.qppLabel = "noticing presence";
        }
      }
      if (remoteAgentActivity?.active) {
        mergedPresenceTelemetry.qppMode = "soft_pulse";
        if (presenceFsm.phase === QPP_PHASE.IDLE) {
          mergedPresenceTelemetry.qppLabel = mergedPresenceTelemetry.qppLabel || "observing";
        }
      }
    }
  }
  const fieldLabel =
    presenceFsm.phase !== QPP_PHASE.IDLE
      ? cognitiveTraceLabel
      : focus === 10 && mergedPresenceTelemetry?.qppLabel
        ? String(mergedPresenceTelemetry.qppLabel)
        : cognitiveTraceLabel;
  const inputPlaceholder =
    inQuietPresence
      ? "Rhizoh dinliyor…"
      : isThinking
        ? "Düşünceni sürdür."
        : "Katman, kamera veya görev yazın; gateway açıksa sunucu LLM, yoksa yerel yanıt.";

  return (
    <div
      className="rounded-2xl p-4 space-y-3 normal-case"
      style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
    >
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300 flex items-center gap-2">
        <Mic size={12} aria-hidden /> RHIZOH COMMS
      </div>
      {gatewayModel ? (
        <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-[9px] text-white/75 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-cyan-100/95">Ağ geçidi:</span> {gatewayModel.headline}
            {rhizohGatewayPhaseShowsRetry(gatewayModel.phase) && hasHttpOrigin ? (
              <button
                type="button"
                onClick={onGatewayRetry}
                className="rounded border border-cyan-400/40 px-2 py-0.5 text-[8px] text-cyan-100 hover:bg-cyan-500/10"
              >
                Yeniden dene
              </button>
            ) : null}
          </div>
          <p className="text-[8px] text-white/55 leading-relaxed">{gatewayModel.hint}</p>
          <span className="sr-only" aria-live="polite">
            {gatewayModel.liveMessage}
          </span>
        </div>
      ) : null}
      <div className="text-[8px] text-white/45">
        Yanıt kaynağı: <span className="text-white/75">{source}</span>
        {isThinking ? " · üretiliyor…" : ""}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[8px] text-white/50">Provider</span>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          aria-label="LLM sağlayıcı seçimi"
          className="bg-black/35 border border-white/15 rounded-lg px-2 py-1 text-[9px] text-white normal-case tracking-normal outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <option value="openai">OpenAI (gateway / sunucu anahtarı)</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Google Gemini</option>
          <option value="xai">xAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="mistral">Mistral</option>
          <option value="openrouter">OpenRouter</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[8px] text-white/50">Anahtar</span>
        <select
          value={llmKeySource}
          onChange={(e) => setLlmKeySource(e.target.value)}
          aria-label="LLM anahtar kaynağı"
          className="bg-black/35 border border-white/15 rounded-lg px-2 py-1 text-[9px] text-white normal-case tracking-normal outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <option value="auto">Otomatik (önce sunucu ENV, yoksa bağlantım)</option>
          <option value="env">Yalnız sunucu (ENV)</option>
          <option value="user_connection">Yalnız kayıtlı bağlantım (giriş gerekir)</option>
        </select>
      </div>
      {lastBillingLabel ? (
        <p className="text-[8px] text-emerald-200/85 leading-relaxed">{lastBillingLabel}</p>
      ) : null}
      <p className="text-[8px] text-white/50 leading-relaxed">
        Bağlantı kimliği sunucuda yalnızca sizin hesabınızın alt koleksiyonundan çözülür; anahtar tarayıcıya gönderilmez. Net faturalama için «Yalnız sunucu» veya «Yalnız bağlantım» seçin.
      </p>
      {commsError ? (
        <div role="alert" className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-2 py-1.5 text-[8px] text-amber-100/95">
          {commsError}
        </div>
      ) : null}
      {focus === 10 && socialFieldPreview ? (
        <RhizohGroupPresenceField socialField={socialFieldPreview} pulseNonce={sendPulseNonce} />
      ) : null}
      <RhizohPresenceField
        phase={presenceFsm.phase}
        intensity={presenceFsm.intensity}
        resonance={presenceFsm.resonance}
        label={fieldLabel}
        pulseNonce={sendPulseNonce}
        presenceTelemetry={focus === 10 ? mergedPresenceTelemetry : null}
        csilVisualActive={focus === 10 && !!mergedPresenceTelemetry && !!mergedPresenceTelemetry.qppLabel}
        resonanceActive={
          isThinking ||
          presenceFsm.phase === QPP_PHASE.QUIET ||
          presenceFsm.phase === QPP_PHASE.FADE ||
          presenceFsm.phase === QPP_PHASE.ABSORBING ||
          presenceFsm.phase === QPP_PHASE.PULSE ||
          presenceFsm.phase === QPP_PHASE.SETTLING
        }
        soundEnabled={qppSound}
        onSoundEnabledChange={(on) => {
          setQppSound(on);
          try {
            window.localStorage.setItem("rhizoh.qpp.sound", on ? "1" : "0");
          } catch {
            /* noop */
          }
        }}
      />
      <div className="text-[8px] text-white/75 leading-relaxed min-h-[2.5rem] border border-white/5 rounded-lg px-2 py-1.5 bg-black/20">
        {inQuietPresence ? (
          <span className="text-cyan-100/70 italic">
            Quiet presence — Rhizoh holds space{lastReply && lastReply !== "—" ? `: ${lastReply}` : ""}.
          </span>
        ) : (
          lastReply
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="rhizoh-comms-input" className="text-[8px] font-semibold text-cyan-200/80">
          Mesaj
        </label>
        <div className="flex gap-2">
          <input
            id="rhizoh-comms-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !sendDisabled) sendPrompt();
            }}
            className="flex-1 bg-black/35 border border-white/15 rounded-lg px-2 py-1.5 text-[9px] text-white normal-case tracking-normal outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            placeholder={inputPlaceholder}
            aria-describedby="rhizoh-comms-send-hint"
          />
          <button
            type="button"
            className={`${btn} border-cyan-400/35 text-cyan-100 disabled:opacity-40 disabled:cursor-not-allowed`}
            onClick={sendPrompt}
            disabled={sendDisabled}
            aria-label="Rhizoh mesajını gönder"
            title={sendReason || "Gönder"}
          >
            {isThinking ? "…" : "Gönder"}
          </button>
        </div>
        <p id="rhizoh-comms-send-hint" className="text-[8px] text-white/45">
          {sendReason || "Enter ile de gönderebilirsiniz."}
        </p>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[8px] text-violet-200/70">TCEE:</span>
          <button
            type="button"
            className={`${btn} border-violet-400/40 text-violet-100/95`}
            onClick={() => setInput("WAKE --reason manual")}
          >
            WAKE → kutuya
          </button>
          <button
            type="button"
            className={`${btn} border-fuchsia-400/35 text-fuchsia-100/90 disabled:opacity-40`}
            disabled={isThinking}
            onClick={() => void sendPrompt("WAKE --reason manual")}
          >
            WAKE · gönder
          </button>
          <button
            type="button"
            className={`${btn} border-white/15 text-white/70 disabled:opacity-40`}
            disabled={isThinking}
            onClick={() => void sendPrompt("wake")}
          >
            wake
          </button>
          <span className="text-[7px] text-white/40 normal-case">
            DSL gateway beklemeden; Inspect WAKE=awake.
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${btn} border-white/20 text-white/75`} onClick={focusRhizoh}>
          Spawn + Fokus Rhizoh
        </button>
        <button type="button" className={`${btn} border-white/20 text-white/75`} onClick={() => speak(lastReply)}>
          Yanıtı seslendir
        </button>
      </div>
    </div>
  );
});

RhizohCommsPanel.displayName = "RhizohCommsPanel";

const AutonomousCompanyDebugPanel = memo(({ runtimeRef }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[12]).theme;
  const [snap, setSnap] = useState(null);
  const [events, setEvents] = useState([]);
  const [traceReplay, setTraceReplay] = useState(null);

  useEffect(() => {
    const intv = setInterval(() => {
      const rt = runtimeRef.current;
      if (!rt) return;
      setSnap(rt.substrate.getSnapshot());
      const ev = rt.substrate.getEventLog({ limit: 8 });
      setEvents(ev);
      const traceId = rt.substrate.getSnapshot().recentTasks?.[0]?.traceId;
      if (traceId) setTraceReplay(rt.substrate.replayTraceV0(traceId));
      else setTraceReplay(null);
    }, 1000);
    return () => clearInterval(intv);
  }, [runtimeRef]);

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">AUTONOMY SUBSTRATE V0</div>
      <div className="text-[8px] text-white/70 normal-case">
        contracts:{snap?.contractCount ?? 0} · approvals:{snap?.approvalPending ?? 0} · tasks(done/failed):
        {snap?.taskCounts?.completed ?? 0}/{snap?.taskCounts?.failed ?? 0}
      </div>
      <div className="text-[8px] text-white/60 normal-case">
        kill: {snap?.killState?.active ? `${snap.killState.level} · ${snap.killState.reason}` : "inactive"} ·
        events:{snap?.eventCount ?? 0} · latest:{snap?.latestEventType ?? "none"}
      </div>
      <div className="text-[8px] text-white/55 normal-case">
        snapshotHash: {snap?.snapshotHash ?? "n/a"}
      </div>
      <div className="text-[8px] text-white/60 normal-case max-h-14 overflow-y-auto no-scrollbar">
        {(events ?? []).map((e) => (
          <div key={e.eventId}>[{e.frameId}] {e.type} · {e.traceId ?? "-"}</div>
        ))}
      </div>
      <div className="text-[8px] text-white/45 normal-case">
        replay(trace): {traceReplay?.traceId ?? "none"} · events:{traceReplay?.eventCount ?? 0} ·
        hash:{traceReplay?.deterministicSnapshotHash ?? "n/a"}
      </div>
      <div className="text-[8px] text-white/60 normal-case max-h-12 overflow-y-auto no-scrollbar">
        {(snap?.recentTasks ?? []).map((t) => (
          <div key={t.taskId}>{t.agentId.replace("RHIZOH_", "").replace("_AGENT", "")}: {t.status} · {t.traceId}</div>
        ))}
      </div>
    </div>
  );
});

export default function AppRhizoh528() {
  const castleAuth = useCastleAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!castleAuth.firebaseConfigured) return;
    void patchIdentityFromAuth(castleAuth.user);
  }, [castleAuth.firebaseConfigured, castleAuth.user]);
  const { remoteCastles, recordBridgePeer, registryReady: bridgeRegistryReady } = useCastleActiveCastles(castleAuth.user?.uid);
  const localBridgePeersRef = useRef(new Set());
  const [bridgeVisualTick, setBridgeVisualTick] = useState(0);
  const companyRuntimeRef = useRef(null);
  if (!companyRuntimeRef.current) companyRuntimeRef.current = createRhizohAutonomousCompanyRuntimeV0();
  useEffect(() => {
    const rt = companyRuntimeRef.current;
    if (!rt) return;
    const traceId = `boot_trace_${Date.now()}`;
    const submitted = rt.substrate.submitTaskProposal({
      agentId: "RHIZOH_RESEARCH_AGENT",
      kind: "boot_market_watch",
      payload: { source: "runtime_boot_seed" },
      requiresApproval: true,
      traceId
    });
    if (submitted?.ok) {
      rt.founderConsole.approve(submitted.taskId, "boot_seed_approved");
      rt.substrate.executeNextReadyTask();
    }
  }, []);
  useEffect(() => {
    void warmSwarmGpu();
  }, []);
  const [booted, setBooted] = useState(false);
  const [cmd, setCmd] = useState("");
  const [rhizohFieldState, setRhizohFieldState] = useState("IDLE");
  const [realityState, setRealityState] = useState("WORLD_STABLE");
  const [governanceState, setGovernanceState] = useState("NORMAL");
  const [lastWhy, setLastWhy] = useState([]);
  const [eventPreview, setEventPreview] = useState(null);
  const [showWhy, setShowWhy] = useState(false);
  const [lastIntentRaw, setLastIntentRaw] = useState("");
  const [demoLoopState, setDemoLoopState] = useState("IDLE");
  const [showClosureMoment, setShowClosureMoment] = useState(false);
  const [replayMoments, setReplayMoments] = useState([]);
  const [onboardingDone, setOnboardingDone] = useState(false);
  /** Sealed Attested Boot Observation Artifact; null if returning user or pending async seal. */
  const [firstBootObservationArtifact, setFirstBootObservationArtifact] = useState(null);
  const [substrateSnapshot, setSubstrateSnapshot] = useState(null);
  const [substrateEvents, setSubstrateEvents] = useState([]);
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceNetworkBlocked, setVoiceNetworkBlocked] = useState(false);
  const [voiceLoopEnabled, setVoiceLoopEnabled] = useState(false);
  /** Uzak LLM üretim rejimi — yazı ve ses aynı modu kullanır (uzun sohbet için NARRATIVE / REFLECTIVE). */
  const [rhizohGenerationMode, setRhizohGenerationMode] = useState("NARRATIVE");
  const [micListening, setMicListening] = useState(false);
  const commandInputRef = useRef(null);
  const gatewayUx = useRhizohGatewayMonitor();
  const gatewaySnapshotRef = useRef({ phase: "initializing" });
  gatewaySnapshotRef.current = { phase: gatewayUx.phase, healthDeps: gatewayUx.healthDeps };
  const hasRhizohHttpOrigin = Boolean(String(getCastleFlightConfig().rhizohLlmHttp || "").trim());
  const [rhizohInlineError, setRhizohInlineError] = useState(null);
  const [hasSentRhizohCommand, setHasSentRhizohCommand] = useState(false);
  const [hasReceivedRhizohReply, setHasReceivedRhizohReply] = useState(false);
  const [showTrustBlurb, setShowTrustBlurb] = useState(true);
  const [commandLog, setCommandLog] = useState([]);
  const [showCommandLog, setShowCommandLog] = useState(false);
  /** Ana komut / ses hattı: LLM yanıtı yazılı (TTS kapalı olsa da görünsün). */
  const [rhizohMainHudReply, setRhizohMainHudReply] = useState(null);
  const [cinematicElapsedMs, setCinematicElapsedMs] = useState(0);
  const [returningUser, setReturningUser] = useState(false);
  const [showReplayGhostTrails, setShowReplayGhostTrails] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  /** Drawer studio: WORLD (map) · LIVE (director) · KERNEL (console). */
  const [drawerStudioTab, setDrawerStudioTab] = useState("chat");
  const [liveAgents, setLiveAgents] = useState([]);
  const [greenRoomLive, setGreenRoomLive] = useState(null);
  const [greenRoomLiveTick, setGreenRoomLiveTick] = useState(0);
  const [sparklineVersion, setSparklineVersion] = useState(0);
  const [continuitySocialTick, setContinuitySocialTick] = useState(0);
  const [rhizohClosureBanner, setRhizohClosureBanner] = useState(null);
  const prevRhizohProductPhaseRef = useRef(null);
  const rhizohProductDecisionOverlayRef = useRef(null);
  const rhizohPhaseEnteredAtMsRef = useRef(Date.now());
  const rhizohTrustSignalPrevRef = useRef(null);
  const rhizohPhaseHydratedRef = useRef(false);
  const rhizohConversationUx = useMemo(() => {
    try {
      const disk = readClientContinuity();
      const meta = disk.meta && typeof disk.meta === "object" ? disk.meta : {};
      const s = loadRhizohProductSession(meta);
      const metricsSnapshot = getRhizohBehaviorMetricsSnapshot();
      const decisionOverlay = finalizeRhizohProductOverlay(metricsSnapshot, meta);
      const introSeen =
        typeof window !== "undefined" && window.localStorage.getItem("rhizoh_intro_seen_v1") === "1";
      const ig = readIdentityGraph();
      const rr = ig.rhizoh && typeof ig.rhizoh === "object" ? ig.rhizoh : {};
      const bondUi =
        (Math.max(0, Math.min(1, Number(rr.trust) || 0)) +
          Math.max(0, Math.min(1, Number(rr.familiarity) || 0))) /
        2;
      const envelope = buildRhizohProductCapabilityEnvelope(s.conversationPhase, {
        governanceBond01: bondUi,
        suppressGovernanceOpsBadgeUnlessBond01:
          decisionOverlay.capabilityGates?.suppressGovernanceOpsBadgeUnlessBond01 ?? null
      });
      const story = buildRhizohPhaseStory(s.conversationPhase);
      const goals = buildRhizohConversationGoals(s.conversationPhase, {
        trust: Number(rr.trust || 0),
        familiarity: Number(rr.familiarity || 0),
        userTurnCount: s.userTurnCount,
        introSeen
      });
      const capabilityRows = buildRhizohCapabilitySurfaceRows(envelope.surfaces);
      const milestonesRaw = Array.isArray(s.closureMilestones) ? s.closureMilestones : [];
      const closureMilestonesPreview = milestonesRaw
        .slice(-3)
        .reverse()
        .map((m) =>
          m && typeof m === "object"
            ? {
                atMs: m.atMs,
                headline: m.headline,
                toPhase: m.toPhase
              }
            : null
        )
        .filter(Boolean);
      const insightsMilestones = milestonesRaw.slice(-16);
      const insightsTurns = Array.isArray(disk.turns) ? disk.turns.slice(-24) : [];
      return {
        label: rhizohConversationPhaseShortLabelTr(s.conversationPhase),
        surfaces: envelope.surfaces,
        story,
        goals,
        capabilityRows,
        closureMilestonesPreview,
        insightsMilestones,
        insightsTurns,
        metricsSnapshot,
        decisionOverlay,
        userGoalHint:
          s.userGoalHintLabel != null
            ? { bucket: s.userGoalHintBucket, label: String(s.userGoalHintLabel) }
            : null
      };
    } catch {
      const metricsSnapshot = getRhizohBehaviorMetricsSnapshot();
      const decisionOverlay = finalizeRhizohProductOverlay(metricsSnapshot, undefined);
      const env = buildRhizohProductCapabilityEnvelope("NEW_USER", {});
      return {
        label: "—",
        surfaces: env.surfaces,
        story: buildRhizohPhaseStory("NEW_USER"),
        goals: buildRhizohConversationGoals("NEW_USER", {}),
        capabilityRows: buildRhizohCapabilitySurfaceRows(env.surfaces),
        closureMilestonesPreview: [],
        insightsMilestones: [],
        insightsTurns: [],
        metricsSnapshot,
        decisionOverlay,
        userGoalHint: null
      };
    }
  }, [continuitySocialTick]);
  useLayoutEffect(() => {
    rhizohProductDecisionOverlayRef.current = rhizohConversationUx.decisionOverlay;
  }, [rhizohConversationUx.decisionOverlay]);
  const rhizohPolicyLearningGuard = useMemo(() => {
    try {
      const disk = readClientContinuity();
      const meta = disk.meta && typeof disk.meta === "object" ? disk.meta : {};
      return getRhizohPolicyProductionInsight(meta);
    } catch {
      return getRhizohPolicyProductionInsight(undefined);
    }
  }, [continuitySocialTick]);
  const [liveReactionToast, setLiveReactionToast] = useState(null);
  const [immersiveLiveTrace, setImmersiveLiveTrace] = useState(null);
  const [replayTimelinePct, setReplayTimelinePct] = useState(0);
  const [sealBurstNonce, setSealBurstNonce] = useState(0);
  const greenRoomSparklineRef = useRef([]);
  const liveAgentsRef = useRef([]);
  const lastIntentRawRef = useRef("");
  const unfinishedJourneysRef = useRef(0);
  const flowTimersRef = useRef([]);
  const introStartedAtRef = useRef(Date.now());
  const voicedPhasesRef = useRef(new Set());
  const launchSwarmIgniteDoneRef = useRef(false);
  const ambientCtxRef = useRef(null);
  const ambientNodesRef = useRef([]);
  const continuityRef = useRef(readClientContinuity());
  const continuityTickGuardRef = useRef(0);
  const bootLogRef = useRef(
    typeof window !== "undefined" && window.__CASTLE_BOOT_LOG__ ? window.__CASTLE_BOOT_LOG__ : null
  );
  const rhizohSocialPreReplyRef = useRef(null);
  const rhizohRegistryPreReplyRef = useRef(null);
  /** Last arbitration governor ring buffer (synced with continuity meta + optimistic turns). */
  const arbitrationGovernorWorkingRef = useRef(null);
  /** Temporal intent drift biography (closure + arbitration texture over turns). */
  const temporalIntentDriftWorkingRef = useRef(null);
  const browserPresenceRef = useRef(createBrowserPresenceSignalRef());
  /** Primitives only — object snapshots from useSyncExternalStore must be referentially stable when inputs unchanged. */
  const epistemicOrbLayerFocus = useUISelector((s) => s.layerFocus);
  const epistemicOrbRealityMode = useUISelector((s) => s.realityMode);
  const epistemicOrbMapSurfaceActive = useUISelector((s) => s.mapSurfaceActive);
  const epistemicOrbUiEnv = useMemo(
    () => ({
      layerFocus: epistemicOrbLayerFocus,
      realityMode: epistemicOrbRealityMode,
      mapSurfaceActive: epistemicOrbMapSurfaceActive,
      governanceState
    }),
    [epistemicOrbLayerFocus, epistemicOrbRealityMode, epistemicOrbMapSurfaceActive, governanceState]
  );
  const epistemicGovStress = useMemo(() => {
    const g = String(governanceState || "NORMAL").toUpperCase();
    return g === "DEGRADED" || g === "FROZEN" || g === "CRITICAL";
  }, [governanceState]);
  const hydrateEpistemicOrbFromDisk = useCallback(() => {
    try {
      const disk = readClientContinuity();
      const w = disk.meta?.rhizohWeightedTurns;
      if (!Array.isArray(w) || !w.length) return null;
      for (let i = w.length - 1; i >= 0; i--) {
        const row = w[i];
        if (row?.epistemic && typeof row.epistemic === "object") {
          return {
            epistemic: row.epistemic,
            modelRoute: row.modelRoute && typeof row.modelRoute === "object" ? row.modelRoute : null,
            source: row.source || null,
            router: { intent: row.intent, subIntent: row.subIntent }
          };
        }
      }
    } catch {
      /* noop */
    }
    return null;
  }, []);

  const safeBumpContinuitySocialTick = useCallback(() => {
    continuityTickGuardRef.current = Date.now();
    setContinuitySocialTick((t) => (t + 1) % 1_000_000);
  }, []);

  useEffect(() => {
    return attachBrowserPresenceSensors(browserPresenceRef.current);
  }, []);

  useEffect(() => {
    const disk = readClientContinuity();
    const g = disk.meta?.rhizohArbitrationGovernorV1;
    if (g && typeof g === "object") {
      arbitrationGovernorWorkingRef.current = normalizeArbitrationGovernorBuffer(g);
    }
    const td = disk.meta?.rhizohTemporalIntentDriftMemoryV1;
    if (td && typeof td === "object") {
      temporalIntentDriftWorkingRef.current = normalizeTemporalIntentDriftMemory(td);
    }
  }, []);

  useEffect(() => {
    if (browserPresenceRef.current) browserPresenceRef.current.micActive = !!micListening;
  }, [micListening]);

  useEffect(() => {
    voiceLoopEnabledRef.current = voiceLoopEnabled;
  }, [voiceLoopEnabled]);
  useEffect(() => {
    voiceNetworkBlockedRef.current = voiceNetworkBlocked;
  }, [voiceNetworkBlocked]);

  useEffect(() => startRhizohBehaviorMetricsAggregation(), []);

  useEffect(() => {
    try {
      recordRhizohVisitAndEmitReturnSignals();
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    registerClientContinuitySync((next) => {
      continuityRef.current = next;
      const g = next.meta?.rhizohArbitrationGovernorV1;
      if (g && typeof g === "object") {
        arbitrationGovernorWorkingRef.current = normalizeArbitrationGovernorBuffer(g);
      }
      const td = next.meta?.rhizohTemporalIntentDriftMemoryV1;
      if (td && typeof td === "object") {
        temporalIntentDriftWorkingRef.current = normalizeTemporalIntentDriftMemory(td);
      }
      safeBumpContinuitySocialTick();
    });
    return () => registerClientContinuitySync(null);
  }, [safeBumpContinuitySocialTick]);

  useEffect(() => {
    const disk = readClientContinuity();
    const meta = disk.meta && typeof disk.meta === "object" ? disk.meta : {};
    if (meta.tceeBoot && meta.tceeBoot.phase) return;
    const seeded = ensurePreBreathSeed(meta);
    const next = { ...disk, meta: seeded };
    writeClientContinuity(next);
    continuityRef.current = {
      turns: Array.isArray(disk.turns) ? disk.turns : [],
      persona: disk.persona && typeof disk.persona === "object" ? disk.persona : {},
      meta: { ...(continuityRef.current.meta || {}), ...seeded }
    };
    // Stabilization: seed write zaten continuity sync callback'ini tetikler; burada ek tick atmayalım.
  }, []);

  useEffect(() => {
    try {
      const disk = readClientContinuity();
      const meta = disk.meta && typeof disk.meta === "object" ? disk.meta : {};
      const s = loadRhizohProductSession(meta);
      const phase = s.conversationPhase;
      const prev = prevRhizohProductPhaseRef.current;
      const igTrust = Number(readIdentityGraph().rhizoh?.trust || 0);
      if (!rhizohPhaseHydratedRef.current) {
        rhizohPhaseHydratedRef.current = true;
        rhizohPhaseEnteredAtMsRef.current = Date.now();
        rhizohTrustSignalPrevRef.current = Number.isFinite(igTrust) ? igTrust : 0;
        emitRhizohBehaviorSignal("rhizoh.phase.enter", { phase, origin: "hydrate" });
      }
      if (prev && prev !== phase) {
        const dur = Math.max(0, Date.now() - rhizohPhaseEnteredAtMsRef.current);
        emitRhizohBehaviorSignal("rhizoh.phase.exit", { phase: prev, durationMs: dur });
        emitRhizohBehaviorSignal("rhizoh.phase.enter", { phase, origin: "transition", fromPhase: prev });
        rhizohPhaseEnteredAtMsRef.current = Date.now();

        const tPrev =
          rhizohTrustSignalPrevRef.current != null && Number.isFinite(rhizohTrustSignalPrevRef.current)
            ? rhizohTrustSignalPrevRef.current
            : igTrust;
        emitRhizohBehaviorSignal("rhizoh.trust.phase_delta", {
          fromPhase: prev,
          toPhase: phase,
          trustBefore: tPrev,
          trustAfter: igTrust,
          delta: igTrust - tPrev
        });
        rhizohTrustSignalPrevRef.current = igTrust;

        const closure = buildRhizohPhaseClosure(prev, phase);
        emitRhizohBehaviorSignal("rhizoh.closure.view", {
          fromPhase: prev,
          toPhase: phase,
          unlockCount: closure.unlockedSurfaceKeys.length,
          rewardHeadline: closure.rewardHeadline
        });
        if (closure.unlockedSurfaceKeys.length > 0) {
          emitRhizohBehaviorSignal("rhizoh.capability.unlock_seen", {
            keys: closure.unlockedSurfaceKeys.slice(0, 24)
          });
        }
        setRhizohClosureBanner({
          rewardHeadline: closure.rewardHeadline,
          achievementLine: closure.achievementLine,
          whatChangedForYou: closure.whatChangedForYou,
          unlockedLabelsTr: closure.unlockedLabelsTr
        });
        appendRhizohClosureMilestone(s, {
          fromPhase: prev,
          toPhase: phase,
          headline: closure.achievementLine,
          unlockedKeys: closure.unlockedSurfaceKeys
        });
        // Stabilization: closure milestone write continuity sync üzerinden zaten UI güncelliyor.
      }
      prevRhizohProductPhaseRef.current = phase;
    } catch {
      /* noop */
    }
  }, [continuitySocialTick, safeBumpContinuitySocialTick]);

  useEffect(() => {
    const fp = computeRhizohDecisionOverlayFingerprint(rhizohConversationUx.decisionOverlay);
    if (!fp) return;
    const manualTickEnabled =
      typeof window !== "undefined" && window.localStorage.getItem("rhizoh.feedback.tick.manual.v1") === "1";
    if (!manualTickEnabled) {
      return;
    }
    if (!window.__RHIZOH_LAST_DECISION_FEEDBACK_FP__) window.__RHIZOH_LAST_DECISION_FEEDBACK_FP__ = "";
    if (window.__RHIZOH_LAST_DECISION_FEEDBACK_FP__ === fp) return;
    window.__RHIZOH_LAST_DECISION_FEEDBACK_FP__ = fp;
    const o = rhizohConversationUx.decisionOverlay;
    emitRhizohProductDecisionSignal(o);
    void runRhizohDecisionFeedbackTick(o).catch(() => {
      window.__RHIZOH_LAST_DECISION_FEEDBACK_FP__ = "";
    });
  }, [rhizohConversationUx.decisionOverlay]);

  useEffect(() => {
    if (!rhizohClosureBanner) return;
    const closureMs = Math.max(
      4000,
      Math.min(60000, Number(rhizohConversationUx.decisionOverlay?.ux?.closureBannerMs) || 12000)
    );
    const shownAt = Date.now();
    const guard = { dismissed: false };
    const id = window.setTimeout(() => {
      guard.dismissed = true;
      emitRhizohBehaviorSignal("rhizoh.closure.dismiss", {
        reason: "timeout",
        visibleMs: Date.now() - shownAt
      });
      setRhizohClosureBanner(null);
    }, closureMs);
    return () => {
      window.clearTimeout(id);
      if (!guard.dismissed) {
        guard.dismissed = true;
        emitRhizohBehaviorSignal("rhizoh.closure.dismiss", {
          reason: "replaced_or_unmount",
          visibleMs: Date.now() - shownAt
        });
      }
    };
  }, [rhizohClosureBanner, rhizohConversationUx.decisionOverlay?.ux?.closureBannerMs]);

  useEffect(() => {
    if (!rhizohConversationUx.surfaces.kernelHeavyPanels && drawerStudioTab === "analyze") {
      setDrawerStudioTab("chat");
    }
  }, [rhizohConversationUx.surfaces.kernelHeavyPanels, drawerStudioTab]);

  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const recognitionRef = useRef(null);
  /** Sürekli dinleme: LLM/TTS sırasında rec.onend ile erken mic açılmasını erteler. */
  const voiceTurnBusyRef = useRef(false);
  const voiceTurnBusySinceRef = useRef(0);
  const voiceTtsSessionIdRef = useRef(0);
  const bargeInRecognitionRef = useRef(null);
  const startVoiceToRhizohRef = useRef(() => {});
  const voiceLoopEnabledRef = useRef(false);
  const voiceNetworkBlockedRef = useRef(false);
  const voiceBargeInEnabledRef = useRef(true);
  const handleVoiceTranscriptRef = useRef(async () => {});
  const startBargeInWhileRhizohSpeaksRef = useRef(() => {});
  const lastVoiceNetworkWarnAtRef = useRef(0);
  const voiceNetworkRetryRef = useRef(0);
  const l9SpiralTickRef = useRef(0);
  const l9BackgroundTickRef = useRef(0);
  const l9PrevAgentRef = useRef({ state: new Map(), pet: new Map() });

  useLayoutEffect(() => {
    configureRealityDirector({
      getEngine: () => engineRef.current,
      getCoreWorld: () => coreWorld,
      dispatch: (a) => uiStore.dispatch(a),
      getState: () => uiStore.getState(),
      getGatewaySnapshot: () => gatewaySnapshotRef.current
    });
    configureL9ExecutionGate({
      getEngine: () => engineRef.current,
      getState: () => uiStore.getState(),
      getGatewaySnapshot: () => gatewaySnapshotRef.current
    });
  }, []);
  useEffect(() => {
    reconcileMapSurfaceFromGateway();
  }, [gatewayUx.phase]);
  const entityCount = useUISelector((s) => s.activeEntityCount);
  const productSurface = useUISelector((s) => s.productSurface);
  const realityMode = useUISelector((s) => s.realityMode);
  const mapSurfaceActive = useUISelector((s) => s.mapSurfaceActive);
  const prevMapSurfaceRef = useRef(mapSurfaceActive);
  useEffect(() => {
    const prev = prevMapSurfaceRef.current;
    prevMapSurfaceRef.current = mapSurfaceActive;
    if (mapSurfaceActive && !prev) {
      const n = flushL9ExecutionHoldQueue();
      if (n > 0) {
        uiStore.dispatch({
          type: "ADD_LOG",
          payload: {
            ts: new Date().toLocaleTimeString(),
            type: "SYS",
            data: `L9 EXECUTION GATE · ${n} ertelenmiş taslak yüzey aktif olunca yayınlandı`
          }
        });
      }
    }
  }, [mapSurfaceActive]);
  useEffect(() => {
    const disk = readClientContinuity();
    const ref = continuityRef.current || { turns: [], persona: {}, meta: {} };
    const mergedTurns = Array.isArray(ref.turns) && ref.turns.length ? ref.turns : disk.turns;
    const mergedPersona = ref.persona && Object.keys(ref.persona).length ? ref.persona : disk.persona;
    const meta = { ...(disk.meta || {}), ...(ref.meta || {}) };
    const stepped = stepReliabilityEpisodesMeta(
      meta,
      gatewayUx.phase || "",
      Date.now(),
      Number(gatewayUx.healthPollSerial) || 0
    );
    const healthStateDisk = buildRhizohHealthState({
      gatewayPhase: gatewayUx?.phase,
      healthDeps: gatewayUx?.healthDeps,
      mapSurfaceActive
    });
    const rhizohHealthInfluence = computeRhizohHealthInfluence(healthStateDisk);
    const nextMeta = {
      ...meta,
      ...stepped,
      rhizohHealthInfluence,
      updatedAt: Date.now()
    };
    const sameEp =
      JSON.stringify(nextMeta.rhizohReliabilityEpisodes) === JSON.stringify(meta.rhizohReliabilityEpisodes || []);
    const sameFsm =
      JSON.stringify(nextMeta.rhizohReliabilityFsm) === JSON.stringify(meta.rhizohReliabilityFsm || {});
    const sameHi = JSON.stringify(nextMeta.rhizohHealthInfluence) === JSON.stringify(meta.rhizohHealthInfluence || {});
    if (sameEp && sameFsm && sameHi) return;
    continuityRef.current = { turns: mergedTurns, persona: mergedPersona, meta: nextMeta };
    writeClientContinuity({ turns: mergedTurns, persona: mergedPersona, meta: nextMeta });
  }, [gatewayUx.phase, gatewayUx.healthPollSerial, gatewayUx.healthDeps, mapSurfaceActive]);
  const swarmActiveUi = useUISelector((s) => s.swarmActive);
  const heatPeak = useUISelector((s) => s.heatPeak);
  const defaultIntents = [
    "yarin canli mac yayinla",
    "studio'da muzik performansi baslat",
    "spiralMMO'da gece etkinligi olustur",
    "octoai ile yeni npc uret",
    "swarm koordinasyonunu aktive et",
    "istanbul arena'da simulasyon baslat"
  ];
  const firstInteractionIntents = useMemo(
    () => resolveFirstInteractionIntentsV0(defaultIntents),
    [defaultIntents]
  );
  const heroAgentLabels = [
    "Scout",
    "Curator",
    "Builder",
    "Archivist",
    "Sentinel",
    "Broadcaster",
    "Navigator",
    "Rhizoh Core"
  ];
  const rhizohFirstName = useMemo(
    () => resolveRhizohFirstName(castleAuth.user, castleAuth.profile),
    [castleAuth.user, castleAuth.profile]
  );
  const bootObservationProvenance = useMemo(
    () =>
      buildBootObservationProvenance({
        realityState,
        governanceState,
        rhizohFieldState,
        heatPeak,
        activeEntityCount: entityCount,
        swarmActive: swarmActiveUi,
        mapSurfaceActive,
        readoutDegraded: false
      }),
    [
      realityState,
      governanceState,
      rhizohFieldState,
      heatPeak,
      entityCount,
      swarmActiveUi,
      mapSurfaceActive
    ]
  );
  const memoryLinks = Math.max(0, (substrateSnapshot?.eventCount ?? 0) * 3 + (substrateEvents?.length ?? 0));
  const unfinishedJourneys = substrateSnapshot?.approvalPending ?? 0;
  const dormantAgents = Math.max(0, 12 - (substrateSnapshot?.taskCounts?.running ?? 0));
  const memoryNarrative = memoryLinks >= 9
    ? "Dormant paths woke up."
    : memoryLinks >= 3
      ? "9 memory links formed."
      : "World remembered 3 signals.";
  const cinematicRoute = useMemo(
    () =>
      resolveAdaptiveIntroRouteV1({
        returningUser,
        governanceState
      }),
    [returningUser, governanceState]
  );
  const launchSceneOverlay = useMemo(
    () => computeLaunchSceneDirectorOverlayV1(cinematicElapsedMs, cinematicRoute),
    [cinematicElapsedMs, cinematicRoute]
  );
  useEffect(() => {
    if (returningUser) {
      setFirstBootObservationArtifact(null);
      return;
    }
    let cancelled = false;
    void buildRhizohFirstTouchEpistemicArtifact(rhizohFirstName, bootObservationProvenance).then((sealed) => {
      if (!cancelled) setFirstBootObservationArtifact(sealed);
    });
    return () => {
      cancelled = true;
    };
  }, [returningUser, rhizohFirstName, bootObservationProvenance]);

  const welcomeCard = useMemo(() => {
    if (returningUser) {
      return buildRhizohWelcomeNarrativeTr(rhizohFirstName, readIdentityGraph(), {
        unfinishedJourneys,
        memoryLinks
      });
    }
    const body = buildRhizohFirstTouchEpistemicBody(rhizohFirstName, bootObservationProvenance);
    return {
      primary: body.primary,
      secondary: `${memoryNarrative} · ${entityCount} pulses in the field.`,
      bootObservationArtifact: firstBootObservationArtifact
    };
  }, [
    returningUser,
    rhizohFirstName,
    bootObservationProvenance,
    unfinishedJourneys,
    memoryLinks,
    memoryNarrative,
    entityCount,
    firstBootObservationArtifact
  ]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__rhizoh = {
      debug: () => ({
        field: rhizohFieldState,
        reality: realityState,
        governance: governanceState,
        gateway: gatewayUx.phase,
        layerFocus: epistemicOrbLayerFocus,
        bootObservationArtifact: welcomeCard.bootObservationArtifact ?? null,
        welcomeArtifact: welcomeCard.bootObservationArtifact ?? null
      }),
      metrics: () => {
        const rows = [
          { key: "memoryLinks", value: memoryLinks },
          { key: "activeEntities", value: entityCount },
          { key: "liveAgents", value: liveAgents.length },
          { key: "phase", value: rhizohConversationUx.label }
        ];
        console.table(rows);
        return rows;
      },
      policy: () => rhizohConversationUx.decisionOverlay,
      truth: () => rhizohPolicyLearningGuard
    };
    return () => {
      try {
        delete window.__rhizoh;
      } catch {
        /* noop */
      }
    };
  }, [
    rhizohFieldState,
    realityState,
    governanceState,
    gatewayUx.phase,
    epistemicOrbLayerFocus,
    memoryLinks,
    entityCount,
    liveAgents.length,
    rhizohConversationUx.label,
    rhizohConversationUx.decisionOverlay,
    rhizohPolicyLearningGuard,
    welcomeCard
  ]);
  const rhizohCommandBusy = ["INTERPRETING", "GENERATING", "EXECUTING"].includes(rhizohFieldState);
  const gatewayLinkSettled =
    gatewayUx.phase !== "connecting" && gatewayUx.phase !== "reconnecting" && gatewayUx.phase !== "initializing";
  const rhizohLlmHostLabel = useMemo(() => {
    const u = String(getCastleFlightConfig().rhizohLlmHttp || "").trim();
    if (!u) return "LLM uç tanımsız";
    try {
      return new URL(u).host;
    } catch {
      return u.slice(0, 44);
    }
  }, []);
  const runtimeHealth = useMemo(
    () => ({
      gatewayConnected: ["connected", "ready", "live"].includes(String(gatewayUx.phase || "").toLowerCase()),
      gatewayPhase: gatewayUx.phase || "initializing",
      meshConnected: !!(greenRoomLive?.traceId || immersiveLiveTrace),
      worldActive: mapSurfaceActive || realityMode === "REAL_MAP" || realityMode === "GLOBE",
      presenceActive: liveAgents.length > 0,
      broadcastLive: greenRoomLive?.phase === "LIVE",
      rhizohHeartbeat: hasReceivedRhizohReply || hasSentRhizohCommand || gatewayLinkSettled,
      economyHealthy: governanceState !== "CRITICAL",
      memoryFresh: memoryLinks >= 3
    }),
    [
      gatewayUx.phase,
      greenRoomLive?.traceId,
      greenRoomLive?.phase,
      immersiveLiveTrace,
      mapSurfaceActive,
      realityMode,
      liveAgents.length,
      hasReceivedRhizohReply,
      hasSentRhizohCommand,
      gatewayLinkSettled,
      governanceState,
      memoryLinks
    ]
  );
  const infraGatewayBaseUrl = useMemo(() => {
    try {
      const base = String(getRhizohApiBase() || "").trim();
      if (!base) return "";
      return new URL(base).origin;
    } catch {
      return "";
    }
  }, []);
  const memoryLinksRef = useRef(memoryLinks);
  const governanceRef = useRef(governanceState);
  const governanceEnteredAtRef = useRef(Date.now());
  const prevGovernanceRef = useRef(governanceState);
  const broadcastEmphasisRef = useRef({
    active: false,
    until: 0,
    traceId: null,
    phase: null,
    joinPresenceUntil: 0
  });
  useEffect(() => {
    memoryLinksRef.current = memoryLinks;
  }, [memoryLinks]);
  useEffect(() => {
    governanceRef.current = governanceState;
  }, [governanceState]);
  useEffect(() => {
    if (prevGovernanceRef.current !== governanceState) {
      governanceEnteredAtRef.current = Date.now();
      prevGovernanceRef.current = governanceState;
    }
  }, [governanceState]);

  useEffect(() => {
    liveAgentsRef.current = liveAgents;
  }, [liveAgents]);

  const castleTemporalCtxRef = useRef({});
  const castleFieldBpRef = useRef(createFieldTickBackpressure());
  castleTemporalCtxRef.current = {
    readClientContinuity,
    writeClientContinuity,
    syncClientContinuityRef,
    browserPresenceRef,
    liveAgentsRef,
    castleAuth,
    remoteCastles,
    rhizohFirstName,
    getCastleDevUid: getOrCreateCastleDevUid
  };

  useEffect(() => {
    let tickIdx = 0;
    const id = window.setInterval(() => {
      const basePlan = castleFieldTickPlan(tickIdx);
      const ctx = {
        ...castleTemporalCtxRef.current,
        tickIndex: tickIdx,
        tickPlan: basePlan,
        getBackpressure: () => castleFieldBpRef.current
      };
      tickIdx += 1;
      let physicsError = null;
      const out = withFieldPhysicsBackpressure(castleFieldBpRef.current, () => {
        try {
          return runCastleFieldPhysicsTick(ctx);
        } catch (err) {
          physicsError = err;
          console.error("[CASTLE_FIELD_TICK_PHYSICS]", err);
          return null;
        }
      });
      const canonical = out?.canonical ?? null;
      if (canonical?.context && typeof canonical.context === "object") {
        canonical.context.backpressure = executionMetricsFromBackpressure(castleFieldBpRef.current);
      }
      const deferredLanes = [];
      if (canonical?.effectivePlan?.memoryIdentity) {
        deferredLanes.push("memory_identity");
        scheduleCastleFieldDeferredTask(() => runCastleFieldMemoryIdentityTick(ctx, canonical), {
          delayMs: 0,
          idleTimeoutMs: 120
        });
      }
      if (canonical?.effectivePlan?.consolidation) {
        deferredLanes.push("consolidation");
        scheduleCastleFieldDeferredTask(() => runCastleFieldConsolidationTick(ctx, canonical), {
          delayMs: 52
        });
      }
      appendCastleTemporalLedgerEntry(
        buildPolicyLedgerEntryV0({
          tickIndex: ctx.tickIndex,
          basePlan,
          out,
          canonical,
          backpressure: castleFieldBpRef.current,
          physicsError,
          deferredLanes
        })
      );
      if (peekCastleRuntimeTransactionQueueDepth() > 0) {
        const rtqBatch = drainCastleRuntimeTransactionQueue(24);
        const resolved = resolveCastleRuntimeTransactionBatch(rtqBatch, { tickIndex: ctx.tickIndex });
        appendCastleTemporalLedgerEntry(buildRtqBatchLedgerEntryV0(resolved, ctx.tickIndex));
      }
    }, CASTLE_FIELD_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    window.__CASTLE_POLICY_LEDGER__ = {
      peek: (n) => getCastleTemporalLedgerSnapshot(typeof n === "number" ? n : 24),
      suppressedReality: () => getSuppressedRealityIndexForPromptV0({ limit: 16 })
    };
    window.__CASTLE_RTQ__ = {
      enqueue: enqueueCastleRuntimeTransaction,
      depth: peekCastleRuntimeTransactionQueueDepth
    };
    return () => {
      try {
        delete window.__CASTLE_POLICY_LEDGER__;
        delete window.__CASTLE_RTQ__;
      } catch {
        /* noop */
      }
    };
  }, []);

  useEffect(() => {
    lastIntentRawRef.current = lastIntentRaw;
  }, [lastIntentRaw]);
  useEffect(() => {
    unfinishedJourneysRef.current = unfinishedJourneys;
  }, [unfinishedJourneys]);
  useEffect(() => {
    touchIdentitySessionOnce();
  }, []);

  const initiateMirrorBridge = useCallback(
    async (peer) => {
      if (!peer?.id) return;
      const ok = await recordBridgePeer(peer.id);
      localBridgePeersRef.current.add(peer.id);
      setBridgeVisualTick((t) => t + 1);
      let masterIdx = -1;
      const n = Math.min(coreWorld.activeCount, coreWorld.MAX);
      for (let i = 0; i < n; i++) {
        if (coreWorld.state[i] === STATE.AGENT_MASTER) {
          masterIdx = i;
          break;
        }
      }
      const traveller = masterIdx >= 0 ? masterIdx : coreWorld.rhizohIdx;
      if (traveller >= 0 && Number.isFinite(peer.lat) && Number.isFinite(peer.lon)) {
        const xz = latLonToSceneXZ(peer.lat, peer.lon);
        coreWorld.beginCastleBridgeTransit(traveller, xz.x, 360 + (traveller % 6) * 35, xz.z, 5.2);
      }
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: {
          ts: new Date().toLocaleTimeString(),
          type: "SYS",
          data: `RHIZOH-MIRROR · INITIATE BRIDGE → ${String(peer.id).slice(0, 10)}… (${ok ? "registry" : "local-only"})`
        }
      });
      try {
        window.dispatchEvent(new CustomEvent("castle-bridge-initiated", { detail: { peer, recordOk: ok } }));
      } catch {
        /* noop */
      }
    },
    [recordBridgePeer]
  );

  const handleCastleLifecycle = useCallback((phase) => {
    if (phase === "DORMANT") {
      localBridgePeersRef.current.clear();
      setBridgeVisualTick((t) => t + 1);
      try {
        engineRef.current?.setRhizohMirrorBridges?.([]);
      } catch {
        /* noop */
      }
    }
  }, []);

  useEffect(() => {
    if (!booted) return;
    const eng = engineRef.current;
    if (!eng?.setRhizohMirrorBridges) return;
    const geo = typeof window !== "undefined" ? window.__CASTLE_NEXUS_GEO__ : null;
    const peers = localBridgePeersRef.current;
    if (!geo?.lat || !geo?.lon || peers.size === 0) {
      eng.setRhizohMirrorBridges([]);
      return;
    }
    const from = latLonToSceneXZ(geo.lat, geo.lon);
    const arcs = [];
    for (const c of remoteCastles) {
      if (!peers.has(c.id)) continue;
      if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue;
      const to = latLonToSceneXZ(c.lat, c.lon);
      arcs.push({
        ax: from.x,
        ay: 220,
        az: from.z,
        bx: to.x,
        by: 240,
        bz: to.z
      });
    }
    eng.setRhizohMirrorBridges(arcs);
  }, [remoteCastles, bridgeVisualTick, booted]);

  const applyBroadcastPresence = useCallback((traceId) => {
    if (traceId) setImmersiveLiveTrace(traceId);
    coreWorld.swarmActive = true;
    uiStore.dispatch({ type: "SET_SWARM_ACTIVE", payload: true });
    broadcastEmphasisRef.current = {
      ...broadcastEmphasisRef.current,
      joinPresenceUntil: Date.now() + 45_000
    };
    window.setTimeout(() => {
      const c = window.__CASTLE_CESIUM__;
      if (c?.focusCastle) c.focusCastle();
      else c?.flyToIstanbul?.();
    }, 60);
  }, []);

  /** Product routes → shell + layer/reality (React Router; refresh-safe). */
  useEffect(() => {
    const pathname = location.pathname;
    const search = location.search;

    const liveMatch = matchPath({ path: "/greenroom/live/:traceId", end: true }, pathname);
    if (liveMatch?.params?.traceId) {
      const tid = decodeURIComponent(String(liveMatch.params.traceId));
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: "broadcast" });
      setShowDetailDrawer(true);
      applyBroadcastPresence(tid);
      return;
    }

    setImmersiveLiveTrace(null);
    broadcastEmphasisRef.current = {
      ...broadcastEmphasisRef.current,
      joinPresenceUntil: 0
    };

    if (matchPath({ path: "/studio", end: true }, pathname)) {
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: "studio" });
      setShowDetailDrawer(true);
      const sp = new URLSearchParams(search);
      if (sp.get("focus") === "octo") {
        uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 7 });
      }
      return;
    }

    const greenSlugMatch = matchPath({ path: "/greenroom/:roomUid", end: true }, pathname);
    if (greenSlugMatch?.params?.roomUid) {
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: "greenroom" });
      setShowDetailDrawer(true);
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 5 });
      void setRealityMode("REAL_MAP", { source: "ROUTE_GREENROOM" });
      const slug = decodeURIComponent(String(greenSlugMatch.params.roomUid));
      if (slug === "main") {
        ensureGreenRoomMainHallBound();
      }
      return;
    }

    if (matchPath({ path: "/broadcast/:broadcastUid", end: true }, pathname)) {
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: "broadcast" });
      setShowDetailDrawer(true);
      return;
    }

    if (matchPath({ path: "/hall/:roomUid", end: true }, pathname)) {
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: "hall" });
      setShowDetailDrawer(true);
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 10 });
      void setRealityMode("REAL_MAP", { source: "ROUTE_HALL" });
      return;
    }

    if (matchPath({ path: "/map", end: true }, pathname)) {
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: "world" });
      void setRealityMode("REAL_MAP", { source: "ROUTE_MAP" });
      return;
    }

    if (matchPath({ path: "/academy", end: true }, pathname)) {
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: "profile" });
      setShowDetailDrawer(true);
      setDrawerStudioTab("chat");
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 11 });
      void setRealityMode("REAL_MAP", { source: "ROUTE_ACADEMY" });
      return;
    }

    if (matchPath({ path: "/spiral", end: true }, pathname)) {
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: "studio" });
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 6 });
      void setRealityMode("REAL_MAP", { source: "ROUTE_SPIRAL" });
      return;
    }

    if (matchPath({ path: "/settings", end: true }, pathname)) {
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: "profile" });
      setShowDetailDrawer(true);
      setDrawerStudioTab("chat");
      return;
    }

    if (pathname === "/" || pathname === "") {
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: "world" });
      setShowDetailDrawer(false);
    }
  }, [location.pathname, location.search, applyBroadcastPresence]);

  useEffect(() => {
    const s = productSurface;
    if (s === "world") {
      void setRealityMode("GLOBE", { source: "PRODUCT_SHELL" });
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 10 });
      uiStore.dispatch({ type: "SET_GREENROOM", payload: false });
      setShowDetailDrawer(false);
      return;
    }
    if (s === "hall") {
      void setRealityMode("REAL_MAP", { source: "PRODUCT_SHELL_HALL" });
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 10 });
      uiStore.dispatch({ type: "SET_GREENROOM", payload: false });
      setShowDetailDrawer(true);
      setDrawerStudioTab("explore");
      return;
    }
    if (s === "greenroom") {
      void setRealityMode("REAL_MAP", { source: "PRODUCT_SHELL_GREENROOM" });
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 5 });
      uiStore.dispatch({ type: "SET_GREENROOM", payload: true });
      ensureGreenRoomMainHallBound();
      setShowDetailDrawer(true);
      setDrawerStudioTab("build");
      return;
    }
    if (s === "broadcast") {
      void setRealityMode("REAL_MAP", { source: "PRODUCT_SHELL_BROADCAST" });
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 9 });
      uiStore.dispatch({ type: "SET_GREENROOM", payload: false });
      setShowDetailDrawer(true);
      setDrawerStudioTab("build");
      return;
    }
    if (s === "studio") {
      void setRealityMode("REAL_MAP", { source: "PRODUCT_SHELL_STUDIO" });
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 12 });
      uiStore.dispatch({ type: "SET_GREENROOM", payload: false });
      setShowDetailDrawer(true);
      setDrawerStudioTab("analyze");
      return;
    }
    if (s === "profile") {
      void setRealityMode("REAL_MAP", { source: "PRODUCT_SHELL_PROFILE" });
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 11 });
      uiStore.dispatch({ type: "SET_GREENROOM", payload: false });
      setShowDetailDrawer(true);
      setDrawerStudioTab("sovereign");
    }
  }, [productSurface]);

  const onProductShellSelect = useCallback(
    (id) => {
      if (id === "world" && productSurface === "world") {
        setShowDetailDrawer(false);
        void setRealityMode("GLOBE", { source: "PRODUCT_SHELL_WORLD_RECENTER" });
        uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: 10 });
        uiStore.dispatch({ type: "SET_GREENROOM", payload: false });
        return;
      }
      uiStore.dispatch({ type: "SET_PRODUCT_SURFACE", payload: id });
    },
    [productSurface]
  );

  useEffect(() => {
    const m = matchPath({ path: "/greenroom/:roomUid", end: true }, location.pathname);
    const slug = m?.params?.roomUid ? decodeURIComponent(String(m.params.roomUid)) : "";
    if (slug !== "main") return undefined;
    return startGreenRoomPresenceMesh();
  }, [location.pathname]);

  useEffect(() => {
    if (!booted) return undefined;
    ensureCastleWorldTopology();
    const stopAgents = startRhizohAgentRuntime({ heartbeatMs: 4200 });
    const stopGenesisWire = startGenesisContinuityClientWireV0();
    return () => {
      stopAgents?.();
      stopGenesisWire?.();
    };
  }, [booted]);

  useEffect(() => {
    if (greenRoomLive?.phase !== "LIVE") {
      setLiveReactionToast(null);
      return undefined;
    }
    let cancelled = false;
    let tid;
    const loop = () => {
      tid = window.setTimeout(() => {
        if (cancelled) return;
        const line = LIVE_FIELD_REACTIONS[Math.floor(Math.random() * LIVE_FIELD_REACTIONS.length)]();
        setLiveReactionToast({ text: line, id: Date.now() });
        if (cancelled) return;
        loop();
      }, 4000 + Math.random() * 3000);
    };
    loop();
    return () => {
      cancelled = true;
      if (tid) window.clearTimeout(tid);
    };
  }, [greenRoomLive?.phase, greenRoomLive?.traceId]);

  useEffect(() => {
    if (!greenRoomLive?.transcriptId || !greenRoomLive.memorySealed) return;
    setSealBurstNonce((n) => n + 1);
  }, [greenRoomLive?.transcriptId, greenRoomLive?.memorySealed]);

  useEffect(() => {
    if (!greenRoomLive?.traceId) return undefined;
    const id = window.setInterval(() => setGreenRoomLiveTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [greenRoomLive?.traceId]);

  useEffect(() => {
    if (!greenRoomLive?.traceId) return undefined;
    if (greenRoomLive.phase === "ARCHIVED") return undefined;
    const sample = () => {
      const aud = computeSimulatedAudienceEstimate({
        swarmBoost: swarmActiveUi || coreWorld.swarmActive,
        activeHeroCount: liveAgentsRef.current.length,
        memoryHeat: memoryLinksRef.current
      });
      const buf = greenRoomSparklineRef.current;
      buf.push(aud);
      if (buf.length > 30) buf.shift();
      setSparklineVersion((v) => v + 1);
    };
    sample();
    const id = window.setInterval(sample, 1000);
    return () => clearInterval(id);
  }, [greenRoomLive?.traceId, greenRoomLive?.phase, swarmActiveUi]);

  const greenRoomAudienceNow = useMemo(() => {
    if (!greenRoomLive) return 0;
    return computeSimulatedAudienceEstimate({
      swarmBoost: swarmActiveUi || coreWorld.swarmActive,
      activeHeroCount: liveAgents.length,
      memoryHeat: memoryLinks
    });
  }, [greenRoomLive?.traceId, greenRoomLiveTick, liveAgents.length, swarmActiveUi, memoryLinks]);

  const greenRoomElapsedSec = useMemo(() => {
    if (!greenRoomLive) return 0;
    if (greenRoomLive.phase === "ROUTING") {
      return (Date.now() - (greenRoomLive.routingStartedAt || 0)) / 1000;
    }
    const base = greenRoomLive.liveStartedAt || greenRoomLive.routingStartedAt || Date.now();
    return (Date.now() - base) / 1000;
  }, [greenRoomLive, greenRoomLiveTick]);

  const visualCognitionState = useMemo(() =>
    composeRhizohVisualCognitionStateV1({
      snapshot: substrateSnapshot,
      events: substrateEvents,
      governanceState,
      rhizohFieldState,
      demoLoopState,
      lastIntentRaw,
      eventConfidence: eventPreview?.confidence ?? 0,
      lastWhy,
      memoryLinks,
      unfinishedJourneys,
      dormantAgents,
      deviceMeshLinks: 2,
      launchSwarmIntensityBoost: launchSceneOverlay.swarmIntensityDelta,
      launchMemoryEchoBoost: launchSceneOverlay.launchMemoryEchoBoost
    }), [
      substrateSnapshot,
      substrateEvents,
      governanceState,
      rhizohFieldState,
      demoLoopState,
      lastIntentRaw,
      eventPreview?.confidence,
      lastWhy,
      memoryLinks,
      unfinishedJourneys,
      dormantAgents,
      launchSceneOverlay.swarmIntensityDelta,
      launchSceneOverlay.launchMemoryEchoBoost
    ]
  );
  const relationalPresenceState = useMemo(() =>
    composeRelationalPresenceStateV1({
      userName: rhizohFirstName ?? "",
      snapshot: substrateSnapshot,
      lastIntentRaw,
      lastOutcome: eventPreview?.type ?? "World Mutation",
      unfinishedJourneys,
      memoryLinks,
      liveSignalLabel: "Istanbul"
    }), [
      rhizohFirstName,
      substrateSnapshot,
      lastIntentRaw,
      eventPreview?.type,
      unfinishedJourneys,
      memoryLinks
    ]
  );
  const buildContinuityPayload = useCallback(
    (userMessage) => {
      const disk = readClientContinuity();
      const ref = continuityRef.current || { turns: [], persona: {}, meta: {} };
      const turns = Array.isArray(ref.turns) && ref.turns.length ? ref.turns : disk.turns;
      const meta = { ...(disk.meta || {}), ...(ref.meta || {}) };
      const realm = uiStore.getState().realityMode;
      const ig = readIdentityGraph();
      const r = ig.rhizoh || {};
      const trust = Number(r.trust || 0);
      const familiarity = Number(r.familiarity || 0);
      const bondScore = Math.round(((trust + familiarity) / 2) * 100) / 100;
      const discoveries = Array.isArray(meta.codexDiscovery) ? meta.codexDiscovery.slice(-16) : [];
      const emotionStored = meta.rhizohEmotions && typeof meta.rhizohEmotions === "object" ? meta.rhizohEmotions : null;
      const emotionsForLlm = emotionStored ? normalizeEmotionState(emotionStored) : normalizeEmotionState(DEFAULT_EMOTIONS);
      const emotionUpdatedAt =
        typeof meta.rhizohEmotionUpdatedAt === "number" && Number.isFinite(meta.rhizohEmotionUpdatedAt)
          ? meta.rhizohEmotionUpdatedAt
          : null;
      const relationalFromMeta =
        meta.rhizohRelationalTone && typeof meta.rhizohRelationalTone === "object"
          ? meta.rhizohRelationalTone
          : null;
      const rhizohOutcomeSession = readOutcomeSessionFromMeta(meta);
      const rhizohWeightedMemory = Array.isArray(meta.rhizohWeightedTurns)
        ? meta.rhizohWeightedTurns.slice(-40)
        : [];
      const rhizohNarrativeThread =
        meta.rhizohNarrativeThread && typeof meta.rhizohNarrativeThread === "object"
          ? meta.rhizohNarrativeThread
          : null;
      const rhizohMemoryEpisodes = Array.isArray(meta.rhizohMemoryEpisodes)
        ? meta.rhizohMemoryEpisodes.slice(-20)
        : [];
      const rhizohNarrativeArc =
        meta.rhizohNarrativeArc && typeof meta.rhizohNarrativeArc === "object"
          ? meta.rhizohNarrativeArc
          : null;
      const rhizohGovernorCalibration = normalizeGovernorCalibration(meta.rhizohGovernorCalibration);
      const relEpisodes = Array.isArray(meta.rhizohReliabilityEpisodes) ? meta.rhizohReliabilityEpisodes : [];
      const healthState = buildRhizohHealthState({
        gatewayPhase: gatewayUx?.phase,
        healthDeps: gatewayUx?.healthDeps,
        mapSurfaceActive
      });
      const rhizohHealthInfluence = computeRhizohHealthInfluence(healthState);
      const rhizohReliabilitySummary = formatReliabilityEpisodesSummaryForLlm(relEpisodes);
      const msg = String(userMessage || "").trim();
      const runtimeBase = {
        layerFocus: uiStore.getState().layerFocus,
        realityMode: realm,
        governanceState,
        mapSurfaceActive,
        message: msg.slice(0, 1600),
        gatewayPhase: gatewayUx?.phase,
        rhizohGatewayPhase: gatewayUx?.phase,
        healthState,
        rhizohHealthInfluence,
        tceeBoot: meta.tceeBoot && typeof meta.tceeBoot === "object" ? meta.tceeBoot : { phase: TCEE_PHASE.PRE_BREATH }
      };
      const contStub = {
        recentTurns: turns.slice(-8),
        codex: { discoveries },
        castleState: { realm },
        relationship: { emotions: emotionsForLlm }
      };
      const routerSnap = routeRhizohInput(msg, contStub, runtimeBase);
      const rhizohPolicy = deriveRhizohPolicy({ ...runtimeBase, rhizohRouter: routerSnap });
      const operatorId = String(castleAuth.user?.uid || getOrCreateCastleDevUid() || "local-operator");
      const operatorLabel = String(
        castleAuth.profile?.displayName || castleAuth.user?.displayName || rhizohFirstName || "you"
      ).slice(0, 48);
      const castlePeers = castlePeersForSocial(remoteCastles, castleAuth.user?.uid || "");
      const browserPresence = snapshotBrowserPresenceForCsil(browserPresenceRef.current);
      const ecsAgentEvent = (liveAgentsRef.current || []).length
        ? { kind: "ecs_agent_presence", count: (liveAgentsRef.current || []).length }
        : null;
      const prevSocial = meta.rhizohSocialField;
      const rhizohSocialField = advanceSocialField(prevSocial, {
        message: msg,
        recentTurns: turns.slice(-8),
        operatorId,
        operatorLabel,
        trust,
        familiarity,
        intent: routerSnap?.intent || "CHAT",
        castlePeers
      });
      rhizohSocialPreReplyRef.current = rhizohSocialField;

      const prevReg = meta.rhizohSocialRegistry;
      const csilTick = advanceCastleSocialIdentity(prevReg, {
        message: msg,
        operatorId,
        operatorLabel,
        trust,
        familiarity,
        hasFirebaseUser: !!castleAuth.user,
        firebaseUid: castleAuth.user?.uid || "",
        sessionKey: operatorId,
        roomTension: Number(rhizohSocialField.roomState?.tension),
        routerIntent: routerSnap?.intent || "CHAT",
        identityRecallClosure:
          meta.tceeBoot?.phase === TCEE_PHASE.AWAKE ? meta.rhizohLastRecallClosure || null : null,
        countUserMessage: true,
        browserPresence,
        castlePeers,
        avatarActivity: (liveAgentsRef.current || []).length > 0,
        agentEvent: ecsAgentEvent
      });
      rhizohRegistryPreReplyRef.current = csilTick.registry;

      const ctxTl = csilTick.registry?.contextTimeline;
      const cognitiveSubThreadsPrompt = formatCognitiveSubThreadsForPrompt(
        Array.isArray(ctxTl?.cognitiveSubThreads) ? ctxTl.cognitiveSubThreads : [],
        {
          bondScore,
          trust,
          familiarity,
          routerIntent: routerSnap?.intent || "CHAT"
        }
      );

      const governorBuffer = normalizeArbitrationGovernorBuffer(
        arbitrationGovernorWorkingRef.current || meta.rhizohArbitrationGovernorV1
      );
      const ghostUserAgentProj = buildUserAgentGhostProjectionV1(csilTick.registry, null, {
        arbitrationGovernorBuffer: governorBuffer
      });
      const nextGovBuf = ghostUserAgentProj?.perceptionArbitrationV1?.governorV1?.nextBuffer;
      if (nextGovBuf && typeof nextGovBuf === "object") {
        arbitrationGovernorWorkingRef.current = normalizeArbitrationGovernorBuffer(nextGovBuf);
      }
      const rhizohGhostPerceptionV1 =
        ghostUserAgentProj?.ghostPerceptionV1 && typeof ghostUserAgentProj.ghostPerceptionV1 === "object"
          ? {
              subjectThreadId: ghostUserAgentProj.subjectThreadId,
              promptBlock: ghostUserAgentProj.ghostPerceptionV1.promptBlock,
              semanticPromptBlock: ghostUserAgentProj.ghostPerceptionV1.semanticPromptBlock,
              structuredDebugBlock: ghostUserAgentProj.ghostPerceptionV1.structuredDebugBlock,
              structuredLens: ghostUserAgentProj.ghostPerceptionV1.structuredLens,
              overallTone: ghostUserAgentProj.ghostPerceptionV1.overallTone
            }
          : null;
      const arb = ghostUserAgentProj?.perceptionArbitrationV1;
      const gv = arb?.governorV1 && typeof arb.governorV1 === "object" ? arb.governorV1 : null;
      const rhizohPerceptionArbitrationV1 =
        arb && typeof arb === "object"
          ? {
              dominantFrame: arb.dominantFrame,
              fallbackNeutral: arb.fallbackNeutral,
              conflictScore: arb.conflictScore,
              dominanceScores: arb.dominanceScores,
              rationale: arb.rationale,
              orderedPromptBlock: arb.orderedPromptBlock,
              promptMeta: arb.promptMeta,
              governorSummary:
                gv && !gv.disabled
                  ? {
                      stabilityMetrics: gv.stabilityMetrics,
                      oscillation: gv.oscillation,
                      governanceNotes: gv.governanceNotes,
                      rawDominanceScores: gv.rawDominanceScores
                    }
                  : gv?.disabled
                    ? { disabled: true }
                    : null
            }
          : null;

      const ifc = ghostUserAgentProj?.intentFeedbackClosureV1;
      const rhizohIntentFeedbackClosureV1 =
        ifc && typeof ifc === "object"
          ? {
              patternIntentPosture: ifc.patternIntentPosture,
              dominantFrame: ifc.intentTrace?.dominantFrame ?? null,
              intentBiasLine: ifc.intentBiasLine,
              traceHead: Array.isArray(ifc.intentTrace?.lines) ? ifc.intentTrace.lines.slice(0, 4) : [],
              selfAwarenessPromptBlock: ifc.selfAwarenessPromptBlock
            }
          : null;

      let temporalDriftMem = normalizeTemporalIntentDriftMemory(
        temporalIntentDriftWorkingRef.current || meta.rhizohTemporalIntentDriftMemoryV1
      );
      if (ghostUserAgentProj) {
        const driftSnap = buildTemporalIntentSnapshotFromStack(ghostUserAgentProj);
        if (driftSnap) {
          temporalDriftMem = pushTemporalIntentSnapshot(temporalDriftMem, driftSnap, { dedupeWithinMs: 2800 });
        }
      }
      temporalIntentDriftWorkingRef.current = temporalDriftMem;
      const driftSummaryPrompt = summarizeIntentDriftForPrompt(temporalDriftMem);
      const reasonDrift = computeArbitrationReasonDrift(temporalDriftMem);
      const rhizohTemporalIntentDriftMemoryV1 = {
        driftSummaryPrompt,
        reasonDrift,
        snapshotCount: temporalDriftMem.snapshots.length
      };

      return {
        identity: {
          persona: {
            firstName: rhizohFirstName || "",
            displayName: String(castleAuth.profile?.displayName || castleAuth.user?.displayName || ""),
            goals: Array.isArray(castleAuth.profile?.goals) ? castleAuth.profile.goals.slice(0, 8) : [],
            preferences: castleAuth.profile?.preferences || {}
          },
          narrative: buildIdentityNarrativeForLlm(ig)
        },
        castleState: {
          realm
        },
        ghostPet: normalizeGhostPetForLlm(meta),
        recentReality: formatRecentRealityLines(meta, rhizohFirstName),
        codex: {
          discoveries
        },
        relationship: {
          bondScore,
          trust,
          familiarity,
          emotions: emotionsForLlm,
          relationalTone: relationalFromMeta || deriveRelationalTone(emotionsForLlm),
          emotionUpdatedAt
        },
        persona: {
          firstName: rhizohFirstName || "",
          displayName: String(castleAuth.profile?.displayName || castleAuth.user?.displayName || ""),
          goals: Array.isArray(castleAuth.profile?.goals) ? castleAuth.profile.goals.slice(0, 8) : [],
          preferences: castleAuth.profile?.preferences || {}
        },
        recentTurns: turns.slice(-8),
        identityNarrative: buildIdentityNarrativeForLlm(ig),
        cognitiveSubThreadsPrompt,
        kernelSeal: KERNEL_SEAL_V1,
        capabilityManifest: CAPABILITY_MANIFEST_V1,
        runtime: {
          ...runtimeBase,
          kernelSeal: KERNEL_SEAL_V1,
          capabilityManifest: CAPABILITY_MANIFEST_V1,
          rhizohPolicy,
          socialField: rhizohSocialField,
          socialRegistry: csilTick.registry,
          socialPhysics: csilTick.socialPhysics,
          socialFieldTheory: csilTick.socialFieldTheory,
          csilToneHint: csilTick.toneHint,
          csilIntroductionGuidance: csilTick.introductionGuidance,
          cognitiveSubThreadsPrompt,
          activeCognitiveSubThreads: Array.isArray(ctxTl?.cognitiveSubThreads)
            ? ctxTl.cognitiveSubThreads.slice(0, 3)
            : [],
          suppressedRealityIndex: getSuppressedRealityIndexForPromptV0({ limit: 10 })
        },
        rhizohOutcomeSession,
        rhizohWeightedMemory,
        rhizohStabilityAnchor: getRhizohStabilityAnchorSnapshot(),
        rhizohNarrativeThread,
        rhizohMemoryEpisodes,
        rhizohNarrativeArc,
        rhizohGovernorCalibration,
        rhizohReliabilityEpisodes: relEpisodes.slice(-12),
        rhizohReliabilitySummary,
        recentReliabilitySummary: rhizohReliabilitySummary,
        rhizohGhostPerceptionV1,
        rhizohPerceptionArbitrationV1,
        rhizohIntentFeedbackClosureV1,
        rhizohTemporalIntentDriftMemoryV1,
        rhizohSuppressedRealityIndexV1: getSuppressedRealityIndexForPromptV0({ limit: 12 }),
        meta: {
          rhizohReliabilityEpisodes: relEpisodes.slice(-12),
          rhizohHealthInfluence,
          rhizohSocialField,
          rhizohSocialRegistry: csilTick.registry
        }
      };
    },
    [castleAuth.profile, castleAuth.user, governanceState, rhizohFirstName, gatewayUx, mapSurfaceActive, remoteCastles]
  );
  const drawerSocialField = useMemo(() => {
    const disk = readClientContinuity();
    const ref = continuityRef.current || { meta: {} };
    const m = { ...(disk.meta || {}), ...(ref.meta || {}) };
    return m.rhizohSocialField && typeof m.rhizohSocialField === "object" ? m.rhizohSocialField : null;
  }, [continuitySocialTick]);
  const drawerSocialRegistry = useMemo(() => {
    const disk = readClientContinuity();
    const ref = continuityRef.current || { meta: {} };
    const m = { ...(disk.meta || {}), ...(ref.meta || {}) };
    return m.rhizohSocialRegistry && typeof m.rhizohSocialRegistry === "object" ? m.rhizohSocialRegistry : null;
  }, [continuitySocialTick]);
  const persistContinuityTurn = useCallback(
    (userText, assistantText, rhizohTrace) => {
      const ref = continuityRef.current || { turns: [], persona: {}, meta: {} };
      const disk = readClientContinuity();
      const prev = {
        turns: Array.isArray(ref.turns) && ref.turns.length ? ref.turns : disk.turns,
        persona: ref.persona && Object.keys(ref.persona).length ? ref.persona : disk.persona,
        meta: { ...(disk.meta || {}), ...(ref.meta || {}) }
      };
      const prevMeta = prev.meta && typeof prev.meta === "object" ? prev.meta : {};
      const ig = readIdentityGraph();
      const ir = ig.rhizoh || {};
      const relationship = {
        trust: Number(ir.trust || 0),
        familiarity: Number(ir.familiarity || 0)
      };
      let weightedTurns = Array.isArray(prevMeta.rhizohWeightedTurns) ? prevMeta.rhizohWeightedTurns : [];
      let pendingWeightedEntry = null;
      if (
        rhizohTrace &&
        typeof rhizohTrace === "object" &&
        rhizohTrace.router &&
        rhizohTrace.emotionsAfter &&
        typeof rhizohTrace.emotionsAfter === "object"
      ) {
        pendingWeightedEntry = buildRhizohWeightedTurnRecord({
          userText,
          assistantText,
          router: rhizohTrace.router,
          source: rhizohTrace.source,
          outcomeResonance: rhizohTrace.outcomeResonance,
          emotionsAfter: rhizohTrace.emotionsAfter,
          emotionsBefore: rhizohTrace.emotionsBefore || rhizohTrace.emotionsAfter,
          relationship,
          epistemic: rhizohTrace.epistemic,
          modelRoute: rhizohTrace.modelRoute
        });
      }
      const narrativeThread = mergeRhizohNarrativeThread(prevMeta.rhizohNarrativeThread, {
        userSnippet: userText,
        intent: rhizohTrace?.router?.intent || "CHAT"
      });
      const bondNum = Math.min(1, Math.max(0, (relationship.trust + relationship.familiarity) / 2));
      const emForArc =
        rhizohTrace &&
        typeof rhizohTrace === "object" &&
        rhizohTrace.emotionsAfter &&
        typeof rhizohTrace.emotionsAfter === "object"
          ? rhizohTrace.emotionsAfter
          : prevMeta.rhizohEmotions && typeof prevMeta.rhizohEmotions === "object"
            ? prevMeta.rhizohEmotions
            : {};
      const orRaw =
        rhizohTrace && typeof rhizohTrace === "object" && rhizohTrace.outcomeResonance != null
          ? Number(rhizohTrace.outcomeResonance)
          : null;
      const narrativeArc = advanceRhizohNarrativeArc(prevMeta.rhizohNarrativeArc, {
        intent: rhizohTrace?.router?.intent || "CHAT",
        bond: bondNum,
        emotions: emForArc,
        outcomeResonance: Number.isFinite(orRaw) ? orRaw : null,
        thread: narrativeThread
      });
      const turns = [
        ...(Array.isArray(prev.turns) ? prev.turns : []),
        {
          ts: Date.now(),
          user: String(userText || "").slice(0, 500),
          assistant: String(assistantText || "").slice(0, 900),
          layerFocus: uiStore.getState().layerFocus
        }
      ].slice(-12);
      emitRhizohBehaviorSignal(
        "rhizoh.conversation.turn_depth",
        buildRhizohTurnDepthSignal(userText, assistantText, rhizohTrace, turns.length)
      );
      const operatorId = String(castleAuth.user?.uid || getOrCreateCastleDevUid() || "local-operator");
      const operatorLabel = String(
        castleAuth.profile?.displayName || castleAuth.user?.displayName || rhizohFirstName || "you"
      ).slice(0, 48);
      const preReplySf = rhizohSocialPreReplyRef.current;
      rhizohSocialPreReplyRef.current = null;
      const castlePeers = castlePeersForSocial(remoteCastles, castleAuth.user?.uid || "");
      const browserPresence = snapshotBrowserPresenceForCsil(browserPresenceRef.current);
      const ecsAgentEvent = (liveAgentsRef.current || []).length
        ? { kind: "ecs_agent_presence", count: (liveAgentsRef.current || []).length }
        : null;
      const baseSf = preReplySf || prevMeta.rhizohSocialField;
      const rhizohSocialField = advanceSocialField(baseSf, {
        message: "",
        recentTurns: turns,
        operatorId,
        operatorLabel,
        trust: relationship.trust,
        familiarity: relationship.familiarity,
        intent: rhizohTrace?.router?.intent || "CHAT",
        assistantSnippet: assistantText,
        castlePeers
      });
      const preReg = rhizohRegistryPreReplyRef.current;
      rhizohRegistryPreReplyRef.current = null;
      const baseReg = preReg || prevMeta.rhizohSocialRegistry;
      const csilPost = advanceCastleSocialIdentity(baseReg, {
        message: "",
        assistantSnippet: assistantText,
        operatorId,
        operatorLabel,
        trust: relationship.trust,
        familiarity: relationship.familiarity,
        hasFirebaseUser: !!castleAuth.user,
        firebaseUid: castleAuth.user?.uid || "",
        sessionKey: operatorId,
        roomTension: Number(rhizohSocialField.roomState?.tension),
        routerIntent: rhizohTrace?.router?.intent || "CHAT",
        identityRecallClosure:
          prevMeta.tceeBoot?.phase === TCEE_PHASE.AWAKE
            ? prevMeta.rhizohLastRecallClosure || null
            : null,
        countUserMessage: false,
        browserPresence,
        castlePeers,
        avatarActivity: (liveAgentsRef.current || []).length > 0,
        agentEvent: ecsAgentEvent
      });
      if (pendingWeightedEntry) {
        const reg = csilPost.registry && typeof csilPost.registry === "object" ? csilPost.registry : {};
        const sp = reg.socialPhysics && typeof reg.socialPhysics === "object" ? reg.socialPhysics : {};
        const sft = reg.socialFieldTheory && typeof reg.socialFieldTheory === "object" ? reg.socialFieldTheory : {};
        pendingWeightedEntry.physicsImprint = buildPhysicsPhaseImprint(sp, sft);
        const wPrev = computeMemoryWeight(pendingWeightedEntry, {
          now: Date.now(),
          queryIntent: pendingWeightedEntry.intent,
          currentBond: pendingWeightedEntry.bond,
          currentPhysics: sp,
          currentFieldTheory: sft
        });
        pendingWeightedEntry.memoryCrystallization = classifyMemoryCrystallization(wPrev);
        pendingWeightedEntry.crystallizationWeightPreview = wPrev;
        weightedTurns = appendRhizohWeightedTurn(weightedTurns, pendingWeightedEntry);
      }
      const memoryEpisodes = buildMemoryEpisodesFromTurns(weightedTurns);
      const govPersist = arbitrationGovernorWorkingRef.current;
      const driftPersist = temporalIntentDriftWorkingRef.current;
      const recallPayload = rhizohTrace?.rhizohRecallMerge?.recallClosurePayload || null;
      const nextBase = {
        turns,
        persona: {
          firstName: rhizohFirstName || "",
          displayName: String(castleAuth.profile?.displayName || castleAuth.user?.displayName || "")
        },
        meta: {
          ...prevMeta,
          rhizohWeightedTurns: weightedTurns,
          rhizohNarrativeThread: narrativeThread,
          rhizohNarrativeArc: narrativeArc,
          rhizohMemoryEpisodes: memoryEpisodes,
          rhizohSocialField,
          rhizohSocialRegistry: csilPost.registry,
          rhizohProductSessionV1: loadRhizohProductSession(prevMeta),
          ...(recallPayload ? { rhizohLastRecallClosure: recallPayload } : {}),
          ...(govPersist && typeof govPersist === "object" && Array.isArray(govPersist.entries)
            ? { rhizohArbitrationGovernorV1: govPersist }
            : {}),
          ...(driftPersist &&
          typeof driftPersist === "object" &&
          Array.isArray(driftPersist.snapshots)
            ? { rhizohTemporalIntentDriftMemoryV1: driftPersist }
            : {}),
          updatedAt: Date.now()
        }
      };
      const heroLabels = (liveAgentsRef.current || [])
        .map((a) => String(a?.id || a?.label || a?.name || "").trim())
        .filter(Boolean)
        .slice(0, 12);
      withRuntimeMergeCommit(() => {
        const recGraph = rhizohTrace?.rhizohRecallMerge?.identityGraphNext;
        if (recGraph && typeof recGraph === "object") {
          writeIdentityGraph(recGraph);
        }
        const mergeId = getLastRuntimeMergeId();
        const mergeAt = Date.now();
        const next = {
          ...nextBase,
          meta: {
            ...nextBase.meta,
            rhizohLastRuntimeMergeId: mergeId,
            rhizohLastMergeAt: mergeAt
          }
        };
        writeClientContinuity(next);
        syncClientContinuityRef(next);
        hydrateIdentityGraphFromSignals(readIdentityGraph(), {
          profileGoals: Array.isArray(castleAuth.profile?.goals) ? castleAuth.profile.goals : [],
          governanceState: governanceRef.current,
          memoryLinks: memoryLinksRef.current,
          unfinishedJourneys: unfinishedJourneysRef.current,
          heroLabels,
          lastIntentRaw: lastIntentRawRef.current,
          userMessage: userText,
          assistantSnippet: assistantText
        });
      });
      if (rhizohTrace?.epistemic && typeof rhizohTrace.epistemic === "object") {
        try {
          window.dispatchEvent(
            new CustomEvent(CASTLE_RHIZOH_EPISTEMIC_SURFACE_EVENT, {
              detail: {
                epistemic: rhizohTrace.epistemic,
                router: rhizohTrace.router,
                source: rhizohTrace.source,
                modelRoute: rhizohTrace.modelRoute || null
              }
            })
          );
        } catch {
          /* noop */
        }
      }
    },
    [castleAuth.profile, castleAuth.user, rhizohFirstName, remoteCastles]
  );
  const persistRhizohEmotionSession = useCallback(
    ({ emotions, relationalTone, emotionUpdatedAt, outcomeResonance, outcomeSession }) => {
      const ref = continuityRef.current || { turns: [], persona: {}, meta: {} };
      const prevMeta = ref.meta && typeof ref.meta === "object" ? ref.meta : {};
      const nextMeta = {
        ...prevMeta,
        rhizohEmotions: emotions,
        rhizohRelationalTone: relationalTone,
        rhizohEmotionUpdatedAt: emotionUpdatedAt
      };
      if (typeof outcomeResonance === "number" && Number.isFinite(outcomeResonance)) {
        nextMeta.rhizohLastOutcomeResonance = Math.round(outcomeResonance * 1000) / 1000;
        nextMeta.rhizohLastOutcomeAt = Date.now();
      }
      if (outcomeSession && typeof outcomeSession === "object") {
        nextMeta.rhizohLastRemoteFetchFailed = !!outcomeSession.lastRemoteFetchFailed;
        nextMeta.rhizohConsecutiveLocalStubCount = Math.max(
          0,
          Math.min(24, Number(outcomeSession.consecutiveLocalStubCount) || 0)
        );
      }
      continuityRef.current = {
        ...ref,
        meta: nextMeta
      };
    },
    []
  );
  const cinematicOutput = useMemo(() =>
    computeRhizohCinematicOutputV1({
      route: cinematicRoute,
      elapsedMs: cinematicElapsedMs
    }), [cinematicRoute, cinematicElapsedMs]
  );
  const governanceFx = useMemo(() => {
    if (governanceState === "FROZEN") return { tone: "from-red-600/10 to-transparent", label: "Fracture Wave", orb: "crystal" };
    if (governanceState === "RECOVERY") return { tone: "from-purple-500/10 to-transparent", label: "Calm Rebuild", orb: "fluid" };
    if (governanceState === "DEGRADED") return { tone: "from-amber-500/10 to-transparent", label: "Amber Flicker", orb: "tense" };
    return { tone: "from-emerald-500/8 to-transparent", label: "Balanced Pulse", orb: "breathing" };
  }, [governanceState]);

  /** Sürekli dinleme açıksa TTS veya sessiz tur sonunda mikrofonu yeniden başlatır. */
  const finishVoiceTurnIfNeeded = useCallback(() => {
    voiceTurnBusyRef.current = false;
    voiceTurnBusySinceRef.current = 0;
    if (!voiceLoopEnabledRef.current || voiceNetworkBlockedRef.current) return;
    window.setTimeout(() => {
      if (!voiceLoopEnabledRef.current || voiceNetworkBlockedRef.current) return;
      void startVoiceToRhizohRef.current(true);
    }, VOICE_AFTER_TURN_RESTART_MS);
  }, []);

  const stopBargeInMic = useCallback(() => {
    const r = bargeInRecognitionRef.current;
    if (!r) return;
    bargeInRecognitionRef.current = null;
    try {
      r.__castleStopRequested = true;
      r.onresult = null;
      r.onerror = null;
      r.onend = null;
      r.stop();
    } catch {
      /* noop */
    }
  }, []);

  const speakRhizoh = useCallback(
    (text, opts = {}) => {
      const voiceTurn = opts?.voiceTurn === true;
      if (!("speechSynthesis" in window)) {
        if (voiceTurn) finishVoiceTurnIfNeeded();
        return;
      }
      stopBargeInMic();
      if (!text) {
        if (voiceTurn) finishVoiceTurnIfNeeded();
        return;
      }
      const sessionId = ++voiceTtsSessionIdRef.current;
      const utterance = new SpeechSynthesisUtterance(String(text).slice(0, 1800));
      utterance.lang = "tr-TR";
      utterance.rate = 1;
      utterance.pitch = 1.05;
      utterance.volume = 0.92;
      utterance.onstart = () => {
        if (sessionId !== voiceTtsSessionIdRef.current) return;
        if (voiceTurn) {
          setRhizohFieldState("SPEAKING");
          if (voiceBargeInEnabledRef.current) {
            window.setTimeout(() => {
              startBargeInWhileRhizohSpeaksRef.current(sessionId);
            }, 320);
          }
        }
      };
      utterance.onend = () => {
        stopBargeInMic();
        if (sessionId !== voiceTtsSessionIdRef.current) return;
        if (voiceTurn) {
          setRhizohFieldState("IDLE");
          finishVoiceTurnIfNeeded();
        }
      };
      utterance.onerror = () => {
        stopBargeInMic();
        if (sessionId !== voiceTtsSessionIdRef.current) return;
        if (voiceTurn) {
          setRhizohFieldState("IDLE");
          finishVoiceTurnIfNeeded();
        }
      };
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
      window.speechSynthesis.speak(utterance);
      setVoiceReady(true);
    },
    [finishVoiceTurnIfNeeded, stopBargeInMic]
  );

  const handleVoiceTranscript = useCallback(
    async (text, { manageVoiceTurn = false, source = "mic" } = {}) => {
      const trimmed = String(text || "").trim();
      if (!trimmed) {
        if (manageVoiceTurn) finishVoiceTurnIfNeeded();
        return;
      }
      voiceTurnBusyRef.current = true;
      voiceTurnBusySinceRef.current = Date.now();
      setMicListening(false);
      try {
        const focusPre = uiStore.getState().layerFocus;
        enqueueCastleRuntimeTransaction({
          kind: "voice_event",
          source: source === "barge_in" ? "speech_recognition_barge_in" : "speech_recognition_onresult",
          payload: { textLen: trimmed.length, layerFocus: focusPre }
        });
        setCmd(trimmed);
        setRhizohFieldState("INTERPRETING");
        const focus = focusPre;
        const profile = LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10];
        const spec = LAYER_SPECS.find((layerRow) => layerRow.id === focus) || LAYER_SPECS[10];
        let idToken = "";
        try {
          idToken = castleAuth.user ? await castleAuth.user.getIdToken() : "";
        } catch {
          /* noop */
        }
        const out = await queryRhizohLLM({
          message: trimmed,
          provider: "openai",
          connectionId: "",
          agentId: "",
          layerProfile: profile,
          layerSpec: spec,
          simTime: coreWorld.simTime,
          idToken,
          gatewayUx,
          continuity: buildContinuityPayload(trimmed),
          generationMode: "FAST_DIALOGUE",
          fetchTimeoutMs: VOICE_LLM_TIMEOUT_MS,
          slimVoicePath: true,
          persistRhizohEmotions: persistRhizohEmotionSession,
          productDecisionOverlay: rhizohProductDecisionOverlayRef.current
        });
        applyRhizohDirective(out.directive, engineRef);
        const normV = buildRhizohNormalizedLlmOutput(out, gatewayUx, mapSurfaceActive);
        const procV = materializeCommsFromNormalized(normV, out.reply);
        setRhizohMainHudReply({
          text: procV.uiReply,
          source: String(out.source || "voice"),
          at: Date.now()
        });
        publishAgentSpokeObservationV0({
          text: procV.uiReply,
          source: String(out.source || "voice"),
          traceId: out.traceId || ""
        });
        if (!procV.skipSpeech) {
          speakRhizoh(procV.uiReply, { voiceTurn: manageVoiceTurn });
        } else {
          setRhizohFieldState("IDLE");
          if (manageVoiceTurn) finishVoiceTurnIfNeeded();
        }
        const stVoice = uiStore.getState();
        void rhizohPersistTraceFromOut(out, {
          traceId: out.traceId || "",
          gatewayPhase: gatewayUx?.phase,
          mapSurfaceActive,
          layerFocus: focusPre,
          simTime: coreWorld.simTime,
          realityMode: stVoice.realityMode,
          governanceState: stVoice.governanceState,
          idToken
        }).then((trace) => {
          persistContinuityTurn(trimmed, out.reply, trace);
        });
        uiStore.dispatch({
          type: "ADD_LOG",
          payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `VOICE·RHIZOH · ${trimmed.slice(0, 120)}` }
        });
      } catch (err) {
        console.error("[VOICE_LLM_FATAL]", err);
        voiceTurnBusyRef.current = false;
        voiceTurnBusySinceRef.current = 0;
        setRhizohFieldState("IDLE");
        const msg =
          String(err?.message || err).includes("timeout") || String(err?.name || "") === "AbortError"
            ? "Yanıt çok uzun sürdü; kısa bir cümleyle tekrar dene."
            : "Ses ile Rhizoh hattında hata oluştu; yazarak da gönderebilirsin.";
        if (manageVoiceTurn) {
          speakRhizoh(msg, { voiceTurn: true });
        }
      }
    },
    [
      castleAuth.user,
      speakRhizoh,
      finishVoiceTurnIfNeeded,
      buildContinuityPayload,
      persistContinuityTurn,
      persistRhizohEmotionSession,
      gatewayUx,
      mapSurfaceActive,
      rhizohGenerationMode
    ]
  );

  const startBargeInWhileRhizohSpeaks = useCallback(
    (ttsSessionId) => {
      if (ttsSessionId !== voiceTtsSessionIdRef.current) return;
      if (!voiceBargeInEnabledRef.current) return;
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) return;
      stopBargeInMic();
      const rec = new Ctor();
      rec.lang = String(navigator?.language || "tr-TR");
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 1;
      rec.__castleStopRequested = false;
      bargeInRecognitionRef.current = rec;
      const maybeInterrupt = (raw, isFinal) => {
        const t = String(raw || "").trim();
        if (t.length < 4) return;
        if (!isFinal && t.length < 14) return;
        if (ttsSessionId !== voiceTtsSessionIdRef.current) return;
        voiceTtsSessionIdRef.current += 1;
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* noop */
        }
        stopBargeInMic();
        voiceTurnBusyRef.current = true;
        void Promise.resolve(
          handleVoiceTranscriptRef.current(t, {
            manageVoiceTurn: voiceLoopEnabledRef.current,
            source: "barge_in"
          })
        ).catch((err) => {
          console.error("[VOICE_BARGE_FATAL]", err);
          voiceTurnBusyRef.current = false;
          setRhizohFieldState("IDLE");
          setVoiceLoopEnabled(false);
        });
      };
      rec.onresult = (ev) => {
        let chunk = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          chunk += ev.results[i][0].transcript;
        }
        const last = ev.results[ev.results.length - 1];
        maybeInterrupt(chunk, !!last?.isFinal);
      };
      rec.onerror = (e) => {
        const err = String(e?.error || "");
        if (err !== "aborted" && err !== "no-speech") {
          console.warn(`[VOICE_BARGE_IN_ERROR] code=${err || "unknown"}`);
        }
        stopBargeInMic();
      };
      rec.onend = () => {
        if (bargeInRecognitionRef.current === rec) bargeInRecognitionRef.current = null;
      };
      try {
        rec.start();
      } catch {
        stopBargeInMic();
      }
    },
    [stopBargeInMic]
  );

  useEffect(() => {
    handleVoiceTranscriptRef.current = handleVoiceTranscript;
  }, [handleVoiceTranscript]);
  useEffect(() => {
    startBargeInWhileRhizohSpeaksRef.current = startBargeInWhileRhizohSpeaks;
  }, [startBargeInWhileRhizohSpeaks]);

  const ensureAmbientSound = useCallback(() => {
    if (ambientCtxRef.current) return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const master = ctx.createGain();
    master.gain.value = 0.04;
    master.connect(ctx.destination);

    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 92;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.08;
    hum.connect(humGain).connect(master);
    hum.start();

    const whisper = ctx.createOscillator();
    whisper.type = "triangle";
    whisper.frequency.value = 180;
    const whisperGain = ctx.createGain();
    whisperGain.gain.value = 0.04;
    whisper.connect(whisperGain).connect(master);
    whisper.start();

    ambientCtxRef.current = ctx;
    ambientNodesRef.current = [hum, whisper, humGain, whisperGain, master];
  }, []);

  const fallbackToTextInput = useCallback(
    (reason = "stt_unavailable") => {
      activateVoiceFallbackModeV0(String(reason || "stt_unavailable"));
      setVoiceLoopEnabled(false);
      setVoiceNetworkBlocked(true);
      setMicListening(false);
      voiceTurnBusyRef.current = false;
      voiceTurnBusySinceRef.current = 0;
      voiceNetworkRetryRef.current = 0;
      try {
        window.speechSynthesis?.cancel?.();
      } catch {
        /* noop */
      }
      stopBargeInMic();
      const prev = recognitionRef.current;
      if (prev) {
        try {
          prev.__castleStopRequested = true;
          prev.stop();
        } catch {
          /* noop */
        }
      }
      const snap = getVoiceAdapterRegistrySnapshot();
      try {
        bootLogRef.current?.warn?.(
          "app.voice.fallback",
          `text_input active reason=${reason} stt=${snap.sttStatus} fallback=${snap.fallbackMode}`
        );
      } catch {
        /* noop */
      }
      console.info("[VOICE_ADAPTER] debug truth", {
        adapters: getRhizohInputAdaptersV0(),
        registry: snap
      });
      window.requestAnimationFrame(() => {
        try {
          commandInputRef.current?.focus?.();
        } catch {
          /* noop */
        }
      });
    },
    [stopBargeInMic]
  );

  const startVoiceToRhizoh = useCallback(
    async (keepAlive = false) => {
      const adapterSnap = ensureVoiceAdapterRegistered();
      if (!getRhizohInputAdaptersV0().voice || adapterSnap.fallbackMode) {
        fallbackToTextInput("no_adapter_at_start");
        speakRhizoh("Bu tarayıcıda ses tanıma yok. Aşağıya yazıp gönder.");
        return;
      }
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        fallbackToTextInput("no_speech_ctor");
        speakRhizoh("Bu tarayıcıda ses tanıma yok. Aşağıya yazıp gönder.");
        return;
      }
      stopBargeInMic();
      const prev = recognitionRef.current;
      if (prev) {
        try {
          prev.onresult = null;
          prev.onerror = null;
          prev.onend = null;
          prev.__castleStopRequested = true;
          prev.stop();
        } catch {
          /* noop */
        }
      }
      ensureAmbientSound();
      try {
        window.speechSynthesis?.cancel?.();
      } catch {
        /* noop */
      }
      setRhizohFieldState("LISTENING");
      setMicListening(true);
      const rec = new Ctor();
      rec.lang = String(navigator?.language || "tr-TR");
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = !!keepAlive;
      rec.__castleStopRequested = false;
      rec.onend = () => {
        setMicListening(false);
        if (rec.__castleStopRequested) return;
        if (!keepAlive) return;
        if (voiceNetworkBlockedRef.current) return;
        if (voiceTurnBusyRef.current) {
          return;
        }
        window.setTimeout(() => {
          if (!voiceLoopEnabledRef.current) return;
          void startVoiceToRhizohRef.current(true);
        }, 220);
      };
      rec.onerror = (e) => {
        setMicListening(false);
        const err = String(e?.error || "");
        const msg = typeof e?.message === "string" ? e.message : "";
        const benign = err === "aborted" || err === "no-speech";
        const outcome = recordVoiceSttErrorV0(err, msg);
        if (!benign) {
          console.warn(
            `[VOICE_RECOGNITION_ERROR] code=${err || "unknown"}${msg ? ` message=${msg}` : ""}`,
            outcome.snapshot
          );
        }
        if (benign) return;
        if (outcome.shouldRetryNetwork) {
          voiceNetworkRetryRef.current = outcome.snapshot.networkRetryCount;
          window.setTimeout(() => {
            if (keepAlive && !voiceLoopEnabledRef.current) return;
            void startVoiceToRhizohRef.current(keepAlive);
          }, 420 + (outcome.snapshot.networkRetryCount - 1) * 380);
          return;
        }
        if (err === "not-allowed" || err === "service-not-allowed") {
          fallbackToTextInput("permission_denied");
          speakRhizoh("Mikrofon izni gerekli. Tarayıcı ayarlarından bu siteye izin ver.");
        } else if (err === "audio-capture") {
          fallbackToTextInput("audio_capture");
          speakRhizoh("Mikrofon bulunamadı ya da kullanılamıyor. Ses giriş cihazını kontrol et.");
        } else if (err === "network") {
          fallbackToTextInput("network");
          const now = Date.now();
          if (now - Number(lastVoiceNetworkWarnAtRef.current || 0) > 15000) {
            lastVoiceNetworkWarnAtRef.current = now;
            speakRhizoh(
              "Tarayıcı ses tanıma servisine şu an ulaşılamıyor. Bu Rhizoh bağlantı hatası değil; yazıp gönderebilirsin."
            );
          }
        } else if (err === "language-not-supported") {
          fallbackToTextInput("language_unsupported");
          speakRhizoh("Seçili dilde ses tanıma desteklenmiyor. Tarayıcı dilini değiştirip tekrar dene.");
        } else if (outcome.shouldFallback) {
          fallbackToTextInput(err || "unknown");
          speakRhizoh("Ses tanıma başarısız. Yazarak göndermeyi dene.");
        }
      };
      rec.onresult = async (ev) => {
        try {
          const text = String(ev?.results?.[0]?.[0]?.transcript || "").trim();
          setMicListening(false);
          setVoiceNetworkBlocked(false);
          clearVoiceSttRecoveryV0();
          voiceNetworkRetryRef.current = 0;
          if (!text) {
            if (keepAlive && !voiceTurnBusyRef.current) {
              window.setTimeout(() => {
                if (!voiceLoopEnabledRef.current || voiceNetworkBlockedRef.current) return;
                void startVoiceToRhizohRef.current(true);
              }, 220);
            }
            return;
          }
          voiceTurnBusyRef.current = true;
          voiceTurnBusySinceRef.current = Date.now();
          await handleVoiceTranscript(text, { manageVoiceTurn: keepAlive, source: "mic" });
        } catch (err) {
          console.error("[VOICE_PIPE_FATAL]", err);
          try {
            window.__CASTLE_LAST_FATAL__ = {
              kind: "voice_onresult",
              err,
              message: String(err?.message || err),
              stack: String(err?.stack || ""),
              at: Date.now()
            };
          } catch {
            /* noop */
          }
          setMicListening(false);
          setRhizohFieldState("IDLE");
          voiceTurnBusyRef.current = false;
          voiceTurnBusySinceRef.current = 0;
          setVoiceLoopEnabled(false);
          speakRhizoh("Ses ile Rhizoh hattında hata oluştu; yazarak göndermeyi dene.");
        }
      };
      recognitionRef.current = rec;
      try {
        rec.start();
      } catch {
        setMicListening(false);
        voiceNetworkRetryRef.current = 0;
        speakRhizoh("Mikrofon başlatılamadı.");
      }
    },
    [
      speakRhizoh,
      ensureAmbientSound,
      handleVoiceTranscript,
      stopBargeInMic,
      fallbackToTextInput
    ]
  );

  useEffect(() => {
    startVoiceToRhizohRef.current = startVoiceToRhizoh;
  }, [startVoiceToRhizoh]);

  const stopVoiceLoop = useCallback(() => {
    setVoiceLoopEnabled(false);
    voiceTurnBusyRef.current = false;
    voiceTurnBusySinceRef.current = 0;
    voiceTtsSessionIdRef.current += 1;
    try {
      window.speechSynthesis?.cancel?.();
    } catch {
      /* noop */
    }
    stopBargeInMic();
    const prev = recognitionRef.current;
    if (prev) {
      try {
        prev.__castleStopRequested = true;
        prev.stop();
      } catch {
        /* noop */
      }
    }
    setMicListening(false);
    voiceNetworkRetryRef.current = 0;
    clearVoiceSttRecoveryV0();
  }, [stopBargeInMic]);

  const startVoiceLoop = useCallback(() => {
    const snap = ensureVoiceAdapterRegistered();
    const adapters = getRhizohInputAdaptersV0();
    if (!adapters.voice || snap.fallbackMode) {
      fallbackToTextInput("no_voice_adapter");
      speakRhizoh("Ses tanıma kullanılamıyor. Aşağıya yazıp gönderebilirsin.");
      return;
    }
    setVoiceNetworkBlocked(false);
    voiceNetworkRetryRef.current = 0;
    clearVoiceSttRecoveryV0();
    setVoiceLoopEnabled(true);
    void startVoiceToRhizoh(true);
  }, [startVoiceToRhizoh, fallbackToTextInput, speakRhizoh]);

  useEffect(() => {
    let isMounted = true;
    let simRaf = null;

    const resizeObserver = new ResizeObserver(() => {
      if (engineRef.current) engineRef.current.handleResize();
    });

    const init = async () => {
      try {
        for (let i = 0; i < 300; i++) coreWorld.allocate(`CITIZEN-${i}`, STATE.CITIZEN);
      if (coreWorld.rhizohIdx === -1) coreWorld.allocate("RHIZOH-PRIME", STATE.RHIZOH);

      if (containerRef.current && !engineRef.current) {
        try {
          engineRef.current = new ApexEngine(containerRef.current);
          notifyRealityEngineReady();
          resizeObserver.observe(containerRef.current);
        } catch (err) {
          console.error("[Castle] ApexEngine boot failed", err);
          try {
            window.__CASTLE_LAST_FATAL__ = {
              kind: "apex_engine_constructor",
              err,
              message: String(err?.message || err),
              stack: String(err?.stack || ""),
              at: Date.now()
            };
          } catch {
            /* noop */
          }
          engineRef.current = null;
        }
      }
      let lastTime = performance.now();
      let accumulator = 0;
      const fixedStep = 1 / 60;
      let uiSyncCounter = 0;

      const simLoop = (now) => {
        let dt = (now - lastTime) / 1000;
        lastTime = now;
        if (dt > 0.25) dt = 0.25;

        accumulator += dt;
        while (accumulator >= fixedStep) {
          coreWorld.tick(fixedStep);
          cityMind.tick(fixedStep, coreWorld);
          accumulator -= fixedStep;
        }

        coreWorld.flushRemoved();

        uiSyncCounter++;
        if (uiSyncCounter >= 30) {
          uiStore.dispatch({ type: "FLUSH_EVENT_PULSES" });
          uiStore.dispatch({ type: "SYNC_STATS", payload: coreWorld.activeCount });
          uiStore.dispatch({
            type: "SYNC_METRICS",
            payload: {
              academicsTier: cityMind.academicsTier,
              district0Energy: cityMind.districtEnergy[0],
              squadCount: squadRegistry.squads.size,
              swarmActive: coreWorld.swarmActive
            }
          });
          uiSyncCounter = 0;
        }

        simRaf = requestAnimationFrame(simLoop);
      };
        simRaf = requestAnimationFrame(simLoop);
      } catch (err) {
        console.error("[Castle] init failed", err);
        try {
          window.__CASTLE_LAST_FATAL__ = {
            kind: "app_init",
            err,
            message: String(err?.message || err),
            stack: String(err?.stack || ""),
            at: Date.now()
          };
        } catch {
          /* noop */
        }
      } finally {
        if (isMounted) setBooted(true);
      }
    };

    init();

    return () => {
      isMounted = false;
      flowTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      flowTimersRef.current = [];
      ambientNodesRef.current.forEach((n) => {
        try { n.stop?.(); } catch { /* noop */ }
        try { n.disconnect?.(); } catch { /* noop */ }
      });
      ambientNodesRef.current = [];
      if (ambientCtxRef.current) {
        void ambientCtxRef.current.close();
        ambientCtxRef.current = null;
      }
      coreWorld.reset();
      cityMind.reset();
      squadRegistry.clear();
      eventMesh.clear();
      resetL9EventBus();
      resizeObserver.disconnect();
      if (simRaf) cancelAnimationFrame(simRaf);
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const heroes = sampleLiveAgentProjection(22).map((h) => {
        const avatar = resolveHeroAvatar(h);
        return {
          ...h,
          avatarKey: avatar.key,
          avatarLabel: avatar.label,
          alt: 110 + (h.idx % 11) * 26
        };
      });
      setLiveAgents(heroes);
      window.__CASTLE_WORLD_PROJECTION__ = {
        ts: Date.now(),
        simTime: coreWorld.simTime,
        swarmActive: coreWorld.swarmActive,
        governance: governanceRef.current,
        governanceEnteredAt: governanceEnteredAtRef.current,
        broadcastEmphasis: { ...broadcastEmphasisRef.current },
        memoryHeat: memoryLinksRef.current,
        anchor: { lat: ISTANBUL_POI.FATIH.lat, lon: ISTANBUL_POI.FATIH.lon },
        memoryConstellation: buildMemoryConstellationNodes(memoryLinksRef.current, 42),
        heroes
      };
    }, 320);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!booted) return;
    const toRad = (d) => (d * Math.PI) / 180;
    const distKm = (la, lo, la2, lo2) => {
      const R = 6371;
      const dLa = toRad(la2 - la);
      const dLo = toRad(lo2 - lo);
      const a =
        Math.sin(dLa / 2) ** 2 + Math.cos(toRad(la)) * Math.cos(toRad(la2)) * Math.sin(dLo / 2) ** 2;
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
    };
    const id = window.setInterval(() => {
      l9BackgroundTickRef.current += 1;
      const stride = getL9BackgroundTickStride();
      if (stride > 1 && l9BackgroundTickRef.current % stride !== 0) return;

      const mapOk = uiStore.getState().mapSurfaceActive;
      const swarm = coreWorld.swarmActive;
      const geo = typeof window !== "undefined" ? window.__CASTLE_NEXUS_GEO__ : null;
      const psMap = l9PrevAgentRef.current.state;
      const ppMap = l9PrevAgentRef.current.pet;

      if (mapOk && swarm && geo?.lat != null && geo?.lon != null) {
        const rows = sampleLiveAgentProjection(96);
        let cnt = 0;
        for (const a of rows) {
          if (distKm(geo.lat, geo.lon, a.lat, a.lon) <= 3.6) cnt++;
        }
        if (cnt >= 6) {
          pushL9SocialDraftArbitrated({
            trigger: "swarm_nexus",
            agent: "CityMind",
            platform: "X (Twitter)",
            agentIdx: coreWorld.rhizohIdx >= 0 ? coreWorld.rhizohIdx : -1,
            lat: geo.lat,
            lon: geo.lon,
            agentCount: cnt,
            text: `Istanbul Nexus'ta devasa bir enerji dalgalanması tespiti. ${cnt} otonom ajan ana kalede savunma formasyonuna geçti. #CastleGenesis`,
            heatPulse: buildPulseSeriesFromSeed(cnt + (Date.now() % 997), 14),
            thoughtChain: buildThoughtChainL8V1({
              threatLevel: Math.min(1, cnt / 16),
              districtEnergy: 0.52 + cnt * 0.03,
              swarmLevel: 0.74,
              memoryEcho: 0.41
            })
          });
        }
      }

      l9SpiralTickRef.current += 1;
      if (swarm && mapOk && l9SpiralTickRef.current % 22 === 0) {
        pushL9SocialDraftArbitrated({
          trigger: "spiral_geometry",
          agent: "Atlas",
          platform: "X (Twitter)",
          agentIdx: -1,
          lat: ISTANBUL_POI.FATIH.lat,
          lon: ISTANBUL_POI.FATIH.lon,
          text: "Atlas birimi, L10 katmanında yeni bir yörünge geometrisi keşfetti. Şehir haritasında genişleyen spiral deseni stabilize edildi.",
          heatPulse: buildPulseSeriesFromSeed(Math.floor(coreWorld.simTime * 10) + 3, 14),
          thoughtChain: buildThoughtChainL8V1({
            threatLevel: 0.44,
            districtEnergy: 0.63,
            swarmLevel: 0.82,
            memoryEcho: 0.35
          })
        });
      }

      const n = Math.min(coreWorld.activeCount, coreWorld.MAX);
      for (let i = 0; i < n; i++) {
        const prevS = psMap.get(i);
        const curS = coreWorld.state[i];
        if (prevS === STATE.AGENT_STUDENT && curS === STATE.AGENT_MASTER) {
          const idStr = String(coreWorld.indexToId[i] || `A-${i}`);
          const { lat, lon } = sceneXZToLatLon(coreWorld.posX[i], coreWorld.posZ[i]);
          pushL9SocialDraftArbitrated({
            trigger: "academy_master",
            agent: idStr,
            platform: "X (Twitter)",
            agentIdx: i,
            lat,
            lon,
            text: `${idStr} [Prometheus] Master seviyesine ulaştı ve kaleden ayrılıp kendi şehrini kurma yetkisi kazandı.`,
            heatPulse: buildPulseSeriesFromSeed(i + 11, 14),
            thoughtChain: buildThoughtChainL8V1({
              threatLevel: 0.22,
              districtEnergy: 0.88,
              swarmLevel: 0.52,
              memoryEcho: 0.76
            })
          });
        }
        const prevP = ppMap.get(i);
        const curP = coreWorld.petStage[i];
        if (curS === STATE.GHOSTPET && prevP === PET_STAGE.SPIRIT && curP === PET_STAGE.GUARDIAN) {
          const idStr = String(coreWorld.indexToId[i] || `PET-${i}`);
          const { lat, lon } = sceneXZToLatLon(coreWorld.posX[i], coreWorld.posZ[i]);
          pushL9SocialDraftArbitrated({
            trigger: "pet_guardian",
            agent: idStr,
            platform: "Telegram",
            agentIdx: i,
            lat,
            lon,
            text: `Ghost Pet ${idStr} SPIRIT aşamasından GUARDIAN'a evrildi — kale bariyerleri güçlendirildi.`,
            heatPulse: buildPulseSeriesFromSeed(i + 901, 14),
            thoughtChain: buildThoughtChainL8V1({
              threatLevel: 0.26,
              districtEnergy: 0.64,
              swarmLevel: 0.45,
              memoryEcho: 0.58
            })
          });
        }
        psMap.set(i, curS);
        ppMap.set(i, curP);
      }
    }, 8000);
    return () => {
      window.clearInterval(id);
      resetL9EventBus();
    };
  }, [booted]);

  useEffect(() => {
    const onGhost = (e) => {
      const idx = e?.detail?.agentIdx;
      if (idx == null || idx < 0) return;
      if (coreWorld.state[idx] !== STATE.GHOSTPET) return;
      coreWorld.xp[idx] = Math.min(1e6, (coreWorld.xp[idx] || 0) + 200);
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: {
          ts: new Date().toLocaleTimeString(),
          type: "SYS",
          data: `Ghost Pet · L9 bellek nabzı (idx ${idx}) — kişilik yüzeyi güncellendi`
        }
      });
    };
    window.addEventListener("castle-l9-ghost-personality", onGhost);
    return () => window.removeEventListener("castle-l9-ghost-personality", onGhost);
  }, []);

  useEffect(() => {
    const onFeedback = (ev) => {
      const d = ev?.detail;
      if (!d?.kind) return;
      const ts = new Date().toLocaleTimeString();
      if (d.kind === "execution_deferred") {
        uiStore.dispatch({
          type: "ADD_LOG",
          payload: {
            ts,
            type: "SYS",
            data: `L9 FEEDBACK · emit beklemeye alındı (${d.reason || "?"}) · ${String(d.trigger || "").slice(0, 24)}`
          }
        });
      } else if (d.kind === "hold_overflow") {
        uiStore.dispatch({
          type: "ADD_LOG",
          payload: {
            ts,
            type: "WARN",
            data: `L9 FEEDBACK · execution hold taştı (32) — ${String(d.message || "eski taslak düşürüldü")}`
          }
        });
      }
    };
    window.addEventListener(CASTLE_L9_EXECUTION_FEEDBACK, onFeedback);
    return () => window.removeEventListener(CASTLE_L9_EXECUTION_FEEDBACK, onFeedback);
  }, []);

  const buildShareArtifact = (preview) => {
    const replay =
      greenRoomLive?.sharePath ||
      greenRoomLive?.replayPath ||
      (preview?.traceId ? `/replay/${preview.traceId}` : "/replay/pending");
    return [
      "I just created a RHIZOH event:",
      `- Intent: ${lastIntentRaw || "N/A"}`,
      `- Outcome: ${preview?.type ?? "N/A"} (${preview?.status ?? "N/A"})`,
      `- Ack: ${greenRoomLive?.ack ?? "pending"}`,
      `- Replay: ${replay}`
    ].join("\n");
  };

  const handleExecute = async (overrideRaw) => {
    const raw = (overrideRaw ?? cmd).trim();
    if (!raw) return;
    setHasSentRhizohCommand(true);
    setRhizohInlineError(null);
    setRhizohMainHudReply(null);
    const intent = raw.toUpperCase();
    const isBroadcastIntent =
      /YAYIN|BROADCAST|GREENROOM|LIVE|STUDIO|CANLI/.test(intent) ||
      /canlı|yayın|yayını|yayınla|\byayin\b|\bcanli\b/i.test(raw);
    const traceId = `TRC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    setGreenRoomLive(null);
    greenRoomSparklineRef.current = [];
    setSparklineVersion(0);
    broadcastEmphasisRef.current = {
      active: false,
      until: 0,
      traceId: null,
      phase: null,
      joinPresenceUntil: 0
    };
    setLastIntentRaw(raw);
    setDemoLoopState("CREATING");

    flowTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    flowTimersRef.current = [];
    setShowWhy(false);
    setRhizohFieldState("INTERPRETING");
    setRealityState("WORLD_SIMULATING");
    setGovernanceState("NORMAL");
    setEventPreview({
      status: "PROCESSING",
      type: isBroadcastIntent ? "Live Broadcast" : "World Mutation",
      location: isBroadcastIntent ? "Istanbul Arena (simulated)" : "Castle World Layer",
      confidence: 0.86,
      risk: "Low",
      eventId: null,
      traceId
    });
    setLastWhy([
      "Intent gerçek LLM hattına yönlendirildi",
      "Layer profile + runtime context ile prompt zenginleştirildi",
      "Directive cevabına göre kamera/harita uygulanacak",
      `Routing plan: ${isBroadcastIntent ? "Studio + GreenRoom" : "Rhizoh Command Layer"}`
    ]);
    setRhizohFieldState("GENERATING");

    try {
      const focus = uiStore.getState().layerFocus;
      const profile = LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10];
      const spec = LAYER_SPECS.find((layerRow) => layerRow.id === focus) || LAYER_SPECS[10];
      let idToken = "";
      try {
        idToken = castleAuth.user ? await castleAuth.user.getIdToken() : "";
      } catch {
        idToken = "";
      }

      const out = await queryRhizohLLM({
        message: raw,
        provider: "openai",
        connectionId: "",
        agentId: "",
        layerProfile: profile,
        layerSpec: spec,
        simTime: coreWorld.simTime,
        idToken,
        gatewayUx,
        continuity: buildContinuityPayload(raw),
        generationMode: rhizohGenerationMode,
        persistRhizohEmotions: persistRhizohEmotionSession,
        productDecisionOverlay: rhizohProductDecisionOverlayRef.current
      });

      const normExec = buildRhizohNormalizedLlmOutput(out, gatewayUx, mapSurfaceActive);
      const procExec = materializeCommsFromNormalized(normExec, out.reply);
      setRhizohMainHudReply({
        text: procExec.uiReply,
        source: String(out.source || "unknown"),
        at: Date.now()
      });
      publishAgentSpokeObservationV0({
        text: procExec.uiReply,
        source: String(out.source || "unknown"),
        traceId: out.traceId || traceId || ""
      });

      setHasReceivedRhizohReply(true);
      setCommandLog((prev) => [{ ts: Date.now(), raw, source: out.source || "unknown" }, ...prev].slice(0, 24));

      setRhizohFieldState("EXECUTING");
      setRealityState(isBroadcastIntent ? "WORLD_BROADCASTING" : "WORLD_TRANSITION");
      applyRhizohDirective(out.directive, engineRef);
      if (!isBroadcastIntent && !procExec.skipSpeech) {
        speakRhizoh(procExec.uiReply, { voiceTurn: voiceLoopEnabled });
      }
      const stExec = uiStore.getState();
      try {
        persistContinuityTurn(
          raw,
          out.reply,
          await rhizohPersistTraceFromOut(out, {
            traceId: traceId || out.traceId || "",
            gatewayPhase: gatewayUx?.phase,
            mapSurfaceActive,
            layerFocus: focus,
            simTime: coreWorld.simTime,
            realityMode: stExec.realityMode,
            governanceState: stExec.governanceState,
            idToken
          })
        );
      } catch (persistErr) {
        console.warn("[RHIZOH_CONTINUITY_PERSIST_WARN]", String(persistErr?.message || persistErr || "persist_failed"));
      }
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: {
          ts: new Date().toLocaleTimeString(),
          type: "SYS",
          data: `RHIZOH LIVE [${out.source || "unknown"}] · ${intent}`
        }
      });

      if (isBroadcastIntent) {
        try {
          const title =
            String(out.reply || "")
              .split("\n")
              .map((s) => s.trim())
              .find(Boolean)
              ?.slice(0, 120) || "Castle Live";
          const routingStartedAt = Date.now();
          greenRoomSparklineRef.current = [];
          setSparklineVersion(0);
          broadcastEmphasisRef.current = {
            active: true,
            until: Date.now() + 240_000,
            traceId,
            phase: "ROUTING",
            joinPresenceUntil: 0
          };
          setGreenRoomLive({
            title,
            traceId,
            phase: "ROUTING",
            routingStartedAt,
            liveStartedAt: null,
            replayReady: false,
            memorySealed: false,
            transcriptId: null,
            ack: null,
            replayPath: null,
            sharePath: null
          });

          const audienceEstimate = computeSimulatedAudienceEstimate({
            swarmBoost: swarmActiveUi || coreWorld.swarmActive,
            activeHeroCount: liveAgentsRef.current.length,
            memoryHeat: memoryLinksRef.current
          });
          const gr = await postGreenRoomCapability({
            idToken,
            intentRaw: raw,
            title,
            audienceEstimate,
            traceId,
            roomId: "greenroom-main"
          });
          broadcastEmphasisRef.current = {
            active: true,
            until: Date.now() + 240_000,
            traceId: gr.traceId,
            phase: "LIVE",
            joinPresenceUntil: broadcastEmphasisRef.current.joinPresenceUntil || 0
          };
          setGreenRoomLive({
            title,
            traceId: gr.traceId,
            phase: "LIVE",
            routingStartedAt,
            liveStartedAt: Date.now(),
            replayReady: true,
            memorySealed: true,
            transcriptId: gr.transcript?.id ?? null,
            ack: gr.ack ?? "BROADCAST_ROUTED",
            replayPath: gr.replayPath ?? `/replay/${gr.traceId}`,
            sharePath: gr.sharePath ?? `/replay/${gr.traceId}`
          });
          {
            const heroLabels = (liveAgentsRef.current || [])
              .map((a) => String(a?.id || a?.label || a?.name || "").trim())
              .filter(Boolean)
              .slice(0, 12);
            hydrateIdentityGraphFromSignals(readIdentityGraph(), {
              greenRoom: { title, traceId: gr.traceId, ack: gr.ack ?? "BROADCAST_ROUTED" },
              profileGoals: Array.isArray(castleAuth.profile?.goals) ? castleAuth.profile.goals : [],
              governanceState: governanceRef.current,
              memoryLinks: memoryLinksRef.current,
              unfinishedJourneys: unfinishedJourneysRef.current,
              heroLabels,
              lastIntentRaw: raw
            });
          }
          speakRhizoh("Yayını açtım. Dünya dinliyor.");
          const vEcho = window.setTimeout(() => speakRhizoh("İlk yankılar geliyor."), 15_000);
          flowTimersRef.current.push(vEcho);
          const tCool = window.setTimeout(() => {
            broadcastEmphasisRef.current = {
              ...broadcastEmphasisRef.current,
              phase: "COOLDOWN"
            };
            setGreenRoomLive((p) => (p?.traceId === gr.traceId ? { ...p, phase: "COOLDOWN" } : p));
          }, 90_000);
          const tArch = window.setTimeout(() => {
            broadcastEmphasisRef.current = {
              ...broadcastEmphasisRef.current,
              phase: "ARCHIVED"
            };
            setGreenRoomLive((p) => (p?.traceId === gr.traceId ? { ...p, phase: "ARCHIVED" } : p));
          }, 150_000);
          flowTimersRef.current.push(tCool, tArch);
          uiStore.dispatch({
            type: "ADD_LOG",
            payload: {
              ts: new Date().toLocaleTimeString(),
              type: "SYS",
              data: `BROADCAST_ROUTED → GreenRoom · ${gr.traceId}`
            }
          });
        } catch (err) {
          setGreenRoomLive(null);
          broadcastEmphasisRef.current = {
            active: false,
            until: 0,
            traceId: null,
            phase: null,
            joinPresenceUntil: 0
          };
          uiStore.dispatch({
            type: "ADD_LOG",
            payload: {
              ts: new Date().toLocaleTimeString(),
              type: "WARN",
              data: `GreenRoom route skipped: ${String(err?.message || err)}`
            }
          });
        }
      }

      setEventPreview((prev) => ({
        ...(prev || {}),
        status: "EVENT CREATED",
        type: isBroadcastIntent ? "Live Broadcast (GreenRoom)" : "Rhizoh Live Response",
        location: spec.name,
        confidence: out.source === "remote-llm" ? 0.95 : 0.75,
        risk: out.source === "remote-llm" ? "Low" : "Medium",
        eventId: `EVT-${Date.now().toString(36).toUpperCase()}`,
        traceId
      }));
      setDemoLoopState("CREATED");
    } catch (err) {
      const detail = String(err?.message || err || "bilinmeyen hata");
      setRhizohFieldState("DEGRADED");
      setGovernanceState("DEGRADED");
      setEventPreview((prev) => ({
        ...(prev || {}),
        status: "FAILED",
        confidence: 0.3,
        risk: "High"
      }));
      const clipped = detail.length > 220 ? `${detail.slice(0, 220)}…` : detail;
      setRhizohInlineError({
        title: "Rhizoh bu komutu işleyemedi",
        detail: `${clipped} Bağlantı veya oturum sorunu olabilir; birkaç saniye sonra tekrar deneyin.`
      });
      try {
        const diag = window.__CASTLE_RHIZOH_LLM_DIAG__;
        if (diag && typeof diag === "object") {
          console.info("[Rhizoh LLM diag]", diag.endpoint, diag.message);
        }
      } catch {
        /* noop */
      }
      setRhizohMainHudReply({
        text: `Yanıt üretilemedi: ${clipped}. Ağ geçidi (üst durum) ve konsoldaki [Rhizoh LLM diag] satırına bakın.`,
        source: "error",
        at: Date.now()
      });
      speakRhizoh("Rhizoh canlı hatta yanıt üretemedi. Lütfen tekrar dene.");
    } finally {
      setRhizohFieldState("IDLE");
      setRealityState("WORLD_STABLE");
    }
    setCmd("");
  };

  const handleDemoAction = async (action) => {
    if (action === "replay") {
      if (!eventPreview && !greenRoomLive) return;
      speakRhizoh("Bu anı yeniden yaşıyoruz.");
      setReplayTimelinePct(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setReplayTimelinePct(100));
      });
      if (greenRoomLive?.replayPath) {
        const rp = String(greenRoomLive.replayPath);
        if (rp.startsWith("/")) navigate(rp);
        else window.location.assign(rp);
      }
    } else if (!eventPreview) return;
    if (action === "publish") {
      setEventPreview((prev) => (prev ? { ...prev, status: "EVENT PUBLISHED" } : prev));
      setDemoLoopState("PUBLISHED");
      setShowClosureMoment(true);
      window.setTimeout(() => setShowClosureMoment(false), 2000);
      return;
    }
    if (action === "replay") {
      setEventPreview((prev) =>
        prev
          ? { ...prev, status: "REPLAY READY" }
          : greenRoomLive
            ? {
                status: "REPLAY READY",
                type: "Live Broadcast (GreenRoom)",
                traceId: greenRoomLive.traceId,
                confidence: 0.9,
                risk: "Low"
              }
            : prev
      );
      setReplayMoments([
        "Intent received",
        "Routing selected",
        "World output committed"
      ]);
      setShowReplayGhostTrails(true);
      window.setTimeout(() => {
        setShowReplayGhostTrails(false);
        setReplayTimelinePct(0);
      }, 8500);
      setRealityState("WORLD_TRANSITION");
      window.setTimeout(() => setRealityState("WORLD_STABLE"), 1200);
      setDemoLoopState("REPLAYED");
      return;
    }
    if (action === "share") {
      const shareText = buildShareArtifact(
        eventPreview || {
          type: greenRoomLive?.title || "Live Broadcast",
          status: "LIVE",
          traceId: greenRoomLive?.traceId
        }
      );
      try {
        if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(shareText);
        uiStore.dispatch({
          type: "ADD_LOG",
          payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `SHARE READY · ${shareText}` }
        });
      } catch {
        uiStore.dispatch({
          type: "ADD_LOG",
          payload: { ts: new Date().toLocaleTimeString(), type: "WARN", data: "SHARE FAILED · clipboard unavailable" }
        });
      }
      setDemoLoopState("SHARED");
      return;
    }
    if (action === "modify") {
      setRhizohFieldState("LISTENING");
      setCmd(lastIntentRaw);
      return;
    }
    if (action === "view") {
      setShowWhy(false);
      setRealityState("WORLD_STABLE");
    }
  };

  useEffect(() => {
    const phase = cinematicOutput.phase;
    if (!phase) return;
    if (!voicedPhasesRef.current.has(phase) && cinematicOutput.voiceLine) {
      speakRhizoh(cinematicOutput.voiceLine);
      voicedPhasesRef.current.add(phase);
    }
    if (cinematicOutput.cameraDirective === "HUMAN_CENTER_ANCHOR") {
      engineRef.current?.setCameraMode("DRONE");
      engineRef.current?.focusCastleBeacon();
    } else if (cinematicOutput.cameraDirective === "HERO_FOCUS") {
      engineRef.current?.focusNextAgent();
    }
    if (phase === "WORLD_PULSE") {
      engineRef.current?.setCameraMode("ORBIT");
      if (cinematicOutput.cameraDirective === "ORBIT_CITY_WIDE") {
        engineRef.current?.focusCastleBeacon?.();
      }
    } else if (phase === "ANCHOR_REVEAL") {
      engineRef.current?.setCameraMode("DRONE");
      engineRef.current?.focusCastleBeacon();
    } else if (phase === "VOICE_INVITE") {
      engineRef.current?.focusNextAgent();
    }
  }, [cinematicOutput, speakRhizoh]);

  useEffect(() => {
    if (!cinematicOutput.launch?.oneShotSwarmIgnite || launchSwarmIgniteDoneRef.current) return;
    launchSwarmIgniteDoneRef.current = true;
    coreWorld.swarmActive = true;
    uiStore.dispatch({ type: "SET_SWARM_ACTIVE", payload: true });
  }, [cinematicOutput.launch]);

  useEffect(() => {
    if (!booted) return;
    try {
      bootLogRef.current?.ok?.("app.engine.ready", "Apex engine + world loop active");
    } catch {
      /* noop */
    }
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      const c = window.__CASTLE_CESIUM__;
      if (c?.flyToIstanbul) {
        c.flyToIstanbul();
        window.clearInterval(id);
      } else if (tries > 40) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [booted]);

  useEffect(() => {
    const phase = String(gatewayUx.phase || "");
    if (!phase) return;
    try {
      if (phase === "connected") bootLogRef.current?.ok?.("app.gateway.connected", "Rhizoh gateway online");
      else if (phase === "degraded" || phase === "degraded_llm" || phase === "degraded_storage")
        bootLogRef.current?.warn?.("app.gateway.degraded", phase);
      else if (phase === "offline" || phase === "offline_dns") bootLogRef.current?.warn?.("app.gateway.offline", phase);
    } catch {
      /* noop */
    }
  }, [gatewayUx.phase]);

  useEffect(() => {
    const snap = ensureVoiceAdapterRegistered();
    const adapters = getRhizohInputAdaptersV0();
    try {
      if (adapters.voice && !snap.fallbackMode) {
        bootLogRef.current?.ok?.(
          "app.voice.adapter",
          `registered provider=${snap.sttProvider} status=${snap.sttStatus}`
        );
      } else {
        bootLogRef.current?.warn?.("app.voice.adapter", "missing — text input fallback active");
        fallbackToTextInput("boot_no_adapter");
      }
    } catch {
      /* noop */
    }
  }, [fallbackToTextInput]);

  useEffect(() => {
    if (!voiceReady) return;
    try {
      bootLogRef.current?.ok?.("app.voice.ready", "speech synthesis initialized");
    } catch {
      /* noop */
    }
  }, [voiceReady]);

  useEffect(() => {
    if (!voiceNetworkBlocked) return;
    try {
      bootLogRef.current?.warn?.("app.voice.network", "browser speech recognition unavailable");
    } catch {
      /* noop */
    }
  }, [voiceNetworkBlocked]);

  useEffect(() => {
    if (!voiceLoopEnabled) return;
    const id = window.setInterval(() => {
      if (!voiceTurnBusyRef.current || !voiceTurnBusySinceRef.current) return;
      if (Date.now() - voiceTurnBusySinceRef.current < VOICE_TURN_BUSY_WATCHDOG_MS) return;
      console.warn("[VOICE_WATCHDOG] turn busy timeout — releasing mic loop");
      voiceTurnBusyRef.current = false;
      voiceTurnBusySinceRef.current = 0;
      setRhizohFieldState("IDLE");
      finishVoiceTurnIfNeeded();
    }, 2500);
    return () => window.clearInterval(id);
  }, [voiceLoopEnabled, finishVoiceTurnIfNeeded]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden" && voiceLoopEnabledRef.current) {
        stopVoiceLoop();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [stopVoiceLoop]);

  useEffect(() => {
    if (!rhizohInlineError) return;
    const t = window.setTimeout(() => setRhizohInlineError(null), 12_000);
    return () => window.clearTimeout(t);
  }, [rhizohInlineError]);

  return (
    <div className="min-h-screen w-full bg-[#010103] text-white font-mono overflow-x-hidden overflow-y-auto relative select-none uppercase font-black selection:bg-cyan-400/40">
      <RhizohEpistemicWorldGravity
        layerFocus={epistemicOrbLayerFocus}
        governanceStress={epistemicGovStress}
      >
        <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />
        <CesiumRealMapLayer active={mapSurfaceActive} />
      </RhizohEpistemicWorldGravity>
      <div className="absolute inset-0 z-[5] pointer-events-none">
        
        <SwarmCollectiveAuraV1 collectiveField={visualCognitionState.collectiveField} className="z-[1]" />
        <div className={`absolute inset-0 bg-gradient-to-br ${governanceFx.tone}`} />
        <div
          className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: Math.min(0.35 + visualCognitionState.swarmField.intensity * 0.5, 0.95) }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-[min(72vw,520px)] w-[min(72vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, rgba(34,211,238,0.12) 60deg, transparent 120deg, rgba(168,85,247,0.08) 200deg, transparent 280deg)`,
              animation: "spin 28s linear infinite"
            }}
          />
          <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <div className={`h-32 w-32 rounded-full border-2 ${governanceFx.orb === "crystal" ? "border-red-300/70" : governanceFx.orb === "tense" ? "border-amber-300/60" : "border-cyan-300/70"} animate-pulse shadow-[0_0_60px_rgba(34,211,238,0.35)]`} />
            <div className="absolute inset-[-28px] rounded-full border border-cyan-200/25 animate-ping" />
            <div className="absolute inset-[-48px] rounded-full border border-fuchsia-400/10" />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[5.5rem] text-[9px] tracking-[0.2em] text-cyan-200/80 normal-case whitespace-nowrap">
            {entityCount} field pulses · swarm {visualCognitionState.swarmField.level}
          </div>
        </div>
        {showReplayGhostTrails || replayTimelinePct > 0 ? (
          <div className="absolute inset-x-10 bottom-28 z-[6] flex flex-col gap-2">
            <div className="h-1.5 w-full max-w-md mx-auto rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400/30 via-cyan-300/90 to-fuchsia-400/50 transition-[width] duration-500 ease-out"
                style={{ width: `${replayTimelinePct}%` }}
              />
            </div>
            {showReplayGhostTrails ? (
              <div className="h-14 rounded-full border border-cyan-200/25 bg-cyan-300/5 animate-pulse">
                <div className="h-full w-full bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent animate-pulse" />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <UnifiedProductShellBar active={productSurface} onSelect={onProductShellSelect} />

      {immersiveLiveTrace ? (
        <div className="pointer-events-auto fixed bottom-[5.25rem] left-1/2 z-[58] flex max-w-[95vw] -translate-x-1/2 items-center gap-3 rounded-full border border-fuchsia-400/45 bg-black/75 px-4 py-2 text-[9px] text-fuchsia-100/95 shadow-[0_0_24px_rgba(192,38,211,0.2)] normal-case">
          <span className="tracking-wide">Live room · {immersiveLiveTrace.slice(0, 20)}…</span>
          <button
            type="button"
            className="rounded-full border border-white/25 px-3 py-1 text-[9px] text-white/90 hover:bg-white/10"
            onClick={() => {
              setImmersiveLiveTrace(null);
              broadcastEmphasisRef.current = {
                ...broadcastEmphasisRef.current,
                joinPresenceUntil: 0
              };
              navigate("/", { replace: true });
            }}
          >
            Exit room
          </button>
        </div>
      ) : null}

      <div className="absolute inset-0 z-10 pointer-events-none flex min-h-full flex-col p-4 md:p-5">
        <div className="flex shrink-0 justify-end items-start gap-3">
          {!immersiveLiveTrace ? (
            <div className="pointer-events-auto mr-auto" />
          ) : (
            <div className="pointer-events-auto mr-auto rounded-2xl border border-fuchsia-400/35 bg-black/55 px-3 py-2 text-[9px] text-fuchsia-100/90 normal-case backdrop-blur-md">
              Immersive broadcast · world synced to anchor
            </div>
          )}
          <div className="pointer-events-auto flex max-w-[18rem] flex-col gap-2">
            {(location.pathname === "/" || location.pathname === "") ? (
              <Link
                to="/academy/observe"
                className="rounded-2xl border border-emerald-400/35 bg-emerald-950/25 p-3 backdrop-blur-md transition-colors hover:border-emerald-300/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-200/95">Live system</span>
                  <span className="flex items-center gap-1.5 text-[8px] font-semibold text-emerald-100/90 normal-case">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]" />
                    SSE path live
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-white/90 normal-case">Temporal stream · replay lab</div>
                <div className="mt-1 text-[9px] text-white/55 normal-case leading-relaxed">
                  Gateway-only observability — EventSource continuity, fingerprint, evolution panels.
                </div>
                <span className="mt-2 inline-block text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200/90 underline-offset-2">
                  Open Observe →
                </span>
              </Link>
            ) : null}
            <CastleAccountBadge auth={castleAuth} />
            <div className="rounded-2xl border border-indigo-300/35 bg-indigo-300/15 p-3 backdrop-blur-md">
              <div className="text-[10px] tracking-wide text-indigo-100 normal-case leading-relaxed whitespace-pre-wrap">
                {welcomeCard.primary}
              </div>
              <div className="mt-1.5 text-[10px] text-white/85 normal-case">
                {welcomeCard.secondary}
              </div>
              <div className="mt-1 text-[10px] text-cyan-200/90 normal-case">
                Istanbul anchor live — speak or type to shape it.
              </div>
              <button
                type="button"
                onClick={() => setShowDetailDrawer((v) => !v)}
                className="mt-2 w-full rounded-xl border border-white/15 py-1.5 text-[9px] tracking-[0.12em] text-white/70"
              >
                {showDetailDrawer ? "Close details" : "More · agents · events · share"}
              </button>
            </div>
          </div>
        </div>

        {showDetailDrawer ? (
          <div className="pointer-events-auto fixed inset-y-0 right-0 z-[55] w-full max-w-md border-l border-cyan-400/25 bg-[#050a14]/95 p-4 shadow-2xl backdrop-blur-xl overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.2em] text-cyan-200">DETAILS · {CASTLE_RUNTIME_VERSION}</span>
              <button type="button" onClick={() => setShowDetailDrawer(false)} className="text-[10px] text-white/50">
                ✕
              </button>
            </div>
            <div className="mb-4">
              {rhizohConversationUx.surfaces.intentRoutingFull ? (
                <L10Observatory
                  socialRegistry={drawerSocialRegistry}
                  truthIntervalMs={320}
                  mode="greenroom"
                  userAgentSubjectThreadId={pickPrimaryCognitiveThreadId(drawerSocialRegistry)}
                />
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-[9px] normal-case text-white/55 leading-relaxed">
                  Gözlemevi henüz kapalı — güven fazına gelince niyet omurgası görünür.
                </div>
              )}
            </div>
            <div className="mb-3 flex gap-0.5 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-0.5 no-scrollbar">
              {[
                { id: "chat", label: "CHAT" },
                { id: "explore", label: "EXPLORE" },
                { id: "build", label: "BUILD" },
                { id: "analyze", label: "ANALYZE" },
                { id: "sovereign", label: "SOVEREIGN" }
              ].map((t) => {
                const kernelLocked = t.id === "analyze" && !rhizohConversationUx.surfaces.kernelHeavyPanels;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={kernelLocked}
                    title={kernelLocked ? "Tam sohbet bandında açılır" : undefined}
                    onClick={() => {
                      if (kernelLocked) return;
                      setDrawerStudioTab(t.id);
                    }}
                    className={`min-w-[4.5rem] flex-1 shrink-0 rounded-md py-2 text-[8px] font-black tracking-[0.16em] transition-colors sm:text-[9px] sm:tracking-[0.2em] ${
                      drawerStudioTab === t.id
                        ? "bg-cyan-500/25 text-cyan-100 border border-cyan-400/35"
                        : kernelLocked
                          ? "text-white/25 border border-transparent cursor-not-allowed opacity-60"
                          : "text-white/45 hover:text-white/70 border border-transparent"
                    }`}
                  >
                    {t.label}
                    {kernelLocked ? " · ○" : ""}
                  </button>
                );
              })}
            </div>
            {drawerStudioTab === "chat" ? <ProductProfilePanel auth={castleAuth} /> : null}
            {drawerStudioTab === "explore" ? <WorldLivingMapPanel /> : null}
            {drawerStudioTab === "build" ? <DirectorDeckPanel /> : null}
            {drawerStudioTab === "analyze" ? (
              rhizohConversationUx.surfaces.kernelHeavyPanels ? (
                <KernelConsolePanel />
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-4 text-[10px] normal-case text-white/55 leading-relaxed">
                  KERNEL konsolu bu evrede kilitli. Bond ve tur sayısı arttıkça “Tam sohbet” bandında açılır — üstteki
                  deneyim şeridinde ilerlemeyi görebilirsin.
                </div>
              )
            ) : null}
            {drawerStudioTab === "sovereign" ? (
              <div className="mt-4">
                <SovereignCastleCommandPanel
                  engineRef={engineRef}
                  currentUserId={castleAuth.user?.uid || getOrCreateCastleDevUid()}
                  rhizohFirstName={rhizohFirstName}
                  remoteCastles={remoteCastles}
                  bridgeRegistryReady={bridgeRegistryReady}
                  onInitiateMirrorBridge={initiateMirrorBridge}
                  onCastleLifecycleChange={handleCastleLifecycle}
                  onOpenRhizohKernelDrawer={() => setShowDetailDrawer(true)}
                />
              </div>
            ) : null}
            {drawerStudioTab === "chat" ||
            (drawerStudioTab === "analyze" && rhizohConversationUx.surfaces.kernelHeavyPanels) ? (
              <div className="mt-3">
                <RuntimeHealthPanel health={runtimeHealth} gatewayBaseUrl={infraGatewayBaseUrl} />
              </div>
            ) : null}
            {rhizohConversationUx.surfaces.epistemicHeavyHud ? (
              <div className="mt-3 mb-2">
                <RhizohEpistemicOrb
                  gatewayPhase={gatewayUx.phase}
                  uiEnv={epistemicOrbUiEnv}
                  firebaseUid={castleAuth.user?.uid || null}
                  hydrateFromDisk={hydrateEpistemicOrbFromDisk}
                />
              </div>
            ) : (
              <div className="mt-3 mb-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-[9px] normal-case text-white/50 leading-relaxed">
                Epistemik küre · tam sohbet bandında görünür.
              </div>
            )}
            <RhizohCommsPanel
              engineRef={engineRef}
              selectedConnectionId=""
              selectedAgentId=""
              gatewayModel={gatewayUx}
              onGatewayRetry={gatewayUx.retry}
              hasHttpOrigin={hasRhizohHttpOrigin}
              castleAuth={castleAuth}
              continuityBuilder={buildContinuityPayload}
              socialFieldPreview={drawerSocialField}
              onPersistRhizohTurn={persistContinuityTurn}
              socialRegistryPreview={drawerSocialRegistry}
              browserPresenceRef={browserPresenceRef}
              remoteAgentActivity={{ active: liveAgents.length > 0, count: liveAgents.length }}
              productDecisionOverlayRef={rhizohProductDecisionOverlayRef}
              rhizohGenerationMode={rhizohGenerationMode}
            />
            <div className="space-y-3 text-[10px] text-white/75 normal-case mt-4">
              <div>
                <div className="text-white/40 mb-1">Agents</div>
                {relationalPresenceState.agentAttentionMap.map((entry) => (
                  <div key={entry.agentId}>{entry.message}</div>
                ))}
              </div>
              <div>
                <div className="text-white/40 mb-1">Live Agent Projection</div>
                <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
                  {liveAgents.slice(0, 10).map((a) => (
                    <div key={a.id} className="rounded-lg border border-white/10 bg-black/20 px-2 py-1">
                      <span className="text-cyan-200">{a.id}</span>
                      <span className="text-white/50"> · L{a.level} · E{a.energy} · {a.lat.toFixed(4)}, {a.lon.toFixed(4)}</span>
                    </div>
                  ))}
                  {!liveAgents.length ? <div className="text-white/45">Henüz görünür ajan yok.</div> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {heroAgentLabels.map((name) => (
                  <span key={name} className="rounded-full border border-white/15 px-2 py-0.5 text-[9px]">
                    {name}
                  </span>
                ))}
              </div>
              <div className="text-white/55">
                Last created: {relationalPresenceState.sessionContinuity.lastCreated} · Preference: {relationalPresenceState.sessionContinuity.preference}
              </div>
            </div>
            {greenRoomLive ? (
              <div className="mt-4 rounded-2xl border border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-950/50 to-black/60 p-4 shadow-[0_0_40px_rgba(217,70,239,0.12)]">
                <div className="text-[10px] tracking-[0.35em] text-fuchsia-200/95 mb-2">LIVE NOW</div>
                <div className="h-px bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent mb-3" />
                <div className="text-[12px] text-white font-medium normal-case leading-snug">{greenRoomLive.title}</div>
                <div className="mt-2 grid gap-1.5 text-[10px] text-white/75 normal-case">
                  <div>
                    Status:{" "}
                    <span className="text-fuchsia-200/95 font-semibold">
                      {greenRoomLive.phase === "ROUTING"
                        ? "ROUTING"
                        : greenRoomLive.phase === "LIVE"
                          ? "LIVE"
                          : greenRoomLive.phase === "COOLDOWN"
                            ? "COOLDOWN"
                            : "ARCHIVED"}
                    </span>
                  </div>
                  <div>
                    Elapsed:{" "}
                    <span className="text-cyan-200/90 font-mono">{formatGreenRoomElapsed(greenRoomElapsedSec)}</span>
                  </div>
                  <div>
                    Audience:{" "}
                    <span className="text-fuchsia-200/90">
                      {greenRoomAudienceNow} watching
                    </span>
                  </div>
                  <div>
                    Signal:{" "}
                    <span className="text-emerald-200/85">{audienceSignalLabel(greenRoomAudienceNow)}</span>
                  </div>
                  <div>
                    Replay:{" "}
                    {greenRoomLive.replayReady ? (
                      <span className="text-emerald-200/90">available</span>
                    ) : (
                      <span className="text-amber-200/80">preparing</span>
                    )}
                  </div>
                  <div>
                    Trace: <span className="text-cyan-200/90 font-mono text-[9px]">{greenRoomLive.traceId}</span>
                  </div>
                  {greenRoomLive.ack ? (
                    <div>
                      Route ack: <span className="text-emerald-200/85 font-mono text-[9px]">{greenRoomLive.ack}</span>
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[9px] text-fuchsia-300/70">
                  <span className="shrink-0">Field</span>
                  <AudienceSparkline key={sparklineVersion} values={[...greenRoomSparklineRef.current]} />
                </div>
                {greenRoomLive.phase === "LIVE" && liveReactionToast ? (
                  <div
                    key={liveReactionToast.id}
                    className="castle-live-reaction-toast mt-2 rounded-lg border border-fuchsia-400/20 bg-fuchsia-950/40 px-2 py-1.5 text-center text-[9px] text-fuchsia-100/95 normal-case"
                  >
                    {liveReactionToast.text}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-300/40 bg-emerald-500/15 px-3 py-1.5 text-[10px] text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40"
                    disabled={!greenRoomLive.replayReady}
                    onClick={() => handleDemoAction("replay")}
                  >
                    Open replay
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-fuchsia-300/45 bg-fuchsia-500/15 px-3 py-1.5 text-[10px] text-fuchsia-100 hover:bg-fuchsia-500/25"
                    onClick={() => {
                      if (!greenRoomLive.traceId) return;
                      applyBroadcastPresence(greenRoomLive.traceId);
                      const id = encodeURIComponent(greenRoomLive.traceId);
                      navigate(`/greenroom/live/${id}`);
                      uiStore.dispatch({
                        type: "ADD_LOG",
                        payload: {
                          ts: new Date().toLocaleTimeString(),
                          type: "SYS",
                          data: `ENTER LIVE ROOM · /greenroom/live/${greenRoomLive.traceId}`
                        }
                      });
                    }}
                  >
                    Enter live room
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-[10px] text-white/90 hover:bg-white/10"
                    onClick={() => handleDemoAction("share")}
                  >
                    Share
                  </button>
                </div>
                {greenRoomLive.memorySealed ? (
                  <div
                    key={`seal-${sealBurstNonce}`}
                    className="castle-seal-burst mt-3 rounded-lg border border-cyan-400/25 bg-cyan-950/30 px-2 py-1.5 text-[9px] text-cyan-100/90 normal-case"
                  >
                    <div className="text-white/50 text-[8px] tracking-[0.15em] mb-0.5">CASTLE LIBRARY</div>
                    Committed to Castle Library · <span className="text-emerald-300/95">Memory sealed ✓</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="mt-4 rounded-2xl border border-cyan-300/30 bg-[#070d20]/80 p-4">
              <div className="text-[10px] tracking-[0.3em] text-cyan-200/80 mb-2">EVENT PREVIEW</div>
              <div className="text-[11px] text-white/80 normal-case">
                {eventPreview?.status ?? "Awaiting intent"}
              </div>
              <div className="text-[10px] text-white/60 mt-3 normal-case">
                Type: {eventPreview?.type ?? "N/A"}
              </div>
              <div className="text-[10px] text-white/60 normal-case">
                Location: {eventPreview?.location ?? "N/A"}
              </div>
              <div className="text-[10px] text-white/60 normal-case">
                Confidence: {eventPreview?.confidence ?? "N/A"} · Risk: {eventPreview?.risk ?? "N/A"}
              </div>
              <div className="text-[10px] text-emerald-200/90 normal-case">
                System confidence: {eventPreview?.confidence ? (eventPreview.confidence >= 0.9 ? "High" : "Moderate") : "Pending"} · Governance {governanceState}
              </div>
              <div className="text-[10px] text-white/60 normal-case">
                Event: {eventPreview?.eventId ?? "pending"} · Trace: {eventPreview?.traceId ?? "pending"}
              </div>
              {showClosureMoment && eventPreview?.traceId ? (
                <div className="mt-3 rounded-2xl border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 animate-pulse">
                  <div className="text-[10px] text-emerald-200 tracking-[0.1em]">SYSTEM COMPLETED LOOP</div>
                  <div className="text-[10px] text-emerald-100/90 normal-case">Trace highlighted: {eventPreview.traceId}</div>
                </div>
              ) : null}
              <div className="text-[10px] text-white/50 mt-3">Active Entities: {entityCount}</div>
              <div className="text-[10px] text-cyan-200/80 mt-1">Demo Loop: {demoLoopState}</div>
              <button
                type="button"
                onClick={() => setShowWhy((prev) => !prev)}
                className="mt-4 w-full rounded-2xl border border-cyan-300/30 bg-cyan-300/10 py-2 text-[10px] tracking-[0.2em] text-cyan-200"
              >
                WHY THIS HAPPENED?
              </button>
              {showWhy ? (
                <div className="mt-3 space-y-1 text-[10px] text-white/70 normal-case">
                  <div className="text-emerald-200/90">Decision was auto-routed by healthy capacity + low risk profile.</div>
                  <div className="text-indigo-200/90">Light route committed: knowledge → map → camera → voice → memory → artifact.</div>
                  <div className="text-cyan-200/90">
                    Breadcrumbs: {visualCognitionState.explainabilityBreadcrumbs.path.slice(0, 2).join(" -> ") || "awaiting path"}
                  </div>
                  {lastWhy.map((item) => (
                    <div key={item}>- {item}</div>
                  ))}
                </div>
              ) : null}
              {demoLoopState === "REPLAYED" && replayMoments.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/5 p-3">
                  <div className="text-[10px] text-cyan-200 tracking-[0.12em] mb-2">REPLAY MICRO-TIMELINE</div>
                  <div className="space-y-1 text-[10px] text-white/75 normal-case">
                    {replayMoments.map((step, idx) => (
                      <div key={step}>{idx + 1}. {step}</div>
                    ))}
                  </div>
                </div>
              ) : null}
              {eventPreview?.status === "EVENT CREATED" || demoLoopState === "PUBLISHED" ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => handleDemoAction("view")} className="rounded-xl border border-white/15 py-2 text-[10px]">View</button>
                  <button type="button" onClick={() => handleDemoAction("modify")} className="rounded-xl border border-white/15 py-2 text-[10px]">Modify</button>
                  <button type="button" onClick={() => handleDemoAction("publish")} className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 py-2 text-[10px]">Publish</button>
                  <button type="button" onClick={() => handleDemoAction("replay")} className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 py-2 text-[10px]">Replay</button>
                  <button type="button" onClick={() => handleDemoAction("share")} className="col-span-2 rounded-xl border border-amber-300/30 bg-amber-300/10 py-2 text-[10px]">Share</button>
                </div>
              ) : null}
              {eventPreview?.traceId ? (
                <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-3">
                  <div className="text-[10px] text-amber-200 tracking-[0.1em] mb-2">SHARE ARTIFACT</div>
                  <pre className="text-[9px] text-white/70 normal-case whitespace-pre-wrap">{buildShareArtifact(eventPreview)}</pre>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex w-full shrink-0 flex-col gap-1">
        <RhizohCapabilityHaloV1
          className="pointer-events-auto z-[12] mb-1"
          collectivePulse={visualCognitionState.collectiveField?.density ?? 0.4}
          onSeedIntent={(s) => {
            setCmd(s);
            setRhizohFieldState("LISTENING");
          }}
          onFocusLayer={(id) => {
            uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: id });
          }}
          onOpenHref={(href) => {
            if (href === CASTLE_RHIZOH_KERNEL_DRAWER_HREF) {
              navigate("/studio");
              return;
            }
            if (typeof href === "string" && href.startsWith("/")) {
              navigate(href);
              return;
            }
            if (/^https?:\/\//i.test(String(href))) {
              window.open(href, "_blank", "noopener,noreferrer");
            }
          }}
          onOpenRealMap={() => {
            void setRealityMode("REAL_MAP", { source: "RHIZOH" });
          }}
        />

        <div className="pointer-events-auto mb-3 flex flex-wrap items-center justify-center gap-2 px-2">
          {[
            { label: "Studio", path: "/studio", tone: "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" },
            { label: "GreenRoom", path: "/greenroom/main", tone: "border-amber-400/40 bg-amber-500/10 text-amber-100" }
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => navigate(p.path)}
              className={`rounded-full border px-4 py-2 text-[10px] tracking-[0.12em] ${p.tone}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-6 px-2">
          <div className="w-full max-w-6xl bg-[#0a1b3a]/85 border border-cyan-400/40 p-3 sm:p-4 rounded-[2rem] flex flex-col gap-3 shadow-[0_0_80px_rgba(0,255,255,0.12)] backdrop-blur-xl ring-1 ring-white/5 pointer-events-auto">
            {showTrustBlurb ? (
              <div className="mx-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 normal-case">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.2em] text-cyan-200/90">BU UYGULAMA NE YAPAR?</div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-white/80 max-w-prose">
                      Rhizoh Genesis: yazı veya sesle 3B şehir ve swarm alanını yönlendirir; isteğe bağlı uzak LLM ve canlı yayın (GreenRoom)
                      hattına bağlanır. Kimlik ve oturum Firebase üzerindedir; üretken model çağrıları yalnızca yapılandırdığınız HTTPS uç
                      noktasına gider (ör. barındırmada <span className="text-cyan-200/90">/api/rhizoh</span>).
                    </p>
                    <p className="mt-1 text-[9px] text-white/55">
                      Tarayıcı konsolundaki teknik hatalar gizlenmez; bağlantı durumu bu kartın üstünde canlı güncellenir. Veri akışı yoksa yerel
                      demo yanıtları kullanılır — süreklilik belleği sınırlı kalır.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTrustBlurb(false)}
                    className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-[9px] text-white/65 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1b3a]"
                  >
                    Gizle
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTrustBlurb(true)}
                className="mx-1 text-left text-[9px] text-cyan-300/75 hover:text-cyan-200 normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-1"
              >
                Uygulama özeti ve gizlilik notunu göster
              </button>
            )}

            <RhizohGatewayBanner
              model={gatewayUx}
              onRetry={gatewayUx.retry}
              hasHttpOrigin={hasRhizohHttpOrigin}
              conversationPhaseLabel={rhizohConversationUx.label}
              className="mx-1"
            />
            <RhizohExperienceRibbon
              phaseLabel={rhizohConversationUx.label}
              story={rhizohConversationUx.story}
              goals={rhizohConversationUx.goals}
              capabilityRows={rhizohConversationUx.capabilityRows}
              userGoalHint={rhizohConversationUx.userGoalHint}
              closure={rhizohClosureBanner}
              recentClosureMilestones={rhizohConversationUx.closureMilestonesPreview}
              className="mx-1 mt-2"
            />

            <div className="mx-1 mt-2 rounded-2xl border border-cyan-400/25 bg-[#061028]/90 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 normal-case">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <label htmlFor="castle-rhizoh-generation-mode" className="text-[9px] text-cyan-200/90 shrink-0 whitespace-nowrap">
                  Sohbet derinliği
                </label>
                <select
                  id="castle-rhizoh-generation-mode"
                  value={rhizohGenerationMode}
                  onChange={(e) => setRhizohGenerationMode(e.target.value)}
                  className="rounded-lg border border-white/20 bg-black/40 px-2 py-1.5 text-[10px] text-white/90 max-w-[min(100%,18rem)] sm:max-w-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  {RHIZOH_GENERATION_MODE_UI.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} — {m.sub} (~{RHIZOH_GENERATION_MODE_MAX[m.id]} tok)
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[9px] text-white/65 sm:ml-auto sm:text-right leading-snug">
                <span className={runtimeHealth.gatewayConnected ? "text-emerald-300/95" : "text-amber-200/90"}>
                  Geçit: {runtimeHealth.gatewayConnected ? "canlı" : gatewayUx.phase}
                </span>
                {" · "}
                <span className={hasRhizohHttpOrigin ? "text-cyan-200/85" : "text-amber-200/80"}>
                  {hasRhizohHttpOrigin ? `LLM: ${rhizohLlmHostLabel}` : "LLM URL yapılandırın (VITE_*)"}
                </span>
              </div>
            </div>

            <div className="mx-1 rounded-2xl border border-emerald-400/25 bg-emerald-950/25 px-4 py-3 normal-case">
              <div className="text-[9px] font-bold tracking-[0.25em] text-emerald-200/90 mb-2">HIZLI BAŞLANGIÇ</div>
              <ol className="grid sm:grid-cols-2 gap-2 text-[10px] text-white/80 list-decimal list-inside marker:text-emerald-400/80">
                <li className={gatewayLinkSettled ? "text-emerald-100" : ""}>
                  Bağlantı durumu: {gatewayUx.headline}
                </li>
                <li className={cmd.trim().length > 0 ? "text-emerald-100" : ""}>Örnek metin yazın veya çiplerden seçin</li>
                <li className={hasSentRhizohCommand ? "text-emerald-100" : ""}>
                  <span className="font-semibold">Gönder</span> — Enter veya cyan düğme
                </li>
                <li className={hasReceivedRhizohReply ? "text-emerald-100" : ""}>Yanıt: ses özeti · olay kartı · detay çekmecesi</li>
              </ol>
            </div>

            {rhizohInlineError ? (
              <div role="alert" className="mx-1 rounded-2xl border border-red-400/50 bg-red-950/40 px-4 py-3 normal-case">
                <div className="text-[10px] font-bold text-red-100">{rhizohInlineError.title}</div>
                <div className="mt-1 text-[10px] text-white/90 leading-relaxed">{rhizohInlineError.detail}</div>
                <button
                  type="button"
                  className="mt-2 rounded-lg border border-white/20 px-2 py-1 text-[9px] text-white/85 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  onClick={() => setRhizohInlineError(null)}
                >
                  Bildirimi kapat
                </button>
              </div>
            ) : null}

            {rhizohMainHudReply?.text ? (
              <div
                role="status"
                aria-live="polite"
                className={`mx-1 rounded-2xl border px-4 py-3 normal-case ${
                  rhizohMainHudReply.source === "error"
                    ? "border-amber-400/40 bg-amber-950/30"
                    : "border-emerald-400/35 bg-emerald-950/25"
                }`}
              >
                <div
                  className={`text-[9px] font-bold tracking-wider uppercase ${
                    rhizohMainHudReply.source === "error" ? "text-amber-200/90" : "text-emerald-200/90"
                  }`}
                >
                  Rhizoh yanıtı · {rhizohMainHudReply.source}
                </div>
                <div className="mt-1 text-[11px] text-white/92 leading-relaxed whitespace-pre-wrap">
                  {rhizohMainHudReply.text}
                </div>
                <button
                  type="button"
                  className="mt-2 rounded-lg border border-white/15 px-2 py-1 text-[9px] text-white/75 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  onClick={() => setRhizohMainHudReply(null)}
                >
                  Kapat
                </button>
              </div>
            ) : null}

            {!onboardingDone ? (
              <div className="mx-4 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-[10px] text-emerald-100/90 normal-case">
                Rhizoh seni tanımaya başlıyor.
              </div>
            ) : null}
            {cinematicOutput.showSemanticHints && shouldShowSemanticHintChipsV0() ? (
              <div className="flex flex-wrap gap-2 px-4">
                {["explore", "create", "ask", "build", "join"].map((hint) => (
                  <div
                    key={hint}
                    className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[9px] tracking-[0.1em] text-cyan-100"
                  >
                    {hint}
                  </div>
                ))}
                {firstInteractionIntents.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => {
                      setCmd(seed);
                      setRhizohFieldState("LISTENING");
                    }}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[9px] tracking-[0.08em] text-white/70 normal-case hover:bg-cyan-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    {seed}
                  </button>
                ))}
              </div>
            ) : null}
            {!shouldShowSemanticHintChipsV0() && firstInteractionIntents.length > 0 ? (
              <div className="flex flex-wrap gap-2 px-4">
                {firstInteractionIntents.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => {
                      setCmd(seed);
                      setRhizohFieldState("LISTENING");
                    }}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[9px] tracking-[0.08em] text-white/70 normal-case hover:bg-cyan-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    {seed}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="px-4 sm:px-6 space-y-1 normal-case">
              <label htmlFor="castle-rhizoh-command" className="block text-[10px] font-bold tracking-[0.18em] text-cyan-200/90">
                Mesaj gönder — Rhizoh komut hattı
              </label>
              <p id="castle-rhizoh-command-hint" className="text-[9px] text-white/55 leading-relaxed">
                {shouldShowVerboseCommandHintV0()
                  ? (
                    <>
                      Bağlantı kurulmadan da gönderebilirsiniz: yerel demo yanıtı üretilir. Uzak model ve süreklilik için yapılandırılmış{" "}
                      <span className="text-cyan-200/85">HTTPS + /health</span> sunucusu gerekir.
                    </>
                  )
                  : resolveCommandHintV0()}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
              <button
                type="button"
                onClick={() => {
                  if (voiceLoopEnabled) {
                    stopVoiceLoop();
                  } else {
                    startVoiceLoop();
                  }
                }}
                aria-label={voiceLoopEnabled ? "Sürekli dinlemeyi kapat" : "Sürekli dinlemeyi başlat"}
                aria-pressed={voiceLoopEnabled}
                title={voiceLoopEnabled ? "Dinlemeyi durdur" : "Sesli sohbet — mikrofonu aç"}
                className={`mx-4 sm:ml-6 sm:mr-0 p-5 sm:p-6 hover:bg-cyan-400/20 rounded-full text-cyan-400 transition-all active:scale-90 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${voiceLoopEnabled || cinematicOutput.showMicPulse ? "ring-2 ring-emerald-400/50" : ""} ${micListening ? "animate-pulse" : ""}`}
              >
                <Mic size={32} aria-hidden />
              </button>
              {rhizohFieldState === "SPEAKING" ? (
                <div className="mx-2 rounded-lg border border-violet-400/30 bg-violet-950/30 px-2 py-1 text-[9px] text-violet-100/90 normal-case max-w-[12rem] sm:max-w-xs">
                  Rhizoh konuşuyor…
                </div>
              ) : rhizohFieldState === "INTERPRETING" && voiceLoopEnabled ? (
                <div className="mx-2 rounded-lg border border-cyan-400/30 bg-cyan-950/30 px-2 py-1 text-[9px] text-cyan-100/90 normal-case max-w-[12rem] sm:max-w-xs">
                  Rhizoh düşünüyor…
                </div>
              ) : null}
              {voiceNetworkBlocked ? (
                <div className="ml-2 rounded-lg border border-amber-300/35 bg-amber-950/30 px-2 py-1 text-[9px] text-amber-100/90 normal-case">
                  Tarayıcı ses tanıma servisi erişilemiyor. Mikrofona izin verip tekrar deneyin; olmazsa yazıyla devam edin.
                </div>
              ) : null}
              <div className="flex-1 px-4 sm:px-8 relative flex items-center min-h-[3rem]">
                <input
                  ref={commandInputRef}
                  id="castle-rhizoh-command"
                  value={cmd}
                  onChange={(e) => setCmd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !rhizohCommandBusy) {
                      e.preventDefault();
                      void handleExecute();
                    }
                  }}
                  autoComplete="off"
                  aria-describedby="castle-rhizoh-command-hint castle-send-status"
                  aria-invalid={!!rhizohInlineError}
                  placeholder={resolveCommandPlaceholderV0({
                    fullPlaceholder: "Ne yaratmak istiyorsunuz? (ör. yarın canlı maç yayını, REAL_MAP, swarm)"
                  })}
                  className="w-full bg-transparent border-none outline-none text-base sm:text-lg font-semibold tracking-wide text-white normal-case placeholder:text-white/40 placeholder:font-medium placeholder:tracking-normal focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded-lg px-1"
                />
              </div>
              <button
                type="button"
                id="castle-rhizoh-send"
                onClick={() => void handleExecute()}
                disabled={rhizohCommandBusy || !cmd.trim()}
                aria-label="Komutu gönder"
                aria-busy={rhizohCommandBusy}
                aria-describedby="castle-send-status"
                title={
                  rhizohCommandBusy
                    ? "Rhizoh işlem yapıyor — bekleyin"
                    : !cmd.trim()
                      ? "Göndermek için önce yazın"
                      : "Komutu Rhizoh’a ilet"
                }
                className={`mx-auto sm:mx-0 sm:mr-4 p-5 sm:p-7 min-w-[4.5rem] bg-cyan-400 rounded-[3.5rem] transition-all text-black shadow-[0_0_60px_rgba(0,255,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1b3a] ${
                  rhizohCommandBusy || !cmd.trim()
                    ? "opacity-45 cursor-not-allowed"
                    : "hover:bg-cyan-300 active:scale-95 group"
                }`}
              >
                <Send size={34} className={rhizohCommandBusy || !cmd.trim() ? "" : "group-hover:scale-110 transition-transform"} aria-hidden />
              </button>
            </div>
            <p id="castle-send-status" className="px-4 sm:px-6 text-[9px] text-white/60 normal-case min-h-[2.5rem]">
              {rhizohCommandBusy
                ? "Rhizoh komutu işliyor — birkaç saniye sürebilir (uzak model zaman aşımı ~55 sn)."
                : voiceNetworkBlocked
                  ? "Mikrofon tarafı şu an tarayıcı servis hatası veriyor (network). Yazıyla göndermeye devam edin veya farklı tarayıcıda mikrofon deneyin."
                : !cmd.trim()
                  ? "Henüz komut yok. Üstteki örnekleri tıklayın veya yazın; Enter ile de gönderebilirsiniz."
                  : "Bağlantı çevrimdışı olsa bile gönderebilirsiniz; yanıt kaynağı üst durum çubuğunda belirtilir."}
            </p>
            {commandLog.length > 0 ? (
              <div className="mx-1 normal-case">
                <button
                  type="button"
                  onClick={() => setShowCommandLog((v) => !v)}
                  className="text-[9px] text-cyan-200/85 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-1"
                >
                  {showCommandLog ? "Komut günlüğünü gizle" : `Komut günlüğü (${commandLog.length}) — göster`}
                </button>
                {showCommandLog ? (
                  <ul
                    className="mt-2 max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-black/35 text-[9px] text-white/75 p-2 space-y-1 no-scrollbar"
                    aria-label="Son gönderilen komutlar"
                  >
                    {commandLog.map((row, i) => (
                      <li key={`${row.ts}-${i}`}>
                        <span className="text-white/45">{new Date(row.ts).toLocaleTimeString()}</span> ·{" "}
                        <span className="text-cyan-200/80">{row.source}</span> · {String(row.raw).slice(0, 140)}
                        {String(row.raw).length > 140 ? "…" : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div className="mx-1 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-[10px] text-white/60 normal-case">
                Henüz ileti yok — ilk komutunuzu yazıp <span className="text-cyan-200/90">Gönder</span> ile iletin.
              </div>
            )}
            <RhizohCohortInspectStrip />
            <RhizohWorldContinuityStrip gatewayPhase={gatewayUx?.phase} />
            
          </div>
        </div>
        </div>
      </div>

      <CastleAuthOverlay auth={castleAuth} />
      <RhizohSceneAnchorWindow />

      {!booted && (
        <div className="pointer-events-none absolute inset-0 z-[5000] bg-[#010103] flex flex-col items-center justify-center px-6">
          <div className="relative mb-20 scale-[2.0]">
            <Atom size={120} className="text-cyan-400 animate-spin opacity-30" aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center">
              <Network size={40} className="text-fuchsia-400 animate-pulse" aria-hidden />
            </div>
          </div>
          <div className="text-4xl font-black tracking-[2em] text-cyan-400/50 ml-[2em] animate-pulse uppercase italic">RHIZOH_Genesis</div>
          <p className="mt-8 max-w-md text-center text-[11px] font-medium normal-case tracking-normal text-white/55 leading-relaxed">
            Oturum ve sahne başlatılıyor… Ağ geçidi kontrolü ana ekranda devam eder.
          </p>
          <span className="sr-only" aria-live="polite">
            Başlatılıyor
          </span>
        </div>
      )}

      <style>{`
        .animate-spin-slow { animation: spin 25s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input::placeholder { font-size: 11px; letter-spacing: 0.6em; opacity: 0.3; font-weight: 900; }
        .backdrop-blur-5xl { backdrop-filter: blur(80px); }
      `}</style>
    </div>
  );
}
