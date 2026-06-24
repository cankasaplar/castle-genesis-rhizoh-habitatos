/**
 * Full system report + localhost probe — single console entry for all gates, layers, audits.
 */

import { resolveDomainIdFromPathV0, RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainGateV0.js";
import { runDomainGateForPathV0, getRhizohNervousSystemConfigV0 } from "./rhizohDomainNervousSystemV0.js";
import { getRhizohDomainCoreSnapshotV0 } from "./rhizohDomainCoreStoreV0.js";
import { getDomainAdapterRegistrySnapshotV0 } from "./domainAdapterRegistryV0.js";
import { getControlPlaneSnapshotV0, getTensorAuditLogV0 } from "./rhizohControlPlaneV0.js";
import { getTruthTraceSnapshotV0 } from "./rhizohTruthTraceLayerV0.js";
import { getExplanationSnapshotV0 } from "./rhizohExplanationLayerV0.js";
import { getTraceSamplingSnapshotV0 } from "./rhizohTraceSamplingV0.js";
import { runLiveConsistencyAuditV0 } from "./rhizohLiveConsistencyAuditV0.js";
import { mapIntentToActionV0, invokeDomainCapabilityV0 } from "./rhizohTensorBridgeV0.js";
import { replayTensorIntentV0 } from "./rhizohTensorReplayV0.js";
import { emitSpatialEventFromDomainV0 } from "./rhizohSpatialEventEmitterV0.js";
import { listSpatialNodesV0, SPATIAL_NODE_TIER_V0 } from "./rhizohSpatialNodeLayerV0.js";
import { RHIZOH_DOMAIN_CAPABILITY_V0 } from "./rhizohDomainCapabilitySpecV0.js";
import { getWorldObservationIngressQueueSnapshotV0 } from "./worldObservationIngressQueueV0.js";
import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getSpatialReadyGateSnapshotV0 } from "./rhizohSpatialReadyGateV0.js";
import { auditDomainCoherenceV0, reconcileDomainPathCoherenceV0 } from "./rhizohDomainCoherenceV0.js";
import {
  emitSpatialTemporalTrailV0,
  getSpatialTemporalTrailSnapshotV0
} from "./rhizohSpatialTemporalTrailV0.js";
import { buildCausalMapLayerV0 } from "./rhizohCausalMapLayerV0.js";
import { replayCausalChainV0 } from "./rhizohSpatialReplayEngineV0.js";
import { detectLiveConflictsV0 } from "./rhizohLiveConflictDetectorV0.js";
import { buildTurnBehaviorConsistencyFieldV0 } from "./turnBehaviorConsistencyFieldV0.js";
import { buildTurnBehavioralDriftReportV0 } from "./turnBehavioralDriftEngineV0.js";
import { buildCalibrationGovernorStateV0 } from "./rhizohCalibrationGovernorV0.js";
import { readTurnSovereigntyEnforcementModeV0 } from "./turnSovereigntyEnforcementModeV0.js";
import { getLastTurnSovereigntyV0 } from "./behavioralTurnSovereigntyV0.js";
import { getVoiceAdapterRegistrySnapshot } from "./voiceInputAdapterRegistryV0.js";
import { getVoiceOutputAdapterSnapshotV0 } from "./rhizohVoiceOutputAdapterChainV0.js";
import { resolveGatewayTransportV0 } from "./rhizohGatewayTransportFallbackV0.js";
import { getIdentityContinuitySnapshotV0 } from "./rhizohIdentityContinuityCoreV0.js";
import { getPersonaSchedulerSnapshotV0 } from "./rhizohPersonaLoopSchedulerV0.js";
import { getContinuityKernelSnapshotV0 } from "./rhizohContinuityKernelV0.js";
import { getRhizohPulseLoopSnapshotV1 } from "./rhizohPulseLoopV1.js";
import { getIdentityLifecycleSnapshotV0 } from "./rhizohIdentityLifecycleV0.js";
import { getIdentityEventLogSnapshotV0 } from "./rhizohIdentityEventLogV0.js";
import { getComputeAdapterSnapshotV0 } from "./rhizohComputeAdapterRegistryV0.js";
import { getPulseGovernanceSnapshotV0 } from "./rhizohPulseGovernanceV0.js";
import { filterIdentityNoiseV0 } from "./rhizohSemanticCompressionFilterV0.js";
import { getGroundingLayerSnapshotV1 } from "./rhizohGroundingLayerV1.js";
import { getOutputContractConsumerSnapshotV0 } from "./rhizohOutputContractConsumerV0.js";
import { getLiveLayerSnapshotV0 } from "./rhizohLiveLayerV0.js";
import { getThinkingLayerSnapshotV0 } from "./rhizohThinkingLayerV0.js";
import { getPresencePrimitiveSnapshotV1 } from "./rhizohPresencePrimitiveV1.js";
import { getTranscriptAcceptanceSnapshotV0 } from "./rhizohTranscriptAcceptanceLedgerV0.js";
import { buildSystemIntegrityTiersV0 } from "./rhizohSystemIntegrityTiersV0.js";
import { resolveWorldLayerActivationStatusV0 } from "./rhizohWorldLayerActivationStatusV0.js";
import { getSpatialRendererRegistrySnapshotV0 } from "./rhizohSpatialSurfaceRendererRegistryV0.js";
import { buildTowerRegistrySnapshotV0, getLastSpatialDistributionV0 } from "./spatialDistributionLayerV0.js";
import { buildLlmTowerMapRegistrySnapshotV0 } from "./llmTowerMapViewportV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "./spiralMMOContinentPinsV0.js";
import { listSpiralMMOPinCitizenshipSnapshotsV0 } from "./spiralMMOPinCitizenshipV0.js";
import { buildRhizohObservationStateV1 } from "./rhizohObservationStateV1.js";
import {
  formatRhizohNeonCountdownMsV0,
  readRhizohNeonCountdownDeadlineMsV0,
  resolveRhizohNeonCountdownRemainingMsV0
} from "./rhizohNeonCountdownV0.js";
import { readCityMapLegalGateSnapshotV0 } from "./cityMapLegalCountdownMediaGateV0.js";
import { getLastGeneratedInviteV0 } from "../ingress/inviteOpsV0.js";
import { getCalendarEventAdapterSnapshotV0 } from "./calendarEventAdapterV0.js";
import { buildCalendarShadowTimelineViewV0 } from "./calendarShadowTimelineV0.js";
import { getMediaEventAdapterSnapshotV0 } from "./mediaEventAdapterV0.js";
import { buildMediaShadowTimelineViewV0 } from "./mediaShadowTimelineV0.js";
import { buildLifeShadowDayBranchComparisonV0 } from "./lifeShadowDayBranchesV0.js";
import { buildUserActivityShadowTimelineViewV0 } from "./userActivityShadowTimelineV0.js";
import { getUserActivityAdapterSnapshotV0 } from "./userActivityEventAdapterV0.js";
import {
  getCrossSpaceFusionLaneAuditV0,
  getCrossSpaceFusionSnapshotV0
} from "./crossSpaceCausalFusionV0.js";
import { getWorldBridgeMemoryGraphSnapshotV0 } from "./worldBridgeMemoryGraphV0.js";
import { getExecutionPermissionLayerSnapshotV0 } from "./executionPermissionLayerV0.js";
import { getMediaFeedbackObservationLoopSnapshotV0 } from "./mediaFeedbackObservationLoopV0.js";
import { getWorldBridgeShadowTraceBridgeSnapshotV0 } from "./worldBridgeShadowTraceBridgeV0.js";
import { buildHabitatClimateSnapshotV0 } from "./habitatClimatePatternEngineV0.js";
import { buildRhizohAcademyLearningUnionReportV0 } from "./rhizohAcademyLearningUnionReportV0.js";
import { buildRhizohStudioVisibilitySnapshotV0 } from "./rhizohStudioVisibilitySnapshotV0.js";

export const RHIZOH_FULL_SYSTEM_REPORT_SCHEMA_V0 = "rhizoh.full_system_report.v0";

/** @type {boolean} */
let consoleMounted = false;

export const FULL_SYSTEM_PROBE_ROUTES_V0 = Object.freeze([
  { path: "/", domain: RHIZOH_DOMAIN_ID_V0.T0, label: "T0 Live" },
  { path: "/world/space", domain: RHIZOH_DOMAIN_ID_V0.WORLD, label: "World Space" },
  { path: "/world/social", domain: RHIZOH_DOMAIN_ID_V0.WORLD, label: "World Social" },
  { path: "/world/modes", domain: RHIZOH_DOMAIN_ID_V0.WORLD, label: "World Modes" },
  { path: "/map", domain: RHIZOH_DOMAIN_ID_V0.WORLD, label: "Map Alias" },
  { path: "/hall/main", domain: RHIZOH_DOMAIN_ID_V0.CASTLE, label: "Castle Hall" },
  { path: "/greenroom/main", domain: RHIZOH_DOMAIN_ID_V0.CASTLE, label: "Castle Greenroom" },
  { path: "/broadcast/live", domain: RHIZOH_DOMAIN_ID_V0.CASTLE, label: "Castle Broadcast" },
  { path: "/studio", domain: RHIZOH_DOMAIN_ID_V0.STUDIO, label: "Studio" },
  { path: "/spiral", domain: RHIZOH_DOMAIN_ID_V0.STUDIO, label: "Studio Spiral" },
  { path: "/academy/observe", domain: RHIZOH_DOMAIN_ID_V0.OBSERVER, label: "Observer Academy" },
  { path: "/settings", domain: RHIZOH_DOMAIN_ID_V0.OBSERVER, label: "Observer Settings" }
]);

