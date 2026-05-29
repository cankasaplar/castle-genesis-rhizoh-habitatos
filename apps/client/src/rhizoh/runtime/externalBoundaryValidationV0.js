/**
 * External boundary validation v0.1 — client truth vs gateway truth (A11 closure path).
 *
 * READ-ONLY validation + factual breach log. No enforcement, no central arbiter.
 * @see docs/RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md
 */

import {
  buildGenesisEndpointUrls,
  probeGenesisGatewayHealth,
  resolveGenesisGatewayOriginCached
} from "../../genesis/genesisNetworkResolverV1.js";
import {
  BREACH_RESPONSE_MODE_V0,
  BREACH_VIOLATION_CLASS_V0,
  buildWalDivergenceSnapshotV0,
  recordBreachObservationV0
} from "./violationObservationLogV0.js";
import { getActiveCorrelationIdV0 } from "./breachCorrelationWindowV0.js";

export const EXTERNAL_BOUNDARY_VALIDATION_SCHEMA_V0 =
  "castle.rhizoh.external_boundary_validation.v0";

export const BOUNDARY_STATE_V0 = Object.freeze({
  ALIGNED: "ALIGNED",
  DIVERGED: "DIVERGED",
  SKIPPED: "SKIPPED"
});

/** Client seq must not exceed gateway lastAcceptedSeq by more than this without flagging divergence */
export const MAX_CLIENT_SEQ_AHEAD_OF_GATEWAY_V0 = 8;

/**
 * @typedef {Object} ClientBoundarySnapshotV0
 * @property {number|null} clientSeqHead
 * @property {number|null} shadowWalTick
 * @property {number[]|null} eventSeqTail
 * @property {number|null} streamSeq
 * @property {number} collectedAtMs
 */

/**
 * @typedef {Object} ExternalBoundarySnapshotV0
 * @property {boolean} gatewayLive
 * @property {number|null} lastAcceptedSeq
 * @property {number|null} healthStatus
 * @property {string|null} fetchPhase
 * @property {number} collectedAtMs
 */

/**
 * @param {Partial<ClientBoundarySnapshotV0>} [override]
 * @returns {ClientBoundarySnapshotV0}
 */
export function collectClientBoundarySnapshotV0(override) {
  if (override && typeof override === "object") {
    return Object.freeze({
      clientSeqHead: numOrNull(override.clientSeqHead),
      shadowWalTick: numOrNull(override.shadowWalTick),
      eventSeqTail: Array.isArray(override.eventSeqTail)
        ? override.eventSeqTail.filter(Number.isFinite)
        : null,
      streamSeq: numOrNull(override.streamSeq),
      collectedAtMs: Number(override.collectedAtMs) || Date.now()
    });
  }

  /** @type {number[]} */
  const eventSeqs = [];
  if (typeof window !== "undefined") {
    const bus = window.__rhizoh_epistemic_event_bus;
    const trace = bus?.trace;
    if (Array.isArray(trace)) {
      for (const e of trace) {
        const s = Number(e?.seq ?? e?.event?.seq);
        if (Number.isFinite(s)) eventSeqs.push(s);
      }
    }
    const shadow = window.__rhizoh_shadow_continuity;
    const wal = Number(shadow?.walTick);
    const streamSeq = Number(window.__rhizoh?.debug?.()?.realityHealth?.counters?.lastEpoch);
    return Object.freeze({
      clientSeqHead: eventSeqs.length ? Math.max(...eventSeqs) : null,
      shadowWalTick: Number.isFinite(wal) ? wal : null,
      eventSeqTail: eventSeqs.length ? eventSeqs.slice(-8) : null,
      streamSeq: Number.isFinite(streamSeq) ? streamSeq : null,
      collectedAtMs: Date.now()
    });
  }

  return Object.freeze({
    clientSeqHead: null,
    shadowWalTick: null,
    eventSeqTail: null,
    streamSeq: null,
    collectedAtMs: Date.now()
  });
}

