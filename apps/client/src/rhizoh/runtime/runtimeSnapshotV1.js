/**
 * Unified runtime snapshot for debug / replay / incident export (not SSOT for execution).
 *
 * @see docs/RHIZOH_RUNTIME_FRAME_CORRELATION_V0.md
 */

import { loadRhizohProductSession } from "../product/rhizohProductSessionPersistenceV1.js";
import { getRuntimeFrameId, computeGatewayFlapPressure } from "./runtimeFrameCorrelationV0.js";
import { syncStudioRenderCapabilityProbe } from "./studioCapabilityProbeV0.js";
import { readRhizohContinuityMetaDiskV0 } from "./rhizohContinuityDiskMetaV0.js";
import { resolveActiveRuntimeIdentity } from "./runtimeIdentityMergePolicyV0.js";
import { getConnectionId } from "./gatewayIdentityStoreV0.js";
import {
  peekRhizohMessageIntentQueueLength,
  RHIZOH_OFFLINE_INTENT_QUEUE_POLICY
} from "./gatewayOfflineEventBufferPolicyV0.js";
import { logRuntimeSnapshotValidationIssues } from "./runtimeSnapshotValidateV0.js";

const SNAPSHOT_SS = "castle.runtime_snapshot.v1";

/** Stabilization graph lock line (Vite `define`, build-time). */
// eslint-disable-next-line no-undef -- replaced at bundle time
const FREEZE_GRAPH_LOCK_INJECTED =
  typeof __CASTLE_STABILIZATION_GRAPH_SHA256_LOCK__ !== "undefined"
    ? String(__CASTLE_STABILIZATION_GRAPH_SHA256_LOCK__ || "")
    : "";

/** @type {{ connectionId?: string, gatewayUx?: object | null, studioCapability?: object | null, voice?: object | null, studioRuntimeProfile?: object | null, _contextUpdatedAt?: number }} */
let _ctx = {
  connectionId: "",
  gatewayUx: null,
  studioCapability: null,
  voice: null,
  studioRuntimeProfile: null,
  _contextUpdatedAt: 0
};

/**
 * App shell updates gateway / voice / studio warm path; connectionId when UI exposes it.
 * @param {Record<string, unknown>} partial
 */
export function updateRuntimeSnapshotContext(partial) {
  if (!partial || typeof partial !== "object") return;
  _ctx = {
    ..._ctx,
    ...partial,
    _contextUpdatedAt: Date.now()
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildRuntimeSnapshotV1() {
  const meta = readRhizohContinuityMetaDiskV0();
  const product = loadRhizohProductSession(meta);
  const flap = computeGatewayFlapPressure();
  let lastFirestoreReject = null;
  let mergeId = null;
  try {
    if (typeof window !== "undefined") {
      lastFirestoreReject = window.__CASTLE_LAST_FIRESTORE_REJECT__ || null;
      mergeId = window.__CASTLE_LAST_MERGE_ID__ || null;
    }
  } catch {
    /* noop */
  }
  const cap = _ctx.studioCapability && typeof _ctx.studioCapability === "object" ? _ctx.studioCapability : null;
  const connId = getConnectionId();
  const conn = connId ? String(connId) : "";
  const activeRuntimeIdentity = resolveActiveRuntimeIdentity({ connectionId: conn });
  const studioProfile =
    _ctx.studioRuntimeProfile && typeof _ctx.studioRuntimeProfile === "object" ? _ctx.studioRuntimeProfile : null;
  const snap = {
    schema: "runtimeSnapshot.v1",
    timestamp: Date.now(),
    frameId: getRuntimeFrameId(),
    sessionId: String(product?.sessionId || ""),
    connectionId: conn,
    traceId: null,
    freezeGraphLockSha256: FREEZE_GRAPH_LOCK_INJECTED || null,
    activeRuntimeIdentity,
    gatewayState: _ctx.gatewayUx && typeof _ctx.gatewayUx === "object" ? { ..._ctx.gatewayUx } : null,
    gatewayFlapPressure: flap,
    offlineIntentQueue: {
      length: peekRhizohMessageIntentQueueLength(),
      policy: RHIZOH_OFFLINE_INTENT_QUEUE_POLICY
    },
    lastFatal: readLastFatal(),
    lastFirestoreReject,
    studioCapability: {
      sync: syncStudioRenderCapabilityProbe(),
      warmSwarm: cap?.warm && typeof cap.warm === "object" ? { ...cap.warm } : null,
      warmRecordedAt: cap?.at != null ? Number(cap.at) : null,
      degradation: studioProfile,
      note:
        "WebGPU adapter null / MetaMask / COOP = environment fragmentation; use degradation.tier + reasons, not a single Studio crash."
    },
    voice: _ctx.voice && typeof _ctx.voice === "object" ? { ..._ctx.voice } : null,
    mergeId,
    contextUpdatedAt: _ctx._contextUpdatedAt || null
  };
  logRuntimeSnapshotValidationIssues(snap);
  return snap;
}

export function persistRuntimeSnapshotV1() {
  try {
    sessionStorage.setItem(SNAPSHOT_SS, JSON.stringify(buildRuntimeSnapshotV1()));
  } catch {
    /* noop */
  }
}

function readLastFatal() {
  try {
    if (typeof window !== "undefined" && window.__CASTLE_LAST_FATAL__) return window.__CASTLE_LAST_FATAL__;
  } catch {
    /* noop */
  }
  try {
    const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("castle.last_fatal.v1") : "";
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
