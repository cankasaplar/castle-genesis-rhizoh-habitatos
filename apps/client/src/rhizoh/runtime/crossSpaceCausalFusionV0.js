/**
 * Cross-Space Causal Fusion v0 — unified epistemic update from multi-space lanes.
 * chess drift + sports entropy + CUX perception → single fused observation.
 * Fuses only — never mutates execution or CubeState.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_CROSS_SPACE_CAUSAL_FUSION_V0.md
 */

import { MUTATION_REASON_CATEGORY_V1 } from "../ticket/mutationReasonCodeOntologyV1.js";
import {
  CROSS_SPACE_REC_EVENT_V0,
  getCrossSpaceRecSnapshotV0,
  reconcileCrossSpaceRecV0
} from "./crossSpaceRecReconciliationV0.js";
import {
  ARENA_SPACE_OVERLAY_V0,
  selectActiveArenaFrameV0
} from "./multiArenaSchedulerV0.js";
import { CAUSAL_SPACE_ID_V0 } from "./sportsCausalSpaceV0.js";
import { RHIZOH_DRIFT_CUBE_EVENT_V0 } from "./rhizohGeometryDriftCubeV0.js";
import {
  decayResourceBudgetsV0,
  guardFusionAdmissionV0,
  releaseResourceSlotV0,
  scoreFusionReliabilityV0
} from "./crossSpaceResourceContentionGuardV0.js";

export const CROSS_SPACE_CAUSAL_FUSION_SCHEMA_V0 = "castle.rhizoh.cross_space_causal_fusion.v0";
export const CROSS_SPACE_FUSION_EVENT_V0 = "rhizoh:cross-space-fusion-v0";

export const FUSION_LANE_V0 = Object.freeze({
  CHESS_DRIFT: "chess_drift",
  SPORTS_ENTROPY: "sports_entropy",
  CUX_PERCEPTION: "cux_perception",
  CALENDAR_CONTINUITY: "calendar_continuity"
});

/** @type {object | null} */
let chessLaneV0 = null;
/** @type {object | null} */
let sportsLaneV0 = null;
/** @type {object | null} */
let cuxLaneV0 = null;
/** @type {object | null} */
let calendarLaneV0 = null;

let fusionSeqV0 = 0;
/** @type {object | null} */
let lastFusionV0 = null;

/** @type {object[]} */
const fusionLogV0 = [];

function emptySharesV0() {
  return Object.freeze({
    [MUTATION_REASON_CATEGORY_V1.SC]: 0,
    [MUTATION_REASON_CATEGORY_V1.REC]: 0,
    [MUTATION_REASON_CATEGORY_V1.QUOTA]: 0,
    [MUTATION_REASON_CATEGORY_V1.SIG]: 0,
    [MUTATION_REASON_CATEGORY_V1.ENTROPY_DRIFT]: 0,
    PERCEPTION: 0
  });
}

function normalizeSharesV0(raw) {
  const base = { ...emptySharesV0() };
  for (const [k, v] of Object.entries(raw || {})) {
    if (Object.prototype.hasOwnProperty.call(base, k)) {
      base[k] = Math.max(0, Number(v) || 0);
    }
  }
  return Object.freeze(base);
}

function weightSharesV0(shares, weight) {
  const w = Math.max(0, Number(weight) || 0);
  return Object.freeze(
    Object.fromEntries(Object.entries(shares).map(([k, v]) => [k, (Number(v) || 0) * w]))
  );
}

function mergeSharesV0(...parts) {
  const out = { ...emptySharesV0() };
  for (const part of parts) {
    for (const [k, v] of Object.entries(part || {})) {
      if (Object.prototype.hasOwnProperty.call(out, k)) {
        out[k] = (out[k] || 0) + (Number(v) || 0);
      }
    }
  }
  return Object.freeze(out);
}

/**
 * Chess geometry / deterministic drift lane.
 * @param {{ z?: number, category?: string, strength?: number, matchId?: string, source?: string }} input
 */
