/**
 * Reflex stability trace — unified state snapshot + deterministic replay (debug).
 * Addresses state explosion across decay / hot phrase / personality / continuation.
 */

import { snapshotConfidenceDecayStateV0 } from "./rhizohConfidenceDecayGateV0.js";
import { readHotPhraseContextWindowV0 } from "./rhizohHotPhraseContextV0.js";
import { peekContinuationHoldV0 } from "./rhizohContinuationHoldV0.js";
import { MICRO_PERSONALITY_TONE_V0 } from "./rhizohMicroPersonalityV0.js";

export const RHIZOH_REFLEX_STABILITY_TRACE_SCHEMA_V0 = "castle.rhizoh.reflex_stability_trace.v0";

const REPLAY_RING_MAX_V0 = 48;
const STORAGE_KEY_V0 = "rhizoh.reflex_stability_replay.v0";

/** @type {object[]} */
let replayRingV0 = [];

function readPersonalitySnapshotV0() {
  if (typeof window === "undefined") {
    return Object.freeze({ tone: MICRO_PERSONALITY_TONE_V0.WARM, turnCount: 0 });
  }
  try {
    const raw = window.localStorage.getItem("rhizoh.micro_personality.v0");
    if (!raw) return Object.freeze({ tone: MICRO_PERSONALITY_TONE_V0.WARM, turnCount: 0 });
    const p = JSON.parse(raw);
    return Object.freeze({
      tone: String(p.tone || MICRO_PERSONALITY_TONE_V0.WARM),
      turnCount: Number(p.turnCount) || 0
    });
  } catch {
    return Object.freeze({ tone: MICRO_PERSONALITY_TONE_V0.WARM, turnCount: 0 });
  }
}

function readReflexLogTailV0(n = 12) {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(window.localStorage.getItem("rhizoh.reflex_turn_log.v0") || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.slice(-n);
  } catch {
    return [];
  }
}

/**
 * Single-turn unified state slice (deterministic JSON-safe).
 * @param {string | null} [traceId]
 */
export function collectReflexStateSlicesV0(traceId = null) {
  return Object.freeze({
    schema: RHIZOH_REFLEX_STABILITY_TRACE_SCHEMA_V0,
    traceId: traceId ? String(traceId) : null,
    atMs: Date.now(),
    decay: snapshotConfidenceDecayStateV0(),
    hotPhraseContext: readHotPhraseContextWindowV0(),
    personality: readPersonalitySnapshotV0(),
    continuationBuffer: peekContinuationHoldV0(),
    lastReflexTurn: typeof window !== "undefined" ? window.__CASTLE_RHIZOH_REFLEX_TURN_LOG__ || null : null
  });
}

/**
 * @param {{
 *   traceId?: string | null,
 *   pipeline?: Record<string, unknown>,
 *   llmSuppressed?: boolean,
 *   latencyMs?: number
 * }} turn
 */
export function recordReflexStabilityTurnV0(turn = {}) {
  const traceId = turn.traceId ? String(turn.traceId) : null;
  const pipeline = turn.pipeline && typeof turn.pipeline === "object" ? turn.pipeline : {};
  const latencyMs = Math.max(0, Number(turn.latencyMs ?? pipeline.latencyMs) || 0);
  const llmSuppressed = turn.llmSuppressed ?? pipeline.llmBypass === true;

  const entry = Object.freeze({
    schema: RHIZOH_REFLEX_STABILITY_TRACE_SCHEMA_V0,
    traceId,
    atMs: Date.now(),
    stage: String(pipeline.stage || "unknown"),
    llmSuppressed,
    latencyMs,
    cognitionMs: llmSuppressed ? latencyMs : null,
    intentPlan: pipeline.intentPlan
      ? Object.freeze({
          routeClass: pipeline.intentPlan.routeClass,
          confidence: pipeline.intentPlan.confidence,
          useLlm: pipeline.intentPlan.useLlm,
          escalateToLlm: pipeline.intentPlan.escalateToLlm,
          decay: pipeline.intentPlan.decay
        })
      : null,
    state: collectReflexStateSlicesV0(traceId)
  });

  replayRingV0.push(entry);
  if (replayRingV0.length > REPLAY_RING_MAX_V0) {
    replayRingV0 = replayRingV0.slice(-REPLAY_RING_MAX_V0);
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(replayRingV0));
    } catch {
      /* quota */
    }
    window.__CASTLE_RHIZOH_REFLEX_STABILITY__ = Object.freeze({
      lastTurn: entry,
      replayRing: Object.freeze([...replayRingV0]),
      heatmap: buildLlmSuppressionHeatmapV0(),
      latencyCognition: buildLatencyCognitionSeriesV0()
    });
  }

  return entry;
}

