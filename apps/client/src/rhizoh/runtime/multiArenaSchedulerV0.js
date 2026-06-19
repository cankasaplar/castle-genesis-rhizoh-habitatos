/**
 * Multi-Arena Scheduler v0 — reality multiplexer (execution governance).
 * Answers: "Which reality is active this tick?"
 * Orchestrates only — mutates no domain state.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_MULTI_ARENA_SCHEDULER_V0.md
 */

import { resolveDomainDescriptorV0 } from "./rhizohDomainFabricV0.js";
import {
  getChessEngineContentionSnapshotV0,
  isChessArenaWorkspaceOpenV0
} from "./chessEngineContentionGateV0.js";
import { CAUSAL_SPACE_ID_V0 } from "./sportsCausalSpaceV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";

export const MULTI_ARENA_SCHEDULER_SCHEMA_V0 = "castle.rhizoh.multi_arena_scheduler.v0";
export const MULTI_ARENA_TICK_EVENT_V0 = "rhizoh:multi-arena-tick-v0";
export const ARENA_SPACE_OVERLAY_V0 = "cux.perception.overlay";

export const ARENA_EXECUTION_MODE_V0 = Object.freeze({
  BASELINE_ALWAYS: "baseline_always",
  BURST_WINDOW: "burst_window",
  OVERLAY_ONLY: "overlay_only",
  SUSPENDED: "suspended"
});

export const ARENA_ARBITRATION_REASON_V0 = Object.freeze({
  CHESS_BASELINE_DEFAULT: "chess_baseline_default",
  CHESS_ARENA_WORKSPACE_OPEN: "chess_arena_workspace_open",
  CHESS_ENGINE_CONTENTION: "chess_engine_contention",
  SPORTS_BURST_WINDOW: "sports_burst_window",
  SPACE_SUSPENDED: "space_suspended"
});

const SPORTS_BURST_DEFAULT_MS_V0 = 8_000;
const CHESS_BASELINE_QUOTA_V0 = 0.6;
const SPORTS_BURST_QUOTA_V0 = 0.35;
const CUX_OVERLAY_QUOTA_V0 = 0.05;

/** @type {Map<string, object>} */
const frameRegistryV0 = new Map();

let tickCounterV0 = 0;
/** @type {object | null} */
let lastTickV0 = null;

let sportsBurstUntilMsV0 = 0;
let sportsBurstReasonV0 = null;
let sportsEventCountInBurstV0 = 0;

function buildDefaultArenaFrameV0(spaceId) {
  switch (spaceId) {
    case CAUSAL_SPACE_ID_V0.CHESS:
      return Object.freeze({
        spaceId,
        gameType: RHIZOH_UGL_GAME_TYPE_V0.CHESS,
        priority: 100,
        executionMode: ARENA_EXECUTION_MODE_V0.BASELINE_ALWAYS,
        executionWindow: Object.freeze({ kind: "always" }),
        resourceQuota: CHESS_BASELINE_QUOTA_V0,
        recAffinity: "deterministic_rec"
      });
    case CAUSAL_SPACE_ID_V0.SPORTS:
      return Object.freeze({
        spaceId,
        gameType: RHIZOH_UGL_GAME_TYPE_V0.SPORTS,
        priority: 60,
        executionMode: ARENA_EXECUTION_MODE_V0.BURST_WINDOW,
        executionWindow: Object.freeze({ kind: "burst", durationMs: SPORTS_BURST_DEFAULT_MS_V0 }),
        resourceQuota: SPORTS_BURST_QUOTA_V0,
        recAffinity: "stochastic_rec"
      });
    case ARENA_SPACE_OVERLAY_V0:
      return Object.freeze({
        spaceId,
        gameType: RHIZOH_UGL_GAME_TYPE_V0.CUSTOM,
        priority: 10,
        executionMode: ARENA_EXECUTION_MODE_V0.OVERLAY_ONLY,
        executionWindow: Object.freeze({ kind: "always" }),
        resourceQuota: CUX_OVERLAY_QUOTA_V0,
        recAffinity: "perception_overlay"
      });
    default:
      return Object.freeze({
        spaceId,
        gameType: RHIZOH_UGL_GAME_TYPE_V0.CUSTOM,
        priority: 0,
        executionMode: ARENA_EXECUTION_MODE_V0.SUSPENDED,
        executionWindow: Object.freeze({ kind: "burst", durationMs: 0 }),
        resourceQuota: 0,
        recAffinity: "unknown"
      });
  }
}

