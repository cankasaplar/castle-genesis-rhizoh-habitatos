/**
 * Cross-Space REC Reconciliation v0 — space-tagged epoch memory + semantic interference.
 * Prevents sports drift from leaking into chess REC without explicit coupling.
 * Orchestrates / reconciles only — mutates no domain state.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_CROSS_SPACE_REC_RECONCILIATION_V0.md
 */

import { MUTATION_REASON_CATEGORY_V1 } from "../ticket/mutationReasonCodeOntologyV1.js";
import {
  ARENA_SPACE_OVERLAY_V0,
  listArenaFramesV0,
  selectActiveArenaFrameV0
} from "./multiArenaSchedulerV0.js";
import { CAUSAL_SPACE_ID_V0 } from "./sportsCausalSpaceV0.js";

export const CROSS_SPACE_REC_SCHEMA_V0 = "castle.rhizoh.cross_space_rec.v0";
export const CROSS_SPACE_REC_EVENT_V0 = "rhizoh:cross-space-rec-v0";

export const INTERFERENCE_KIND_V0 = Object.freeze({
  SEMANTIC_DRIFT: "semantic_drift",
  REC_CATEGORY_BLEED: "rec_category_bleed",
  ENTROPY_CROSS_COUPLE: "entropy_cross_couple"
});

/** @type {Map<string, object>} */
const spaceRecSlicesV0 = new Map();

/** @type {object[]} */
const interferenceLogV0 = [];

/** @type {object[]} */
const reconciliationLogV0 = [];

let globalEpochSeqV0 = 0;
/** @type {object | null} */
let lastReconciliationV0 = null;

function emptyCategoryTotalsV0() {
  return Object.freeze({
    [MUTATION_REASON_CATEGORY_V1.SC]: 0,
    [MUTATION_REASON_CATEGORY_V1.REC]: 0,
    [MUTATION_REASON_CATEGORY_V1.QUOTA]: 0,
    [MUTATION_REASON_CATEGORY_V1.SIG]: 0,
    [MUTATION_REASON_CATEGORY_V1.ENTROPY_DRIFT]: 0
  });
}

function cloneCategoryTotalsV0(totals) {
  return Object.freeze({
    [MUTATION_REASON_CATEGORY_V1.SC]: Number(totals?.SC) || 0,
    [MUTATION_REASON_CATEGORY_V1.REC]: Number(totals?.REC) || 0,
    [MUTATION_REASON_CATEGORY_V1.QUOTA]: Number(totals?.QUOTA) || 0,
    [MUTATION_REASON_CATEGORY_V1.SIG]: Number(totals?.SIG) || 0,
    [MUTATION_REASON_CATEGORY_V1.ENTROPY_DRIFT]: Number(totals?.ENTROPY_DRIFT) || 0
  });
}

function ensureSpaceSliceV0(spaceId, recAffinity = "unknown") {
  const id = String(spaceId || "");
  let slice = spaceRecSlicesV0.get(id);
  if (!slice) {
    slice = Object.freeze({
      spaceId: id,
      recAffinity,
      epochSeq: 0,
      categoryTotals: emptyCategoryTotalsV0(),
      signalCount: 0,
      lastSignalAtMs: 0
    });
    spaceRecSlicesV0.set(id, slice);
  }
  return slice;
}

/**
 * Ingest a space-tagged drift signal into isolated REC slice memory.
 * @param {{
 *   spaceId: string,
 *   category: string,
 *   strength?: number,
 *   source?: string,
 *   recAffinity?: string,
 *   atMs?: number
 * }} input
 */
