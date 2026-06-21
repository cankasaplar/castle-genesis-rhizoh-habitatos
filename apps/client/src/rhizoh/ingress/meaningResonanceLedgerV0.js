/**
 * Meaning Resonance Ledger v0 — Plane D (non-authoritative co-occurrence trace).
 * NOT a graph · NOT truth · NOT learning · records what meanings co-occurred.
 * @see docs/RHIZOH_MEANING_RESONANCE_LEDGER_V0.md
 */

import { OBSERVER_PLANE_V0, OBSERVER_TRACE_EXCLUDED_SINKS_V0 } from "./observerReadOnlyHookV0.js";

export const MEANING_RESONANCE_LEDGER_SCHEMA_V0 = "castle.rhizoh.meaning_resonance_ledger.v0";
export const MEANING_RESONANCE_RECORD_SCHEMA_V0 = "castle.rhizoh.meaning_resonance_record.v0";

const LEDGER_STORAGE_KEY_V0 = "rhizoh.meaning_resonance_ledger.v0";
const MAX_RECORDS_V0 = 128;

/** Half-life for epistemic weight decay (ms) — drift-proof soft fade. */
export const EPISTEMIC_WEIGHT_HALF_LIFE_MS_V0 = 45 * 60 * 1000;

/**
 * @param {number} recordedAtMs
 * @param {number} baseWeight
 * @param {number} [nowMs]
 */
export function computeEpistemicWeightDecayV0(recordedAtMs, baseWeight, nowMs = Date.now()) {
  const age = Math.max(0, nowMs - recordedAtMs);
  const decay = Math.pow(0.5, age / EPISTEMIC_WEIGHT_HALF_LIFE_MS_V0);
  return Math.round(Math.max(0, Math.min(0.35, baseWeight * decay)) * 1000) / 1000;
}

function readLedgerRowV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LEDGER_STORAGE_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLedgerRowV0(row) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(LEDGER_STORAGE_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

/**
 * @param {object} recordInput
 */
export function recordMeaningResonanceV0(recordInput) {
  const recordedAtMs = Date.now();
  const baseWeight = Math.min(0.35, Number(recordInput?.epistemicWeight ?? recordInput?.strength ?? 0.15) || 0.15);

  const record = Object.freeze({
    schema: MEANING_RESONANCE_RECORD_SCHEMA_V0,
    resonanceId: `mr_${recordedAtMs}_${Math.random().toString(36).slice(2, 8)}`,
    recordedAtMs,
    plane: OBSERVER_PLANE_V0.MEANING_LEDGER,
    coOccurrence: Object.freeze({
      mapSignal: recordInput?.mapSignal ?? null,
      chessSignal: recordInput?.chessSignal ?? null,
      narrativeRelation: recordInput?.narrativeRelation ?? null
    }),
    temporalContinuity: recordInput?.temporalContinuity ?? 0,
    patternStability: recordInput?.patternStability ?? 0,
    epistemicWeight: baseWeight,
    epistemicWeightDecay: computeEpistemicWeightDecayV0(recordedAtMs, baseWeight),
    assertsStructure: false,
    isTruth: false,
    learns: false,
    generalizes: false,
    optimizes: false,
    influencesCausalGraph: false,
    influencesMap: false,
    influencesChess: false,
    influencesNarrative: false,
    influencesIdentity: false,
    excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0,
    interpretationOnly: true,
    authority: "soft"
  });

  const prev = readLedgerRowV0();
  const records = [...(prev?.records || []), record].slice(-MAX_RECORDS_V0);
  const row = Object.freeze({
    schema: MEANING_RESONANCE_LEDGER_SCHEMA_V0,
    plane: OBSERVER_PLANE_V0.MEANING_LEDGER,
    records: Object.freeze(records),
    count: records.length,
    authorityPolicy: Object.freeze({
      causal: "hard",
      semantic: "soft",
      identity: "none"
    }),
    interpretationOnly: true
  });
  writeLedgerRowV0(row);
  syncLedgerWindowV0(row);
  return record;
}

export function getMeaningResonanceLedgerSnapshotV0() {
  const row = readLedgerRowV0();
  if (!row) {
    return Object.freeze({
      schema: MEANING_RESONANCE_LEDGER_SCHEMA_V0,
      plane: OBSERVER_PLANE_V0.MEANING_LEDGER,
      records: Object.freeze([]),
      count: 0,
      authorityPolicy: Object.freeze({ causal: "hard", semantic: "soft", identity: "none" }),
      interpretationOnly: true
    });
  }

  const now = Date.now();
  const records = (row.records || []).map((r) =>
    Object.freeze({
      ...r,
      epistemicWeightDecay: computeEpistemicWeightDecayV0(r.recordedAtMs, r.epistemicWeight, now)
    })
  );

  return Object.freeze({
    ...row,
    records: Object.freeze(records),
    count: records.length,
    interpretationOnly: true
  });
}

export function clearMeaningResonanceLedgerForTestV0() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(LEDGER_STORAGE_KEY_V0);
    }
  } catch {
    /* noop */
  }
}

function syncLedgerWindowV0(row) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.meaningLedger = Object.freeze({
    record: recordMeaningResonanceV0,
    snapshot: getMeaningResonanceLedgerSnapshotV0,
    clear: clearMeaningResonanceLedgerForTestV0,
    decay: computeEpistemicWeightDecayV0
  });
}

export function mountMeaningResonanceLedgerConsoleV0() {
  if (typeof window === "undefined") return;
  syncLedgerWindowV0(getMeaningResonanceLedgerSnapshotV0());
}