const WINDOW_SNAPSHOT_KEYS_V0 = [
  "__RHIZOH_NERVOUS_SYSTEM__",
  "__RHIZOH_DOMAIN_CORE__",
  "__RHIZOH_DOMAIN_ADAPTERS__",
  "__RHIZOH_CONTROL_PLANE__",
  "__RHIZOH_TRUTH_TRACE__",
  "__RHIZOH_EXPLANATION__",
  "__RHIZOH_LIVE_CONSISTENCY_AUDIT__",
  "__CASTLE_CESIUM__",
  "__RHIZOH_MAP_DIAG__",
  "__RHIZOH_WORLD_OBS__",
  "__RHIZOH_COMPANION_PRESENCE__",
  "__RHIZOH_OBSERVATION_FEED__"
];

/**
 * @returns {object}
 */
function collectWindowSnapshotsV0() {
  if (typeof window === "undefined") return Object.freeze({ available: false, keys: {} });
  const keys = {};
  for (const key of WINDOW_SNAPSHOT_KEYS_V0) {
    const val = window[key];
    if (val === undefined) {
      keys[key] = Object.freeze({ present: false });
    } else if (typeof val === "function") {
      keys[key] = Object.freeze({ present: true, type: "function" });
    } else {
      keys[key] = Object.freeze({
        present: true,
        type: typeof val,
        schema: val?.schema ?? null,
        summary: summarizeSnapshotV0(val)
      });
    }
  }
  return Object.freeze({ available: true, keys: Object.freeze(keys) });
}

/**
 * @param {unknown} val
 */
function summarizeSnapshotV0(val) {
  if (!val || typeof val !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (val);
  return Object.freeze({
    domain: o.domain ?? o.activeDomain ?? null,
    pathname: o.pathname ?? null,
    pass: o.pass ?? null,
    count: o.count ?? null,
    ready: o.ready ?? null,
    health: o.health?.propagation ?? o.propagation ?? null
  });
}

/**
 * Read-only probe — route resolution + dry-run replay, no state mutation.
 * Use for pass evaluation; live probe is opt-in via probeLive.
 */
export function runFullSystemProbeIsolatedV0() {
  const gateResults = [];
  let gatesPass = 0;

  for (const route of FULL_SYSTEM_PROBE_ROUTES_V0) {
    const resolved = resolveDomainIdFromPathV0(route.path);
    const domainMatch = resolved === route.domain;
    if (domainMatch) gatesPass += 1;
    gateResults.push(
      Object.freeze({
        path: route.path,
        label: route.label,
        expectedDomain: route.domain,
        resolvedDomain: resolved,
        domainMatch,
        gateOk: domainMatch,
        isolated: true,
        safeUiMode: null,
        propagation: "read_only",
        adaptersReady: null,
        error: null
      })
    );
  }

  const liveOps = [];
  const recordOp = (name, fn) => {
    try {
      const result = fn();
      const ok = result?.ok !== false || result?.deferred === true || result?.dryRun === true;
      liveOps.push(
        Object.freeze({ name, ok, isolated: true, result: compactResultV0(result) })
      );
    } catch (e) {
      liveOps.push(Object.freeze({ name, ok: false, isolated: true, error: String(e?.message || e) }));
    }
  };

  recordOp("tensor_replay_dry_run", () =>
    replayTensorIntentV0(RHIZOH_DOMAIN_ID_V0.WORLD, "open_world_map", { dryRun: true })
  );
  recordOp("causal_chain_replay", () =>
    replayCausalChainV0(RHIZOH_DOMAIN_ID_V0.WORLD, "open_world_map")
  );

  const liveOpsPass = liveOps.filter((o) => o.ok).length;
  const envBlockers = collectEnvBlockersV0();

  return Object.freeze({
    isolated: true,
    readOnly: true,
    gates: Object.freeze(gateResults),
    gatesPass,
    gatesTotal: gateResults.length,
    liveOps: Object.freeze(liveOps),
    liveOpsPass,
    liveOpsTotal: liveOps.length,
    consistencyAudit: null,
    envBlockers,
    pass:
      gatesPass === gateResults.length && liveOpsPass === liveOps.length && envBlockers.length === 0
  });
}

/**
 * Live probe — mutates runtime state (diagnostics only). Prefer isolated probe for pass.
 */
export function runFullSystemProbeV0() {
  const gateResults = [];
  let gatesPass = 0;

  for (const route of FULL_SYSTEM_PROBE_ROUTES_V0) {
    const resolved = resolveDomainIdFromPathV0(route.path);
    const domainMatch = resolved === route.domain;
    let gate = null;
    let gateOk = false;
    let error = null;
    try {
      gate = runDomainGateForPathV0(route.path);
      gateOk =
        domainMatch &&
        gate?.domain === route.domain &&
        gate?.tensor?.ok !== false &&
        Boolean(gate?.health?.gate);
    } catch (e) {
      error = String(e?.message || e);
    }
    if (gateOk) gatesPass += 1;
    gateResults.push(
      Object.freeze({
        path: route.path,
        label: route.label,
        expectedDomain: route.domain,
        resolvedDomain: resolved,
        domainMatch,
        gateOk,
        safeUiMode: gate?.safeUiMode === true,
        propagation: gate?.health?.propagation ?? null,
        adaptersReady: gate?.adaptersReady === true,
        error
      })
    );
  }

  const liveOps = [];
  const recordOp = (name, fn, opts = {}) => {
    try {
      const result = fn();
      const deferredOk =
        opts.acceptDeferred === true &&
        (result?.deferred === true ||
          result?.reason === "cesium_not_ready" ||
          result?.skipReason === "cesium_not_ready");
      const ok = result?.ok !== false || deferredOk;
      liveOps.push(
        Object.freeze({ name, ok, deferred: deferredOk, result: compactResultV0(result) })
      );
      return ok;
    } catch (e) {
      liveOps.push(Object.freeze({ name, ok: false, error: String(e?.message || e) }));
      return false;
    }
  };

  runDomainGateForPathV0("/world/space");
  recordOp("tensor_open_world_map", () =>
    mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.WORLD, { intent: "open_world_map" })
  );
  recordOp("tensor_replay_dry_run", () =>
    replayTensorIntentV0(RHIZOH_DOMAIN_ID_V0.WORLD, "open_world_map")
  );
  recordOp("spatial_static_pin", () =>
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.STATIC,
      nodeId: "probe-pin-static",
      kind: "probe"
    })
  );
  recordOp("spatial_live_projection", () =>
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.LIVE,
      nodeId: "probe-pin-live",
      kind: "avatar"
    })
  );
  recordOp(
    "adapter_spatial_probe",
    () =>
      invokeDomainCapabilityV0(RHIZOH_DOMAIN_ID_V0.WORLD, RHIZOH_DOMAIN_CAPABILITY_V0.SPATIAL, {
        op: "ensure_ready"
      }),
    { acceptDeferred: true }
  );
  recordOp("spatial_temporal_trail", () =>
    emitSpatialTemporalTrailV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      nodeId: "probe-trail-temporal",
      kind: "probe_trail",
      payload: { source: "full_system_probe" }
    })
  );
  recordOp("causal_chain_replay", () =>
    replayCausalChainV0(RHIZOH_DOMAIN_ID_V0.WORLD, "open_world_map")
  );
  recordOp("castle_presence_signal", () => {
    runDomainGateForPathV0("/greenroom/main");
    return invokeDomainCapabilityV0(RHIZOH_DOMAIN_ID_V0.CASTLE, RHIZOH_DOMAIN_CAPABILITY_V0.PRESENCE, {
      action: "probe"
    });
  });

  const liveOpsPass = liveOps.filter((o) => o.ok).length;
  const audit = runLiveConsistencyAuditV0({ domain: RHIZOH_DOMAIN_ID_V0.WORLD });
  const envBlockers = collectEnvBlockersV0();

  return Object.freeze({
    isolated: false,
    readOnly: false,
    gates: Object.freeze(gateResults),
    gatesPass,
    gatesTotal: gateResults.length,
    liveOps: Object.freeze(liveOps),
    liveOpsPass,
    liveOpsTotal: liveOps.length,
    consistencyAudit: audit,
    envBlockers,
    pass:
      gatesPass === gateResults.length &&
      liveOpsPass === liveOps.length &&
      audit.pass &&
      envBlockers.length === 0
  });
}

