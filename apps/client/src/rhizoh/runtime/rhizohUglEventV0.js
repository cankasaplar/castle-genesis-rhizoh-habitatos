/**
 * UGL Event — causal event stream (append-only session ring).
 * RESEARCH-ONLY
 */

import {
  RHIZOH_UGL_EVENT_SCHEMA_V0,
  RHIZOH_UGL_EVENT_STREAM_LS_KEY_V0,
  RHIZOH_UGL_EVENT_V0
} from "./rhizohUglSchemaV0.js";
import { upsertChessWeightUpdateEdgeV0 } from "./chessUnifiedMemoryGraphV0.js";
import { readChessLearningWeightsV0 } from "./chessLearningWeightsV0.js";
import { routeUglEventV0 } from "./rhizohArenaRouterV0.js";

const MAX_EVENTS_V0 = 256;
let logicalTickV0 = 0;
/** @type {object[]} */
let sessionRingV0 = [];

function readPersistedRingV0() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(RHIZOH_UGL_EVENT_STREAM_LS_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePersistedRingV0(ring) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RHIZOH_UGL_EVENT_STREAM_LS_KEY_V0, JSON.stringify(ring.slice(-MAX_EVENTS_V0)));
  } catch {
    /* noop */
  }
}

/**
 * @param {{
 *   s: object,
 *   a: object,
 *   sNext: object,
 *   r: object,
 *   logicalTick?: number,
 *   matchId?: string,
 *   gameType?: string,
 *   source?: string
 * }} row
 */
export function buildUglEventV0(row = {}) {
  const tick = Number.isFinite(Number(row.logicalTick)) ? Number(row.logicalTick) : (logicalTickV0 += 1);
  const matchId = String(row.matchId || "unknown");
  const causalChainId = `ugl_${matchId}_${tick}`;
  return Object.freeze({
    schema: RHIZOH_UGL_EVENT_SCHEMA_V0,
    t: Object.freeze({
      logicalTick: tick,
      atMs: Date.now(),
      iso: new Date().toISOString()
    }),
    s: row.s,
    a: row.a,
    s_next: row.sNext,
    r: row.r,
    meta: Object.freeze({
      matchId,
      gameType: row.gameType || row.s?.meta?.gameType || "chess",
      causalChainId,
      source: row.source || "ugl_event"
    })
  });
}

function projectRewardToUnifiedGraphV0(event) {
  const r = event.r;
  if (!r || r.total == null) return;
  const weightsBefore = readChessLearningWeightsV0();
  upsertChessWeightUpdateEdgeV0({
    weightsBefore,
    weightsAfter: { ...weightsBefore },
    matchId: event.meta?.matchId,
    atMs: event.t?.atMs,
    regret: Object.freeze({
      forcedWinIgnored: r.drift > 0.5,
      lossAvoidanceBias: r.shaping < 0.25
    })
  });
}

/**
 * @param {object} event
 */
export function appendUglEventV0(event) {
  if (!event?.schema?.includes("ugl_event")) return null;
  const route = routeUglEventV0(event);
  const enriched = Object.freeze({
    ...event,
    meta: Object.freeze({
      ...event.meta,
      arenaRoute: Object.freeze({
        domainId: route.domainId,
        adapterId: route.adapterId,
        coverage: route.coverage,
        routable: route.routable
      })
    })
  });
  sessionRingV0 = [enriched, ...sessionRingV0].slice(0, MAX_EVENTS_V0);
  const persisted = [...readPersistedRingV0(), enriched].slice(-MAX_EVENTS_V0);
  writePersistedRingV0(persisted);
  try {
    projectRewardToUnifiedGraphV0(enriched);
  } catch {
    /* projection best-effort */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RHIZOH_UGL_EVENT_V0, { detail: enriched }));
  }
  return enriched;
}

export function readUglEventStreamV0(limit = 32) {
  const persisted = readPersistedRingV0();
  const merged = [...sessionRingV0, ...persisted];
  const seen = new Set();
  const out = [];
  for (const ev of merged) {
    const id = ev.meta?.causalChainId || `${ev.t?.atMs}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(ev);
    if (out.length >= limit) break;
  }
  return Object.freeze(out);
}

export function getUglEventStreamSnapshotV0() {
  const stream = readUglEventStreamV0(MAX_EVENTS_V0);
  const rewardTotals = stream.map((e) => Number(e.r?.total) || 0).filter((n) => n > 0);
  const avgReward =
    rewardTotals.length > 0
      ? Number((rewardTotals.reduce((a, b) => a + b, 0) / rewardTotals.length).toFixed(4))
      : null;
  return Object.freeze({
    schema: `${RHIZOH_UGL_EVENT_SCHEMA_V0}.snapshot`,
    eventCount: stream.length,
    logicalTick: logicalTickV0,
    avgReward,
    recent: Object.freeze(stream.slice(0, 8)),
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetUglEventStreamForTestV0() {
  logicalTickV0 = 0;
  sessionRingV0 = [];
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(RHIZOH_UGL_EVENT_STREAM_LS_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
