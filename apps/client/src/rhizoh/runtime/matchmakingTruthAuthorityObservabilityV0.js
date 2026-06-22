/**
 * Match truth authority observability v0 — honest boot + dispatch chain logs.
 * Client = Reality Simulator (proposal/preview/simulation only).
 * Server = Reality Finalizer (commitAuthority derived, never client-displayed as commit).
 * RESEARCH-ONLY
 * @see docs/RHIZOH_MATCH_AUTHORITY_LAYER_V1.md
 */

import {
  buildMatchAuthorityContractV0,
  MATCH_AUTHORITY_MODE_V0
} from "./matchAuthorityLayerV0.js";
import { MATCH_DRIFT_THRESHOLD_V0, computeMatchDriftScoreV0 } from "./matchAuthorityKernelV0.js";
import {
  MATCH_CLIENT_AUTHORITY_V0,
  MATCH_EFFECTIVE_COMMIT_WRITER_V0,
  MATCH_REALITY_ROLE_V0,
  MATCH_TRUTH_LOG_LANE_V0,
  buildMatchTruthChainAuthorityV0,
  deriveCommitAuthorityV0,
  deriveEffectiveCommitWriterV0,
  getClientRealityAuthoritiesV0,
  getMatchSingleWriterPolicyV0
} from "./matchmakingSingleWriterPolicyV0.js";

const TRUTH_DISPATCH_EVENT_V0 = Object.freeze({
  PROPOSE_MOVE: "ProposeMove",
  COMMIT_MOVE: "CommitMove",
  RECONCILE_STATE: "ReconcileState"
});

export const MATCH_TRUTH_AUTHORITY_OBS_SCHEMA_V0 =
  "castle.rhizoh.match_truth_authority_obs.v0";

export const MATCH_TRUTH_CHAIN_PHASE_V0 = Object.freeze({
  TRUTH_LOG_APPEND: "TRUTH_LOG_APPEND",
  TRUTH_LOG_PREVIEW: "TRUTH_LOG_PREVIEW",
  MATCH_EVENT_APPENDED: "MATCH_EVENT_APPENDED",
  MATCH_EVENT_VALIDATED: "MATCH_EVENT_VALIDATED",
  MATCH_EVENT_REJECTED: "MATCH_EVENT_REJECTED",
  MATCH_EVENT_COMMITTED: "MATCH_EVENT_COMMITTED",
  MATCH_STATE_REDUCED: "MATCH_STATE_REDUCED",
  RECONCILIATION_APPLIED: "RECONCILIATION_APPLIED",
  DRIFT_DETECTED: "DRIFT_DETECTED",
  DRIFT_RESOLVED: "DRIFT_RESOLVED",
  STATE_RECONCILED: "MATCH_STATE_RECONCILED"
});

/** @deprecated use MATCH_CLIENT_AUTHORITY_V0 */
export const MATCH_PROPOSAL_AUTHORITY_V0 = MATCH_CLIENT_AUTHORITY_V0;

/** @deprecated server-only derived — use deriveCommitAuthorityV0 */
export const MATCH_COMMIT_AUTHORITY_V0 = Object.freeze({
  SERVER: "server"
});

export const MATCH_VALIDATION_SOURCE_V0 = Object.freeze({
  CHESS_JS_LOCAL: "chess.js_local",
  AUTHORITY_GATEWAY: "authority_gateway"
});

export const MATCH_TRUTH_ORIGIN_V0 = Object.freeze({
  TRUTH_LOG_V0: "truth_log_v0",
  GATEWAY_ACK: "gateway_ack",
  SERVER_LEDGER: "server_ledger"
});

let bootObservabilityEmittedV0 = false;

/**
 * Honest authority snapshot — client simulation vs server finalization.
 * @param {{ session?: object | null, gatewayReady?: boolean }} [ctx]
 */