export function ingestChessDriftLaneV0(input = {}) {
  const z = Math.max(0, Math.min(1, Number(input.z) || Number(input.strength) || 0));
  const category = String(input.category || MUTATION_REASON_CATEGORY_V1.SC);
  const shares = normalizeSharesV0({
    [category]: z,
    [MUTATION_REASON_CATEGORY_V1.REC]: z * 0.35
  });

  chessLaneV0 = Object.freeze({
    lane: FUSION_LANE_V0.CHESS_DRIFT,
    spaceId: CAUSAL_SPACE_ID_V0.CHESS,
    shares,
    z,
    matchId: input.matchId || null,
    source: String(input.source || "geometry_drift"),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });

  return chessLaneV0;
}

/**
 * Sports stochastic entropy lane.
 * @param {{ entropy01?: number, categoryShares?: Record<string, number>, matchId?: string }} input
 */
export function ingestSportsEntropyLaneV0(input = {}) {
  const entropy01 = Math.max(0, Math.min(1, Number(input.entropy01) || 0));
  const fromCounts = input.categoryShares || {};
  const shares = normalizeSharesV0({
    [MUTATION_REASON_CATEGORY_V1.ENTROPY_DRIFT]: entropy01 || Number(fromCounts.ENTROPY_DRIFT) || 0,
    [MUTATION_REASON_CATEGORY_V1.REC]: Number(fromCounts.REC) || 0,
    [MUTATION_REASON_CATEGORY_V1.SC]: Number(fromCounts.SC) || 0,
    [MUTATION_REASON_CATEGORY_V1.QUOTA]: Number(fromCounts.QUOTA) || 0
  });

  sportsLaneV0 = Object.freeze({
    lane: FUSION_LANE_V0.SPORTS_ENTROPY,
    spaceId: CAUSAL_SPACE_ID_V0.SPORTS,
    shares,
    entropy01,
    matchId: input.matchId || null,
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });

  return sportsLaneV0;
}

/**
 * CUX perception overlay lane (binding densities — not execution).
 * @param {{ categoryShares?: Record<string, number>, activeSpace?: string, perception01?: number }} input
 */
export function ingestCuxPerceptionLaneV0(input = {}) {
  const perception01 = Math.max(0, Math.min(1, Number(input.perception01) || 0.5));
  const raw = input.categoryShares || {};
  const shares = normalizeSharesV0({
    [MUTATION_REASON_CATEGORY_V1.SC]: Number(raw.SC) || 0,
    [MUTATION_REASON_CATEGORY_V1.REC]: Number(raw.REC) || 0,
    [MUTATION_REASON_CATEGORY_V1.QUOTA]: Number(raw.QUOTA) || 0,
    [MUTATION_REASON_CATEGORY_V1.ENTROPY_DRIFT]: Number(raw.ENTROPY_DRIFT) || 0,
    PERCEPTION: perception01
  });

  cuxLaneV0 = Object.freeze({
    lane: FUSION_LANE_V0.CUX_PERCEPTION,
    spaceId: ARENA_SPACE_OVERLAY_V0,
    activeSpace: String(input.activeSpace || CAUSAL_SPACE_ID_V0.CHESS),
    shares,
    perception01,
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });

  return cuxLaneV0;
}

/**
 * Calendar continuity lane — maps to Fox continuity/novelty (no new axis).
 * @param {{ eventId?: string, eventType?: string, foxSignals?: object, continuitySignal01?: number, source?: string }} input
 */
export function ingestCalendarContinuityLaneV0(input = {}) {
  const fox = input.foxSignals || {};
  const continuity01 = Math.max(
    0,
    Math.min(1, Number(input.continuitySignal01) || Number(fox.continuitySignal01) || 0.5)
  );
  const novelty01 = Math.max(0, Math.min(1, Number(fox.noveltySignal01) || 0.2));
  const shares = normalizeSharesV0({
    [MUTATION_REASON_CATEGORY_V1.SC]: continuity01 * 0.6,
    [MUTATION_REASON_CATEGORY_V1.REC]: novelty01 * 0.5,
    PERCEPTION: Number(fox.worldSignal01) || 0.15
  });

  calendarLaneV0 = Object.freeze({
    lane: FUSION_LANE_V0.CALENDAR_CONTINUITY,
    spaceId: "calendar.continuity.space",
    eventId: input.eventId || null,
    eventType: input.eventType || null,
    foxSignals: Object.freeze({ ...fox }),
    shares,
    continuitySignal01: continuity01,
    source: String(input.source || "calendar_ingress"),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });

  return calendarLaneV0;
}

