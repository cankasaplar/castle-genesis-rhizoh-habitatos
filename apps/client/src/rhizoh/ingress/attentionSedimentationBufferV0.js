/**
 * Attention Sedimentation Buffer v0 — shadow-D (PATH B habitat layer).
 * Non-causal accumulation: frequency · co-occurrence · salience decay.
 * NOT meaning memory · NOT identity · NOT causal write · NOT narrative selection bias.
 * @see docs/RHIZOH_ATTENTION_SEDIMENTATION_V0.md
 */

import {
  getObserverTraceSnapshotV0,
  OBSERVER_PLANE_V0,
  OBSERVER_TRACE_EXCLUDED_SINKS_V0
} from "./observerReadOnlyHookV0.js";
import { computeEpistemicWeightDecayV0 } from "./meaningResonanceLedgerV0.js";
import {
  detectEpistemicEchoLoopV0,
  runEpistemicConsumeOnlyPassV0
} from "./epistemicInvocationGuardV0.js";

export const ATTENTION_SEDIMENT_SCHEMA_V0 = "castle.rhizoh.attention_sediment.v0";
export const ATTENTION_SEDIMENT_STRATUM_SCHEMA_V0 = "castle.rhizoh.attention_sediment_stratum.v0";

export const SEDIMENT_INPUT_SOURCE_V0 = Object.freeze({
  MAP: "map_attention_field",
  CHESS: "chess_constraint_anchor",
  VIDEO: "video_temporal_trajectory"
});

const SEDIMENT_STORAGE_KEY_V0 = "rhizoh.attention_sediment.v0";
const MAX_STRATA_V0 = 64;

function readSedimentRowV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SEDIMENT_STORAGE_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSedimentRowV0(row) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SEDIMENT_STORAGE_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

/**
 * @param {readonly object[]} entries
 */
function inferSourceFromEntryV0(entry) {
  const type = String(entry?.type || "");
  const surface = entry?.meta?.surface;
  if (type.includes("video") || surface === "video") return SEDIMENT_INPUT_SOURCE_V0.VIDEO;
  if (type.includes("chess") || surface === "chess") return SEDIMENT_INPUT_SOURCE_V0.CHESS;
  return SEDIMENT_INPUT_SOURCE_V0.MAP;
}

/**
 * @param {readonly object[]} entries
 */
function aggregateStrataFromTraceV0(entries) {
  const buckets = new Map();

  for (const entry of entries) {
    const key = `${entry.type}:${entry.target}`;
    const source = inferSourceFromEntryV0(entry);
    const prev = buckets.get(key) || {
      key,
      source,
      frequency: 0,
      intensitySum: 0,
      firstSeenMs: entry.ts || Date.now(),
      lastSeenMs: entry.ts || Date.now()
    };
    buckets.set(key, {
      ...prev,
      frequency: prev.frequency + 1,
      intensitySum: prev.intensitySum + (Number(entry.intensity) || 0.1),
      lastSeenMs: Math.max(prev.lastSeenMs, entry.ts || Date.now()),
      firstSeenMs: Math.min(prev.firstSeenMs, entry.ts || Date.now())
    });
  }

  const mapKeys = [...buckets.values()].filter((b) => b.source === SEDIMENT_INPUT_SOURCE_V0.MAP);
  const mapClusterDensity =
    mapKeys.length > 0
      ? Math.round(Math.min(1, mapKeys.reduce((a, b) => a + b.frequency, 0) / (mapKeys.length * 4)) * 100) /
        100
      : 0;

  const now = Date.now();
  const strata = [...buckets.values()]
    .map((b) => {
      const spanMs = Math.max(0, b.lastSeenMs - b.firstSeenMs);
      const avgIntensity = b.intensitySum / b.frequency;
      const baseSalience = Math.min(0.35, avgIntensity * Math.min(1, b.frequency / 5));
      return Object.freeze({
        schema: ATTENTION_SEDIMENT_STRATUM_SCHEMA_V0,
        key: b.key,
        source: b.source,
        frequency: b.frequency,
        temporalSpanMs: spanMs,
        salienceDecay: computeEpistemicWeightDecayV0(b.lastSeenMs, baseSalience, now),
        clusterDensity: b.source === SEDIMENT_INPUT_SOURCE_V0.MAP ? mapClusterDensity : 0,
        constraintAnchor: b.source === SEDIMENT_INPUT_SOURCE_V0.CHESS,
        trajectoryHint: b.source === SEDIMENT_INPUT_SOURCE_V0.VIDEO ? spanMs > 0 : false,
        influencesNarrativeSelection: false,
        interpretationOnly: true
      });
    })
    .sort((a, b) => b.frequency * b.salienceDecay - a.frequency * a.salienceDecay)
    .slice(0, MAX_STRATA_V0);

  return Object.freeze({
    strata: Object.freeze(strata),
    mapField: Object.freeze({
      pinDensity: mapKeys.length,
      hoverRepetition: mapKeys.reduce((a, b) => a + b.frequency, 0),
      clusterDensity: mapClusterDensity
    }),
    chessField: Object.freeze({
      deterministicAnchor: strata.some((s) => s.constraintAnchor),
      patternCount: strata.filter((s) => s.constraintAnchor).length
    }),
    videoField: Object.freeze({
      trajectoryAvailable: strata.some((s) => s.trajectoryHint),
      frameCount: entries.filter((e) => inferSourceFromEntryV0(e) === SEDIMENT_INPUT_SOURCE_V0.VIDEO)
        .length
    })
  });
}