function ensureDefaultFramesV0() {
  if (frameRegistryV0.size > 0) return;
  for (const spaceId of [
    CAUSAL_SPACE_ID_V0.CHESS,
    CAUSAL_SPACE_ID_V0.SPORTS,
    ARENA_SPACE_OVERLAY_V0
  ]) {
    frameRegistryV0.set(spaceId, buildDefaultArenaFrameV0(spaceId));
  }
}

/**
 * @param {object} frame ArenaFrame
 */
export function registerArenaFrameV0(frame) {
  ensureDefaultFramesV0();
  const spaceId = String(frame?.spaceId || "");
  if (!spaceId) return null;
  const frozen = Object.freeze({
    ...buildDefaultArenaFrameV0(spaceId),
    ...frame,
    spaceId,
    executionWindow: Object.freeze({
      ...(frame.executionWindow || buildDefaultArenaFrameV0(spaceId).executionWindow)
    })
  });
  frameRegistryV0.set(spaceId, frozen);
  return frozen;
}

export function listArenaFramesV0() {
  ensureDefaultFramesV0();
  return Object.freeze([...frameRegistryV0.values()].sort((a, b) => b.priority - a.priority));
}

/**
 * @param {string} gameType
 */
export function gameTypeToSpaceIdV0(gameType) {
  const descriptor = resolveDomainDescriptorV0(gameType);
  if (descriptor.causalSpaceId) return String(descriptor.causalSpaceId);
  if (descriptor.domainId === "chess") return CAUSAL_SPACE_ID_V0.CHESS;
  if (descriptor.domainId === "sports") return CAUSAL_SPACE_ID_V0.SPORTS;
  return `space.${descriptor.domainId}`;
}

/**
 * Extend sports burst execution window (called on event-dense ingest).
 * @param {{ durationMs?: number, reason?: string }} [opts]
 */
export function notifySportsArenaActivityV0(opts = {}) {
  const durationMs = Math.max(1_000, Number(opts.durationMs) || SPORTS_BURST_DEFAULT_MS_V0);
  const now = Date.now();
  sportsBurstUntilMsV0 = Math.max(sportsBurstUntilMsV0, now + durationMs);
  sportsBurstReasonV0 = String(opts.reason || "sports_event");
  sportsEventCountInBurstV0 += 1;
  return Object.freeze({
    burstUntilMs: sportsBurstUntilMsV0,
    reason: sportsBurstReasonV0,
    eventCount: sportsEventCountInBurstV0
  });
}

/**
 * @param {object} frame
 * @param {number} now
 */
function resolveFrameExecutionStateV0(frame, now) {
  if (frame.spaceId === CAUSAL_SPACE_ID_V0.CHESS) {
    return Object.freeze({
      spaceId: frame.spaceId,
      granted: true,
      executionMode: ARENA_EXECUTION_MODE_V0.BASELINE_ALWAYS,
      resourceQuota: frame.resourceQuota,
      recAffinity: frame.recAffinity
    });
  }

  if (frame.spaceId === CAUSAL_SPACE_ID_V0.SPORTS) {
    const inBurst = now < sportsBurstUntilMsV0;
    return Object.freeze({
      spaceId: frame.spaceId,
      granted: inBurst,
      executionMode: inBurst ? ARENA_EXECUTION_MODE_V0.BURST_WINDOW : ARENA_EXECUTION_MODE_V0.SUSPENDED,
      resourceQuota: inBurst ? frame.resourceQuota : 0,
      recAffinity: frame.recAffinity,
      burstUntilMs: sportsBurstUntilMsV0,
      burstReason: sportsBurstReasonV0
    });
  }

  if (frame.spaceId === ARENA_SPACE_OVERLAY_V0) {
    return Object.freeze({
      spaceId: frame.spaceId,
      granted: true,
      executionMode: ARENA_EXECUTION_MODE_V0.OVERLAY_ONLY,
      resourceQuota: frame.resourceQuota,
      recAffinity: frame.recAffinity
    });
  }

  return Object.freeze({
    spaceId: frame.spaceId,
    granted: false,
    executionMode: ARENA_EXECUTION_MODE_V0.SUSPENDED,
    resourceQuota: 0,
    recAffinity: frame.recAffinity
  });
}

