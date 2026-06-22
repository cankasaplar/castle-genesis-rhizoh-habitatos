/**
 * Matchmaking Truth Kernel v0 — append-only log + pure reducer (execution graph lock).
 * input → validate → append log → reduce(state, event) → projection snapshot
 * RESEARCH-ONLY — shadow rehearsal truth model; server authority via gateway later.
 * @see docs/RHIZOH_MATCHMAKING_CORE_SPEC_V1.md
 */

import { MATCH_MODE_V0, applyBeaconCancelToRegistryV0, applyBeaconEmitToRegistryV0 } from "./matchmakingBeaconRegistryV0.js";
import { attachAuthorityToSessionV0, buildMatchAuthorityContractV0 } from "./matchAuthorityLayerV0.js";
import {
  MATCH_KERNEL_SCHEMA_V0,
  MATCH_KERNEL_STATE_V0,
  processKernelCommitMoveV0,
  processKernelProposeMoveV0,
  processKernelReconcileV0
} from "./matchAuthorityKernelV0.js";
import {
  isLegalSessionTransitionV0,
  MATCH_SESSION_SCHEMA_V0,
  MATCH_SESSION_STATE_V0
} from "./matchSessionStateMachineV0.js";
import {
  emitMatchTruthAuthorityBootObservabilityV0,
  emitMatchTruthDispatchChainForEventV0,
  emitMatchTruthPreviewChainForEventV0,
  getMatchTruthAuthoritySnapshotV0,
  MATCH_TRUTH_CHAIN_PHASE_V0
} from "./matchmakingTruthAuthorityObservabilityV0.js";
import {
  canAppendAuthoritativeCommitV0,
  MATCH_TRUTH_LOG_LANE_V0,
  MATCH_TRUTH_PROVENANCE_V0,
  getMatchSingleWriterPolicyV0
} from "./matchmakingSingleWriterPolicyV0.js";
import { simulateGatewayMatchMoveAckV0 } from "./matchmakingGatewayCommitBridgeV0.js";
import {
  runMatchmakingAuthorityBoundaryVerifyV0,
  runMatchmakingDriftInjectionVerifyV0
} from "./matchmakingTruthAuthorityBoundaryV0.js";
import { runMatchBroadcastE2eVerifyV0 } from "./matchmakingBroadcastE2eVerifyV0.js";

export const MATCH_TRUTH_SCHEMA_V0 = "castle.rhizoh.matchmaking_truth.v0";
export const MATCH_TRUTH_LOG_SCHEMA_V0 = "castle.rhizoh.matchmaking_truth_log.v0";
export const MATCH_TRUTH_MODEL_V0 = "event_sourced_reducer_v0";

export const MATCH_TRUTH_EVENT_V0 = Object.freeze({
  BEACON_EMIT: "BeaconEmit",
  BEACON_CANCEL: "BeaconCancel",
  SESSION_CREATE: "SessionCreate",
  SESSION_TRANSITION: "SessionTransition",
  PROPOSE_MOVE: "ProposeMove",
  COMMIT_MOVE: "CommitMove",
  RECONCILE_STATE: "ReconcileState"
});

const TRUTH_LOG_STORAGE_KEY_V0 = "rhizoh.matchmaking.truth_log.v0";
const PREDICTION_LOG_STORAGE_KEY_V0 = "rhizoh.matchmaking.prediction_log.v0";
const TRUTH_PROJECTION_STORAGE_KEY_V0 = "rhizoh.matchmaking.truth_projection.v0";
const SESSION_STORAGE_KEY_V0 = "rhizoh.matchmaking.active_session.v0";
const BEACON_REGISTRY_STORAGE_KEY_V0 = "rhizoh.matchmaking.beacon_registry.v0";
const MAX_TRUTH_LOG_ENTRIES_V0 = 512;
const STARTING_FEN_V0 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const INITIAL_MATCH_TRUTH_STATE_V0 = Object.freeze({
  schema: MATCH_TRUTH_SCHEMA_V0,
  truthModel: MATCH_TRUTH_MODEL_V0,
  activeSession: null,
  beaconRegistry: null,
  kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
  logSeq: 0,
  shadowRehearsal: true,
  interpretationOnly: true
});