function collectEpistemicSubstrateV0() {
  let turnSovereignty = null;
  try {
    turnSovereignty = getLastTurnSovereigntyV0();
  } catch {
    turnSovereignty = null;
  }
  let behaviorConsistency = null;
  let behavioralDrift = null;
  let calibrationGovernor = null;
  try {
    behaviorConsistency = buildTurnBehaviorConsistencyFieldV0();
    behavioralDrift = buildTurnBehavioralDriftReportV0();
    calibrationGovernor = buildCalibrationGovernorStateV0();
  } catch {
    /* optional layers */
  }
  return Object.freeze({
    stack: Object.freeze([
      "temporal",
      "causal",
      "replay",
      "conflict",
      "compression",
      "truth_loss",
      "turn_sovereignty",
      "drift_calibration",
      "identity_continuity",
      "identity_event_log",
      "identity_lifecycle",
      "pulse_loop",
      "persona_scheduler",
      "voice_output_chain",
      "compute_adapter_registry",
      "pulse_governance",
      "semantic_compression_filter",
      "output_contract_router",
      "grounding_layer",
      "output_contract_consumer",
      "live_layer",
      "thinking_layer",
      "presence_primitive"
    ]),
    turnSovereignty: turnSovereignty
      ? Object.freeze({
          sovereignReality: turnSovereignty.sovereignReality,
          selectionReason: turnSovereignty.selectionReason,
          enforcement: readTurnSovereigntyEnforcementModeV0()
        })
      : null,
    behaviorConsistency,
    behavioralDrift,
    calibrationGovernor,
    continuityKernel: getContinuityKernelSnapshotV0(),
    identityContinuity: getIdentityContinuitySnapshotV0(),
    identityEventLog: getIdentityEventLogSnapshotV0(),
    identityLifecycle: getIdentityLifecycleSnapshotV0(),
    pulseLoop: getRhizohPulseLoopSnapshotV1(),
    personaScheduler: getPersonaSchedulerSnapshotV0(),
    voiceAdapter: getVoiceAdapterRegistrySnapshot(),
    voiceOutput: getVoiceOutputAdapterSnapshotV0(),
    computeAdapter: getComputeAdapterSnapshotV0(),
    pulseGovernance: getPulseGovernanceSnapshotV0(),
    semanticFilter: filterIdentityNoiseV0(getIdentityEventLogSnapshotV0()),
    groundingLayer: getGroundingLayerSnapshotV1(),
    outputContractConsumer: getOutputContractConsumerSnapshotV0(),
    liveLayer: getLiveLayerSnapshotV0(),
    thinkingLayer: getThinkingLayerSnapshotV0(),
    presencePrimitive: getPresencePrimitiveSnapshotV1(),
    consoleApis: Object.freeze([
      "__RHIZOH_FULL_REPORT__()",
      "__rhizoh.causalMap",
      "__rhizoh.causalMapRaw",
      "__rhizoh.truthLoss",
      "__rhizoh.liveConflicts",
      "__rhizoh.behavioralDrift",
      "__rhizoh.calibrationGovernor",
      "__rhizoh.turnBehaviorConsistency",
      "__RHIZOH_REPLAY_CAUSAL__(domain, intent)",
      "__rhizoh.identityContinuity",
      "__rhizoh.continuityKernel.rebuildCausalGraph()",
      "__rhizoh.rebuildCausalGraph()",
      "__rhizoh.personaScheduler",
      "__rhizoh.pulseLoop",
      "__rhizoh.identityEventLog",
      "__rhizoh.identityLifecycle",
      "__rhizoh.computeAdapter",
      "__rhizoh.pulseGovernance",
      "__rhizoh.lastOutputContract",
      "__rhizoh.outputContractRouter",
      "__rhizoh.outputContractConsumer",
      "__rhizoh.groundingLayer",
      "__rhizoh.groundSignals",
      "__rhizoh.lastLivePresence",
      "__rhizoh.liveLayer",
      "__rhizoh.thinkingLayer",
      "__rhizoh.presencePrimitive",
      "__rhizoh.transcriptAcceptance",
      "__rhizoh.lastPresenceEvent",
      "__rhizoh.textOutputQueue",
      "__rhizoh.gatewayTransport",
      "__rhizoh.worldLayerStatus",
      "__rhizoh.spatialRendererRegistry",
      "__rhizoh.integrityTiers",
      "await __rhizoh.epistemicAuditBundle.run()",
      "__rhizoh.epistemicIdentity.evaluate()",
      "__rhizoh.epistemicIdentity.global()",
      "__rhizoh.identityManifest.project()",
      "__rhizoh.inviteOps.generate({ role: 'investor' })"
    ])
  });
}

/**
 * Presence runtime — Live Layer (critical path) vs Thinking Layer (async).
 * @returns {object}
 */
function collectPresenceRuntimeDiagnosticV0() {
  const live = getLiveLayerSnapshotV0();
  const thinking = getThinkingLayerSnapshotV0();
  const pulse = getRhizohPulseLoopSnapshotV1();
  const voiceOut = getVoiceOutputAdapterSnapshotV0();
  const instantPresence =
    typeof window !== "undefined" ? window.__rhizoh?.instantPresence ?? null : null;
  const lastLivePresence =
    typeof window !== "undefined" ? window.__rhizoh?.lastLivePresence ?? null : null;
  const presencePrimitive = getPresencePrimitiveSnapshotV1();
  const transcriptAcceptance = getTranscriptAcceptanceSnapshotV0();

  const instantPresenceTriggered =
    instantPresence?.presenceFastPath === true ||
    presencePrimitive?.bootFired === true ||
    primitiveEmitCountV1(presencePrimitive) > 0 ||
    Boolean(lastLivePresence);

  const livePathPass =
    live.blocksOnGovernance === false &&
    thinking.blocksExecution === false &&
    voiceOut.userFacingDead === false;

  return Object.freeze({
    schema: "rhizoh.presence_runtime_diagnostic.v0",
    architecture: "live_first_thinking_async",
    livePathPass,
    liveLayer: live,
    thinkingLayer: thinking,
    pulseLoop: Object.freeze({
      mounted: pulse.mounted === true || pulse.unified === true,
      role: pulse.role ?? null,
      seq: pulse.seq ?? 0,
      systemHealth: pulse.systemHealth ?? null,
      godLoopRiskMitigated: pulse.godLoopRiskMitigated ?? null
    }),
    instantPresence: instantPresence
      ? Object.freeze({
          handled: instantPresence.presenceFastPath === true,
          latencyClass: instantPresence.latencyClass ?? null,
          llmBypass: instantPresence.llmBypass === true,
          atMs: instantPresence.atMs ?? null
        })
      : null,
    lastLivePresence: lastLivePresence
      ? Object.freeze({
          layer: lastLivePresence.layer,
          latencyMs: lastLivePresence.latencyMs,
          latencyClass: lastLivePresence.latencyClass,
          spoke: lastLivePresence.spoke,
          blockingGovernance: lastLivePresence.blockingGovernance
        })
      : null,
    voiceNeverSilent: voiceOut.userFacingDead === false,
    presencePrimitive,
    expressionFired: primitiveEmitCountV1(presencePrimitive) > 0,
    instantPresenceTriggered,
    transcriptAcceptance
  });
}

function formatRejectionReasonsV0(snap) {
  const rows = snap?.rejectionReasons || [];
  if (!rows.length) return "none";
  return rows.map((r) => `${r.reason}: ${r.count}`).join(", ");
}

function formatLastRejectionForensicsV0(row) {
  if (!row) return "none";
  const f = row.filter || {};
  return [
    `ref:${row.transcriptRef || "—"}`,
    `conf:${row.confidence ?? "—"}`,
    `rms:${row.maxRms ?? "—"}`,
    `tier:${f.confidenceTier ?? "—"}`,
    `intent:${f.fastIntent ?? "—"}`,
    `meaningful:${f.meaningful ?? "—"}`,
    `template:${f.templateScore ?? "—"}`,
    `suspect_fn:${row.suspectedFalseNegative ? "yes" : "no"}`
  ].join(" · ");
}

function primitiveEmitCountV1(snap) {
  return Number(snap?.emitCount) || 0;
}

function collectWebsocketDiagnosticV0() {
  const transport = resolveGatewayTransportV0();
  let cfg = {};
  try {
    cfg = getCastleFlightConfig();
  } catch {
    cfg = {};
  }
  const wsUrl = String(cfg.gatewayWsUrl || cfg.gatewayWs || "").trim();
  return Object.freeze({
    configured: Boolean(wsUrl),
    url: wsUrl || null,
    transport,
    note: transport.note,
    castlePresenceBlockedUntilUpgrade: transport.castlePresenceBlockedUntilUpgrade,
    httpFallbackActive: transport.mode === "http_preferred" || transport.mode === "http"
  });
}

function collectEnvBlockersV0() {
  const blockers = [];
  let cfg = {};
  try {
    cfg = getCastleFlightConfig();
  } catch {
    cfg = {};
  }
  if (!cfg.cesiumIonToken && !import.meta.env?.VITE_CESIUM_ION_TOKEN) {
    blockers.push("missing_VITE_CESIUM_ION_TOKEN");
  }
  const ingress = getWorldObservationIngressQueueSnapshotV0();
  if (ingress.authBlocked || !ingress.hasGatewayToken) {
    blockers.push("missing_or_invalid_VITE_GATEWAY_TOKEN");
  }
  return Object.freeze(blockers);
}

/**
 * World Bridge Layer 2 — calendar / media ingress + shadow timeline + fusion lanes.
 * @returns {object}
 */
