/**
 * User Activity Event Adapter v0 — World Bridge Layer 2 ingress stub.
 * Normalizes focus / navigation / interaction signals (interpretation-only).
 * RESEARCH-ONLY — no WAL write, no execution authority.
 */

import {
  INGESTION_LANE_V0,
  schedulePhaseCommitV0
} from "./executionPhaseSynchronizerV0.js";
import { ingestUserActivityLaneV0 } from "./crossSpaceCausalFusionV0.js";

export const USER_ACTIVITY_ADAPTER_SCHEMA_V0 = "castle.rhizoh.user_activity_adapter.v0";
export const USER_ACTIVITY_EVENT_V0 = "rhizoh:user-activity-event-v0";
export const USER_ACTIVITY_SPACE_ID_V0 = "user.activity.stream.space";

export const USER_ACTIVITY_TYPE_V0 = Object.freeze({
  FOCUS: "focus",
  NAVIGATE: "navigate",
  INTERACT: "interact",
  IDLE: "idle"
});

/**
 * @param {string} activityType
 */
export function deriveUserActivityFoxSignalsV0(activityType) {
  const type = String(activityType || USER_ACTIVITY_TYPE_V0.INTERACT);
  if (type === USER_ACTIVITY_TYPE_V0.IDLE) {
    return Object.freeze({ continuitySignal01: 0.15, noveltySignal01: 0.05, worldSignal01: 0.1 });
  }
  if (type === USER_ACTIVITY_TYPE_V0.FOCUS) {
    return Object.freeze({ continuitySignal01: 0.7, noveltySignal01: 0.1, worldSignal01: 0.35 });
  }
  if (type === USER_ACTIVITY_TYPE_V0.NAVIGATE) {
    return Object.freeze({ continuitySignal01: 0.45, noveltySignal01: 0.55, worldSignal01: 0.4 });
  }
  return Object.freeze({ continuitySignal01: 0.5, noveltySignal01: 0.35, worldSignal01: 0.45 });
}

/**
 * @param {object} raw
 */
export function normalizeUserActivityEventV0(raw = {}) {
  const activityType = String(raw.activityType || raw.type || USER_ACTIVITY_TYPE_V0.INTERACT);
  const activityId = String(raw.activityId || raw.id || `act_${Date.now()}`);
  const atMs = Number(raw.atMs) || Date.now();

  return Object.freeze({
    schema: USER_ACTIVITY_ADAPTER_SCHEMA_V0,
    activityType,
    activityId,
    atMs,
    causalSpaceId: USER_ACTIVITY_SPACE_ID_V0,
    payload: Object.freeze({
      surface: raw.surface ? String(raw.surface).slice(0, 80) : null,
      target: raw.target ? String(raw.target).slice(0, 120) : null,
      durationMs: Number(raw.durationMs) > 0 ? Number(raw.durationMs) : null,
      detail: raw.detail ? String(raw.detail).slice(0, 240) : null
    }),
    foxSignals: deriveUserActivityFoxSignalsV0(activityType),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/** @type {object[]} */
const activityLogV0 = [];

/**
 * @param {object} normalized
 * @param {{ dispatchEvent?: boolean }} [opts]
 */
export function ingestUserActivityEventV0(normalized, opts = {}) {
  activityLogV0.unshift(normalized);
  if (activityLogV0.length > 64) activityLogV0.length = 64;

  schedulePhaseCommitV0({
    atMs: normalized.atMs,
    source: `user_activity:${normalized.activityType}`,
    ingest: [
      {
        lane: INGESTION_LANE_V0.USER_ACTIVITY,
        payload: {
          activityId: normalized.activityId,
          activityType: normalized.activityType,
          foxSignals: normalized.foxSignals
        }
      }
    ]
  });

  const lane = ingestUserActivityLaneV0({
    activityId: normalized.activityId,
    activityType: normalized.activityType,
    foxSignals: normalized.foxSignals,
    source: `user_activity:${normalized.activityType}`
  });

  if (opts.dispatchEvent !== false && typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(
      new CustomEvent(USER_ACTIVITY_EVENT_V0, {
        detail: Object.freeze({ normalized, lane })
      })
    );
  }

  return Object.freeze({
    schema: USER_ACTIVITY_ADAPTER_SCHEMA_V0,
    normalized,
    lane,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getUserActivityAdapterSnapshotV0() {
  return Object.freeze({
    schema: `${USER_ACTIVITY_ADAPTER_SCHEMA_V0}.snapshot`,
    recentCount: activityLogV0.length,
    recent: Object.freeze(activityLogV0.slice(0, 8)),
    spaceId: USER_ACTIVITY_SPACE_ID_V0,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function resetUserActivityAdapterForTestV0() {
  activityLogV0.length = 0;
}