/**
 * @param {{ timeoutMs?: number, origin?: string }} [opts]
 * @returns {Promise<ExternalBoundarySnapshotV0>}
 */
export async function fetchExternalBoundarySnapshotV0(opts = {}) {
  const collectedAtMs = Date.now();
  const origin = String(opts.origin || resolveGenesisGatewayOriginCached() || "").trim();
  if (!origin) {
    return Object.freeze({
      gatewayLive: false,
      lastAcceptedSeq: null,
      healthStatus: null,
      fetchPhase: "no_origin",
      collectedAtMs
    });
  }

  const health = await probeGenesisGatewayHealth({ timeoutMs: opts.timeoutMs ?? 4000 });
  if (!health.ok) {
    return Object.freeze({
      gatewayLive: false,
      lastAcceptedSeq: null,
      healthStatus: health.status ?? null,
      fetchPhase: health.phase || "health_failed",
      collectedAtMs
    });
  }

  const urls = buildGenesisEndpointUrls(origin);
  const timeoutMs = Math.max(800, Number(opts.timeoutMs) || 5000);
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const tid =
    ctrl && typeof globalThis.setTimeout === "function"
      ? globalThis.setTimeout(() => ctrl.abort(), timeoutMs)
      : null;

  try {
    const res = await fetch(urls.runtimeUrl, {
      method: "GET",
      cache: "no-store",
      signal: ctrl?.signal
    });
    const json = await res.json().catch(() => null);
    const lastAcceptedSeq = numOrNull(
      json?.genesisStream?.lastAcceptedSeq ?? json?.genesisStream?.lastAccepted
    );
    return Object.freeze({
      gatewayLive: true,
      lastAcceptedSeq,
      healthStatus: health.status ?? 200,
      fetchPhase: res.ok ? "runtime_ok" : `runtime_http_${res.status}`,
      collectedAtMs
    });
  } catch (e) {
    const err = String(
      /** @type {any} */ (e)?.name === "AbortError" ? "timeout" : e?.message || e || "network"
    );
    return Object.freeze({
      gatewayLive: true,
      lastAcceptedSeq: null,
      healthStatus: health.status ?? 200,
      fetchPhase: `runtime_${err}`,
      collectedAtMs
    });
  } finally {
    if (tid != null) globalThis.clearTimeout(tid);
  }
}

/**
 * @param {ClientBoundarySnapshotV0} client
 * @param {ExternalBoundarySnapshotV0} external
 * @param {{ maxAhead?: number, requireGateway?: boolean }} [opts]
 */
export function evaluateExternalBoundaryValidationV0(client, external, opts = {}) {
  const atMs = Date.now();
  const maxAhead = Number(opts.maxAhead) || MAX_CLIENT_SEQ_AHEAD_OF_GATEWAY_V0;
  const checks = {
    gatewayReachable: {
      ok: Boolean(external.gatewayLive),
      detail: external.fetchPhase || "unknown"
    },
    seqAlignment: { ok: true, detail: "no_client_seq", delta: null }
  };

  if (!external.gatewayLive) {
    const boundary_state = opts.requireGateway
      ? BOUNDARY_STATE_V0.DIVERGED
      : BOUNDARY_STATE_V0.SKIPPED;
    return freezeReport({
      boundary_state,
      checks: {
        ...checks,
        gatewayReachable: { ok: false, detail: external.fetchPhase || "unreachable" }
      },
      client,
      external,
      atMs
    });
  }

  const clientSeq = client.clientSeqHead ?? inferSeqHeadFromTail(client.eventSeqTail);
  const gatewaySeq = external.lastAcceptedSeq;

  if (clientSeq == null || gatewaySeq == null) {
    checks.seqAlignment = {
      ok: true,
      detail: "insufficient_seq_signal",
      clientSeqHead: clientSeq,
      gatewayLastAcceptedSeq: gatewaySeq,
      delta: null
    };
    return freezeReport({
      boundary_state: BOUNDARY_STATE_V0.SKIPPED,
      checks,
      client,
      external,
      atMs
    });
  }

  const delta = clientSeq - gatewaySeq;
  const aheadExcess = delta > maxAhead;
  checks.seqAlignment = {
    ok: !aheadExcess,
    detail: aheadExcess ? "client_seq_ahead_of_gateway" : "within_tolerance",
    clientSeqHead: clientSeq,
    gatewayLastAcceptedSeq: gatewaySeq,
    delta,
    maxAhead
  };

  const boundary_state = aheadExcess ? BOUNDARY_STATE_V0.DIVERGED : BOUNDARY_STATE_V0.ALIGNED;

  return freezeReport({ boundary_state, checks, client, external, atMs });
}