export function getMatchTruthAuthoritySnapshotV0(ctx = {}) {
  const session = ctx.session ?? null;
  const gatewayReady = ctx.gatewayReady === true;
  const contract = buildMatchAuthorityContractV0({ serverBound: gatewayReady });
  const laneAuthority = session?.authority?.effectiveAuthority ?? contract.effectiveAuthority;
  const policy = getMatchSingleWriterPolicyV0({ gatewayReady });

  return Object.freeze({
    schema: MATCH_TRUTH_AUTHORITY_OBS_SCHEMA_V0,
    authorityMode: MATCH_AUTHORITY_MODE_V0.SERVER_PRIMARY,
    serverAuthoritative: gatewayReady,
    proposalAuthority: policy.proposalAuthority,
    previewAuthority: policy.previewAuthority,
    simulationAuthority: policy.simulationAuthority,
    clientIsCommitAuthority: false,
    clientRealityRole: policy.realityRole,
    serverRealityRole: policy.serverRealityRole,
    effectiveCommitWriter: policy.effectiveCommitWriter,
    commitAuthority: policy.commitAuthority,
    truthOrigin: gatewayReady
      ? MATCH_TRUTH_ORIGIN_V0.GATEWAY_ACK
      : MATCH_TRUTH_ORIGIN_V0.TRUTH_LOG_V0,
    validationSource: gatewayReady
      ? MATCH_VALIDATION_SOURCE_V0.AUTHORITY_GATEWAY
      : MATCH_VALIDATION_SOURCE_V0.CHESS_JS_LOCAL,
    singleWriterRule: true,
    effectiveAuthority: laneAuthority,
    commitRequired: contract.commitRequired,
    reconciliation: contract.reconciliation,
    shadowRehearsal: !gatewayReady,
    gatewayReady,
    interpretationOnly: true
  });
}

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
    `mode=append_only · effectiveCommitWriter=${auth.effectiveCommitWriter} · clientRole=${auth.clientRealityRole}`
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
      proposalAuthority: auth.proposalAuthority,
      previewAuthority: auth.previewAuthority,
      simulationAuthority: auth.simulationAuthority,
      effectiveCommitWriter: auth.effectiveCommitWriter,
      commitAuthority: auth.commitAuthority,
      clientRealityRole: auth.clientRealityRole,
      clientIsCommitAuthority: false,
      interpretationOnly: true
    });
  }

  return Object.freeze({ ok: true, authority: auth });
}

/**
 * @param {string} phase
 * @param {object} detail
 */
export function emitMatchTruthDispatchChainV0(phase, detail = {}) {
  const seq = Number(detail.seq) || 0;
  const type = detail.type ? ` type=${detail.type}` : "";
  const session = detail.sessionId ? ` session=${detail.sessionId}` : "";
  const proposalAuthority = detail.proposalAuthority
    ? ` proposalAuthority=${detail.proposalAuthority}`
    : "";
  const previewAuthority = detail.previewAuthority
    ? ` previewAuthority=${detail.previewAuthority}`
    : "";
  const simulationAuthority = detail.simulationAuthority
    ? ` simulationAuthority=${detail.simulationAuthority}`
    : "";
  const effectiveCommitWriter = detail.effectiveCommitWriter
    ? ` effectiveCommitWriter=${detail.effectiveCommitWriter}`
    : "";
  const commitAuthority =
    detail.commitAuthority != null ? ` commitAuthority=${detail.commitAuthority}` : "";
  const truthOrigin = detail.truthOrigin ? ` truthOrigin=${detail.truthOrigin}` : "";
  const validationSource = detail.validationSource
    ? ` validationSource=${detail.validationSource}`
    : "";
  const drift =
    Number.isFinite(detail.driftScore) ? ` driftScore=${detail.driftScore}` : "";
  const classification = detail.classification ? ` classification=${detail.classification}` : "";
  const line = `${phase} seq=${seq}${type}${session}${proposalAuthority}${previewAuthority}${simulationAuthority}${effectiveCommitWriter}${commitAuthority}${truthOrigin}${validationSource}${drift}${classification}`;

  if (typeof console !== "undefined" && console.info) {
    console.info(`[MATCH_TRUTH_CHAIN] ${line}`);
  }

  return Object.freeze({
    schema: MATCH_TRUTH_AUTHORITY_OBS_SCHEMA_V0,
    phase,
    seq,
    type: detail.type ?? null,
    sessionId: detail.sessionId ?? null,
    effectiveCommitWriter: detail.effectiveCommitWriter ?? null,
    commitAuthority: detail.commitAuthority ?? null,
    interpretationOnly: true
  });
}

function buildChainBaseV0(auth, logEntry, effect, gatewayReady) {
  const chainAuth = buildMatchTruthChainAuthorityV0({
    gatewayReady,
    lane: gatewayReady ? MATCH_TRUTH_LOG_LANE_V0.AUTHORITATIVE : MATCH_TRUTH_LOG_LANE_V0.PREVIEW
  });
  return {
    seq: logEntry?.seq ?? 0,
    type: logEntry?.type ?? null,
    sessionId: logEntry?.sessionId ?? null,
    proposalAuthority: chainAuth.proposalAuthority,
    previewAuthority: chainAuth.previewAuthority,
    simulationAuthority: chainAuth.simulationAuthority,
    effectiveCommitWriter: chainAuth.effectiveCommitWriter,
    commitAuthority: chainAuth.commitAuthority,
    truthOrigin: gatewayReady ? MATCH_TRUTH_ORIGIN_V0.GATEWAY_ACK : MATCH_TRUTH_ORIGIN_V0.TRUTH_LOG_V0,
    validationSource: effect?.validationSource ?? auth.validationSource
  };
}

