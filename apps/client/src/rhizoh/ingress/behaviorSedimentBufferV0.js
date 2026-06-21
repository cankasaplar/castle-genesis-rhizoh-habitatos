/**
 * Behavior Sediment Buffer v0 — Plane E (PATH B habitat layer).
 * Persistent behavioral traces: visits · dwell · return rate · session depth.
 * NOT authority · NOT narrative truth · NOT learning · NOT causal write.
 * @see docs/RHIZOH_BEHAVIOR_SEDIMENT_V0.md
 */

import {
  getObserverTraceSnapshotV0,
  OBSERVER_PLANE_V0,
  OBSERVER_TRACE_EXCLUDED_SINKS_V0
} from "./observerReadOnlyHookV0.js";
import { normalizePinTargetIdV0 } from "./epistemicPinSemanticRegistryV0.js";
import {
  detectEpistemicEchoLoopV0,
  runEpistemicConsumeOnlyPassV0
} from "./epistemicInvocationGuardV0.js";

export const BEHAVIOR_SEDIMENT_SCHEMA_V0 = "castle.rhizoh.behavior_sediment.v0";
export const BEHAVIOR_ENTITY_RECORD_SCHEMA_V0 = "castle.rhizoh.behavior_entity_record.v0";

const BEHAVIOR_STORAGE_KEY_V0 = "rhizoh.behavior_sediment.v0";
const SESSION_GAP_MS_V0 = 30 * 60 * 1000;
const VISIT_GAP_MS_V0 = 5 * 60 * 1000;
const MAX_DWELL_GAP_MS_V0 = 5 * 60 * 1000;
const MAX_ENTITY_RECORDS_V0 = 64;

const BEHAVIOR_EVENT_TYPES_V0 = Object.freeze([
  "map_enter",
  "map_dwell",
  "map_exit",
  "map_hover",
  "map_visit",
  "map_camera",
  "pin_enter",
  "pin_dwell",
  "pin_exit"
]);

/**
 * @param {object} entry
 */
function isBehaviorRelevantEntryV0(entry) {
  const type = String(entry?.type || "").toLowerCase();
  const surface = entry?.meta?.surface;
  if (surface === "map" || surface === "world") return true;
  return BEHAVIOR_EVENT_TYPES_V0.some((t) => type.includes(t.replace("map_", "")) || type === t);
}

/**
 * @param {object} entry
 */
function resolveEntityIdV0(entry) {
  const raw = normalizePinTargetIdV0(entry?.target || "");
  if (!raw) return "";
  if (raw.startsWith("pin_")) return raw.replace(/^pin_/, "");
  return raw;
}

/**
 * @param {readonly object[]} entries
 */