function collectWorldBridgeDiagnosticV0() {
  const calendar = getCalendarEventAdapterSnapshotV0();
  const media = getMediaEventAdapterSnapshotV0();
  const userActivity = getUserActivityAdapterSnapshotV0();
  const calendarShadow = buildCalendarShadowTimelineViewV0();
  const mediaShadow = buildMediaShadowTimelineViewV0();
  const userActivityShadow = buildUserActivityShadowTimelineViewV0();
  const lifeShadowDayAb = buildLifeShadowDayBranchComparisonV0();
  const fusion = getCrossSpaceFusionSnapshotV0();
  const laneAudit = getCrossSpaceFusionLaneAuditV0();
  const memoryGraph = getWorldBridgeMemoryGraphSnapshotV0();
  const laneContrib = fusion?.lastFusion?.epistemicUpdate?.laneContributions || null;
  const executionPermission = getExecutionPermissionLayerSnapshotV0();
  const mediaFeedbackLoop = getMediaFeedbackObservationLoopSnapshotV0();
  const shadowWriteback = getWorldBridgeShadowTraceBridgeSnapshotV0();
  const habitatClimate = buildHabitatClimateSnapshotV0();

  const rhizoh = typeof window !== "undefined" ? window.__rhizoh : null;

  return Object.freeze({
    schema: "rhizoh.full_system_report.world_bridge.v0",
    interpretationOnly: true,
    nonExecutive: true,
    calendar: Object.freeze({
      spaceId: calendar.spaceId,
      recentCount: calendar.recentCount,
      lastEvent: calendar.recent[0]?.title || null,
      ingressApi: "ingestCalendarEvent"
    }),
    media: Object.freeze({
      spaceId: media.spaceId,
      recentCount: media.recentCount,
      lastEvent: media.recent[0]?.title || null,
      ingressApi: "ingestMediaEvent"
    }),
    userActivity: Object.freeze({
      spaceId: userActivity.spaceId,
      recentCount: userActivity.recentCount,
      lastActivityType: userActivity.recent[0]?.activityType || null,
      ingressApi: "ingestUserActivity"
    }),
    lifeShadow: Object.freeze({
      calendarEventCount: calendarShadow.eventCount,
      avgOutcomeScore01: calendarShadow.avgOutcomeScore01,
      branches: calendarShadow.branches,
      consoleApi: "__rhizoh.calendarShadowTimeline()"
    }),
    mediaShadow: Object.freeze({
      eventCount: mediaShadow.eventCount,
      avgAttentionScore01: mediaShadow.avgAttentionScore01,
      branches: mediaShadow.branches,
      consoleApi: "__rhizoh.mediaShadowTimeline()"
    }),
    userActivityShadow: Object.freeze({
      eventCount: userActivityShadow.eventCount,
      avgBehaviorScore01: userActivityShadow.avgBehaviorScore01,
      branches: userActivityShadow.branches,
      consoleApi: "__rhizoh.userActivityShadowTimeline()"
    }),
    lifeShadowDayAb: Object.freeze({
      dayA: lifeShadowDayAb.dayA.eventCount,
      dayB: lifeShadowDayAb.dayB.eventCount,
      dominantBranch: lifeShadowDayAb.comparison.dominantBranch,
      dayAShare01: lifeShadowDayAb.comparison.dayAShare01,
      consoleApi: "__rhizoh.lifeShadowDayBranches()"
    }),
    laneIngest: Object.freeze({
      calendar: laneAudit.calendar.present,
      media: laneAudit.media.present,
      userActivity: laneAudit.userActivity.present
    }),
    memoryGraph: Object.freeze({
      nodeCount: memoryGraph.nodeCount,
      bySource: memoryGraph.bySource,
      consoleApi: "__rhizoh.worldBridgeMemory()"
    }),
    fusionLanes: Object.freeze({
      calendarPresent: Boolean(laneContrib?.calendar?.present ?? laneAudit.calendar.present),
      calendarWeight: laneContrib?.calendar?.weight ?? (laneAudit.calendar.present ? 0.1 : 0),
      mediaPresent: Boolean(laneContrib?.media?.present ?? laneAudit.media.present),
      mediaWeight: laneContrib?.media?.weight ?? (laneAudit.media.present ? 0.08 : 0),
      userActivityPresent: Boolean(laneContrib?.userActivity?.present ?? laneAudit.userActivity.present),
      userActivityWeight: laneContrib?.userActivity?.weight ?? (laneAudit.userActivity.present ? 0.07 : 0),
      lastFusionSeq: fusion?.fusionSeq ?? null
    }),
    surfaceBound: Object.freeze({
      ingestCalendarEvent: typeof rhizoh?.ingestCalendarEvent === "function",
      ingestMediaEvent: typeof rhizoh?.ingestMediaEvent === "function",
      ingestUserActivity: typeof rhizoh?.ingestUserActivity === "function",
      fuseCrossSpaceEpistemic: typeof rhizoh?.fuseCrossSpaceEpistemic === "function",
      calendarShadowTimeline: typeof rhizoh?.calendarShadowTimeline === "function",
      mediaShadowTimeline: typeof rhizoh?.mediaShadowTimeline === "function",
      userActivityShadowTimeline: typeof rhizoh?.userActivityShadowTimeline === "function",
      lifeShadowDayBranches: typeof rhizoh?.lifeShadowDayBranches === "function",
      executionPermission: typeof rhizoh?.executionPermission === "function",
      calendarActionTrigger: typeof rhizoh?.calendarActionTrigger === "function",
      mediaFeedbackLoop: typeof rhizoh?.mediaFeedbackLoop === "function",
      habitatClimate: typeof rhizoh?.habitatClimate === "function",
      worldBridgeShadowWriteback: typeof rhizoh?.worldBridgeShadowWriteback === "function"
    }),
    executionPermission: Object.freeze({
      governanceMode: executionPermission.governanceMode,
      mutationPermitted: executionPermission.mutationPermitted,
      executionClass: executionPermission.executionClass,
      consoleApi: "__rhizoh.executionPermission()"
    }),
    mediaFeedbackLoop: Object.freeze({
      cycleCount: mediaFeedbackLoop.cycleCount,
      consoleApi: "__rhizoh.mediaFeedbackLoop()"
    }),
    shadowWriteback: Object.freeze({
      projectionCount: shadowWriteback.projectionCount,
      consoleApi: "__rhizoh.worldBridgeShadowWriteback()"
    }),
    habitatClimate: Object.freeze({
      horizon: habitatClimate.horizon,
      dominantBranch: habitatClimate.pattern?.dominantBranch ?? null,
      climateLabel: habitatClimate.identity?.climateLabel ?? null,
      memoryNodeCount: habitatClimate.evolution?.memoryNodeCount ?? 0,
      consoleApi: "__rhizoh.habitatClimate()"
    })
  });
}

/**
 * Life OS v0.1 closure — honest observability snapshot.
 * @returns {object}
 */
function collectLifeOsV01DiagnosticV0() {
  const status = buildLifeOsV01StatusSnapshotV0();
  const rhizoh = typeof window !== "undefined" ? window.__rhizoh : null;

  return Object.freeze({
    schema: "rhizoh.full_system_report.life_os_v0_1.v0",
    interpretationOnly: true,
    nonExecutive: true,
    status: status.status,
    honestLabel: status.honestLabel,
    worldBridge: status.worldBridge,
    habitatClimate: status.habitatClimate,
    governance: status.governance,
    academy: status.academy,
    scopeDelivered: status.scope.delivered,
    scopeExcluded: status.scope.excluded,
    surfaceBound: Object.freeze({
      lifeOsStatus: typeof rhizoh?.lifeOsStatus === "function"
    }),
    consoleApi: "__rhizoh.lifeOsStatus()"
  });
}

/**
 * Studio V1 visibility — Life Memory product surface digest.
 * @returns {object}
 */
function collectStudioVisibilityDiagnosticV0() {
  const snap = buildRhizohStudioVisibilitySnapshotV0();
  const rhizoh = typeof window !== "undefined" ? window.__rhizoh : null;

  return Object.freeze({
    schema: "rhizoh.full_system_report.studio_visibility.v0",
    interpretationOnly: true,
    nonExecutive: true,
    lifeOsStatus: snap.lifeOsStatus,
    memoryNodeCount: snap.worldBridge.memoryNodeCount,
    climateLabel: snap.habitatClimate.climateLabel,
    fusionSeq: snap.fusionTimeline.fusionSeq,
    armedLearningCount: snap.armedLearningCount,
    academyUnionLabel: snap.academyUnion.unionLabel,
    surfaceBound: Object.freeze({
      studioVisibility: typeof rhizoh?.studioVisibility === "function"
    }),
    consoleApi: "__rhizoh.studioVisibility()"
  });
}

/**
 * Academy learning union — chess + go + checkers discipline digests.
 * @returns {object}
 */
