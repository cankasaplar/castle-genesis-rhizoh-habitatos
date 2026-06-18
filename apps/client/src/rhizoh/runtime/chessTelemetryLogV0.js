/**
 * Chess telemetry log gating — compress + enrich (not blind reduction).
 * SLOT 0 (spectator anchor) always traces moves at L0+ for deterministic root-cause.
 * RESEARCH-ONLY
 */

import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "./chessLearningMonitorV0.js";
import { TOPOLOGY_EVENT_TYPES_V0 } from "./rhizohTopologyEventEmitterV0.js";
import { appendShadowTraceFromDriftEventV0 } from "./rhizohShadowTraceLedgerV0.js";

export const CHESS_TELEMETRY_LOG_SCHEMA_V0 = "castle.rhizoh.chess_telemetry_log.v0";
export const CHESS_TELEMETRY_LEVEL_STORAGE_KEY_V0 = "rhizoh_chess_telemetry_level_v0";

/** L0=critical, L1=moves (slot0 always + sample), L2=topology locked, L3=verbose */
export const CHESS_TELEMETRY_LEVEL_V0 = Object.freeze({
  CRITICAL: 0,
  MOVES: 1,
  TOPOLOGY_LOCKED: 2,
  VERBOSE: 3
});

const MOVE_SAMPLE_MOD_V0 = 10;

let moveSampleCounterV0 = 0;
let causalSeqV0 = 0;

/**
 * @returns {number} 0..3
 */
export function resolveChessTelemetryLevelV0() {
  if (typeof window !== "undefined") {
    try {
      const override = window.__rhizoh?.debug?.chessTelemetryLevel;
      if (override != null && Number.isFinite(Number(override))) {
        return Math.max(0, Math.min(3, Number(override)));
      }
      const stored = window.localStorage?.getItem(CHESS_TELEMETRY_LEVEL_STORAGE_KEY_V0);
      if (stored != null && stored !== "") {
        return Math.max(0, Math.min(3, Number(stored) || 0));
      }
    } catch {
      /* noop */
    }
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return CHESS_TELEMETRY_LEVEL_V0.VERBOSE;
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_DEBUG === "1") {
    return CHESS_TELEMETRY_LEVEL_V0.MOVES;
  }
  return CHESS_TELEMETRY_LEVEL_V0.CRITICAL;
}

/**
 * @param {number} level
 */
export function setChessTelemetryLevelV0(level) {
  const n = Math.max(0, Math.min(3, Number(level) || 0));
  if (typeof window !== "undefined") {
    try {
      window.localStorage?.setItem(CHESS_TELEMETRY_LEVEL_STORAGE_KEY_V0, String(n));
    } catch {
      /* noop */
    }
  }
  return n;
}

/**
 * @param {string|null|undefined} matchId
 * @returns {number|null}
 */
export function parseChessClusterSlotIdFromMatchIdV0(matchId) {
  const m = String(matchId || "").match(/^cluster_(\d+)_/);
  return m ? Number(m[1]) : null;
}

/**
 * @param {{ slotId?: number|null, matchId?: string|null, moveNumber?: number|null }} ctx
 */
export function resolveChessTelemetrySlotIdV0(ctx = {}) {
  if (ctx.slotId != null && Number.isFinite(Number(ctx.slotId))) return Number(ctx.slotId);
  return parseChessClusterSlotIdFromMatchIdV0(ctx.matchId);
}

/**
 * @param {{ slotId?: number|null, matchId?: string|null, moveNumber?: number|null }} ctx
 */
export function shouldLogChessMovePlayedV0(ctx = {}) {
  const level = resolveChessTelemetryLevelV0();
  const slotId = resolveChessTelemetrySlotIdV0(ctx);
  if (slotId === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0) return true;
  if (level >= CHESS_TELEMETRY_LEVEL_V0.MOVES) {
    moveSampleCounterV0 += 1;
    return moveSampleCounterV0 % MOVE_SAMPLE_MOD_V0 === 0;
  }
  return false;
}