/**
 * Consume existing observer trace → refresh sediment (single pass, no observe).
 */
export function refreshAttentionSedimentFromTraceV0() {
  const trace = getObserverTraceSnapshotV0();
  const observerCountBefore = trace?.count ?? 0;

  return runEpistemicConsumeOnlyPassV0(() => {
    const entries = trace?.entries || [];
    const agg = aggregateStrataFromTraceV0(entries);
    const refreshedAtMs = Date.now();

    const row = Object.freeze({
      schema: ATTENTION_SEDIMENT_SCHEMA_V0,
      plane: OBSERVER_PLANE_V0.ATTENTION_SEDIMENT,
      refreshedAtMs,
      strata: agg.strata,
      mapField: agg.mapField,
      chessField: agg.chessField,
      videoField: agg.videoField,
      stratumCount: agg.strata.length,
      accumulates: true,
      learns: false,
      generalizes: false,
      isMeaningMemory: false,
      isAttentionSediment: true,
      influencesCausalGraph: false,
      influencesIdentity: false,
      influencesMap: false,
      influencesChess: false,
      influencesNarrativeSelection: false,
      excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
      authorityPolicy: Object.freeze({ causal: "hard", semantic: "soft", identity: "none" }),
      interpretationOnly: true
    });

    writeSedimentRowV0(row);
    syncSedimentWindowV0(row);

    const after = getObserverTraceSnapshotV0();
    const echoGuard = detectEpistemicEchoLoopV0({
      observerCountBefore,
      observerCountAfter: after?.count ?? 0
    });

    return Object.freeze({ ...row, echoGuard, invocationAsymmetry: echoGuard.invocationAsymmetryHolds });
  }, observerCountBefore);
}

export function getAttentionSedimentSnapshotV0() {
  const row = readSedimentRowV0();
  if (!row) {
    return Object.freeze({
      schema: ATTENTION_SEDIMENT_SCHEMA_V0,
      plane: OBSERVER_PLANE_V0.ATTENTION_SEDIMENT,
      strata: Object.freeze([]),
      stratumCount: 0,
      mapField: Object.freeze({ pinDensity: 0, hoverRepetition: 0, clusterDensity: 0 }),
      chessField: Object.freeze({ deterministicAnchor: false, patternCount: 0 }),
      videoField: Object.freeze({ trajectoryAvailable: false, frameCount: 0 }),
      accumulates: true,
      learns: false,
      influencesNarrativeSelection: false,
      interpretationOnly: true
    });
  }
  return Object.freeze({ ...row, interpretationOnly: true });
}

/**
 * Read-only temporal hints for narrative (does NOT change entity ranking).
 * @param {{ locale?: string }} [opts]
 */
export function buildTemporalSedimentHintsV0(opts = {}) {
  const sediment = getAttentionSedimentSnapshotV0();
  const tr = opts.locale === "tr";
  const top = sediment.strata?.[0];

  if (!top) {
    return Object.freeze({
      available: false,
      influencesSelection: false,
      interpretationOnly: true
    });
  }

  const label = tr
    ? `Tekrarlayan dikkat: ${top.key} (${top.frequency}×, sediment)`
    : `Repeating attention: ${top.key} (${top.frequency}×, sediment)`;

  return Object.freeze({
    available: true,
    dominantKey: top.key,
    frequency: top.frequency,
    salienceDecay: top.salienceDecay,
    temporalSpanMs: top.temporalSpanMs,
    label,
    mapClusterDensity: sediment.mapField?.clusterDensity ?? 0,
    chessAnchor: sediment.chessField?.deterministicAnchor === true,
    videoTrajectory: sediment.videoField?.trajectoryAvailable === true,
    influencesSelection: false,
    interpretationOnly: true
  });
}

export function clearAttentionSedimentForTestV0() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(SEDIMENT_STORAGE_KEY_V0);
    }
  } catch {
    /* noop */
  }
}

function syncSedimentWindowV0(row) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.attentionSediment = Object.freeze({
    refresh: refreshAttentionSedimentFromTraceV0,
    snapshot: getAttentionSedimentSnapshotV0,
    hints: buildTemporalSedimentHintsV0,
    clear: clearAttentionSedimentForTestV0
  });
}

export function mountAttentionSedimentationConsoleV0() {
  if (typeof window === "undefined") return;
  syncSedimentWindowV0(getAttentionSedimentSnapshotV0());
}
