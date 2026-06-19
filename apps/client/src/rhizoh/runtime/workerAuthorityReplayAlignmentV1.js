/**
 * Worker Authority Replay Alignment v1 — authority-layer replay comparison only.
 * Question: "Where can the same state be computed?" — not "what is the correct state?"
 * NO fusion · NO REC · NO projection · NO arbitration
 * RESEARCH-ONLY
 * @see docs/RHIZOH_WORKER_AUTHORITY_REPLAY_ALIGNMENT_V1.md
 */

import { getRhizohGatewayHealthBase } from "../useRhizohGatewayMonitor.js";
import { buildEpistemicTransportHeadersV0 } from "../epistemic/epistemicLedgerStreamV529.js";
import { getAuthorityGatewayBridgeSnapshotV1 } from "./authorityGatewayPersistenceBridgeV1.js";
import {
  getAuthorityLedgerSnapshotV1,
  replayAuthorityLedgerV1
} from "./authorityLedgerSealPipelineV1.js";

export const WORKER_AUTHORITY_REPLAY_ALIGNMENT_SCHEMA_V1 =
  "castle.rhizoh.worker_authority_replay_alignment.v1";

export const REPLAY_MODE_V1 = Object.freeze({
  DETERMINISTIC_ONLY: "deterministic-only"
});

export const DIVERGENCE_TYPE_V1 = Object.freeze({
  NONE: "none",
  SEAL_MISMATCH: "seal_mismatch",
  HEIGHT_DESYNC: "height_desync",
  ENTRY_HASH_DRIFT: "entry_hash_drift",
  MISSING_ENTRY: "missing_entry"
});

export const ALIGNMENT_SEVERITY_V1 = Object.freeze({
  NONE: "none",
  SOFT_DRIFT: "soft_drift",
  HARD_DIVERGENCE: "hard_divergence"
});

export const SOURCE_OF_TRUTH_V1 = Object.freeze({
  CLIENT: "client",
  GATEWAY: "gateway",
  WORKER: "worker",
  UNDETERMINED: "undetermined"
});

const DEFAULT_COMPARE_V1 = Object.freeze(["sealHead", "height", "entryHashChain"]);
const GATEWAY_REPLAY_PATH_V1 = "/rhizoh/authority/ledger/replay";

/**
 * @param {object | null | undefined} ledger
 */
function normalizeClientLedgerV1(ledger) {
  const snap = ledger || {};
  const replay = snap.replay || null;
  return Object.freeze({
    height: Number(snap.ledgerHeight ?? snap.height ?? replay?.height ?? 0),
    sealHead: String(
      snap.sealChainHead ?? snap.sealHead ?? snap.lastSeal?.sealHash ?? replay?.sealHead ?? ""
    ),
    replayOk: replay?.ok ?? null,
    replay,
    recentEntries: Array.isArray(snap.recentEntries) ? snap.recentEntries : []
  });
}

/**
 * @param {object | null | undefined} gatewayWitness
 */
function normalizeGatewayWitnessV1(gatewayWitness) {
  const gw = gatewayWitness || {};
  const replay = gw.replay || gw.gatewayReplay || null;
  return Object.freeze({
    height: Number(
      gw.chainHeight ??
        gw.subjectHeight ??
        gw.lastWitnessedHeight ??
        replay?.height ??
        gw.lastWitness?.height ??
        0
    ),
    sealHead: String(
      gw.chainHead ??
        gw.subjectChainHead ??
        gw.lastWitness?.clientSealHash ??
        replay?.sealHead ??
        ""
    ),
    replayOk: replay?.ok ?? null,
    replay,
    recentWitnessed: Array.isArray(gw.recentWitnessed) ? gw.recentWitnessed : []
  });
}

/**
 * @param {object | null | undefined} workerReplay
 */
function normalizeWorkerReplayV1(workerReplay) {
  const w = workerReplay || {};
  const available = Boolean(w.available ?? w.workerPresent);
  return Object.freeze({
    available,
    height: available ? Number(w.height ?? 0) : null,
    sealHead: available ? String(w.sealHead ?? "") : null,
    divergenceTotal: Number(w.divergenceTotal ?? 0)
  });
}