/**
 * Select which causal space owns execution attention this tick.
 * @param {number} [now]
 */
export function selectActiveArenaFrameV0(now = Date.now()) {
  ensureDefaultFramesV0();
  const frames = listArenaFramesV0();
  const frameStates = frames.map((frame) =>
    Object.freeze({
      frame,
      state: resolveFrameExecutionStateV0(frame, now)
    })
  );

  const contention = getChessEngineContentionSnapshotV0();
  const sportsState = frameStates.find((row) => row.frame.spaceId === CAUSAL_SPACE_ID_V0.SPORTS);
  const sportsBurstActive =
    Boolean(sportsState?.state.granted) && sportsEventCountInBurstV0 > 0;

  let primarySpaceId = CAUSAL_SPACE_ID_V0.CHESS;
  let arbitrationReason = ARENA_ARBITRATION_REASON_V0.CHESS_BASELINE_DEFAULT;

  if (isChessArenaWorkspaceOpenV0()) {
    primarySpaceId = CAUSAL_SPACE_ID_V0.CHESS;
    arbitrationReason = ARENA_ARBITRATION_REASON_V0.CHESS_ARENA_WORKSPACE_OPEN;
  } else if (contention.contended && contention.arenaWorkspaceOpen) {
    primarySpaceId = CAUSAL_SPACE_ID_V0.CHESS;
    arbitrationReason = ARENA_ARBITRATION_REASON_V0.CHESS_ENGINE_CONTENTION;
  } else if (sportsBurstActive) {
    primarySpaceId = CAUSAL_SPACE_ID_V0.SPORTS;
    arbitrationReason = ARENA_ARBITRATION_REASON_V0.SPORTS_BURST_WINDOW;
  }

  const primaryFrame = frameStates.find((row) => row.frame.spaceId === primarySpaceId) || frameStates[0];

  return Object.freeze({
    schema: `${MULTI_ARENA_SCHEDULER_SCHEMA_V0}.selection`,
    primarySpaceId,
    baselineSpaceId: CAUSAL_SPACE_ID_V0.CHESS,
    overlaySpaceId: ARENA_SPACE_OVERLAY_V0,
    arbitrationReason,
    primaryFrame: primaryFrame?.frame || null,
    frameStates,
    sportsBurstActive,
    sportsEventCountInBurst: sportsEventCountInBurstV0,
    contention: Object.freeze({
      contended: contention.contended,
      arenaWorkspaceOpen: contention.arenaWorkspaceOpen,
      chessLock: contention.chessLock
    }),
    atMs: now,
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true
  });
}

/**
 * @param {string} spaceId
 * @param {number} [now]
 */
export function isSpaceExecutionGrantedV0(spaceId, now = Date.now()) {
  ensureDefaultFramesV0();
  const frame = frameRegistryV0.get(String(spaceId || ""));
  if (!frame) return false;
  return resolveFrameExecutionStateV0(frame, now).granted;
}

/**
 * @param {string} gameType
 * @param {number} [now]
 */
export function resolveSchedulerRouteForGameTypeV0(gameType, now = Date.now()) {
  const spaceId = gameTypeToSpaceIdV0(gameType);
  const selection = selectActiveArenaFrameV0(now);
  const executionGranted = isSpaceExecutionGrantedV0(spaceId, now);
  const isPrimary = selection.primarySpaceId === spaceId;

  return Object.freeze({
    schema: `${MULTI_ARENA_SCHEDULER_SCHEMA_V0}.route`,
    gameType: String(gameType || RHIZOH_UGL_GAME_TYPE_V0.CHESS),
    spaceId,
    executionGranted,
    isPrimary,
    primarySpaceId: selection.primarySpaceId,
    arbitrationReason: selection.arbitrationReason,
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true
  });
}