/**
 * Intent drift = routeClass changes with repeated normalized phrase.
 */
export function buildIntentDriftReportV0() {
  const ring = replayRingV0.length ? replayRingV0 : loadReplayRingFromStorageV0();
  /** @type {Record<string, { count: number, routes: Set<string> }>} */
  const byPhrase = {};
  for (const row of ring) {
    const phrase = row.state?.decay?.lastNormalized;
    if (!phrase) continue;
    if (!byPhrase[phrase]) byPhrase[phrase] = { count: 0, routes: new Set() };
    byPhrase[phrase].count += 1;
    const rc = row.intentPlan?.routeClass;
    if (rc) byPhrase[phrase].routes.add(rc);
  }
  return Object.freeze(
    Object.entries(byPhrase)
      .filter(([, v]) => v.routes.size > 1 || v.count >= 3)
      .map(([phrase, v]) =>
        Object.freeze({
          phrase,
          repeatCount: v.count,
          routeClasses: Object.freeze([...v.routes]),
          drift: v.routes.size > 1
        })
      )
  );
}

/** Buckets: local_fast | local | llm */
export function buildLlmSuppressionHeatmapV0() {
  const ring = replayRingV0.length ? replayRingV0 : loadReplayRingFromStorageV0();
  const heat = Object.freeze({
    local_fast: 0,
    local: 0,
    llm: 0,
    total: ring.length
  });
  /** @type {typeof heat} */
  const counts = { local_fast: 0, local: 0, llm: 0, total: ring.length };
  for (const row of ring) {
    if (row.llmSuppressed) {
      if (row.stage === "fast_precheck" || row.stage === "ambient" || row.stage === "continuation") {
        counts.local_fast += 1;
      } else {
        counts.local += 1;
      }
    } else {
      counts.llm += 1;
    }
  }
  return Object.freeze({
    ...counts,
    suppressionRate01:
      counts.total > 0
        ? Math.round(((counts.local_fast + counts.local) / counts.total) * 100) / 100
        : 0
  });
}

export function buildLatencyCognitionSeriesV0() {
  const ring = replayRingV0.length ? replayRingV0 : loadReplayRingFromStorageV0();
  return Object.freeze(
    ring.slice(-24).map((row) =>
      Object.freeze({
        traceId: row.traceId,
        atMs: row.atMs,
        latencyMs: row.latencyMs,
        cognitionMs: row.cognitionMs,
        llmSuppressed: row.llmSuppressed,
        stage: row.stage
      })
    )
  );
}

export function exportDeterministicReplayTapeV0() {
  return Object.freeze({
    schema: RHIZOH_REFLEX_STABILITY_TRACE_SCHEMA_V0,
    exportedAtMs: Date.now(),
    replayRing: Object.freeze([...(replayRingV0.length ? replayRingV0 : loadReplayRingFromStorageV0())]),
    intentDrift: buildIntentDriftReportV0(),
    heatmap: buildLlmSuppressionHeatmapV0(),
    latencyCognition: buildLatencyCognitionSeriesV0()
  });
}

function loadReplayRingFromStorageV0() {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(window.localStorage.getItem(STORAGE_KEY_V0) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function hydrateReflexReplayFromTapeV0(tape) {
  if (!tape || !Array.isArray(tape.replayRing)) return false;
  replayRingV0 = tape.replayRing.slice(-REPLAY_RING_MAX_V0);
  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_REFLEX_STABILITY__ = Object.freeze({
      lastTurn: replayRingV0[replayRingV0.length - 1] || null,
      replayRing: Object.freeze([...replayRingV0]),
      heatmap: buildLlmSuppressionHeatmapV0(),
      latencyCognition: buildLatencyCognitionSeriesV0(),
      hydrated: true
    });
  }
  return true;
}

/** @internal test */
export function clearReflexStabilityTraceForTestV0() {
  replayRingV0 = [];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY_V0);
      delete window.__CASTLE_RHIZOH_REFLEX_STABILITY__;
    } catch {
      /* noop */
    }
  }
}

if (typeof window !== "undefined") {
  window.__CASTLE_RHIZOH_REFLEX_STABILITY_API__ = Object.freeze({
    collectReflexStateSlicesV0,
    recordReflexStabilityTurnV0,
    exportDeterministicReplayTapeV0,
    hydrateReflexReplayFromTapeV0,
    buildIntentDriftReportV0,
    buildLlmSuppressionHeatmapV0,
    buildLatencyCognitionSeriesV0
  });
}
