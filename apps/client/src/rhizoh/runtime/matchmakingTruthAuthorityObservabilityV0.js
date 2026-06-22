/**
 * Match truth authority observability v0 — honest boot + dispatch chain logs.
 * Declares SERVER_PRIMARY contract while effective authority remains shadow until gateway READY.
 * RESEARCH-ONLY — interpretation layer; does not claim serverAuthoritative without gateway ack.
 * @see docs/RHIZOH_MATCH_AUTHORITY_LAYER_V1.md
 */

import {
  buildMatchAuthorityContractV0,
  MATCH_AUTHORITY_MODE_V0
} from "./matchAuthorityLayerV0.js";
import { MATCH_DRIFT_THRESHOLD_V0 } from "./matchAuthorityKernelV0.js";

const TRUTH_DISPATCH_EVENT_V0 = Object.freeze({
  PROPOSE_MOVE: "ProposeMove",
  COMMIT_MOVE: "CommitMove",
  RECONCILE_STATE: "ReconcileState"
});

export const MATCH_TRUTH_AUTHORITY_OBS_SCHEMA_V0 =
  "castle.rhizoh.match_truth_authority_obs.v0";

export const MATCH_TRUTH_CHAIN_PHASE_V0 = Object.freeze({
  EVENT_APPENDED: "MATCH_EVENT_APPENDED",
  EVENT_COMMITTED: "MATCH_EVENT_COMMITTED",
  STATE_REDUCED: "MATCH_STATE_REDUCED",
  STATE_RECONCILED: "MATCH_STATE_RECONCILED"
});

export const MATCH_COMMIT_AUTHORITY_V0 = Object.freeze({
  GATEWAY: "gateway",
  CLIENT_SHADOW: "client_shadow",
  PENDING_GATEWAY: "pending_gateway"
});

export const MATCH_TRUTH_ORIGIN_V0 = Object.freeze({
  TRUTH_LOG_V0: "truth_log_v0",
  GATEWAY_ACK: "gateway_ack",
  SERVER_LEDGER: "server_ledger"
});

let bootObservabilityEmittedV0 = false;

/**
 * Honest authority snapshot — contract vs effective lane.
 * @param {{ session?: object | null, gatewayReady?: boolean }} [ctx]
 */
export function getMatchTruthAuthoritySnapshotV0(ctx = {}) {
  const session = ctx.session ?? null;
  const gatewayReady = ctx.gatewayReady === true;
  const contract = buildMatchAuthorityContractV0({ serverBound: gatewayReady });
  const laneAuthority = session?.authority?.effectiveAuthority ?? contract.effectiveAuthority;

  return Object.freeze({
    schema: MATCH_TRUTH_AUTHORITY_OBS_SCHEMA_V0,
    authorityMode: MATCH_AUTHORITY_MODE_V0.SERVER_PRIMARY,
    serverAuthoritative: gatewayReady,
    commitAuthority: gatewayReady
      ? MATCH_COMMIT_AUTHORITY_V0.GATEWAY
      : MATCH_COMMIT_AUTHORITY_V0.CLIENT_SHADOW,
    truthOrigin: gatewayReady
      ? MATCH_TRUTH_ORIGIN_V0.GATEWAY_ACK
      : MATCH_TRUTH_ORIGIN_V0.TRUTH_LOG_V0,
    effectiveAuthority: laneAuthority,
    commitRequired: contract.commitRequired,
    reconciliation: contract.reconciliation,
    shadowRehearsal: !gatewayReady,
    gatewayReady,
    interpretationOnly: true
  });
}

/**
 * Boot-time authority observability — idempotent once per page load.
 */