/**
 * Hydrate sports lane from REC slice if not explicitly ingested.
 */
function hydrateSportsLaneFromRecV0(recSnap) {
  const sportsSlice = recSnap?.spaceSlices?.find((s) => s.spaceId === CAUSAL_SPACE_ID_V0.SPORTS);
  if (!sportsSlice?.categoryTotals) return sportsLaneV0;
  const totals = sportsSlice.categoryTotals;
  const entropy =
    Number(totals.ENTROPY_DRIFT) ||
    Number(totals.REC) * 0.2 ||
    0;
  return ingestSportsEntropyLaneV0({
    entropy01: Math.min(1, entropy / 3),
    categoryShares: totals
  });
}

/**
 * Immutable lane audit — separability preserved for debugging.
 */
function buildLaneAuditV0() {
  return Object.freeze({
    separabilityPreserved: true,
    chess: Object.freeze({
      present: Boolean(chessLaneV0),
      raw: chessLaneV0,
      spaceId: CAUSAL_SPACE_ID_V0.CHESS
    }),
    sports: Object.freeze({
      present: Boolean(sportsLaneV0),
      raw: sportsLaneV0,
      spaceId: CAUSAL_SPACE_ID_V0.SPORTS
    }),
    cux: Object.freeze({
      present: Boolean(cuxLaneV0),
      raw: cuxLaneV0,
      spaceId: ARENA_SPACE_OVERLAY_V0
    }),
    calendar: Object.freeze({
      present: Boolean(calendarLaneV0),
      raw: calendarLaneV0,
      spaceId: "calendar.continuity.space"
    })
  });
}

export function getCrossSpaceFusionLaneAuditV0() {
  return buildLaneAuditV0();
}

/**
 * Fuse lanes into unified epistemic update.
 * @param {{ recReconciliation?: object, schedulerSelection?: object, atMs?: number, force?: boolean, phaseLock?: boolean, suppressEvent?: boolean }} [opts]
 */
