/**
 * Authority Epoch Merge Event v1 — bidirectional causal assimilation (not override).
 * Epoch = namespace / causal domain — merge creates a new branch, deletes no history.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_EPOCH_MERGE_EVENT_V1.md
 */

import { getRhizohGatewayHealthBase } from "../useRhizohGatewayMonitor.js";
import { buildEpistemicTransportHeadersV0 } from "../epistemic/epistemicLedgerStreamV529.js";
import { getAuthorityEpochSnapshotV1 } from "./authorityEpochBoundaryV1.js";
import { getLastSemanticRealityFieldV1 } from "./unifiedSemanticRealityFieldV1.js";
import { getAuthorityGatewayBridgeSnapshotV1 } from "./authorityGatewayPersistenceBridgeV1.js";
import {
  getAuthorityLedgerSnapshotV1,
  replayAuthorityLedgerV1
} from "./authorityLedgerSealPipelineV1.js";
import { crossEpochDeterministicReplayV1 } from "./crossEpochDeterministicReplayV1.js";
import {
  projectUnifiedSemanticRealityFieldV1,
  setLastSemanticRealityFieldV1
} from "./unifiedSemanticRealityFieldV1.js";
import {
  generatePrismCubesFromSemanticFieldV0,
  setLastPrismCubeEngineResultV0
} from "./prismCubeEngineV0.js";
import {
  allocateSpatialSlotsV0,
  setLastSpatialAllocationV0
} from "./spatialAllocationLayerV0.js";
import {
  bindArenasToPlacedCubesV0,
  setLastArenaBindingV0
} from "./arenaBindingLayerV0.js";
import {
  resolveSpatialSlotsV0,
  setLastSpatialSlotResolverV0
} from "./spatialSlotResolverV0.js";
import {
  commitPrismCubesV0,
  setLastPrismCubeCommitV0
} from "./prismCubeCommitV0.js";
import {
  fetchGatewayAuthorityWitnessReplayV1,
  runAuthorityReplayAlignmentV1,
  workerAuthorityReplayAlignmentV1
} from "./workerAuthorityReplayAlignmentV1.js";

export const EPOCH_MERGE_EVENT_SCHEMA_V1 = "castle.rhizoh.epoch_merge_event.v1";
export const EPOCH_MERGE_EVENT_ROUTE_V1 = "/rhizoh/authority/epoch/merge";

export const MERGE_STRATEGY_V1 = Object.freeze({
  CAUSAL_ASSIMILATION: "causal_assimilation"
});

/** @type {object | null} */
let lastMergeEventV1 = null;
/** @type {object | null} */
let lastCrossEpochReplayV1 = null;

/**
 * @param {{
 *   clientLedger?: object,
 *   gatewayBridge?: object,
 *   alignment?: object
 * }} [ctx]
 */