function collectAcademyLearningDiagnosticV0() {
  const union = buildRhizohAcademyLearningUnionReportV0();
  const rhizoh = typeof window !== "undefined" ? window.__rhizoh : null;

  return Object.freeze({
    schema: "rhizoh.full_system_report.academy_learning_union.v0",
    interpretationOnly: true,
    nonExecutive: true,
    unionLabel: union.unionLabel,
    dominantDiscipline: union.dominantDiscipline,
    armedDisciplineCount: union.armedDisciplineCount,
    totalMovesSeen: union.totalMovesSeen,
    totalBatchesFlushed: union.totalBatchesFlushed,
    disciplines: union.disciplines,
    surfaceBound: Object.freeze({
      academyLearningUnion: typeof rhizoh?.academyLearningUnion === "function",
      wireAcademyLearningUnion: typeof rhizoh?.wireAcademyLearningUnion === "function",
      learningReport: typeof rhizoh?.learningReport === "function",
      goLearningReport: typeof rhizoh?.goLearningReport === "function",
      checkersLearningReport: typeof rhizoh?.checkersLearningReport === "function"
    }),
    consoleApi: "__rhizoh.academyLearningUnion()"
  });
}

/**
 * Network surface — map pins, towers, gateway registration, invites (investor ops).
 * @returns {object}
 */
function collectNetworkSurfaceDiagnosticV0() {
  const spiralPins = listSpiralMMOContinentMapPinsV0();
  const pinCitizenship = listSpiralMMOPinCitizenshipSnapshotsV0();
  const spatialDistribution = getLastSpatialDistributionV0();
  const observation = buildRhizohObservationStateV1();
  const cityGate = readCityMapLegalGateSnapshotV0();
  const deadlineMs = readRhizohNeonCountdownDeadlineMsV0();
  const spiralRemainingMs = resolveRhizohNeonCountdownRemainingMsV0(deadlineMs);
  const lastInvite = getLastGeneratedInviteV0();

  const gatewayService =
    typeof window !== "undefined" ? window.__rhizoh?.gatewayService ?? null : null;
  const voiceGateway =
    typeof window !== "undefined" ? window.__rhizoh?.voiceGateway ?? null : null;
  const towerGateway =
    typeof window !== "undefined" ? window.__rhizoh?.towerGateway ?? null : null;
  const mediaGateway =
    typeof window !== "undefined" ? window.__rhizoh?.mediaGateway ?? null : null;
  const traceGraph =
    typeof window !== "undefined" ? window.__rhizoh?.traceGraphIndex ?? null : null;

  const pinTypes = spiralPins.reduce((acc, pin) => {
    const t = String(pin?.type || "unknown");
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));

  return Object.freeze({
    mapPins: Object.freeze({
      spiralContinent: spiralPins.length,
      distributed: spatialDistribution?.distributedCount ?? 0,
      uniqueCoords: spatialDistribution?.uniqueCoordinateCount ?? 0,
      pinTypes: Object.freeze(pinTypes),
      sampleIds: Object.freeze(spiralPins.slice(0, 5).map((p) => p?.id || p?.label || "—"))
    }),
    towers: buildTowerRegistrySnapshotV0(),
    llmTowers: buildLlmTowerMapRegistrySnapshotV0(),
    spiralJourney: Object.freeze({
      countdownRemaining: formatRhizohNeonCountdownMsV0(spiralRemainingMs),
      countdownRemainingMs: spiralRemainingMs,
      countdownActive: spiralRemainingMs > 0,
      legalHold: cityGate.legalHold === true,
      legalAcked: cityGate.legalAcked === true,
      ingressRoute: cityGate.ingressRoute || null,
      mediaEventState: cityGate.eventState || null,
      pinCitizenship: Object.freeze({
        pinCount: pinCitizenship.length,
        birdsExempt: true,
        tiers: Object.freeze(["hour", "day", "month", "year"]),
        sample: Object.freeze(
          pinCitizenship.slice(0, 3).map((c) =>
            Object.freeze({
              pinId: c.pinId,
              activeTierId: c.activeTierId,
              activeRemainingLabel: c.activeRemainingLabel,
              cycleSec: c.motion?.cycleSec ?? null
            })
          )
        ),
        consoleApi: "__rhizoh.listSpiralMMOPinCitizenship()"
      })
    }),
    gatewayRegistration: Object.freeze({
      voiceCitizenship: observation.voice?.citizenship || "detached",
      voiceRegistered: observation.voice?.registered === true,
      voiceSessionId: observation.voice?.sessionId || null,
      voiceCommitSeq: observation.voice?.voiceCommitSeq ?? 0,
      broadcastAck: observation.broadcast?.ackCount ?? 0,
      broadcastDelivered: observation.broadcast?.delivered ?? 0,
      sessionId: observation.sessionId || null,
      gatewayServiceMounted: Boolean(gatewayService?.register),
      voiceGatewayMounted: Boolean(voiceGateway?.fetchPresence),
      voiceSessionActive:
        typeof voiceGateway?.sessionActive === "function" ? voiceGateway.sessionActive() : null,
      towerCitizenship: observation.towers?.citizenship || "detached",
      towerRegisteredCount: observation.towers?.registeredCount ?? 0,
      towerActiveId: observation.towers?.activeTowerId || null,
      towerGatewayMounted: Boolean(towerGateway?.ensure),
      towerSessionActive:
        typeof towerGateway?.sessionActive === "function" ? towerGateway.sessionActive() : null,
      mediaCitizenship: observation.media?.citizenship || "detached",
      mediaRegisteredCount: observation.media?.registeredCount ?? 0,
      mediaActiveChannelId: observation.media?.activeChannelId || null,
      mediaGatewayMounted: Boolean(mediaGateway?.ensure),
      mediaSessionActive:
        typeof mediaGateway?.sessionActive === "function" ? mediaGateway.sessionActive() : null
    }),
    inviteOps: Object.freeze({
      lastGenerated: lastInvite
        ? Object.freeze({
            role: lastInvite.role,
            inviteUrl: lastInvite.inviteUrl,
            generatedAtMs: lastInvite.generatedAtMs
          })
        : null,
      generateApi: "__rhizoh.inviteOps.generate({ role: 'investor' })",
      mailDraftApi: "__rhizoh.inviteOps.mailDraft({ role: 'investor', name: '...' })"
    }),
    ticketGraph: traceGraph
      ? Object.freeze({
          mounted: true,
          liveIngestCount:
            typeof traceGraph.getSnapshot === "function"
              ? traceGraph.getSnapshot()?.liveIngestCount ?? 0
              : 0,
          note: "window.__rhizoh.traceGraphIndex — causal ticket mesh"
        })
      : Object.freeze({ mounted: false, note: "ticket graph console not mounted this session" }),
    consoleApis: Object.freeze([
      "__rhizoh.towerRegistry()",
      "__rhizoh.observationState.snapshot()",
      "__rhizoh.voiceGateway.fetchPresence()",
      "__rhizoh.voiceGateway.sessionActive()",
      "__rhizoh.inviteOps.generate({ role: 'investor' })",
      "__rhizoh.distributeSpatialPins()",
      "__rhizoh.spatialDistribution()",
      "__rhizoh.listLlmTowers()",
      "__rhizoh.fitAllLlmTowers()",
      "__rhizoh.towerGateway.ensure()",
      "__rhizoh.towerGateway.listRegistered()",
      "__rhizoh.mediaGateway.ensure()",
      "__rhizoh.mediaGateway.listRegistered()",
      "__rhizoh.traceGraphIndex.snapshot()",
      "__rhizoh.traceGraphIndex.runPipeline({ records: [] })"
    ])
  });
}

/**
 * @param {unknown} result
 */
function compactResultV0(result) {
  if (!result || typeof result !== "object") return result;
  const o = /** @type {Record<string, unknown>} */ (result);
  return Object.freeze({
    ok: o.ok,
    reason: o.reason ?? null,
    domain: o.domain ?? null,
    intent: o.intent ?? null,
    dryRun: o.dryRun ?? null,
    deferred: o.deferred ?? null
  });
}

/**
 * Full system report — snapshot + optional probe.
 * Pipeline: raw graph → compression → normalization metadata → audit → pass.
 * @param {{ probe?: boolean, probeLive?: boolean, probeIsolated?: boolean, audit?: boolean, restorePath?: boolean }} [opts]
 */