/**
 * @param {ReturnType<typeof evaluateExternalBoundaryValidationV0>} result
 */
export function observeExternalBoundaryBreachV0(result) {
  if (!result || result.boundary_state !== BOUNDARY_STATE_V0.DIVERGED) return null;

  return recordBreachObservationV0({
    violationClass: BREACH_VIOLATION_CLASS_V0.PEER_INGRESS,
    responseMode: BREACH_RESPONSE_MODE_V0.QUARANTINE,
    source: "externalBoundaryValidationV0",
    auto: true,
    captainRequired: true,
    detail: `boundary_diverged; ${result.checks?.seqAlignment?.detail || result.checks?.gatewayReachable?.detail}`,
    walSnapshot: buildWalDivergenceSnapshotV0({
      eventSeqs: result.client?.eventSeqTail || undefined,
      shadowWalTick: result.client?.shadowWalTick,
      system_state: "EXTERNAL_DIVERGED"
    }),
    context: Object.freeze({
      boundary_state: result.boundary_state,
      checks: result.checks,
      externalPhase: result.external?.fetchPhase
    }),
    correlationId: getActiveCorrelationIdV0()
  });
}

/**
 * @param {{
 *   client?: ClientBoundarySnapshotV0,
 *   fetchExternal?: boolean,
 *   observe?: boolean,
 *   requireGateway?: boolean,
 *   timeoutMs?: number
 * }} [opts]
 */
export async function runExternalBoundaryValidationV0(opts = {}) {
  const client = opts.client ?? collectClientBoundarySnapshotV0();
  const external = opts.fetchExternal === false
    ? Object.freeze({
        gatewayLive: false,
        lastAcceptedSeq: null,
        healthStatus: null,
        fetchPhase: "not_fetched",
        collectedAtMs: Date.now()
      })
    : await fetchExternalBoundarySnapshotV0({ timeoutMs: opts.timeoutMs });

  const result = evaluateExternalBoundaryValidationV0(client, external, {
    requireGateway: opts.requireGateway
  });

  if (opts.observe !== false && result.boundary_state === BOUNDARY_STATE_V0.DIVERGED) {
    observeExternalBoundaryBreachV0(result);
  }

  syncExternalBoundaryWindowV0(result);
  return result;
}

function freezeReport({ boundary_state, checks, client, external, atMs }) {
  return Object.freeze({
    schema: EXTERNAL_BOUNDARY_VALIDATION_SCHEMA_V0,
    version: "0.1",
    boundary_state,
    checks: Object.freeze({ ...checks }),
    client: Object.freeze({ ...client }),
    external: Object.freeze({ ...external }),
    atMs,
    interpretationOnly: true,
    centralizedArbitrationBus: false
  });
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {number[]|null} tail
 */
function inferSeqHeadFromTail(tail) {
  if (!Array.isArray(tail) || !tail.length) return null;
  return Math.max(...tail.filter(Number.isFinite));
}

function syncExternalBoundaryWindowV0(last) {
  if (typeof window === "undefined") return;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh_external_boundary = last;
  window.__rhizoh.externalBoundary = Object.freeze({
    collectClient: collectClientBoundarySnapshotV0,
    fetchExternal: fetchExternalBoundarySnapshotV0,
    evaluate: evaluateExternalBoundaryValidationV0,
    validate: runExternalBoundaryValidationV0,
    last: () => last
  });
}