/**
 * @param {{ atMs?: number, phaseSeq?: number, phaseLock?: boolean }} [opts]
 */
export function runMultiArenaTickV0(opts = {}) {
  const now = Number(opts.atMs) || Date.now();
  tickCounterV0 += 1;
  const selection = selectActiveArenaFrameV0(now);

  const tick = Object.freeze({
    schema: MULTI_ARENA_SCHEDULER_SCHEMA_V0,
    tickId: tickCounterV0,
    atMs: now,
    phaseSeq: opts.phaseSeq ?? null,
    phaseLock: Boolean(opts.phaseLock),
    selection,
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true
  });

  lastTickV0 = tick;

  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(MULTI_ARENA_TICK_EVENT_V0, { detail: tick }));
  }

  return tick;
}

export function getMultiArenaSchedulerSnapshotV0() {
  const selection = selectActiveArenaFrameV0();
  return Object.freeze({
    schema: `${MULTI_ARENA_SCHEDULER_SCHEMA_V0}.snapshot`,
    tickCounter: tickCounterV0,
    lastTick: lastTickV0,
    selection,
    frames: listArenaFramesV0(),
    sportsBurst: Object.freeze({
      untilMs: sportsBurstUntilMsV0,
      reason: sportsBurstReasonV0,
      eventCount: sportsEventCountInBurstV0
    }),
    diagnosis: Object.freeze({
      multiModule: true,
      multiSpaceGovernance: tickCounterV0 > 0 || sportsBurstUntilMsV0 > Date.now(),
      chessHegemonBroken: selection.arbitrationReason === ARENA_ARBITRATION_REASON_V0.SPORTS_BURST_WINDOW
    }),
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true,
    atMs: Date.now()
  });
}

export function buildMultiArenaSchedulerReportV0() {
  const snap = getMultiArenaSchedulerSnapshotV0();
  return Object.freeze({
    schema: `${MULTI_ARENA_SCHEDULER_SCHEMA_V0}.report`,
    note: "Reality multiplexer — selects active causal space per tick without mutating domain state",
    snapshot: snap,
    apis: Object.freeze({
      snapshot: "window.__rhizoh.multiArenaScheduler()",
      tick: "window.__rhizoh.multiArenaTick()",
      notifySports: "window.__rhizoh.notifySportsArenaActivity()"
    }),
    atMs: Date.now()
  });
}

export function ensureMultiArenaSchedulerV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (!window.__rhizoh.multiArenaScheduler) {
    window.__rhizoh.multiArenaScheduler = () => getMultiArenaSchedulerSnapshotV0();
  }
  if (!window.__rhizoh.multiArenaSchedulerReport) {
    window.__rhizoh.multiArenaSchedulerReport = () => buildMultiArenaSchedulerReportV0();
  }
  if (!window.__rhizoh.multiArenaTick) {
    window.__rhizoh.multiArenaTick = (opts) => runMultiArenaTickV0(opts);
  }
  if (!window.__rhizoh.notifySportsArenaActivity) {
    window.__rhizoh.notifySportsArenaActivity = (opts) => {
      const burst = notifySportsArenaActivityV0(opts);
      return runMultiArenaTickV0();
    };
  }
  ensureDefaultFramesV0();
  return window.__rhizoh.multiArenaScheduler;
}

/** @internal vitest */
export function resetMultiArenaSchedulerForTestV0() {
  frameRegistryV0.clear();
  tickCounterV0 = 0;
  lastTickV0 = null;
  sportsBurstUntilMsV0 = 0;
  sportsBurstReasonV0 = null;
  sportsEventCountInBurstV0 = 0;
  ensureDefaultFramesV0();
}