export function runFullSystemReportV0(opts = {}) {
  const pathname =
    typeof window !== "undefined" ? String(window.location.pathname || "/") : "/";
  const startedAt = Date.now();
  const useIsolatedProbe = opts.probe === true && opts.probeLive !== true;

  if (opts.probe !== false && typeof window !== "undefined") {
    runDomainGateForPathV0(pathname);
  }

  const probe = opts.probe
    ? useIsolatedProbe
      ? runFullSystemProbeIsolatedV0()
      : runFullSystemProbeV0()
    : null;

  if (opts.probe === true && !useIsolatedProbe && opts.restorePath !== false && typeof window !== "undefined") {
    runDomainGateForPathV0(pathname);
  }

  const causalMap = buildCausalMapLayerV0({ probeIsolated: useIsolatedProbe });

  const audit =
    opts.audit !== false
      ? runLiveConsistencyAuditV0({
          domain: resolveDomainIdFromPathV0(pathname)
        })
      : null;

  const domainCoherence = reconcileDomainPathCoherenceV0(pathname);
  const liveConflicts = detectLiveConflictsV0(pathname, { structuralOnly: true });
  const presenceRuntime = collectPresenceRuntimeDiagnosticV0();
  const eventGraphBridge =
    typeof window !== "undefined" ? window.__rhizoh?.runtimeEventGraphBridge ?? null : null;
  const genesisStream =
    typeof window !== "undefined" ? window.__rhizoh?.genesisStream ?? null : null;

  const worldLayerStatus = resolveWorldLayerActivationStatusV0();
  const rendererRegistry = getSpatialRendererRegistrySnapshotV0();
  const networkSurface = collectNetworkSurfaceDiagnosticV0();
  const worldBridge = collectWorldBridgeDiagnosticV0();
  const academyLearning = collectAcademyLearningDiagnosticV0();
  const lifeOsV01 = collectLifeOsV01DiagnosticV0();
  const studioVisibility = collectStudioVisibilityDiagnosticV0();

  const integrityTiers = buildSystemIntegrityTiersV0({
    causalMap,
    audit,
    liveConflicts,
    domainCoherence,
    envBlockers: collectEnvBlockersV0(),
    probe,
    spatialNodes: {
      total: listSpatialNodesV0().length,
      static: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.STATIC).length,
      live: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.LIVE).length,
      temporal: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.TEMPORAL).length
    },
    spatialReadyGate: getSpatialReadyGateSnapshotV0(),
    worldLayerStatus,
    rendererRegistry
  });

  const report = Object.freeze({
    schema: RHIZOH_FULL_SYSTEM_REPORT_SCHEMA_V0,
    atMs: Date.now(),
    durationMs: Date.now() - startedAt,
    location: Object.freeze({
      href: typeof window !== "undefined" ? window.location.href : null,
      pathname,
      host: typeof window !== "undefined" ? window.location.host : null
    }),
    env: getRhizohNervousSystemConfigV0(),
    envBlockers: collectEnvBlockersV0(),
    ingress: getWorldObservationIngressQueueSnapshotV0(),
    domainCore: getRhizohDomainCoreSnapshotV0(),
    adapters: getDomainAdapterRegistrySnapshotV0(),
    controlPlane: getControlPlaneSnapshotV0(),
    truthTrace: getTruthTraceSnapshotV0(),
    explanation: getExplanationSnapshotV0(),
    traceSampling: getTraceSamplingSnapshotV0(),
    tensorAuditCount: getTensorAuditLogV0().length,
    spatialNodes: Object.freeze({
      total: listSpatialNodesV0().length,
      static: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.STATIC).length,
      live: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.LIVE).length,
      temporal: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.TEMPORAL).length
    }),
    spatialReadyGate: getSpatialReadyGateSnapshotV0(),
    worldLayerStatus,
    rendererRegistry,
    integrityTiers,
    temporalTrail: getSpatialTemporalTrailSnapshotV0(),
    causalMap,
    eventGraphBridge,
    genesisStream,
    liveConflicts,
    domainCoherence: auditDomainCoherenceV0(pathname),
    domainReconcile: domainCoherence,
    websocket: collectWebsocketDiagnosticV0(),
    epistemicSubstrate: collectEpistemicSubstrateV0(),
    presenceRuntime,
    networkSurface,
    worldBridge,
    academyLearning,
    lifeOsV01,
    studioVisibility,
    evaluation: Object.freeze({
      structuralTruthPass: causalMap.truthLoss?.structuralPass !== false,
      structuralPass: integrityTiers.structuralPass,
      spatialSurfaceStatus: integrityTiers.spatialSurfaceStatus,
      operationalPass: integrityTiers.operationalPass,
      compressionBudget: causalMap.truthLoss?.compressionBudget ?? null,
      compressionContext: causalMap.compressionContext ?? null,
      probeMode: probe?.isolated ? "isolated_read_only" : probe ? "live_mutating" : "none",
      livePathPass: presenceRuntime.livePathPass,
      presenceRuntimePass: presenceRuntime.livePathPass
    }),
    windowSnapshots: collectWindowSnapshotsV0(),
    probe,
    audit,
    pass: integrityTiers.operationalPass,
    structuralPass: integrityTiers.structuralPass,
    spatialSurfaceStatus: integrityTiers.spatialSurfaceStatus
  });

  if (typeof window !== "undefined") {
    window.__RHIZOH_FULL_SYSTEM_REPORT__ = report;
    window.dispatchEvent(
      new CustomEvent("rhizoh:full-system-report-v0", { detail: report })
    );
  }

  return report;
}

/**
 * Pretty-print report to console.
 * @param {ReturnType<typeof runFullSystemReportV0>} [report]
 */