function readTruthLogRowV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TRUTH_LOG_STORAGE_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeTruthLogRowV0(row) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(TRUTH_LOG_STORAGE_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

function readTruthProjectionV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TRUTH_PROJECTION_STORAGE_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeTruthProjectionV0(state) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(TRUTH_PROJECTION_STORAGE_KEY_V0, JSON.stringify(state));
      if (state?.activeSession) {
        sessionStorage.setItem(SESSION_STORAGE_KEY_V0, JSON.stringify(state.activeSession));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY_V0);
      }
      if (state?.beaconRegistry) {
        sessionStorage.setItem(BEACON_REGISTRY_STORAGE_KEY_V0, JSON.stringify(state.beaconRegistry));
      }
    }
  } catch {
    /* noop */
  }
}

function createSessionIdV0() {
  return `match_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Pure session factory — no storage writes.
 * @param {object} input
 */
export function buildSessionFromCreatePayloadV0(input = {}) {
  const now = Date.now();
  const mode = input.mode === MATCH_MODE_V0.ASYNC ? MATCH_MODE_V0.ASYNC : MATCH_MODE_V0.KINETIC;
  const timeControlMs = Math.max(1000, Number(input.timeControlMs) || 180_000);
  const players = (input.players || []).map((p) =>
    Object.freeze({
      userId: String(p.userId || ""),
      color: p.color === "black" ? "black" : "white",
      rating: Number.isFinite(p.rating) ? p.rating : undefined,
      kind: p.kind === "ai_stockfish" ? "ai_stockfish" : "human"
    })
  );

  if (input.opponentKind === "ai_stockfish" && players.length === 1) {
    players.push(
      Object.freeze({
        userId: "ai_stockfish",
        color: "black",
        kind: "ai_stockfish"
      })
    );
  }

  const state = input.initialState || MATCH_SESSION_STATE_V0.MATCH_FOUND;
  return attachAuthorityToSessionV0(
    Object.freeze({
      schema: MATCH_SESSION_SCHEMA_V0,
      sessionId: String(input.sessionId || "").trim() || createSessionIdV0(),
      mode,
      state,
      players: Object.freeze(players),
      turn: "white",
      fen: STARTING_FEN_V0,
      lastMoveAtMs: now,
      deadlineAtMs: mode === MATCH_MODE_V0.ASYNC ? now + timeControlMs : undefined,
      timeControlMs,
      opponentKind: input.opponentKind === "ai_stockfish" ? "ai_stockfish" : "human",
      moveCount: 0,
      createdAtMs: now,
      authority: buildMatchAuthorityContractV0({ serverBound: false }),
      kernel: Object.freeze({
        schema: MATCH_KERNEL_SCHEMA_V0,
        state: MATCH_KERNEL_STATE_V0.ACTIVE,
        shadowRehearsal: true,
        transport: "local_shadow",
        interpretationOnly: true
      }),
      serverAuthoritative: false,
      shadowRehearsal: true,
      interpretationOnly: true
    })
  );
}

/**
 * Pure reducer — (state, event) → newState. No I/O.
 * @param {object} state
 * @param {object} event
 * @param {{ skipKernelLog?: boolean }} [opts]
 */
export function reduceMatchmakingTruthV0(state, event, opts = {}) {
  const base = state || { ...INITIAL_MATCH_TRUTH_STATE_V0 };
  const skipKernelLog = opts.skipKernelLog === true;
  const kernelOpts = skipKernelLog ? { skipLog: true } : {};

  switch (event.type) {
    case MATCH_TRUTH_EVENT_V0.BEACON_EMIT: {
      const applied = applyBeaconEmitToRegistryV0(base.beaconRegistry, event.payload || {});
      return Object.freeze({
        ...base,
        beaconRegistry: applied.registry ?? base.beaconRegistry,
        logSeq: event.seq ?? base.logSeq,
        __effect: applied
      });
    }
    case MATCH_TRUTH_EVENT_V0.BEACON_CANCEL: {
      const applied = applyBeaconCancelToRegistryV0(base.beaconRegistry, event.payload?.beaconId);
      return Object.freeze({
        ...base,
        beaconRegistry: applied.registry ?? base.beaconRegistry,
        logSeq: event.seq ?? base.logSeq,
        __effect: applied
      });
    }
    case MATCH_TRUTH_EVENT_V0.SESSION_CREATE: {
      const session = buildSessionFromCreatePayloadV0(event.payload || {});
      return Object.freeze({
        ...base,
        activeSession: session,
        kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
        logSeq: event.seq ?? base.logSeq
      });
    }
    case MATCH_TRUTH_EVENT_V0.SESSION_TRANSITION: {
      const current = base.activeSession;
      if (!current) return base;
      const nextState = event.payload?.nextState;
      if (!isLegalSessionTransitionV0(current.state, nextState)) return base;
      const now = Date.now();
      const session = attachAuthorityToSessionV0(
        Object.freeze({
          ...current,
          state: nextState,
          lastMoveAtMs: now,
          finishedAtMs:
            nextState === MATCH_SESSION_STATE_V0.SESSION_FINISHED ? now : current.finishedAtMs,
          result: event.payload?.result ?? current.result
        })
      );
      return Object.freeze({ ...base, activeSession: session, logSeq: event.seq ?? base.logSeq });
    }
    case MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE: {
      const current = base.activeSession;
      if (!current || current.state !== MATCH_SESSION_STATE_V0.SESSION_ACTIVE) {
        return Object.freeze({ ...base, __effect: Object.freeze({ ok: false, reason: "session_not_active" }) });
      }
      const result = processKernelProposeMoveV0(current, event.payload || {}, kernelOpts);
      const nextSession = result.session ?? current;
      return Object.freeze({
        ...base,
        activeSession: nextSession,
        kernelState: result.kernelState || base.kernelState,
        logSeq: event.seq ?? base.logSeq,
        __effect: result
      });
    }
    case MATCH_TRUTH_EVENT_V0.COMMIT_MOVE: {
      const current = base.activeSession;
      if (!current) {
        return Object.freeze({ ...base, __effect: Object.freeze({ ok: false, reason: "no_active_session" }) });
      }
      const result = processKernelCommitMoveV0(current, event.payload || {}, kernelOpts);
      if (!result.session) {
        return Object.freeze({ ...base, __effect: result });
      }
      return Object.freeze({
        ...base,
        activeSession: result.session,
        kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
        logSeq: event.seq ?? base.logSeq,
        __effect: result
      });
    }
    case MATCH_TRUTH_EVENT_V0.RECONCILE_STATE: {
      const current = base.activeSession;
      if (!current) {
        return Object.freeze({ ...base, __effect: Object.freeze({ ok: false, reason: "no_active_session" }) });
      }
      const result = processKernelReconcileV0(current, event.payload || {}, kernelOpts);
      if (!result.session) {
        return Object.freeze({ ...base, __effect: result });
      }
      return Object.freeze({
        ...base,
        activeSession: result.session,
        kernelState: MATCH_KERNEL_STATE_V0.ACTIVE,
        logSeq: event.seq ?? base.logSeq,
        __effect: result
      });
    }
    default:
      return Object.freeze({ ...base });
  }
}

/**
 * @param {string} [sessionId]
 */
export function getMatchmakingTruthLogV0(sessionId) {
  const row = readTruthLogRowV0();
  const entries = (row?.entries || [])
    .filter((e) => e.lane !== MATCH_TRUTH_LOG_LANE_V0.PREVIEW)
    .filter((e) => !sessionId || e.sessionId === sessionId);
  return Object.freeze({
    schema: MATCH_TRUTH_LOG_SCHEMA_V0,
    sessionId: sessionId || null,
    entries: Object.freeze(entries),
    count: entries.length,
    appendOnly: true,
    truthModel: MATCH_TRUTH_MODEL_V0,
    singleWriterRule: true,
    interpretationOnly: true
  });
}

function readPredictionLogRowV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREDICTION_LOG_STORAGE_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePredictionLogRowV0(row) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(PREDICTION_LOG_STORAGE_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

export function getMatchmakingPredictionLogV0(sessionId) {
  const row = readPredictionLogRowV0();
  const entries = (row?.entries || []).filter((e) => !sessionId || e.sessionId === sessionId);
  return Object.freeze({
    schema: MATCH_TRUTH_LOG_SCHEMA_V0,
    lane: MATCH_TRUTH_LOG_LANE_V0.PREVIEW,
    sessionId: sessionId || null,
    entries: Object.freeze(entries),
    count: entries.length,
    appendOnly: true,
    interpretationOnly: true
  });
}

function appendPredictionLogEventV0(event) {
  const row = readPredictionLogRowV0();
  const prev = row?.entries || [];
  const nextSeq = prev.length > 0 ? Math.max(...prev.map((e) => e.seq)) + 1 : 1;
  const entry = Object.freeze({
    schema: MATCH_TRUTH_LOG_SCHEMA_V0,
    lane: MATCH_TRUTH_LOG_LANE_V0.PREVIEW,
    provenance: MATCH_TRUTH_PROVENANCE_V0.CLIENT_PREVIEW,
    ...event,
    seq: event.seq ?? nextSeq,
    atMs: event.atMs ?? Date.now(),
    sessionId: event.sessionId ?? event.payload?.sessionId ?? null
  });
  const entries = Object.freeze([...prev, entry].slice(-MAX_TRUTH_LOG_ENTRIES_V0));
  writePredictionLogRowV0(
    Object.freeze({
      schema: MATCH_TRUTH_LOG_SCHEMA_V0,
      lane: MATCH_TRUTH_LOG_LANE_V0.PREVIEW,
      entries,
      count: entries.length,
      appendOnly: true
    })
  );
  return entry;
}

function appendTruthLogEventV0(event) {
  const row = readTruthLogRowV0();
  const prev = row?.entries || [];
  const nextSeq = prev.length > 0 ? Math.max(...prev.map((e) => e.seq)) + 1 : 1;
  const entry = Object.freeze({
    schema: MATCH_TRUTH_LOG_SCHEMA_V0,
    lane: MATCH_TRUTH_LOG_LANE_V0.AUTHORITATIVE,
    ...event,
    seq: event.seq ?? nextSeq,
    atMs: event.atMs ?? Date.now(),
    sessionId: event.sessionId ?? event.payload?.sessionId ?? null
  });
  const entries = Object.freeze([...prev, entry].slice(-MAX_TRUTH_LOG_ENTRIES_V0));
  writeTruthLogRowV0(
    Object.freeze({
      schema: MATCH_TRUTH_LOG_SCHEMA_V0,
      entries,
      count: entries.length,
      appendOnly: true,
      truthModel: MATCH_TRUTH_MODEL_V0
    })
  );
  return entry;
}

function stripTruthEffectV0(state) {
  if (!state || !("__effect" in state)) return state;
  const { __effect: _ignored, ...clean } = state;
  return Object.freeze(clean);
}

/**
 * Deterministic rebuild from append-only log.
 */
export function replayMatchmakingTruthV0() {
  const log = getMatchmakingTruthLogV0();
  let state = { ...INITIAL_MATCH_TRUTH_STATE_V0 };
  for (const entry of log.entries) {
    state = stripTruthEffectV0(reduceMatchmakingTruthV0(state, entry, { skipKernelLog: true }));
  }
  return Object.freeze(state);
}

/**
 * Current truth projection — replays log when cache absent.
 */
export function getMatchmakingTruthSnapshotV0() {
  const cached = readTruthProjectionV0();
  if (cached?.schema === MATCH_TRUTH_SCHEMA_V0) {
    return Object.freeze({ ...cached, derivedFrom: "projection_cache" });
  }
  const replayed = replayMatchmakingTruthV0();
  writeTruthProjectionV0(replayed);
  return Object.freeze({ ...replayed, derivedFrom: "log_replay" });
}

/**
 * Client proposal — prediction log + shadow lane only (no authoritative commit).
 * @param {{ type: string, payload?: object, sessionId?: string }} event
 */
function dispatchMatchmakingProposalV0(event) {
  const type = MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE;
  const prev = getMatchmakingTruthSnapshotV0();
  const sessionId =
    event.sessionId ||
    event.payload?.sessionId ||
    prev.activeSession?.sessionId ||
    null;

  const previewEntry = appendPredictionLogEventV0({
    type,
    payload: {
      ...(event.payload || {}),
      autoCommitShadow: false,
      provenance: MATCH_TRUTH_PROVENANCE_V0.CLIENT_PREVIEW
    },
    sessionId
  });

  const reduced = reduceMatchmakingTruthV0(prev, previewEntry, { skipKernelLog: false });
  const effect = reduced.__effect || null;
  const next = stripTruthEffectV0(reduced);
  writeTruthProjectionV0(next);

  const chain = emitMatchTruthPreviewChainForEventV0({
    logEntry: previewEntry,
    effect,
    nextState: next,
    prevState: prev
  });

  const authority = getMatchTruthAuthoritySnapshotV0({ session: next.activeSession });

  return Object.freeze({
    ok: effect?.ok !== false,
    preview: true,
    event: previewEntry,
    state: next,
    session: next.activeSession,
    kernelState: next.kernelState,
    truthModel: MATCH_TRUTH_MODEL_V0,
    authority,
    truthChain: chain,
    singleWriterRule: true,
    interpretationOnly: true,
    ...(effect || {})
  });
}

/**
 * Single writer — authoritative log for server commits; proposals use prediction lane.
 * @param {{ type: string, payload?: object, sessionId?: string, provenance?: string, gatewayReady?: boolean }} event
 */
export function dispatchMatchmakingTruthEventV0(event) {
  const type = String(event?.type || "");
  if (!Object.values(MATCH_TRUTH_EVENT_V0).includes(type)) {
    return Object.freeze({ ok: false, reason: "unknown_truth_event", type, interpretationOnly: true });
  }

  if (type === MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE) {
    return dispatchMatchmakingProposalV0(event);
  }

  const provenance = event.provenance || event.payload?.provenance || null;
  const gatewayReady = event.gatewayReady === true || provenance === MATCH_TRUTH_PROVENANCE_V0.GATEWAY_ACK;

  if (
    type === MATCH_TRUTH_EVENT_V0.COMMIT_MOVE &&
    !canAppendAuthoritativeCommitV0({ type, provenance })
  ) {
    return Object.freeze({
      ok: false,
      reason: "single_writer_violation",
      requiredProvenance: MATCH_TRUTH_PROVENANCE_V0.GATEWAY_ACK,
      singleWriterRule: true,
      interpretationOnly: true
    });
  }

  const prev = getMatchmakingTruthSnapshotV0();
  const sessionId =
    event.sessionId ||
    event.payload?.sessionId ||
    prev.activeSession?.sessionId ||
    null;

  const logEntry = appendTruthLogEventV0({
    type,
    payload: {
      ...(event.payload || {}),
      provenance: provenance || event.payload?.provenance || null
    },
    sessionId,
    provenance
  });

  const reduced = reduceMatchmakingTruthV0(prev, logEntry, { skipKernelLog: false });
  const effect = reduced.__effect || null;
  const next = stripTruthEffectV0(reduced);
  writeTruthProjectionV0(next);

  const chain = emitMatchTruthDispatchChainForEventV0({
    logEntry,
    effect,
    nextState: next,
    prevState: prev,
    gatewayReady
  });

  const authority = getMatchTruthAuthoritySnapshotV0({
    session: next.activeSession,
    gatewayReady
  });

  return Object.freeze({
    ok: effect?.ok !== false,
    event: logEntry,
    state: next,
    session: next.activeSession,
    kernelState: next.kernelState,
    truthModel: MATCH_TRUTH_MODEL_V0,
    authority,
    truthChain: chain,
    singleWriterPolicy: getMatchSingleWriterPolicyV0({ gatewayReady }),
    interpretationOnly: true,
    ...(effect || {})
  });
}

/** @internal vitest */
export function clearMatchmakingTruthForTestV0() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(TRUTH_LOG_STORAGE_KEY_V0);
      sessionStorage.removeItem(PREDICTION_LOG_STORAGE_KEY_V0);
      sessionStorage.removeItem(TRUTH_PROJECTION_STORAGE_KEY_V0);
      sessionStorage.removeItem(SESSION_STORAGE_KEY_V0);
      sessionStorage.removeItem(BEACON_REGISTRY_STORAGE_KEY_V0);
    }
  } catch {
    /* noop */
  }
}

/**
 * Read-only production probe — answers "awake but producing?" without dispatching events.
 */
export function getMatchmakingTruthProductionStatusV0() {
  const log = getMatchmakingTruthLogV0();
  const snap = getMatchmakingTruthSnapshotV0();
  const last = log.entries.length > 0 ? log.entries[log.entries.length - 1] : null;
  const moveCount = snap.activeSession?.committed?.moveCount ?? 0;
  const eventTypes = log.entries.map((e) => e.type);
  const hasCommittedMove = eventTypes.some((t) => t === MATCH_TRUTH_EVENT_V0.COMMIT_MOVE);

  return Object.freeze({
    schema: MATCH_TRUTH_SCHEMA_V0,
    mode: log.count > 0 ? "producing" : "observation",
    awake: true,
    logCount: log.count,
    appendOnly: log.appendOnly,
    hasActiveSession: Boolean(snap.activeSession),
    committedMoveCount: moveCount,
    hasCommittedMove,
    lastEventType: last?.type ?? null,
    lastSeq: last?.seq ?? 0,
    truthModel: MATCH_TRUTH_MODEL_V0,
    singleRealitySource: "truth_log_v0",
    shadowRehearsal: true,
    deterministicReplayOk:
      log.count === 0 ||
      replayMatchmakingTruthV0().logSeq === log.count,
    verifyHint: "await window.__rhizoh.matchmaking.verifyProduction({ reset: true })",
    interpretationOnly: true
  });
}

/**
 * Manual production-flow verification — dispatches real events and checks replay.
 * Not run at boot; call from console when validating event production.
 * @param {{ reset?: boolean, playerId?: string }} [opts]
 */
export function runMatchmakingTruthProductionVerifyV0(opts = {}) {
  if (opts.reset === true) {
    clearMatchmakingTruthForTestV0();
  }

  const logBefore = getMatchmakingTruthLogV0().count;
  const predictionBefore = getMatchmakingPredictionLogV0().count;
  const snapBefore = getMatchmakingTruthSnapshotV0();
  const playerId = String(opts.playerId || "truth_verify_user");

  let sessionStep = null;
  if (!snapBefore.activeSession) {
    sessionStep = dispatchMatchmakingTruthEventV0({
      type: MATCH_TRUTH_EVENT_V0.SESSION_CREATE,
      payload: { initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE, players: [{ userId: playerId, color: "white" }] }
    });
    if (!sessionStep.ok) {
      return Object.freeze({ ok: false, reason: "session_create_failed", sessionStep, interpretationOnly: true });
    }
  }

  const sessionId = sessionStep?.session?.sessionId ?? snapBefore.activeSession?.sessionId;

  const proposeStep = dispatchMatchmakingTruthEventV0({
    type: MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE,
    sessionId,
    payload: { san: "e4", playerId, autoCommitShadow: false }
  });

  const commitStep = simulateGatewayMatchMoveAckV0({
    sessionId,
    san: "e4",
    playerId,
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    turn: "black",
    serverSeq: 1
  });

  const logAfter = getMatchmakingTruthLogV0();
  const predictionAfter = getMatchmakingPredictionLogV0();
  const replayed = replayMatchmakingTruthV0();
  const eventsProduced = logAfter.count - logBefore;
  const previewsProduced = predictionAfter.count - predictionBefore;
  const moveCount = replayed.activeSession?.committed?.moveCount ?? 0;
  const chainPhases = (commitStep.truthChain?.chain || []).map((c) => c.phase);
  const proposePhases = (proposeStep.truthChain?.chain || []).map((c) => c.phase);

  const ok =
    proposeStep.ok === true &&
    commitStep.ok === true &&
    previewsProduced >= 1 &&
    eventsProduced >= 1 &&
    moveCount >= 1 &&
    proposePhases.includes(MATCH_TRUTH_CHAIN_PHASE_V0.TRUTH_LOG_PREVIEW) &&
    chainPhases.includes(MATCH_TRUTH_CHAIN_PHASE_V0.TRUTH_LOG_APPEND) &&
    chainPhases.includes(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_COMMITTED) &&
    commitStep.authority?.serverAuthoritative === true;

  if (typeof console !== "undefined" && console.info) {
    console.info("[MATCH_TRUTH_VERIFY]", {
      ok,
      eventsProduced,
      previewsProduced,
      moveCount,
      logCount: logAfter.count,
      proposePhases,
      chainPhases,
      replayMoveCount: replayed.activeSession?.committed?.moveCount,
      serverAuthoritative: commitStep.authority?.serverAuthoritative,
      interpretationOnly: true
    });
  }

  return Object.freeze({
    ok,
    eventsProduced,
    previewsProduced,
    moveCount,
    sessionStep,
    proposeStep,
    commitStep,
    log: logAfter,
    predictionLog: predictionAfter,
    replayed,
    chainPhases,
    proposePhases,
    interpretationOnly: true,
    shadowRehearsal: true,
    singleWriterRule: true
  });
}

export function mountMatchmakingTruthKernelConsoleV0() {
  emitMatchTruthAuthorityBootObservabilityV0();
  return Object.freeze({
    schema: MATCH_TRUTH_SCHEMA_V0,
    truthModel: MATCH_TRUTH_MODEL_V0,
    events: MATCH_TRUTH_EVENT_V0,
    dispatch: dispatchMatchmakingTruthEventV0,
    snapshot: getMatchmakingTruthSnapshotV0,
    replay: replayMatchmakingTruthV0,
    log: getMatchmakingTruthLogV0,
    reduce: reduceMatchmakingTruthV0,
    authority: getMatchTruthAuthoritySnapshotV0,
    productionStatus: getMatchmakingTruthProductionStatusV0,
    verifyProduction: runMatchmakingTruthProductionVerifyV0,
    verifyAuthorityBoundary: runMatchmakingAuthorityBoundaryVerifyV0,
    verifyDriftInjection: runMatchmakingDriftInjectionVerifyV0,
    verifyBroadcastE2e: runMatchBroadcastE2eVerifyV0,
    clear: clearMatchmakingTruthForTestV0,
    interpretationOnly: true,
    shadowRehearsal: true
  });
}