/**
 * @param {object[]} clientTrace
 * @param {object[]} gatewayTrace
 */
function compareEntryHashChainsV1(clientTrace, gatewayTrace) {
  const clientByHeight = new Map(
    (clientTrace || []).map((t) => [Number(t.height), String(t.actual || t.expected || "")])
  );
  const gatewayByHeight = new Map(
    (gatewayTrace || []).map((t) => [Number(t.height), String(t.clientSealHash || "")])
  );
  const heights = [...new Set([...clientByHeight.keys(), ...gatewayByHeight.keys()])].sort(
    (a, b) => a - b
  );

  for (const h of heights) {
    const c = clientByHeight.get(h);
    const g = gatewayByHeight.get(h);
    if (!c || !g) {
      return { drift: true, missing: true, height: h, clientSeal: c || null, gatewaySeal: g || null };
    }
    if (c !== g) {
      return { drift: true, missing: false, height: h, clientSeal: c, gatewaySeal: g };
    }
  }
  return { drift: false, missing: false, height: null, clientSeal: null, gatewaySeal: null };
}

/**
 * @param {{
 *   ledger?: object,
 *   gatewayWitness?: object,
 *   workerReplay?: object,
 *   replayMode?: string,
 *   compare?: string[]
 * }} opts
 */
export function workerAuthorityReplayAlignmentV1(opts = {}) {
  const replayMode = String(opts.replayMode || REPLAY_MODE_V1.DETERMINISTIC_ONLY);
  const compare = Array.isArray(opts.compare) ? opts.compare : [...DEFAULT_COMPARE_V1];

  const client = normalizeClientLedgerV1(opts.ledger);
  const gateway = normalizeGatewayWitnessV1(opts.gatewayWitness);
  const worker = normalizeWorkerReplayV1(opts.workerReplay);

  /** @type {string[]} */
  const signals = [];
  let divergenceType = DIVERGENCE_TYPE_V1.NONE;
  let severity = ALIGNMENT_SEVERITY_V1.NONE;
  let sourceOfTruth = SOURCE_OF_TRUTH_V1.UNDETERMINED;

  const hasClient = client.height > 0;
  const hasGateway = gateway.height > 0;

  if (!hasClient && !hasGateway) {
    return Object.freeze({
      schema: `${WORKER_AUTHORITY_REPLAY_ALIGNMENT_SCHEMA_V1}.result`,
      aligned: true,
      divergenceType: DIVERGENCE_TYPE_V1.NONE,
      severity: ALIGNMENT_SEVERITY_V1.NONE,
      sourceOfTruth: SOURCE_OF_TRUTH_V1.UNDETERMINED,
      replayMode,
      compare,
      layers: Object.freeze({
        client: Object.freeze({ present: false, height: 0 }),
        gateway: Object.freeze({ present: false, height: 0 }),
        worker: Object.freeze({ available: worker.available })
      }),
      note: "no authority history on any layer",
      interpretationOnly: true,
      nonExecutive: true,
      atMs: Date.now()
    });
  }

  if (hasClient && !hasGateway) {
    divergenceType = DIVERGENCE_TYPE_V1.MISSING_ENTRY;
    severity = ALIGNMENT_SEVERITY_V1.SOFT_DRIFT;
    sourceOfTruth = SOURCE_OF_TRUTH_V1.CLIENT;
    signals.push("missing_gateway_witness");
  } else if (!hasClient && hasGateway) {
    divergenceType = DIVERGENCE_TYPE_V1.MISSING_ENTRY;
    severity = ALIGNMENT_SEVERITY_V1.HARD_DIVERGENCE;
    sourceOfTruth = SOURCE_OF_TRUTH_V1.GATEWAY;
    signals.push("missing_client_ledger");
  }

  if (compare.includes("height") && hasClient && hasGateway && client.height !== gateway.height) {
    divergenceType = DIVERGENCE_TYPE_V1.HEIGHT_DESYNC;
    severity = ALIGNMENT_SEVERITY_V1.SOFT_DRIFT;
    signals.push(`height_desync:client=${client.height},gateway=${gateway.height}`);
    if (client.height > gateway.height) {
      sourceOfTruth = SOURCE_OF_TRUTH_V1.CLIENT;
      if (gateway.height === 0) {
        divergenceType = DIVERGENCE_TYPE_V1.MISSING_ENTRY;
      }
    } else {
      sourceOfTruth = SOURCE_OF_TRUTH_V1.GATEWAY;
      divergenceType = DIVERGENCE_TYPE_V1.MISSING_ENTRY;
      severity = ALIGNMENT_SEVERITY_V1.HARD_DIVERGENCE;
    }
  }

  if (
    compare.includes("sealHead") &&
    hasClient &&
    hasGateway &&
    client.sealHead &&
    gateway.sealHead &&
    client.sealHead !== gateway.sealHead
  ) {
    divergenceType = DIVERGENCE_TYPE_V1.SEAL_MISMATCH;
    severity = ALIGNMENT_SEVERITY_V1.HARD_DIVERGENCE;
    signals.push(`seal_mismatch:client=${client.sealHead},gateway=${gateway.sealHead}`);
    if (client.replayOk === true && gateway.replayOk !== false) {
      sourceOfTruth = SOURCE_OF_TRUTH_V1.CLIENT;
    } else if (gateway.replayOk === true && client.replayOk !== true) {
      sourceOfTruth = SOURCE_OF_TRUTH_V1.GATEWAY;
    } else {
      sourceOfTruth = SOURCE_OF_TRUTH_V1.UNDETERMINED;
    }
  }

  if (compare.includes("entryHashChain") && hasClient && hasGateway) {
    const clientTrace = client.replay?.trace || [];
    const gatewayTrace =
      gateway.replay?.trace ||
      (gateway.recentWitnessed || []).map((w) => ({
        height: w.height,
        clientSealHash: w.clientSealHash
      }));
    const chainCmp = compareEntryHashChainsV1(clientTrace, gatewayTrace);
    if (chainCmp.drift) {
      divergenceType = chainCmp.missing
        ? DIVERGENCE_TYPE_V1.MISSING_ENTRY
        : DIVERGENCE_TYPE_V1.ENTRY_HASH_DRIFT;
      severity = chainCmp.missing
        ? ALIGNMENT_SEVERITY_V1.SOFT_DRIFT
        : ALIGNMENT_SEVERITY_V1.HARD_DIVERGENCE;
      signals.push(
        chainCmp.missing
          ? `missing_entry_at_height_${chainCmp.height}`
          : `entry_hash_drift_at_height_${chainCmp.height}`
      );
      if (sourceOfTruth === SOURCE_OF_TRUTH_V1.UNDETERMINED) {
        sourceOfTruth =
          client.replayOk === true ? SOURCE_OF_TRUTH_V1.CLIENT : SOURCE_OF_TRUTH_V1.UNDETERMINED;
      }
    }
  }

  if (worker.available && compare.includes("sealHead") && worker.sealHead) {
    if (hasClient && worker.sealHead !== client.sealHead) {
      signals.push(`worker_client_seal_drift`);
      if (divergenceType === DIVERGENCE_TYPE_V1.NONE) {
        divergenceType = DIVERGENCE_TYPE_V1.SEAL_MISMATCH;
        severity = ALIGNMENT_SEVERITY_V1.HARD_DIVERGENCE;
      }
      sourceOfTruth = SOURCE_OF_TRUTH_V1.UNDETERMINED;
    }
  } else if (!worker.available && hasClient && hasGateway && divergenceType === DIVERGENCE_TYPE_V1.NONE) {
    sourceOfTruth = SOURCE_OF_TRUTH_V1.UNDETERMINED;
  } else if (divergenceType === DIVERGENCE_TYPE_V1.NONE && hasClient && hasGateway) {
    sourceOfTruth = SOURCE_OF_TRUTH_V1.UNDETERMINED;
  }

  const aligned = divergenceType === DIVERGENCE_TYPE_V1.NONE;

  return Object.freeze({
    schema: `${WORKER_AUTHORITY_REPLAY_ALIGNMENT_SCHEMA_V1}.result`,
    aligned,
    divergenceType,
    severity,
    sourceOfTruth,
    replayMode,
    compare: Object.freeze([...compare]),
    layers: Object.freeze({
      client: Object.freeze({
        present: hasClient,
        height: client.height,
        sealHead: client.sealHead || null,
        replayOk: client.replayOk
      }),
      gateway: Object.freeze({
        present: hasGateway,
        height: gateway.height,
        sealHead: gateway.sealHead || null,
        replayOk: gateway.replayOk
      }),
      worker: Object.freeze({
        available: worker.available,
        height: worker.height,
        sealHead: worker.sealHead,
        divergenceTotal: worker.divergenceTotal
      })
    }),
    signals: Object.freeze(signals),
    question: "where_can_same_state_be_computed",
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/**
 * Fetch gateway authority witness replay (GET).
 * @param {string} [idToken]
 */
export async function fetchGatewayAuthorityWitnessReplayV1(idToken = "") {
  const base = getRhizohGatewayHealthBase();
  if (!base) return { ok: false, error: "no_gateway_base" };
  try {
    const res = await fetch(`${String(base).replace(/\/+$/, "")}${GATEWAY_REPLAY_PATH_V1}`, {
      method: "GET",
      headers: buildEpistemicTransportHeadersV0(idToken),
      ...(typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
        ? { signal: AbortSignal.timeout(12000) }
        : {})
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok) return { ok: false, error: j.error || `http_${res.status}` };
    return { ok: true, snapshot: j.snapshot || null, replay: j.replay || null };
  } catch (e) {
    return { ok: false, error: String(e?.message || e || "gateway_replay_fetch_failed") };
  }
}

/**
 * Convenience: align local ledger + bridge snapshot + optional remote gateway replay.
 * @param {{ workerReplay?: object, fetchRemote?: boolean, idToken?: string }} [opts]
 */
export async function runAuthorityReplayAlignmentV1(opts = {}) {
  const snapshot = getAuthorityLedgerSnapshotV1();
  const replay =
    snapshot.replay || (snapshot.ledgerHeight > 0 ? replayAuthorityLedgerV1() : null);
  const ledger = Object.freeze({ ...snapshot, replay });

  const bridge = getAuthorityGatewayBridgeSnapshotV1();
  /** @type {object} */
  let gatewayWitness = Object.freeze({
    chainHeight: bridge.lastWitnessedHeight,
    chainHead: bridge.lastGatewayWitness?.clientSealHash || null,
    lastWitness: bridge.lastGatewayWitness
  });

  if (opts.fetchRemote !== false) {
    const remote = await fetchGatewayAuthorityWitnessReplayV1(opts.idToken || "");
    if (remote.ok) {
      gatewayWitness = Object.freeze({
        ...gatewayWitness,
        subjectHeight: remote.snapshot?.subjectHeight,
        subjectChainHead: remote.snapshot?.subjectChainHead,
        recentWitnessed: remote.snapshot?.recentWitnessed,
        replay: remote.replay,
        remoteFetched: true
      });
    }
  }

  return workerAuthorityReplayAlignmentV1({
    ledger,
    gatewayWitness,
    workerReplay: opts.workerReplay || { available: false, reason: "data_plane_off" },
    replayMode: REPLAY_MODE_V1.DETERMINISTIC_ONLY
  });
}

export function ensureWorkerAuthorityReplayAlignmentV1() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.authorityReplayAlignment) {
    window.__rhizoh.authorityReplayAlignment = (opts) => workerAuthorityReplayAlignmentV1(opts);
  }
  if (!window.__rhizoh.runAuthorityReplayAlignment) {
    window.__rhizoh.runAuthorityReplayAlignment = (opts) => runAuthorityReplayAlignmentV1(opts);
  }

  return window.__rhizoh.authorityReplayAlignment;
}