export function printFullSystemReportV0(report) {
  const r = report || runFullSystemReportV0({ probe: false, audit: true });
  const lines = [
    "",
    "═══════════════════════════════════════════",
    "  RHIZOH FULL SYSTEM REPORT",
    "═══════════════════════════════════════════",
    `  path: ${r.location.pathname}`,
    `  domain: ${r.domainCore.activeDomain} (path→${r.domainCoherence?.expectedDomain ?? "?"})`,
    `  coherence: ${r.domainCoherence?.pass ? "✔ aligned" : `✘ ${(r.domainCoherence?.issues || []).join(", ")}`}`,
    "  OVERALL",
    ...(r.integrityTiers?.tiers || []).map((tier) => {
      const suffix =
        tier.status === "pending"
          ? ` PENDING${tier.note ? ` — ${tier.note}` : ""}`
          : tier.pass
            ? ""
            : " FAIL";
      return `  ${tier.glyph} ${tier.label}${suffix}`;
    }),
    `  structural: ${r.structuralPass ? "✔ YES" : "✘ NO"}`,
    `  spatial surface: ${
      r.spatialSurfaceStatus === "pending"
        ? "⏳ PENDING"
        : r.spatialSurfaceStatus === "pass"
          ? "✔ YES"
          : "✘ NO"
    }`,
    `  operational: ${r.pass ? "✔ YES" : "✘ NO"}`,
    `  worldLayer: ${r.worldLayerStatus?.phase ?? "—"} · target ${r.worldLayerStatus?.target ?? "—"}`,
    `  renderer: ${r.rendererRegistry?.activeRenderer ?? "none"} · ${r.rendererRegistry?.narrative ?? ""}`,
    "───────────────────────────────────────────",
    "  ENV",
    `    gateway: ${r.env.gateway ? "✔" : "✘"}  cesium: ${r.env.cesium ? "✔" : "✘"}  worldLayer: ${r.env.worldLayer ? "✔" : "✘"}`,
    `    executionMode: ${r.env.executionMode}`,
    ...(r.envBlockers?.length
      ? ["  BLOCKERS", ...r.envBlockers.map((b) => `    ✘ ${b}`)]
      : []),
    ...(r.ingress?.authBlocked
      ? [`    ingress: paused (${r.ingress.authReason || "auth"})`]
      : []),
    "───────────────────────────────────────────",
    "  LAYERS",
    `    adapters.hydrated: ${r.adapters.hydrated}`,
    `    controlPlane: ${r.controlPlane?.health?.propagation ?? "n/a"}`,
    `    explanation: ${r.explanation.count} entries (${r.explanation.enabled ? "on" : "off"})`,
    `    spatial nodes: ${r.spatialNodes.total} (s:${r.spatialNodes.static} l:${r.spatialNodes.live} t:${r.spatialNodes.temporal})`,
    `    temporal trail: ${r.temporalTrail?.count ?? 0} markers`,
    `    causal map: ${r.causalMap?.nodeCount ?? 0} nodes / ${r.causalMap?.edgeCount ?? 0} edges (compressed:${r.causalMap?.compressed ? "yes" : "no"} ratio:${r.causalMap?.compression?.compressionRatio ?? 0})`,
    `    causal map raw: ${r.causalMap?.causalMapRaw?.nodeCount ?? 0} nodes / ${r.causalMap?.causalMapRaw?.edgeCount ?? 0} edges`,
    `    event→graph bridge: commits ${r.eventGraphBridge?.stats?.committed ?? 0} · last ${r.eventGraphBridge?.stats?.lastSource ?? "—"} · genesis stream ${r.genesisStream?.status ?? "not_wired"}${r.genesisStream?.lastPollHttpStatus ? ` (poll ${r.genesisStream.lastPollHttpStatus})` : ""}`,
    `    truth loss: ${
      r.evaluation?.structuralTruthPass
        ? `structural ok (intentional:${r.causalMap?.truthLoss?.intentionalLossCount ?? 0})`
        : `STRUCTURAL FAIL (${r.causalMap?.truthLoss?.structuralLossCount ?? 0})`
    }`,
    `    compression budget: ${r.evaluation?.compressionBudget?.withinBudget ? "within policy" : "review"}`,
    `    conflicts: ${r.liveConflicts?.structuralPass ? "none (structural)" : r.liveConflicts?.structuralConflictCount ?? 0}`,
    `    probe mode: ${r.evaluation?.probeMode ?? "none"}`,
    `    truthTrace: ${r.truthTrace.enabled ? "on" : "off"} (${r.truthTrace.count} entries)`,
    `    spatial gate: ${r.spatialReadyGate?.open ? "open" : "buffered"} (renderer:${r.rendererRegistry?.activeRenderer ?? "none"} cesium:${r.spatialReadyGate?.cesiumReady ? "ready" : "pending"} buf:${r.spatialReadyGate?.buffered ?? 0})`,
    `    ws: ${r.websocket?.httpFallbackActive ? "HTTP fallback active" : r.websocket?.configured ? "configured" : "missing"}`,
    `    voice out: ${r.epistemicSubstrate?.voiceOutput?.ttsAvailable ? "tts" : "text-buffer"} (never dead)`,
    `    compute adapter: ${r.epistemicSubstrate?.computeAdapter?.note ?? "isolated from voice"}`,
    `    identity SSOT: ${r.epistemicSubstrate?.identityEventLog?.count ?? 0} events · lifecycle resets ${r.epistemicSubstrate?.identityLifecycle?.resets ?? 0}`,
    `    live layer: ${r.epistemicSubstrate?.liveLayer?.blocksOnGovernance === false ? "critical path (0-50ms)" : "n/a"} · last latency ${r.epistemicSubstrate?.liveLayer?.lastEmit?.latencyMs ?? "—"}ms`,
    `    thinking layer: ${r.epistemicSubstrate?.thinkingLayer?.blocksExecution === false ? "async observation" : "n/a"} · observations ${r.epistemicSubstrate?.thinkingLayer?.observationCount ?? 0}`,
    `    pulse loop: ${r.epistemicSubstrate?.pulseLoop?.unified ? `seq ${r.epistemicSubstrate?.pulseLoop?.seq ?? 0} (${r.epistemicSubstrate?.pulseLoop?.role ?? "live_first"})` : "off"} · god-loop mitigated: ${r.epistemicSubstrate?.pulseLoop?.godLoopRiskMitigated ?? "n/a"}`,
    `    governance: semantic mass ${r.epistemicSubstrate?.semanticFilter?.semanticMass ?? 0} · noise ${((r.epistemicSubstrate?.semanticFilter?.noiseRatio ?? 0) * 100).toFixed(0)}%`,
    `    grounding: ${r.epistemicSubstrate?.groundingLayer?.worldAnchored ? "world-anchored" : "internal-only"} · ext ${r.epistemicSubstrate?.groundingLayer?.externalMass ?? 0} / int ${r.epistemicSubstrate?.groundingLayer?.internalMass ?? 0}`,
    `    UI contract: ${r.epistemicSubstrate?.outputContractConsumer?.contractAware ? "aware" : "pending"} (violations ${r.epistemicSubstrate?.outputContractConsumer?.violationCount ?? 0})`,
    `    identity loop: ${r.epistemicSubstrate?.identityContinuity?.turnCount ?? 0} turns · state ${r.epistemicSubstrate?.continuityKernel?.state ?? "idle"}`,
    `    persona scheduler: ${r.epistemicSubstrate?.personaScheduler?.mounted ? "mounted (pulse-driven)" : "off"}`,
    "───────────────────────────────────────────",
    "  PRESENCE RUNTIME",
    `    architecture: ${r.presenceRuntime?.architecture ?? "n/a"}`,
    `    live path: ${r.presenceRuntime?.livePathPass ? "✔ instant (0-50ms)" : "✘ review"}`,
    `    last live emit: ${r.presenceRuntime?.lastLivePresence?.latencyMs ?? "—"}ms · spoke:${r.presenceRuntime?.lastLivePresence?.spoke ?? "—"} · governance-block:${r.presenceRuntime?.lastLivePresence?.blockingGovernance ?? "—"}`,
    `    instant presence: ${r.presenceRuntime?.instantPresenceTriggered ? "✔ triggered (primitive/live)" : r.presenceRuntime?.instantPresence?.handled ? `✔ ${r.presenceRuntime.instantPresence.latencyClass}` : "not yet triggered"}`,
    `    pulse health: ${r.presenceRuntime?.pulseLoop?.systemHealth?.healthy !== false ? "healthy" : `degraded (${(r.presenceRuntime?.pulseLoop?.systemHealth?.degradedStages || []).map((d) => d.stage).join(", ")})`}`,
    `    thinking queue: ${r.presenceRuntime?.thinkingLayer?.queueDepth ?? 0} · observations ${r.presenceRuntime?.thinkingLayer?.observationCount ?? 0}`,
    `    presence primitive: ${r.presenceRuntime?.presencePrimitive?.emitCount ?? 0} acts · boot ${r.presenceRuntime?.presencePrimitive?.bootFired ? "fired" : "pending"} · last ${r.presenceRuntime?.presencePrimitive?.lastEmit?.act ?? "—"}`,
    "    speech:",
    `      accepted: ${r.presenceRuntime?.transcriptAcceptance?.accepted ?? 0}`,
    `      rejected: ${r.presenceRuntime?.transcriptAcceptance?.rejected ?? 0}`,
    `      deferred: ${r.presenceRuntime?.transcriptAcceptance?.deferred ?? 0}`,
    `      rejection reasons: ${formatRejectionReasonsV0(r.presenceRuntime?.transcriptAcceptance)}`,
    `      accept rate: ${r.presenceRuntime?.transcriptAcceptance?.acceptRate ?? "—"} · reject rate: ${r.presenceRuntime?.transcriptAcceptance?.rejectRate ?? "—"}`,
    `      suspected false negatives: ${r.presenceRuntime?.transcriptAcceptance?.suspectedFalseNegatives ?? 0}`,
    `      last rejection: ${formatLastRejectionForensicsV0(r.presenceRuntime?.transcriptAcceptance?.lastRejection)}`,
    `      turn gap: ${r.presenceRuntime?.transcriptAcceptance?.turnGap ? "yes — heard but no accepted turn" : "no"}`,
    `      ledger tail: window.__rhizoh.transcriptAcceptance.tail (last 20 full records)`,
    "───────────────────────────────────────────",
    "  NETWORK SURFACE",
    `    map pins: spiral ${r.networkSurface?.mapPins?.spiralContinent ?? 0} · distributed ${r.networkSurface?.mapPins?.distributed ?? 0} · unique coords ${r.networkSurface?.mapPins?.uniqueCoords ?? 0}`,
    `    pin types: ${Object.entries(r.networkSurface?.mapPins?.pinTypes || {}).map(([k, v]) => `${k}:${v}`).join(", ") || "—"}`,
    `    towers: explorer/castle/economy/seasonal layers registered (${Object.keys(r.networkSurface?.towers?.towerClasses || {}).length} classes)`,
    `    llm towers: ${r.networkSurface?.llmTowers?.count ?? 0} — ${(r.networkSurface?.llmTowers?.towerLabels || []).join(", ") || "—"} + portal`,
    `    llm tower fit: __rhizoh.fitAllLlmTowers()  (World · Space map)`,
    `    spiral journey: countdown ${r.networkSurface?.spiralJourney?.countdownRemaining ?? "—"} · legalHold ${r.networkSurface?.spiralJourney?.legalHold ? "yes" : "no"} · ack ${r.networkSurface?.spiralJourney?.legalAcked ? "yes" : "no"}`,
    `    voice citizenship: ${r.networkSurface?.gatewayRegistration?.voiceCitizenship ?? "—"} · session ${r.networkSurface?.gatewayRegistration?.voiceSessionId ?? "—"}`,
    `    tower citizenship: ${r.networkSurface?.gatewayRegistration?.towerCitizenship ?? "—"} · registered ${r.networkSurface?.gatewayRegistration?.towerRegisteredCount ?? 0}/7 · active ${r.networkSurface?.gatewayRegistration?.towerActiveId ?? "—"}`,
    `    media citizenship: ${r.networkSurface?.gatewayRegistration?.mediaCitizenship ?? "—"} · registered ${r.networkSurface?.gatewayRegistration?.mediaRegisteredCount ?? 0} · active ${r.networkSurface?.gatewayRegistration?.mediaActiveChannelId ?? "—"}`,
    `    broadcast: ack ${r.networkSurface?.gatewayRegistration?.broadcastAck ?? 0} · delivered ${r.networkSurface?.gatewayRegistration?.broadcastDelivered ?? 0}`,
    `    gateway services: voice ${r.networkSurface?.gatewayRegistration?.voiceGatewayMounted ? "mounted" : "off"} · tower ${r.networkSurface?.gatewayRegistration?.towerGatewayMounted ? "mounted" : "off"} · media ${r.networkSurface?.gatewayRegistration?.mediaGatewayMounted ? "mounted" : "off"} · registry ${r.networkSurface?.gatewayRegistration?.gatewayServiceMounted ? "mounted" : "off"}`,
    `    invite ops: ${r.networkSurface?.inviteOps?.lastGenerated?.role ? `last ${r.networkSurface.inviteOps.lastGenerated.role}` : "none generated this session"}`,
    `    ticket graph: ${r.networkSurface?.ticketGraph?.mounted ? `mounted · ingest ${r.networkSurface?.ticketGraph?.liveIngestCount ?? 0}` : "not mounted"}`,
    "───────────────────────────────────────────",
    "  WORLD BRIDGE (Layer 2)",
    `    calendar: ${r.worldBridge?.calendar?.recentCount ?? 0} events · space ${r.worldBridge?.calendar?.spaceId ?? "—"} · api ${r.worldBridge?.surfaceBound?.ingestCalendarEvent ? "bound" : "off"}`,
    `    media: ${r.worldBridge?.media?.recentCount ?? 0} events · space ${r.worldBridge?.media?.spaceId ?? "—"} · api ${r.worldBridge?.surfaceBound?.ingestMediaEvent ? "bound" : "off"}`,
    `    user activity: ${r.worldBridge?.userActivity?.recentCount ?? 0} events · space ${r.worldBridge?.userActivity?.spaceId ?? "—"} · api ${r.worldBridge?.surfaceBound?.ingestUserActivity ? "bound" : "off"}`,
    `    life shadow: ${r.worldBridge?.lifeShadow?.calendarEventCount ?? 0} entries · dayA ${r.worldBridge?.lifeShadow?.branches?.shadow_day_a ?? 0} · dayB ${r.worldBridge?.lifeShadow?.branches?.shadow_day_b ?? 0}`,
    `    media shadow: ${r.worldBridge?.mediaShadow?.eventCount ?? 0} entries · immersive ${r.worldBridge?.mediaShadow?.branches?.shadow_immersive ?? 0} · scattered ${r.worldBridge?.mediaShadow?.branches?.shadow_scattered ?? 0}`,
    `    day A/B: dayA ${r.worldBridge?.lifeShadowDayAb?.dayA ?? 0} · dayB ${r.worldBridge?.lifeShadowDayAb?.dayB ?? 0} · dominant ${r.worldBridge?.lifeShadowDayAb?.dominantBranch ?? "—"}`,
    `    memory graph: ${r.worldBridge?.memoryGraph?.nodeCount ?? 0} nodes · ${Object.entries(r.worldBridge?.memoryGraph?.bySource || {}).map(([k, v]) => `${k}:${v}`).join(", ") || "—"}`,
    `    fusion lanes: cal ${r.worldBridge?.fusionLanes?.calendarPresent ? `on (${r.worldBridge.fusionLanes.calendarWeight})` : "off"} · media ${r.worldBridge?.fusionLanes?.mediaPresent ? `on (${r.worldBridge.fusionLanes.mediaWeight})` : "off"} · activity ${r.worldBridge?.fusionLanes?.userActivityPresent ? `on (${r.worldBridge.fusionLanes.userActivityWeight})` : "off"}`,
    `    execution permission: ${r.worldBridge?.executionPermission?.executionClass ?? "—"} · mutation ${r.worldBridge?.executionPermission?.mutationPermitted ? "on" : "off"}`,
    `    media feedback loop: ${r.worldBridge?.mediaFeedbackLoop?.cycleCount ?? 0} cycles`,
    `    shadow writeback: ${r.worldBridge?.shadowWriteback?.projectionCount ?? 0} ledger projections`,
    `    habitat climate: ${r.worldBridge?.habitatClimate?.climateLabel ?? "—"} · memory ${r.worldBridge?.habitatClimate?.memoryNodeCount ?? 0}`,
    `    console: __rhizoh.ingestCalendarEvent() · __rhizoh.ingestMediaEvent() · __rhizoh.mediaFeedbackLoop() · __rhizoh.habitatClimate()`,
    "───────────────────────────────────────────",
    "  ACADEMY LEARNING UNION",
    `    union: ${r.academyLearning?.unionLabel ?? "—"} · dominant ${r.academyLearning?.dominantDiscipline ?? "—"} · armed ${r.academyLearning?.armedDisciplineCount ?? 0}/3`,
    `    moves: chess ${r.academyLearning?.disciplines?.chess?.movesSeen ?? 0} · go ${r.academyLearning?.disciplines?.go?.movesSeen ?? 0} · checkers ${r.academyLearning?.disciplines?.checkers?.movesSeen ?? 0} · total ${r.academyLearning?.totalMovesSeen ?? 0}`,
    `    batches: total ${r.academyLearning?.totalBatchesFlushed ?? 0}`,
    `    console: __rhizoh.academyLearningUnion() · await __rhizoh.wireAcademyLearningUnion({ demoMove: true })`,
    "───────────────────────────────────────────",
    "  LIFE OS v0.1",
    `    status: ${r.lifeOsV01?.status ?? "—"} · ${r.lifeOsV01?.honestLabel ?? ""}`,
    `    world bridge: cal ${r.lifeOsV01?.worldBridge?.calendarEvents ?? 0} · media ${r.lifeOsV01?.worldBridge?.mediaEvents ?? 0} · memory ${r.lifeOsV01?.worldBridge?.memoryNodeCount ?? 0}`,
    `    habitat: ${r.lifeOsV01?.habitatClimate?.climateLabel ?? "—"} · branch ${r.lifeOsV01?.habitatClimate?.dominantBranch ?? "—"}`,
    `    governance: mutation ${r.lifeOsV01?.governance?.mutationPermitted ? "on" : "off"} · ${r.lifeOsV01?.governance?.governanceMode ?? "—"}`,
    `    academy parity: go ${r.lifeOsV01?.academy?.goParity ? "✔" : "◐"} · checkers ${r.lifeOsV01?.academy?.checkersParity ? "✔" : "◐"}`,
    `    console: __rhizoh.lifeOsStatus()`,
    "───────────────────────────────────────────",
    "  STUDIO VISIBILITY",
    `    life os: ${r.studioVisibility?.lifeOsStatus ?? "—"} · memory ${r.studioVisibility?.memoryNodeCount ?? 0} · climate ${r.studioVisibility?.climateLabel ?? "—"}`,
    `    fusion seq: ${r.studioVisibility?.fusionSeq ?? 0} · academy ${r.studioVisibility?.academyUnionLabel ?? "—"} · learning armed ${r.studioVisibility?.armedLearningCount ?? 0}/3`,
    `    console: __rhizoh.studioVisibility() · Studio drawer Life Memory panel`,
    "───────────────────────────────────────────",
    "  EPISTEMIC SUBSTRATE",
    `    turn sovereignty: ${r.epistemicSubstrate?.turnSovereignty?.sovereignReality ?? "none"} (${r.epistemicSubstrate?.turnSovereignty?.enforcement ?? "log_only"})`,
    `    behavior consistency: ${r.epistemicSubstrate?.behaviorConsistency?.sampleSize ?? 0} turns`,
    `    behavioral drift: ${r.epistemicSubstrate?.behavioralDrift?.metrics?.identityCoherenceMetric ?? "n/a"} coherence`,
    `    calibration governor: ${r.epistemicSubstrate?.calibrationGovernor?.pendingCount ?? 0} pending`,
    `    truth loss narrative: ${r.causalMap?.truthLoss?.selfExplanation ?? "n/a"}`,
    `    compression narrative: ${r.evaluation?.compressionBudget?.narrative ?? "n/a"}`,
    `    conflict narrative: ${r.liveConflicts?.selfExplanation ?? "n/a"}`,
    "  CONSOLE APIS",
    ...(r.epistemicSubstrate?.consoleApis || []).map((api) => `    ${api}`),
    "───────────────────────────────────────────"
  ];

  if (r.probe) {
    lines.push("  GATE PROBE");
    for (const g of r.probe.gates) {
      lines.push(
        `    ${g.gateOk ? "✔" : "✘"} ${g.label.padEnd(18)} ${g.path} → ${g.resolvedDomain}`
      );
    }
    lines.push("  LIVE OPS");
    for (const op of r.probe.liveOps) {
      lines.push(`    ${op.ok ? "✔" : "✘"} ${op.name}`);
    }
    lines.push(`  audit: ${r.probe.consistencyAudit.pass ? "✔ consistent" : "✘ drift"}`);
  }

  if (r.audit && !r.probe) {
    lines.push("  CONSISTENCY AUDIT");
    lines.push(
      `    structural: ${r.audit.structuralPass ? "✔" : "✘"} · spatial: ${r.audit.spatialSurfaceStatus ?? (r.audit.axes?.spatialDrift?.status ?? "—")}`
    );
    for (const [key, axis] of Object.entries(r.audit.axes)) {
      const glyph =
        axis.status === "pending" ? "⏳" : axis.pass ? "✔" : "✘";
      lines.push(`    ${glyph} ${key}${axis.pendingReason ? ` (${axis.pendingReason})` : ""}`);
    }
  }

  lines.push("═══════════════════════════════════════════", "");
  const text = lines.join("\n");
  if (typeof console !== "undefined") console.log(text);
  return text;
}

/**
 * Mount console helpers (browser only).
 */
export function mountFullSystemReportConsoleV0() {
  if (typeof window === "undefined" || consoleMounted) return;
  consoleMounted = true;

  window.__RHIZOH_FULL_REPORT__ = async (opts = {}) => {
    const report = runFullSystemReportV0({
      probe: opts.probe === true,
      probeLive: opts.probeLive === true,
      probeIsolated: opts.probeIsolated !== false,
      audit: opts.audit !== false,
      restorePath: opts.restorePath !== false,
      ...opts
    });
    if (opts.print !== false) printFullSystemReportV0(report);
    return report;
  };
  window.__RHIZOH_PRINT_REPORT__ = printFullSystemReportV0;
  window.__RHIZOH_PROBE_GATES__ = runFullSystemProbeIsolatedV0;
  window.__RHIZOH_PROBE_GATES_LIVE__ = runFullSystemProbeV0;

  if (typeof console !== "undefined") {
    console.info(
      "[Rhizoh] Full report: await __RHIZOH_FULL_REPORT__()  |  Quick: __RHIZOH_PRINT_REPORT__()"
    );
  }
}

/** @internal vitest */
export function __resetFullSystemReportConsoleForTestV0() {
  consoleMounted = false;
}