export function emitMatchTruthAuthorityBootObservabilityV0() {
  if (bootObservabilityEmittedV0) {
    return Object.freeze({ ok: true, skipped: true, reason: "already_emitted" });
  }
  bootObservabilityEmittedV0 = true;

  const auth = getMatchTruthAuthoritySnapshotV0();
  const boot = typeof window !== "undefined" ? window.__CASTLE_BOOT_LOG__ : null;

  boot?.ok?.("boot.match_authority", `authority=${auth.authorityMode.toLowerCase()}`);
  boot?.ok?.(
    "boot.truth_commit_bridge",
    `mode=append_only · commitAuthority=${auth.commitAuthority}`
  );
  boot?.ok?.("boot.reconciliation", "shadow_vs_truth enabled · strategy=diff-merge");
  boot?.ok?.(
    "boot.drift_detector",
    `noise=${MATCH_DRIFT_THRESHOLD_V0.NOISE} pattern=${MATCH_DRIFT_THRESHOLD_V0.PATTERN} conflict=${MATCH_DRIFT_THRESHOLD_V0.CONFLICT}`
  );

  if (typeof console !== "undefined" && console.info) {
    console.info("[MATCH_TRUTH_AUTHORITY]", {
      schema: MATCH_TRUTH_AUTHORITY_OBS_SCHEMA_V0,
      authorityMode: auth.authorityMode,
      serverAuthoritative: auth.serverAuthoritative,
      commitAuthority: auth.commitAuthority,
      truthOrigin: auth.truthOrigin,
      effectiveAuthority: auth.effectiveAuthority,
      shadowRehearsal: auth.shadowRehearsal,
      interpretationOnly: true
    });
  }

  return Object.freeze({ ok: true, authority: auth });
}

/**
 * @param {string} phase
 * @param {{ seq: number, type?: string, sessionId?: string | null, commitAuthority?: string, truthOrigin?: string }} detail
 */
export function emitMatchTruthDispatchChainV0(phase, detail = {}) {
  const seq = Number(detail.seq) || 0;
  const type = detail.type ? ` type=${detail.type}` : "";
  const session = detail.sessionId ? ` session=${detail.sessionId}` : "";
  const commitAuthority = detail.commitAuthority ? ` commitAuthority=${detail.commitAuthority}` : "";
  const truthOrigin = detail.truthOrigin ? ` truthOrigin=${detail.truthOrigin}` : "";
  const line = `${phase} seq=${seq}${type}${session}${commitAuthority}${truthOrigin}`;

  if (typeof console !== "undefined" && console.info) {
    console.info(`[MATCH_TRUTH_CHAIN] ${line}`);
  }

  return Object.freeze({
    schema: MATCH_TRUTH_AUTHORITY_OBS_SCHEMA_V0,
    phase,
    seq,
    type: detail.type ?? null,
    sessionId: detail.sessionId ?? null,
    commitAuthority: detail.commitAuthority ?? null,
    truthOrigin: detail.truthOrigin ?? null,
    interpretationOnly: true
  });
}

/**
 * Full dispatch chain after truth kernel write.
 * @param {{ logEntry: object, effect: object | null, nextState: object, prevState: object }} ctx
 */
export function emitMatchTruthDispatchChainForEventV0(ctx) {
  const { logEntry, effect, nextState } = ctx;
  const auth = getMatchTruthAuthoritySnapshotV0({ session: nextState?.activeSession });
  const seq = logEntry?.seq ?? 0;
  const type = logEntry?.type ?? null;
  const sessionId = logEntry?.sessionId ?? null;
  const base = { seq, type, sessionId, commitAuthority: auth.commitAuthority, truthOrigin: auth.truthOrigin };

  const chain = [emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.EVENT_APPENDED, base)];

  const committed =
    type === TRUTH_DISPATCH_EVENT_V0.COMMIT_MOVE ||
    effect?.committed === true ||
    (type === TRUTH_DISPATCH_EVENT_V0.PROPOSE_MOVE && effect?.committed === true);

  if (committed) {
    chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.EVENT_COMMITTED, base));
  }

  chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.STATE_REDUCED, base));

  if (type === TRUTH_DISPATCH_EVENT_V0.RECONCILE_STATE && effect?.ok === true) {
    chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.STATE_RECONCILED, base));
  }

  return Object.freeze({
    schema: MATCH_TRUTH_AUTHORITY_OBS_SCHEMA_V0,
    seq,
    type,
    chain,
    authority: auth,
    interpretationOnly: true
  });
}

/** @internal vitest */
export function resetMatchTruthAuthorityObservabilityForTestV0() {
  bootObservabilityEmittedV0 = false;
}