export function fuseCrossSpaceEpistemicV0(opts = {}) {
  const atMs = Number(opts.atMs) || Date.now();
  const guard = guardFusionAdmissionV0({ atMs, force: opts.force, phaseLock: opts.phaseLock });
  const laneAudit = buildLaneAuditV0();

  if (!guard.admitted) {
    return Object.freeze({
      schema: `${CROSS_SPACE_CAUSAL_FUSION_SCHEMA_V0}.deferred`,
      deferred: true,
      reason: guard.reason,
      guard,
      laneAudit,
      fusionReliability: scoreFusionReliabilityV0({ laneAudit, guard }),
      atMs,
      interpretationOnly: true,
      nonExecutive: true
    });
  }

  decayResourceBudgetsV0(0.92);
  const selection = opts.schedulerSelection || selectActiveArenaFrameV0(atMs);
  const recSnap = getCrossSpaceRecSnapshotV0();
  const rec =
    opts.recReconciliation ||
    recSnap.lastReconciliation ||
    reconcileCrossSpaceRecV0({ selection, atMs });

  if (!sportsLaneV0) {
    hydrateSportsLaneFromRecV0(recSnap);
  }

  const primarySpaceId = selection.primarySpaceId || CAUSAL_SPACE_ID_V0.CHESS;
  const chessWeight = primarySpaceId === CAUSAL_SPACE_ID_V0.CHESS ? 0.55 : 0.35;
  const sportsWeight = primarySpaceId === CAUSAL_SPACE_ID_V0.SPORTS ? 0.4 : 0.25;
  const cuxWeight = 0.12;

  const chessShares = weightSharesV0(chessLaneV0?.shares || emptySharesV0(), chessWeight);
  const sportsShares = weightSharesV0(sportsLaneV0?.shares || emptySharesV0(), sportsWeight);
  const cuxShares = weightSharesV0(cuxLaneV0?.shares || emptySharesV0(), cuxWeight);

  const fusedShares = mergeSharesV0(chessShares, sportsShares, cuxShares);

  const crossCouplings = (rec.interference || []).map((row) =>
    Object.freeze({
      fromSpace: row.fromSpace,
      toSpace: row.toSpace,
      category: row.category,
      strength: row.strength,
      kind: row.kind,
      fusedIntoUpdate: row.kind !== "rec_category_bleed"
    })
  );

  const signalCount =
    (chessLaneV0 ? 1 : 0) + (sportsLaneV0 ? 1 : 0) + (cuxLaneV0 ? 1 : 0) + (rec.interferenceCount || 0);
  const confidence01 = Math.min(1, signalCount / 5);

  fusionSeqV0 += 1;

  const epistemicUpdate = Object.freeze({
    schema: `${CROSS_SPACE_CAUSAL_FUSION_SCHEMA_V0}.update`,
    updateKind: "unified_epistemic_observation",
    fusedShares,
    laneContributions: Object.freeze({
      chess: Object.freeze({
        lane: FUSION_LANE_V0.CHESS_DRIFT,
        weight: chessWeight,
        shares: chessShares,
        present: Boolean(chessLaneV0),
        rawShares: chessLaneV0?.shares || emptySharesV0()
      }),
      sports: Object.freeze({
        lane: FUSION_LANE_V0.SPORTS_ENTROPY,
        weight: sportsWeight,
        shares: sportsShares,
        present: Boolean(sportsLaneV0),
        rawShares: sportsLaneV0?.shares || emptySharesV0()
      }),
      cux: Object.freeze({
        lane: FUSION_LANE_V0.CUX_PERCEPTION,
        weight: cuxWeight,
        shares: cuxShares,
        present: Boolean(cuxLaneV0),
        rawShares: cuxLaneV0?.shares || emptySharesV0()
      })
    }),
    crossCouplings,
    confidence01,
    realitiesIntegrated: crossCouplings.length > 0 || Boolean(sportsLaneV0 && chessLaneV0),
    cubeStateCommit: false,
    interpretationOnly: true,
    nonExecutive: true
  });

  const fusionReliability = scoreFusionReliabilityV0({ epistemicUpdate, laneAudit, guard });

  const fusion = Object.freeze({
    schema: CROSS_SPACE_CAUSAL_FUSION_SCHEMA_V0,
    fusionId: `fusion_${fusionSeqV0}_${primarySpaceId.replace(/\./g, "_")}`,
    fusionSeq: fusionSeqV0,
    primarySpaceId,
    recGlobalEpochId: rec.globalEpochId,
    arbitrationReason: selection.arbitrationReason,
    lanes: Object.freeze({
      chess: chessLaneV0,
      sports: sportsLaneV0,
      cux: cuxLaneV0,
      calendar: calendarLaneV0
    }),
    laneAudit,
    guard,
    fusionReliability,
    epistemicUpdate,
    atMs,
    interpretationOnly: true,
    nonExecutive: true,
    orchestratesOnly: true
  });

  lastFusionV0 = fusion;
  fusionLogV0.unshift(fusion);
  if (fusionLogV0.length > 32) fusionLogV0.length = 32;

  if (!opts.suppressEvent && typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(CROSS_SPACE_FUSION_EVENT_V0, { detail: fusion }));
  }

  releaseResourceSlotV0({ lane: "fusion", cost: 0.03 });
  return fusion;
}

