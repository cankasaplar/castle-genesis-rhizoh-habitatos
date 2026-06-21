/**
 * Domain nervous system — gate sync, share invite, config truth, explicit capability dispatch.
 * Domains talk through adapters + passDomainStateV0 only — no implicit cross-runtime reads.
 */

import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { isWorldLayerEnabled } from "./castleWorldLayerGateV0.js";
import { getWorldExecutionModeV0 } from "./worldExecutionGateV0.js";
import {
  bootstrapRhizohDomainGateV0,
  resolveDomainIdFromPathV0,
  RHIZOH_DOMAIN_ID_V0
} from "./rhizohDomainGateV0.js";
import { syncRhizohDomainCoreStoreV0 } from "./rhizohDomainCoreStoreV0.js";
import { resolveWorldDomainFromPathV0 } from "./rhizohWorldDomainRoutesV0.js";
import { invokeDomainCapabilityV0 } from "./rhizohTensorBridgeV0.js";
import { getTruthTraceSnapshotV0 } from "./rhizohTruthTraceLayerV0.js";
import { replayTensorIntentV0 } from "./rhizohTensorReplayV0.js";
import { getExplanationSnapshotV0 } from "./rhizohExplanationLayerV0.js";
import { getTraceSamplingSnapshotV0 } from "./rhizohTraceSamplingV0.js";
import {
  runLiveConsistencyAuditV0,
  getLiveConsistencyAuditSnapshotV0
} from "./rhizohLiveConsistencyAuditV0.js";
import { mountEpistemicAuditBundleConsoleV0 } from "./epistemicAuditBundleV0.js";
import { mountEpistemicIdentityContinuityConsoleV0 } from "./epistemicIdentityContinuityV0.js";
import { mountIdentityManifestConsoleV0 } from "./identityManifestProjectionV0.js";
import { mountFullSystemReportConsoleV0 } from "./rhizohFullSystemReportV0.js";
import { mountPersonaLoopSchedulerV0 } from "./rhizohPersonaLoopSchedulerV0.js";
import { mountRhizohPulseLoopV1 } from "./rhizohPulseLoopV1.js";
import { mountOutputContractConsumerV0 } from "./rhizohOutputContractConsumerV0.js";
import { getLiveLayerSnapshotV0 } from "./rhizohLiveLayerV0.js";
import { getThinkingLayerSnapshotV0 } from "./rhizohThinkingLayerV0.js";
import { ensureVoiceAdapterRegistered } from "./voiceInputAdapterRegistryV0.js";
import { resolveGatewayTransportV0 } from "./rhizohGatewayTransportFallbackV0.js";
import {
  getSpatialReadyGateSnapshotV0,
  installSpatialReadyGateWireV0
} from "./rhizohSpatialReadyGateV0.js";
import { emitSpatialEventImmediateV0 } from "./rhizohSpatialEventEmitterV0.js";
import { reconcileDomainPathCoherenceV0 } from "./rhizohDomainCoherenceV0.js";
import { publishCausalMapLayerV0 } from "./rhizohCausalMapLayerV0.js";
import { publishSpatialReplayEngineV0 } from "./rhizohSpatialReplayEngineV0.js";
import { publishLiveConflictDetectorV0 } from "./rhizohLiveConflictDetectorV0.js";
import { ensureGenesisContinuityClientWireV0 } from "./genesisContinuityClientWireV0.js";
import { ensureOntologicalRepairProtocolV1 } from "./ontologicalRepairProtocolV1.js";
import { startSpatialExecutionTickV0 } from "./spatialExecutionTickV0.js";
import { attachSpatialWorldAdapterV0 } from "./spatialWorldAdapterV0.js";
import { isRhizohSpatialExecutionAllowedV0 } from "./rhizohWorldNamespaceGateV0.js";

export const RHIZOH_NERVOUS_SYSTEM_EVENT_V0 = "rhizoh:nervous-system-v0";

/** @type {(() => void) | null} */
let stopSpatialReadyGateWire = null;
let spatialExecutionTickStarted = false;

function ensureSpatialReadyGateWireV0() {
  if (typeof window === "undefined" || stopSpatialReadyGateWire) return;
  stopSpatialReadyGateWire = installSpatialReadyGateWireV0(emitSpatialEventImmediateV0);
}

function ensureSpatialExecutionTickV0() {
  if (typeof window === "undefined" || spatialExecutionTickStarted) return;
  if (!isRhizohSpatialExecutionAllowedV0()) return;
  spatialExecutionTickStarted = true;
  attachSpatialWorldAdapterV0();
  startSpatialExecutionTickV0();
}

/** World · Space — start 50ms spatial tick after map is interactive. */
export function startRhizohSpatialExecutionTickV0() {
  ensureSpatialExecutionTickV0();
}

/**
 * Bootstrap domain gate from pathname — call on every route sync.
 * @param {string} pathname
 * @param {{ fromDomain?: string, passPayload?: unknown, userId?: string | null, coreOnly?: boolean }} [ctx]
 */