/**
 * @param {{ eventType?: string|null, driftMagnitude?: number|null }} ctx
 */
export function shouldLogChessTopologyEventV0(ctx = {}) {
  const level = resolveChessTelemetryLevelV0();
  const eventType = String(ctx.eventType || "");
  const magnitude = Number(ctx.driftMagnitude) || 0;

  if (
    eventType === TOPOLOGY_EVENT_TYPES_V0.DRIFT_DETECTED ||
    eventType === TOPOLOGY_EVENT_TYPES_V0.JUMP_ANOMALY
  ) {
    return true;
  }

  if (eventType === TOPOLOGY_EVENT_TYPES_V0.CLUSTER_LOCKED) {
    return level >= CHESS_TELEMETRY_LEVEL_V0.TOPOLOGY_LOCKED;
  }

  return level >= CHESS_TELEMETRY_LEVEL_V0.VERBOSE || magnitude >= 0.5;
}

/**
 * @param {{ driftMagnitude?: number|null, slotId?: number|null, matchId?: string|null }} ctx
 */
export function shouldLogChessGeometryDriftV0(ctx = {}) {
  const level = resolveChessTelemetryLevelV0();
  const slotId = resolveChessTelemetrySlotIdV0(ctx);
  const z = Number(ctx.driftMagnitude ?? ctx.z) || 0;
  const familyMismatch = ctx.familyMismatch === true;

  if (z >= 0.12 || familyMismatch) return true;
  if (slotId === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0) return true;
  return level >= CHESS_TELEMETRY_LEVEL_V0.VERBOSE;
}

/**
 * @param {{ driftMagnitude?: number|null, slotId?: number|null, matchId?: string|null }} ctx
 */
export function shouldLogChessUgeHookV0(ctx = {}) {
  const level = resolveChessTelemetryLevelV0();
  const slotId = resolveChessTelemetrySlotIdV0(ctx);
  const drift = Number(ctx.driftMagnitude) || 0;
  if (drift >= 0.12) return true;
  if (slotId === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0) return level >= CHESS_TELEMETRY_LEVEL_V0.MOVES;
  return level >= CHESS_TELEMETRY_LEVEL_V0.VERBOSE;
}

/**
 * @param {string} severity
 * @param {Record<string, unknown>} detail
 */
export function buildChessDriftLogEnvelopeV0(severity, detail = {}) {
  causalSeqV0 += 1;
  const slotId = resolveChessTelemetrySlotIdV0(detail);
  const moveNumber = detail.moveNumber ?? detail.layer ?? null;
  const matchId = detail.matchId || null;
  const entropyScore = Number(detail.entropyScore ?? detail.driftMagnitude ?? detail.z) || 0;
  const causalChainId = `chess_drift_${String(matchId || "na")}_${String(moveNumber ?? "x")}_${causalSeqV0}`;

  return Object.freeze({
    schema: CHESS_TELEMETRY_LOG_SCHEMA_V0,
    kind: "DRIFT_EVENT",
    severity: String(severity || "info"),
    clusterId: slotId,
    slotId,
    matchId,
    moveNumber,
    entropyScore,
    causalChainId,
    telemetryLevel: resolveChessTelemetryLevelV0(),
    ...detail
  });
}

/**
 * @param {"info"|"warn"} level
 * @param {string} tag
 * @param {Record<string, unknown>} detail
 */
export function logChessTelemetryGatedV0(level, tag, detail = {}) {
  if (typeof console === "undefined") return null;
  const fn = level === "warn" ? console.warn : console.info;
  if (!fn) return null;
  fn(tag, detail);
  if (detail?.kind === "DRIFT_EVENT") {
    appendShadowTraceFromDriftEventV0(detail);
  }
  return detail;
}

/** @internal vitest */
export function __resetChessTelemetryLogForTestV0() {
  moveSampleCounterV0 = 0;
  causalSeqV0 = 0;
}