export function ingestSpaceDriftSignalV0(input) {
  const spaceId = String(input.spaceId || "");
  const category = String(input.category || MUTATION_REASON_CATEGORY_V1.ENTROPY_DRIFT);
  const strength = Math.max(0, Number(input.strength) || 1);
  const atMs = Number(input.atMs) || Date.now();
  const recAffinity = String(input.recAffinity || "unknown");

  const prev = ensureSpaceSliceV0(spaceId, recAffinity);
  const totals = { ...prev.categoryTotals };
  if (Object.prototype.hasOwnProperty.call(totals, category)) {
    totals[category] = (Number(totals[category]) || 0) + strength;
  } else {
    totals[category] = strength;
  }

  const next = Object.freeze({
    ...prev,
    recAffinity: recAffinity || prev.recAffinity,
    epochSeq: prev.epochSeq + 1,
    categoryTotals: cloneCategoryTotalsV0(totals),
    signalCount: prev.signalCount + 1,
    lastSignalAtMs: atMs,
    lastSource: String(input.source || "unknown")
  });
  spaceRecSlicesV0.set(spaceId, next);

  return Object.freeze({
    schema: `${CROSS_SPACE_REC_SCHEMA_V0}.ingest`,
    spaceId,
    category,
    strength,
    slice: next,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * Record semantic interference — spaces observe each other's drift without merge.
 * @param {{ fromSpace: string, toSpace: string, category: string, strength: number, kind?: string }} row
 */
export function recordCrossSpaceInterferenceV0(row) {
  const entry = Object.freeze({
    schema: `${CROSS_SPACE_REC_SCHEMA_V0}.interference`,
    fromSpace: String(row.fromSpace || ""),
    toSpace: String(row.toSpace || ""),
    category: String(row.category || ""),
    strength: Math.max(0, Number(row.strength) || 0),
    kind: String(row.kind || INTERFERENCE_KIND_V0.SEMANTIC_DRIFT),
    merged: false,
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
  interferenceLogV0.unshift(entry);
  if (interferenceLogV0.length > 128) interferenceLogV0.length = 128;
  return entry;
}

/**
 * @param {string} primarySpaceId
 * @param {Map<string, object>} slices
 * @param {object[]} frames
 */
function detectInterferenceV0(primarySpaceId, slices, frames) {
  /** @type {object[]} */
  const detected = [];

  for (const [spaceId, slice] of slices) {
    if (spaceId === primarySpaceId) continue;
    const frame = frames.find((f) => f.spaceId === spaceId);
    const weight = frame?.resourceQuota || 0.1;

    for (const [category, count] of Object.entries(slice.categoryTotals || {})) {
      const strength = Number(count) * weight;
      if (strength <= 0) continue;

      let kind = INTERFERENCE_KIND_V0.SEMANTIC_DRIFT;
      if (category === MUTATION_REASON_CATEGORY_V1.REC) {
        kind = INTERFERENCE_KIND_V0.REC_CATEGORY_BLEED;
      } else if (category === MUTATION_REASON_CATEGORY_V1.ENTROPY_DRIFT) {
        kind = INTERFERENCE_KIND_V0.ENTROPY_CROSS_COUPLE;
      }

      const row = recordCrossSpaceInterferenceV0({
        fromSpace: spaceId,
        toSpace: primarySpaceId,
        category,
        strength,
        kind
      });
      detected.push(row);
    }
  }

  return Object.freeze(detected);
}

/**
 * Build unified epoch memory from space slices without cross-space REC bleed.
 * @param {{ selection?: object, atMs?: number }} [opts]
 */
export function reconcileCrossSpaceRecV0(opts = {}) {
  const atMs = Number(opts.atMs) || Date.now();
  const selection = opts.selection || selectActiveArenaFrameV0(atMs);
  const primarySpaceId = selection.primarySpaceId || CAUSAL_SPACE_ID_V0.CHESS;
  const frames = listArenaFramesV0();

  globalEpochSeqV0 += 1;
  const globalEpochId = `rec_global_${globalEpochSeqV0}_${primarySpaceId.replace(/\./g, "_")}`;

  const slices = new Map(spaceRecSlicesV0);
  for (const frame of frames) {
    ensureSpaceSliceV0(frame.spaceId, frame.recAffinity);
  }

  const interference = detectInterferenceV0(primarySpaceId, slices, frames);

  /** @type {Record<string, number>} */
  const reconciledMutable = { ...emptyCategoryTotalsV0() };
  /** @type {Record<string, object>} */
  const sliceReports = {};

  for (const [spaceId, slice] of spaceRecSlicesV0) {
    const frame = frames.find((f) => f.spaceId === spaceId);
    const weight = frame?.resourceQuota || 0.1;
    const isPrimary = spaceId === primarySpaceId;
    const total = Object.values(slice.categoryTotals).reduce((s, n) => s + Number(n), 0) || 1;

    const native = Object.freeze(
      Object.fromEntries(
        Object.entries(slice.categoryTotals).map(([cat, n]) => [cat, Number(n) / total])
      )
    );
    sliceReports[spaceId] = Object.freeze({
      spaceId,
      recAffinity: slice.recAffinity,
      epochSeq: slice.epochSeq,
      nativeShares: native,
      weight,
      isPrimary
    });

    for (const [cat, count] of Object.entries(slice.categoryTotals)) {
      const c = Number(count) || 0;
      if (c <= 0) continue;

      if (!isPrimary && cat === MUTATION_REASON_CATEGORY_V1.REC) {
        continue;
      }

      reconciledMutable[cat] = (reconciledMutable[cat] || 0) + c * weight * (isPrimary ? 1.15 : 0.85);
    }
  }

  const reconciledShares = Object.freeze({ ...reconciledMutable });

  const reconciliation = Object.freeze({
    schema: CROSS_SPACE_REC_SCHEMA_V0,
    globalEpochId,
    globalEpochSeq: globalEpochSeqV0,
    primarySpaceId,
    baselineSpaceId: CAUSAL_SPACE_ID_V0.CHESS,
    overlaySpaceId: ARENA_SPACE_OVERLAY_V0,
    arbitrationReason: selection.arbitrationReason,
    sliceReports: Object.freeze(sliceReports),
    reconciledShares: Object.freeze({ ...reconciledShares }),
    interference: Object.freeze(interference.slice(0, 32)),
    interferenceCount: interference.length,
    spaceBlindLeakagePrevented: interference.some(
      (row) => row.kind === INTERFERENCE_KIND_V0.REC_CATEGORY_BLEED
    ),
    realitiesAlternate: selection.primarySpaceId !== CAUSAL_SPACE_ID_V0.SPORTS,
    realitiesInteract: interference.length > 0,
    atMs,
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true
  });

  lastReconciliationV0 = reconciliation;
  reconciliationLogV0.unshift(reconciliation);
  if (reconciliationLogV0.length > 32) reconciliationLogV0.length = 32;

  if (typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(CROSS_SPACE_REC_EVENT_V0, { detail: reconciliation }));
  }

  return reconciliation;
}

export function getCrossSpaceRecSnapshotV0() {
  return Object.freeze({
    schema: `${CROSS_SPACE_REC_SCHEMA_V0}.snapshot`,
    globalEpochSeq: globalEpochSeqV0,
    lastReconciliation: lastReconciliationV0,
    spaceSlices: Object.freeze([...spaceRecSlicesV0.values()]),
    recentInterference: Object.freeze(interferenceLogV0.slice(0, 16)),
    recentReconciliations: Object.freeze(reconciliationLogV0.slice(0, 8)),
    diagnosis: Object.freeze({
      memoryFragmentation: spaceRecSlicesV0.size > 1 && !lastReconciliationV0,
      spaceTagged: spaceRecSlicesV0.size > 0,
      unifiedEpoch: Boolean(lastReconciliationV0?.globalEpochId)
    }),
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function buildCrossSpaceRecReportV0() {
  return Object.freeze({
    schema: `${CROSS_SPACE_REC_SCHEMA_V0}.report`,
    note: "Space-tagged REC slices + semantic interference — realities interact without blind merge",
    snapshot: getCrossSpaceRecSnapshotV0(),
    apis: Object.freeze({
      snapshot: "window.__rhizoh.crossSpaceRec()",
      reconcile: "window.__rhizoh.reconcileCrossSpaceRec()",
      ingest: "window.__rhizoh.ingestSpaceDriftSignal()"
    }),
    atMs: Date.now()
  });
}

export function ensureCrossSpaceRecV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (!window.__rhizoh.crossSpaceRec) {
    window.__rhizoh.crossSpaceRec = () => getCrossSpaceRecSnapshotV0();
  }
  if (!window.__rhizoh.crossSpaceRecReport) {
    window.__rhizoh.crossSpaceRecReport = () => buildCrossSpaceRecReportV0();
  }
  if (!window.__rhizoh.reconcileCrossSpaceRec) {
    window.__rhizoh.reconcileCrossSpaceRec = (opts) => reconcileCrossSpaceRecV0(opts);
  }
  if (!window.__rhizoh.ingestSpaceDriftSignal) {
    window.__rhizoh.ingestSpaceDriftSignal = (input) => ingestSpaceDriftSignalV0(input);
  }
  return window.__rhizoh.crossSpaceRec;
}

/** @internal vitest */
export function resetCrossSpaceRecForTestV0() {
  spaceRecSlicesV0.clear();
  interferenceLogV0.length = 0;
  reconciliationLogV0.length = 0;
  globalEpochSeqV0 = 0;
  lastReconciliationV0 = null;
}