function aggregateBehaviorFromTraceV0(entries) {
  const sorted = [...entries]
    .filter((e) => isBehaviorRelevantEntryV0(e) && resolveEntityIdV0(e))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));

  const sessions = [];
  let currentSession = null;

  for (const entry of sorted) {
    const ts = entry.ts || Date.now();
    if (!currentSession || ts - currentSession.lastTs > SESSION_GAP_MS_V0) {
      currentSession = { startTs: ts, lastTs: ts, events: [] };
      sessions.push(currentSession);
    }
    currentSession.lastTs = ts;
    currentSession.events.push(entry);
  }

  const entityBuckets = new Map();

  for (let sessionIdx = 0; sessionIdx < sessions.length; sessionIdx++) {
    const session = sessions[sessionIdx];
    const sessionEntities = new Set();
    const perEntityVisits = new Map();
    const entitySeenThisSession = new Set();

    for (let i = 0; i < session.events.length; i++) {
      const entry = session.events[i];
      const entityId = resolveEntityIdV0(entry);
      if (!entityId) continue;
      sessionEntities.add(entityId);

      const bucket =
        entityBuckets.get(entityId) ||
        {
          entity: entityId,
          visits: 0,
          dwellMsTotal: 0,
          sessionIds: new Set(),
          returnSessionCount: 0,
          sessionDepthSum: 0,
          sessionDepthCount: 0,
          firstSeenMs: entry.ts || Date.now(),
          lastSeenMs: entry.ts || Date.now()
        };

      const visitKey = `${sessionIdx}:${entityId}`;
      let visitState = perEntityVisits.get(visitKey);
      const prevEntry = session.events[i - 1];
      const gapSincePrev =
        prevEntry && resolveEntityIdV0(prevEntry) === entityId
          ? Math.max(0, (entry.ts || 0) - (prevEntry.ts || 0))
          : VISIT_GAP_MS_V0 + 1;

      if (!visitState || gapSincePrev > VISIT_GAP_MS_V0 || String(entry.type || "").includes("enter")) {
        visitState = { dwellMs: 0 };
        perEntityVisits.set(visitKey, visitState);
        bucket.visits += 1;
      }

      const explicitDwell = Number(entry.meta?.dwellMs);
      if (Number.isFinite(explicitDwell) && explicitDwell > 0) {
        visitState.dwellMs += explicitDwell;
      } else if (prevEntry && resolveEntityIdV0(prevEntry) === entityId) {
        visitState.dwellMs += Math.min(MAX_DWELL_GAP_MS_V0, gapSincePrev);
      } else if (String(entry.type || "").includes("dwell")) {
        visitState.dwellMs += 30_000;
      }

      if (!entitySeenThisSession.has(entityId)) {
        entitySeenThisSession.add(entityId);
        const isReturn = bucket.sessionIds.size > 0 && !bucket.sessionIds.has(sessionIdx);
        bucket.sessionIds.add(sessionIdx);
        if (isReturn) bucket.returnSessionCount += 1;
      }

      bucket.lastSeenMs = Math.max(bucket.lastSeenMs, entry.ts || Date.now());
      bucket.firstSeenMs = Math.min(bucket.firstSeenMs, entry.ts || Date.now());
      entityBuckets.set(entityId, bucket);
    }

    for (const [visitKey, visitState] of perEntityVisits) {
      const entityId = visitKey.split(":")[1];
      const bucket = entityBuckets.get(entityId);
      if (bucket) bucket.dwellMsTotal += visitState.dwellMs;
    }

    const depth = sessionEntities.size;
    for (const entityId of sessionEntities) {
      const bucket = entityBuckets.get(entityId);
      if (bucket) {
        bucket.sessionDepthSum += depth;
        bucket.sessionDepthCount += 1;
      }
    }
  }

  const records = [...entityBuckets.values()]
    .map((b) => {
      const visits = Math.max(0, b.visits);
      const avgDwellTime = visits > 0 ? Math.round(b.dwellMsTotal / visits) : 0;
      const sessionCount = b.sessionIds.size;
      const returnRate =
        sessionCount > 1
          ? Math.round((b.returnSessionCount / Math.max(1, sessionCount - 1)) * 1000) / 1000
          : visits > 1
            ? Math.round(((visits - 1) / visits) * 1000) / 1000
            : 0;
      const sessionDepth =
        b.sessionDepthCount > 0
          ? Math.round((b.sessionDepthSum / b.sessionDepthCount) * 10) / 10
          : 0;

      return Object.freeze({
        schema: BEHAVIOR_ENTITY_RECORD_SCHEMA_V0,
        entity: b.entity,
        visits,
        avgDwellTime,
        returnRate,
        sessionDepth,
        dwellMsTotal: b.dwellMsTotal,
        sessionCount,
        firstSeenMs: b.firstSeenMs,
        lastSeenMs: b.lastSeenMs,
        behaviorBias: true,
        truthBias: false,
        interpretationOnly: true
      });
    })
    .sort((a, b) => b.visits * b.avgDwellTime - a.visits * a.avgDwellTime)
    .slice(0, MAX_ENTITY_RECORDS_V0);

  const habitatAvgDwell =
    records.length > 0
      ? Math.round(records.reduce((a, r) => a + r.avgDwellTime, 0) / records.length)
      : 0;

  return Object.freeze({
    records: Object.freeze(records),
    entityCount: records.length,
    habitatAvgDwellMs: habitatAvgDwell,
    sessionCount: sessions.length
  });
}