export function getCrossSpaceFusionSnapshotV0() {
  return Object.freeze({
    schema: `${CROSS_SPACE_CAUSAL_FUSION_SCHEMA_V0}.snapshot`,
    fusionSeq: fusionSeqV0,
    lastFusion: lastFusionV0,
    lanes: Object.freeze({
      chess: chessLaneV0,
      sports: sportsLaneV0,
      cux: cuxLaneV0,
      calendar: calendarLaneV0
    }),
    recentFusions: Object.freeze(fusionLogV0.slice(0, 8)),
    diagnosis: Object.freeze({
      selectionWithoutIntegration: Boolean(lastFusionV0) && !lastFusionV0.epistemicUpdate.realitiesIntegrated,
      unifiedEpistemicUpdate: Boolean(lastFusionV0?.epistemicUpdate)
    }),
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function buildCrossSpaceFusionReportV0() {
  return Object.freeze({
    schema: `${CROSS_SPACE_CAUSAL_FUSION_SCHEMA_V0}.report`,
    note: "Cross-space causal fusion — chess drift + sports entropy + CUX perception → unified epistemic update",
    snapshot: getCrossSpaceFusionSnapshotV0(),
    apis: Object.freeze({
      snapshot: "window.__rhizoh.crossSpaceFusion()",
      fuse: "window.__rhizoh.fuseCrossSpaceEpistemic()",
      ingestChess: "window.__rhizoh.ingestChessDriftLane()",
      ingestSports: "window.__rhizoh.ingestSportsEntropyLane()",
      ingestCux: "window.__rhizoh.ingestCuxPerceptionLane()"
    }),
    atMs: Date.now()
  });
}

export function ensureCrossSpaceCausalFusionV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.crossSpaceFusion) {
    window.__rhizoh.crossSpaceFusion = () => getCrossSpaceFusionSnapshotV0();
  }
  if (!window.__rhizoh.crossSpaceFusionReport) {
    window.__rhizoh.crossSpaceFusionReport = () => buildCrossSpaceFusionReportV0();
  }
  // Fusion lane surface APIs — bound by rhizohRuntimeSurfaceBinderV0 (post ontological gate).
  // Fallback for vitest paths that skip mountCastleApplicationV0:
  if (!window.__rhizoh.fuseCrossSpaceEpistemic) {
    window.__rhizoh.fuseCrossSpaceEpistemic = (opts) => fuseCrossSpaceEpistemicV0(opts);
  }
  if (!window.__rhizoh.ingestChessDriftLane) {
    window.__rhizoh.ingestChessDriftLane = (input) => ingestChessDriftLaneV0(input);
  }
  if (!window.__rhizoh.ingestSportsEntropyLane) {
    window.__rhizoh.ingestSportsEntropyLane = (input) => ingestSportsEntropyLaneV0(input);
  }
  if (!window.__rhizoh.ingestCuxPerceptionLane) {
    window.__rhizoh.ingestCuxPerceptionLane = (input) => ingestCuxPerceptionLaneV0(input);
  }

  if (!window.__rhizoh.__crossSpaceFusionWired) {
    window.__rhizoh.__crossSpaceFusionWired = true;

    window.addEventListener(CROSS_SPACE_REC_EVENT_V0, (ev) => {
      const rec = ev?.detail;
      if (rec?.sliceReports?.[CAUSAL_SPACE_ID_V0.SPORTS]) {
        const totals = recSnapTotalsFromSliceV0(rec);
        ingestSportsEntropyLaneV0({ categoryShares: totals });
      }
      fuseCrossSpaceEpistemicV0({ recReconciliation: rec, atMs: rec?.atMs });
    });

    window.addEventListener(RHIZOH_DRIFT_CUBE_EVENT_V0, (ev) => {
      const point = ev?.detail;
      if (!point) return;
      ingestChessDriftLaneV0({
        z: point.z,
        matchId: point.matchId,
        source: "geometry_drift_cube",
        category:
          point.drift?.familyMatch === false
            ? MUTATION_REASON_CATEGORY_V1.REC
            : MUTATION_REASON_CATEGORY_V1.SC
      });
      fuseCrossSpaceEpistemicV0();
    });
  }

  return window.__rhizoh.crossSpaceFusion;
}

/**
 * @param {object} rec
 */
function recSnapTotalsFromSliceV0(rec) {
  const sports = rec?.sliceReports?.[CAUSAL_SPACE_ID_V0.SPORTS];
  if (!sports?.nativeShares) return {};
  return sports.nativeShares;
}

/** @internal vitest */
export function resetCrossSpaceCausalFusionForTestV0() {
  chessLaneV0 = null;
  sportsLaneV0 = null;
  cuxLaneV0 = null;
  calendarLaneV0 = null;
  fusionSeqV0 = 0;
  lastFusionV0 = null;
  fusionLogV0.length = 0;
}