export function emitMatchTruthDispatchChainForEventV0(ctx) {
  const { logEntry, effect, nextState, prevState, gatewayReady = false } = ctx;
  const auth = getMatchTruthAuthoritySnapshotV0({ session: nextState?.activeSession, gatewayReady });
  const base = buildChainBaseV0(auth, logEntry, effect, gatewayReady);

  const prevDrift = prevState?.activeSession
    ? computeMatchDriftScoreV0(prevState.activeSession)
    : null;
  const nextDrift = nextState?.activeSession
    ? computeMatchDriftScoreV0(nextState.activeSession)
    : effect?.drift ?? null;

  const type = logEntry?.type ?? null;
  const chain = [
    emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.TRUTH_LOG_APPEND, base),
    emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_APPENDED, base)
  ];

  const isMoveEvent =
    type === TRUTH_DISPATCH_EVENT_V0.PROPOSE_MOVE || type === TRUTH_DISPATCH_EVENT_V0.COMMIT_MOVE;

  if (isMoveEvent && effect?.rejected === true) {
    chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_REJECTED, base));
  } else if (isMoveEvent && effect?.validated === true) {
    chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_VALIDATED, base));
  }

  const committed =
    type === TRUTH_DISPATCH_EVENT_V0.COMMIT_MOVE ||
    effect?.committed === true;

  if (committed && gatewayReady) {
    chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_COMMITTED, base));
  }

  chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_STATE_REDUCED, base));

  const driftScore = nextDrift?.driftScore ?? 0;
  if (
    driftScore >= MATCH_DRIFT_THRESHOLD_V0.PATTERN ||
    effect?.drift?.classification === "conflict" ||
    effect?.drift?.classification === "fork"
  ) {
    chain.push(
      emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.DRIFT_DETECTED, {
        ...base,
        driftScore,
        classification: nextDrift?.classification ?? "pattern"
      })
    );
  }

  if (type === TRUTH_DISPATCH_EVENT_V0.RECONCILE_STATE && effect?.ok === true) {
    chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.RECONCILIATION_APPLIED, base));
    const hadDrift = (prevDrift?.driftScore ?? 0) >= MATCH_DRIFT_THRESHOLD_V0.NOISE;
    const resolved = (nextDrift?.driftScore ?? 0) < MATCH_DRIFT_THRESHOLD_V0.NOISE;
    if (hadDrift && resolved) {
      chain.push(
        emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.DRIFT_RESOLVED, {
          ...base,
          driftScore: nextDrift?.driftScore ?? 0,
          classification: nextDrift?.classification ?? "noise"
        })
      );
    }
  }

  return Object.freeze({
    schema: MATCH_TRUTH_AUTHORITY_OBS_SCHEMA_V0,
    seq: base.seq,
    type,
    chain,
    authority: auth,
    drift: nextDrift,
    interpretationOnly: true
  });
}

export function emitMatchTruthPreviewChainForEventV0(ctx) {
  const { logEntry, effect, nextState } = ctx;
  const auth = getMatchTruthAuthoritySnapshotV0({ session: nextState?.activeSession, gatewayReady: false });
  const base = buildChainBaseV0(auth, logEntry, effect, false);

  const nextDrift = nextState?.activeSession
    ? computeMatchDriftScoreV0(nextState.activeSession)
    : effect?.drift ?? null;

  const chain = [
    emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.TRUTH_LOG_PREVIEW, base),
    emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_APPENDED, base)
  ];

  if (effect?.validated === true) {
    chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_VALIDATED, base));
  }
  if (effect?.rejected === true) {
    chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_REJECTED, base));
  }

  chain.push(emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_STATE_REDUCED, base));

  const driftScore = nextDrift?.driftScore ?? 0;
  if (driftScore >= MATCH_DRIFT_THRESHOLD_V0.PATTERN) {
    chain.push(
      emitMatchTruthDispatchChainV0(MATCH_TRUTH_CHAIN_PHASE_V0.DRIFT_DETECTED, {
        ...base,
        driftScore,
        classification: nextDrift?.classification ?? "pattern"
      })
    );
  }

  return Object.freeze({
    schema: MATCH_TRUTH_AUTHORITY_OBS_SCHEMA_V0,
    seq: base.seq,
    type: logEntry?.type ?? null,
    chain,
    authority: auth,
    preview: true,
    interpretationOnly: true
  });
}

/** @internal vitest */
export function resetMatchTruthAuthorityObservabilityForTestV0() {
  bootObservabilityEmittedV0 = false;
}

export {
  MATCH_CLIENT_AUTHORITY_V0,
  MATCH_EFFECTIVE_COMMIT_WRITER_V0,
  MATCH_REALITY_ROLE_V0,
  deriveCommitAuthorityV0,
  deriveEffectiveCommitWriterV0,
  getClientRealityAuthoritiesV0
};