function readBehaviorRowV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BEHAVIOR_STORAGE_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeBehaviorRowV0(row) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(BEHAVIOR_STORAGE_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

/**
 * Consume existing observer trace → refresh behavior sediment (single pass, no observe).
 */
export function refreshBehaviorSedimentFromTraceV0() {
  const trace = getObserverTraceSnapshotV0();
  const observerCountBefore = trace?.count ?? 0;

  return runEpistemicConsumeOnlyPassV0(() => {
    const entries = trace?.entries || [];
    const agg = aggregateBehaviorFromTraceV0(entries);
    const refreshedAtMs = Date.now();

    const row = Object.freeze({
      schema: BEHAVIOR_SEDIMENT_SCHEMA_V0,
      plane: OBSERVER_PLANE_V0.BEHAVIOR_SEDIMENT,
      refreshedAtMs,
      records: agg.records,
      entityCount: agg.entityCount,
      habitatAvgDwellMs: agg.habitatAvgDwellMs,
      sessionCount: agg.sessionCount,
      accumulates: true,
      learns: false,
      generalizes: false,
      isBehaviorSediment: true,
      behaviorBias: true,
      truthBias: false,
      influencesCausalGraph: false,
      influencesIdentity: false,
      influencesAuthority: false,
      influencesTruthClaims: false,
      excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
      authorityPolicy: Object.freeze({ causal: "hard", semantic: "soft", identity: "none" }),
      interpretationOnly: true
    });

    writeBehaviorRowV0(row);
    syncBehaviorWindowV0(row);

    const after = getObserverTraceSnapshotV0();
    const echoGuard = detectEpistemicEchoLoopV0({
      observerCountBefore,
      observerCountAfter: after?.count ?? 0
    });

    return Object.freeze({ ...row, echoGuard, invocationAsymmetry: echoGuard.invocationAsymmetryHolds });
  }, observerCountBefore);
}

export function getBehaviorSedimentSnapshotV0() {
  const row = readBehaviorRowV0();
  if (!row) {
    return Object.freeze({
      schema: BEHAVIOR_SEDIMENT_SCHEMA_V0,
      plane: OBSERVER_PLANE_V0.BEHAVIOR_SEDIMENT,
      records: Object.freeze([]),
      entityCount: 0,
      habitatAvgDwellMs: 0,
      sessionCount: 0,
      accumulates: true,
      learns: false,
      behaviorBias: true,
      truthBias: false,
      interpretationOnly: true
    });
  }
  return Object.freeze({ ...row, interpretationOnly: true });
}

/**
 * @param {string} entityId
 * @param {object} [snapshot]
 */
export function lookupBehaviorRecordV0(entityId, snapshot) {
  const sediment = snapshot ?? getBehaviorSedimentSnapshotV0();
  const id = String(entityId || "").toLowerCase();
  return (
    (sediment.records || []).find((r) => {
      const e = String(r.entity || "").toLowerCase();
      return e === id || e.includes(id) || id.includes(e);
    }) || null
  );
}

/**
 * @param {string} entityId
 * @param {object} [snapshot]
 */
export function computeBehaviorEvidenceStrengthV0(entityId, snapshot) {
  const record = lookupBehaviorRecordV0(entityId, snapshot);
  if (!record || record.visits < 1) {
    return Object.freeze({
      available: false,
      visits: 0,
      avgDwellTime: 0,
      returnRate: 0,
      sessionDepth: 0,
      dwellRatio: 0,
      behaviorBias: true,
      truthBias: false,
      interpretationOnly: true
    });
  }

  const sediment = snapshot ?? getBehaviorSedimentSnapshotV0();
  const habitatAvg = sediment.habitatAvgDwellMs || 1;
  const dwellRatio = Math.round((record.avgDwellTime / Math.max(1, habitatAvg)) * 100) / 100;

  return Object.freeze({
    available: true,
    visits: record.visits,
    avgDwellTime: record.avgDwellTime,
    returnRate: record.returnRate,
    sessionDepth: record.sessionDepth,
    dwellRatio,
    sufficientForSignificance: record.visits >= 2 || record.returnRate >= 0.25,
    behaviorBias: true,
    truthBias: false,
    interpretationOnly: true
  });
}

export function clearBehaviorSedimentForTestV0() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(BEHAVIOR_STORAGE_KEY_V0);
    }
  } catch {
    /* noop */
  }
}

function syncBehaviorWindowV0(row) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.behaviorSediment = Object.freeze({
    refresh: refreshBehaviorSedimentFromTraceV0,
    snapshot: getBehaviorSedimentSnapshotV0,
    lookup: lookupBehaviorRecordV0,
    evidence: computeBehaviorEvidenceStrengthV0,
    clear: clearBehaviorSedimentForTestV0
  });
}

export function mountBehaviorSedimentConsoleV0() {
  if (typeof window === "undefined") return;
  syncBehaviorWindowV0(getBehaviorSedimentSnapshotV0());
}