export function runDomainGateForPathV0(pathname, ctx = {}) {
  const p = String(pathname || "/").trim();
  const domain = resolveDomainIdFromPathV0(p);
  const worldDomain = resolveWorldDomainFromPathV0(p);

  syncRhizohDomainCoreStoreV0({
    pathname: p,
    activeDomain: domain,
    worldDomain
  });

  const gate = bootstrapRhizohDomainGateV0(domain, {
    pathname: p,
    worldDomain,
    fromDomain: ctx.fromDomain,
    passPayload: ctx.passPayload,
    userId: ctx.userId
  });

  reconcileDomainPathCoherenceV0(p);
  const causalMap = publishCausalMapLayerV0();
  publishSpatialReplayEngineV0();
  const liveConflicts = publishLiveConflictDetectorV0(p);

  if (typeof window !== "undefined") {
    ensureSpatialReadyGateWireV0();
    if (!ctx.coreOnly) {
      ensureSpatialExecutionTickV0();
    }
    window.__RHIZOH_NERVOUS_SYSTEM__ = Object.freeze({
      schema: "rhizoh.nervous_system.v1",
      pathname: p,
      domain,
      worldDomain,
      gate,
      health: gate.health ?? null,
      controlPlane: gate.controlPlane ?? null,
      safeUiMode: gate.safeUiMode === true,
      spatialReadyGate: getSpatialReadyGateSnapshotV0(),
      truthTrace: getTruthTraceSnapshotV0(),
      explanation: getExplanationSnapshotV0(),
      traceSampling: getTraceSamplingSnapshotV0(),
      liveConsistencyAudit: getLiveConsistencyAuditSnapshotV0(),
      causalMap,
      liveConflicts,
      config: getRhizohNervousSystemConfigV0()
    });
    window.__RHIZOH_TRUTH_TRACE__ = getTruthTraceSnapshotV0();
    window.__RHIZOH_EXPLANATION__ = getExplanationSnapshotV0();
    window.__RHIZOH_REPLAY_TENSOR__ = replayTensorIntentV0;
    window.__RHIZOH_RUN_MAP_AUDIT__ = runLiveConsistencyAuditV0;
    mountFullSystemReportConsoleV0();
    mountEpistemicAuditBundleConsoleV0();
    mountEpistemicIdentityContinuityConsoleV0();
    mountIdentityManifestConsoleV0();
    ensureVoiceAdapterRegistered();
    resolveGatewayTransportV0();
    mountPersonaLoopSchedulerV0();
    mountRhizohPulseLoopV1();
    mountOutputContractConsumerV0();
    ensureGenesisContinuityClientWireV0();
    ensureOntologicalRepairProtocolV1();
    getLiveLayerSnapshotV0();
    getThinkingLayerSnapshotV0();
    window.dispatchEvent(
      new CustomEvent(RHIZOH_NERVOUS_SYSTEM_EVENT_V0, {
        detail: Object.freeze({ pathname: p, domain, gate })
      })
    );
  }

  return gate;
}

/**
 * @returns {{ gateway: boolean, cesium: boolean, mapbox: boolean, worldLayer: boolean, executionMode: string }}
 */
export function getRhizohNervousSystemConfigV0() {
  let cfg = {};
  try {
    cfg = getCastleFlightConfig();
  } catch {
    cfg = {};
  }
  return Object.freeze({
    gateway: Boolean(cfg.rhizohLlmHttp || cfg.gatewayWs),
    cesium: Boolean(cfg.cesiumIonToken),
    mapbox: Boolean(cfg.mapboxToken),
    worldLayer: isWorldLayerEnabled(),
    executionMode: getWorldExecutionModeV0()
  });
}

/**
 * Share cohort invite URL + export pack to clipboard/download.
 * @param {{ reviewerId?: string, label?: string, sessionNotes?: string }} [opts]
 */
export async function shareWorldInviteV0(opts = {}) {
  const { buildCohortInviteUrlV0, buildCohortInvitePackV0, exportCohortInvitePackV0 } =
    await import("../cohort/cohortInvitePackV0.js");

  const pack = buildCohortInvitePackV0(opts);
  const url = pack.inviteUrl || buildCohortInviteUrlV0(opts);
  const exported = await exportCohortInvitePackV0(pack);

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* pack export may have succeeded via download */
    }
  }

  return Object.freeze({
    ok: true,
    url,
    method: exported.method || "url",
    messageTr: "Davet bağlantısı panoya kopyalandı.",
    messageEn: "Invite link copied to clipboard."
  });
}

/**
 * Dispatch domain capability through tensor bridge (explicit, logged).
 * @param {string} domain
 * @param {string} capability
 * @param {object} [request]
 */
export function dispatchDomainCapabilityV0(domain, capability, request = {}) {
  return invokeDomainCapabilityV0(domain, capability, {
    ...request,
    source: request.source || "nervous_system"
  });
}

/**
 * Castle domain side-effect — presence mesh hint (actual mesh starts from route effect).
 * @param {string} action
 * @param {object} [detail]
 */
export function signalCastlePresenceV0(action, detail = {}) {
  dispatchDomainCapabilityV0(RHIZOH_DOMAIN_ID_V0.CASTLE, "presence", { action, ...detail });
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rhizoh:castle-presence-v0", {
        detail: Object.freeze({ action, ...detail, atMs: Date.now() })
      })
    );
  }
}