export function buildEpochMergeEventPayloadV1(ctx = {}) {
  const clientLedger = ctx.clientLedger || getAuthorityLedgerSnapshotV1();
  const gatewayBridge = ctx.gatewayBridge || getAuthorityGatewayBridgeSnapshotV1();
  const alignment =
    ctx.alignment ||
    workerAuthorityReplayAlignmentV1({
      ledger: clientLedger,
      gatewayWitness: Object.freeze({
        chainHeight: gatewayBridge.lastWitnessedHeight,
        chainHead: gatewayBridge.lastGatewayWitness?.clientSealHash || null,
        epochId: gatewayBridge.lastGatewayWitness?.epochId || null,
        lastWitness: gatewayBridge.lastGatewayWitness
      })
    });

  const sourceEpoch = String(clientLedger?.epoch?.epochId || "").trim() || null;
  const targetEpoch =
    String(
      gatewayBridge?.lastGatewayWitness?.epochId ||
        alignment?.layers?.gateway?.epochId ||
        ""
    ).trim() || null;

  const clientHead = String(clientLedger?.sealChainHead || clientLedger?.lastSeal?.sealHash || "");
  const gatewayHead = String(
    gatewayBridge?.lastGatewayWitness?.clientSealHash ||
      alignment?.layers?.gateway?.sealHead ||
      ""
  );

  const clientEntries = Array.isArray(clientLedger?.recentEntries) ? clientLedger.recentEntries : [];
  const missingEntries = [];
  const overlappingSeals = [];
  for (const entry of clientEntries) {
    const epochId = String(entry?.epoch?.epochId || sourceEpoch || "");
    const height = Number(entry?.height || 0);
    const seal = String(entry?.seal?.sealHash || "");
    if (!epochId || !height || !seal) continue;
    const key = `${epochId}:${height}`;
    if (gatewayHead && seal === gatewayHead && height === clientLedger.ledgerHeight) {
      overlappingSeals.push(key);
    } else if (!gatewayBridge?.sharedOfficialHistory) {
      missingEntries.push(`gateway:${key}`);
    }
  }

  return Object.freeze({
    schema: EPOCH_MERGE_EVENT_SCHEMA_V1,
    sourceEpoch,
    targetEpoch,
    mergeStrategy: MERGE_STRATEGY_V1.CAUSAL_ASSIMILATION,
    clientHead: clientHead || null,
    gatewayHead: gatewayHead || null,
    divergence: alignment?.severity === "soft_drift" ? "soft_drift" : alignment?.severity || "soft_drift",
    strategy: MERGE_STRATEGY_V1.CAUSAL_ASSIMILATION,
    payload: Object.freeze({
      clientLedgerHead: clientHead || null,
      gatewayLedgerHead: gatewayHead || null,
      divergenceSignals: Object.freeze(alignment?.signals ? [...alignment.signals] : []),
      missingEntries: Object.freeze(missingEntries),
      overlappingSeals: Object.freeze(overlappingSeals)
    }),
    resolution: Object.freeze({
      mode: "append_only_reconciliation",
      rule: "preserve_both_histories"
    }),
    alignmentSnapshot: Object.freeze({
      divergenceType: alignment?.divergenceType || null,
      witnessPropagation: alignment?.witnessPropagation || null,
      sameTimeline: alignment?.sameTimeline ?? null
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} payload
 * @param {string} [idToken]
 */
export async function postEpochMergeEventV1(payload, idToken = "") {
  const base = getRhizohGatewayHealthBase();
  if (!base) return { ok: false, error: "no_gateway_base" };
  try {
    const res = await fetch(`${String(base).replace(/\/+$/, "")}${EPOCH_MERGE_EVENT_ROUTE_V1}`, {
      method: "POST",
      headers: buildEpistemicTransportHeadersV0(idToken),
      body: JSON.stringify(payload),
      ...(typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
        ? { signal: AbortSignal.timeout(12000) }
        : {})
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok) return { ok: false, error: j.error || `http_${res.status}`, body: j };
    return { ok: true, body: j };
  } catch (e) {
    return { ok: false, error: String(e?.message || e || "epoch_merge_post_failed") };
  }
}

/**
 * Assimilate client + gateway epochs — causal merge, no override.
 * @param {{ idToken?: string, fetchRemote?: boolean, alignment?: object }} [opts]
 */
export async function epochMergeAndAssimilateV1(opts = {}) {
  const clientLedger = getAuthorityLedgerSnapshotV1();
  const gatewayBridge = getAuthorityGatewayBridgeSnapshotV1();

  const alignment =
    opts.alignment ||
    (await runAuthorityReplayAlignmentV1({
      idToken: opts.idToken || "",
      fetchRemote: opts.fetchRemote !== false
    }));

  const payload = buildEpochMergeEventPayloadV1({ clientLedger, gatewayBridge, alignment });

  if (!payload.sourceEpoch) {
    return Object.freeze({
      ok: false,
      error: "client_epoch_missing",
      payload,
      interpretationOnly: true
    });
  }

  if (!payload.targetEpoch) {
    return Object.freeze({
      ok: false,
      error: "gateway_epoch_missing",
      payload,
      note: "incomplete witness propagation — merge deferred until gateway epoch present",
      interpretationOnly: true
    });
  }

  if (payload.sourceEpoch === payload.targetEpoch && alignment.aligned) {
    return Object.freeze({
      ok: true,
      mode: "noop_same_timeline",
      payload,
      alignment,
      note: "epochs already aligned — merge not required",
      interpretationOnly: true
    });
  }

  const remote = await postEpochMergeEventV1(
    {
      sourceEpoch: payload.sourceEpoch,
      targetEpoch: payload.targetEpoch,
      clientHead: payload.clientHead,
      gatewayHead: payload.gatewayHead,
      divergence: payload.divergence,
      strategy: payload.strategy,
      mergeStrategy: payload.mergeStrategy,
      clientEntries: clientLedger.recentEntries || []
    },
    opts.idToken || ""
  );

  if (!remote.ok) {
    return Object.freeze({
      ok: false,
      error: remote.error || "epoch_merge_failed",
      payload,
      alignment,
      interpretationOnly: true
    });
  }

  const mergeEvent = remote.body?.mergeEvent || null;
  lastMergeEventV1 = mergeEvent;

  const clientReplay = clientLedger.replay || replayAuthorityLedgerV1();
  let gatewayReplay = null;
  if (opts.fetchRemote !== false) {
    const gw = await fetchGatewayAuthorityWitnessReplayV1(
      opts.idToken || "",
      payload.targetEpoch || ""
    );
    gatewayReplay = gw.replay || null;
  }

  lastCrossEpochReplayV1 = crossEpochDeterministicReplayV1({
    clientReplay: Object.freeze({ ...clientReplay, epochId: payload.sourceEpoch }),
    gatewayReplay,
    mergeEvent
  });

  const semanticField = projectUnifiedSemanticRealityFieldV1({
    crossEpochReplay: lastCrossEpochReplayV1,
    mergeEvent,
    alignment
  });
  setLastSemanticRealityFieldV1(semanticField);

  const prismCubes = generatePrismCubesFromSemanticFieldV0({ semanticField, mergeEvent });
  setLastPrismCubeEngineResultV0(prismCubes);

  const spatialAllocation = allocateSpatialSlotsV0({ prismCubes });
  setLastSpatialAllocationV0(spatialAllocation);

  const arenaBinding = bindArenasToPlacedCubesV0({ spatialAllocation, mergeEvent });
  setLastArenaBindingV0(arenaBinding);

  const spatialSlotResolver = resolveSpatialSlotsV0({ arenaBinding });
  setLastSpatialSlotResolverV0(spatialSlotResolver);

  const prismCubeCommit = commitPrismCubesV0({ spatialSlotResolver });
  setLastPrismCubeCommitV0(prismCubeCommit);

  return Object.freeze({
    ok: true,
    mergeEvent,
    crossEpochReplay: lastCrossEpochReplayV1,
    semanticField,
    prismCubes,
    spatialAllocation,
    arenaBinding,
    spatialSlotResolver,
    prismCubeCommit,
    payload,
    alignment,
    output: mergeEvent?.output || null,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function getLastEpochMergeSnapshotV1() {
  return Object.freeze({
    schema: `${EPOCH_MERGE_EVENT_SCHEMA_V1}.snapshot`,
    lastMergeEvent: lastMergeEventV1,
    lastCrossEpochReplay: lastCrossEpochReplayV1,
    lastSemanticField: getLastSemanticRealityFieldV1(),
    currentEpoch: getAuthorityEpochSnapshotV1(),
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function ensureAuthorityEpochMergeEventV1() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.epochMergeAndAssimilate) {
    window.__rhizoh.epochMergeAndAssimilate = (opts) => epochMergeAndAssimilateV1(opts);
  }
  if (!window.__rhizoh.buildEpochMergePayload) {
    window.__rhizoh.buildEpochMergePayload = (ctx) => buildEpochMergeEventPayloadV1(ctx);
  }
  if (!window.__rhizoh.crossEpochReplay) {
    window.__rhizoh.crossEpochReplay = (opts) => crossEpochDeterministicReplayV1(opts);
  }
  if (!window.__rhizoh.epochMergeSnapshot) {
    window.__rhizoh.epochMergeSnapshot = () => getLastEpochMergeSnapshotV1();
  }

  return window.__rhizoh.epochMergeAndAssimilate;
}

/** @internal vitest */
export function resetAuthorityEpochMergeForTestV1() {
  lastMergeEventV1 = null;
  lastCrossEpochReplayV1 = null;
}
